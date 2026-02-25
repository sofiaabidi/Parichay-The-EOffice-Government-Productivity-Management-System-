import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { projectAPI } from "../../../services/api";

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  due_date: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  progress_percent?: number;
}

export function ProjectProgress() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.listProjects();
      setProjects(response.data || []);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (project: Project) => {
    if (project.progress_percent !== undefined && project.progress_percent !== null) {
      return Number(project.progress_percent);
    }
    if (project.status === 'completed') return 100;
    if (project.status === 'on-hold') return 50;
    return 75;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 80) return "text-green-700 bg-green-50 border-green-200";
    if (progress >= 50) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'On Track';
      case 'on-hold': return 'At Risk';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">Loading projects...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <FolderOpen className="w-5 h-5 text-blue-600" />
        <h2>Project Progress</h2>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No projects found</div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const progress = calculateProgress(project);
            return (
              <div
                key={project.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4>{project.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(progress)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
                {project.total_tasks !== undefined && (
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{project.completed_tasks || 0} completed</span>
                    <span>{project.total_tasks} total tasks</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={progress}
                      className="h-2"
                      indicatorClassName={getProgressColor(progress)}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground min-w-[45px] text-right">
                    {progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
