-- Migration: Add sentiment and emotion columns to feedback tables
-- This allows storing sentiment analysis results (positive, negative, neutral) and detected emotions

-- Add sentiment and emotion columns to peer_feedbacks table
ALTER TABLE peer_feedbacks
  ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  ADD COLUMN IF NOT EXISTS emotion VARCHAR(50);

-- Add sentiment and emotion columns to manager_feedbacks table
ALTER TABLE manager_feedbacks
  ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  ADD COLUMN IF NOT EXISTS emotion VARCHAR(50);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_sentiment ON peer_feedbacks(sentiment);
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_emotion ON peer_feedbacks(emotion);
CREATE INDEX IF NOT EXISTS idx_manager_feedbacks_sentiment ON manager_feedbacks(sentiment);
CREATE INDEX IF NOT EXISTS idx_manager_feedbacks_emotion ON manager_feedbacks(emotion);

COMMENT ON COLUMN peer_feedbacks.sentiment IS 'Sentiment analysis result: positive, negative, or neutral';
COMMENT ON COLUMN peer_feedbacks.emotion IS 'Detected emotion from sentiment analysis (e.g., Happy, Sad, Angry, etc.)';
COMMENT ON COLUMN manager_feedbacks.sentiment IS 'Sentiment analysis result: positive, negative, or neutral';
COMMENT ON COLUMN manager_feedbacks.emotion IS 'Detected emotion from sentiment analysis (e.g., Happy, Sad, Angry, etc.)';

