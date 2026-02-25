import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MessageSquare, Star, Loader2 } from "lucide-react";
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
      
      // Filter to show only feedback from organization (HQ_ORG or FIELD_ORG roles)
      const orgFeedback = feedbackData
        .filter((f: Feedback) => 
          f.feedback_type === 'peer' && 
          (f.from_role === 'HQ_ORG' || f.from_role === 'FIELD_ORG' || f.from_role === 'ADMIN')
        )
        .map((f: any) => ({
          ...f,
          sentiment: f.sentiment || 'neutral',
          emotion: f.emotion || 'Neutral',
        }));
      
      setFeedbacks(orgFeedback);
      console.log('Organization feedback loaded:', orgFeedback.length);
    } catch (error: any) {
      console.error('Failed to load feedback:', error);
      setFeedbacks([]);
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
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading feedback...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Feedback from Organization</h2>
        </div>
        {feedbacks.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-700 font-medium">{averageRating} Average</span>
          </div>
        )}
      </div>

      {feedbacks.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-700 font-medium mb-2">No Feedback Yet</h3>
          <p className="text-gray-500 text-sm">You haven't received any feedback from organization heads yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all hover:border-blue-300 bg-gradient-to-r from-white to-blue-50/30"
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {getInitials(feedback.from_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-gray-900">{feedback.from_name}</span>
                        <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                          Organization
                        </Badge>
                      </div>
                      {feedback.regarding && (
                        <div className="text-sm text-gray-600 mt-1 font-medium">Re: {feedback.regarding}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < feedback.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-gray-700">{feedback.rating}/5</span>
                    </div>
                  </div>

                  {feedback.comment && (
                    <div className="bg-white rounded-lg p-4 mb-3 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{feedback.comment}</p>
                    </div>
                  )}

                  {/* Sentiment and Emotion */}
                  {(feedback.sentiment || feedback.emotion) && (
                    <div className="flex flex-col gap-2 mb-3 items-center">
                      {/* Emotion */}
                      {feedback.emotion && (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">Emotion:</span>
                          <span className={`font-medium capitalize ${getEmotionColor(feedback.emotion)}`}>
                            {feedback.emotion}
                          </span>
                        </div>
                      )}
                      {/* Sentiment */}
                      {feedback.sentiment && (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">Sentiment:</span>
                          <span className={`font-medium capitalize ${getSentimentColor(feedback.sentiment)}`}>
                            {feedback.sentiment}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{formatDate(feedback.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

