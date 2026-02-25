-- Migration: Add survey field visits and supervisor ratings
-- This allows managers to record field visit scores for employees working on surveys

-- Survey Field Visits table
CREATE TABLE IF NOT EXISTS survey_field_visits (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  visited_by INTEGER NOT NULL REFERENCES users(id),
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_field_visits_survey ON survey_field_visits(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_field_visits_visited_by ON survey_field_visits(visited_by);

-- Supervisor Ratings table (ratings given during field visits)
CREATE TABLE IF NOT EXISTS supervisor_ratings (
  id SERIAL PRIMARY KEY,
  survey_field_visit_id INTEGER NOT NULL REFERENCES survey_field_visits(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES users(id),
  rating NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (survey_field_visit_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_supervisor_ratings_visit ON supervisor_ratings(survey_field_visit_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_ratings_employee ON supervisor_ratings(employee_id);

-- Add survey_score column to survey_submissions (calculated score)
ALTER TABLE survey_submissions
  ADD COLUMN IF NOT EXISTS survey_score NUMERIC(5,2);

