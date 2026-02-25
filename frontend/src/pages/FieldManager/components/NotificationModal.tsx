import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { notificationsAPI } from '../../../services/api';
import { Loader2 } from 'lucide-react';

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
}

interface Notification {
  id: number;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export function NotificationModal({ open, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadNotifications();
      // Refresh notifications every 5 seconds when modal is open
      const interval = setInterval(loadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.list({ limit: 50 });
      const data: Notification[] = response.data || [];
      setNotifications(data);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationsAPI.markRead([notification.id]);
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#1F2937]">Notifications</DialogTitle>
        </DialogHeader>
        <div className="max-h-[500px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#1F2937] mb-1">
                        {notification.title}
                      </h4>
                      {notification.body && (
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

