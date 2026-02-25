import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import { Star } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { feedbackAPI, userAPI } from "../../../services/api";

interface ManagerFeedbackDialogProps {
  onFeedbackAdded?: () => void;
}

export function ManagerFeedbackDialog({ onFeedbackAdded }: ManagerFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    employeeId: "",
    regarding: "",
    rating: 0,
    comment: "",
  });

  useEffect(() => {
    if (open) {
      loadTeamMembers();
    }
  }, [open]);

  const loadTeamMembers = async () => {
    try {
      const response = await userAPI.getManagerTeam();
      const members = response.data?.members || [];
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
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
      await feedbackAPI.addManagerFeedback({
        employeeId: Number(feedbackData.employeeId),
        regarding: feedbackData.regarding || undefined,
        rating: feedbackData.rating,
        comment: feedbackData.comment || undefined,
      });

      toast.success("Feedback added successfully");
      setFeedbackData({
        employeeId: "",
        regarding: "",
        rating: 0,
        comment: "",
      });
      setOpen(false);
      
      if (onFeedbackAdded) {
        onFeedbackAdded();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Pencil className="w-5 h-5 text-gray-600" />
        </button>
      </DialogTrigger>
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
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name} - {member.designation || member.role || 'Employee'}
                  </SelectItem>
                ))}
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
              onClick={() => setOpen(false)}
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

