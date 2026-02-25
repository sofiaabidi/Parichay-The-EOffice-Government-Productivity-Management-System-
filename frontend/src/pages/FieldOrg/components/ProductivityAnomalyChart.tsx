import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { fieldOrgAPI } from '../../../services/api';
import { toast } from 'sonner';

interface WeeklySnapshot {
  id: number;
  timestamp: string;
  average_kpi_scores_of_field: number;
  total_field_employees: number;
  total_field_managers: number;
  created_at: string;
  updated_at: string;
}

interface PredictionResult {
  timestamp: string;
  average_kpi_scores_of_field: number;
  prediction: number;
  is_anomaly: boolean;
  anomaly_score?: number;
}

interface ChartDataPoint {
  week: string;
  productivity: number;
  anomaly: boolean;
  type: string | null;
  timestamp: string;
  anomaly_score?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const productivity = typeof data.productivity === 'number' ? data.productivity : parseFloat(data.productivity) || 0;
    const anomalyScore = data.anomaly_score !== undefined && data.anomaly_score !== null 
      ? (typeof data.anomaly_score === 'number' ? data.anomaly_score : parseFloat(data.anomaly_score) || 0)
      : undefined;
    
    return (
      <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="text-gray-900 mb-1 font-semibold">{data.week}</p>
        <p className="text-sm text-gray-600 mb-1">Productivity: {productivity.toFixed(2)}</p>
        {data.anomaly && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-600 font-medium">{data.type}</span>
          </div>
        )}
        {anomalyScore !== undefined && (
          <p className="text-xs text-gray-500 mt-1">Anomaly Score: {anomalyScore.toFixed(3)}</p>
        )}
      </div>
    );
  }
  return null;
};

export function ProductivityAnomalyChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnomalyData();
  }, []);

  const loadAnomalyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch last 12 weekly KPI snapshots from backend
      const snapshotsResponse = await fieldOrgAPI.getWeeklyKpiSnapshots(12);
      const snapshots: WeeklySnapshot[] = snapshotsResponse.data || [];

      if (snapshots.length === 0) {
        setError('No weekly KPI snapshots found');
        setLoading(false);
        return;
      }

      // Step 2: Prepare data for FastAPI prediction
      const predictionData = snapshots.map(snapshot => ({
        timestamp: snapshot.timestamp,
        average_kpi_scores_of_field: snapshot.average_kpi_scores_of_field,
      }));

      // Step 3: Call FastAPI to get predictions
      const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
      const predictionResponse = await fetch(`${fastApiUrl}/api/v1/predict/weekly-snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: predictionData,
        }),
      });

      if (!predictionResponse.ok) {
        const errorData = await predictionResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `FastAPI error: ${predictionResponse.statusText}`);
      }

      const predictionResult = await predictionResponse.json();
      const predictions: PredictionResult[] = predictionResult.predictions || [];

      // Step 4: Calculate baseline (mean of all points)
      const baseline = snapshots.reduce((sum, s) => {
        const kpi = typeof s.average_kpi_scores_of_field === 'number' 
          ? s.average_kpi_scores_of_field 
          : parseFloat(s.average_kpi_scores_of_field) || 0;
        return sum + kpi;
      }, 0) / snapshots.length;

      // Step 5: Combine snapshots with predictions and format for chart
      const chartData: ChartDataPoint[] = snapshots
        .map((snapshot, index) => {
          const prediction = predictions.find(
            p => p.timestamp === snapshot.timestamp
          ) || predictions[index]; // Fallback to index if timestamp doesn't match

          // Format week label (e.g., "Week 1", "Week 2", etc.)
          const weekNumber = snapshots.length - index;
          const weekLabel = `Week ${weekNumber}`;

          const productivity = typeof snapshot.average_kpi_scores_of_field === 'number' 
            ? snapshot.average_kpi_scores_of_field 
            : parseFloat(snapshot.average_kpi_scores_of_field) || 0;

          const anomalyScore = prediction?.anomaly_score !== undefined && prediction?.anomaly_score !== null
            ? (typeof prediction.anomaly_score === 'number' ? prediction.anomaly_score : parseFloat(prediction.anomaly_score) || 0)
            : undefined;

          // Determine anomaly type based on:
          // 1. Is it an anomaly? (prediction.is_anomaly)
          // 2. Is it above or below baseline?
          // 3. Anomaly score validation (negative scores indicate anomalies in Isolation Forest)
          let anomalyType: string | null = null;
          const isAnomaly = prediction?.is_anomaly || false;
          
          if (isAnomaly) {
            // Validate anomaly score: negative values indicate anomalies in Isolation Forest
            // Lower (more negative) scores = stronger anomaly
            // In Isolation Forest, negative scores = anomaly, positive scores = normal
            const isValidAnomaly = anomalyScore !== undefined 
              ? anomalyScore < 0  // Negative score confirms it's an anomaly
              : true; // If no score, trust the is_anomaly flag
            
            if (isValidAnomaly) {
              // High spike if above baseline, Low Dip if below baseline
              anomalyType = productivity > baseline ? 'High Spike' : 'Low Dip';
            }
            // If anomaly score is positive but marked as anomaly, it's likely a false positive
            // In this case, we don't classify it as an anomaly type (anomalyType remains null)
            // and it will be colored blue (normal)
          }

          return {
            week: weekLabel,
            productivity,
            anomaly: isAnomaly,
            type: anomalyType,
            timestamp: snapshot.timestamp,
            anomaly_score: anomalyScore,
          };
        })
        .reverse(); // Reverse to show oldest to newest (left to right)

      setData(chartData);
    } catch (err: any) {
      console.error('Failed to load anomaly data:', err);
      setError(err.message || 'Failed to load anomaly detection data');
      toast.error('Failed to load productivity anomaly data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-gray-900 mb-1">Weekly Productivity Anomaly Detection</h2>
          <p className="text-sm text-gray-600">3-month productivity analysis with anomaly highlights</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200/50 flex items-center justify-center min-h-[350px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-gray-900 mb-1">Weekly Productivity Anomaly Detection</h2>
          <p className="text-sm text-gray-600">3-month productivity analysis with anomaly highlights</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200/50 flex items-center justify-center min-h-[350px]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-2" />
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadAnomalyData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-gray-900 mb-1">Weekly Productivity Anomaly Detection</h2>
          <p className="text-sm text-gray-600">3-month productivity analysis with anomaly highlights</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200/50 flex items-center justify-center min-h-[350px]">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  // Calculate baseline (mean of all points) for reference line
  const baseline = data.reduce((sum, d) => sum + d.productivity, 0) / data.length;

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-1">Weekly Productivity Anomaly Detection</h2>
        <p className="text-sm text-gray-600">3-month productivity analysis with anomaly highlights</p>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200/50">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              label={{ value: 'Productivity Score', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <ReferenceLine 
              y={baseline} 
              stroke="#94a3b8" 
              strokeDasharray="3 3" 
              label={{ value: `Baseline: ${baseline.toFixed(1)}`, position: 'right', fontSize: 12, fill: '#64748b' }} 
            />
            <Bar dataKey="productivity" radius={[8, 8, 0, 0]} name="Weekly Productivity">
              {data.map((entry, index) => {
                // Color logic:
                // - Anomaly above baseline → High Spike (green)
                // - Anomaly below baseline → Low Dip (red)
                // - All others → Normal (blue)
                let fillColor = '#6366f1'; // Default: blue for normal
                
                if (entry.anomaly) {
                  // Validate anomaly score: negative scores indicate anomalies in Isolation Forest
                  const isValidAnomaly = entry.anomaly_score !== undefined 
                    ? entry.anomaly_score < 0 
                    : true; // If no score, trust the is_anomaly flag
                  
                  if (isValidAnomaly) {
                    if (entry.type === 'High Spike') {
                      fillColor = '#10b981'; // Green for high spike
                    } else if (entry.type === 'Low Dip') {
                      fillColor = '#ef4444'; // Red for low dip
                    }
                  }
                }
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={fillColor}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-500 rounded"></div>
            <span className="text-sm text-gray-600">Normal Week</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-sm text-gray-600">High Spike</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Low Dip</span>
          </div>
        </div>
      </div>
    </div>
  );
}
