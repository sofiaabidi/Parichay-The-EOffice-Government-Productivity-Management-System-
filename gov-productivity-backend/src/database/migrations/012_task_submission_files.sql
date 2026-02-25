-- Migration: Task submission files table
-- This allows multiple files per task submission (similar to survey_submission_files)

-- Create task_submission_files table to store uploaded files for task submissions
CREATE TABLE IF NOT EXISTS task_submission_files (
  id SERIAL PRIMARY KEY,
  task_submission_id INTEGER NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  file_document_id INTEGER NOT NULL REFERENCES file_documents(id) ON DELETE CASCADE,
  file_type VARCHAR(20) CHECK (file_type IN ('image', 'pdf', 'document')) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_submission_files_submission ON task_submission_files(task_submission_id);
CREATE INDEX IF NOT EXISTS idx_task_submission_files_document ON task_submission_files(file_document_id);

