
-- Field Manager for Assam Region
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (9, 'Vikram Mehta', 'vikram@bb.gov.in', crypt('FieldManager@123', gen_salt('bf')), 'FIELD_MANAGER', 'Field Operations - Assam', 'Field Manager')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

-- Field Employees for Assam Region (4 employees)
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (10, 'Arjun Sharma', 'arjun@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Junior Engineer'),
  (11, 'Priya Das', 'priya.das@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Surveyor'),
  (12, 'Amit Kumar', 'amit.kumar@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Site Supervisor'),
  (13, 'Sneha Reddy', 'sneha@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Assam', 'Project Coordinator')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;


-- Field Manager for Arunachal Pradesh Region
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (14, 'Rajesh Singh', 'rajesh.singh@bb.gov.in', crypt('FieldManager@123', gen_salt('bf')), 'FIELD_MANAGER', 'Field Operations - Arunachal Pradesh', 'Field Manager')
ON CONFLICT (id) DO NOTHING;

-- Field Employees for Arunachal Pradesh Region (3 employees)
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (15, 'Neha Verma', 'neha.verma@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Arunachal Pradesh', 'Junior Engineer'),
  (16, 'Rohit Desai', 'rohit@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Arunachal Pradesh', 'Surveyor'),
  (17, 'Kavita Nair', 'kavita@bb.gov.in', crypt('FieldEmployee@123', gen_salt('bf')), 'FIELD_EMPLOYEE', 'Field Operations - Arunachal Pradesh', 'Site Supervisor')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1));



-- Team for Vikram Mehta (Field Manager - Assam, ID 9)
INSERT INTO teams (id, name, manager_id)
VALUES
  (4, 'Field Operations - Assam Team', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;

-- Team for Rajesh Singh (Field Manager - Arunachal Pradesh, ID 14)
INSERT INTO teams (id, name, manager_id)
VALUES
  (5, 'Field Operations - Arunachal Pradesh Team', 14)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;



-- Employees for Vikram Mehta (Assam, Team 4)
-- Initial employees: 10, 11, 12, 13 (additional employees 18-21 will be added in 006_seed_additional_users.sql)
INSERT INTO team_members (team_id, user_id) VALUES
  (4, 10), (4, 11), (4, 12), (4, 13)
ON CONFLICT DO NOTHING;

-- Employees for Rajesh Singh (Arunachal Pradesh, Team 5)
INSERT INTO team_members (team_id, user_id) VALUES
  (5, 15), (5, 16), (5, 17)
ON CONFLICT DO NOTHING;

-- Field Projects for Assam Region (Manager: user 9)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by, budget, dpr_deadline, progress_percent, project_type)
VALUES
  (4, 'Embankment Strengthening near Dibrugarh', 'Strengthening of embankments along Brahmaputra near Dibrugarh to prevent erosion', 'active', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '30 days', 9, '₹45,00,000', CURRENT_DATE + INTERVAL '15 days', 65, 'field'),
  (5, 'River Bank Erosion Control – Majuli Sector', 'Erosion control measures for Majuli island river banks', 'active', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '45 days', 9, '₹78,50,000', CURRENT_DATE + INTERVAL '20 days', 40, 'field'),
  (6, 'Flood Management Infrastructure – Dhubri', 'Flood protection infrastructure installation in Dhubri district', 'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 9, '₹1,20,00,000', CURRENT_DATE + INTERVAL '30 days', 25, 'field')
ON CONFLICT (id) DO NOTHING;

-- Field Projects for Arunachal Pradesh Region (Manager: user 14)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by, budget, dpr_deadline, progress_percent, project_type)
VALUES
  (7, 'Hydrology Survey – Brahmaputra Stretch', 'Comprehensive hydrology survey of Brahmaputra river stretch in Arunachal Pradesh', 'active', CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE + INTERVAL '40 days', 14, '₹60,00,000', CURRENT_DATE + INTERVAL '20 days', 55, 'field'),
  (8, 'Embankment Construction – River Crossing', 'Construction of embankment for river crossing protection', 'active', CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE + INTERVAL '55 days', 14, '₹95,00,000', CURRENT_DATE + INTERVAL '25 days', 30, 'field')
ON CONFLICT (id) DO NOTHING;

-- Project Members (Assam Region projects)
INSERT INTO project_members (project_id, user_id)
VALUES
  (4, 10), (4, 11), (4, 12),
  (5, 10), (5, 13),
  (6, 11), (6, 12), (6, 13)
ON CONFLICT DO NOTHING;

-- Note: Additional Assam employees (18, 19, 20, 21) will be added in 006_seed_additional_users.sql

-- Project Members (Arunachal Pradesh Region projects)
INSERT INTO project_members (project_id, user_id)
VALUES
  (7, 15), (7, 16), (7, 17),
  (8, 15), (8, 16)
ON CONFLICT DO NOTHING;

-- Project Milestones
INSERT INTO project_milestones (id, project_id, name, description, status, deadline, budget, expected_output, progress_percent)
VALUES
  -- Project 4 milestones (Embankment Strengthening near Dibrugarh)
  (1, 4, 'Site Survey & Assessment', 'Detailed site survey report with measurements and photographs', 'completed', CURRENT_DATE - INTERVAL '40 days', '₹5,00,000', 'Detailed site survey report with measurements and photographs', 100),
  (2, 4, 'DPR Draft Preparation', 'Complete DPR with cost estimates and technical specifications', 'in-progress', CURRENT_DATE + INTERVAL '5 days', '₹15,00,000', 'Complete DPR with cost estimates and technical specifications', 65),
  (3, 4, 'Final DPR Submission', 'Final approved DPR with all necessary approvals', 'pending', CURRENT_DATE + INTERVAL '15 days', '₹25,00,000', 'Final approved DPR with all necessary approvals', 0),
  -- Project 5 milestones (River Bank Erosion Control – Majuli Sector)
  (4, 5, 'Preliminary Survey', 'River bank survey and erosion assessment report', 'completed', CURRENT_DATE - INTERVAL '35 days', '₹8,00,000', 'River bank survey and erosion assessment report', 100),
  (5, 5, 'Soil Testing & Analysis', 'Soil test reports and foundation recommendations', 'in-progress', CURRENT_DATE + INTERVAL '10 days', '₹12,00,000', 'Soil test reports and foundation recommendations', 50),
  -- Project 6 milestones (Flood Management Infrastructure – Dhubri)
  (6, 6, 'Site Identification', 'Identification and marking of flood protection points', 'in-progress', CURRENT_DATE + INTERVAL '20 days', '₹15,00,000', 'List of identified flood protection points', 60),
  -- Project 7 milestones (Hydrology Survey – Brahmaputra Stretch)
  (7, 7, 'Hydrology Survey', 'Comprehensive hydrology survey of Brahmaputra stretch', 'in-progress', CURRENT_DATE + INTERVAL '18 days', '₹20,00,000', 'Hydrology survey report', 70),
  (8, 7, 'Data Analysis & Report', 'Detailed hydrology data analysis document', 'pending', CURRENT_DATE + INTERVAL '30 days', '₹25,00,000', 'Hydrology data analysis document', 0),
  -- Project 8 milestones (Embankment Construction – River Crossing)
  (9, 8, 'Embankment Site Survey', 'Complete survey of embankment site', 'completed', CURRENT_DATE - INTERVAL '30 days', '₹18,00,000', 'Embankment site survey report', 100),
  (10, 8, 'Foundation Design', 'Design foundation structure for embankment', 'in-progress', CURRENT_DATE + INTERVAL '20 days', '₹22,00,000', 'Foundation design document', 50)
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('project_milestones_id_seq', GREATEST((SELECT MAX(id) FROM project_milestones), 1));

-- Tasks for Field projects
INSERT INTO tasks (id, title, description, project_id, milestone_id, assigned_to, assigned_by, priority, status, due_date, cost, expected_output, created_at)
VALUES
  -- Project 4 tasks (Embankment Strengthening near Dibrugarh)
  (10, 'Conduct embankment site measurements', 'Measure and document all embankment site dimensions', 4, 1, 10, 9, 'high', 'completed', CURRENT_DATE - INTERVAL '45 days', '₹2,50,000', 'Embankment site measurement report', NOW() - INTERVAL '50 days'),
  (11, 'Take embankment site photographs', 'Document embankment site conditions with photographs', 4, 1, 11, 9, 'medium', 'completed', CURRENT_DATE - INTERVAL '42 days', '₹2,50,000', 'Photo gallery of embankment site', NOW() - INTERVAL '48 days'),
  (12, 'Prepare embankment cost estimates', 'Calculate detailed cost estimates for embankment DPR', 4, 2, 12, 9, 'high', 'awaiting-review', CURRENT_DATE + INTERVAL '2 days', '₹6,00,000', 'Embankment cost estimate spreadsheet', NOW() - INTERVAL '10 days'),
  (13, 'Draft embankment technical specifications', 'Prepare technical specifications document for embankment', 4, 2, 13, 9, 'medium', 'in-progress', CURRENT_DATE + INTERVAL '5 days', '₹5,00,000', 'Embankment technical specifications document', NOW() - INTERVAL '8 days'),
  -- Project 5 tasks (River Bank Erosion Control – Majuli Sector)
  (14, 'River bank mapping', 'Map the river bank erosion zones', 5, 4, 10, 9, 'high', 'completed', CURRENT_DATE - INTERVAL '38 days', '₹4,00,000', 'River bank erosion zone map document', NOW() - INTERVAL '42 days'),
  (15, 'Erosion assessment analysis', 'Analyze erosion patterns and severity', 5, 4, 11, 9, 'high', 'completed', CURRENT_DATE - INTERVAL '35 days', '₹4,00,000', 'Erosion assessment report', NOW() - INTERVAL '40 days'),
  (16, 'Soil sample collection', 'Collect soil samples from multiple erosion points', 5, 5, 12, 9, 'high', 'in-progress', CURRENT_DATE + INTERVAL '5 days', '₹6,00,000', 'Soil samples with documentation', NOW() - INTERVAL '15 days'),
  -- Project 6 tasks (Flood Management Infrastructure – Dhubri)
  (17, 'Flood protection point survey', 'Survey and identify flood protection infrastructure points', 6, 6, 11, 9, 'high', 'in-progress', CURRENT_DATE + INTERVAL '15 days', '₹8,00,000', 'List of flood protection points', NOW() - INTERVAL '20 days'),
  (18, 'Flood infrastructure assessment', 'Assess existing flood protection infrastructure', 6, 6, 12, 9, 'medium', 'pending', CURRENT_DATE + INTERVAL '20 days', '₹7,00,000', 'Flood infrastructure assessment report', NOW() - INTERVAL '18 days'),
  -- Project 7 tasks (Hydrology Survey – Brahmaputra Stretch)
  (19, 'Hydrology zone mapping', 'Map hydrology zones for Brahmaputra stretch', 7, 7, 15, 14, 'high', 'in-progress', CURRENT_DATE + INTERVAL '18 days', '₹10,00,000', 'Hydrology zone map', NOW() - INTERVAL '25 days'),
  (20, 'Hydrology data analysis', 'Analyze hydrology data for Brahmaputra stretch', 7, 8, 16, 14, 'high', 'awaiting-review', CURRENT_DATE + INTERVAL '12 days', '₹12,00,000', 'Hydrology data analysis document', NOW() - INTERVAL '15 days'),
  -- Project 8 tasks (Embankment Construction – River Crossing)
  (21, 'Embankment site survey', 'Survey site for embankment construction', 8, 9, 17, 14, 'high', 'completed', CURRENT_DATE - INTERVAL '30 days', '₹15,00,000', 'Embankment site survey report', NOW() - INTERVAL '32 days'),
  (22, 'Embankment foundation design', 'Design foundation for embankment', 8, 10, 15, 14, 'high', 'in-progress', CURRENT_DATE + INTERVAL '20 days', '₹18,00,000', 'Embankment foundation design document', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('tasks_id_seq', GREATEST((SELECT MAX(id) FROM tasks), 1));

-- Surveys (Assam Region - Manager 9)
INSERT INTO surveys (id, name, description, created_by, status, start_date, end_date)
VALUES
  (1, 'Flood Management Infrastructure Survey 2024', 'Comprehensive survey of flood management infrastructure needs in Assam', 9, 'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days'),
  (2, 'River Bank Erosion Assessment Survey', 'Survey to assess river bank erosion in Brahmaputra basin', 9, 'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days'),
  (3, 'Embankment Condition Assessment', 'Assessment of existing embankment conditions', 9, 'completed', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Surveys (Arunachal Pradesh Region - Manager 14)
INSERT INTO surveys (id, name, description, created_by, status, start_date, end_date)
VALUES
  (4, 'Hydrology Survey 2024', 'Survey for hydrology data collection in Arunachal Pradesh', 14, 'active', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '50 days'),
  (5, 'Embankment Infrastructure Assessment', 'Assessment of embankment infrastructure needs', 14, 'active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '40 days')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('surveys_id_seq', GREATEST((SELECT MAX(id) FROM surveys), 1));

-- Survey Submissions (Assam Region)
INSERT INTO survey_submissions (id, survey_id, submitted_by, submission_data, status, submitted_at)
VALUES
  (1, 1, 10, '{"responses": {"q1": "Good", "q2": "Needs improvement"}}'::jsonb, 'submitted', NOW() - INTERVAL '5 days'),
  (2, 1, 11, '{"responses": {"q1": "Excellent", "q2": "Satisfactory"}}'::jsonb, 'submitted', NOW() - INTERVAL '3 days'),
  (3, 2, 12, '{"responses": {"q1": "Poor", "q2": "Needs urgent attention"}}'::jsonb, 'draft', NULL)
ON CONFLICT (id) DO NOTHING;

-- Survey Submissions (Arunachal Pradesh Region)
INSERT INTO survey_submissions (id, survey_id, submitted_by, submission_data, status, submitted_at)
VALUES
  (4, 4, 15, '{"responses": {"q1": "Very Good", "q2": "Excellent"}}'::jsonb, 'submitted', NOW() - INTERVAL '4 days'),
  (5, 5, 16, '{"responses": {"q1": "Good", "q2": "Satisfactory"}}'::jsonb, 'submitted', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('survey_submissions_id_seq', GREATEST((SELECT MAX(id) FROM survey_submissions), 1));

-- Field Visits
INSERT INTO field_visits (id, visit_type, project_id, survey_id, visited_by, visit_date, location_id, latitude, longitude, notes, status)
VALUES
  (1, 'project', 4, NULL, 10, CURRENT_DATE - INTERVAL '45 days', 'LOC-001', 27.4833, 94.9000, 'Initial site visit for embankment strengthening at Dibrugarh', 'completed'),
  (2, 'project', 4, NULL, 11, CURRENT_DATE - INTERVAL '40 days', 'LOC-002', 27.4900, 94.9100, 'Follow-up visit for embankment measurements', 'completed'),
  (3, 'survey', NULL, 1, 10, CURRENT_DATE - INTERVAL '5 days', 'LOC-003', 26.1661, 94.3264, 'Flood management infrastructure survey visit at Majuli', 'completed'),
  (4, 'project', 5, NULL, 12, CURRENT_DATE - INTERVAL '35 days', 'LOC-004', 26.1661, 94.3264, 'River bank erosion assessment visit at Majuli', 'completed'),
  (5, 'survey', NULL, 2, 11, CURRENT_DATE - INTERVAL '10 days', 'LOC-005', 26.1661, 94.3264, 'River bank erosion survey in progress', 'in-progress')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('field_visits_id_seq', GREATEST((SELECT MAX(id) FROM field_visits), 1));

-- Locations
INSERT INTO locations (id, location_id, user_id, latitude, longitude, description)
VALUES
  (1, 'LOC-001', 10, 27.4833, 94.9000, 'Embankment Site - Dibrugarh'),
  (2, 'LOC-002', 11, 27.4900, 94.9100, 'Embankment Follow-up Site - Dibrugarh'),
  (3, 'LOC-003', 10, 26.1661, 94.3264, 'Flood Management Survey Point - Majuli'),
  (4, 'LOC-004', 12, 26.1661, 94.3264, 'River Bank Erosion Assessment - Majuli'),
  (5, 'LOC-005', 11, 26.1661, 94.3264, 'River Bank Erosion Survey Point - Majuli')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('locations_id_seq', GREATEST((SELECT MAX(id) FROM locations), 1));

-- Task Submissions
INSERT INTO task_submissions (id, task_id, milestone_id, submitted_by, submission_type, cost, status, submitted_at)
VALUES
  (1, 10, 1, 10, 'document', '₹2,50,000', 'approved', NOW() - INTERVAL '45 days'),
  (2, 11, 1, 11, 'image', '₹2,50,000', 'approved', NOW() - INTERVAL '42 days'),
  (3, 12, 2, 12, 'document', '₹6,00,000', 'pending-review', NOW() - INTERVAL '2 days'),
  (4, 14, 4, 10, 'document', '₹4,00,000', 'approved', NOW() - INTERVAL '38 days'),
  (5, 15, 4, 11, 'document', '₹4,00,000', 'approved', NOW() - INTERVAL '35 days')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('task_submissions_id_seq', GREATEST((SELECT MAX(id) FROM task_submissions), 1));

-- Project Evaluations (Assam Region)
INSERT INTO project_evaluations (id, project_id, evaluated_by, quality_score, technical_compliance, remarks)
VALUES
  (1, 4, 9, 8.5, 9.0, 'Excellent work on embankment site survey. DPR draft needs minor revisions in cost estimates.'),
  (2, 5, 9, 8.0, 8.5, 'Good progress on river bank erosion control. Ensure soil testing is completed on schedule.')
ON CONFLICT (id) DO NOTHING;

-- Project Evaluations (Arunachal Pradesh Region)
INSERT INTO project_evaluations (id, project_id, evaluated_by, quality_score, technical_compliance, remarks)
VALUES
  (3, 7, 14, 9.0, 9.5, 'Outstanding hydrology survey planning. Keep up the excellent work.'),
  (4, 8, 14, 8.5, 9.0, 'Embankment construction planning is on track. Maintain quality standards.')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('project_evaluations_id_seq', GREATEST((SELECT MAX(id) FROM project_evaluations), 1));

-- Trainings for Field Employees (Assam Region)
INSERT INTO trainings (user_id, name, status, start_date, completion_date, duration_hours)
VALUES
  (10, 'Flood Management Survey Techniques', 'completed', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '60 days', 16),
  (10, 'DPR Preparation Workshop', 'in-progress', CURRENT_DATE - INTERVAL '30 days', NULL, 24),
  (11, 'Photography for Field Documentation', 'completed', CURRENT_DATE - INTERVAL '75 days', CURRENT_DATE - INTERVAL '60 days', 8),
  (11, 'River Bank Erosion Survey Techniques', 'in-progress', CURRENT_DATE - INTERVAL '20 days', NULL, 16),
  (12, 'Soil Testing Methods for Embankments', 'completed', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '45 days', 12),
  (12, 'Embankment Assessment', 'upcoming', CURRENT_DATE + INTERVAL '10 days', NULL, 20),
  (13, 'Project Coordination', 'completed', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '30 days', 18)
ON CONFLICT DO NOTHING;

-- Trainings for Field Employees (Arunachal Pradesh Region)
INSERT INTO trainings (user_id, name, status, start_date, completion_date, duration_hours)
VALUES
  (15, 'Hydrology Survey Basics', 'completed', CURRENT_DATE - INTERVAL '80 days', CURRENT_DATE - INTERVAL '55 days', 20),
  (15, 'Embankment Construction Techniques', 'in-progress', CURRENT_DATE - INTERVAL '25 days', NULL, 30),
  (16, 'Hydrology Survey Documentation', 'completed', CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE - INTERVAL '50 days', 14),
  (16, 'Embankment Assessment', 'in-progress', CURRENT_DATE - INTERVAL '15 days', NULL, 18),
  (17, 'Field Site Management', 'completed', CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '35 days', 16),
  (17, 'Safety Protocols for Field Work', 'upcoming', CURRENT_DATE + INTERVAL '5 days', NULL, 12)
ON CONFLICT DO NOTHING;

-- Feedback for Field Employees (Assam Region)
INSERT INTO task_feedbacks (task_id, from_user_id, to_user_id, rating, comment, created_at)
VALUES
  (10, 9, 10, 5, 'Excellent embankment site measurements, very detailed and accurate', NOW() - INTERVAL '44 days'),
  (11, 9, 11, 4, 'Good embankment photo documentation, could use more angles', NOW() - INTERVAL '41 days'),
  (14, 9, 10, 5, 'River bank mapping is precise and well-documented', NOW() - INTERVAL '37 days')
ON CONFLICT DO NOTHING;

INSERT INTO manager_feedbacks (manager_id, employee_id, regarding, rating, comment, created_at)
VALUES
  (9, 10, 'Overall Performance', 5, 'Consistently delivers high-quality field work on embankment projects', NOW() - INTERVAL '30 days'),
  (9, 11, 'Survey Accuracy', 4, 'Good survey work on river bank erosion, continue improving documentation', NOW() - INTERVAL '25 days'),
  (9, 12, 'Technical Skills', 5, 'Excellent technical knowledge in flood management and embankment work', NOW() - INTERVAL '20 days'),
  (9, 13, 'Project Management', 4, 'Good coordination skills on flood management projects, keep up the good work', NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- Feedback for Field Employees (Arunachal Pradesh Region)
INSERT INTO manager_feedbacks (manager_id, employee_id, regarding, rating, comment, created_at)
VALUES
  (14, 15, 'Overall Performance', 5, 'Excellent field engineering work on hydrology surveys', NOW() - INTERVAL '28 days'),
  (14, 16, 'Survey Accuracy', 4, 'Good hydrology survey documentation, maintain quality', NOW() - INTERVAL '22 days'),
  (14, 17, 'Site Management', 5, 'Outstanding site supervision and management for embankment projects', NOW() - INTERVAL '18 days')
ON CONFLICT DO NOTHING;

-- KPI Snapshots for Field Employees - North Department
INSERT INTO employee_kpi_snapshots (user_id, period_start, period_end, file_disposal_rate, responsiveness, tat_score, quality_of_drafting, digital_adoption, final_kpi)
VALUES
  (10, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 85, 90, 88, 92, 95, 90),
  (11, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 78, 85, 82, 88, 90, 85),
  (12, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 82, 88, 85, 90, 92, 87),
  (13, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 80, 83, 80, 85, 88, 83)
ON CONFLICT (user_id, period_start, period_end) DO NOTHING;

-- KPI Snapshots for Field Employees - South Department
INSERT INTO employee_kpi_snapshots (user_id, period_start, period_end, file_disposal_rate, responsiveness, tat_score, quality_of_drafting, digital_adoption, final_kpi)
VALUES
  (15, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 88, 92, 90, 94, 96, 92),
  (16, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 82, 87, 84, 89, 91, 87),
  (17, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 85, 89, 87, 91, 93, 89)
ON CONFLICT (user_id, period_start, period_end) DO NOTHING;

-- Manager KPI Snapshots for Field Managers
INSERT INTO manager_kpi_snapshots (manager_id, period_start, period_end, avg_team_kpi, review_ratio, final_kpi)
VALUES
  (9, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 86.25, 95, 88),
  (14, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 89.33, 98, 91)
ON CONFLICT (manager_id, period_start, period_end) DO NOTHING;

