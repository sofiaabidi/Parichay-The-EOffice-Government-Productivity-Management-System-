import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { fieldEmployeeAttendanceAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface CalendarPopupProps {
  onClose: () => void;
}

interface AttendanceRecord {
  date: string;
  present_absent: string | null;
}

export default function CalendarPopup({ onClose }: CalendarPopupProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: 'present' | 'absent' }>({});
  const [loading, setLoading] = useState(true);

  // Fetch attendance data for the current month
  useEffect(() => {
    const loadAttendance = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const response = await fieldEmployeeAttendanceAPI.getMyAttendance(month, year);
        const records: AttendanceRecord[] = response.data || [];
        
        // Convert records to date-keyed object
        const dataMap: { [key: string]: 'present' | 'absent' } = {};
        records.forEach((record) => {
          if (record.present_absent) {
            dataMap[record.date] = record.present_absent as 'present' | 'absent';
          }
        });
        setAttendanceData(dataMap);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [user?.id, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDateKey = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isFutureDate = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      ></div>

      {/* Calendar Popup */}
      <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-4 w-80 z-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#1C1C28]">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={previousMonth} className="size-8">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="size-8">
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[#6B6B6B] text-sm py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateKey = getDateKey(day);
            const attendance = attendanceData[dateKey];
            const isCurrentDay = isToday(day);
            const isFuture = isFutureDate(day);
            const isPresent = attendance === 'present';
            const isAbsent = attendance === 'absent';

            return (
              <div
                key={day}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm relative ${
                  isCurrentDay
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : isFuture
                    ? 'text-gray-300'
                    : isPresent
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : isAbsent
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'text-gray-700'
                }`}
              >
                {day}
                {attendance && !isFuture && (
                  <div
                    className={`absolute bottom-1 size-1.5 rounded-full ${
                      isPresent ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-[#6B6B6B]">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-[#6B6B6B]">Absent</span>
          </div>
        </div>
      </div>
    </>
  );
}
