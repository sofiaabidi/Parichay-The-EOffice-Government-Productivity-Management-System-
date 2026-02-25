import { AlertTriangle, CheckCircle2, TrendingUp, Briefcase } from 'lucide-react';

const kpiData = [
  {
    icon: AlertTriangle,
    title: "Understaffed Teams",
    value: "8",
    description: "This office is understaffed — additional manpower required immediately.",
    inference: "3 departments need immediate hiring",
    color: "from-red-500 to-orange-500",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600"
  },
  {
    icon: TrendingUp,
    title: "Overstaffed Teams",
    value: "3",
    description: "This office has surplus manpower — redistribution recommended.",
    inference: "Potential for resource reallocation",
    color: "from-amber-500 to-yellow-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600"
  },
  {
    icon: CheckCircle2,
    title: "Balanced Teams",
    value: "12",
    description: "This office is optimally staffed with balanced workload distribution.",
    inference: "Maintain current staffing levels",
    color: "from-emerald-500 to-green-500",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600"
  },
  {
    icon: Briefcase,
    title: "Total Active Projects",
    value: "47",
    description: "Total number of ongoing projects currently in progress across HQ.",
    inference: "23 projects on track, 24 need monitoring",
    color: "from-blue-500 to-indigo-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600"
  }
];

export function StaffingOverview() {
  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
      <h2 className="text-gray-900 mb-6">STAFFING STATUS OVERVIEW</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-200/50 hover:scale-[1.02] duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${kpi.iconBg} p-3 rounded-xl`}>
                  <Icon className={`size-6 ${kpi.iconColor}`} />
                </div>
                <div className={`text-4xl bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`}>
                  {kpi.value}
                </div>
              </div>
              
              <h3 className="text-gray-900 text-sm mb-2">{kpi.title}</h3>
              <p className="text-gray-600 text-xs mb-3 leading-relaxed">{kpi.description}</p>
              
              <div className="pt-3 border-t border-gray-200/50">
                <p className="text-xs text-gray-500 italic">{kpi.inference}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
