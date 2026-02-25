import { useState } from 'react';
import { Header } from './components/Header';
import { StaffingOverview } from './components/StaffingOverview';
import { KPICircularCharts } from './components/KPICircularCharts';
import { PromotionsTraining } from './components/PromotionsTraining';
import { WorkloadForecast } from './components/WorkloadForecast';
import { ProductivityAnomalies } from './components/ProductivityAnomalies';
import { ProjectsPanel } from './components/ProjectsPanel';
import { AIInsights } from './components/AIInsights';
import { NotificationPopup } from './components/NotificationPopup';
import { AddAccountModal } from './components/AddAccountModal';
import { AssignTeamModal } from './components/AssignTeamModal';
import { FeedbackModal } from './components/FeedbackModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { EmployeeLeaderboardSection } from './components/EmployeeLeaderboardSection';
import { ManagerLeaderboardSection } from './components/ManagerLeaderboardSection';
import { Button } from './components/ui/button';
import { FileDown, UserPlus, Users, Trophy } from 'lucide-react';
import { exportToPDF } from './utils/exportPDF';
import { Toaster } from './components/ui/sonner';
import { useAuth } from "../../contexts/AuthContext";

export default function App() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState<'manager' | 'employee' | null>(null);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  const { logout } = useAuth(); // ← REAL LOGOUT
  
  const handleAssignTeamClose = () => {
    setShowAssignTeam(false);
  };
  
  const handleAssignmentChange = () => {
    // Trigger refresh of leaderboard immediately after assignment/deallocation
    setLeaderboardRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header 
        onNotificationClick={() => setShowNotifications(true)}
        onLogout={logout}  
        onFeedbackClick={() => setShowFeedback(true)}
      />
      
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <div className="flex gap-3">
          <Button 
            onClick={exportToPDF}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl px-6 shadow-lg shadow-blue-500/30"
          >
            <FileDown className="mr-2 size-5" />
            Export Report
          </Button>

          <Button 
            onClick={() => setShowAssignTeam(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-6 shadow-lg shadow-purple-500/30"
          >
            <Users className="mr-2 size-5" />
            Assign Team
          </Button>

          <Button 
            onClick={() => setShowAddAccount(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl px-6 shadow-lg shadow-emerald-500/30"
          >
            <UserPlus className="mr-2 size-5" />
            Add New Account
          </Button>

          <Button 
            onClick={() => setShowLeaderboard('manager')}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl px-6 shadow-lg shadow-violet-500/30"
          >
            <Trophy className="mr-2 size-5" />
            Manager Leaderboard
          </Button>

          <Button 
            onClick={() => setShowLeaderboard('employee')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-2xl px-6 shadow-lg shadow-cyan-500/30"
          >
            <Trophy className="mr-2 size-5" />
            Employee Leaderboard
          </Button>
        </div>

        <AIInsights />
        <ManagerLeaderboardSection refreshKey={leaderboardRefreshKey} />
        <EmployeeLeaderboardSection />
        <StaffingOverview />
        <KPICircularCharts />
        <PromotionsTraining />
        <WorkloadForecast />
        <ProductivityAnomalies />
        <ProjectsPanel />
      </main>

      <NotificationPopup open={showNotifications} onClose={() => setShowNotifications(false)} />
      <AddAccountModal open={showAddAccount} onClose={() => setShowAddAccount(false)} />
      <AssignTeamModal 
        open={showAssignTeam} 
        onClose={handleAssignTeamClose} 
        onAssignmentChange={handleAssignmentChange}
      />
      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />

      {showLeaderboard && (
        <LeaderboardModal 
          open={true}
          type={showLeaderboard}
          onClose={() => setShowLeaderboard(null)}
        />
      )}

      <Toaster position="top-right" />
    </div>
  );
}
