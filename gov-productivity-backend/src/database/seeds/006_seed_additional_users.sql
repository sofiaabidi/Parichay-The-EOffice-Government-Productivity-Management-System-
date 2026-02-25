

CREATE EXTENSION IF NOT EXISTS pgcrypto;


INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (18, 'Ravi Kumar', 'ravi@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Junior Engineer'),
  (19, 'Sunita Devi', 'sunita@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Surveyor'),
  (20, 'Manoj Singh', 'manoj@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Site Supervisor'),
  (21, 'Anjali Sharma', 'anjali@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Project Coordinator')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;


INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (22, 'Amitabh Das', 'amitabh@bb.gov.in', crypt('FieldManager@123', gen_salt('bf')), 'FIELD_MANAGER', 'Field Operations - Meghalaya', 'Field Manager')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

-- Employees for Field Manager 1 (Amitabh Das, ID 22)
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (23, 'Pankaj Mehta', 'pankaj@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Meghalaya', 'Junior Engineer'),
  (24, 'Rekha Patel', 'rekha@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Meghalaya', 'Surveyor'),
  (25, 'Vikash Kumar', 'vikash@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Meghalaya', 'Site Supervisor')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;


INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (26, 'Sanjay Verma', 'sanjay@bb.gov.in', crypt('FieldManager@123', gen_salt('bf')), 'FIELD_MANAGER', 'Field Operations - Manipur', 'Field Manager')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

-- Employees for Field Manager 2 (Sanjay Verma, ID 26)
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (27, 'Meera Nair', 'meera.nair@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Manipur', 'Junior Engineer'),
  (28, 'Rajesh Iyer', 'rajesh.iyer@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Manipur', 'Surveyor'),
  (29, 'Suresh Reddy', 'suresh.reddy@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Manipur', 'Site Supervisor')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;


INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (30, 'Anil Kapoor', 'anil@bb.gov.in', crypt('Manager@123', gen_salt('bf')), 'MANAGER', 'Hydrology & Survey', 'Executive Engineer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

-- Employees for HQ Manager (Anil Kapoor, ID 30)
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (31, 'Ritu Sharma', 'ritu@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Hydrology & Survey', 'Junior Engineer'),
  (32, 'Naveen Kumar', 'naveen@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Hydrology & Survey', 'Surveyor'),
  (33, 'Kavita Singh', 'kavita.singh@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Hydrology & Survey', 'Technical Assistant')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (34, 'Rahul Verma', 'rahul@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Flood Management', 'Junior Engineer'),
  (35, 'Sonia Patel', 'sonia@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Flood Management', 'Technical Assistant')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

-- Update sequence
SELECT pg_catalog.setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1));



-- Add new employees to Rajesh Kumar's team (Team ID 1 - Flood Management Division)
INSERT INTO team_members (team_id, user_id) VALUES
  (1, 34),
  (1, 35)
ON CONFLICT DO NOTHING;

-- Add new employees to Vikram Mehta's Assam team (Team ID 4)
INSERT INTO team_members (team_id, user_id) VALUES
  (4, 18), (4, 19), (4, 20), (4, 21)
ON CONFLICT DO NOTHING;

-- Create team for new HQ Manager (Anil Kapoor, ID 30)
INSERT INTO teams (id, name, manager_id)
VALUES
  (3, 'Hydrology & Survey Division', 30)
ON CONFLICT (id) DO NOTHING;

-- Add employees to Anil Kapoor's team
INSERT INTO team_members (team_id, user_id) VALUES
  (3, 31),
  (3, 32),
  (3, 33)
ON CONFLICT DO NOTHING;

-- Create teams for new Field Managers
-- Team for Amitabh Das (Field Manager - Meghalaya, ID 22)
INSERT INTO teams (id, name, manager_id)
VALUES
  (6, 'Field Operations - Meghalaya Team', 22)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;

-- Team for Sanjay Verma (Field Manager - Manipur, ID 26)
INSERT INTO teams (id, name, manager_id)
VALUES
  (7, 'Field Operations - Manipur Team', 26)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;

-- Add employees to new Field Managers' teams
-- Employees for Amitabh Das (Meghalaya, Team 6)
INSERT INTO team_members (team_id, user_id) VALUES
  (6, 23), (6, 24), (6, 25)
ON CONFLICT DO NOTHING;

-- Employees for Sanjay Verma (Manipur, Team 7)
INSERT INTO team_members (team_id, user_id) VALUES
  (7, 27), (7, 28), (7, 29)
ON CONFLICT DO NOTHING;


INSERT INTO attendance (user_id, date, check_in_time, check_out_time, total_hours, status)
VALUES
  -- New Assam employees
  (18, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (18, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present'),
  (19, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (20, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present'),
  (21, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  -- New Field Manager 1 employees
  (23, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (24, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present'),
  (25, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  -- New Field Manager 2 employees
  (27, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (28, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present'),
  (29, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  -- New HQ Manager employees
  (31, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (32, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present'),
  (33, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  -- New employees for Rajesh Kumar
  (34, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (35, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present')
ON CONFLICT DO NOTHING;


INSERT INTO field_employee_kpi_snapshots (
  user_id, period_start, period_end,
  dpr_kpi, technical_compliance_kpi, survey_kpi,
  expenditure_kpi, task_timeliness_kpi, final_kpi
)
VALUES
  -- New Assam employees
  (18, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 76.0, 81.0, 71.0, 86.0, 79.0, 78.6),
  (19, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 79.0, 84.0, 89.0, 81.0, 86.0, 83.8),
  (20, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 73.0, 78.0, 68.0, 78.0, 75.0, 74.4),
  (21, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 77.0, 80.0, 75.0, 83.0, 79.0, 78.8),
  -- New Meghalaya employees
  (23, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 74.0, 79.0, 72.0, 84.0, 77.0, 77.2),
  (24, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 81.0, 86.0, 90.0, 82.0, 87.0, 85.2),
  (25, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 72.0, 77.0, 70.0, 79.0, 74.0, 74.4),
  -- New Manipur employees
  (27, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 78.0, 83.0, 76.0, 87.0, 80.0, 80.8),
  (28, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 80.0, 85.0, 88.0, 83.0, 86.0, 84.4),
  (29, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 75.0, 80.0, 73.0, 81.0, 77.0, 77.2)
ON CONFLICT (user_id, period_start, period_end) DO UPDATE SET
  dpr_kpi = EXCLUDED.dpr_kpi,
  technical_compliance_kpi = EXCLUDED.technical_compliance_kpi,
  survey_kpi = EXCLUDED.survey_kpi,
  expenditure_kpi = EXCLUDED.expenditure_kpi,
  task_timeliness_kpi = EXCLUDED.task_timeliness_kpi,
  final_kpi = EXCLUDED.final_kpi,
  updated_at = NOW();


INSERT INTO employee_kpi_snapshots (user_id, period_start, period_end, file_disposal_rate, responsiveness, tat_score, quality_of_drafting, digital_adoption, final_kpi)
VALUES
  -- New HQ Manager employees (Anil Kapoor's team)
  (31, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 82, 87, 85, 90, 92, 87.2),
  (32, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 85, 90, 88, 92, 94, 89.8),
  (33, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 80, 85, 83, 88, 90, 85.2),
  -- New employees for Rajesh Kumar
  (34, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 83, 88, 86, 91, 93, 88.2),
  (35, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 81, 86, 84, 89, 91, 86.2)
ON CONFLICT (user_id, period_start, period_end) DO NOTHING;


INSERT INTO manager_kpi_snapshots (manager_id, period_start, period_end, avg_team_kpi, review_ratio, final_kpi)
VALUES
  (22, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 78.93, 96, 81),
  (26, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 80.80, 97, 83)
ON CONFLICT (manager_id, period_start, period_end) DO NOTHING;


INSERT INTO manager_kpi_snapshots (manager_id, period_start, period_end, avg_team_kpi, review_ratio, final_kpi)
VALUES
  (30, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 87.07, 95, 89)
ON CONFLICT (manager_id, period_start, period_end) DO NOTHING;


INSERT INTO manager_kpi_snapshots (manager_id, period_start, period_end, avg_team_kpi, review_ratio, final_kpi)
VALUES
  (2, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 87.15, 96, 89)
ON CONFLICT (manager_id, period_start, period_end) DO UPDATE SET
  avg_team_kpi = EXCLUDED.avg_team_kpi,
  review_ratio = EXCLUDED.review_ratio,
  final_kpi = EXCLUDED.final_kpi,
  updated_at = NOW();

