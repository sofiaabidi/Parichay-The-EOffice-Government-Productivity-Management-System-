import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { fieldEmployeeAttendanceAPI } from "../../services/api";
import { toast } from "sonner";
import { Toaster } from './components/ui/sonner';

import TopNavBar from './components/TopNavBar';
import KPISection from './components/KPISection';
import ProjectsSection from './components/ProjectsSection';
import SurveysSection from './components/SurveysSection';
import TrainingProgramsSection from './components/TrainingProgramsSection';
import FeedbackSection from './components/FeedbackSection';
import { MapSection } from './components/MapSection';

interface FieldEmployeeAttendanceRecord {
  date: string;
  checkin_time: string | null;
  checkout_time: string | null;
  total_time: number | null; // Total time in hours
  present_absent: string | null;
}

export default function FieldEmployeeApp() {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [totalTimeHours, setTotalTimeHours] = useState<number | null>(null);
  const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);
  const [kpiRefreshTrigger, setKpiRefreshTrigger] = useState(0);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<FieldEmployeeAttendanceRecord[]>([]);

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Load attendance data on mount
  useEffect(() => {
    if (user?.id) {
      loadAttendance();
    }
  }, [user?.id]);

  const loadAttendance = async () => {
    try {
      // First try to get today's attendance
      const todayResponse = await fieldEmployeeAttendanceAPI.getTodayAttendance();
      const todayRecord = todayResponse.data;
      
      if (todayRecord) {
        if (todayRecord.checkin_time && !todayRecord.checkout_time) {
          setIsCheckedIn(true);
          setCheckInTime(new Date(todayRecord.checkin_time));
        } else {
          setIsCheckedIn(false);
          setCheckInTime(null);
        }
        
        if (todayRecord.total_time !== null) {
          setTotalTimeHours(Number(todayRecord.total_time));
        } else {
          setTotalTimeHours(null);
        }
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setTotalTimeHours(null);
      }
      
      // Also load monthly data for records
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const response = await fieldEmployeeAttendanceAPI.getMyAttendance(currentMonth, currentYear);
      const data = response.data || [];
      setAttendanceRecords(data);
    } catch (error: any) {
      console.error('Failed to load attendance:', error);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const response = await fieldEmployeeAttendanceAPI.checkIn();
      const checkInTimeValue = response.data.checkin_time;
      
      setIsCheckedIn(true);
      setCheckInTime(new Date(checkInTimeValue));
      setTotalTimeHours(null);
      
      toast.success("Checked in successfully!");
      await loadAttendance();
    } catch (error: any) {
      console.error('Failed to check in:', error);
      toast.error(error.response?.data?.message || "Failed to check in");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!checkInTime) {
        toast.error("No check-in time found");
        return;
      }
      
      setIsCheckingOut(true);
      const response = await fieldEmployeeAttendanceAPI.checkOut();
      const checkoutTimeValue = response.data.checkout_time;
      const totalTimeValue = response.data.total_time; // in hours
      const presentAbsent = response.data.present_absent;
      
      setIsCheckedIn(false);
      setCheckInTime(null);
      setTotalTimeHours(totalTimeValue ? Number(totalTimeValue) : null);
      
      const hours = totalTimeValue ? Number(totalTimeValue).toFixed(2) : '0.00';
      const minutes = totalTimeValue ? (Number(totalTimeValue) * 60).toFixed(0) : '0';
      toast.success(`Checked out successfully! Total time: ${hours}hrs (${minutes} minutes). Status: ${presentAbsent || 'N/A'}`);
      await loadAttendance();
    } catch (error: any) {
      console.error('Failed to check out:', error);
      toast.error(error.response?.data?.message || "Failed to check out");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleFeedbackAdded = () => {
    setFeedbackRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Toaster />

      <TopNavBar
        isCheckedIn={isCheckedIn}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        totalHours={totalTimeHours}
        onFeedbackAdded={handleFeedbackAdded}
        isCheckingIn={isCheckingIn}
        isCheckingOut={isCheckingOut}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        <KPISection refreshTrigger={kpiRefreshTrigger} />
        <ProjectsSection onKpiRefresh={() => setKpiRefreshTrigger(prev => prev + 1)} />
        <SurveysSection onKpiRefresh={() => setKpiRefreshTrigger(prev => prev + 1)} />
        <MapSection />
        <TrainingProgramsSection />
        <FeedbackSection refreshTrigger={feedbackRefreshTrigger} />
      </main>
    </div>
  );
}
