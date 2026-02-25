import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const productivityData = [
  { week: 'Week 1', productivity: 78, isAnomaly: false, type: null },
  { week: 'Week 2', productivity: 82, isAnomaly: false, type: null },
  { week: 'Week 3', productivity: 95, isAnomaly: true, type: 'High Spike' },
  { week: 'Week 4', productivity: 79, isAnomaly: false, type: null },
  { week: 'Week 5', productivity: 81, isAnomaly: false, type: null },
  { week: 'Week 6', productivity: 58, isAnomaly: true, type: 'Low Dip' },
  { week: 'Week 7', productivity: 84, isAnomaly: false, type: null },
  { week: 'Week 8', productivity: 86, isAnomaly: false, type: null },
  { week: 'Week 9', productivity: 83, isAnomaly: false, type: null },
  { week: 'Week 10', productivity: 98, isAnomaly: true, type: 'High Spike' },
  { week: 'Week 11', productivity: 80, isAnomaly: false, type: null },
  { week: 'Week 12', productivity: 85, isAnomaly: false, type: null },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200/50">
        <p className="text-sm text-gray-600 mb-1">{data.week}</p>
        <p className="text-lg text-gray-900 mb-2">Score: {data.productivity}</p>
        {data.isAnomaly && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            data.type === 'High Spike' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {data.type === 'High Spike' ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
            <span className="text-sm">{data.type}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function ProductivityAnomalies() {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-2">Weekly Productivity Anomaly Detection</h2>
        <p className="text-sm text-gray-600">3-month productivity analysis with anomaly highlights</p>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded bg-blue-500"></div>
          <span className="text-sm text-gray-600">Normal Weeks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-4 rounded bg-emerald-500"></div>
          <span className="text-sm text-gray-600">High Spike Anomaly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-4 rounded bg-red-500"></div>
          <span className="text-sm text-gray-600">Low Dip Anomaly</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={productivityData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="week" 
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            label={{ value: 'Productivity Score', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          <Bar dataKey="productivity" radius={[8, 8, 0, 0]}>
            {productivityData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  entry.isAnomaly 
                    ? entry.type === 'High Spike' 
                      ? '#10b981' 
                      : '#ef4444'
                    : '#3b82f6'
                } 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
