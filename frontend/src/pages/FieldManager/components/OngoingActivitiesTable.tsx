import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Check, X, FileText, Image as ImageIcon, Eye, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { AddTaskDialog } from './AddTaskDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { projectAPI, fieldManagerAPI, taskAPI } from '../../../services/api';

interface SubmissionFile {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url?: string;
}

interface Task {
  id: number;
  title: string;
  name?: string; // For backward compatibility
  assignedTo?: string;
  assigned_to_name?: string;
  assigned_to?: number;
  deadline: string;
  due_date?: string;
  status: 'assigned' | 'awaiting-approval' | 'completed' | 'pending' | 'in-progress' | 'awaiting-review' | 'delayed';
  submissions?: SubmissionFile[];
  cost?: string;
  milestone_id?: number;
}

interface Milestone {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | string;
  progress?: number;
  progress_percent?: number;
  deadline?: string;
  budget?: string;
  expected_output?: string;
  expectedOutcome?: string;
  tasks?: Task[];
  isFinalDPR?: boolean;
  total_tasks?: number;
  completed_tasks?: number;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  dpr_deadline?: string | null;
  budget?: string | null;
  progress_percent?: number;
  total_tasks?: number;
  completed_tasks?: number;
  milestones?: Milestone[];
  members?: Array<{
    user_id: number;
    name: string;
    email: string;
    designation?: string;
    role?: string;
  }>;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  designation?: string;
}

export function OngoingActivitiesTable() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<number[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    projectId: number;
    milestoneId: number;
    taskId: number;
    taskName: string
  } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [reviewDPRDialogOpen, setReviewDPRDialogOpen] = useState(false);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<number | null>(null);
  const [dprRatings, setDprRatings] = useState({
    authenticity: 0,
    useOfCorrectData: 0,
    technicalCorrectness: 0,
    completeness: 0,
    toolsAndResourcesUsed: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load team members
      const teamRes = await fieldManagerAPI.getMyTeam();
      const members = (teamRes.data || []).map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        designation: member.designation || member.role,
        role: member.role,
      }));
      setTeamMembers(members);

      // Load projects with full details (milestones and tasks)
      const projectsRes = await projectAPI.listProjects(true);
      const projectsData = projectsRes.data || [];
      
      // Debug: Log raw API response
      console.log('Raw API response:', projectsRes);
      if (projectsData.length > 0) {
        const firstProj = projectsData[0];
        console.log('First project from API:', {
          id: firstProj.id,
          name: firstProj.name,
          budget: firstProj.budget,
          budgetType: typeof firstProj.budget,
          milestones: firstProj.milestones,
          milestonesType: typeof firstProj.milestones,
          milestonesIsArray: Array.isArray(firstProj.milestones),
          milestonesLength: firstProj.milestones ? firstProj.milestones.length : 'undefined'
        });
      }
      
      // Transform projects data to match our interface
      const transformedProjects: Project[] = projectsData.map((proj: any) => {
        // Ensure milestones and members arrays exist
        const milestonesArray = Array.isArray(proj.milestones) ? proj.milestones : [];
        const membersArray = Array.isArray(proj.members) ? proj.members : [];
        
        return {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        status: proj.status || 'active',
        due_date: proj.due_date,
        dpr_deadline: proj.dpr_deadline || null,
        budget: (proj.budget !== null && proj.budget !== undefined && proj.budget !== '') ? String(proj.budget) : null,
        progress_percent: proj.progress_percent || 0,
        total_tasks: proj.total_tasks || 0,
        completed_tasks: proj.completed_tasks || 0,
        members: membersArray.map((mem: any) => ({
          user_id: mem.user_id || mem.userId || mem.id,
          name: mem.name || '',
          email: mem.email || '',
          designation: mem.designation || mem.role || '',
          role: mem.role || '',
        })),
        milestones: milestonesArray.map((mil: any) => ({
          id: mil.id,
          name: mil.name || '',
          status: mil.status || 'pending',
          progress: mil.progress_percent !== undefined && mil.progress_percent !== null
            ? mil.progress_percent
            : (mil.total_tasks && mil.total_tasks > 0 
                ? Math.round((mil.completed_tasks || 0) / mil.total_tasks * 100)
                : 0),
          deadline: mil.deadline || null,
          budget: mil.budget || null,
          expected_output: mil.expected_output || null,
          expectedOutcome: mil.expected_output || null,
          total_tasks: mil.total_tasks || 0,
          completed_tasks: mil.completed_tasks || 0,
          isFinalDPR: mil.isFinalDPR || mil.name === 'Final DPR Submission', // Map backend flag or check name
          tasks: Array.isArray(mil.tasks) ? mil.tasks.map((task: any) => ({
            id: task.id,
            title: task.title || '',
            name: task.title || '',
            assignedTo: task.assigned_to_name || 'Unassigned',
            assigned_to_name: task.assigned_to_name || '',
            assigned_to: task.assigned_to || null,
            deadline: task.due_date || task.deadline || null,
            due_date: task.due_date || null,
            status: mapTaskStatus(task.status || 'pending'),
            cost: task.cost ? `₹${task.cost}` : undefined,
            milestone_id: task.milestone_id || null,
            submissions: Array.isArray(task.submissions) ? task.submissions.map((sub: any) => ({
              id: sub.id?.toString() || sub.file_document_id?.toString() || 'unknown',
              name: sub.original_name || 'Unknown file',
              type: sub.mime_type?.startsWith('image/') ? 'image' : 'pdf',
              url: sub.storage_path || '',
            })) : [],
          })) : [],
        })),
        };
      });
      
      setProjects(transformedProjects);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load projects and team members');
    } finally {
    setLoading(false);
    }
  };

  const mapTaskStatus = (status: string): 'assigned' | 'awaiting-approval' | 'completed' | 'pending' | 'in-progress' | 'awaiting-review' | 'delayed' => {
    switch (status) {
      case 'pending': return 'pending';
      case 'in-progress': return 'in-progress';
      case 'awaiting-review': return 'awaiting-approval';
      case 'completed': return 'completed';
      case 'delayed': return 'delayed';
      default: return 'assigned';
    }
  };

  const toggleProject = (projectId: number) => {
    if (expandedProjects.includes(projectId)) {
      setExpandedProjects(expandedProjects.filter(id => id !== projectId));
    } else {
      setExpandedProjects([...expandedProjects, projectId]);
    }
  };

  const handleAddTaskClick = (projectId: number) => {
    setSelectedProjectId(projectId);
    setAddTaskDialogOpen(true);
  };

  const handleTaskAdded = () => {
    toast.success('Task added successfully');
    setAddTaskDialogOpen(false);
    setSelectedProjectId(null);
    loadData(); // Reload data to show the new task
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'active':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'awaiting-approval':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleTakeAction = (projectId: number, milestoneId: number, taskId: number, taskName: string) => {
    setSelectedTask({ projectId, milestoneId, taskId, taskName });
    setFeedback('');
    setActionDialogOpen(true);
  };

  const handleAcceptTask = async () => {
    if (!selectedTask) return;

    if (!feedback.trim()) {
      toast.error('Please enter feedback before accepting');
      return;
    }

    try {
      await taskAPI.updateTaskStatus(selectedTask.taskId, 'completed', new Date().toISOString(), {
        rating: 5,
        comment: feedback,
    });
    toast.success('Task accepted successfully');
    setActionDialogOpen(false);
    setFeedback('');
    setSelectedTask(null);
      loadData(); // Reload to show updated status
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept task');
    }
  };

  const handleRejectTask = async () => {
    if (!selectedTask) return;

    if (!feedback.trim()) {
      toast.error('Please enter feedback before rejecting');
      return;
    }

    try {
      await taskAPI.updateTaskStatus(selectedTask.taskId, 'rejected', undefined, {
        rating: 1,
        comment: feedback,
    });
    toast.success('Task rejected');
    setActionDialogOpen(false);
    setFeedback('');
    setSelectedTask(null);
      loadData(); // Reload to show updated status
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject task');
    }
  };

  const handleReviewDPR = (projectId: number) => {
    setSelectedProjectForReview(projectId);
    setDprRatings({
      authenticity: 0,
      useOfCorrectData: 0,
      technicalCorrectness: 0,
      completeness: 0,
      toolsAndResourcesUsed: 0,
    });
    setReviewDPRDialogOpen(true);
  };

  const handleSubmitDPRReview = async () => {
    if (!selectedProjectForReview) {
      toast.error('Project not selected');
      return;
    }

    // Check if all ratings are provided
    const ratings = Object.values(dprRatings) as number[];
    const allRated = ratings.every((rating) => rating > 0);
    if (!allRated) {
      toast.error('Please rate all parameters');
      return;
    }

    try {
      // Map frontend field names to backend field names
      // No employeeId - backend will apply to all employees in the project
      await fieldManagerAPI.submitDprReview(selectedProjectForReview, {
        authenticity_stars: dprRatings.authenticity,
        data_correctness_stars: dprRatings.useOfCorrectData,
        technical_correctness_stars: dprRatings.technicalCorrectness,
        completeness_stars: dprRatings.completeness,
        tools_and_resources_stars: dprRatings.toolsAndResourcesUsed,
        actual_submission_date: new Date().toISOString().split('T')[0],
      });

      toast.success('DPR Review submitted successfully for all project employees');
      setReviewDPRDialogOpen(false);
      setSelectedProjectForReview(null);
      setDprRatings({
        authenticity: 0,
        useOfCorrectData: 0,
        technicalCorrectness: 0,
        completeness: 0,
        toolsAndResourcesUsed: 0,
      });
      loadData(); // Reload to show updated data
    } catch (error: any) {
      console.error('Error submitting DPR review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit DPR review');
    }
  };

  const StarRating = ({
    rating,
    onRatingChange,
    label
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    label: string;
  }) => {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1F2937]">{label}</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-6 h-6 transition-colors ${star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
                  }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
          )}
        </div>
      </div>
    );
  };

  const calculateProgress = (project: Project) => {
    if (project.progress_percent !== undefined && project.progress_percent !== null) {
      return Number(project.progress_percent);
    }
    if (project.status === 'completed') return 100;
    if (project.status === 'on-hold') return 50;
    return 0;
  };

  const activeProjects = projects.filter(p => p.status === 'active' || !p.status || p.status === 'in-progress');

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="text-center py-8">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-[#1F2937] text-xl font-semibold">My Projects</h2>
          <Badge className="bg-blue-50 text-blue-700 border-blue-300 px-3 py-1 rounded-lg">
            {activeProjects.length} Active Projects
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {activeProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active projects found</div>
        ) : (
          activeProjects.map((project) => {
            const isExpanded = expandedProjects.includes(project.id);
            const progress = calculateProgress(project);
            const daysLeft = getDaysUntilDeadline(project.dpr_deadline || project.due_date);
            const milestones = project.milestones || [];

            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Project Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[#1F2937] text-lg font-semibold">{project.name}</h3>
                        <Badge className={`${getStatusColor('active')} px-3 py-1 rounded-full`}>
                          active
                        </Badge>
                      </div>
                      <p className="text-[#6B6B6B] mb-3">{project.description || 'No description available'}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-[#6B6B6B]">Budget: </span>
                          <span className="text-[#1F2937]">
                            {project.budget ? (project.budget.startsWith('₹') ? project.budget : `₹${project.budget}`) : '₹N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B6B6B]">DPR Deadline: </span>
                          <span
                            className={daysLeft !== null && daysLeft < 0 ? 'text-red-600' : daysLeft !== null && daysLeft < 7 ? 'text-orange-600' : 'text-[#1F2937]'}
                          >
                            {formatDate(project.dpr_deadline || project.due_date)} {daysLeft !== null && `(${daysLeft < 0 ? '-' : ''}${Math.abs(daysLeft)} days left)`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTaskClick(project.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleProject(project.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#6B6B6B]">Overall Progress</span>
                      <span className="text-sm text-[#1F2937]">{progress}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Milestones */}
                {isExpanded && (
                  <div className="p-6 space-y-4 bg-gray-50">
                    <h4 className="text-[#1F2937] font-semibold">Milestones</h4>
                    {milestones && milestones.length > 0 ? (
                      milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[#1F2937] font-medium">{milestone.name}</span>
                              <Badge className={`${getMilestoneStatusColor(milestone.status)} px-2 py-0.5 rounded-full text-xs`}>
                                {milestone.status}
                              </Badge>
                            </div>
                            {milestone.deadline && (
                              <div className="text-sm text-[#6B6B6B] mb-2">
                                Deadline: {formatDate(milestone.deadline)}
                              </div>
                            )}
                            {milestone.budget && (
                              <div className="text-sm text-[#6B6B6B] mb-2">
                                Budget: {milestone.budget}
                              </div>
                            )}
                            {(milestone.expectedOutcome || milestone.expected_output) && (
                              <div className="text-sm text-[#6B6B6B]">
                                Expected Outcome: {milestone.expectedOutcome || milestone.expected_output}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Milestone Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#6B6B6B]">Progress</span>
                            <span className="text-xs text-[#1F2937]">
                              {milestone.progress !== undefined ? milestone.progress : 
                               (milestone.total_tasks && milestone.total_tasks > 0 
                                 ? Math.round((milestone.completed_tasks || 0) / milestone.total_tasks * 100)
                                 : 0)}%
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${milestone.status === 'completed' ? 'bg-green-600' :
                                milestone.status === 'in-progress' ? 'bg-yellow-600' :
                                  'bg-gray-400'
                                }`}
                              style={{ 
                                width: `${milestone.progress !== undefined ? milestone.progress : 
                                        (milestone.total_tasks && milestone.total_tasks > 0 
                                          ? Math.round((milestone.completed_tasks || 0) / milestone.total_tasks * 100)
                                          : 0)}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Review DPR Button for Final DPR Preparation milestone */}
                        {milestone.isFinalDPR && (
                          <div className="mt-4">
                            <Button
                              onClick={() => handleReviewDPR(project.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              size="sm"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Review DPR
                            </Button>
                          </div>
                        )}

                        {/* Tasks Table */}
                        {milestone.tasks && milestone.tasks.length > 0 && (
                          <div className="mt-4">
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Task ID</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Task Name</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Assigned To</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Deadline</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Status</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Submissions</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Cost</th>
                                    <th className="text-center py-2 px-3 text-xs font-semibold text-[#6B6B6B]">Take Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {milestone.tasks.map((task) => (
                                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="py-3 px-3 text-sm text-[#1F2937]">{task.id}</td>
                                      <td className="py-3 px-3 text-sm text-[#1F2937]">{task.name || task.title}</td>
                                      <td className="py-3 px-3 text-sm text-[#1F2937]">{task.assignedTo || task.assigned_to_name || 'Unassigned'}</td>
                                      <td className="py-3 px-3 text-sm text-[#1F2937]">{formatDate(task.deadline || task.due_date)}</td>
                                      <td className="py-3 px-3">
                                        <Badge className={`${getTaskStatusColor(task.status)} px-2 py-0.5 rounded-full text-xs`}>
                                          {task.status}
                                        </Badge>
                                      </td>
                                      <td className="py-3 px-3">
                                        {task.submissions && task.submissions.length > 0 ? (
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {task.submissions.map((file) => (
                                              <div
                                                key={file.id}
                                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-[#1F2937] hover:bg-gray-200 cursor-pointer"
                                                onClick={() => toast.info(`Opening ${file.name}`)}
                                              >
                                                {file.type === 'pdf' ? (
                                                  <FileText className="w-3 h-3 text-red-600" />
                                                ) : (
                                                  <ImageIcon className="w-3 h-3 text-blue-600" />
                                                )}
                                                <span className="max-w-[100px] truncate">{file.name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-gray-400">No submissions</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-sm text-[#1F2937]">
                                        {task.cost || 'N/A'}
                                      </td>
                                      <td className="py-3 px-3">
                                        {(task.status === 'awaiting-approval' || task.status === 'awaiting-review') && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                            onClick={() => handleTakeAction(project.id, milestone.id, task.id, task.name || task.title)}
                                          className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                                        >
                                          Take Action
                                        </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {milestones && milestones.length === 0 
                          ? "No milestones added yet. Add milestones when creating a project."
                          : "Loading milestones..."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Dialog */}
      {addTaskDialogOpen && selectedProjectId && (
        <AddTaskDialog
          open={addTaskDialogOpen}
          onOpenChange={setAddTaskDialogOpen}
          teamMembers={teamMembers}
          projectId={selectedProjectId}
          projects={projects}
          onTaskAdded={handleTaskAdded}
        />
      )}

      {/* Take Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Take Action</DialogTitle>
            <DialogDescription>
              Review and take action on task: {selectedTask?.taskName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback / Description *</Label>
              <Textarea
                id="feedback"
                placeholder="Enter your feedback or description here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-32"
              />
              <p className="text-xs text-gray-500">Please provide feedback before accepting or rejecting the task.</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setFeedback('');
                setSelectedTask(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectTask}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleAcceptTask}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review DPR Dialog */}
      <Dialog open={reviewDPRDialogOpen} onOpenChange={setReviewDPRDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review DPR</DialogTitle>
            <DialogDescription>
              Rate the DPR submission for: {projects.find(p => p.id === selectedProjectForReview)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <StarRating
              label="1. Authenticity"
              rating={dprRatings.authenticity}
              onRatingChange={(rating) => setDprRatings({ ...dprRatings, authenticity: rating })}
            />
            <StarRating
              label="2. Use of Correct Data"
              rating={dprRatings.useOfCorrectData}
              onRatingChange={(rating) => setDprRatings({ ...dprRatings, useOfCorrectData: rating })}
            />
            <StarRating
              label="3. Technical Correctness"
              rating={dprRatings.technicalCorrectness}
              onRatingChange={(rating) => setDprRatings({ ...dprRatings, technicalCorrectness: rating })}
            />
            <StarRating
              label="4. Completeness"
              rating={dprRatings.completeness}
              onRatingChange={(rating) => setDprRatings({ ...dprRatings, completeness: rating })}
            />
            <StarRating
              label="5. Tools & Resources Used"
              rating={dprRatings.toolsAndResourcesUsed}
              onRatingChange={(rating) => setDprRatings({ ...dprRatings, toolsAndResourcesUsed: rating })}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReviewDPRDialogOpen(false);
                setSelectedProjectForReview(null);
                setDprRatings({
                  authenticity: 0,
                  useOfCorrectData: 0,
                  technicalCorrectness: 0,
                  completeness: 0,
                  toolsAndResourcesUsed: 0,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDPRReview}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
