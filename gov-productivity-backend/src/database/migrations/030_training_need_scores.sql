-- Migration: Create training_need_scores table for field employees
-- This table stores training need scores calculated from KPI, absentee, and skill scores

CREATE TABLE IF NOT EXISTS training_need_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kpi NUMERIC(5,2) NOT NULL, -- Overall KPI (lower = higher training need)
  absentee INTEGER NOT NULL DEFAULT 0, -- Number of absent days in past period
  avg_skill_score NUMERIC(5,4), -- Average skill score across all tasks (0-1), NULL if no tasks assigned
  training_need_score NUMERIC(10,6) NOT NULL, -- Calculated training need score (HIGHER = higher need, better candidate)
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_training_need_scores_user ON training_need_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_training_need_scores_training_need_score ON training_need_scores(training_need_score ASC);

-- Drop FDR column if it exists (for existing databases)
ALTER TABLE training_need_scores DROP COLUMN IF EXISTS fdr;

-- Allow NULL for avg_skill_score (for employees with no tasks)
ALTER TABLE training_need_scores ALTER COLUMN avg_skill_score DROP NOT NULL;

COMMENT ON TABLE training_need_scores IS 'Training need scores for field employees - HIGHER score indicates higher training need (better candidate)';
COMMENT ON COLUMN training_need_scores.kpi IS 'Overall KPI score (lower = higher training need)';
COMMENT ON COLUMN training_need_scores.absentee IS 'Number of absent days in past 30 days (integer count)';
COMMENT ON COLUMN training_need_scores.avg_skill_score IS 'Average skill score across all assigned tasks (0-1, lower = higher training need). NULL if no tasks assigned.';
COMMENT ON COLUMN training_need_scores.training_need_score IS 'Normalized training need score (descending order: HIGHER = higher need, better candidate for training)';

