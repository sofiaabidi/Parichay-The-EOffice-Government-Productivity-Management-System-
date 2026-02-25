import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectAPI, fieldManagerAPI } from '../../../../services/api';

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
}

interface Milestone {
  id: string;
  name: string;
  deadline: string;
  budget: string;
}

interface SavedLocation {
  id: number;
  location_id: string;
  name?: string;
  lat?: number;
  lng?: number;
  interest?: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  designation?: string;
  role?: string;
}

export function AddProjectModal({ open, onClose }: AddProjectModalProps) {
  const [projectTitle, setProjectTitle] = useState('');
  const [dprDeadline, setDprDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDeadline, setMilestoneDeadline] = useState('');
  const [milestoneBudget, setMilestoneBudget] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalCost, setTotalCost] = useState('');
  const [priority, setPriority] = useState('');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const handleAddMilestone = () => {
    if (!milestoneName || !milestoneDeadline) {
      toast.error('Please fill in milestone name and deadline');
      return;
    }

    const newMilestone: Milestone = {
      id: Date.now().toString(),
      name: milestoneName,
      deadline: milestoneDeadline,
      budget: milestoneBudget || '0',
    };

    setMilestones([...milestones, newMilestone]);
    setMilestoneName('');
    setMilestoneDeadline('');
    setMilestoneBudget('');
    toast.success('Milestone Added Successfully');
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // Load saved locations and team members
  useEffect(() => {
    if (open) {
      // Load saved locations from API - filter by interest = 'Project'
      fieldManagerAPI.getMyLocations()
        .then((response) => {
          const allLocations = response.data || [];
          
          // Filter locations with interest = 'Project'
          const projectLocations: SavedLocation[] = allLocations
            .filter((loc: any) => loc.interest === 'Project')
            .map((loc: any) => ({
              id: loc.id,
              location_id: loc.location_id,
              name: loc.location_id, // Use location_id as display name
              lat: Number(loc.latitude),
              lng: Number(loc.longitude),
              interest: loc.interest,
            }));
          
          setSavedLocations(projectLocations);
        })
        .catch((error) => {
          console.error('Error loading locations:', error);
          toast.error('Failed to load locations');
          setSavedLocations([]);
        });

      // Load team members from API
      fieldManagerAPI.getMyTeam()
        .then((response) => {
          const members = response.data.map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            designation: member.designation || member.role,
            role: member.role,
          }));
          setTeamMembers(members);
        })
        .catch((error) => {
          console.error('Error loading team members:', error);
          toast.error('Failed to load team members');
          // Fallback to empty array
          setTeamMembers([]);
        });
    }
  }, [open]);

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async () => {
    if (!projectTitle || !dprDeadline || !totalCost || !priority) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Prepare milestones data
      const milestonesData = milestones.map(m => ({
        name: m.name,
        deadline: m.deadline,
        budget: m.budget || '0',
        expectedOutput: '', // Can be added later if needed
      }));

      // Create project via API
      await projectAPI.createProject({
        name: projectTitle,
        description: location || undefined,
        dueDate: dprDeadline,
        startDate: new Date().toISOString().split('T')[0],
        memberIds: selectedMembers,
        milestones: milestonesData,
        budget: totalCost,
        dprDeadline: dprDeadline,
        status: 'active',
      });

      toast.success('Project Created Successfully');
      handleClose();
      
      // Trigger refresh in parent component if callback exists
      if (onClose) {
        // Small delay to ensure backend has processed
        setTimeout(() => {
          window.location.reload(); // Simple refresh - can be improved with state management
        }, 500);
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleClose = () => {
    setProjectTitle('');
    setDprDeadline('');
    setLocation('');
    setSelectedMembers([]);
    setMilestoneName('');
    setMilestoneDeadline('');
    setMilestoneBudget('');
    setMilestones([]);
    setTotalCost('');
    setPriority('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1F2937]">Create New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectTitle" className="text-[#1F2937]">Project Title</Label>
            <Input
              id="projectTitle"
              placeholder="Enter Project Name"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-[#1F2937]">Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Select a saved location" />
              </SelectTrigger>
              <SelectContent>
                {savedLocations.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No saved locations available
                  </SelectItem>
                ) : (
                  savedLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.location_id}>
                      {loc.name || loc.location_id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[#1F2937]">Project Members</Label>
            <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto bg-[#F3F4F6]">
              {teamMembers.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">No team members found</div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => handleMemberToggle(member.id)}
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="font-medium text-[#1F2937]">{member.name}</div>
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

          <div className="space-y-2">
            <Label className="text-[#1F2937]">Milestones</Label>
            <div className="p-4 border border-gray-200 rounded-lg bg-[#F3F4F6]">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  placeholder="Milestone Name"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  className="bg-white border-gray-300"
                />
                <Input
                  type="date"
                  value={milestoneDeadline}
                  onChange={(e) => setMilestoneDeadline(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    placeholder="Budget"
                    value={milestoneBudget}
                    onChange={(e) => setMilestoneBudget(e.target.value)}
                    className="bg-white border-gray-300 pl-8"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddMilestone}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>

              {milestones.length > 0 && (
                <div className="mt-4 space-y-2">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="text-[#1F2937]">{milestone.name}</p>
                        <p className="text-sm text-gray-500">{new Date(milestone.deadline).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Budget: ₹{milestone.budget || '0'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMilestone(milestone.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dprDeadline" className="text-[#1F2937]">DPR Deadline</Label>
            <Input
              id="dprDeadline"
              type="date"
              value={dprDeadline}
              onChange={(e) => setDprDeadline(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCost" className="text-[#1F2937]">Total Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                id="totalCost"
                type="number"
                placeholder="0.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="pl-8 border-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-[#1F2937]">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    High
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    Low
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#1F2937] hover:bg-gray-800 text-white">
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
