-- Migration: Extend surveys table and add survey_members table
-- This adds fields needed for Field Manager survey creation and links surveys to employees

-- Add fields to surveys table
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS total_area VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expected_time VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS deadline DATE;

-- Create survey_members table to link surveys to employees
CREATE TABLE IF NOT EXISTS survey_members (
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (survey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_members_survey ON survey_members(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_members_user ON survey_members(user_id);

-- Extend survey_submissions table to store file references and feedback
ALTER TABLE survey_submissions
  ADD COLUMN IF NOT EXISTS area_covered VARCHAR(100),
  ADD COLUMN IF NOT EXISTS time_taken VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS survey_accuracy NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS manager_remarks TEXT,
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Create survey_submission_files table to store uploaded files
CREATE TABLE IF NOT EXISTS survey_submission_files (
  id SERIAL PRIMARY KEY,
  survey_submission_id INTEGER NOT NULL REFERENCES survey_submissions(id) ON DELETE CASCADE,
  file_document_id INTEGER NOT NULL REFERENCES file_documents(id) ON DELETE CASCADE,
  file_type VARCHAR(20) CHECK (file_type IN ('image', 'pdf', 'document')) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_submission_files_submission ON survey_submission_files(survey_submission_id);
CREATE INDEX IF NOT EXISTS idx_survey_submission_files_document ON survey_submission_files(file_document_id);

