import { Bell, LogOut, PenSquare } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../../../contexts/AuthContext';

interface HeaderProps {
  onNotificationClick: () => void;
  onLogout: () => void;
  onFeedbackClick: () => void;
}

export function Header({ onNotificationClick, onLogout, onFeedbackClick }: HeaderProps) {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };
  
  const displayName = user?.name || 'HQ Organization User';

  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-gray-900">HQ Organisation Dashboard</h1>
              <p className="text-gray-600 text-sm mt-0.5">Real-time staffing, performance and workload insights</p>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl hover:bg-gray-100/80"
              onClick={onNotificationClick}
            >
              <Bell className="size-5 text-gray-700" />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-gray-100/80"
              onClick={onFeedbackClick}
              title="Submit Feedback"
            >
              <PenSquare className="size-4 text-gray-700" />
            </Button>
            
            {/* Profile Section */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <span className="text-sm font-semibold">{getInitials(displayName)}</span>
              </div>
              <span className="text-gray-900 font-medium">{displayName}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-gray-100/80"
              onClick={onLogout}
            >
              <LogOut className="size-5 text-gray-700" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}