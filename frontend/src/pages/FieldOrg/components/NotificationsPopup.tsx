import { X, AlertCircle, CheckCircle, Info, TrendingUp } from 'lucide-react';

interface NotificationsPopupProps {
  onClose: () => void;
}

const notifications = [
  {
    id: 1,
    type: 'warning',
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Workload Alert',
    message: 'Field Team Alpha may experience workload pressure next month',
    time: '5 minutes ago',
  },
  {
    id: 2,
    type: 'info',
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'Productivity Update',
    message: 'Productivity dip detected in 3 field staff members',
    time: '1 hour ago',
  },
  {
    id: 3,
    type: 'success',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Project Completed',
    message: 'Highway Survey Project - Phase 2 completed successfully',
    time: '2 hours ago',
  },
  {
    id: 4,
    type: 'warning',
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    title: 'Staffing Shortage',
    message: 'Survey & Documentation unit likely to face staffing shortage',
    time: '4 hours ago',
  },
  {
    id: 5,
    type: 'info',
    icon: Info,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    title: 'Training Reminder',
    message: 'Monthly safety training scheduled for next week',
    time: '1 day ago',
  },
];

export function NotificationsPopup({ onClose }: NotificationsPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-6">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className={`${notification.bg} ${notification.color} p-2 rounded-xl h-fit`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 mb-1">{notification.title}</div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-700">
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );
}
