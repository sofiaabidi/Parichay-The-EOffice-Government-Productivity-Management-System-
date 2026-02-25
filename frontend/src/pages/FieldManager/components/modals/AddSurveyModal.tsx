import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { fieldManagerAPI } from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';

interface AddSurveyModalProps {
  open: boolean;
  onClose: () => void;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  designation?: string;
  role?: string;
}

interface SavedLocation {
  id: number;
  location_id: string;
  lat: number;
  lng: number;
  interest: 'Project' | 'Survey' | null;
}

export function AddSurveyModal({ open, onClose }: AddSurveyModalProps) {
  const { user } = useAuth();
  const [surveyTitle, setSurveyTitle] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [surveyLocations, setSurveyLocations] = useState<SavedLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Load team members and survey locations when modal opens
  useEffect(() => {
    if (open) {
      // Check user role before fetching
      if (user?.role !== 'FIELD_MANAGER') {
        toast.error('Access denied. Please log in as a Field Manager to create surveys.');
        onClose();
        return;
      }
      // Fetch team members and locations
      fetchTeamMembers();
      fetchSurveyLocations();
    } else {
      // Reset state when modal closes
      setTeamMembers([]);
      setSurveyLocations([]);
      setSelectedMembers([]);
    }
  }, [open, user?.role]);

  const fetchTeamMembers = async () => {
    // Only fetch if user is confirmed to be a Field Manager
    if (user?.role !== 'FIELD_MANAGER') {
      console.warn('Cannot fetch team members: user is not a Field Manager');
      setTeamMembers([]);
      return;
    }

    try {
      setLoadingTeam(true);
      const response = await fieldManagerAPI.getMyTeam();
      // Handle both array response and object with members property
      const membersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.members || response.data || []);
      
      const members = membersData.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        designation: member.designation || member.role,
        role: member.role,
      }));
      
      setTeamMembers(members);
      
      if (members.length === 0) {
        console.warn('No team members found for this Field Manager');
      }
    } catch (error: any) {
      console.error("Failed to fetch team members:", error);
      const errorData = error.response?.data;
      
      // Only show error toast if it's not a permissions error (which might be a false positive)
      // or if the user role in the error doesn't match the current user role
      if (error.response?.status === 403) {
        const errorUserRole = errorData?.userRole;
        const currentUserRole = user?.role;
        
        // Only show error if the error role doesn't match what we expect
        if (errorUserRole && errorUserRole !== currentUserRole) {
          toast.error(
            errorData?.message || "Access denied. Please ensure you're logged in as a Field Manager.",
            {
              description: `Your role: ${errorUserRole}, Required: ${errorData?.requiredRoles?.join(', ') || 'FIELD_MANAGER'}`
            }
          );
        } else {
          // Likely a false positive or token issue - just log it
          console.warn('Permission error when fetching team members, but user role appears correct:', {
            errorRole: errorUserRole,
            currentRole: currentUserRole
          });
        }
      } else {
        toast.error(errorData?.message || "Failed to load team members");
      }
      setTeamMembers([]);
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchSurveyLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await fieldManagerAPI.getMyLocations();
      const allLocations = response.data || [];
      
      // Filter only locations with interest='Survey'
      const surveyLocs = allLocations
        .filter((loc: any) => loc.interest === 'Survey')
        .map((loc: any) => ({
          id: loc.id,
          location_id: loc.location_id,
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          interest: loc.interest,
        }));
      
      setSurveyLocations(surveyLocs);
    } catch (error: any) {
      console.error("Failed to fetch survey locations:", error);
      if (error.response?.status === 403) {
        const errorData = error.response?.data;
        toast.error(
          errorData?.message || "Access denied. Please ensure you're logged in as a Field Manager.",
          {
            description: errorData?.debug 
              ? `Your role: ${errorData.debug.userRoleNormalized}, Required: ${errorData.debug.allowedRolesNormalized.join(', ')}`
              : undefined
          }
        );
      } else {
        toast.error(error.response?.data?.message || "Failed to load locations");
      }
      setSurveyLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async () => {
    if (!surveyTitle || !totalArea || !expectedTime || !deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one team member');
      return;
    }

    try {
      const surveyData = {
        name: surveyTitle,
        description: '',
        total_area: totalArea,
        expected_time: expectedTime,
        location_id: selectedLocation || null,
        deadline: deadline.toISOString().split('T')[0], // Format as YYYY-MM-DD
        member_ids: selectedMembers,
      };

      await fieldManagerAPI.createSurvey(surveyData);
      toast.success('Survey Created Successfully');
      handleClose();
    } catch (error: any) {
      console.error("Failed to create survey:", error);
      toast.error(error.response?.data?.message || 'Failed to create survey');
    }
  };

  const handleClose = () => {
    setSurveyTitle('');
    setTotalArea('');
    setExpectedTime('');
    setDeadline(undefined);
    setSelectedLocation('');
    setSelectedMembers([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1F2937]">Initiate New Survey</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="surveyTitle" className="text-[#1F2937]">Survey Title</Label>
            <Input
              id="surveyTitle"
              placeholder="Enter Survey Title"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalArea" className="text-[#1F2937]">Total Area (Sq Km/Acres)</Label>
            <Input
              id="totalArea"
              type="number"
              placeholder="Enter total area"
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedTime" className="text-[#1F2937]">Expected Time (Hours/Days)</Label>
            <Input
              id="expectedTime"
              type="number"
              placeholder="Enter expected time"
              value={expectedTime}
              onChange={(e) => setExpectedTime(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-[#1F2937]">Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="location" className="w-full border-gray-300">
                <SelectValue placeholder={loadingLocations ? "Loading locations..." : "Select a survey location"} />
              </SelectTrigger>
              <SelectContent>
                {loadingLocations ? (
                  <SelectItem value="loading" disabled>
                    Loading locations...
                  </SelectItem>
                ) : surveyLocations.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No survey locations available. Save a location with "Survey" interest first.
                  </SelectItem>
                ) : (
                  surveyLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.location_id}>
                      {loc.location_id} (Lat: {loc.lat.toFixed(4)}, Lng: {loc.lng.toFixed(4)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-[#1F2937]">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2">
                  <Input
                    id="deadline"
                    placeholder="Select deadline"
                    value={deadline ? deadline.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : ''}
                    readOnly
                    className="border-gray-300 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-[#1F2937]">Survey Members</Label>
            <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto bg-[#F3F4F6]">
              {loadingTeam ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading team members...</div>
              ) : teamMembers.length === 0 ? (
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
