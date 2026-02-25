import { Award, Trophy, Medal, Star } from 'lucide-react';
import { Badge } from './ui/badge';

export default function AwardsRecognitionSection() {
  const awards = [
    {
      id: 1,
      title: 'Employee of the Month',
      description: 'Outstanding performance in September 2025',
      date: 'Sep 30, 2025',
      type: 'award',
      icon: Trophy,
      color: 'yellow',
    },
    {
      id: 2,
      title: 'Excellence in Service',
      description: 'Recognized for exceptional stakeholder management',
      date: 'Aug 15, 2025',
      type: 'badge',
      icon: Medal,
      color: 'blue',
    },
    {
      id: 3,
      title: 'Innovation Champion',
      description: 'For implementing process improvement initiative',
      date: 'Jul 20, 2025',
      type: 'certificate',
      icon: Star,
      color: 'purple',
    },
  ];

  const getIconBgColor = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'award':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'badge':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'certificate':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1C1C28] text-xl">Recognition & Awards</h2>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-yellow-600" />
          <span className="text-[#6B6B6B]">Total recognitions:</span>
          <span className="text-[#1C1C28]">{awards.length} awards</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {awards.map((award) => {
          const Icon = award.icon;
          return (
            <div
              key={award.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-200 hover:border-blue-300"
            >
              {/* Icon Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-full ${getIconBgColor(award.color)}`}>
                  <Icon className="size-8" />
                </div>
                <Badge variant="outline" className={getTypeBadgeColor(award.type)}>
                  {award.type}
                </Badge>
              </div>

              {/* Content */}
              <h3 className="text-[#1C1C28] mb-2">{award.title}</h3>
              <p className="text-[#6B6B6B] text-sm mb-4">{award.description}</p>

              {/* Date */}
              <div className="text-xs text-[#9CA3AF] flex items-center gap-1">
                <Award className="size-3" />
                {award.date}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Stats */}
      <div className="bg-gradient-to-r from-yellow-50 via-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-yellow-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full">
              <Trophy className="size-8" />
            </div>
            <div>
              <div className="text-2xl text-[#1C1C28]">
                {awards.filter(a => a.type === 'award').length}
              </div>
              <div className="text-[#6B6B6B]">Awards</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
              <Medal className="size-8" />
            </div>
            <div>
              <div className="text-2xl text-[#1C1C28]">
                {awards.filter(a => a.type === 'badge').length}
              </div>
              <div className="text-[#6B6B6B]">Badges</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-purple-100 text-purple-600 p-4 rounded-full">
              <Star className="size-8" />
            </div>
            <div>
              <div className="text-2xl text-[#1C1C28]">
                {awards.filter(a => a.type === 'certificate').length}
              </div>
              <div className="text-[#6B6B6B]">Certificates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
