import { Brain, TrendingDown, Users, AlertTriangle } from 'lucide-react';

const insights = [
  {
    id: 1,
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    text: 'Field Team Alpha may experience workload pressure next month.',
  },
  {
    id: 2,
    icon: TrendingDown,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    text: 'Productivity dip detected in 3 field staff members.',
  },
  {
    id: 3,
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    text: 'Survey & Documentation unit likely to face staffing shortage.',
  },
];

export function AIInsights() {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-gray-900">AI Data-Driven Insights</h2>
          <p className="text-sm text-gray-600">Predictive analytics and recommendations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all"
            >
              <div className="flex gap-3">
                <div className={`${insight.bg} ${insight.color} p-2 rounded-lg h-fit`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
