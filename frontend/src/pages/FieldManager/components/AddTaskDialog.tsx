import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { taskAPI, fieldManagerAPI } from '../../../services/api';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  designation?: string;
}

interface Project {
  id: number;
  name: string;
  milestones?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  members?: Array<{
    user_id: number;
    name: string;
    email: string;
    designation?: string;
    role?: string;
  }>;
}

interface Skill {
  id: number;
  name: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  projectId: number;
  projects: Project[];
  onTaskAdded?: () => void;
}

export function AddTaskDialog({
  open,
  onOpenChange,
  teamMembers,
  projectId,
  projects,
  onTaskAdded,
}: AddTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([] as Skill[]);
  const [selectedSkillIds, setSelectedSkillIds] = useState([] as number[]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [taskData, setTaskData] = useState({
    taskName: "",
    deadline: "",
    assignedTo: "",
    expectedOutcome: "",
    milestoneId: "",
    budget: "",
  });

  const currentProject = projects.find((p) => p.id === projectId);
  const milestones = currentProject?.milestones || [];
  
  // Filter team members to only show project members (handpicked employees)
  // Project members have 'user_id', teamMembers have 'id'
  const projectMemberIds = currentProject?.members?.map(m => (m as any).user_id || (m as any).id) || [];
  const availableMembers = projectMemberIds.length > 0 
    ? teamMembers.filter(member => projectMemberIds.includes(member.id))
    : teamMembers; // Fallback: if project members not loaded yet, show all team members

  useEffect(() => {
    if (open && projectId) {
      // When dialog opens, ensure we have the latest project data
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        console.log('AddTaskDialog - Project found:', {
          id: proj.id,
          name: proj.name,
          milestonesCount: proj.milestones?.length || 0,
          membersCount: proj.members?.length || 0,
          milestones: proj.milestones,
          members: proj.members,
        });
      }
      // Fetch available skills
      fetchAvailableSkills();
    }
    if (!open) {
      // Reset form when dialog closes
      setTaskData({
        taskName: "",
        deadline: "",
        assignedTo: "",
        expectedOutcome: "",
        milestoneId: "",
        budget: "",
      });
      setSelectedSkillIds([]);
    }
  }, [open, projectId, projects]);

  const fetchAvailableSkills = async () => {
    try {
      setLoadingSkills(true);
      const response = await fieldManagerAPI.getAvailableSkills();
      setAvailableSkills(response.data);
    } catch (error: any) {
      console.error('Failed to fetch skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoadingSkills(false);
    }
  };

  const toggleSkill = (skillId: number) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(selectedSkillIds.filter(id => id !== skillId));
    } else {
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!taskData.taskName || !taskData.assignedTo || !taskData.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Create task via API
      await taskAPI.createTask({
        title: taskData.taskName,
        description: taskData.expectedOutcome || undefined,
        assignedTo: Number(taskData.assignedTo),
        priority: 'medium',
        dueDate: taskData.deadline,
        projectId: projectId,
        milestoneId: taskData.milestoneId ? Number(taskData.milestoneId) : undefined,
        expectedOutput: taskData.expectedOutcome || undefined,
        cost: taskData.budget || undefined,
        skillIds: selectedSkillIds.length > 0 ? selectedSkillIds : undefined,
      });
      
      const assignedMember = availableMembers.find(
        (m) => m.id === Number(taskData.assignedTo)
      );
      toast.success(
        `Task "${taskData.taskName}" assigned to ${assignedMember?.name || "team member"}`
      );

      setTaskData({
        taskName: "",
        deadline: "",
        assignedTo: "",
        expectedOutcome: "",
        milestoneId: "",
        budget: "",
      });
      onOpenChange(false);

      if (onTaskAdded) {
        onTaskAdded();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create task"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task for the project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
            <Label htmlFor="members">Members *</Label>
            <Select
              value={taskData.assignedTo}
              onValueChange={(value) =>
                setTaskData({ ...taskData, assignedTo: value })
              }
              required
            >
              <SelectTrigger id="members">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {projectMemberIds.length > 0 ? 'No project members available' : 'No team members available'}
                  </SelectItem>
                ) : (
                  availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name} - {member.designation || member.role || "Employee"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expectedOutcome">Expected Outcome Description</Label>
            <Textarea
              id="expectedOutcome"
              placeholder="Describe the expected outcome of this task"
              rows={4}
              value={taskData.expectedOutcome}
              onChange={(e) =>
                setTaskData({ ...taskData, expectedOutcome: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestone">Under What Milestone</Label>
            <Select
              value={taskData.milestoneId}
              onValueChange={(value) =>
                setTaskData({ ...taskData, milestoneId: value })
              }
            >
              <SelectTrigger id="milestone">
                <SelectValue placeholder="Select a milestone (optional)" />
              </SelectTrigger>
              <SelectContent>
                {milestones.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No milestones available
                  </SelectItem>
                ) : (
                  milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id.toString()}>
                      {milestone.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                id="budget"
                type="number"
                placeholder="Enter budget"
                value={taskData.budget}
                onChange={(e) =>
                  setTaskData({ ...taskData, budget: e.target.value })
                }
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Required Skills</Label>
            <p className="text-sm text-gray-500 mb-2">
              Select skills required for this task
            </p>
            {loadingSkills ? (
              <div className="text-sm text-gray-500">Loading skills...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id);
                  return (
                    <Badge
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      }`}
                      variant="outline"
                    >
                      {skill.name}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

