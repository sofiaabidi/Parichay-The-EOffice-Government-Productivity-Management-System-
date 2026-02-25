import { useState, useEffect } from 'react';
import { Clock, Calendar, Bell, LogOut, Pencil } from 'lucide-react';
import { Button } from './ui/button';
import CalendarPopup from './CalendarPopup';
import NotificationsPopup from './NotificationsPopup';
import ProfilePopup from './ProfilePopup';
import { PeerFeedbackDialog } from './PeerFeedbackDialog';
import { useAuth } from "../../../contexts/AuthContext";   // ⭐ ADD THIS
import { useNavigate } from "react-router-dom";            // ⭐ ADD THIS

interface TopNavBarProps {
  isCheckedIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  totalHours: number | null;
  onFeedbackAdded?: () => void;
  isCheckingIn?: boolean;
  isCheckingOut?: boolean;
}

export default function TopNavBar({ isCheckedIn, onCheckIn, onCheckOut, totalHours, onFeedbackAdded, isCheckingIn = false, isCheckingOut = false }: TopNavBarProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPeerFeedback, setShowPeerFeedback] = useState(false);

  const { user, logout } = useAuth();       // ⭐ GET USER AND LOGOUT FROM CONTEXT
  const navigate = useNavigate();     // ⭐ NAVIGATE TO LOGIN PAGE

  // ⭐ FINAL LOGOUT FUNCTION
  const handleLogout = () => {
    logout();            
    localStorage.clear();
    navigate("/");       // 🔥 redirect to login immediately
  };

  // Generate avatar initials from user's name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format employee ID
  const formatEmployeeId = (userId: number) => {
    return `EMP2025-${String(userId).padStart(4, '0')}`;
  };

  // Get role/designation display text
  const getRoleDisplay = () => {
    if (user?.designation) {
      return user.designation;
    }
    // Format role for display
    if (user?.role === 'FIELD_EMPLOYEE') {
      return 'Field Engineer';
    }
    return user?.role?.replace('_', ' ') || 'Employee';
  };

  return (
    <div className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left Section */}
          <div className="flex-1">
            <h1 className="text-[#1C1C28] mb-1">Field Employee Dashboard</h1>
            <p className="text-[#6B6B6B]">Track your performance, field visits, and project progress</p>
          </div>

          {/* Center Section */}
          <div className="flex items-center gap-3">
            {!isCheckedIn ? (
              <Button
                onClick={onCheckIn}
                disabled={isCheckingIn}
                className="bg-[#E6F9EC] text-green-600 border border-green-600 hover:bg-[#d4f4df] rounded-full px-6"
              >
                <Clock className="size-4 mr-2" /> {isCheckingIn ? "Checking In..." : "Check In"}
              </Button>
            ) : (
              <Button
                onClick={onCheckOut}
                disabled={isCheckingOut}
                className="bg-[#FDE8E8] text-red-600 border border-red-600 hover:bg-[#fcd6d6] rounded-full px-6"
              >
                <Clock className="size-4 mr-2" /> {isCheckingOut ? "Checking Out..." : "Check Out"}
              </Button>
            )}

            {totalHours !== null && totalHours > 0 && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <span className="text-blue-700">Total Hours: {totalHours.toFixed(2)} hrs</span>
              </div>
            )}

            <div className="h-8 w-px bg-gray-200"></div>

            {/* Peer Feedback (Pencil Icon) */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setShowPeerFeedback(true)}
            >
              <Pencil className="size-5 text-gray-600" />
            </Button>

            {/* Calendar */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <Calendar className="size-5 text-gray-600" />
              </Button>
              {showCalendar && <CalendarPopup onClose={() => setShowCalendar(false)} />}
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="size-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center">
                  3
                </span>
              </Button>
              {showNotifications && <NotificationsPopup onClose={() => setShowNotifications(false)} />}
            </div>

            {/* ⭐ LOGOUT BUTTON - NOW WORKING */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleLogout}
            >
              <LogOut className="size-5 text-gray-600" />
            </Button>
          </div>

          {/* Right Section */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="text-right">
              <div className="text-[#1C1C28]">{user?.name || 'User'}</div>
              <div className="text-[#6B6B6B] text-sm">{getRoleDisplay()}</div>
              <div className="text-[#6B6B6B] text-sm">ID: {user?.id ? formatEmployeeId(user.id) : 'N/A'}</div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="size-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1d4ed8] transition-colors"
              >
                {user?.name ? getInitials(user.name) : 'U'}
              </button>
              {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} />}
            </div>
          </div>

        </div>
      </div>

      {/* Peer Feedback Dialog */}
      <PeerFeedbackDialog
        open={showPeerFeedback}
        onOpenChange={setShowPeerFeedback}
        onFeedbackAdded={onFeedbackAdded}
      />
    </div>
  );
}
