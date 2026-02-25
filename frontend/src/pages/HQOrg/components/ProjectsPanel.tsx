import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Briefcase, Calendar, Clock } from 'lucide-react';

const projects = [
  {
    name: "Cloud Migration Initiative",
    icon: "☁️",
    startDate: "Jan 15, 2025",
    expectedCompletion: "Apr 30, 2025",
    status: "Active",
    progress: 65,
    statusColor: "bg-emerald-500"
  },
  {
    name: "Customer Portal Redesign",
    icon: "🎨",
    startDate: "Feb 1, 2025",
    expectedCompletion: "May 15, 2025",
    status: "Active",
    progress: 42,
    statusColor: "bg-emerald-500"
  },
  {
    name: "Data Analytics Platform",
    icon: "📊",
    startDate: "Dec 10, 2024",
    expectedCompletion: "Mar 20, 2025",
    status: "Active",
    progress: 78,
    statusColor: "bg-emerald-500"
  },
  {
    name: "Mobile App Development",
    icon: "📱",
    startDate: "Jan 5, 2025",
    expectedCompletion: "Jun 30, 2025",
    status: "Delayed",
    progress: 35,
    statusColor: "bg-red-500"
  },
  {
    name: "Security Audit & Compliance",
    icon: "🔒",
    startDate: "Nov 20, 2024",
    expectedCompletion: "Feb 28, 2025",
    status: "Active",
    progress: 88,
    statusColor: "bg-emerald-500"
  },
  {
    name: "Employee Training Program",
    icon: "🎓",
    startDate: "Feb 10, 2025",
    expectedCompletion: "Dec 31, 2025",
    status: "On Hold",
    progress: 15,
    statusColor: "bg-amber-500"
  },
  {
    name: "Infrastructure Upgrade",
    icon: "⚙️",
    startDate: "Jan 1, 2025",
    expectedCompletion: "Mar 31, 2025",
    status: "Active",
    progress: 55,
    statusColor: "bg-emerald-500"
  },
  {
    name: "AI Integration Project",
    icon: "🤖",
    startDate: "Feb 15, 2025",
    expectedCompletion: "Aug 30, 2025",
    status: "Active",
    progress: 28,
    statusColor: "bg-emerald-500"
  }
];

const getProgressColor = (progress: number) => {
  if (progress >= 75) return 'bg-gradient-to-r from-emerald-500 to-green-500';
  if (progress >= 50) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
  if (progress >= 25) return 'bg-gradient-to-r from-amber-500 to-orange-500';
  return 'bg-gradient-to-r from-red-500 to-pink-500';
};

export function ProjectsPanel() {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">Active HQ Projects</h2>
          <p className="text-sm text-gray-600">Currently ongoing projects across all departments</p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 px-4 py-2 rounded-xl">
          {projects.length} Projects
        </Badge>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {projects.map((project, index) => (
          <div 
            key={index} 
            className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-gray-200/50 hover:scale-[1.01] duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-3xl">{project.icon}</div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{project.name}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span>Started: {project.startDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      <span>Due: {project.expectedCompletion}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Badge 
                className={`${project.statusColor} text-white border-0 px-3 py-1 rounded-lg ml-4`}
              >
                {project.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900">{project.progress}%</span>
              </div>
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
