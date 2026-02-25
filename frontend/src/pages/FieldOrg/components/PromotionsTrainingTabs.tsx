import React, { useState, useEffect } from 'react';
import { TrendingUp, GraduationCap, Award, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fieldOrgAPI } from '../../../services/api';

interface PromotionCandidate {
  id: string;
  name: string;
  performanceScore: number;
  managerRating: number;
}

interface PromotionScore {
  user_id: number;
  name: string;
  overall_kpi: number;
  promotion_score: number;
  stars: number;
  email?: string;
  department?: string;
  designation?: string;
}

interface TrainingNeeded {
  id: string;
  name: string;
  department?: string;
  designation?: string;
  kpi: number; // Overall KPI (lower = higher training need)
  absentee: number; // Number of absent days (integer count)
  skillGap: number | null; // Average skill score (0-1, shown as percentage) or null if no tasks
  trainingNeedScore: number; // Calculated training need score (HIGHER = higher need, better candidate)
}

export function PromotionsTrainingTabs() {
  const [activeTab, setActiveTab] = useState('promotions' as 'promotions' | 'training');
  const [promotionCandidates, setPromotionCandidates] = useState([]);
  const [promotionScores, setPromotionScores] = useState([]);
  const [trainingNeeded, setTrainingNeeded] = useState([] as TrainingNeeded[]);
  const [loading, setLoading] = useState(true);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [loadingTraining, setLoadingTraining] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Refresh data when tab changes
    if (activeTab === 'promotions') {
      loadPromotionScores();
    } else if (activeTab === 'training') {
      loadTrainingRecommendations();
    }
    
    // Poll for updates every 60 seconds (less frequent than before)
    // Promotion scores are now auto-recalculated on backend when data changes
    const interval = setInterval(() => {
      if (activeTab === 'promotions') {
        loadPromotionScores();
      } else if (activeTab === 'training') {
        loadTrainingRecommendations();
      }
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPromotionScores(),
        loadPromotionCandidates(),
        loadTrainingRecommendations(),
      ]);
    } catch (error) {
      console.error('Failed to load promotions and training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromotionScores = async () => {
    try {
      setLoadingPromotions(true);
      const response = await fieldOrgAPI.getTopPromotionScores(5);
      const scores = Array.isArray(response.data) ? response.data : [];
      setPromotionScores(scores);
    } catch (error: any) {
      console.error('Failed to load promotion scores:', error);
      toast.error('Failed to load promotion scores');
      setPromotionScores([]);
    } finally {
      setLoadingPromotions(false);
    }
  };

  const loadPromotionCandidates = async () => {
    try {
      setLoadingPromotions(true);
      const response = await fieldOrgAPI.getPromotionCandidates();
      const candidates = Array.isArray(response.data) ? response.data : [];
      setPromotionCandidates(candidates);
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
      const response = await fieldOrgAPI.getTrainingRecommendations();
      const recommendations = Array.isArray(response.data) ? response.data : [];
      console.log('[Training Recommendations] Received data:', recommendations);
      recommendations.forEach((emp: TrainingNeeded) => {
        console.log(`[Training] ${emp.name}: KPI=${emp.kpi}, Absentee=${emp.absentee}, SkillGap=${emp.skillGap}`);
      });
      setTrainingNeeded(recommendations);
    } catch (error: any) {
      console.error('Failed to load training recommendations:', error);
      toast.error('Failed to load training recommendations');
      setTrainingNeeded([]);
    } finally {
      setLoadingTraining(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => {
            setActiveTab('promotions');
            loadPromotionScores();
          }}
          className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'promotions'
              ? 'bg-white shadow-sm text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Top Promotion Scores
        </button>
        <button
          onClick={() => {
            setActiveTab('training');
            loadTrainingRecommendations(); // Trigger calculation when Training Needed button is clicked
          }}
          className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'training'
              ? 'bg-white shadow-sm text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Training Needed
        </button>
      </div>

      {/* Content */}
      {activeTab === 'promotions' ? (
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Promotion scores are automatically recalculated when KPIs, attendance, or feedback change
            </p>
            <button
              onClick={() => {
                loadPromotionScores();
                toast.success('Refreshing promotion scores...');
              }}
              disabled={loadingPromotions}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPromotions ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 text-gray-700">Employee</th>
                <th className="text-left pb-3 text-gray-700">Overall KPI</th>
                <th className="text-left pb-3 text-gray-700">Promotion Score</th>
                <th className="text-left pb-3 text-gray-700">Stars</th>
                <th className="text-left pb-3 text-gray-700">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {loadingPromotions ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                  </td>
                </tr>
              ) : promotionScores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No promotion scores found. Please calculate promotion scores first.
                  </td>
                </tr>
              ) : (
                <>
                  {promotionScores.map((score, index) => {
                    const promotionScorePercent = (parseFloat(String(score.promotion_score)) * 100).toFixed(2);
                    const overallKpi = parseFloat(String(score.overall_kpi)) || 0;
                    const stars = parseFloat(String(score.stars)) || 0;
                    
                    return (
                      <tr key={score.user_id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">{index + 1}</span>
                            </div>
                            <div>
                              <span className="text-gray-900 font-medium">{score.name}</span>
                              {score.department && (
                                <div className="text-xs text-gray-500">{score.department}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, overallKpi)}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-900 font-medium">{overallKpi.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, parseFloat(promotionScorePercent))}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-900 font-semibold">{promotionScorePercent}%</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 text-lg">★</span>
                            <span className="text-gray-900 font-medium">{stars.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                            <TrendingUp className="w-4 h-4" />
                            Top Candidate
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 text-gray-700">Employee</th>
                <th className="text-left pb-3 text-gray-700">KPI</th>
                <th className="text-left pb-3 text-gray-700">Absentee</th>
                <th className="text-left pb-3 text-gray-700">Skill Gap</th>
                <th className="text-left pb-3 text-gray-700">Training Need Score</th>
              </tr>
            </thead>
            <tbody>
              {loadingTraining ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-600" />
                  </td>
                </tr>
              ) : trainingNeeded.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No training recommendations found. Click "Training Needed" to calculate.
                  </td>
                </tr>
              ) : (
                <>
                  {trainingNeeded.map((employee, index) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">{index + 1}</span>
                          </div>
                          <div>
                            <span className="text-gray-900 font-medium">{employee.name}</span>
                            {employee.department && (
                              <div className="text-xs text-gray-500">{employee.department}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium">{employee.kpi.toFixed(2)}</span>
                          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, employee.kpi)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-gray-900 font-medium">{employee.absentee}</span>
                        <span className="text-xs text-gray-500 ml-1">day{employee.absentee !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="py-4">
                        {employee.skillGap !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, employee.skillGap * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-900 font-medium">
                              {(employee.skillGap * 100).toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No tasks assigned</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-600 to-orange-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, employee.trainingNeedScore * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-900 font-semibold">
                            {employee.trainingNeedScore.toFixed(4)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
