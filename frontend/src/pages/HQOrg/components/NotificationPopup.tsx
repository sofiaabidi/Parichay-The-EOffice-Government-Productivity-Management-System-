import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';


interface NotificationPopupProps {
  open: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: 1,
    type: 'success',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    title: 'Report Generated',
    message: 'Monthly performance report has been successfully generated.',
    time: '2 minutes ago'
  },
  {
    id: 2,
    type: 'warning',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    title: 'Staffing Alert',
    message: 'Marketing department requires 2 additional team members.',
    time: '15 minutes ago'
  },
  {
    id: 3,
    type: 'info',
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    title: 'System Update',
    message: 'Dashboard will undergo maintenance tonight at 10 PM.',
    time: '1 hour ago'
  },
  {
    id: 4,
    type: 'success',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    title: 'Project Milestone',
    message: 'Cloud Migration Initiative reached 65% completion.',
    time: '2 hours ago'
  },
  {
    id: 5,
    type: 'warning',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    title: 'Performance Alert',
    message: 'Productivity anomaly detected in Week 6 data.',
    time: '3 hours ago'
  }
];

export function NotificationPopup({ open, onClose }: NotificationPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Bell className="size-5 text-white" />
            </div>
            <span>Notifications</span>
            <span className="ml-auto text-sm text-gray-500">
              {notifications.length} new
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage your recent notifications
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2">
          <AnimatePresence>
            {notifications.map((notification, index) => {
              const Icon = notification.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-200/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`${notification.bgColor} p-2 rounded-lg flex-shrink-0`}>
                      <Icon className={`size-5 ${notification.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 text-sm mb-1">{notification.title}</h4>
                      <p className="text-gray-600 text-xs mb-2">{notification.message}</p>
                      <span className="text-xs text-gray-400">{notification.time}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg hover:bg-gray-100 flex-shrink-0"
                    >
                      <X className="size-4 text-gray-500" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={onClose}
          >
            Mark All as Read
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}