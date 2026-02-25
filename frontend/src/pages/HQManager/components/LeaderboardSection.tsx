import { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Card } from "./ui/card";
import { managerAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { userAPI } from "../../../services/api";

interface LeaderboardEntry {
  userId: number;
  finalKpi: number;
  fileDisposalRate: number;
  responsiveness: number;
}

export function LeaderboardSection() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadLeaderboard();
    }
  }, [user?.id]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const [leaderboardRes, membersRes] = await Promise.all([
        managerAPI.getLeaderboard(),
        userAPI.getManagerTeam(),
      ]);
      
      // Handle response - backend returns arrays directly or wrapped in data
      const leaderboardData = Array.isArray(leaderboardRes.data) ? leaderboardRes.data : (Array.isArray(leaderboardRes) ? leaderboardRes : []);
      const members = membersRes.data?.members || (Array.isArray(membersRes.data) ? membersRes.data : []);
      const teamMemberIds = new Set(members.map((m: any) => m.id));
      
      // Filter leaderboard to only include team members
      const filteredLeaderboard = leaderboardData.filter((entry: LeaderboardEntry) =>
        teamMemberIds.has(entry.userId)
      );
      
      setLeaderboard(filteredLeaderboard);
      setTeamMembers(members);
      
      console.log('Leaderboard loaded:', { leaderboardCount: filteredLeaderboard.length, memberCount: members.length });
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (userId: number) => {
    const member = teamMembers.find(m => m.id === userId);
    return member?.name || `User ${userId}`;
  };

  const getMemberDesignation = (userId: number) => {
    const member = teamMembers.find(m => m.id === userId);
    return member?.designation || member?.role || 'Employee';
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Award className="w-8 h-8 text-amber-700" />;
      default:
        return null;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 0:
        return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300";
      case 1:
        return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300";
      case 2:
        return "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300";
      default:
        return "bg-white border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="text-center py-8">Loading leaderboard...</div>
      </div>
    );
  }

  const topPerformers = leaderboard.slice(0, 3);

  if (topPerformers.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h2>Top Performers</h2>
        </div>
        <div className="text-center py-8 text-gray-500">No performance data available</div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-6 h-6 text-yellow-600" />
        <h2>Top Performers</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPerformers.map((member, index) => (
          <Card
            key={member.userId}
            className={`p-6 border-2 ${getPositionColor(index)} transition-transform hover:scale-105`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3">{getPositionIcon(index)}</div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3">
                <span className="text-white text-xl">{getMemberName(member.userId).charAt(0)}</span>
              </div>
              <h3 className="mb-1">{getMemberName(member.userId)}</h3>
              <p className="text-muted-foreground mb-3">{getMemberDesignation(member.userId)}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl text-green-600">{member.finalKpi.toFixed(1)}</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overall KPI Score</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
