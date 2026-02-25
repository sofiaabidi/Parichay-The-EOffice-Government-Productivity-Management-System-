import { useState } from 'react';
import { Bell, Edit3 } from 'lucide-react';
import { NotificationsPopup } from './NotificationsPopup';
import { useAuth } from "../../../contexts/AuthContext"; // ← IMPORTANT

interface HeaderProps {
  onFeedbackClick: () => void;
}

export function Header({ onFeedbackClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const { logout } = useAuth();   // ← REAL LOGOUT FUNCTION

  const userName = "Rohan Sharma";
  const initials = userName.split(' ').map(n => n[0]).join('');

  return (
    <>
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Logo + Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <div>
                <h1 className="text-gray-900 tracking-tight">
                  Field Organisation Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Real-time staffing, field operations, and workload insights
                </p>
              </div>
            </div>

            {/* Right-Side Buttons */}
            <div className="flex items-center gap-3">

              {/* Feedback */}
              <button
                onClick={onFeedbackClick}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Edit3 className="w-5 h-5 text-gray-600" />
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Logout Button (REAL LOGOUT) */}
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow"
              >
                Logout
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-3 ml-3 border-l border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">{initials}</span>
                </div>
                <span className="text-gray-900">{userName}</span>
              </div>

            </div>
          </div>
        </div>
      </header>

      {showNotifications && (
        <NotificationsPopup onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}

