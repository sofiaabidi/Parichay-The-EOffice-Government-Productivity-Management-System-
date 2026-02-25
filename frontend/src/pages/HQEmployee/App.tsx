import { useState, useEffect } from "react";
import { PersonalKPICard } from "./components/PersonalKPICard";
import { TaskCompletionSection } from "./components/TaskCompletionSection";
import { ProjectsSection } from "./components/ProjectsSection";
import { FeedbackSection } from "./components/FeedbackSection";
import { TrainingRecognitionSection } from "./components/TrainingRecognitionSection";
import { KPICharts } from "./components/KPICharts";
import { Bell, LogOut, Calendar as CalendarIcon, Clock, X, Trophy } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Calendar } from "./components/ui/calendar";
import { PeerFeedbackDialog } from "./components/PeerFeedbackDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import { attendanceAPI, notificationsAPI, userAPI, kpiAPI } from "../../services/api";

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
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Skill {
  id: number;
  name: string;
}

interface BadgeItem {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  awardedAt: string;
}

export default function App() {
  const { user, logout } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [timeToday, setTimeToday] = useState<number>(0.0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [kpiScore, setKpiScore] = useState<number | null>(null);
  const [departmentRank, setDepartmentRank] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [kpiRefreshTrigger, setKpiRefreshTrigger] = useState(0);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Fetch attendance data
useEffect(() => {
  loadAttendance();
}, []);

useEffect(() => {
  if (!user?.id) return;
  loadNotifications();
  const interval = setInterval(loadNotifications, 60000);
  return () => clearInterval(interval);
}, [user?.id]);

useEffect(() => {
  if (profileOpen && user?.id) {
    loadProfileExtras();
  }
}, [profileOpen, user?.id]);

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

  const syncTodayStatus = (records: AttendanceRecord[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = records.find((r) => r.date === today);
    if (todayRecord) {
      setCheckInTime(todayRecord.check_in_time);
      if (todayRecord.check_out_time) {
        setCheckOutTime(todayRecord.check_out_time);
      } else {
        setCheckOutTime(null);
      }
      // Load timeToday from backend if available
      if (todayRecord.total_hours != null) {
        setTimeToday(todayRecord.total_hours);
      }
    } else {
      setCheckInTime(null);
      setCheckOutTime(null);
      setTimeToday(0.0);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await attendanceAPI.getMyAttendance(currentMonth, currentYear);
      const data = response.data || [];
      setAttendanceRecords(data);
      syncTodayStatus(data);
    } catch (error: any) {
      console.error('Failed to load attendance:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.list({ limit: 20 });
      const data: NotificationItem[] = response.data || [];
      setNotifications(data);
      setUnreadAlerts(data.filter((item) => !item.isRead).length);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadProfileExtras = async () => {
    try {
      setProfileLoading(true);
      console.log('[HQ Employee Profile] Fetching profile extras for user:', user!.id);
      const [skillsRes, kpiRes, leaderboardRes, profileRes] = await Promise.all([
        userAPI.getMySkills(),
        kpiAPI.getEmployeeKpi(user!.id),
        userAPI.getDepartmentLeaderboard(),
        userAPI.getProfile(),
      ]);
      setSkills(skillsRes.data || []);
      
      // Set KPI score from employee_kpi_snapshots
      const kpiData = kpiRes.data;
      console.log('[HQ Employee Profile] KPI data from employee_kpi_snapshots:', kpiData);
      setKpiScore(kpiData?.finalKpi || 0);
      
      // Find current user's rank in leaderboard
      const leaderboardData = leaderboardRes.data || [];
      setLeaderboard(leaderboardData);
      const userRank = leaderboardData.findIndex((entry: any) => entry.userId === user!.id);
      setDepartmentRank(userRank >= 0 ? userRank + 1 : null);
      
      // Set manager name from profile
      const profileData = profileRes.data;
      setManagerName(profileData?.manager?.name || null);
    } catch (error: any) {
      console.error('[HQ Employee Profile] Failed to load profile extras:', error);
      console.error('[HQ Employee Profile] Error details:', error.response?.data || error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const response = await userAPI.getDepartmentLeaderboard();
      setLeaderboard(response.data || []);
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const response = await attendanceAPI.checkIn();
      setCheckInTime(response.data.check_in_time);
      setShowCheckInDialog(false);
      toast.success("Checked in successfully!");
      await loadAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to check in");
      setShowCheckInDialog(false);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    try {
      if (!checkInTime) {
        toast.error("No check-in time found");
        return;
      }

      const response = await attendanceAPI.checkOut();
      const checkOutTimeValue = response.data.check_out_time;
      const checkoutTime = new Date(checkOutTimeValue);
      const latestCheckIn = new Date(checkInTime);
      
      // Calculate hours for this session: checkout - latest checkin
      const sessionHours = (checkoutTime.getTime() - latestCheckIn.getTime()) / (1000 * 60 * 60);
      
      // Accumulate: timeToday = timeToday + (checkout - latest checkin)
      const newTimeToday = timeToday + sessionHours;
      setTimeToday(newTimeToday);

      setCheckOutTime(checkOutTimeValue);
      setShowCheckOutDialog(false);
      toast.success(`Checked out successfully! Total time today: ${newTimeToday.toFixed(2)}hrs`);
      
      // Update local attendance records
      const today = new Date().toISOString().split('T')[0];
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
            check_in_time: checkInTime,
            check_out_time: checkOutTimeValue,
            total_hours: newTimeToday,
            status: newTimeToday >= 8 ? "present" : "present",
          });
        }
        return updated;
      });

      await loadAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to check out");
      setShowCheckOutDialog(false);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      await notificationsAPI.markRead([notif.id]);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, isRead: true } : item))
      );
      setUnreadAlerts((prev) => Math.max(prev - 1, 0));
      if (notif.body) {
        toast.info(notif.body);
      }
    } catch (error: any) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const handleAddSkill = async () => {
    const value = skillInput.trim();
    if (!value) return;
    try {
      await userAPI.addSkill({ name: value });
      toast.success("Skill added");
      setSkillInput("");
      await loadProfileExtras();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add skill");
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await userAPI.deleteSkill(skillId);
      toast.success("Skill removed");
      await loadProfileExtras();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove skill");
    }
  };

  const getDayClassName = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    const record = attendanceRecords.find(r => r.date === dayStr);
    
    if (record) {
      if (record.status === 'present' || record.check_in_time) {
        return "bg-green-100 hover:bg-green-200 text-green-900 rounded-full";
      }
      if (record.status === 'absent') {
        return "bg-red-100 hover:bg-red-200 text-red-900 rounded-full";
      }
    }
    return "";
  };

  const getDayModifiers = () => {
    const modifiers: { present: Date[]; absent: Date[] } = { present: [], absent: [] };
    
    attendanceRecords.forEach(record => {
      const recordDate = new Date(record.date);
      if (record.status === 'present' || record.check_in_time) {
        modifiers.present.push(recordDate);
      } else if (record.status === 'absent') {
        modifiers.absent.push(recordDate);
      }
    });
    
    return modifiers;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const formatEmployeeId = (userId: number) => {
    return `EMP2025-${String(userId).padStart(4, '0')}`;
  };

  const formatBadgeDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">HQ Employee Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Track your performance, tasks, and achievements</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Attendance Section */}
              <div className="flex items-center gap-2 px-4 border-r border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCheckInDialog(true)}
                  disabled={checkInTime !== null || isCheckingIn}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {isCheckingIn ? "Checking In..." : "Check In"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCheckOutDialog(true)}
                  disabled={checkInTime === null || isCheckingOut}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {isCheckingOut ? "Checking Out..." : "Check Out"}
                </Button>
                {/* Show timeToday only when checked out */}
                {checkOutTime !== null && timeToday > 0 && (
                  <span className="text-sm text-gray-600">
                    Total: {timeToday.toFixed(2)}hrs
                  </span>
                )}
                {/* Check In Confirmation Dialog */}
                <AlertDialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Check In</AlertDialogTitle>
                      <AlertDialogDescription>
                        Do you want to check in?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCheckIn}>Yes</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {/* Check Out Confirmation Dialog */}
                <AlertDialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Check Out</AlertDialogTitle>
                      <AlertDialogDescription>
                        Do you want to check out?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCheckOut}>Yes</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Peer Feedback Dialog */}
              <PeerFeedbackDialog />

              {/* Calendar Icon */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <CalendarIcon className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4">
                    <h3 className="mb-3">Attendance Calendar</h3>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                      modifiers={getDayModifiers()}
                      modifiersClassNames={{
                        present: "bg-green-100 text-green-900",
                        absent: "bg-red-100 text-red-900",
                      }}
                    />
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300"></div>
                        <span>Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300"></div>
                        <span>Absent</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadAlerts > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2">
                    <h3 className="mb-2 px-2 flex items-center justify-between">
                      <span>Notifications</span>
                      {unreadAlerts > 0 && (
                        <span className="text-xs text-blue-600">{unreadAlerts} new</span>
                      )}
                    </h3>
                    {notifications.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-4">
                        No alerts yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <DropdownMenuItem
                          key={notif.id}
                          className={`flex flex-col items-start p-3 cursor-pointer transition-colors rounded-md ${
                            notif.isRead ? 'opacity-70' : 'hover:bg-blue-50'
                          }`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <span className="text-sm font-medium">{notif.title}</span>
                          {notif.body && (
                            <span className="text-xs text-gray-600 mt-1">{notif.body}</span>
                          )}
                          <span className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout Button */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Profile */}
              <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg py-2">
                    <div className="text-right">
                      <div className="text-sm">{user?.name || "User"}</div>
                      <div className="text-xs text-gray-600">ID: {user?.id || "N/A"}</div>
                    </div>
                    <Avatar className="cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user ? getUserInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Profile & Skills</DialogTitle>
                    <DialogDescription>
                      View your current position and add skills to your profile.
                    </DialogDescription>
                  </DialogHeader>
                  {profileLoading ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading profile...</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Current Position & KPI Score */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Current Position</div>
                          <div className="text-2xl font-bold text-blue-600">
                            #{departmentRank || 'N/A'} in department
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">KPI Score</div>
                          <div className="text-2xl font-bold text-green-600">
                            {kpiScore !== null ? kpiScore.toFixed(1) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Manager Information */}
                      {managerName && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm text-gray-600 mb-1">Reporting Manager</div>
                          <div className="text-lg font-semibold text-blue-700">
                            {managerName}
                          </div>
                        </div>
                      )}
                      
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setLeaderboardOpen(true);
                          loadLeaderboard();
                        }}
                      >
                        View Leader Board
                      </Button>

                      {/* Add Your Skills Section */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Your Skills</h4>
                        <div className="flex gap-2 mb-3">
                          <input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            placeholder="e.g., Data Analysis, Project Management"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleAddSkill}
                          >
                            Add Skill
                          </Button>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-2">Current Skills:</div>
                          <div className="flex flex-wrap gap-2">
                            {skills.length === 0 ? (
                              <span className="text-xs text-gray-500">No skills added yet.</span>
                            ) : (
                              skills.map((skill) => (
                                <span
                                  key={skill.id}
                                  className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs"
                                >
                                  {skill.name}
                                  <button
                                    className="text-blue-500 hover:text-blue-700"
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    aria-label={`Remove ${skill.name}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Department Leaderboard Dialog */}
              <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Department Leader Board</DialogTitle>
                    <DialogDescription>
                      Top performers in the department based on KPI scores.
                    </DialogDescription>
                  </DialogHeader>
                  {leaderboardLoading ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading leaderboard...</div>
                  ) : leaderboard.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">No data available</div>
                  ) : (
                    <div className="space-y-2 mt-4">
                      {leaderboard.map((entry, index) => {
                        const isCurrentUser = entry.userId === user?.id;
                        const getRankColor = (rank: number) => {
                          if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                          if (rank === 2) return 'bg-blue-100 text-blue-800 border-blue-300';
                          if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
                          return 'bg-blue-50 text-blue-700 border-blue-200';
                        };
                        
                        return (
                          <div
                            key={entry.userId}
                            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                              isCurrentUser 
                                ? 'bg-blue-50 border-blue-300' 
                                : getRankColor(entry.rank)
                            }`}
                          >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                              entry.rank === 2 ? 'bg-blue-400 text-blue-900' :
                              entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                              'bg-blue-300 text-blue-900'
                            }`}>
                              #{entry.rank}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{entry.name}</div>
                              <div className="text-xs text-gray-600">{formatEmployeeId(entry.userId)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {entry.kpiScore.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Links Below Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                const element = document.getElementById('task-completion');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Tasks
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('project-milestones');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Project & Milestones
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('training-programs');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Training Program
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('badges');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Badges
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('feedback-received');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Personal KPI Score */}
          <PersonalKPICard refreshTrigger={kpiRefreshTrigger} />

          {/* KPI Charts - Side by Side */}
          <KPICharts />

          {/* Task Completion - Full Width */}
          <div id="task-completion">
            <TaskCompletionSection />
          </div>

          {/* Projects Section */}
          <div id="project-milestones">
            <ProjectsSection />
          </div>

          {/* Training and Recognition */}
          <div id="training-badges-section">
            <TrainingRecognitionSection />
          </div>

          {/* Feedback Section */}
          <div id="feedback-received">
            <FeedbackSection />
          </div>
        </div>
      </main>
    </div>
  );
}
