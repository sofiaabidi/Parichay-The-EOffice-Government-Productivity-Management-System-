import { useState, useEffect } from 'react';
import { Calendar, LogOut, Pencil, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { CalendarModal } from './CalendarModal';
import { EmployeeFeedbackDialog } from './EmployeeFeedbackDialog';
import { NotificationModal } from './NotificationModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../../services/api';

interface TopNavBarProps {
  totalTime: string;
  isCheckedIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onFeedbackAdded?: () => void;
}

export function TopNavBar({ totalTime, isCheckedIn, onCheckIn, onCheckOut, onFeedbackAdded }: TopNavBarProps) {

  const [showCalendar, setShowCalendar] = useState(false);
  const [showEmployeeFeedback, setShowEmployeeFeedback] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [time, setTime] = useState('00:00');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ⭐ ADD AUTH + NAVIGATION
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format role for display
  const getRoleDisplay = (role: string) => {
    if (!role) return 'Field Manager';
    return role.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format user ID for display
  const getUserIdDisplay = (id: number, role: string) => {
    if (!id) return 'ID: N/A';
    const rolePrefix = role === 'FIELD_MANAGER' ? 'FM' : role === 'FIELD_EMPLOYEE' ? 'FE' : 'U';
    return `ID: ${rolePrefix}-${id}`;
  };

  const handleLogout = () => {
    logout();            // clear user + token
    localStorage.clear();// clear remembered user
    navigate("/");       // redirect to login
  };

  // Load notifications and update unread count
  useEffect(() => {
    if (!user?.id) return;
    
    const loadNotifications = async () => {
      try {
        const response = await notificationsAPI.list({ unreadOnly: true, limit: 100 });
        const unreadNotifications = response.data || [];
        setUnreadCount(unreadNotifications.length);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
    // Refresh notifications every 15 seconds
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Refresh notifications when modal opens
  useEffect(() => {
    if (showNotifications && user?.id) {
      const loadNotifications = async () => {
        try {
          const response = await notificationsAPI.list({ unreadOnly: true, limit: 100 });
          const unreadNotifications = response.data || [];
          setUnreadCount(unreadNotifications.length);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      };
      loadNotifications();
    }
  }, [showNotifications, user?.id]);

  useEffect(() => {
    if (!isCheckedIn) {
      setStartTime(null);
      setTime('00:00');
      return;
    }

    setStartTime(Date.now());
    const interval = setInterval(() => {
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        setTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCheckedIn, startTime]);

  return (
    <>
      <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#1F2937" />
                <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" stroke="white" strokeWidth="2" />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
              <h1 className="text-[#1F2937]">Field Manager Dashboard</h1>
            </div>

            {/* Center */}
            <div className="flex items-center gap-4">
              {!isCheckedIn ? (
                <Button 
                  onClick={onCheckIn}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                >
                  Check In
                </Button>
              ) : (
                <Button 
                  onClick={onCheckOut}
                  className="bg-black hover:bg-gray-800 text-white rounded-full px-6"
                >
                  Check Out
                </Button>
              )}

              <span className="text-[#1F2937]">Total Time: {time} hrs</span>

              {/* Employee Feedback (Pencil Icon) */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowEmployeeFeedback(true)}
                className="text-[#1F2937]"
              >
                <Pencil className="w-5 h-5" />
              </Button>

              {/* Notification Icon */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNotifications(true)}
                className="text-[#1F2937] relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowCalendar(true)}
                className="text-[#1F2937]"
              >
                <Calendar className="w-5 h-5" />
              </Button>
            </div>

            {/* Right - Profile + ⭐ LOGOUT */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[#1F2937]">{user?.name || 'User'}</p>
                <p className="text-gray-500 text-sm">{getRoleDisplay(user?.role || 'FIELD_MANAGER')}</p>
                <p className="text-gray-500 text-sm">{getUserIdDisplay(user?.id || 0, user?.role || 'FIELD_MANAGER')}</p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-[#1F2937]">{user ? getUserInitials(user.name) : 'U'}</span>
              </div>

              {/* ⭐ LOGOUT BUTTON WITH LOGIC ADDED */}
              <Button
                variant="ghost"
                size="icon"
                className="text-[#1F2937]"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <CalendarModal open={showCalendar} onClose={() => setShowCalendar(false)} />
      <EmployeeFeedbackDialog
        open={showEmployeeFeedback}
        onOpenChange={setShowEmployeeFeedback}
        onFeedbackAdded={onFeedbackAdded}
      />
      <NotificationModal open={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}

