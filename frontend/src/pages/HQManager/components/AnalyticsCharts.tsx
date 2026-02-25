import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card } from "./ui/card";
import { managerAPI, taskAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { userAPI } from "../../../services/api";

export function AnalyticsCharts() {
  const { user } = useAuth();
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [teamTasks, setTeamTasks] = useState<any[]>([]);
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
      const [statusRes, trendsRes, tasksRes, membersRes] = await Promise.all([
        managerAPI.getStatusBreakdown(),
        managerAPI.getTrends(),
        taskAPI.getTeamTasks(),
        userAPI.getManagerTeam(),
      ]);
      
      // Handle response - backend returns arrays directly or wrapped in data
      const statusData = Array.isArray(statusRes.data) ? statusRes.data : (Array.isArray(statusRes) ? statusRes : []);
      const trendsData = Array.isArray(trendsRes.data) ? trendsRes.data : (Array.isArray(trendsRes) ? trendsRes : []);
      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (Array.isArray(tasksRes) ? tasksRes : []);
      const members = membersRes.data?.members || (Array.isArray(membersRes.data) ? membersRes.data : []);
      
      setStatusBreakdown(statusData);
      setTrends(trendsData);
      setTeamTasks(tasksData);
      setTeamMembers(members);
      
      console.log('AnalyticsCharts loaded:', { 
        statusCount: statusData.length, 
        trendsCount: trendsData.length, 
        tasksCount: tasksData.length, 
        membersCount: members.length 
      });
    } catch (error: any) {
      console.error('Failed to load analytics data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (userId: number) => {
    const member = teamMembers.find(m => m.id === userId);
    return member?.name || `User ${userId}`;
  };

  // Task completion data by member
  const taskCompletionData = teamMembers.length > 0 ? teamMembers.map(member => {
    const memberTasks = teamTasks.filter(t => t.assigned_to === member.id);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    return {
      name: member.name?.split(' ').map((n: string) => n[0]).join('') + '.' || 'Unknown',
      tasks: completed,
    };
  }) : [];

  // Status breakdown data
  const statusBreakdownData = statusBreakdown.length > 0 ? statusBreakdown.map(item => ({
    name: item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown',
    value: item.count || 0,
  })) : [];

  // Trend data
  const trendData = trends.length > 0 ? trends.map(item => {
    const date = new Date(item.month);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      month: monthNames[date.getMonth()] || 'Unknown',
      completed: item.completed || 0,
      delayed: item.delayed || 0,
    };
  }) : [];

  const PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#9ca3af"];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="text-center py-8">Loading chart data...</div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart - Task Completion */}
      <Card className="p-6">
        <h3 className="mb-4">Completed Tasks per Team Member</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={taskCompletionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="tasks" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Pie Chart - Status Breakdown */}
      <Card className="p-6">
        <h3 className="mb-4">Task Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusBreakdownData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusBreakdownData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Line Chart - Trends */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="mb-4">Monthly Task Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#22c55e"
              strokeWidth={2}
              name="Completed"
            />
            <Line
              type="monotone"
              dataKey="delayed"
              stroke="#ef4444"
              strokeWidth={2}
              name="Delayed"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
