import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Trophy, Medal, Award, Target, Loader2 } from 'lucide-react';
import { hqOrgAPI } from '../../../services/api';
import { toast } from 'sonner@2.0.3';

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
  type: 'manager' | 'employee';
}

interface LeaderboardEntry {
  id: string;
  name: string;
  department: string;
  kpiScore: number;
  teamSize?: number;
  completedProjects?: number;
}

export function LeaderboardModal({ open, onClose, type }: LeaderboardModalProps) {
  const isManager = type === 'manager';
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      loadLeaderboard();
    }
  }, [open, type]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = isManager
        ? await hqOrgAPI.getManagersLeaderboard()
        : await hqOrgAPI.getEmployeesLeaderboard();
      
      console.log('Leaderboard API response:', response);
      
      // Handle response - axios wraps response in .data
      const leaderboardData = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response) 
          ? response 
          : [];
      
      console.log('Parsed leaderboard data:', leaderboardData);
      console.log('Data length:', leaderboardData.length);
      
      // Sort by KPI score (descending)
      const sortedData = [...leaderboardData].sort((a, b) => b.kpiScore - a.kpiScore);
      setData(sortedData);
      
      if (sortedData.length === 0) {
        console.warn(`No ${isManager ? 'managers' : 'employees'} found in database`);
      }
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      toast.error(error.response?.data?.message || 'Failed to load leaderboard data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Sort data by KPI score
  const sortedData = data;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="size-6 text-yellow-500" />;
      case 1:
        return <Medal className="size-6 text-gray-400" />;
      case 2:
        return <Award className="size-6 text-amber-600" />;
      default:
        return <span className="text-gray-500 font-semibold">{position + 1}</span>;
    }
  };

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 2:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-xl rounded-2xl border-gray-200/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`size-10 rounded-xl ${
              isManager 
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30'
                : 'bg-gradient-to-br from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/30'
            } flex items-center justify-center`}>
              <Trophy className="size-5 text-white" />
            </div>
            <span>{isManager ? 'Manager' : 'Employee'} Leaderboard</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Top performers ranked by KPI scores{isManager ? ' and team performance' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading leaderboard...</span>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No {isManager ? 'managers' : 'employees'} found in the leaderboard.
            </div>
          ) : (
            sortedData.map((person, index) => {
            const isTopThree = index < 3;
            
            return (
              <div
                key={person.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isTopThree
                    ? 'bg-gradient-to-r from-amber-50/80 to-yellow-50/80 border-2 border-amber-200/50 shadow-md'
                    : 'bg-gray-50/50 border border-gray-200/50'
                }`}
              >
                {/* Position */}
                <div className="flex items-center justify-center w-12">
                  {getPositionIcon(index)}
                </div>

                {/* Avatar with Initials */}
                <div className={`size-12 rounded-xl ${getPositionBadge(index)} flex items-center justify-center text-white shadow-lg`}>
                  <span className="font-semibold">{getInitials(person.name)}</span>
                </div>

                {/* Name and Department */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{person.name}</h3>
                  <p className="text-sm text-gray-600">{person.department}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  {/* KPI Score */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-indigo-600">
                      <Target className="size-4" />
                      <span className="font-semibold">{person.kpiScore}</span>
                    </div>
                    <p className="text-xs text-gray-500">KPI Score</p>
                  </div>

                  {/* Additional Stats */}
                  {isManager && (
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">{person.teamSize || 0}</div>
                      <p className="text-xs text-gray-500">Team Size</p>
                    </div>
                  )}
                </div>

                {/* Position Badge */}
                {isTopThree && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    'bg-amber-600'
                  }`}>
                    {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : '3rd Place'}
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
