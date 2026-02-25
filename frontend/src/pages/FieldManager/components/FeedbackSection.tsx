import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/button';
import { fieldManagerAPI } from '../../../services/api';

interface Feedback {
  id: number;
  name: string;
  role: string;
  date: string;
  subject: string;
  comment: string;
  rating: number;
  avatar: string;
  avatarColor: string;
  sentiment?: string;
  emotion?: string;
}

// Star rating component with half-star support
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        if (rating >= starValue) {
          // Full star
          return (
            <Star
              key={i}
              className="w-4 h-4 fill-yellow-400 text-yellow-400"
            />
          );
        } else if (rating >= starValue - 0.5) {
          // Half star
          return (
            <div key={i} className="relative w-4 h-4 inline-block">
              <Star className="w-4 h-4 fill-gray-200 text-gray-200" />
              <div className="absolute left-0 top-0 overflow-hidden" style={{ width: '50%' }}>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          );
        } else {
          // Empty star
          return (
            <Star
              key={i}
              className="w-4 h-4 fill-gray-200 text-gray-200"
            />
          );
        }
      })}
    </div>
  );
}

interface FeedbackSectionProps {
  refreshTrigger?: number;
}

export function FeedbackSection({ refreshTrigger }: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, [refreshTrigger]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fieldManagerAPI.getMyFeedback();
      const feedbackData = response.data || [];

      // Transform backend data to frontend format
      const formattedFeedback: Feedback[] = feedbackData.map((f: any) => ({
        id: f.id,
        name: f.name,
        role: f.role,
        date: f.date,
        subject: f.subject,
        comment: f.comment,
        rating: f.rating,
        avatar: f.avatar,
        avatarColor: f.avatarColor,
        sentiment: f.sentiment || 'neutral',
        emotion: f.emotion || 'Neutral',
      }));

      setFeedbacks(formattedFeedback);
    } catch (error: any) {
      console.error("Failed to fetch feedback:", error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate average rating
  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

  const getSentimentColor = (sentiment: string) => {
    if (sentiment?.toLowerCase() === 'positive') return 'text-green-600';
    if (sentiment?.toLowerCase() === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getEmotionColor = (emotion: string) => {
    const positiveEmotions = ['happy', 'joyful', 'excited', 'content', 'pleased', 'satisfied', 'grateful', 'optimistic'];
    const negativeEmotions = ['sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'upset', 'annoyed'];
    const emotionLower = emotion?.toLowerCase() || '';
    
    if (positiveEmotions.includes(emotionLower)) return 'text-green-600';
    if (negativeEmotions.includes(emotionLower)) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="text-center py-8">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#1F2937] text-xl font-semibold">Feedback Received</h2>
        <div className="flex items-center gap-4">
          {/* Average Rating Box */}
          {feedbacks.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-[#1F2937] font-semibold">{averageRating.toFixed(1)} Average</span>
            </div>
          )}
          {/* Reviews Count Button */}
          <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            {feedbacks.length} Reviews
          </Button>
        </div>
      </div>

      {/* Feedback Cards Grid */}
      {feedbacks.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[#1F2937] mb-2">No Feedback Yet</h3>
          <p className="text-gray-500">You haven't received any feedback from your team members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${feedback.avatarColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-sm font-semibold">{feedback.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1F2937] font-medium">{feedback.name}, {feedback.role}</p>
                  <p className="text-sm text-gray-500">{feedback.date}</p>
                </div>
              </div>
              <p className="text-[#1F2937] font-medium text-sm mb-2">{feedback.subject}</p>
              <p className="text-[#1F2937] text-sm leading-relaxed mb-3">{feedback.comment}</p>
              <StarRating rating={feedback.rating} />
              
              {/* Sentiment and Emotion */}
              {(feedback.sentiment || feedback.emotion) && (
                <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-gray-200 items-center">
                  {/* Emotion */}
                  {feedback.emotion && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#1F2937] font-medium">Emotion:</span>
                      <span className={`font-medium capitalize ${getEmotionColor(feedback.emotion)}`}>
                        {feedback.emotion}
                      </span>
                    </div>
                  )}
                  {/* Sentiment */}
                  {feedback.sentiment && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#1F2937] font-medium">Sentiment:</span>
                      <span className={`font-medium capitalize ${getSentimentColor(feedback.sentiment)}`}>
                        {feedback.sentiment}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
