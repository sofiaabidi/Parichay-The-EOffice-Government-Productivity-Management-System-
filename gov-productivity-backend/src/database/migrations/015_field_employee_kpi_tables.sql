-- Migration: Field Employee KPI tables
-- This migration creates tables for DPR reviews and Field Employee KPI snapshots

-- DPR Reviews table (Manager reviews of DPR submissions)
CREATE TABLE IF NOT EXISTS dpr_reviews (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewed_by INTEGER NOT NULL REFERENCES users(id),
  reviewed_for INTEGER NOT NULL REFERENCES users(id), -- The employee whose DPR is being reviewed
  actual_submission_date DATE NOT NULL,
  deadline DATE NOT NULL,
  authenticity_stars INTEGER CHECK (authenticity_stars >= 0 AND authenticity_stars <= 5) DEFAULT 0,
  data_correctness_stars INTEGER CHECK (data_correctness_stars >= 0 AND data_correctness_stars <= 5) DEFAULT 0,
  technical_correctness_stars INTEGER CHECK (technical_correctness_stars >= 0 AND technical_correctness_stars <= 5) DEFAULT 0,
  completeness_stars INTEGER CHECK (completeness_stars >= 0 AND completeness_stars <= 5) DEFAULT 0,
  tools_and_resources_stars INTEGER CHECK (tools_and_resources_stars >= 0 AND tools_and_resources_stars <= 5) DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, reviewed_for, reviewed_by)
);

CREATE INDEX IF NOT EXISTS idx_dpr_reviews_project ON dpr_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_dpr_reviews_reviewed_for ON dpr_reviews(reviewed_for);
CREATE INDEX IF NOT EXISTS idx_dpr_reviews_reviewed_by ON dpr_reviews(reviewed_by);

-- Field Employee KPI Snapshots table
CREATE TABLE IF NOT EXISTS field_employee_kpi_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dpr_kpi NUMERIC(5,2), -- Timeliness & Quality of DPR
  technical_compliance_kpi NUMERIC(5,2), -- Technical Compliance in Projects
  survey_kpi NUMERIC(5,2), -- Survey Accuracy
  expenditure_kpi NUMERIC(5,2), -- Expenditure vs Financial Targets
  task_timeliness_kpi NUMERIC(5,2), -- Adherence to Timeliness (Tasks)
  final_kpi NUMERIC(5,2), -- Weighted sum of all 5 KPIs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_field_employee_kpi_snapshots_user ON field_employee_kpi_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_field_employee_kpi_snapshots_period ON field_employee_kpi_snapshots(period_start, period_end);

-- Add planned_duration to tasks table for task timeliness calculation
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS planned_duration INTEGER; -- Expected task duration in days

-- Add planned_completion_date to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS planned_completion_date DATE;

-- Ensure tasks have cost field (already added in migration 008, but ensure it exists)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS cost VARCHAR(100);

