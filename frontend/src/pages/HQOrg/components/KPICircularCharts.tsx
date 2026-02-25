import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function KPICircularCharts() {
  const managerScore = 87;
  const employeeScore = 79;

  const managerData = [
    { value: managerScore },
    { value: 100 - managerScore }
  ];

  const employeeData = [
    { value: employeeScore },
    { value: 100 - employeeScore }
  ];

  const CircularKPI = ({ 
    score, 
    data, 
    title, 
    colors 
  }: { 
    score: number; 
    data: any[]; 
    title: string; 
    colors: string[] 
  }) => (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-gray-200/50 flex-1">
      <h3 className="text-center mb-6 text-gray-900">{title}</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Score Display */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className={`text-5xl bg-gradient-to-r ${colors[2]} bg-clip-text text-transparent`}>
            {score}
          </div>
          <p className="text-gray-600 text-sm mt-1">Score</p>
        </div>
      </div>
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {score >= 80 ? 'Excellent Performance' : score >= 60 ? 'Good Performance' : 'Needs Improvement'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CircularKPI 
        score={managerScore} 
        data={managerData} 
        title="Average Manager KPI Score"
        colors={['#3b82f6', '#e5e7eb', 'from-blue-600 to-indigo-600']}
      />
      <CircularKPI 
        score={employeeScore} 
        data={employeeData} 
        title="Average Employee KPI Score"
        colors={['#10b981', '#e5e7eb', 'from-emerald-600 to-teal-600']}
      />
    </div>
  );
}
