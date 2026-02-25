import { MapPin, Calendar, Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ActiveProjectsPanelProps {
  onViewLocation: (projectId: string) => void;
}

const projects = [
  {
    id: 'proj-1',
    name: 'Highway Survey - Phase 1',
    team: 'Survey Team A',
    startDate: '2024-01-15',
    completion: '2024-06-30',
    status: 'active',
    progress: 68,
    icon: '🛣️',
    lat: 26.166094,
    lng: 90.815865,
  },
  {
    id: 'proj-2',
    name: 'Bridge Construction',
    team: 'Engineering Team B',
    startDate: '2023-11-20',
    completion: '2024-08-15',
    status: 'active',
    progress: 45,
    icon: '🌉',
    lat: 26.2,
    lng: 90.8,
  },
  {
    id: 'proj-3',
    name: 'Road Expansion Project',
    team: 'Infrastructure Team C',
    startDate: '2024-02-01',
    completion: '2024-05-31',
    status: 'delayed',
    progress: 32,
    icon: '🚧',
    lat: 26.1,
    lng: 90.9,
  },
  {
    id: 'proj-4',
    name: 'Railway Survey',
    team: 'Survey Team D',
    startDate: '2024-03-10',
    completion: '2024-09-20',
    status: 'active',
    progress: 58,
    icon: '🚄',
    lat: 26.3,
    lng: 90.7,
  },
  {
    id: 'proj-5',
    name: 'Metro Line Extension',
    team: 'Metro Team E',
    startDate: '2024-01-05',
    completion: '2024-12-31',
    status: 'on-hold',
    progress: 25,
    icon: '🚇',
    lat: 26.0,
    lng: 90.85,
  },
  {
    id: 'proj-6',
    name: 'Drainage System Upgrade',
    team: 'Civil Team F',
    startDate: '2024-02-20',
    completion: '2024-07-15',
    status: 'active',
    progress: 72,
    icon: '💧',
    lat: 26.25,
    lng: 90.75,
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        icon: CheckCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
      };
    case 'delayed':
      return {
        label: 'Delayed',
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    case 'on-hold':
      return {
        label: 'On Hold',
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        borderColor: 'border-amber-200',
      };
    default:
      return {
        label: 'Unknown',
        icon: AlertCircle,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        borderColor: 'border-gray-200',
      };
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 70) return 'from-emerald-500 to-emerald-600';
  if (progress >= 40) return 'from-blue-500 to-blue-600';
  return 'from-amber-500 to-amber-600';
};

export function ActiveProjectsPanel({ onViewLocation }: ActiveProjectsPanelProps) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-1">Active Field Projects</h2>
        <p className="text-sm text-gray-600">Complete list of ongoing field operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
        {projects.map((project) => {
          const statusConfig = getStatusConfig(project.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={project.id}
              className={`bg-white/80 backdrop-blur rounded-xl p-5 border ${statusConfig.borderColor} hover:shadow-lg transition-all`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{project.icon}</div>
                  <div>
                    <h3 className="text-gray-900 mb-1">{project.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {project.team}
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 ${statusConfig.bg} ${statusConfig.color} rounded-lg text-sm`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Start</p>
                    <p className="text-gray-700">{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Expected</p>
                    <p className="text-gray-700">{new Date(project.completion).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm text-gray-900">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${getProgressColor(project.progress)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* View Location Button */}
              <button
                onClick={() => onViewLocation(project.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                View Location
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
