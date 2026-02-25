import { useState, useEffect } from "react";
import { Clock, Calendar, Bell, LogOut, Users, RefreshCw, MessageSquare } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { attendanceAPI, notificationsAPI } from "../../../services/api";
import { ManagerFeedbackDialog } from "./ManagerFeedbackDialog";

interface AttendanceRecord {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: number | null;
  status: string;
}

interface NotificationItem {
  id: number;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function UnifiedHeader() {
  const { user, logout } = useAuth();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [timeToday, setTimeToday] = useState<number>(0.0);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [refreshingNotifications, setRefreshingNotifications] = useState(false);

  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);

  useEffect(() => {
    loadAttendance({ forceSync: true });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadManagerNotifications();
    // Refresh notifications every 15 seconds for real-time updates
    const interval = setInterval(loadManagerNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Refresh notifications immediately when popover opens
  useEffect(() => {
    if (notificationPopoverOpen && user?.id) {
      loadManagerNotifications();
    }
  }, [notificationPopoverOpen, user?.id]);

  // Reset timeToday to 0 every new day
  useEffect(() => {
    const checkNewDay = () => {
      const today = new Date().toISOString().split("T")[0];
      const lastReset = localStorage.getItem('lastTimeTodayReset');
      if (lastReset !== today) {
        setTimeToday(0.0);
        localStorage.setItem('lastTimeTodayReset', today);
      }
    };
    checkNewDay();
    const interval = setInterval(checkNewDay, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const syncTodayStatus = (
    records: AttendanceRecord[],
    skipStateUpdate?: boolean
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const todayRecord = records.find((r) => r.date === today);

    if (todayRecord?.check_in_time) {
      if (!skipStateUpdate) {
        setIsCheckedIn(!todayRecord.check_out_time);
        setCheckInTime(new Date(todayRecord.check_in_time));
      }

      // Load timeToday from backend if available
      if (todayRecord.total_hours != null) {
        setTimeToday(todayRecord.total_hours);
      }
    } else {
      if (!skipStateUpdate) {
        setIsCheckedIn(false);
        setCheckInTime(null);
      }
      setTimeToday(0.0);
    }
  };

  const loadAttendance = async (options?: { forceSync?: boolean }) => {
    try {
      const response = await attendanceAPI.getMyAttendance(
        currentMonth + 1,
        currentYear
      );
      const data = response.data || [];
      setAttendanceRecords(data);

      const today = new Date();
      const isCurrentPeriod =
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth;

      if (options?.forceSync || isCurrentPeriod) {
        syncTodayStatus(data);
      }
    } catch (error: any) {
      console.error("Failed to load attendance:", error);
    }
  };

  const loadManagerNotifications = async (showLoading = false) => {
    try {
      if (showLoading) setRefreshingNotifications(true);
      const response = await notificationsAPI.list({ limit: 20 });
      const data: NotificationItem[] = response.data || [];
      setNotifications(data);
      setUnreadAlerts(data.filter((item) => !item.isRead).length);
    } catch (error: any) {
      console.error("Failed to load manager notifications:", error);
    } finally {
      if (showLoading) setRefreshingNotifications(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await attendanceAPI.checkIn();
      const checkInTimeValue = response.data.check_in_time;

      setIsCheckedIn(true);
      setCheckInTime(new Date(checkInTimeValue));

      setShowCheckInDialog(false);
      toast.success("Checked in successfully!");

      const today = new Date().toISOString().split("T")[0];
      setAttendanceRecords((prev) => {
        const updated = [...prev];
        const existingIndex = updated.findIndex((r) => r.date === today);
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            check_in_time: checkInTimeValue,
            check_out_time: null, // Reset check_out_time to allow multiple check-ins
            status: "present",
          };
        } else {
          updated.push({
            date: today,
            check_in_time: checkInTimeValue,
            check_out_time: null,
            total_hours: timeToday, // Keep existing timeToday
            status: "present",
          });
        }
        return updated;
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to check in");
      setShowCheckInDialog(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!checkInTime) {
        toast.error("No check-in time found");
        return;
      }

      const response = await attendanceAPI.checkOut();
      const checkOutTimeValue = response.data.check_out_time;
      const checkoutTime = new Date(checkOutTimeValue);

      // Calculate hours for this session: checkout - latest checkin
      const sessionHours = (checkoutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Accumulate: timeToday = timeToday + (checkout - latest checkin)
      const newTimeToday = timeToday + sessionHours;
      setTimeToday(newTimeToday);

      setIsCheckedIn(false);
      setCheckInTime(null);

      setShowCheckOutDialog(false);
      toast.success(
        `Checked out successfully! Total time today: ${newTimeToday.toFixed(2)}hrs`
      );

      const today = new Date().toISOString().split("T")[0];
      setAttendanceRecords((prev) => {
        const updated = [...prev];
        const existingIndex = updated.findIndex((r) => r.date === today);
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            check_out_time: checkOutTimeValue,
            total_hours: newTimeToday,
            // Mark as present if timeToday >= 8 hours
            status: newTimeToday >= 8 ? "present" : updated[existingIndex].status || "present",
          };
        } else {
          updated.push({
            date: today,
            check_in_time: null,
            check_out_time: checkOutTimeValue,
            total_hours: newTimeToday,
            status: newTimeToday >= 8 ? "present" : "present",
          });
        }
        return updated;
      });

      // Reload attendance to sync with backend
      await loadAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to check out");
      setShowCheckOutDialog(false);
    }
  };

  const handleNotificationClick = async (
    notification: NotificationItem
  ) => {
    try {
      await notificationsAPI.markRead([notification.id]);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );
      setUnreadAlerts((prev) => Math.max(prev - 1, 0));
    } catch (error: any) {
      console.error("Failed to mark notification read:", error);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const getAttendanceForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return attendanceRecords.find((r) => r.date === dateStr);
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [currentMonth, currentYear]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* LEFT SECTION */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">HQ Manager Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Government Office Management System
              </p>
            </div>
          </div>

          {/* CENTER SECTION - CHECK IN/OUT */}
          <div className="flex items-center gap-3">
            {!isCheckedIn ? (
              <>
                <Button
                  onClick={() => setShowCheckInDialog(true)}
                  className="bg-[#E6F9EC] hover:bg-[#D0F5DE] text-green-700 border border-green-500 rounded-full px-5"
                >
                  <Clock className="w-4 h-4 mr-2 text-green-600" />
                  Check In
                </Button>

                <AlertDialog
                  open={showCheckInDialog}
                  onOpenChange={setShowCheckInDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Check In
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Do you want to check in?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCheckIn}>
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setShowCheckOutDialog(true)}
                  className="bg-[#FDE8E8] hover:bg-[#FCD4D4] text-red-700 border border-red-500 rounded-full px-5"
                >
                  <Clock className="w-4 h-4 mr-2 text-red-600" />
                  Check Out
                </Button>

                <AlertDialog
                  open={showCheckOutDialog}
                  onOpenChange={setShowCheckOutDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Check Out
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Do you want to check out?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCheckOut}>
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {/* Show timeToday only when checked out */}
            {!isCheckedIn && timeToday > 0 && (
              <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-semibold text-blue-700">
                  Total: {timeToday.toFixed(2)}hrs
                </span>
              </div>
            )}
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-3">
            {/* Manager Feedback Dialog */}
            <ManagerFeedbackDialog />

            {/* Calendar */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePreviousMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      ←
                    </button>
                    <h3 className="font-semibold text-center">
                      {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      →
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {[
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold text-gray-500 py-1"
                      >
                        {day}
                      </div>
                    ))}

                    {calendarDays.map((day, index) => {
                      const attendance = day
                        ? getAttendanceForDay(day)
                        : null;

                      return (
                        <div
                          key={index}
                          className={`aspect-square flex items-center justify-center text-xs rounded ${day === null
                            ? ""
                            : attendance?.status === "present" ||
                              attendance?.check_in_time
                              ? "bg-green-100 text-green-700 border border-green-500 font-semibold"
                              : attendance?.status === "absent"
                                ? "bg-red-100 text-red-700 border border-red-500 font-semibold"
                                : "bg-gray-50 text-gray-400"
                            }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center gap-4 pt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
                      <span>Present</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
                      <span>Absent</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Notifications */}
            <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadAlerts > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadAlerts > 0 && (
                        <span className="text-xs text-blue-600">
                          {unreadAlerts} new
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadManagerNotifications(true);
                        }}
                        disabled={refreshingNotifications}
                        className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                        title="Refresh notifications"
                      >
                        <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshingNotifications ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      Nothing new right now.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isFeedbackNotification = notif.title?.includes('Feedback') || notif.title?.includes('feedback');
                      
                      return (
                        <div
                          key={notif.id}
                          className={`pb-3 border-b last:border-b-0 cursor-pointer ${notif.isRead
                            ? "opacity-70"
                            : "hover:bg-blue-50 rounded-lg px-2"
                            }`}
                          onClick={() =>
                            handleNotificationClick(notif)
                          }
                        >
                          <div className="flex items-start gap-2">
                            {isFeedbackNotification && !notif.isRead && (
                              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notif.title}
                              </p>
                              {notif.body && (
                                <p className="text-xs text-muted-foreground mt-1 break-words">
                                  {notif.body}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(notif.createdAt)}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Logout */}
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>

            {/* User */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {user?.name || "Manager"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {user?.id || "N/A"}
                </p>
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-[#2563EB] text-white font-semibold">
                  {user
                    ? getUserInitials(user.name)
                    : "M"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
