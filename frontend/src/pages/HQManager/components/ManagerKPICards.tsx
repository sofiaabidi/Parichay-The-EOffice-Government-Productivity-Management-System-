import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { TrendingUp, Users, FileCheck } from "lucide-react";
import { managerAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

export function ManagerKPICards() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadSummary();
    }
  }, [user?.id]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getDashboardSummary();
      setSummary(response.data);
    } catch (error: any) {
      console.error('Failed to load manager summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="text-center py-4">Loading...</div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Personal KPI */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <h3 className="text-xs text-muted-foreground mb-2">
          Personal KPI
        </h3>
        <p className="text-2xl mb-2">
          {summary?.managerFinalKpi?.toFixed(1) || "0.0"}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Manager Performance</span>
        </div>
      </Card>

      {/* Average Team KPI */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <h3 className="text-xs text-muted-foreground mb-2">
          Average Team KPI
        </h3>
        <p className="text-2xl mb-2">
          {summary?.averageTeamKpi?.toFixed(1) || "0.0"}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Team Average</span>
        </div>
      </Card>

      {/* SLA Adherence */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <h3 className="text-xs text-muted-foreground mb-2">
          SLA Adherence
        </h3>
        <p className="text-2xl mb-2">
          {summary?.slaAdherence?.toFixed(1) || "0.0"}%
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Response Rate</span>
        </div>
      </Card>
    </div>
  );
}
