import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner@2.0.3";
import { taskAPI, projectAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AddTaskDialogProps {
  teamMembers: TeamMember[];
  onTaskAdded?: () => void;
}

export function AddTaskDialog({ teamMembers, onTaskAdded }: AddTaskDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [taskData, setTaskData] = useState({
    taskName: "",
    description: "",
    assignedTo: "",
    deadline: "",
    priority: "medium",
    projectId: "",
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    try {
      const response = await projectAPI.listProjects();
      const projectList = (response.data || []).filter((project: any) =>
        user?.role === 'ADMIN' ? true : project.created_by === user?.id
      );
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskData.taskName || !taskData.assignedTo || !taskData.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await taskAPI.createTask({
        title: taskData.taskName,
        description: taskData.description || undefined,
        assignedTo: Number(taskData.assignedTo),
        priority: taskData.priority,
        dueDate: taskData.deadline,
        projectId: taskData.projectId ? Number(taskData.projectId) : undefined,
      });

      const assignedMember = teamMembers.find(m => m.id === Number(taskData.assignedTo));
      toast.success(`Task "${taskData.taskName}" assigned to ${assignedMember?.name || 'team member'}`);
      
      setTaskData({
        taskName: "",
        description: "",
        assignedTo: "",
        deadline: "",
        priority: "medium",
        projectId: "",
      });
      setOpen(false);
      
      if (onTaskAdded) {
        onTaskAdded();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Assign a new task to a team member. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="taskName">Task Name *</Label>
            <Input
              id="taskName"
              placeholder="Enter task name"
              value={taskData.taskName}
              onChange={(e) =>
                setTaskData({ ...taskData, taskName: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              rows={3}
              value={taskData.description}
              onChange={(e) =>
                setTaskData({ ...taskData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Under what project</Label>
            <Select
              value={taskData.projectId}
              onValueChange={(value) =>
                setTaskData({ ...taskData, projectId: value })
              }
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No projects available
                  </SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To *</Label>
            <Select
              value={taskData.assignedTo}
              onValueChange={(value) =>
                setTaskData({ ...taskData, assignedTo: value })
              }
              required
            >
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name} - {member.designation || member.role || 'Employee'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={taskData.deadline}
                onChange={(e) =>
                  setTaskData({ ...taskData, deadline: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={taskData.priority}
                onValueChange={(value) =>
                  setTaskData({ ...taskData, priority: value })
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Creating..." : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
