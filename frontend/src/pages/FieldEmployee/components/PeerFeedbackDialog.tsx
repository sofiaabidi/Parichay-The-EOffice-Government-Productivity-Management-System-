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
import { fieldEmployeeAPI } from "../../../services/api";
import { feedbackAPI } from "../../../services/api";

interface PeerFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedbackAdded?: () => void;
}

interface Peer {
  id: number;
  name: string;
  email: string;
  designation?: string;
  role?: string;
}

export function PeerFeedbackDialog({ open, onOpenChange, onFeedbackAdded }: PeerFeedbackDialogProps) {
  const [loading, setLoading] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    toUserId: "",
    regarding: "",
    rating: 0,
    comment: "",
  });

  // Fetch peers from backend
  useEffect(() => {
    if (open) {
      fetchPeers();
    }
  }, [open]);

  const fetchPeers = async () => {
    try {
      setLoadingPeers(true);
      const response = await fieldEmployeeAPI.getMyPeers();
      console.log("Peers API response:", response);
      // Response structure: { members: [...] }
      const members = response.data?.members || response.data || [];
      console.log("Parsed peers:", members);
      setPeers(members);
      if (members.length === 0) {
        console.warn("No peers found - check if user has department set correctly");
      }
    } catch (error: any) {
      console.error("Failed to fetch peers:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to load teammates");
      setPeers([]);
    } finally {
      setLoadingPeers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackData.toUserId || !feedbackData.rating) {
      toast.error("Please select a peer and provide a rating");
      return;
    }

    try {
      setLoading(true);
      
      // Submit feedback to backend
      await feedbackAPI.addPeerFeedback({
        toUserId: Number(feedbackData.toUserId),
        regarding: feedbackData.regarding || undefined,
        rating: feedbackData.rating,
        comment: feedbackData.comment || undefined,
      });
      
      const selectedPeer = peers.find(p => p.id === Number(feedbackData.toUserId));
      toast.success(`Feedback added successfully for ${selectedPeer?.name || 'peer'}`);
      
      setFeedbackData({
        toUserId: "",
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
          <DialogTitle>Peer-to-Peer Feedback</DialogTitle>
          <DialogDescription>
            Provide feedback for your teammates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="peer">Select Teammate *</Label>
            <Select
              value={feedbackData.toUserId}
              onValueChange={(value) =>
                setFeedbackData({ ...feedbackData, toUserId: value })
              }
              required
            >
              <SelectTrigger id="peer">
                <SelectValue placeholder="Choose a teammate" />
              </SelectTrigger>
              <SelectContent>
                {loadingPeers ? (
                  <SelectItem value="loading" disabled>
                    Loading teammates...
                  </SelectItem>
                ) : peers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No teammates available
                  </SelectItem>
                ) : (
                  peers.map((peer) => (
                    <SelectItem key={peer.id} value={peer.id.toString()}>
                      {peer.name} - {peer.designation || 'Employee'}
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
              placeholder="e.g., Collaboration, Problem-solving"
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

