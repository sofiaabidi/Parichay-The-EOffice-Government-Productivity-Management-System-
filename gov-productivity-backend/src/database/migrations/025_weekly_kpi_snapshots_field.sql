-- Migration: Weekly KPI Snapshots for Field Employees and Managers
-- This migration creates a table to store weekly aggregated KPI scores for all field personnel

CREATE TABLE IF NOT EXISTS weekly_kpi_snapshots_field (
  id SERIAL PRIMARY KEY,
  timestamp DATE NOT NULL UNIQUE,
  average_kpi_scores_of_field NUMERIC(5,2) NOT NULL,
  total_field_employees INTEGER DEFAULT 0,
  total_field_managers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_kpi_snapshots_field_timestamp ON weekly_kpi_snapshots_field(timestamp);
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_snapshots_field_created_at ON weekly_kpi_snapshots_field(created_at);

-- Add comment to table
COMMENT ON TABLE weekly_kpi_snapshots_field IS 'Weekly aggregated KPI scores for all field employees and managers. average_kpi_scores_of_field = (sum of all field employees final_kpi + sum of all field managers final_kpi) / (total number of field employees + total number of field managers)';

