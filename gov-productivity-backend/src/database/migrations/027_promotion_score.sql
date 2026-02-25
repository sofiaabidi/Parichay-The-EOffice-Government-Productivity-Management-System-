-- Migration: Create promotion_score table for field employees
-- This table stores promotion scoring data for field employees

CREATE TABLE IF NOT EXISTS promotion_score (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_kpi NUMERIC(5,2), -- Employee's overall KPI score
  absentees INTEGER DEFAULT 0, -- Total number of absentees in past period
  team_contribution NUMERIC(10,4), -- overall_kpi / team_score
  stars NUMERIC(5,2), -- Average review stars from DPR reviews
  promotion_score NUMERIC(10,4), -- Calculated promotion score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_score_user ON promotion_score(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_score_promotion_score ON promotion_score(promotion_score DESC);

COMMENT ON TABLE promotion_score IS 'Promotion scoring data for field employees';
COMMENT ON COLUMN promotion_score.overall_kpi IS 'Employee overall KPI score from field_employee_kpi_snapshots';
COMMENT ON COLUMN promotion_score.absentees IS 'Total number of absentees in past period (default: 30 days)';
COMMENT ON COLUMN promotion_score.team_contribution IS 'Employee KPI divided by team average KPI';
COMMENT ON COLUMN promotion_score.stars IS 'Average review stars from DPR reviews (0-5 scale)';
COMMENT ON COLUMN promotion_score.promotion_score IS 'Calculated promotion score: 0.6*normalized_kpi + 0.2*(normalized_absentees + normalized_team_contribution) + 0.2*normalized_stars';

