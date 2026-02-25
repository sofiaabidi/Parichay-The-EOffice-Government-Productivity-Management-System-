import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { FolderKanban } from "lucide-react";
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

export function ProjectsSection() {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "on-hold":
        return "text-yellow-600";
      case "completed":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "on-hold":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "on-hold":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
      <h2 className="mb-6 flex items-center gap-2">
        <FolderKanban className="w-5 h-5" />
        Projects & Milestones
      </h2>

      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No projects assigned</div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const progress = calculateProgress(project);
            return (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-gray-300"
                title={`${project.name} - ${project.status}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base">{project.name}</h3>
                      <div className={`w-2 h-2 rounded-full ${getStatusDot(project.status)}`}></div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>#{project.id}</span>
                      <span>•</span>
                      <span>Due: {formatDate(project.due_date)}</span>
                      {project.total_tasks !== undefined && (
                        <>
                          <span>•</span>
                          <span>
                            {project.completed_tasks || 0}/{project.total_tasks} tasks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl ${getStatusColor(project.status)}`}>
                      {progress}%
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {project.status}
                    </div>
                  </div>
                </div>

                <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(project.status)}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-600">On Hold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600">Completed</span>
        </div>
      </div>
    </Card>
  );
}
