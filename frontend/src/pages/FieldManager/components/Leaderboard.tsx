import { Trophy, Medal, Award } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface Employee {
  rank: number;
  name: string;
  score: number;
  avatar: string;
}

const employees: Employee[] = [
  { rank: 1, name: 'Rajesh Kumar', score: 95, avatar: 'RK' },
  { rank: 2, name: 'Priya Sharma', score: 92, avatar: 'PS' },
  { rank: 3, name: 'Amit Patel', score: 89, avatar: 'AP' },
  { rank: 4, name: 'Sneha Reddy', score: 87, avatar: 'SR' },
  { rank: 5, name: 'Vikram Singh', score: 85, avatar: 'VS' },
  { rank: 6, name: 'Anita Desai', score: 83, avatar: 'AD' },
  { rank: 7, name: 'Rahul Gupta', score: 81, avatar: 'RG' },
  { rank: 8, name: 'Kavita Nair', score: 79, avatar: 'KN' },
  { rank: 9, name: 'Sanjay Mehta', score: 76, avatar: 'SM' },
  { rank: 10, name: 'Deepa Iyer', score: 74, avatar: 'DI' },
];

export function Leaderboard() {
  const topThree = employees.slice(0, 3);
  const rest = employees.slice(3);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-[#1F2937] mb-6">Team Leaderboard</h2>

      {/* Top 3 Performers */}
      <div className="flex items-end justify-center gap-6 mb-8">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <Medal className="w-8 h-8 text-gray-400 mb-2" />
          <div className="w-20 h-20 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-2 border-2 border-gray-400">
            <span className="text-[#1F2937]">{topThree[1].avatar}</span>
          </div>
          <p className="text-[#1F2937] text-center mb-1">{topThree[1].name}</p>
          <p className="text-gray-500">Score: {topThree[1].score}</p>
          <div className="mt-2 bg-gray-100 px-4 py-8 rounded-t-lg w-28">
            <p className="text-center text-[#1F2937]">2nd</p>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          <Trophy className="w-10 h-10 text-yellow-500 mb-2" />
          <div className="w-24 h-24 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-2 border-4 border-yellow-500">
            <span className="text-[#1F2937]">{topThree[0].avatar}</span>
          </div>
          <p className="text-[#1F2937] text-center mb-1">{topThree[0].name}</p>
          <p className="text-gray-500">Score: {topThree[0].score}</p>
          <div className="mt-2 bg-yellow-100 px-4 py-12 rounded-t-lg w-28">
            <p className="text-center text-[#1F2937]">1st</p>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <Award className="w-8 h-8 text-orange-600 mb-2" />
          <div className="w-20 h-20 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-2 border-2 border-orange-600">
            <span className="text-[#1F2937]">{topThree[2].avatar}</span>
          </div>
          <p className="text-[#1F2937] text-center mb-1">{topThree[2].name}</p>
          <p className="text-gray-500">Score: {topThree[2].score}</p>
          <div className="mt-2 bg-orange-100 px-4 py-6 rounded-t-lg w-28">
            <p className="text-center text-[#1F2937]">3rd</p>
          </div>
        </div>
      </div>

      {/* Rest of the list */}
      <div className="border-t border-gray-200 pt-4">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {rest.map((employee) => (
              <div
                key={employee.rank}
                className="flex items-center gap-4 p-3 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <div className="w-8 text-center">
                  <span className="text-[#1F2937]">{employee.rank}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                  <span className="text-[#1F2937] text-sm">{employee.avatar}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[#1F2937]">{employee.name}</p>
                </div>
                <div className="text-[#1F2937]">
                  {employee.score}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
