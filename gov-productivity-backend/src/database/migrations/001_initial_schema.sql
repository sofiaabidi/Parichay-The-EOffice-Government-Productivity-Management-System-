CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('EMPLOYEE','MANAGER','ADMIN')),
  department VARCHAR(100),
  designation VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  manager_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS team_members (
  team_id INTEGER NOT NULL REFERENCES teams(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  start_date DATE,
  due_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  total_hours NUMERIC(6,2),
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  assigned_to INTEGER REFERENCES users(id),
  assigned_by INTEGER REFERENCES users(id),
  priority VARCHAR(10) CHECK (priority IN ('low','medium','high')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('pending','in-progress','completed','delayed','rejected','awaiting-review'))
                   DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_feedbacks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  from_user_id INTEGER REFERENCES users(id),
  to_user_id INTEGER REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_files (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id),
  manager_id INTEGER REFERENCES users(id),
  task_id INTEGER REFERENCES tasks(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  complexity VARCHAR(20) CHECK (complexity IN ('low','medium','high')) NOT NULL,
  complexity_weight NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  is_digital BOOLEAN NOT NULL DEFAULT TRUE,
  target_time_hours NUMERIC(8,2) NOT NULL,
  sla_time_hours NUMERIC(8,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  grammar_score NUMERIC(5,2),
  clarity_score NUMERIC(5,2),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS file_documents (
  id SERIAL PRIMARY KEY,
  work_file_id INTEGER REFERENCES work_files(id),
  uploaded_by INTEGER REFERENCES users(id),
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trainings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('completed','upcoming','in-progress')),
  start_date DATE,
  completion_date DATE,
  duration_hours NUMERIC(6,2)
);

CREATE TABLE IF NOT EXISTS recognitions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50),
  description TEXT,
  date DATE,
  issued_by VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS employee_kpi_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  file_disposal_rate NUMERIC(5,2),
  responsiveness NUMERIC(5,2),
  tat_score NUMERIC(5,2),
  quality_of_drafting NUMERIC(5,2),
  digital_adoption NUMERIC(5,2),
  final_kpi NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS manager_kpi_snapshots (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER NOT NULL REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_team_kpi NUMERIC(5,2),
  review_ratio NUMERIC(5,2),
  final_kpi NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (manager_id, period_start, period_end)
);