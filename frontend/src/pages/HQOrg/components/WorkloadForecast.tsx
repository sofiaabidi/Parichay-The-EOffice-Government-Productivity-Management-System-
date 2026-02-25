import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const forecastData = [
  { date: 'Jan 20', actual: 78, forecast: null, confidenceLow: null, confidenceHigh: null },
  { date: 'Jan 22', actual: 82, forecast: null, confidenceLow: null, confidenceHigh: null },
  { date: 'Jan 24', actual: 75, forecast: null, confidenceLow: null, confidenceHigh: null },
  { date: 'Jan 26', actual: 88, forecast: null, confidenceLow: null, confidenceHigh: null },
  { date: 'Jan 28', actual: 85, forecast: null, confidenceLow: null, confidenceHigh: null },
  { date: 'Jan 30', actual: 90, forecast: 90, confidenceLow: 85, confidenceHigh: 95 },
  { date: 'Feb 1', actual: null, forecast: 92, confidenceLow: 86, confidenceHigh: 98 },
  { date: 'Feb 3', actual: null, forecast: 87, confidenceLow: 81, confidenceHigh: 93 },
  { date: 'Feb 5', actual: null, forecast: 94, confidenceLow: 87, confidenceHigh: 101 },
  { date: 'Feb 7', actual: null, forecast: 89, confidenceLow: 82, confidenceHigh: 96 },
  { date: 'Feb 9', actual: null, forecast: 96, confidenceLow: 88, confidenceHigh: 104 },
  { date: 'Feb 11', actual: null, forecast: 91, confidenceLow: 84, confidenceHigh: 98 },
];

export function WorkloadForecast() {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-2">Extended Workload Forecast</h2>
        <p className="text-sm text-gray-600">Actual vs forecasted workload with confidence intervals</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={forecastData}>
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            label={{ value: 'Workload Score', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Confidence Interval */}
          <Area
            type="monotone"
            dataKey="confidenceHigh"
            stroke="none"
            fill="url(#confidenceGradient)"
            name="Confidence Interval"
          />
          <Area
            type="monotone"
            dataKey="confidenceLow"
            stroke="none"
            fill="#ffffff"
          />
          
          {/* Actual Line */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ r: 5, fill: '#10b981' }}
            name="Current"
            connectNulls={false}
          />
          
          {/* Forecast Line */}
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#3b82f6" 
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 5, fill: '#3b82f6' }}
            name="Forecast"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
