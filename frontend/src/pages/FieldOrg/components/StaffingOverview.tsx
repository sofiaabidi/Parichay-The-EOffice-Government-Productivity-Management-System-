import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, FolderOpen, Loader2, X } from 'lucide-react';
import { fieldOrgAPI } from '../../../services/api';
import { toast } from 'sonner';

interface TeamInfo {
  team_id: number;
  team_name: string;
  current_team_size: number;
  required_ppl: number;
}

interface StaffingOverviewData {
  understaffed: number;
  overstaffed: number;
  balanced: number;
  total: number;
  isUnbalanced: boolean;
  gapDifference: number;
  totalProjects: number;
  teamsByStatus?: {
    understaffed: TeamInfo[];
    overstaffed: TeamInfo[];
    balanced: TeamInfo[];
  };
}

export function StaffingOverview() {
  const [data, setData] = useState<StaffingOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'understaffed' | 'overstaffed' | 'balanced' | null>(null);

  useEffect(() => {
    loadStaffingData();
    // Removed auto-refresh - data will update when backend triggers recalculate promotion scores
  }, []);

  const loadStaffingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fieldOrgAPI.getStaffingOverview();
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to load staffing overview:', err);
      setError(err.message || 'Failed to load staffing data');
      toast.error('Failed to load staffing overview');
    } finally {
      setLoading(false);
    }
  };

  const kpiData = data ? [
    {
      id: 1,
      title: 'Understaffed Field Units',
      description: 'This field office is understaffed — additional manpower required immediately.',
      value: data.understaffed,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      borderColor: 'border-red-200',
      teams: data.teamsByStatus?.understaffed || [],
    },
    {
      id: 2,
      title: 'Overstaffed Field Units',
      description: 'This field office has surplus manpower — redistribution recommended.',
      value: data.overstaffed,
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      teams: data.teamsByStatus?.overstaffed || [],
    },
    {
      id: 3,
      title: 'Balanced Teams',
      description: 'This field office is optimally staffed with balanced workload distribution.',
      value: data.balanced,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      teams: data.teamsByStatus?.balanced || [],
    },
    {
      id: 4,
      title: 'Total Active Field Projects',
      description: 'Number of ongoing field projects currently in progress.',
      value: data.totalProjects,
      icon: FolderOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      teams: [],
    },
  ] : [];

  // Calculate overall staffing status
  function getOverallStatus() {
    if (!data) {
      return { status: 'Loading...', color: 'text-gray-600', bg: 'bg-gray-50' };
    }

    const { understaffed, overstaffed, balanced, isUnbalanced } = data;

    if (isUnbalanced) {
      return { status: 'Unbalanced', color: 'text-orange-600', bg: 'bg-orange-50' };
    }

    if (understaffed > overstaffed && understaffed > balanced) {
      return { status: 'Understaffed', color: 'text-red-600', bg: 'bg-red-50' };
    } else if (overstaffed > understaffed && overstaffed > balanced) {
      return { status: 'Overstaffed', color: 'text-amber-600', bg: 'bg-amber-50' };
    } else {
      return { status: 'Balanced', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    }
  }

  const overallStatus = getOverallStatus();

  if (loading) {
    return (
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
        <h2 className="text-gray-900 mb-5">Staffing Status Overview</h2>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
        <h2 className="text-gray-900 mb-5">Staffing Status Overview</h2>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error || 'Failed to load staffing data'}</p>
          <button
            onClick={loadStaffingData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
      <h2 className="text-gray-900 mb-5">Staffing Status Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const isClickable = kpi.id <= 3 && kpi.teams && kpi.teams.length > 0;
          const statusType = kpi.id === 1 ? 'understaffed' : kpi.id === 2 ? 'overstaffed' : kpi.id === 3 ? 'balanced' : null;
          
          return (
            <div
              key={kpi.id}
              onClick={() => isClickable && statusType && setSelectedStatus(statusType)}
              className={`bg-white/80 backdrop-blur rounded-2xl p-5 border ${kpi.borderColor} hover:shadow-lg transition-all ${
                isClickable ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${kpi.bg} ${kpi.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-3xl ${kpi.color}`}>{kpi.value}</span>
              </div>
              <h3 className="text-gray-900 mb-2">{kpi.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{kpi.description}</p>
              
              {/* Display team names if available */}
              {kpi.teams && kpi.teams.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Teams:</p>
                  <div className="space-y-1">
                    {kpi.teams.map((team) => (
                      <div key={team.team_id} className="text-xs text-gray-600 flex items-center justify-between">
                        <span className="truncate">{team.team_name}</span>
                        <span className="ml-2 text-gray-500">
                          ({team.current_team_size}/{team.required_ppl})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Status Inference */}
      <div className={`${overallStatus.bg} border-2 ${overallStatus.color.replace('text-', 'border-')}/20 rounded-xl p-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 ${overallStatus.color.replace('text-', 'bg-')} rounded-full animate-pulse`}></div>
          <p className="text-gray-900">
            Current staffing assessment: <span className={`${overallStatus.color} font-semibold`}>{overallStatus.status}</span>
            {data.isUnbalanced && (
              <span className="text-sm text-gray-600 ml-2">
                (Gap difference: {data.gapDifference.toFixed(1)})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedStatus === 'understaffed' && 'Understaffed Teams'}
                {selectedStatus === 'overstaffed' && 'Overstaffed Teams'}
                {selectedStatus === 'balanced' && 'Balanced Teams'}
              </h3>
              <button
                onClick={() => setSelectedStatus(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {data?.teamsByStatus?.[selectedStatus] && data.teamsByStatus[selectedStatus].length > 0 ? (
                <div className="space-y-4">
                  {data.teamsByStatus[selectedStatus].map((team) => {
                    const gap = team.current_team_size - team.required_ppl;
                    return (
                      <div
                        key={team.team_id}
                        className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {team.team_name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Team ID: <span className="font-medium">{team.team_id}</span></span>
                              <span>Current Size: <span className="font-medium">{team.current_team_size}</span></span>
                              <span>Required: <span className="font-medium">{team.required_ppl}</span></span>
                              <span className={`font-medium ${
                                gap > 0 ? 'text-amber-600' : gap < 0 ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                Gap: {gap > 0 ? '+' : ''}{gap}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No teams found in this category.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedStatus(null)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
