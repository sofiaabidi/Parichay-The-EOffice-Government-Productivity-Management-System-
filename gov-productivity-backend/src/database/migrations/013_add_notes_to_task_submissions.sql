-- Migration: Add notes column to task_submissions table
-- This allows users to add notes/observations when submitting task files

ALTER TABLE task_submissions
  ADD COLUMN IF NOT EXISTS notes TEXT;

