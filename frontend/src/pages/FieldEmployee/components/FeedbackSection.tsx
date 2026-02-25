import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { fieldEmployeeAPI } from '../../../services/api';

interface Feedback {
  id: number;
  from: string;
  initials: string;
  role: string;
  subject: string;
  message: string;
  date: string;
  rating: number;
  sentiment?: string;
  emotion?: string;
}

interface FeedbackSectionProps {
  refreshTrigger?: number;
}

export default function FeedbackSection({ refreshTrigger }: FeedbackSectionProps) {
  const [receivedFeedbacks, setReceivedFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, [refreshTrigger]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fieldEmployeeAPI.getMyFeedback();
      const feedbackData = response.data || [];
      
      // Transform backend data to frontend format
      const formattedFeedback: Feedback[] = feedbackData.map((f: any) => ({
        id: f.id,
        from: f.from,
        initials: f.initials,
        role: f.role,
        subject: f.subject,
        message: f.message,
        date: f.date,
        rating: f.rating,
        sentiment: f.sentiment || 'neutral',
        emotion: f.emotion || 'Neutral',
      }));
      
      setReceivedFeedbacks(formattedFeedback);
    } catch (error: any) {
      console.error("Failed to fetch feedback:", error);
      setReceivedFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate average rating
  const averageRating = receivedFeedbacks.length > 0
    ? (
        receivedFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) /
        receivedFeedbacks.length
      ).toFixed(1)
    : '0.0';

  const getAvatarColor = (initials: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
      <div className="space-y-6">
        <div className="text-center py-8">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[#1C1C28] text-xl">Feedback Received</h2>
          {receivedFeedbacks.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-full px-4 py-2">
              <Star className="size-5 text-yellow-500 fill-yellow-500" />
              <span className="text-[#1C1C28]">{averageRating}</span>
              <span className="text-[#6B6B6B] text-sm">Average</span>
            </div>
          )}
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          {receivedFeedbacks.length} Reviews
        </Badge>
      </div>

      {/* Feedback Cards */}
      {receivedFeedbacks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Star className="size-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[#1C1C28] mb-2">No Feedback Yet</h3>
          <p className="text-[#6B6B6B]">
            You haven't received any feedback from your colleagues.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {receivedFeedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all"
          >
            {/* Header with Avatar and Info */}
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              <div
                className={`size-12 rounded-full ${getAvatarColor(
                  feedback.initials
                )} text-white flex items-center justify-center shrink-0`}
              >
                <span>{feedback.initials}</span>
              </div>

              {/* Name, Role, and Date */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[#1C1C28]">{feedback.from}</h3>
                    <p className="text-[#6B6B6B] text-sm">• {feedback.role}</p>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">{feedback.date}</span>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="text-[#1C1C28] mb-3">{feedback.subject}</div>

            {/* Message */}
            <p className="text-[#6B6B6B] mb-4">{feedback.message}</p>

            {/* Star Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-5 ${
                    star <= feedback.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Sentiment and Emotion */}
            {(feedback.sentiment || feedback.emotion) && (
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 items-center">
                {/* Emotion */}
                {feedback.emotion && (
                  <div className="flex items-center gap-2">
                    <h3 className="text-[#1C1C28]">Emotion:</h3>
                    <span className={`font-medium capitalize ${getEmotionColor(feedback.emotion)}`}>
                      {feedback.emotion}
                    </span>
                  </div>
                )}
                {/* Sentiment */}
                {feedback.sentiment && (
                  <div className="flex items-center gap-2">
                    <h3 className="text-[#1C1C28]">Sentiment:</h3>
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
