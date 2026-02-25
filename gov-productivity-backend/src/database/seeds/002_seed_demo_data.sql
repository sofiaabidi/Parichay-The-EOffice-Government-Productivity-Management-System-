-- Additional Brahmaputra Board HQ and Field Users
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (5, 'Suresh Das', 'suresh@bb.gov.in', crypt('Manager@123', gen_salt('bf')), 'MANAGER', 'River Bank Erosion Control', 'Superintending Engineer'),
  (6, 'Neha Patel', 'neha@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'River Bank Erosion Control', 'Junior Engineer'),
  (7, 'Kiran Reddy', 'kiran@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'River Bank Erosion Control', 'Surveyor'),
  (8, 'Deepak Singh', 'deepak@bb.gov.in', crypt('Employee@123', gen_salt('bf')), 'EMPLOYEE', 'Flood Management', 'Technical Assistant'),
  (9, 'Vikram Mehta', 'vikram@bb.gov.in', crypt('FieldManager@123', gen_salt('bf')), 'FIELD_MANAGER', 'Field Operations - Assam', 'Field Manager'),
  (10, 'Arjun Sharma', 'arjun@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Junior Engineer')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1));

INSERT INTO teams (id, name, manager_id)
VALUES
  (2, 'River Bank Erosion Control Division', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_members (team_id, user_id) VALUES
  (1, 8),  -- Deepak Singh (user 8) belongs to Team 1 (Flood Management Division)
  (2, 6),
  (2, 7)
ON CONFLICT DO NOTHING;


-- Projects for both teams
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by)
VALUES
  (2, 'Flood Protection Measures – Dhubri', 'Comprehensive flood protection infrastructure for Dhubri district', 'active', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE + INTERVAL '20 days', 5),
  (3, 'Hydrology Survey – Brahmaputra Stretch', 'Detailed hydrology survey of Brahmaputra river stretch', 'on-hold', CURRENT_DATE - INTERVAL '80 days', CURRENT_DATE - INTERVAL '5 days', 5)
ON CONFLICT (id) DO NOTHING;

-- Attendance scenarios
INSERT INTO attendance (user_id, date, check_in_time, check_out_time, total_hours, status)
VALUES
  (3, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (3, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 10 hours', NOW() - INTERVAL '1 days 2 hours', 8.0, 'present'),
  (3, CURRENT_DATE - INTERVAL '4 days', NULL, NULL, NULL, 'absent'),
  (6, CURRENT_DATE - INTERVAL '3 days', NOW() - INTERVAL '3 days 11 hours', NOW() - INTERVAL '3 days 4 hours', 7.0, 'present'),
  (6, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 12 hours', NOW() - INTERVAL '2 days 3 hours', 9.0, 'present'),
  (7, CURRENT_DATE - INTERVAL '1 days', NULL, NULL, NULL, 'absent'),
  (2, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (2, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present'),
  (9, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 0 hours', 8.0, 'present'),
  (9, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 8 hours', NOW() - INTERVAL '1 days 0 hours', 8.0, 'present'),
  (10, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hours', 8.0, 'present'),
  (10, CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days 9 hours', NOW() - INTERVAL '1 days 1 hours', 8.0, 'present')
ON CONFLICT DO NOTHING;

-- Attendance adjustments demonstrating manager overrides
INSERT INTO attendance_adjustments (attendance_id, manager_id, adjustment)
SELECT a.id, 5, jsonb_build_object('note', 'Approved work from home', 'updatedStatus', 'present')
FROM attendance a
WHERE a.user_id = 7 AND a.status = 'absent'
ON CONFLICT DO NOTHING;

-- Tasks with multiple states
INSERT INTO tasks (id, title, description, project_id, assigned_to, assigned_by, priority, status, due_date, completed_at, created_at)
VALUES
  (1, 'Site Assessment Report - Majuli', 'Prepare detailed site assessment for erosion control measures', 1, 3, 2, 'high', 'completed', CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '6 days'),
  (2, 'Hydrology Data Analysis', 'Analyze river flow data for embankment design', 1, 4, 2, 'medium', 'awaiting-review', CURRENT_DATE + INTERVAL '2 days', NULL, NOW() - INTERVAL '7 days'),
  (3, 'Embankment Design Review', 'Review and update embankment design specifications', 1, 3, 2, 'high', 'completed', CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '1 days', NOW() - INTERVAL '6 days'),
  (4, 'Field Survey Documentation', 'Document field survey findings for Majuli project', 1, 4, 2, 'medium', 'in-progress', CURRENT_DATE + INTERVAL '4 days', NULL, NOW() - INTERVAL '2 days'),
  (5, 'Flood Protection Design', 'Design flood protection infrastructure for Dhubri', 2, 6, 5, 'high', 'awaiting-review', CURRENT_DATE + INTERVAL '3 days', NULL, NOW() - INTERVAL '5 days'),
  (6, 'Hydrology Data Validation', 'Validate and correct hydrology survey data', 3, 7, 5, 'medium', 'delayed', CURRENT_DATE - INTERVAL '2 days', NULL, NOW() - INTERVAL '35 days'),
  (7, 'Monthly Progress Report', 'Compile monthly progress report for Brahmaputra Board', 1, 8, 2, 'low', 'pending', CURRENT_DATE + INTERVAL '6 days', NULL, NOW() - INTERVAL '1 days'),
  (8, 'Technical Specifications QA', 'Quality check of technical specifications', 1, 4, 2, 'high', 'delayed', CURRENT_DATE - INTERVAL '1 days', NULL, NOW() - INTERVAL '10 days'),
  (9, 'Weekly Project Status Brief', 'Status brief for Brahmaputra Board leadership', 2, 6, 5, 'medium', 'completed', CURRENT_DATE - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  project_id = EXCLUDED.project_id,
  assigned_to = EXCLUDED.assigned_to,
  assigned_by = EXCLUDED.assigned_by,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  completed_at = EXCLUDED.completed_at,
  created_at = EXCLUDED.created_at;

-- Work files aligned to tasks
INSERT INTO work_files (
  id, employee_id, manager_id, task_id, title, description,
  complexity, complexity_weight, is_digital, target_time_hours, sla_time_hours,
  created_at, first_response_at, completed_at, grammar_score, clarity_score, reviewed_by, reviewed_at
) VALUES
  (
    3, 3, 2, 3, 'Embankment Design Review Document', 'Updated embankment design specifications',
    'medium', 1.2, TRUE, 36, 24,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 days',
    0.92, 0.88, 2, NOW() - INTERVAL '20 hours'
  ),
  (
    4, 6, 5, 5, 'Flood Protection Design Report', 'Flood protection infrastructure design',
    'high', 1.5, TRUE, 72, 36,
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', NULL,
    0.8, 0.82, NULL, NULL
  ),
  (
    5, 7, 5, 6, 'Hydrology Data Validation Report', 'Validated hydrology survey data',
    'medium', 1.0, TRUE, 60, 30,
    NOW() - INTERVAL '10 days', NULL, NULL,
    NULL, NULL, NULL, NULL
  ),
  (
    6, 8, 2, 7, 'Monthly Progress Report Draft', 'Initial draft for monthly progress report',
    'low', 0.8, TRUE, 24, 12,
    NOW() - INTERVAL '1 days', NULL, NULL,
    NULL, NULL, NULL, NULL
  ),
  (
    7, 4, 2, 2, 'Hydrology Analysis Report', 'River flow data analysis for embankment design',
    'medium', 1.1, TRUE, 40, 24,
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NULL,
    NULL, NULL, 2, NULL
  )
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('work_files_id_seq', GREATEST((SELECT MAX(id) FROM work_files), 1));

-- Uploaded documents (PDF)
INSERT INTO file_documents (
  id, work_file_id, uploaded_by, original_name, mime_type, file_size, storage_path, approval_status, reviewed_by, reviewed_at
) VALUES
  (1, 3, 3, 'embankment_design_review.pdf', 'application/pdf', 524288, 'uploads/embankment_design_review.pdf', 'approved', 2, NOW() - INTERVAL '18 hours'),
  (2, 4, 6, 'flood_protection_design.pdf', 'application/pdf', 734003, 'uploads/flood_protection_design.pdf', 'pending', NULL, NULL),
  (3, 7, 4, 'hydrology_analysis_report.pdf', 'application/pdf', 389120, 'uploads/hydrology_analysis_report.pdf', 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('file_documents_id_seq', GREATEST((SELECT MAX(id) FROM file_documents), 1));

-- Task feedback
INSERT INTO task_feedbacks (task_id, from_user_id, to_user_id, rating, comment, created_at)
VALUES
  (3, 2, 3, 5, 'Excellent embankment design review with detailed technical specifications', NOW() - INTERVAL '1 days'),
  (5, 5, 6, 4, 'Good flood protection design, needs minor validation adjustments', NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- Trainings: ensure every employee has the same baseline programs with different statuses
WITH employees AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS idx
  FROM users
  WHERE role = 'EMPLOYEE'
),
programs AS (
  SELECT *
  FROM (VALUES
    (1, 'Flood Management Fundamentals', 6),
    (2, 'Hydrology & Survey Techniques', 10),
    (3, 'Embankment Design Masterclass', 8)
  ) AS p(ordering, name, duration_hours)
)
INSERT INTO trainings (user_id, name, status, start_date, completion_date, duration_hours)
SELECT
  e.id,
  p.name,
  CASE ((e.idx + p.ordering) % 3)
    WHEN 0 THEN 'completed'
    WHEN 1 THEN 'in-progress'
    ELSE 'upcoming'
  END AS status,
  CURRENT_DATE - ((e.idx + p.ordering) % 5 + 5) * INTERVAL '1 day',
  CASE
    WHEN ((e.idx + p.ordering) % 3) = 0 THEN CURRENT_DATE - ((e.idx + p.ordering) % 3 + 1) * INTERVAL '1 day'
    ELSE NULL
  END AS completion_date,
  p.duration_hours
FROM employees e
CROSS JOIN programs p
WHERE NOT EXISTS (
  SELECT 1
  FROM trainings t
  WHERE t.user_id = e.id
    AND t.name = p.name
);

INSERT INTO recognitions (user_id, title, type, description, date, issued_by)
VALUES
  (3, 'Technical Excellence Award', 'Award', 'For exceptional embankment design work', CURRENT_DATE - INTERVAL '20 days', 'Brahmaputra Board Director'),
  (6, 'Rapid Response Mention', 'Appreciation', 'Handled urgent flood protection design request', CURRENT_DATE - INTERVAL '5 days', 'Executive Engineer')
ON CONFLICT DO NOTHING;

-- Skills
INSERT INTO employee_skills (user_id, name)
VALUES
  (3, 'Embankment Design'),
  (3, 'Site Assessment'),
  (6, 'Flood Protection Design'),
  (6, 'Hydrology Analysis')
ON CONFLICT DO NOTHING;

-- Employee badges
INSERT INTO employee_badges (user_id, name, description, icon, awarded_by, awarded_at, metadata)
VALUES
  (3, 'Technical Excellence', 'Recognized for outstanding technical work', 'Star', 2, NOW() - INTERVAL '10 days', jsonb_build_object('color', 'gold')),
  (6, 'Design Quality', 'Consistently delivers high quality flood protection designs', 'Shield', 5, NOW() - INTERVAL '4 days', jsonb_build_object('level', 'silver')),
  (4, 'Process Champion', 'Maintained project documentation standards for 90 days', 'Target', 2, NOW() - INTERVAL '15 days', jsonb_build_object('streakDays', 90))
ON CONFLICT (user_id, name, awarded_at) DO NOTHING;

-- Messages between managers and employees
INSERT INTO messages (sender_id, receiver_id, subject, body, message_type, related_task_id, created_at)
VALUES
  (2, 3, 'Design Review Required', 'Please review embankment design specifications before 3 PM.', 'task', 3, NOW() - INTERVAL '6 hours'),
  (3, 2, 'Design Review Completed', 'Shared the updated embankment design. Awaiting confirmation.', 'task', 3, NOW() - INTERVAL '4 hours'),
  (5, 6, 'Flood Protection Design Review', 'Please validate flood protection design calculations.', 'task', 5, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Notifications for dashboards
INSERT INTO notifications (user_id, type, title, body, metadata, is_read, created_at)
VALUES
  (3, 'TASK', 'Task Approved', 'Embankment Design Review task marked completed', jsonb_build_object('taskId', 3), TRUE, NOW() - INTERVAL '18 hours'),
  (3, 'MESSAGE', 'Manager message', 'Design Review Required', jsonb_build_object('messageType', 'task'), FALSE, NOW() - INTERVAL '6 hours'),
  (6, 'TASK', 'Task awaiting review', 'Flood Protection Design pending approval', jsonb_build_object('taskId', 5), FALSE, NOW() - INTERVAL '1 days'),
  (6, 'UPLOAD', 'PDF received', 'Flood protection design upload pending review', jsonb_build_object('documentId', 2), FALSE, NOW() - INTERVAL '23 hours'),
  (2, 'FILE', 'New document ready', 'Flood Protection Design Report awaiting your review', jsonb_build_object('workFileId', 4), FALSE, NOW() - INTERVAL '2 hours'),
  (3, 'BADGE', 'Badge earned: Technical Excellence', 'Recognized for outstanding technical work', jsonb_build_object('badge', 'Technical Excellence'), FALSE, NOW() - INTERVAL '8 hours'),
  (4, 'TASK', 'New QA task', 'Technical Specifications QA assigned by Rajesh Kumar', jsonb_build_object('taskId', 8), FALSE, NOW() - INTERVAL '4 hours'),
  (2, 'UPLOAD', 'Hydrology report submitted', 'New hydrology analysis report uploaded', jsonb_build_object('documentId', 3), FALSE, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Manual KPI adjustments by managers
INSERT INTO kpi_adjustments (user_id, manager_id, period_start, period_end, delta, reason, created_at)
VALUES
  (3, 2, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 2.5, 'Bonus for exceptional embankment design work', NOW() - INTERVAL '1 days')
ON CONFLICT DO NOTHING;


