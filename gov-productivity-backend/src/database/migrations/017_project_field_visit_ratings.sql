-- Migration: Add project field visit employee ratings
-- This allows storing individual employee technical compliance ratings from project field visits

-- Project Field Visit Ratings table (ratings given during project field visits)
CREATE TABLE IF NOT EXISTS project_field_visit_ratings (
  id SERIAL PRIMARY KEY,
  field_visit_id INTEGER NOT NULL REFERENCES field_visits(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES users(id),
  technical_compliance NUMERIC(3,1) CHECK (technical_compliance >= 0 AND technical_compliance <= 10) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (field_visit_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_project_field_visit_ratings_visit ON project_field_visit_ratings(field_visit_id);
CREATE INDEX IF NOT EXISTS idx_project_field_visit_ratings_employee ON project_field_visit_ratings(employee_id);

