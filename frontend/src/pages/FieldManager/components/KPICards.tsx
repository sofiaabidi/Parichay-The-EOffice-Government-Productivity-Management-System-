export function KPICards() {
  const managerScore = 88;
  const teamAverageScore = 83;

  const getCircleStyles = (score: number) => {
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (score / 100) * circumference;
    return { circumference, offset };
  };

  const managerStyles = getCircleStyles(managerScore);
  const teamStyles = getCircleStyles(teamAverageScore);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Manager Score Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-[#1F2937] mb-6">Manager Score</h3>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="transform -rotate-90" width="200" height="200">
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="#F3F4F6"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="rgb(22, 163, 74)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={managerStyles.circumference}
                strokeDashoffset={managerStyles.offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl text-[#1F2937]">{managerScore}</span>
              <span className="text-gray-500">out of 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Average Score Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-[#1F2937] mb-6">Team Average Score</h3>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="transform -rotate-90" width="200" height="200">
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="#F3F4F6"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="rgb(22, 163, 74)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={teamStyles.circumference}
                strokeDashoffset={teamStyles.offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl text-[#1F2937]">{teamAverageScore}</span>
              <span className="text-gray-500">out of 100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
