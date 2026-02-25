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
import { useAuth } from "../../../contexts/AuthContext";

export function PeerFeedbackDialog({ onFeedbackAdded }: { onFeedbackAdded?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [peers, setPeers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    toUserId: "",
    regarding: "",
    rating: 0,
    comment: "",
  });

  useEffect(() => {
    if (open) {
      loadPeers();
    }
  }, [open]);

  const loadPeers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getEmployeePeers();
      console.log('Peers API response:', response);
      
      // Handle different response formats
      let peers = [];
      if (response?.data?.members) {
        peers = response.data.members;
      } else if (Array.isArray(response?.data)) {
        peers = response.data;
      } else if (Array.isArray(response)) {
        peers = response;
      }
      
      console.log('Loaded peers count:', peers.length);
      console.log('Peers data:', peers);
      
      if (peers.length === 0) {
        console.warn('No peers found. Check if employee has department set or is in a team.');
        toast.warning('No teammates found. Please ensure you are assigned to a department or team.');
      }
      
      setPeers(peers);
    } catch (error: any) {
      console.error('Failed to load peers:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load teammates';
      toast.error(errorMsg);
      setPeers([]);
    } finally {
      setLoading(false);
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
      await feedbackAPI.addPeerFeedback({
        toUserId: Number(feedbackData.toUserId),
        regarding: feedbackData.regarding || undefined,
        rating: feedbackData.rating,
        comment: feedbackData.comment || undefined,
      });

      toast.success("Feedback added successfully");
      setFeedbackData({
        toUserId: "",
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
          <DialogTitle>Add Review for Peer</DialogTitle>
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
                {loading ? (
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
                      {peer.name} - {peer.designation || peer.role || 'Employee'}
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

