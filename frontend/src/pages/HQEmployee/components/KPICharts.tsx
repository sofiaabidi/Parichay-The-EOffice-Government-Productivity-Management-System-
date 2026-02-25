import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { kpiAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

export function KPICharts() {
  const { user } = useAuth();
  const [currentKpi, setCurrentKpi] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const loadKPI = async () => {
    try {
      console.log('[HQ Employee KPI Charts] Fetching current KPI data for user:', user!.id);
      const response = await kpiAPI.getEmployeeKpi(user!.id);
      console.log('[HQ Employee KPI Charts] Received current KPI data from employee_kpi_snapshots:', response.data);
      setCurrentKpi(response.data);
    } catch (error: any) {
      console.error('[HQ Employee KPI Charts] Failed to load KPI:', error);
      console.error('[HQ Employee KPI Charts] Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      console.log('[HQ Employee KPI Charts] Fetching KPI history for user:', user!.id);
      const response = await kpiAPI.getEmployeeHistory(user!.id);
      console.log('[HQ Employee KPI Charts] Received KPI history:', response.data);
      setHistory(response.data || []);
    } catch (error: any) {
      console.error('[HQ Employee KPI Charts] Failed to load KPI history:', error);
      console.error('[HQ Employee KPI Charts] Error details:', error.response?.data || error.message);
    }
  };
  
  // Refresh KPI data periodically (every 30 seconds) and when component mounts
  useEffect(() => {
    if (user?.id) {
      loadKPI();
      loadHistory();
      const interval = setInterval(() => {
        console.log('[HQ Employee KPI Charts] Auto-refreshing KPI data...');
        loadKPI();
        loadHistory();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-center py-8">Loading chart data...</div>
        </Card>
        <Card className="p-6">
          <div className="text-center py-8">Loading chart data...</div>
        </Card>
      </div>
    );
  }

  // Pie Chart Data
  const pieData = [
    { name: "File Disposal Rate", value: currentKpi?.fileDisposalRate || 0 },
    { name: "TAT Score", value: currentKpi?.tatScore || 0 },
    { name: "Quality of Drafting", value: currentKpi?.qualityOfDrafting || 0 },
    { name: "Responsiveness", value: currentKpi?.responsiveness || 0 },
    { name: "Digital Adoption", value: currentKpi?.digitalAdoption || 0 }
  ];

  // Line Chart Data - convert history to monthly format
  const lineData = history.slice(0, 12).reverse().map((item, index) => {
    const date = new Date(item.period_start);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      month: monthNames[date.getMonth()],
      score: item.finalKpi || 0
    };
  });

  // If no history, show current month
  if (lineData.length === 0 && currentKpi) {
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    lineData.push({
      month: monthNames[now.getMonth()],
      score: currentKpi.finalKpi || 0
    });
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* KPI Distribution Pie Chart */}
      <Card className="p-6">
        <h2 className="mb-6">KPI Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${value.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly KPI Trend Graph */}
      <Card className="p-6">
        <h2 className="mb-6">Monthly KPI Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <Tooltip 
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Score"]}
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem"
              }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
