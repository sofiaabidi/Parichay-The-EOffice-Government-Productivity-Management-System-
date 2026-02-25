import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { TrendingUp, BookOpen, Loader2 } from 'lucide-react';
import { hqOrgAPI } from '../../../services/api';
import { toast } from 'sonner@2.0.3';

interface PromotionCandidate {
  id: string;
  name: string;
  department: string;
  designation?: string;
  performanceScore: number;
  managerRating: number;
}

interface TrainingRecommendation {
  id: string;
  name: string;
  department: string;
  designation?: string;
  performanceIssues: string;
  attendanceScore: number;
  skillGap: string;
}

export function PromotionsTraining() {
  const [activeTab, setActiveTab] = useState('promotions');
  const [promotionCandidates, setPromotionCandidates] = useState<PromotionCandidate[]>([]);
  const [trainingNeeded, setTrainingNeeded] = useState<TrainingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [loadingTraining, setLoadingTraining] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPromotionCandidates(),
        loadTrainingRecommendations(),
      ]);
    } catch (error) {
      console.error('Failed to load promotions and training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromotionCandidates = async () => {
    try {
      setLoadingPromotions(true);
      const response = await hqOrgAPI.getPromotionCandidates();
      setPromotionCandidates(response.data || []);
    } catch (error: any) {
      console.error('Failed to load promotion candidates:', error);
      toast.error('Failed to load promotion candidates');
      setPromotionCandidates([]);
    } finally {
      setLoadingPromotions(false);
    }
  };

  const loadTrainingRecommendations = async () => {
    try {
      setLoadingTraining(true);
      const response = await hqOrgAPI.getTrainingRecommendations();
      setTrainingNeeded(response.data || []);
    } catch (error: any) {
      console.error('Failed to load training recommendations:', error);
      toast.error('Failed to load training recommendations');
      setTrainingNeeded([]);
    } finally {
      setLoadingTraining(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/80 p-1 rounded-xl mb-6">
          <TabsTrigger value="promotions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="size-4 mr-2" />
            Promotion Candidates
          </TabsTrigger>
          <TabsTrigger value="training" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="size-4 mr-2" />
            Training Needed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="mt-0">
          {loadingPromotions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading promotion candidates...</span>
            </div>
          ) : promotionCandidates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No promotion candidates found. Employees need a KPI score of 85 or higher to be considered.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50">
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Employee</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Performance Score</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Manager Rating</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionCandidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 ring-2 ring-gray-200/50 bg-gradient-to-br from-blue-500 to-indigo-500">
                            <AvatarFallback className="text-white">{getInitials(candidate.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-gray-900 font-medium">{candidate.name}</div>
                            {candidate.designation && (
                              <div className="text-xs text-gray-500">{candidate.designation}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {candidate.performanceScore}
                          </div>
                          <span className="text-gray-500 text-sm">/ 100</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                            {candidate.managerRating > 0 ? candidate.managerRating.toFixed(1) : 'N/A'}
                          </div>
                          {candidate.managerRating > 0 && (
                            <span className="text-gray-500 text-sm">/ 5.0</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 rounded-lg px-4 py-1">
                          Promote
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="training" className="mt-0">
          {loadingTraining ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading training recommendations...</span>
            </div>
          ) : trainingNeeded.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No training recommendations found. All employees are performing well!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50">
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Employee</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Performance Issues</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Attendance Score</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Skill Gap</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingNeeded.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 ring-2 ring-gray-200/50 bg-gradient-to-br from-amber-500 to-orange-500">
                            <AvatarFallback className="text-white">{getInitials(employee.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-gray-900 font-medium">{employee.name}</div>
                            {employee.designation && (
                              <div className="text-xs text-gray-500">{employee.designation}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700 text-sm">{employee.performanceIssues}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`text-2xl ${employee.attendanceScore >= 80 ? 'text-emerald-600' : employee.attendanceScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {employee.attendanceScore}
                          </div>
                          <span className="text-gray-500 text-sm">/ 100</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 rounded-lg px-3 py-1">
                          {employee.skillGap}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 rounded-lg px-4 py-1">
                          Training
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}