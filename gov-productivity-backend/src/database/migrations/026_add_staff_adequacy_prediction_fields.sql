-- Migration: Add prediction fields to staff_adequency_field table
-- This adds required_ppl (predicted by XGBoost model) and status (overstaffed/understaffed/balanced)

ALTER TABLE staff_adequency_field
  ADD COLUMN IF NOT EXISTS required_ppl INTEGER,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) CHECK (status IN ('overstaffed', 'understaffed', 'balanced'));

CREATE INDEX IF NOT EXISTS idx_staff_adequency_field_status ON staff_adequency_field(status);

COMMENT ON COLUMN staff_adequency_field.required_ppl IS 'Predicted number of required people (ceiled) from XGBoost model';
COMMENT ON COLUMN staff_adequency_field.status IS 'Staffing status: overstaffed (gap > 1), understaffed (gap < -1), balanced (otherwise)';

