import { useState, useEffect } from "react";
import { TrendingUp, Clock, Award, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { kpiAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { userAPI } from "../../../services/api";

interface TeamMemberKPI {
  userId: number;
  finalKpi: number;
  fileDisposalRate: number;
  responsiveness: number;
  tatScore: number;
  qualityOfDrafting: number;
  digitalAdoption: number;
}

export function KPITable() {
  const { user } = useAuth();
  const [teamKpiData, setTeamKpiData] = useState<TeamMemberKPI[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiRes, membersRes] = await Promise.all([
        kpiAPI.getTeamKpiTable(user!.id),
        userAPI.getManagerTeam(),
      ]);
      
      // Handle response - backend returns array directly or wrapped in data
      const kpiData = Array.isArray(kpiRes.data) ? kpiRes.data : (Array.isArray(kpiRes) ? kpiRes : []);
      const members = membersRes.data?.members || (Array.isArray(membersRes.data) ? membersRes.data : []);
      
      setTeamKpiData(kpiData);
      setTeamMembers(members);
      
      console.log('KPITable loaded:', { kpiCount: kpiData.length, memberCount: members.length });
    } catch (error: any) {
      console.error('Failed to load KPI table data:', error);
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

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">High</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Low</Badge>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">Loading KPI data...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2>Team Members KPI Scores</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>File Disposal Rate</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Quality of Drafting</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Responsiveness</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>TAT Score</span>
                </div>
              </TableHead>
              <TableHead className="text-center">Overall KPI</TableHead>
              <TableHead className="text-center">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamKpiData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No team member KPI data available
                </TableCell>
              </TableRow>
            ) : (
              teamKpiData.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white">{getMemberName(member.userId).charAt(0)}</span>
                      </div>
                      <span>{getMemberName(member.userId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getMemberDesignation(member.userId)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-full ${getPerformanceColor(member.fileDisposalRate || 0)}`}>
                      {(member.fileDisposalRate || 0).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-full ${getPerformanceColor(member.qualityOfDrafting || 0)}`}>
                      {(member.qualityOfDrafting || 0).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-full ${getPerformanceColor(member.responsiveness || 0)}`}>
                      {(member.responsiveness || 0).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-full ${getPerformanceColor(member.tatScore || 0)}`}>
                      {(member.tatScore || 0).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">{(member.finalKpi || 0).toFixed(1)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getPerformanceBadge(member.finalKpi || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
