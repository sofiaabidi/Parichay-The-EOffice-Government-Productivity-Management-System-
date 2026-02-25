
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by)
VALUES
  (9, 'River Channel Improvement – Guwahati', 'River channel improvement works for flood mitigation in Guwahati', 'active', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '35 days', 2)
ON CONFLICT (id) DO NOTHING;

-- New project for Suresh Das (River Bank Erosion Control, ID 5)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by)
VALUES
  (10, 'Erosion Control – Tezpur Sector', 'Comprehensive erosion control measures for Tezpur river banks', 'active', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '40 days', 5)
ON CONFLICT (id) DO NOTHING;

-- New project for Anil Kapoor (Hydrology & Survey, ID 30)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by)
VALUES
  (11, 'Water Level Monitoring System', 'Installation of automated water level monitoring stations', 'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', 30),
  (12, 'Brahmaputra Basin Survey', 'Comprehensive survey of entire Brahmaputra river basin', 'active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '50 days', 30)
ON CONFLICT (id) DO NOTHING;


-- Additional project for Vikram Mehta (Assam, ID 9)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by, budget, dpr_deadline, progress_percent, project_type)
VALUES
  (13, 'Embankment Repair – Jorhat', 'Repair and strengthening of existing embankments in Jorhat district', 'active', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '40 days', 9, '₹55,00,000', CURRENT_DATE + INTERVAL '18 days', 45, 'field')
ON CONFLICT (id) DO NOTHING;

-- Projects for Amitabh Das (Meghalaya, ID 22)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by, budget, dpr_deadline, progress_percent, project_type)
VALUES
  (14, 'Flood Control Measures – Shillong', 'Flood control infrastructure for Shillong region', 'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days', 22, '₹65,00,000', CURRENT_DATE + INTERVAL '12 days', 60, 'field'),
  (15, 'River Bank Protection – Tura', 'River bank protection works in Tura district', 'active', CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE + INTERVAL '42 days', 22, '₹48,00,000', CURRENT_DATE + INTERVAL '20 days', 35, 'field')
ON CONFLICT (id) DO NOTHING;

-- Projects for Sanjay Verma (Manipur, ID 26)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by, budget, dpr_deadline, progress_percent, project_type)
VALUES
  (16, 'Embankment Construction – Imphal', 'Construction of new embankments for Imphal valley', 'active', CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE + INTERVAL '32 days', 26, '₹72,00,000', CURRENT_DATE + INTERVAL '15 days', 55, 'field'),
  (17, 'Hydrology Survey – Manipur Rivers', 'Detailed hydrology survey of major rivers in Manipur', 'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', 26, '₹52,00,000', CURRENT_DATE + INTERVAL '22 days', 30, 'field')
ON CONFLICT (id) DO NOTHING;

-- Additional project for Rajesh Singh (Arunachal Pradesh, ID 14)
INSERT INTO projects (id, name, description, status, start_date, due_date, created_by, budget, dpr_deadline, progress_percent, project_type)
VALUES
  (18, 'Flood Management – Itanagar', 'Flood management infrastructure for Itanagar region', 'active', CURRENT_DATE - INTERVAL '22 days', CURRENT_DATE + INTERVAL '38 days', 14, '₹58,00,000', CURRENT_DATE + INTERVAL '16 days', 50, 'field')
ON CONFLICT (id) DO NOTHING;



-- HQ Project 9 (Rajesh Kumar's team)
INSERT INTO project_members (project_id, user_id) VALUES
  (9, 3), (9, 4), (9, 34), (9, 35)
ON CONFLICT DO NOTHING;

-- HQ Project 10 (Suresh Das's team)
INSERT INTO project_members (project_id, user_id) VALUES
  (10, 6), (10, 7)
ON CONFLICT DO NOTHING;

-- HQ Projects 11, 12 (Anil Kapoor's team)
INSERT INTO project_members (project_id, user_id) VALUES
  (11, 31), (11, 32), (11, 33),
  (12, 31), (12, 32)
ON CONFLICT DO NOTHING;

-- Field Project 13 (Vikram Mehta's Assam team - include new employees)
INSERT INTO project_members (project_id, user_id) VALUES
  (13, 18), (13, 19), (13, 20), (13, 21)
ON CONFLICT DO NOTHING;

-- Field Projects 14, 15 (Amitabh Das's Meghalaya team)
INSERT INTO project_members (project_id, user_id) VALUES
  (14, 23), (14, 24), (14, 25),
  (15, 23), (15, 24)
ON CONFLICT DO NOTHING;

-- Field Projects 16, 17 (Sanjay Verma's Manipur team)
INSERT INTO project_members (project_id, user_id) VALUES
  (16, 27), (16, 28), (16, 29),
  (17, 27), (17, 28)
ON CONFLICT DO NOTHING;

-- Field Project 18 (Rajesh Singh's Arunachal Pradesh team)
INSERT INTO project_members (project_id, user_id) VALUES
  (18, 15), (18, 16), (18, 17)
ON CONFLICT DO NOTHING;


INSERT INTO project_milestones (id, project_id, name, description, status, deadline, budget, expected_output, progress_percent)
VALUES
  -- Project 13 milestones (Embankment Repair – Jorhat)
  (11, 13, 'Site Inspection', 'Inspection of existing embankment conditions', 'completed', CURRENT_DATE - INTERVAL '15 days', '₹8,00,000', 'Site inspection report', 100),
  (12, 13, 'Repair Plan Preparation', 'Detailed repair plan with cost estimates', 'in-progress', CURRENT_DATE + INTERVAL '10 days', '₹20,00,000', 'Repair plan document', 60),
  (13, 13, 'Material Procurement', 'Procurement of repair materials', 'pending', CURRENT_DATE + INTERVAL '25 days', '₹27,00,000', 'Material procurement report', 0),
  -- Project 14 milestones (Flood Control Measures – Shillong)
  (14, 14, 'Flood Risk Assessment', 'Assessment of flood risk areas in Shillong', 'completed', CURRENT_DATE - INTERVAL '20 days', '₹12,00,000', 'Flood risk assessment report', 100),
  (15, 14, 'Infrastructure Design', 'Design of flood control infrastructure', 'in-progress', CURRENT_DATE + INTERVAL '8 days', '₹25,00,000', 'Infrastructure design document', 70),
  (16, 14, 'Construction Planning', 'Detailed construction planning', 'pending', CURRENT_DATE + INTERVAL '20 days', '₹28,00,000', 'Construction plan document', 0),
  -- Project 15 milestones (River Bank Protection – Tura)
  (17, 15, 'River Bank Survey', 'Survey of river banks in Tura district', 'in-progress', CURRENT_DATE + INTERVAL '12 days', '₹10,00,000', 'River bank survey report', 55),
  (18, 15, 'Protection Design', 'Design of river bank protection measures', 'pending', CURRENT_DATE + INTERVAL '25 days', '₹18,00,000', 'Protection design document', 0),
  -- Project 16 milestones (Embankment Construction – Imphal)
  (19, 16, 'Site Survey', 'Complete site survey for embankment construction', 'completed', CURRENT_DATE - INTERVAL '20 days', '₹15,00,000', 'Site survey report', 100),
  (20, 16, 'Design & DPR', 'Design and DPR preparation', 'in-progress', CURRENT_DATE + INTERVAL '10 days', '₹30,00,000', 'Design and DPR document', 65),
  (21, 16, 'Approval Process', 'Obtain necessary approvals', 'pending', CURRENT_DATE + INTERVAL '22 days', '₹27,00,000', 'Approval documents', 0),
  -- Project 17 milestones (Hydrology Survey – Manipur Rivers)
  (22, 17, 'Data Collection', 'Collection of hydrology data from rivers', 'in-progress', CURRENT_DATE + INTERVAL '18 days', '₹18,00,000', 'Hydrology data collection report', 50),
  (23, 17, 'Data Analysis', 'Analysis of collected hydrology data', 'pending', CURRENT_DATE + INTERVAL '35 days', '₹20,00,000', 'Data analysis report', 0),
  -- Project 18 milestones (Flood Management – Itanagar)
  (24, 18, 'Flood Zone Mapping', 'Mapping of flood-prone zones in Itanagar', 'completed', CURRENT_DATE - INTERVAL '15 days', '₹12,00,000', 'Flood zone map', 100),
  (25, 18, 'Management Plan', 'Flood management plan preparation', 'in-progress', CURRENT_DATE + INTERVAL '12 days', '₹28,00,000', 'Flood management plan document', 60)
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('project_milestones_id_seq', GREATEST((SELECT MAX(id) FROM project_milestones), 1));



INSERT INTO tasks (id, title, description, project_id, assigned_to, assigned_by, priority, status, due_date, completed_at, created_at)
VALUES
  -- Project 1 (Anti-Erosion Work at Majuli) - Additional tasks
  (23, 'Environmental Impact Assessment', 'Conduct environmental impact assessment for Majuli project', 1, 3, 2, 'high', 'in-progress', CURRENT_DATE + INTERVAL '8 days', NULL, NOW() - INTERVAL '4 days'),
  (24, 'Stakeholder Consultation Report', 'Prepare stakeholder consultation report', 1, 4, 2, 'medium', 'pending', CURRENT_DATE + INTERVAL '10 days', NULL, NOW() - INTERVAL '2 days'),
  (25, 'Budget Review & Approval', 'Review and get budget approval for Majuli project', 1, 34, 2, 'high', 'awaiting-review', CURRENT_DATE + INTERVAL '5 days', NULL, NOW() - INTERVAL '6 days'),
  (26, 'Technical Feasibility Study', 'Conduct technical feasibility study', 1, 35, 2, 'medium', 'in-progress', CURRENT_DATE + INTERVAL '12 days', NULL, NOW() - INTERVAL '3 days'),
  -- Project 2 (Flood Protection Measures – Dhubri) - Additional tasks
  (27, 'Site Selection Report', 'Prepare site selection report for flood protection', 2, 6, 5, 'high', 'completed', CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '1 days', NOW() - INTERVAL '8 days'),
  (28, 'Cost-Benefit Analysis', 'Perform cost-benefit analysis for Dhubri project', 2, 7, 5, 'medium', 'awaiting-review', CURRENT_DATE + INTERVAL '4 days', NULL, NOW() - INTERVAL '5 days'),
  -- Project 9 (River Channel Improvement – Guwahati) - New project tasks
  (29, 'Channel Survey & Mapping', 'Survey and map river channel in Guwahati', 9, 3, 2, 'high', 'in-progress', CURRENT_DATE + INTERVAL '15 days', NULL, NOW() - INTERVAL '10 days'),
  (30, 'Improvement Design', 'Design river channel improvement measures', 9, 4, 2, 'high', 'pending', CURRENT_DATE + INTERVAL '20 days', NULL, NOW() - INTERVAL '8 days'),
  (31, 'Stakeholder Meeting Notes', 'Document stakeholder meeting discussions', 9, 34, 2, 'low', 'completed', CURRENT_DATE - INTERVAL '1 days', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '5 days'),
  (32, 'Environmental Clearance Documentation', 'Prepare documentation for environmental clearance', 9, 35, 2, 'medium', 'in-progress', CURRENT_DATE + INTERVAL '18 days', NULL, NOW() - INTERVAL '6 days'),
  -- Project 10 (Erosion Control – Tezpur Sector) - New project tasks
  (33, 'Erosion Zone Identification', 'Identify critical erosion zones in Tezpur', 10, 6, 5, 'high', 'in-progress', CURRENT_DATE + INTERVAL '12 days', NULL, NOW() - INTERVAL '7 days'),
  (34, 'Control Measures Design', 'Design erosion control measures', 10, 7, 5, 'high', 'pending', CURRENT_DATE + INTERVAL '25 days', NULL, NOW() - INTERVAL '5 days'),
  -- Project 11 (Water Level Monitoring System) - New project tasks
  (35, 'Monitoring Station Site Selection', 'Select sites for water level monitoring stations', 11, 31, 30, 'high', 'in-progress', CURRENT_DATE + INTERVAL '20 days', NULL, NOW() - INTERVAL '8 days'),
  (36, 'Equipment Procurement Plan', 'Prepare equipment procurement plan', 11, 32, 30, 'medium', 'pending', CURRENT_DATE + INTERVAL '28 days', NULL, NOW() - INTERVAL '6 days'),
  (37, 'Installation Schedule', 'Create installation schedule for monitoring stations', 11, 33, 30, 'medium', 'in-progress', CURRENT_DATE + INTERVAL '35 days', NULL, NOW() - INTERVAL '4 days'),
  -- Project 12 (Brahmaputra Basin Survey) - New project tasks
  (38, 'Basin Mapping', 'Map entire Brahmaputra river basin', 12, 31, 30, 'high', 'in-progress', CURRENT_DATE + INTERVAL '30 days', NULL, NOW() - INTERVAL '5 days'),
  (39, 'Data Collection Protocol', 'Develop data collection protocol for basin survey', 12, 32, 30, 'high', 'awaiting-review', CURRENT_DATE + INTERVAL '15 days', NULL, NOW() - INTERVAL '7 days'),
  (40, 'Survey Team Coordination', 'Coordinate survey teams for basin survey', 12, 33, 30, 'medium', 'pending', CURRENT_DATE + INTERVAL '22 days', NULL, NOW() - INTERVAL '3 days')
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


INSERT INTO tasks (id, title, description, project_id, milestone_id, assigned_to, assigned_by, priority, status, due_date, cost, expected_output, created_at)
VALUES
  -- Project 4 (Embankment Strengthening near Dibrugarh) - Additional tasks for new employees
  (41, 'Material Quality Testing', 'Test quality of embankment materials', 4, 2, 18, 9, 'high', 'in-progress', CURRENT_DATE + INTERVAL '3 days', '₹3,00,000', 'Material quality test report', NOW() - INTERVAL '7 days'),
  (42, 'Safety Inspection', 'Conduct safety inspection of embankment site', 4, 2, 19, 9, 'medium', 'pending', CURRENT_DATE + INTERVAL '6 days', '₹2,00,000', 'Safety inspection report', NOW() - INTERVAL '5 days'),
  -- Project 5 (River Bank Erosion Control – Majuli Sector) - Additional tasks
  (43, 'Erosion Monitoring Setup', 'Set up erosion monitoring equipment', 5, 5, 20, 9, 'high', 'in-progress', CURRENT_DATE + INTERVAL '8 days', '₹4,50,000', 'Monitoring setup report', NOW() - INTERVAL '6 days'),
  (44, 'Vegetation Plan', 'Develop vegetation plan for erosion control', 5, 5, 21, 9, 'medium', 'pending', CURRENT_DATE + INTERVAL '12 days', '₹3,50,000', 'Vegetation plan document', NOW() - INTERVAL '4 days'),
  -- Project 6 (Flood Management Infrastructure – Dhubri) - Additional tasks
  (45, 'Infrastructure Site Survey', 'Survey sites for flood management infrastructure', 6, 6, 18, 9, 'high', 'in-progress', CURRENT_DATE + INTERVAL '18 days', '₹5,00,000', 'Site survey report', NOW() - INTERVAL '9 days'),
  (46, 'Infrastructure Design Review', 'Review flood management infrastructure designs', 6, 6, 19, 9, 'high', 'awaiting-review', CURRENT_DATE + INTERVAL '22 days', '₹6,00,000', 'Design review report', NOW() - INTERVAL '8 days'),
  -- Project 13 (Embankment Repair – Jorhat) - New project tasks
  (47, 'Repair Site Assessment', 'Assess embankment repair sites in Jorhat', 13, 11, 18, 9, 'high', 'completed', CURRENT_DATE - INTERVAL '12 days', '₹4,00,000', 'Site assessment report', NOW() - INTERVAL '15 days'),
  (48, 'Repair Material Estimation', 'Estimate materials required for embankment repair', 13, 12, 19, 9, 'high', 'in-progress', CURRENT_DATE + INTERVAL '8 days', '₹8,00,000', 'Material estimation report', NOW() - INTERVAL '10 days'),
  (49, 'Repair Work Planning', 'Plan embankment repair work schedule', 13, 12, 20, 9, 'medium', 'pending', CURRENT_DATE + INTERVAL '15 days', '₹6,00,000', 'Work plan document', NOW() - INTERVAL '7 days'),
  (50, 'Quality Control Protocol', 'Develop quality control protocol for repairs', 13, 12, 21, 9, 'medium', 'in-progress', CURRENT_DATE + INTERVAL '20 days', '₹5,00,000', 'Quality control protocol', NOW() - INTERVAL '5 days'),
  -- Project 14 (Flood Control Measures – Shillong) - New project tasks
  (51, 'Flood Risk Zone Mapping', 'Map flood risk zones in Shillong', 14, 14, 23, 22, 'high', 'completed', CURRENT_DATE - INTERVAL '18 days', '₹7,00,000', 'Flood risk zone map', NOW() - INTERVAL '22 days'),
  (52, 'Control Infrastructure Design', 'Design flood control infrastructure', 14, 15, 24, 22, 'high', 'in-progress', CURRENT_DATE + INTERVAL '6 days', '₹12,00,000', 'Infrastructure design document', NOW() - INTERVAL '12 days'),
  (53, 'Construction Material Planning', 'Plan construction materials for flood control', 14, 15, 25, 22, 'medium', 'pending', CURRENT_DATE + INTERVAL '14 days', '₹9,00,000', 'Material planning document', NOW() - INTERVAL '8 days'),
  -- Project 15 (River Bank Protection – Tura) - New project tasks
  (54, 'River Bank Condition Survey', 'Survey condition of river banks in Tura', 15, 17, 23, 22, 'high', 'in-progress', CURRENT_DATE + INTERVAL '10 days', '₹6,00,000', 'Bank condition survey report', NOW() - INTERVAL '11 days'),
  (55, 'Protection Measure Design', 'Design river bank protection measures', 15, 18, 24, 22, 'high', 'pending', CURRENT_DATE + INTERVAL '22 days', '₹10,00,000', 'Protection design document', NOW() - INTERVAL '9 days'),
  (56, 'Environmental Impact Study', 'Study environmental impact of protection measures', 15, 18, 25, 22, 'medium', 'pending', CURRENT_DATE + INTERVAL '28 days', '₹8,00,000', 'Environmental impact report', NOW() - INTERVAL '6 days'),
  -- Project 16 (Embankment Construction – Imphal) - New project tasks
  (57, 'Construction Site Survey', 'Survey sites for embankment construction', 16, 19, 27, 26, 'high', 'completed', CURRENT_DATE - INTERVAL '18 days', '₹9,00,000', 'Site survey report', NOW() - INTERVAL '22 days'),
  (58, 'Embankment Design', 'Design embankment structure for Imphal', 16, 20, 28, 26, 'high', 'in-progress', CURRENT_DATE + INTERVAL '8 days', '₹15,00,000', 'Embankment design document', NOW() - INTERVAL '14 days'),
  (59, 'DPR Preparation', 'Prepare Detailed Project Report', 16, 20, 29, 26, 'high', 'pending', CURRENT_DATE + INTERVAL '18 days', '₹18,00,000', 'DPR document', NOW() - INTERVAL '10 days'),
  -- Project 17 (Hydrology Survey – Manipur Rivers) - New project tasks
  (60, 'River Data Collection', 'Collect hydrology data from Manipur rivers', 17, 22, 27, 26, 'high', 'in-progress', CURRENT_DATE + INTERVAL '16 days', '₹12,00,000', 'Data collection report', NOW() - INTERVAL '12 days'),
  (61, 'Data Validation', 'Validate collected hydrology data', 17, 23, 28, 26, 'high', 'pending', CURRENT_DATE + INTERVAL '32 days', '₹14,00,000', 'Data validation report', NOW() - INTERVAL '8 days'),
  (62, 'Survey Report Compilation', 'Compile comprehensive hydrology survey report', 17, 23, 29, 26, 'medium', 'pending', CURRENT_DATE + INTERVAL '40 days', '₹16,00,000', 'Survey report document', NOW() - INTERVAL '5 days'),
  -- Project 18 (Flood Management – Itanagar) - New project tasks
  (63, 'Flood Zone Analysis', 'Analyze flood-prone zones in Itanagar', 18, 24, 15, 14, 'high', 'completed', CURRENT_DATE - INTERVAL '12 days', '₹8,00,000', 'Flood zone analysis report', NOW() - INTERVAL '16 days'),
  (64, 'Management Strategy Design', 'Design flood management strategy', 18, 25, 16, 14, 'high', 'in-progress', CURRENT_DATE + INTERVAL '10 days', '₹20,00,000', 'Management strategy document', NOW() - INTERVAL '11 days'),
  (65, 'Implementation Plan', 'Prepare implementation plan for flood management', 18, 25, 17, 14, 'medium', 'pending', CURRENT_DATE + INTERVAL '30 days', '₹18,00,000', 'Implementation plan document', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('tasks_id_seq', GREATEST((SELECT MAX(id) FROM tasks), 1));



INSERT INTO work_files (
  id, employee_id, manager_id, task_id, title, description,
  complexity, complexity_weight, is_digital, target_time_hours, sla_time_hours,
  created_at, first_response_at, completed_at, grammar_score, clarity_score, reviewed_by, reviewed_at
) VALUES
  (8, 3, 2, 23, 'Environmental Impact Assessment Report', 'EIA report for Majuli project',
    'high', 1.5, TRUE, 80, 48,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NULL,
    NULL, NULL, NULL, NULL),
  (9, 34, 2, 25, 'Budget Review Document', 'Budget review and approval document',
    'medium', 1.2, TRUE, 40, 24,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NULL,
    NULL, NULL, 2, NULL),
  (10, 6, 5, 27, 'Site Selection Report', 'Site selection report for Dhubri project',
    'medium', 1.1, TRUE, 36, 24,
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 days',
    0.88, 0.85, 5, NOW() - INTERVAL '18 hours'),
  (11, 31, 30, 35, 'Monitoring Station Site Selection', 'Site selection for water level monitoring',
    'high', 1.4, TRUE, 60, 36,
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NULL,
    NULL, NULL, NULL, NULL),
  (12, 32, 30, 39, 'Data Collection Protocol', 'Protocol for basin survey data collection',
    'medium', 1.3, TRUE, 48, 30,
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', NULL,
    NULL, NULL, 30, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('work_files_id_seq', GREATEST((SELECT MAX(id) FROM work_files), 1));



INSERT INTO task_submissions (id, task_id, milestone_id, submitted_by, submission_type, cost, status, submitted_at)
VALUES
  (6, 41, 2, 18, 'document', '₹3,00,000', 'pending-review', NOW() - INTERVAL '2 days'),
  (7, 47, 11, 18, 'document', '₹4,00,000', 'approved', NOW() - INTERVAL '12 days'),
  (8, 51, 14, 23, 'document', '₹7,00,000', 'approved', NOW() - INTERVAL '18 days'),
  (9, 57, 19, 27, 'document', '₹9,00,000', 'approved', NOW() - INTERVAL '18 days'),
  (10, 63, 24, 15, 'document', '₹8,00,000', 'approved', NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('task_submissions_id_seq', GREATEST((SELECT MAX(id) FROM task_submissions), 1));

