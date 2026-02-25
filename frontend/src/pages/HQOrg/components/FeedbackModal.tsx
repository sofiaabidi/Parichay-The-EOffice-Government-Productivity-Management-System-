import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Star, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { hqOrgAPI } from '../../../services/api';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  department: string;
  designation?: string | null;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      loadManagers();
    }
  }, [open]);

  const loadManagers = async () => {
    try {
      setLoading(true);
      const response = await hqOrgAPI.getAllManagers();
      const managersData = Array.isArray(response.data) ? response.data : [];
      setManagers(managersData);
    } catch (error: any) {
      console.error('Failed to load managers:', error);
      toast.error('Failed to load managers list');
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedManagerId) {
      toast.error('Please select a manager');
      return;
    }

    if (rating === 0) {
      toast.error('Please provide a star rating');
      return;
    }

    if (!description.trim()) {
      toast.error('Please write your feedback');
      return;
    }

    try {
      setSubmitting(true);
      await hqOrgAPI.submitFeedbackToManager({
        managerId: selectedManagerId,
        rating,
        comment: description.trim(),
        regarding: 'General Feedback',
      });

      toast.success('Feedback submitted successfully.');
      
      // Reset form
      setSelectedManagerId('');
      setRating(0);
      setHoverRating(0);
      setDescription('');
      onClose();
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedManagerId('');
    setRating(0);
    setHoverRating(0);
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Star className="size-5 text-white" />
            </div>
            <span>Submit Feedback</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Share your feedback with a manager to help them improve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Manager Selection */}
          <div className="space-y-2">
            <Label className="text-gray-700">Select Manager *</Label>
            <Select 
              value={selectedManagerId} 
              onValueChange={setSelectedManagerId}
              disabled={loading}
            >
              <SelectTrigger className="rounded-xl border-gray-300">
                <SelectValue placeholder={loading ? "Loading managers..." : "Choose a manager"} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading managers...</span>
                  </div>
                ) : managers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No managers found
                  </div>
                ) : (
                  managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name} — {manager.department}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-gray-700">Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110 focus:outline-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`size-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">Feedback Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write your feedback here..."
              className="rounded-xl border-gray-300 min-h-[120px] resize-none"
              required
            />
            <p className="text-xs text-gray-500">
              {description.length} / 500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl px-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
