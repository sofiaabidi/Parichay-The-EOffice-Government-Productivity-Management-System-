import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import { TopNavBar } from "./components/TopNavBar";
import { ActionBar } from "./components/ActionBar";
import { Leaderboard } from "./components/Leaderboard";
import { KPICards } from "./components/KPICards";
import { OngoingActivitiesTable } from "./components/OngoingActivitiesTable";
import { FeedbackSection } from "./components/FeedbackSection";
import { Toaster } from "./components/ui/sonner";
import { MapSection } from "./components/MapSection";
import { PendingApprovalsSection } from "./components/PendingApprovalsSection";

export default function FieldManagerApp() {
  const [totalTime, setTotalTime] = useState("00:00");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  const handleFeedbackAdded = () => {
    setFeedbackRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavBar
        totalTime={totalTime}
        isCheckedIn={isCheckedIn}
        onCheckIn={() => setIsCheckedIn(true)}
        onCheckOut={() => setIsCheckedIn(false)}
        onFeedbackAdded={handleFeedbackAdded}
      />

     
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <ActionBar />
        <Leaderboard />
        <KPICards />
        <OngoingActivitiesTable />
        <PendingApprovalsSection />
        <MapSection />
        <FeedbackSection refreshTrigger={feedbackRefreshTrigger} />
      </main>

      <Toaster />
    </div>
  );
}
