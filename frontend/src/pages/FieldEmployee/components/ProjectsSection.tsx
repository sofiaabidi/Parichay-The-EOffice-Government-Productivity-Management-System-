import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Upload, FileText, Image as ImageIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import UploadModal from './UploadModal';
import { projectAPI, taskAPI } from '../../../services/api';
import { toast } from 'sonner';

interface Task {
  id: number;
  title: string;
  status: string;
  due_date: string;
  milestone_id?: number;
  submissions?: any[];
}

interface Milestone {
  id: number;
  name: string;
  status: string;
  deadline: string;
  expected_output?: string;
  tasks?: Task[];
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  dpr_deadline?: string;
  budget?: string;
  progress_percent?: number;
  milestones?: Milestone[];
  tasks?: Task[];
}

interface ProjectsSectionProps {
  onKpiRefresh?: () => void;
}

export default function ProjectsSection({ onKpiRefresh }: ProjectsSectionProps) {
  const [expandedProjects, setExpandedProjects] = useState<number[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ task: Task; milestone?: Milestone } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.listProjects(true); // Include details (milestones and tasks)
      const projectsData = response.data || [];
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setExpandedProjects([projectsData[0].id]);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: number) => {
    if (expandedProjects.includes(projectId)) {
      setExpandedProjects(expandedProjects.filter(id => id !== projectId));
    } else {
      setExpandedProjects([...expandedProjects, projectId]);
    }
  };

  const handleUploadClick = (task: Task, milestone?: Milestone) => {
    setSelectedTask({ task, milestone });
    setUploadModalOpen(true);
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
      case 'delayed':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="size-4" />;
      case 'in-progress':
        return <Clock className="size-4" />;
      case 'pending':
        return <AlertCircle className="size-4" />;
      default:
        return null;
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1C1C28] text-xl">My Projects</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          {projects.length} Active Projects
        </Badge>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No projects assigned</div>
      ) : (
        projects.map((project) => {
          const isExpanded = expandedProjects.includes(project.id);
          const dprDeadline = project.dpr_deadline || project.due_date;
          const daysLeft = dprDeadline ? getDaysUntilDeadline(dprDeadline) : null;

        return (
          <div key={project.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Project Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[#1C1C28] text-lg">{project.name}</h3>
                    <Badge className={getStatusColor(project.status)} variant="outline">
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-[#6B6B6B] mb-3">{project.description}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-[#6B6B6B]">Budget: </span>
                      <span className="text-[#1C1C28]">{project.budget || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#6B6B6B]">DPR Deadline: </span>
                      <span
                        className={`${daysLeft < 7 ? 'text-red-600' : daysLeft < 14 ? 'text-orange-600' : 'text-green-600'
                          }`}
                      >
                        {dprDeadline} {daysLeft !== null && `(${daysLeft} days left)`}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleProject(project.id)}
                >
                  {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#6B6B6B]">Overall Progress</span>
                  <span className="text-sm text-[#1C1C28]">{project.progress_percent || 0}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress_percent || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Expanded Content - Milestones */}
            {isExpanded && (
              <div className="p-6 space-y-4">
                <h4 className="text-[#1C1C28]">My Tasks</h4>
                {project.milestones && project.milestones.length > 0 ? (
                  project.milestones.map((milestone) => (
                    <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(milestone.status)}
                          <span className="text-[#1C1C28] font-medium">{milestone.name}</span>
                          <Badge className={getStatusColor(milestone.status)} variant="outline">
                            {milestone.status}
                          </Badge>
                        </div>
                        {milestone.deadline && (
                          <div className="text-sm text-[#6B6B6B] mb-1">
                            Deadline: {new Date(milestone.deadline).toLocaleDateString()}
                          </div>
                        )}
                        {milestone.expected_output && (
                          <div className="text-sm text-[#6B6B6B]">
                            Expected Output: {milestone.expected_output}
                          </div>
                        )}
                      </div>

                      {/* Tasks under this milestone */}
                      {milestone.tasks && milestone.tasks.length > 0 ? (
                        <div className="space-y-2 mt-3">
                          {milestone.tasks.map((task) => (
                            <div key={task.id} className="bg-gray-50 p-3 rounded border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-[#1C1C28]">{task.title}</div>
                                  <div className="text-sm text-[#6B6B6B] mt-1">
                                    Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                                  </div>
                                  {task.submissions && task.submissions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {task.submissions.map((sub: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border">
                                          {sub.mime_type?.startsWith('image/') ? (
                                            <ImageIcon className="size-3 text-blue-600" />
                                          ) : (
                                            <FileText className="size-3 text-green-600" />
                                          )}
                                          <span>{sub.original_name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(task.status)} variant="outline">
                                    {task.status}
                                  </Badge>
                                  {(task.status === 'pending' || task.status === 'in-progress') && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUploadClick(task, milestone)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <Upload className="size-3 mr-1" />
                                      Upload
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 mt-2">No tasks assigned</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-400">No milestones found</div>
                )}

              </div>
            )}
          </div>
        );
      })
      )}

      {/* Upload Modal */}
      {uploadModalOpen && selectedTask && (
        <UploadModal
          milestone={selectedTask.milestone || { id: null, name: 'General' }}
          taskId={selectedTask.task.id}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedTask(null);
          }}
          onSuccess={() => {
            fetchProjects(); // Refresh projects after upload
            // Trigger KPI refresh after task submission
            if (onKpiRefresh) {
              // Small delay to allow backend to process and recalculate
              setTimeout(() => {
                onKpiRefresh();
              }, 1000);
            }
          }}
        />
      )}
    </div>
  );
}
