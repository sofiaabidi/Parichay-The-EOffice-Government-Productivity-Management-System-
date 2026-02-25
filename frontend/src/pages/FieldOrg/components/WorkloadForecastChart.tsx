import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Generate data for current and forecast
const generateData = () => {
  const data = [];
  const today = new Date();
  
  // Current month data (actual)
  for (let i = -15; i <= 0; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: 65 + Math.random() * 20 + Math.sin(i / 3) * 10,
      forecast: null,
      upper: null,
      lower: null,
    });
  }
  
  // Forecast data (next 15 days)
  for (let i = 1; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const forecastValue = 70 + Math.random() * 15 + Math.sin(i / 2) * 8;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: null,
      forecast: forecastValue,
      upper: forecastValue + 8,
      lower: forecastValue - 8,
    });
  }
  
  return data;
};

const data = generateData();

export function WorkloadForecastChart() {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-1">Extended Workload Forecast</h2>
        <p className="text-sm text-gray-600">Current workload vs. predicted workload with confidence intervals</p>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200/50">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              label={{ value: 'Workload Score', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px',
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            
            {/* Confidence Interval Area */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#confidenceGradient)"
              name="Confidence Interval"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="url(#confidenceGradient)"
            />
            
            {/* Actual Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              name="Current"
              connectNulls={false}
            />
            
            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#6366f1"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
