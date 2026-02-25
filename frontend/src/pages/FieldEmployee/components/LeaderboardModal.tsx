import { X, Trophy, Medal, Award } from 'lucide-react';
import { Button } from './ui/button';

interface LeaderboardModalProps {
  onClose: () => void;
}

export default function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const leaderboardData = [
    { rank: 1, name: 'Rajesh Kumar', id: 'EMP2025-0823', score: 95, tasks: 68, quality: 9.2 },
    { rank: 2, name: 'Priya Singh', id: 'EMP2025-0791', score: 92, tasks: 64, quality: 9.0 },
    { rank: 3, name: 'Amit Patel', id: 'EMP2025-0805', score: 89, tasks: 61, quality: 8.8 },
    { rank: 4, name: 'Arjun Mehta', id: 'EMP2025-0847', score: 87, tasks: 58, quality: 8.6, current: true },
    { rank: 5, name: 'Sneha Reddy', id: 'EMP2025-0812', score: 85, tasks: 56, quality: 8.5 },
    { rank: 6, name: 'Vikram Shah', id: 'EMP2025-0834', score: 83, tasks: 54, quality: 8.3 },
    { rank: 7, name: 'Neha Gupta', id: 'EMP2025-0819', score: 81, tasks: 52, quality: 8.1 },
    { rank: 8, name: 'Rahul Verma', id: 'EMP2025-0828', score: 79, tasks: 50, quality: 7.9 },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="size-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="size-5 text-gray-400" />;
    if (rank === 3) return <Award className="size-5 text-orange-600" />;
    return <span className="text-[#6B6B6B]">#{rank}</span>;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-[#1C1C28] text-xl mb-1">Team Leaderboard</h2>
              <p className="text-[#6B6B6B]">Top performing field employees this month</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>

          {/* Leaderboard Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            <div className="space-y-3">
              {leaderboardData.map((employee) => (
                <div
                  key={employee.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    employee.current
                      ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                      : 'bg-white border border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(employee.rank)}
                  </div>

                  {/* Employee Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#1C1C28]">{employee.name}</span>
                      {employee.current && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[#6B6B6B] text-sm">{employee.id}</div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-[#1C1C28] text-xl">{employee.score}</div>
                      <div className="text-[#6B6B6B] text-xs">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#1C1C28] text-xl">{employee.tasks}</div>
                      <div className="text-[#6B6B6B] text-xs">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#1C1C28] text-xl">{employee.quality}</div>
                      <div className="text-[#6B6B6B] text-xs">Quality</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
