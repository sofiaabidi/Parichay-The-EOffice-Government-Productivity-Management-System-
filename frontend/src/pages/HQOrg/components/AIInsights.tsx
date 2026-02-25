import { Sparkles, AlertTriangle, TrendingDown, Users } from 'lucide-react';

const insights = [
  {
    icon: AlertTriangle,
    text: "Team Alpha may experience workload pressure next month.",
    color: "text-amber-600"
  },
  {
    icon: TrendingDown,
    text: "Potential productivity dip detected in 3 employees.",
    color: "text-red-600"
  },
  {
    icon: Users,
    text: "Documentation unit is likely to face staffing shortage.",
    color: "text-orange-600"
  }
];

export function AIInsights() {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Sparkles className="size-5 text-white" />
        </div>
        <h2 className="text-gray-900">AI Data-Driven Insights</h2>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <Icon className={`size-5 ${insight.color} mt-0.5 flex-shrink-0`} />
              <p className="text-gray-700 text-sm">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
