import { useState, useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import { LeaderboardSection } from "./components/LeaderboardSection";
import { AddTaskDialog } from "./components/AddTaskDialog";
import { AddProjectDialog } from "./components/AddProjectDialog";
import { ManagerKPICards } from "./components/ManagerKPICards";
import { KPITable } from "./components/KPITable";
import { ProjectProgress } from "./components/ProjectProgress";
import { PendingApprovals } from "./components/PendingApprovals";
import { AnalyticsCharts } from "./components/AnalyticsCharts";
import { FeedbackSection } from "./components/FeedbackSection";
import { UnifiedHeader } from "./components/UnifiedHeader";
import { managerAPI, userAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "./components/ui/button";
import { Award } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
}

// Badge Generation Button Component
function BadgeGenerationButton() {
  const [loading, setLoading] = useState(false);

  const handleGenerateBadges = async () => {
    try {
      setLoading(true);
      const response = await userAPI.generateBadges();
      toast.success(`Generated ${response.data.badgesAwarded} badges successfully!`);
      console.log('Badge generation result:', response.data);
    } catch (error: any) {
      console.error('Failed to generate badges:', error);
      toast.error(error.response?.data?.message || 'Failed to generate badges');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateBadges}
      disabled={loading}
      variant="outline"
      size="sm"
      className="text-xs bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
      title="Generate System Badges (Test)"
    >
      <Award className="w-3 h-3 mr-1" />
      {loading ? "Generating..." : "Generate Badges"}
    </Button>
  );
}

export default function App() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadTeamMembers();
    }
  }, [user?.id]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getTeamMembers();
      const members = response.data.members || [];
      setTeamMembers(members);
    } catch (error: any) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster />
      
      {/* Unified Header */}
      <UnifiedHeader />

      {/* Action Buttons Below Navbar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="grid grid-cols-3 items-center">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <AddTaskDialog teamMembers={teamMembers} onTaskAdded={loadTeamMembers} />
              <AddProjectDialog onProjectAdded={() => window.location.reload()} />
            </div>
            
            {/* Center Section - Navigation Links */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  const element = document.getElementById('top-performers');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Leaderboard
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('pending-approvals');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Manager Approvals
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('project-progress');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Track Progress
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('feedback-section');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Feedback
              </button>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center justify-end">
              <BadgeGenerationButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Manager KPI Cards */}
        <ManagerKPICards />

        {/* Leaderboard */}
        <div id="top-performers">
          <LeaderboardSection />
        </div>

        {/* KPI Table */}
        <div className="mb-8">
          <KPITable />
        </div>

        {/* Project Progress & Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div id="project-progress">
            <ProjectProgress />
          </div>
          <div id="pending-approvals">
            <PendingApprovals />
          </div>
        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts />

        {/* Feedback from Organization */}
        <div id="feedback-section">
          <FeedbackSection />
        </div>
      </main>
    </div>
  );
}
