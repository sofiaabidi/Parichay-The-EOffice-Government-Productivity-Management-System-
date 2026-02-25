import { useState, useEffect } from 'react';
import { X, Send, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { fieldOrgAPI } from '../../../services/api';

interface FeedbackModalProps {
  onClose: () => void;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  department: string;
  designation?: string | null;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedManager, setSelectedManager] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      setLoading(true);
      const response = await fieldOrgAPI.getAllFieldManagers();
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

  const handleSubmit = async () => {
    if (!selectedManager) {
      toast.error('Please select a manager');
      return;
    }
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    if (!feedback.trim()) {
      toast.error('Please write your feedback');
      return;
    }

    try {
      setSubmitting(true);
      await fieldOrgAPI.submitFeedbackToManager({
        managerId: selectedManager,
        rating,
        comment: feedback.trim(),
        regarding: 'General Feedback',
      });

      toast.success('Feedback submitted successfully!');
      
      // Reset form
      setSelectedManager('');
      setRating(0);
      setHoverRating(0);
      setFeedback('');
      onClose();
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2>Manager Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Manager Dropdown */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Select Manager *</label>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loading ? 'Loading managers...' : 'Choose a manager...'}
              </option>
              {loading ? (
                <option value="" disabled>Loading...</option>
              ) : managers.length === 0 ? (
                <option value="" disabled>No managers found</option>
              ) : (
                managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} — {manager.department}
                  </option>
                ))
              )}
            </select>
            {loading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading managers from database...</span>
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm text-gray-700 mb-3">Rating *</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-gray-700">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Your Feedback *</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Write your feedback here..."
              rows={5}
            />
            <p className="text-xs text-gray-500 mt-1">{feedback.length} characters</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
