import { GraduationCap, Trophy } from 'lucide-react';

export default function TrainingProgramsSection() {
  const trainings = [
    {
      id: 1,
      name: 'Digital Foundations',
      status: 'upcoming',
    },
    {
      id: 2,
      name: 'Analytics Primer',
      status: 'completed',
    },
    {
      id: 3,
      name: 'Policy Drafting Masterclass',
      status: 'in-progress',
    },
  ];

  const badges = [
    {
      id: 1,
      title: 'Best Performing Team',
      description: 'Part of the best performing department (Digital Transformation) with average KPI of 39.4 in 2025',
      awardedDate: 'Nov 27, 2025',
    },
    {
      id: 2,
      title: 'Employee of the Year',
      description: 'Highest average KPI score of 52.0 for 2025',
      awardedDate: 'Nov 27, 2025',
    },
    {
      id: 3,
      title: 'Employee of the Month',
      description: 'Highest KPI score of 52.0 for November 2025',
      awardedDate: 'Nov 27, 2025',
    },
    {
      id: 4,
      title: 'Star Collaboration Star',
      description: 'Recognized for mentoring peers',
      awardedDate: 'Nov 17, 2025',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
            In Progress
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            Upcoming
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Training Programs Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="size-5 text-[#1C1C28]" />
          <h2 className="text-[#1C1C28] text-xl font-semibold">Training Programs</h2>
        </div>

        <div className="space-y-4">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[#1C1C28] font-medium">{training.name}</h3>
                <div className="ml-4">{getStatusBadge(training.status)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="size-5 text-[#1C1C28]" />
          <h2 className="text-[#1C1C28] text-xl font-semibold">Badges</h2>
        </div>

        <div className="space-y-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="text-[#1C1C28] font-medium mb-2">{badge.title}</h3>
              <p className="text-[#6B6B6B] text-sm mb-3">{badge.description}</p>
              <div className="text-xs text-[#9CA3AF]">
                Awarded Date: {badge.awardedDate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
