import { useState, useEffect } from 'react';
import { X, Trophy, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import LeaderboardModal from './LeaderboardModal';
import { fieldEmployeeAPI } from '../../../services/api';

interface ProfilePopupProps {
  onClose: () => void;
}

interface Skill {
  id: number;
  name: string;
}

export default function ProfilePopup({ onClose }: ProfilePopupProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [savedSkills, setSavedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Fetch available skills and user's saved skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const [availableRes, mySkillsRes] = await Promise.all([
          fieldEmployeeAPI.getAvailableSkills(),
          fieldEmployeeAPI.getMySkills(),
        ]);
        
        setAvailableSkills(availableRes.data);
        const savedSkillNames = mySkillsRes.data.map((s: Skill) => s.name);
        setSavedSkills(savedSkillNames);
        setSelectedSkills(savedSkillNames);
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSaveSkills = async () => {
    try {
      setSaving(true);
      await fieldEmployeeAPI.saveMySkills(selectedSkills);
      setSavedSkills(selectedSkills);
      // Optionally show a success message or close the modal
    } catch (error) {
      console.error('Error saving skills:', error);
      alert('Failed to save skills. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      ></div>

      {/* Profile Popup */}
      <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg w-96 z-50 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-[#1C1C28]">Profile</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
            <X className="size-4" />
          </Button>
        </div>

        {/* Leaderboard Position */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 text-white size-12 rounded-full flex items-center justify-center">
                <Trophy className="size-6" />
              </div>
              <div>
                <div className="text-sm text-[#6B6B6B]">Your Rank</div>
                <div className="text-[#1C1C28] text-2xl">#4</div>
              </div>
            </div>
            <Button
              onClick={() => setShowLeaderboard(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              View Leaderboard
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Skill Selection */}
        <div className="p-4">
          <h4 className="text-[#1C1C28] mb-3">Your Skills</h4>
          <p className="text-[#6B6B6B] text-sm mb-4">
            Select your skills to receive relevant task assignments
          </p>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <div className="text-sm text-gray-500">Loading skills...</div>
            ) : (
              availableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.name);
                const isSaved = savedSkills.includes(skill.name);
                // Show blue if it's saved (from database) - saved skills stay blue
                // Also show blue if currently selected (even if not saved yet)
                const isBlue = isSaved || isSelected;
                
                return (
                  <Badge
                    key={skill.id}
                    onClick={() => toggleSkill(skill.name)}
                    className={`cursor-pointer transition-all ${
                      isBlue
                        ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                    variant="outline"
                  >
                    {skill.name}
                  </Badge>
                );
              })
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 border-t">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveSkills}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Skills'}
          </Button>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  );
}
