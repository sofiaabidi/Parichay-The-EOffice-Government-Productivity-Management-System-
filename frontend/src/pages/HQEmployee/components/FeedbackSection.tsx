import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MessageSquare, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { feedbackAPI } from "../../../services/api";

interface Feedback {
  id: number;
  from_name: string;
  from_role: string;
  regarding: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  feedback_type: 'peer' | 'manager';
  sentiment?: string;
  emotion?: string;
}

export function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await feedbackAPI.getMyFeedback();
      const feedbackData = response.data || [];
      
      // Ensure sentiment and emotion fields are included
      const formattedFeedback = feedbackData.map((f: any) => ({
        ...f,
        sentiment: f.sentiment || 'neutral',
        emotion: f.emotion || 'Neutral',
      }));
      
      setFeedbacks(formattedFeedback);
    } catch (error: any) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">Loading feedback...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Feedback Received
        </h2>
        {feedbacks.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-700">{averageRating} Average</span>
          </div>
        )}
      </div>

      {feedbacks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No feedback received yet</div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-gray-300"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(feedback.from_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{feedback.from_name}</span>
                        <span className="text-xs text-gray-500">• {feedback.from_role}</span>
                        {feedback.feedback_type && (
                          <Badge className="text-xs" variant="outline">
                            {feedback.feedback_type === 'peer' ? 'Peer' : 'Manager'}
                          </Badge>
                        )}
                      </div>
                      {feedback.regarding && (
                        <div className="text-sm text-gray-600 mt-1">Re: {feedback.regarding}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < feedback.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {feedback.comment && (
                    <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                  )}

                  {/* Sentiment and Emotion */}
                  {(feedback.sentiment || feedback.emotion) && (
                    <div className="flex flex-col gap-2 mb-2 items-center">
                      {/* Emotion */}
                      {feedback.emotion && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Emotion:</span>
                          <span className={`text-sm font-medium capitalize ${getEmotionColor(feedback.emotion)}`}>
                            {feedback.emotion}
                          </span>
                        </div>
                      )}
                      {/* Sentiment */}
                      {feedback.sentiment && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Sentiment:</span>
                          <span className={`text-sm font-medium capitalize ${getSentimentColor(feedback.sentiment)}`}>
                            {feedback.sentiment}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">{formatDate(feedback.created_at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
