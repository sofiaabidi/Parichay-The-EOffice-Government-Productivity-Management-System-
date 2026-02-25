import { useState } from 'react';
import { Toaster } from 'sonner@2.0.3';
import { Header } from './components/Header';
import { AIInsights } from './components/AIInsights';
import { StaffingOverview } from './components/StaffingOverview';
import { CircularKPICharts } from './components/CircularKPICharts';
import { PromotionsTrainingTabs } from './components/PromotionsTrainingTabs';
import { WorkloadForecastChart } from './components/WorkloadForecastChart';
import { ProductivityAnomalyChart } from './components/ProductivityAnomalyChart';
import { ProjectMap } from './components/ProjectMap';
import { ActiveProjectsPanel } from './components/ActiveProjectsPanel';
import { AddAccountModal } from './components/AddAccountModal';
import { AssignTeamModal } from './components/AssignTeamModal';
import { FeedbackModal } from './components/FeedbackModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { FileDown, UserPlus, Users } from 'lucide-react';
import { generatePDFReport } from './utils/pdfGenerator';

export default function App() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState<'manager' | 'employee' | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleExportReport = () => {
    generatePDFReport();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" richColors />
      <Header onFeedbackClick={() => setShowFeedback(true)} />
      
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl"
          >
            <FileDown className="w-5 h-5" />
            Export Report
          </button>
          
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:shadow-xl"
          >
            <UserPlus className="w-5 h-5" />
            Add New Account
          </button>
          
          <button
            onClick={() => setShowAssignTeam(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 hover:shadow-xl"
          >
            <Users className="w-5 h-5" />
            Assign Team
          </button>

          <button
            onClick={() => setShowLeaderboard('manager')}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 hover:shadow-xl"
          >
            Manager Leaderboard
          </button>

          <button
            onClick={() => setShowLeaderboard('employee')}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 hover:shadow-xl"
          >
            Employee Leaderboard
          </button>
        </div>

        {/* AI Insights */}
        <AIInsights />

        {/* Staffing Overview */}
        <StaffingOverview />

        {/* Circular KPI Charts */}
        <CircularKPICharts />

        {/* Promotions & Training */}
        <PromotionsTrainingTabs />

        {/* Workload Forecast Chart */}

        {/* Productivity Anomaly Detection */}
        <ProductivityAnomalyChart />

        {/* Map Section */}
        <ProjectMap selectedProject={selectedProject} />

        {/* Active Projects Panel */}
        <ActiveProjectsPanel onViewLocation={setSelectedProject} />
      </main>

      {/* Modals */}
      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} />}
      {showAssignTeam && <AssignTeamModal onClose={() => setShowAssignTeam(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showLeaderboard && (
        <LeaderboardModal
          type={showLeaderboard}
          onClose={() => setShowLeaderboard(null)}
        />
      )}
    </div>
  );
}