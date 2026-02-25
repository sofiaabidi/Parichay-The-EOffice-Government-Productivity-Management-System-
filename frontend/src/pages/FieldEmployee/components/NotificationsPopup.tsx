import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from './ui/button';

interface NotificationsPopupProps {
  onClose: () => void;
}

export default function NotificationsPopup({ onClose }: NotificationsPopupProps) {
  const notifications = [
    {
      id: 1,
      type: 'urgent',
      icon: AlertCircle,
      title: 'DPR Submission Due',
      message: 'Infrastructure Development - Zone A DPR is due in 2 days',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'success',
      icon: CheckCircle,
      title: 'Survey Approved',
      message: 'Your Agricultural Land Survey - Block 5 has been approved',
      time: '5 hours ago',
    },
    {
      id: 3,
      type: 'info',
      icon: Info,
      title: 'New Task Assigned',
      message: 'Road Width Verification task assigned by Manager',
      time: '1 day ago',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      ></div>

      {/* Notifications Popup */}
      <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg w-96 z-50">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-[#1C1C28]">Notifications</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
            <X className="size-4" />
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex gap-3">
                  <div
                    className={`mt-1 ${
                      notification.type === 'urgent'
                        ? 'text-red-500'
                        : notification.type === 'success'
                        ? 'text-green-500'
                        : 'text-blue-500'
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[#1C1C28] mb-1">{notification.title}</div>
                    <div className="text-[#6B6B6B] text-sm mb-1">{notification.message}</div>
                    <div className="text-[#9CA3AF] text-xs">{notification.time}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 text-center border-t">
          <button className="text-blue-600 text-sm hover:underline">
            View All Notifications
          </button>
        </div>
      </div>
    </>
  );
}
