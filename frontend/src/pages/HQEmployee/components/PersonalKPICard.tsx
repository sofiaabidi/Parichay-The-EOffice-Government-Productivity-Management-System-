import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Clock, CheckCircle2, Timer, Coffee } from "lucide-react";
import { kpiAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

interface KPIMetric {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: "excellent" | "average" | "needs-improvement";
}

interface PersonalKPICardProps {
  refreshTrigger?: number;
}

export function PersonalKPICard({ refreshTrigger = 0 }: PersonalKPICardProps) {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  const loadKPI = async () => {
    try {
      setLoading(true);
      console.log('[HQ Employee KPI] Fetching KPI data for user:', user!.id);
      const response = await kpiAPI.getEmployeeKpi(user!.id);
      console.log('[HQ Employee KPI] Received KPI data from employee_kpi_snapshots:', response.data);
      setKpiData(response.data);
    } catch (error: any) {
      console.error('[HQ Employee KPI] Failed to load KPI:', error);
      console.error('[HQ Employee KPI] Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh KPI data periodically (every 30 seconds) and when component mounts
  useEffect(() => {
    if (user?.id) {
      loadKPI();
      const interval = setInterval(() => {
        console.log('[HQ Employee KPI] Auto-refreshing KPI data...');
        loadKPI();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]);
  
  // Refresh when refreshTrigger changes (e.g., after task upload)
  useEffect(() => {
    if (user?.id && refreshTrigger > 0) {
      console.log('[HQ Employee KPI] Refresh trigger activated, reloading KPI data...');
      loadKPI();
    }
  }, [refreshTrigger, user?.id]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">Loading KPI data...</div>
      </Card>
    );
  }

  const overallScore = kpiData?.finalKpi || 0;
  
  const metrics: KPIMetric[] = [
    {
      label: "File Disposal Rate",
      value: kpiData?.fileDisposalRate || 0,
      unit: "%",
      icon: <CheckCircle2 className="w-5 h-5" />,
      status: (kpiData?.fileDisposalRate || 0) >= 85 ? "excellent" : (kpiData?.fileDisposalRate || 0) >= 70 ? "average" : "needs-improvement"
    },
    {
      label: "Responsiveness",
      value: kpiData?.responsiveness || 0,
      unit: "%",
      icon: <Clock className="w-5 h-5" />,
      status: (kpiData?.responsiveness || 0) >= 85 ? "excellent" : (kpiData?.responsiveness || 0) >= 70 ? "average" : "needs-improvement"
    },
    {
      label: "TAT Score",
      value: kpiData?.tatScore || 0,
      unit: "%",
      icon: <Timer className="w-5 h-5" />,
      status: (kpiData?.tatScore || 0) >= 85 ? "excellent" : (kpiData?.tatScore || 0) >= 70 ? "average" : "needs-improvement"
    },
    {
      label: "Quality of Drafting",
      value: kpiData?.qualityOfDrafting || 0,
      unit: "%",
      icon: <Coffee className="w-5 h-5" />,
      status: (kpiData?.qualityOfDrafting || 0) >= 85 ? "excellent" : (kpiData?.qualityOfDrafting || 0) >= 70 ? "average" : "needs-improvement"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    if (status === "excellent") return "bg-green-50 text-green-700 border-green-200";
    if (status === "average") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 85) return "bg-gradient-to-br from-green-50 to-green-100";
    if (score >= 70) return "bg-gradient-to-br from-yellow-50 to-yellow-100";
    return "bg-gradient-to-br from-red-50 to-red-100";
  };

  return (
    <Card className="p-6">
      <h2 className="mb-6">Personal KPI Score</h2>
      
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Overall Score Gauge */}
        <div className={`flex-shrink-0 ${getScoreBackground(overallScore)} rounded-xl p-6 flex flex-col items-center justify-center border-2 ${overallScore >= 85 ? 'border-green-200' : overallScore >= 70 ? 'border-yellow-200' : 'border-red-200'}`}>
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/50"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                className={getScoreColor(overallScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl ${getScoreColor(overallScore)}`}>{overallScore.toFixed(1)}</span>
              <span className="text-sm text-gray-600">Overall</span>
            </div>
          </div>
        </div>

        {/* Sub-metrics Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${getStatusColor(metric.status)}`}
              title={`${metric.label}: ${metric.status.replace("-", " ")}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="opacity-70">{metric.icon}</div>
                <div className="text-right">
                  <div className="text-2xl">
                    {metric.value.toFixed(1)}
                    <span className="text-sm ml-1">{metric.unit}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm opacity-80">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Excellent (≥85%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-600">Average (70-84%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-600">Needs Improvement (&lt;70%)</span>
        </div>
      </div>
    </Card>
  );
}
