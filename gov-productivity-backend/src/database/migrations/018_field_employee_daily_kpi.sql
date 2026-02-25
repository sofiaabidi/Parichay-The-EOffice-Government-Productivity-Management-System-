-- Migration: Field Employee Daily KPI table
-- This migration creates a table for daily KPI tracking for field employees

-- Field Employee Daily KPI table
CREATE TABLE IF NOT EXISTS field_employee_daily_kpi (
  id SERIAL PRIMARY KEY,
  day DATE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timeliness_quality_dpr NUMERIC(5,2), -- Timeliness & Quality of DPR
  technical_compliance_projects NUMERIC(5,2), -- Technical Compliance in Projects
  survey_accuracy NUMERIC(5,2), -- Survey Accuracy
  expenditure_vs_targets NUMERIC(5,2), -- Expenditure vs Financial Targets
  task_timeliness NUMERIC(5,2), -- Adherence to Timeliness (Tasks Timeliness)
  overall_kpi NUMERIC(5,2), -- Main/Overall KPI (weighted sum of all 5 KPIs)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (day, user_id)
);

CREATE INDEX IF NOT EXISTS idx_field_employee_daily_kpi_user ON field_employee_daily_kpi(user_id);
CREATE INDEX IF NOT EXISTS idx_field_employee_daily_kpi_day ON field_employee_daily_kpi(day);
CREATE INDEX IF NOT EXISTS idx_field_employee_daily_kpi_user_day ON field_employee_daily_kpi(user_id, day DESC);

