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
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner@2.0.3";
import { projectAPI, managerAPI } from "../../../services/api";

interface AddProjectDialogProps {
  onProjectAdded?: () => void;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  designation?: string | null;
}

export function AddProjectDialog({ onProjectAdded }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [projectData, setProjectData] = useState({
    projectName: "",
    description: "",
    deadline: "",
    startDate: "",
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (open) {
      loadTeamMembers();
    } else {
      // Reset selections when dialog closes
      setSelectedMembers([]);
    }
  }, [open]);

  const loadTeamMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await managerAPI.getTeamMembers();
      const members = response.data.members || [];
      setTeamMembers(members);
    } catch (error: any) {
      console.error('Failed to load team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectData.projectName || !projectData.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one team member for this project");
      return;
    }

    try {
      setLoading(true);
      await projectAPI.createProject({
        name: projectData.projectName,
        description: projectData.description || undefined,
        dueDate: projectData.deadline,
        startDate: projectData.startDate || undefined,
        status: 'active',
        memberIds: selectedMembers,
      });

      toast.success(`Project "${projectData.projectName}" created successfully`);

      setProjectData({
        projectName: "",
        description: "",
        deadline: "",
        startDate: "",
      });
      setSelectedMembers([]);
      setOpen(false);
      
      if (onProjectAdded) {
        onProjectAdded();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              placeholder="Enter project name"
              value={projectData.projectName}
              onChange={(e) =>
                setProjectData({ ...projectData, projectName: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              rows={3}
              value={projectData.description}
              onChange={(e) =>
                setProjectData({ ...projectData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={projectData.startDate}
                onChange={(e) =>
                  setProjectData({ ...projectData, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={projectData.deadline}
                onChange={(e) =>
                  setProjectData({ ...projectData, deadline: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team Members *</Label>
            <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
              {loadingMembers ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading team members...</div>
              ) : teamMembers.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">No team members found</div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => handleMemberToggle(member.id)}
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-gray-500">
                          {member.designation || member.role || 'Employee'}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedMembers.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </p>
            )}
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
              {loading ? "Creating..." : "Add Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
