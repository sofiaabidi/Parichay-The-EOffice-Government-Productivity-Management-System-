import { useState, useEffect } from "react";
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
import { Star } from "lucide-react";
import { toast } from "sonner";
import { fieldManagerAPI } from "../../../services/api";
import { feedbackAPI } from "../../../services/api";

interface EmployeeFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedbackAdded?: () => void;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  designation?: string;
  role?: string;
}

export function EmployeeFeedbackDialog({ open, onOpenChange, onFeedbackAdded }: EmployeeFeedbackDialogProps) {
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    employeeId: "",
    regarding: "",
    rating: 0,
    comment: "",
  });

  // Fetch team members from backend
  useEffect(() => {
    if (open) {
      fetchTeamMembers();
    }
  }, [open]);

  const fetchTeamMembers = async () => {
    try {
      setLoadingTeam(true);
      const response = await fieldManagerAPI.getMyTeam();
      // Response structure: { members: [...] } or just array
      const members = response.data.members || response.data || [];
      setTeamMembers(members);
    } catch (error: any) {
      console.error("Failed to fetch team members:", error);
      toast.error("Failed to load team members");
      setTeamMembers([]);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackData.employeeId || !feedbackData.rating) {
      toast.error("Please select an employee and provide a rating");
      return;
    }

    try {
      setLoading(true);
      
      // Submit feedback to backend
      await feedbackAPI.addManagerFeedback({
        employeeId: Number(feedbackData.employeeId),
        regarding: feedbackData.regarding || undefined,
        rating: feedbackData.rating,
        comment: feedbackData.comment || undefined,
      });
      
      const selectedEmployee = teamMembers.find(m => m.id === Number(feedbackData.employeeId));
      toast.success(`Feedback added successfully for ${selectedEmployee?.name || 'employee'}`);
      
      setFeedbackData({
        employeeId: "",
        regarding: "",
        rating: 0,
        comment: "",
      });
      onOpenChange(false);
      
      if (onFeedbackAdded) {
        onFeedbackAdded();
      }
    } catch (error: any) {
      console.error("Failed to submit feedback:", error);
      toast.error(error.response?.data?.message || "Failed to add feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Review for Employee</DialogTitle>
          <DialogDescription>
            Provide feedback for your team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee *</Label>
            <Select
              value={feedbackData.employeeId}
              onValueChange={(value) =>
                setFeedbackData({ ...feedbackData, employeeId: value })
              }
              required
            >
              <SelectTrigger id="employee">
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {loadingTeam ? (
                  <SelectItem value="loading" disabled>
                    Loading team members...
                  </SelectItem>
                ) : teamMembers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No employees available
                  </SelectItem>
                ) : (
                  teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name} - {member.designation || 'Employee'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="regarding">Regarding (Re:)</Label>
            <Input
              id="regarding"
              placeholder="e.g., Project completion, Communication skills"
              value={feedbackData.regarding}
              onChange={(e) =>
                setFeedbackData({ ...feedbackData, regarding: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= feedbackData.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                </button>
              ))}
              {feedbackData.rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {feedbackData.rating} / 5
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Description</Label>
            <Textarea
              id="comment"
              placeholder="Add your feedback comments..."
              rows={4}
              value={feedbackData.comment}
              onChange={(e) =>
                setFeedbackData({ ...feedbackData, comment: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

