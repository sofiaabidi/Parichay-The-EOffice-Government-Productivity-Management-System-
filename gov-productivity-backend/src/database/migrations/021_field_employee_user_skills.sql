-- Create field_employee_user_skills table to store user-selected skills
CREATE TABLE IF NOT EXISTS field_employee_user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_field_employee_user_skills_user_id ON field_employee_user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_field_employee_user_skills_name ON field_employee_user_skills(name);

