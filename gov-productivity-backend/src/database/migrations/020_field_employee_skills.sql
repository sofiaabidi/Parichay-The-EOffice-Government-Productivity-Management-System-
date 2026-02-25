-- Create field_employee_skills table
CREATE TABLE IF NOT EXISTS field_employee_skills (
  id SERIAL PRIMARY KEY,
  skill_name VARCHAR(200) NOT NULL UNIQUE
);

-- Insert predefined skills
INSERT INTO field_employee_skills (skill_name) VALUES
  ('GIS Mapping'),
  ('Surveying'),
  ('DPR Preparation'),
  ('Drafting'),
  ('Field Inspection'),
  ('Measurement Work'),
  ('Technical Compliance'),
  ('Project Management'),
  ('Data Analysis'),
  ('CAD Design'),
  ('Quality Assurance'),
  ('Documentation')
ON CONFLICT (skill_name) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_field_employee_skills_name ON field_employee_skills(skill_name);

