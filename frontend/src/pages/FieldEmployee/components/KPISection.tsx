import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { fieldEmployeeAPI } from '../../../services/api';

interface KpiData {
  dprKpi: number;
  technicalComplianceKpi: number;
  surveyKpi: number;
  expenditureKpi: number;
  taskTimelinessKpi: number;
  finalKpi: number;
  periodStart?: string;
  periodEnd?: string;
}

interface KpiHistory {
  dprKpi: number;
  technicalComplianceKpi: number;
  surveyKpi: number;
  expenditureKpi: number;
  taskTimelinessKpi: number;
  finalKpi: number;
  periodStart: string;
  periodEnd: string;
}

interface DailyKpiHistory {
  day: string;
  timelinessQualityDpr: number;
  technicalComplianceProjects: number;
  surveyAccuracy: number;
  expenditureVsTargets: number;
  taskTimeliness: number;
  overallKpi: number;
  created_at?: string;
}

interface KPISectionProps {
  refreshTrigger?: number;
}

export default function KPISection({ refreshTrigger = 0 }: KPISectionProps) {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [kpiHistory, setKpiHistory] = useState<KpiHistory[]>([]);
  const [dailyKpiHistory, setDailyKpiHistory] = useState<DailyKpiHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        setLoading(true);
        console.log('[Frontend KPI] Fetching KPI data...');
        const [currentKpiResponse, historyResponse, dailyHistoryResponse] = await Promise.all([
          fieldEmployeeAPI.getMyKPI(),
          fieldEmployeeAPI.getMyKPIHistory(),
          fieldEmployeeAPI.getMyDailyKPIHistory(30),
        ]);

        // Extract data from response objects
        const currentKpi = currentKpiResponse?.data || currentKpiResponse;
        const history = historyResponse?.data || historyResponse;
        const dailyHistory = dailyHistoryResponse?.data || dailyHistoryResponse;

        console.log('[Frontend KPI] Received KPI data:', {
          currentKpi,
          hasHistory: Array.isArray(history),
          historyLength: Array.isArray(history) ? history.length : 0,
          hasDailyHistory: Array.isArray(dailyHistory),
          dailyHistoryLength: Array.isArray(dailyHistory) ? dailyHistory.length : 0
        });

        setKpiData(currentKpi);
        // Ensure history is always an array
        const historyArray = Array.isArray(history) ? history : [];
        setKpiHistory(historyArray);
        const dailyHistoryArray = Array.isArray(dailyHistory) ? dailyHistory : [];
        setDailyKpiHistory(dailyHistoryArray);

        console.log('[Frontend KPI] KPI data set:', {
          dprKpi: currentKpi?.dprKpi,
          technicalComplianceKpi: currentKpi?.technicalComplianceKpi,
          surveyKpi: currentKpi?.surveyKpi,
          expenditureKpi: currentKpi?.expenditureKpi,
          taskTimelinessKpi: currentKpi?.taskTimelinessKpi,
          finalKpi: currentKpi?.finalKpi,
          historyCount: historyArray.length,
          dailyHistoryCount: dailyHistoryArray.length
        });
      } catch (error) {
        console.error('[Frontend KPI] Error fetching KPI data:', error);
        // Set empty arrays on error
        setKpiData(null);
        setKpiHistory([]);
        setDailyKpiHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, [refreshTrigger]);

  // Helper to ensure valid number
  const ensureNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  };

  // Calculate KPI breakdown for pie chart based on contribution to final KPI
  const getKpiBreakdownData = (): Array<{ name: string; value: number; color: string; contribution: number }> => {
    if (!kpiData) {
      return [
        { name: 'Timeliness & Quality of DPR', value: 0, color: '#3B82F6', contribution: 0 },
        { name: 'Technical Compliance', value: 0, color: '#10B981', contribution: 0 },
        { name: 'Survey Accuracy', value: 0, color: '#F59E0B', contribution: 0 },
        { name: 'Expenditure vs Targets', value: 0, color: '#EF4444', contribution: 0 },
        { name: 'Task Timeliness', value: 0, color: '#8B5CF6', contribution: 0 },
      ];
    }

    // Ensure all values are valid numbers
    const dprKpi = ensureNumber(kpiData.dprKpi);
    const technicalKpi = ensureNumber(kpiData.technicalComplianceKpi);
    const surveyKpi = ensureNumber(kpiData.surveyKpi);
    const expenditureKpi = ensureNumber(kpiData.expenditureKpi);
    const timelinessKpi = ensureNumber(kpiData.taskTimelinessKpi);
    const finalKpi = ensureNumber(kpiData.finalKpi);

    if (finalKpi === 0) {
      return [
        { name: 'Timeliness & Quality of DPR', value: dprKpi, color: '#3B82F6', contribution: 0 },
        { name: 'Technical Compliance', value: technicalKpi, color: '#10B981', contribution: 0 },
        { name: 'Survey Accuracy', value: surveyKpi, color: '#F59E0B', contribution: 0 },
        { name: 'Expenditure vs Targets', value: expenditureKpi, color: '#EF4444', contribution: 0 },
        { name: 'Task Timeliness', value: timelinessKpi, color: '#8B5CF6', contribution: 0 },
      ];
    }

    // Each KPI contributes 20% (0.2 weight) to final KPI
    // Calculate contribution percentage
    const weights = {
      dpr: 0.2,
      technical: 0.2,
      survey: 0.2,
      expenditure: 0.2,
      timeliness: 0.2,
    };

    const contributions = {
      dpr: (weights.dpr * dprKpi) / finalKpi * 100,
      technical: (weights.technical * technicalKpi) / finalKpi * 100,
      survey: (weights.survey * surveyKpi) / finalKpi * 100,
      expenditure: (weights.expenditure * expenditureKpi) / finalKpi * 100,
      timeliness: (weights.timeliness * timelinessKpi) / finalKpi * 100,
    };

    return [
      { name: 'Timeliness & Quality of DPR', value: dprKpi, color: '#3B82F6', contribution: Math.max(0, contributions.dpr) },
      { name: 'Technical Compliance', value: technicalKpi, color: '#10B981', contribution: Math.max(0, contributions.technical) },
      { name: 'Survey Accuracy', value: surveyKpi, color: '#F59E0B', contribution: Math.max(0, contributions.survey) },
      { name: 'Expenditure vs Targets', value: expenditureKpi, color: '#EF4444', contribution: Math.max(0, contributions.expenditure) },
      { name: 'Task Timeliness', value: timelinessKpi, color: '#8B5CF6', contribution: Math.max(0, contributions.timeliness) },
    ];
  };

  // Format daily trend data from history - show only last 30 days (sliding window)
  const getDailyTrendData = () => {
    if (!Array.isArray(dailyKpiHistory) || dailyKpiHistory.length === 0) return [];

    // Get last 30 days only (most recent 30 entries)
    const last30Days = dailyKpiHistory.slice(-30);

    return last30Days.map((item) => {
      const date = new Date(item.day);
      const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        day: dayLabel,
        date: item.day,
        timelinessQualityDpr: ensureNumber(item.timelinessQualityDpr),
        technicalComplianceProjects: ensureNumber(item.technicalComplianceProjects),
        surveyAccuracy: ensureNumber(item.surveyAccuracy),
        expenditureVsTargets: ensureNumber(item.expenditureVsTargets),
        taskTimeliness: ensureNumber(item.taskTimeliness),
        overallKpi: ensureNumber(item.overallKpi),
      };
    });
  };

  // Calculate minimum value from all data points for dynamic Y-axis
  const getYAxisDomain = () => {
    if (dailyTrendData.length === 0) return [0, 100];

    // Get all KPI values from the data
    const allValues: number[] = [];
    dailyTrendData.forEach((item) => {
      allValues.push(
        item.timelinessQualityDpr,
        item.technicalComplianceProjects,
        item.surveyAccuracy,
        item.expenditureVsTargets,
        item.taskTimeliness,
        item.overallKpi
      );
    });

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    // Add padding: subtract 5 from min (but not below 0) and add 5 to max (but not above 100)
    const minDomain = Math.max(0, Math.floor(minValue - 5));
    const maxDomain = Math.min(100, Math.ceil(maxValue + 5));

    // Ensure we have at least a 20-point range for readability
    if (maxDomain - minDomain < 20) {
      const center = (minDomain + maxDomain) / 2;
      return [Math.max(0, Math.floor(center - 10)), Math.min(100, Math.ceil(center + 10))];
    }

    return [minDomain, maxDomain];
  };

  const kpiBreakdownData = getKpiBreakdownData();
  const dailyTrendData = getDailyTrendData();
  const yAxisDomain = getYAxisDomain();
  const overallScore = kpiData ? ensureNumber(kpiData.finalKpi) : 0;
  const circumference = 2 * Math.PI * 70;
  const progress = (overallScore / 100) * circumference;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="animate-pulse">Loading KPI data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section - Overall Performance + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Performance Circle */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-[#1C1C28] mb-4">Overall Performance</h3>
          <div className="flex items-center justify-center">
            <div className="relative size-44">
              <svg className="transform -rotate-90" width="176" height="176">
                <circle
                  cx="88"
                  cy="88"
                  r="70"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="70"
                  stroke="#10B981"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl text-[#1C1C28]">{overallScore.toFixed(1)}</div>
                <div className="text-[#6B6B6B] text-sm">/ 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Task Completion */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <Target className="size-6" />
              </div>
            </div>
            <div className="text-3xl text-[#1C1C28] mb-1">
              {kpiData ? ensureNumber(kpiData.dprKpi).toFixed(1) : '0.0'}%
            </div>
            <div className="text-[#6B6B6B]">DPR KPI</div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${kpiData ? ensureNumber(kpiData.dprKpi) : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Technical Compliance */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <BarChart3 className="size-6" />
              </div>
            </div>
            <div className="text-3xl text-[#1C1C28] mb-1">
              {kpiData ? ensureNumber(kpiData.technicalComplianceKpi).toFixed(1) : '0.0'}%
            </div>
            <div className="text-[#6B6B6B]">Technical Compliance</div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${kpiData ? ensureNumber(kpiData.technicalComplianceKpi) : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Survey Accuracy */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                <Target className="size-6" />
              </div>
            </div>
            <div className="text-3xl text-[#1C1C28] mb-1">
              {kpiData ? ensureNumber(kpiData.surveyKpi).toFixed(1) : '0.0'}%
            </div>
            <div className="text-[#6B6B6B]">Survey Accuracy</div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${kpiData ? ensureNumber(kpiData.surveyKpi) : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Expenditure vs Targets */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-red-100 text-red-600 p-3 rounded-lg">
                <TrendingUp className="size-6" />
              </div>
            </div>
            <div className="text-3xl text-[#1C1C28] mb-1">
              {kpiData ? ensureNumber(kpiData.expenditureKpi).toFixed(1) : '0.0'}%
            </div>
            <div className="text-[#6B6B6B]">Expenditure vs Targets</div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${kpiData ? ensureNumber(kpiData.expenditureKpi) : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Task Timeliness */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <Clock className="size-6" />
              </div>
            </div>
            <div className="text-3xl text-[#1C1C28] mb-1">
              {kpiData ? ensureNumber(kpiData.taskTimelinessKpi).toFixed(1) : '0.0'}%
            </div>
            <div className="text-[#6B6B6B]">Task Timeliness</div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${kpiData ? ensureNumber(kpiData.taskTimelinessKpi) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - KPI Breakdown Pie Chart + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Breakdown Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-[#1C1C28] mb-4">KPI Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpiBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, contribution }) => `${contribution.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="contribution"
                >
                  {kpiBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${props.payload.name}: ${props.payload.value.toFixed(1)}% (Contribution: ${value.toFixed(1)}%)`,
                    'Contribution'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {kpiBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-[#6B6B6B]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily KPI Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-[#1C1C28] mb-4">Daily KPI Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="day"
                  stroke="#6B6B6B"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#6B6B6B"
                  style={{ fontSize: '12px' }}
                  domain={yAxisDomain}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {/* Individual KPI lines - lighter */}
                <Line
                  type="monotone"
                  dataKey="timelinessQualityDpr"
                  stroke="#3B82F6"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  dot={false}
                  name="Timeliness & Quality of DPR"
                />
                <Line
                  type="monotone"
                  dataKey="technicalComplianceProjects"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  dot={false}
                  name="Technical Compliance"
                />
                <Line
                  type="monotone"
                  dataKey="surveyAccuracy"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  dot={false}
                  name="Survey Accuracy"
                />
                <Line
                  type="monotone"
                  dataKey="expenditureVsTargets"
                  stroke="#EF4444"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  dot={false}
                  name="Expenditure vs Targets"
                />
                <Line
                  type="monotone"
                  dataKey="taskTimeliness"
                  stroke="#8B5CF6"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  dot={false}
                  name="Task Timeliness"
                />
                {/* Overall KPI line - darker and thicker */}
                <Line
                  type="monotone"
                  dataKey="overallKpi"
                  stroke="#1C1C28"
                  strokeWidth={3}
                  strokeOpacity={1}
                  dot={{ fill: '#1C1C28', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Overall KPI"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
