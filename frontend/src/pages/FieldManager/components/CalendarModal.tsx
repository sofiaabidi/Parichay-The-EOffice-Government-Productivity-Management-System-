import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { useState } from 'react';

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
}

// Mock attendance data
const attendanceData = {
  present: [
    new Date(2024, 10, 1),
    new Date(2024, 10, 4),
    new Date(2024, 10, 5),
    new Date(2024, 10, 6),
    new Date(2024, 10, 8),
    new Date(2024, 10, 11),
    new Date(2024, 10, 12),
    new Date(2024, 10, 13),
    new Date(2024, 10, 15),
    new Date(2024, 10, 18),
    new Date(2024, 10, 19),
    new Date(2024, 10, 20),
    new Date(2024, 10, 22),
  ],
  absent: [
    new Date(2024, 10, 7),
    new Date(2024, 10, 14),
    new Date(2024, 10, 21),
  ]
};

export function CalendarModal({ open, onClose }: CalendarModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-fit bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#1F2937]">Attendance Calendar</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={{
              present: attendanceData.present,
              absent: attendanceData.absent,
            }}
            modifiersStyles={{
              present: {
                backgroundColor: 'rgb(22, 163, 74)',
                color: 'white',
                borderRadius: '50%',
              },
              absent: {
                backgroundColor: 'rgb(220, 38, 38)',
                color: 'white',
                borderRadius: '50%',
              },
            }}
            className="rounded-md border"
          />
          <div className="flex gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-sm text-[#1F2937]">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-sm text-[#1F2937]">Absent</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
