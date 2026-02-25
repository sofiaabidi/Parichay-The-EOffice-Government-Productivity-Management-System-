-- Migration: Field-specific tables for Field Manager and Field Employee modules
-- This migration creates tables for surveys, field visits, locations, and project milestones

-- Project Milestones table (for Field projects)
CREATE TABLE IF NOT EXISTS project_milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'in-progress', 'completed', 'delayed')) DEFAULT 'pending',
  deadline DATE,
  budget VARCHAR(100),
  expected_output TEXT,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);

-- Field Visits table (for both project visits and survey visits)
CREATE TABLE IF NOT EXISTS field_visits (
  id SERIAL PRIMARY KEY,
  visit_type VARCHAR(20) CHECK (visit_type IN ('project', 'survey')) NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  visited_by INTEGER NOT NULL REFERENCES users(id),
  visit_date DATE NOT NULL,
  location_id VARCHAR(100),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  notes TEXT,
  status VARCHAR(20) CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (visit_type = 'project' AND project_id IS NOT NULL AND survey_id IS NULL) OR
    (visit_type = 'survey' AND survey_id IS NOT NULL AND project_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_field_visits_type ON field_visits(visit_type);
CREATE INDEX IF NOT EXISTS idx_field_visits_project ON field_visits(project_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_survey ON field_visits(survey_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_visited_by ON field_visits(visited_by);

-- Locations table (for saving map locations)
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  location_id VARCHAR(100) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_location_id ON locations(location_id);

-- Field Visit Files/Attachments table
CREATE TABLE IF NOT EXISTS field_visit_files (
  id SERIAL PRIMARY KEY,
  field_visit_id INTEGER NOT NULL REFERENCES field_visits(id) ON DELETE CASCADE,
  file_document_id INTEGER REFERENCES file_documents(id) ON DELETE SET NULL,
  file_type VARCHAR(20) CHECK (file_type IN ('image', 'pdf', 'document')) NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_visit_files_visit ON field_visit_files(field_visit_id);

-- Task Submissions table (for Field Employee task submissions)
CREATE TABLE IF NOT EXISTS task_submissions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES project_milestones(id) ON DELETE SET NULL,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  submission_type VARCHAR(20) CHECK (submission_type IN ('file', 'image', 'document')) NOT NULL,
  file_document_id INTEGER REFERENCES file_documents(id) ON DELETE SET NULL,
  cost VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('submitted', 'approved', 'rejected', 'pending-review')) DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_milestone ON task_submissions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);

-- Project Evaluations table (Manager evaluation of project work)
CREATE TABLE IF NOT EXISTS project_evaluations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  evaluated_by INTEGER NOT NULL REFERENCES users(id),
  quality_score NUMERIC(3,1) CHECK (quality_score >= 0 AND quality_score <= 10),
  technical_compliance NUMERIC(3,1) CHECK (technical_compliance >= 0 AND technical_compliance <= 10),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, evaluated_by)
);

CREATE INDEX IF NOT EXISTS idx_project_evaluations_project ON project_evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_evaluated_by ON project_evaluations(evaluated_by);

-- Survey Submissions table
CREATE TABLE IF NOT EXISTS survey_submissions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  submission_data JSONB,
  status VARCHAR(20) CHECK (status IN ('draft', 'submitted', 'reviewed')) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_submissions_survey ON survey_submissions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_submitted_by ON survey_submissions(submitted_by);

-- Add fields to projects table for Field-specific data
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS budget VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dpr_deadline DATE,
  ADD COLUMN IF NOT EXISTS progress_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(20) CHECK (project_type IN ('hq', 'field')) DEFAULT 'hq';

-- Add fields to tasks table for Field-specific data
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS milestone_id INTEGER REFERENCES project_milestones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expected_output TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone_id);

