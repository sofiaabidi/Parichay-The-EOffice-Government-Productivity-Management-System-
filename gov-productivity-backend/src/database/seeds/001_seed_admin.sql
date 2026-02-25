CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Brahmaputra Board Admin and Initial HQ Users
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (1, 'System Admin', 'admin@bb.gov.in', crypt('Admin@123', gen_salt('bf')), 'ADMIN', 'Brahmaputra Board', 'Chief Administrator'),
  (2, 'Rajesh Kumar', 'rajesh@bb.gov.in', crypt('Manager@123', gen_salt('bf')), 'MANAGER', 'Flood Management', 'Executive Engineer'),
  (3, 'Priya Sharma', 'priya@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Flood Management', 'Junior Engineer'),
  (4, 'Amit Verma', 'amit@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Flood Management', 'Technical Assistant')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1));

INSERT INTO teams (id, name, manager_id)
VALUES (1, 'Flood Management Division', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_members (team_id, user_id) VALUES
(1, 3),
(1, 4)
ON CONFLICT DO NOTHING;

-- Note: Additional employees (34, 35) for Rajesh Kumar will be added in 006_seed_additional_users.sql
-- Note: User 8 (Deepak Singh) will be added to Team 1 in 002_seed_demo_data.sql after user creation

INSERT INTO projects (id, name, description, status, start_date, due_date, created_by)
VALUES
  (1, 'Anti-Erosion Work at Majuli', 'Comprehensive anti-erosion measures for Majuli island protection', 'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, project_id, assigned_to, assigned_by, priority, status, due_date, created_at)
VALUES
  (1, 'Site Assessment Report - Majuli', 'Prepare detailed site assessment for erosion control measures', 1, 3, 2, 'high', 'in-progress', CURRENT_DATE + INTERVAL '5 days', NOW() - INTERVAL '3 days'),
  (2, 'Hydrology Data Analysis', 'Analyze river flow data for embankment design', 1, 4, 2, 'medium', 'awaiting-review', CURRENT_DATE + INTERVAL '2 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_files (
  id, employee_id, manager_id, task_id, title, description,
  complexity, complexity_weight, is_digital, target_time_hours, sla_time_hours,
  created_at, first_response_at, completed_at, grammar_score, clarity_score, reviewed_by, reviewed_at
) VALUES
  (
    1, 3, 2, 1, 'Majuli Site Assessment V1', 'Initial site assessment report submission',
    'high', 1.5, TRUE, 72, 24,
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 6 hours', NOW() - INTERVAL '1 day',
    0.85, 0.9, 2, NOW() - INTERVAL '20 hours'
  ),
  (
    2, 4, 2, 2, 'Hydrology Analysis Report', 'River flow data analysis for embankment design',
    'medium', 1.0, TRUE, 48, 24,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 20 hours', NULL,
    0.8, 0.75, NULL, NULL
  )
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('work_files_id_seq', GREATEST((SELECT MAX(id) FROM work_files), 1));

