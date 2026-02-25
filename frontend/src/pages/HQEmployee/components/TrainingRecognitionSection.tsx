import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { GraduationCap, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { userAPI } from "../../../services/api";

interface Training {
  id: number;
  name: string;
  status: string;
  start_date: string | null;
  completion_date: string | null;
  duration_hours: number | null;
}

interface BadgeItem {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  awardedAt: string;
}

export function TrainingRecognitionSection() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgesToShow, setBadgesToShow] = useState(4); // Start with 4 badges

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trainingsRes, badgesRes] = await Promise.all([
        userAPI.getMyTrainings(),
        userAPI.getMyBadges(),
      ]);
      setTrainings(trainingsRes.data || []);
      setBadges(badgesRes.data || []);
    } catch (error: any) {
      console.error('Failed to load training/badge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMoreBadges = () => {
    setBadgesToShow(prev => prev + 5);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Completed</span>;
      case "in-progress":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">In Progress</span>;
      case "upcoming":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Upcoming</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{status}</span>;
    }
  };

  const formatBadgeDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const displayedBadges = badges.slice(0, badgesToShow);
  const hasMoreBadges = badges.length > badgesToShow;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-center py-8">Loading...</div>
        </Card>
        <Card className="p-6">
          <div className="text-center py-8">Loading...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Training Section */}
      <Card id="training-programs" className="p-6">
        <h2 className="mb-6 flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Training Programs
        </h2>
        {trainings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No training programs assigned</div>
        ) : (
          <div className="space-y-4">
            {trainings.map((training) => (
              <div
                key={training.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold">{training.name}</h3>
                  {getStatusBadge(training.status)}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {training.start_date && (
                    <div>Start: {formatDate(training.start_date)}</div>
                  )}
                  {training.completion_date && (
                    <div>Completed: {formatDate(training.completion_date)}</div>
                  )}
                  {training.duration_hours && (
                    <div>Duration: {training.duration_hours} hours</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Badges Section */}
      <Card id="badges" className="p-6">
        <h2 className="mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Badges
        </h2>
        {badges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No badges earned yet</div>
        ) : (
          <div className="space-y-4">
            {displayedBadges.map((badge) => (
              <div
                key={badge.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {badge.icon && (
                      <span className="text-lg">{badge.icon}</span>
                    )}
                    <h3 className="text-sm font-semibold">{badge.name}</h3>
                  </div>
                  <span className="text-xs text-gray-500">{formatBadgeDate(badge.awardedAt)}</span>
                </div>
                {badge.description && (
                  <p className="text-xs text-gray-700 mt-1">{badge.description}</p>
                )}
              </div>
            ))}
            {hasMoreBadges && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowMoreBadges}
                  className="w-full text-xs"
                >
                  Show More ({badges.length - badgesToShow} more)
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
