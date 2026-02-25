-- Create task_skills table to store skills required for tasks
CREATE TABLE IF NOT EXISTS task_skills (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES field_employee_skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, skill_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_task_skills_task_id ON task_skills(task_id);
CREATE INDEX IF NOT EXISTS idx_task_skills_skill_id ON task_skills(skill_id);

