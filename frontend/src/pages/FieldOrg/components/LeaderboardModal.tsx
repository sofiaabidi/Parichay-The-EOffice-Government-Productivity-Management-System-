import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fieldOrgAPI } from '../../../services/api';

interface LeaderboardModalProps {
  type: 'manager' | 'employee';
  onClose: () => void;
}

interface ManagerLeaderboardItem {
  rank: number;
  id: string;
  name: string;
  kpiScore: number;
  finalKpi: number;
  teamSize: number;
  projects: number;
}

interface EmployeeLeaderboardItem {
  rank: number;
  id: string;
  name: string;
  kpiScore: number;
  finalKpi: number;
  dprQuality: number;
  surveyAccuracy: number;
  timeline: number;
}

// Helper to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-6 h-6 text-amber-500" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Award className="w-6 h-6 text-amber-700" />;
    default:
      return <span className="text-gray-500">#{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300';
    case 2:
      return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300';
    case 3:
      return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300';
    default:
      return 'bg-white/80 border-gray-200';
  }
};

export function LeaderboardModal({ type, onClose }: LeaderboardModalProps) {
  const isManager = type === 'manager';
  const [data, setData] = useState<ManagerLeaderboardItem[] | EmployeeLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isManager) {
        const response = await fieldOrgAPI.getFieldManagersLeaderboard();
        const leaderboardData = Array.isArray(response.data) ? response.data : [];
        setData(leaderboardData as ManagerLeaderboardItem[]);
      } else {
        const response = await fieldOrgAPI.getFieldEmployeesLeaderboard();
        const leaderboardData = Array.isArray(response.data) ? response.data : [];
        setData(leaderboardData as EmployeeLeaderboardItem[]);
      }
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard data');
      toast.error('Failed to load leaderboard');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${isManager ? 'from-amber-600 to-orange-600' : 'from-rose-600 to-pink-600'} text-white p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7" />
            <div>
              <h2>{isManager ? 'Manager' : 'Employee'} Leaderboard</h2>
              <p className="text-sm text-white/90 mt-1">Top performers based on KPI scores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600">Loading leaderboard data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadLeaderboard}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Retry
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600">No {isManager ? 'managers' : 'employees'} found in the leaderboard</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => {
                const initials = getInitials(item.name);
                return (
                  <div
                    key={item.id}
                    className={`${getRankBg(item.rank)} backdrop-blur rounded-xl p-5 border transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(item.rank)}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 bg-gradient-to-br ${
                          item.rank === 1 ? 'from-amber-500 to-yellow-600' :
                          item.rank === 2 ? 'from-gray-400 to-slate-500' :
                          item.rank === 3 ? 'from-orange-500 to-amber-600' :
                          'from-indigo-500 to-purple-600'
                        } rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-semibold">{initials}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-gray-900 truncate font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">Rank #{item.rank}</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <span className="text-2xl font-bold text-gray-900">{item.kpiScore.toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-gray-600">KPI Score</p>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="hidden md:flex gap-6">
                        {isManager && 'projects' in item && 'teamSize' in item ? (
                          <>
                            <div className="text-center">
                              <p className="text-xl font-semibold text-indigo-600">{item.projects}</p>
                              <p className="text-xs text-gray-600">Projects</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-semibold text-purple-600">{item.teamSize}</p>
                              <p className="text-xs text-gray-600">Team Size</p>
                            </div>
                          </>
                        ) : !isManager && 'dprQuality' in item && 'surveyAccuracy' in item && 'timeline' in item ? (
                          <>
                            <div className="text-center">
                              <p className="text-xl font-semibold text-blue-600">{item.dprQuality.toFixed(1)}</p>
                              <p className="text-xs text-gray-600">DPR Quality</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-semibold text-teal-600">{item.surveyAccuracy.toFixed(1)}</p>
                              <p className="text-xs text-gray-600">Survey</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-semibold text-emerald-600">{item.timeline.toFixed(1)}</p>
                              <p className="text-xs text-gray-600">Timeline</p>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
