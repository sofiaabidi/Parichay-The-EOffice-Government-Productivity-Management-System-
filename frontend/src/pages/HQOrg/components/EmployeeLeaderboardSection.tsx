import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { hqOrgAPI } from "../../../services/api";
import { toast } from "sonner";

interface LeaderboardEntry {
  id: string;
  name: string;
  department: string;
  kpiScore: number;
  designation?: string;
}

export function EmployeeLeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await hqOrgAPI.getEmployeesLeaderboard();
      
      console.log('Employee Leaderboard API response:', response);
      
      // Handle response - axios wraps response in .data
      const leaderboardData = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response) 
          ? response 
          : [];
      
      console.log('Parsed employee leaderboard data:', leaderboardData);
      console.log('Data length:', leaderboardData.length);
      
      // Sort by KPI score (descending) - backend already sorts, but ensure it
      const sortedData = [...leaderboardData].sort((a, b) => b.kpiScore - a.kpiScore);
      setLeaderboard(sortedData);
      
      if (sortedData.length === 0) {
        console.warn('No employees found in leaderboard');
      }
    } catch (error: any) {
      console.error('Failed to load employee leaderboard:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      toast.error(error.response?.data?.message || 'Failed to load employee leaderboard');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
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

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-semibold">Employee Leaderboard</h2>
        </div>
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const topPerformers = leaderboard.slice(0, 3);

  if (topPerformers.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-semibold">Employee Leaderboard</h2>
        </div>
        <div className="text-center py-8 text-gray-500">No employees found in the database</div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-6 h-6 text-yellow-600" />
        <h2 className="text-xl font-semibold">Top Performing Employees</h2>
        <span className="text-sm text-gray-500">({leaderboard.length} total employees)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPerformers.map((employee, index) => (
          <Card
            key={employee.id}
            className={`p-6 border-2 ${getPositionColor(index)} transition-transform hover:scale-105`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3">{getPositionIcon(index)}</div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3">
                <span className="text-white text-xl font-semibold">{getInitials(employee.name)}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{employee.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{employee.department || 'N/A'}</p>
              {employee.designation && (
                <p className="text-xs text-gray-500 mb-3">{employee.designation}</p>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-green-600">{employee.kpiScore.toFixed(1)}</span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall KPI Score</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

