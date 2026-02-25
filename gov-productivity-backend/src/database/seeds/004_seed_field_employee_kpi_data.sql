
-- Employee 10 (Arjun Sharma) - Project 4 - DPR Review 1
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (4, 9, 10, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '5 days', 4, 5, 4, 5, 4, 'Good DPR submission')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO UPDATE SET
  actual_submission_date = EXCLUDED.actual_submission_date,
  deadline = EXCLUDED.deadline,
  authenticity_stars = EXCLUDED.authenticity_stars,
  data_correctness_stars = EXCLUDED.data_correctness_stars,
  technical_correctness_stars = EXCLUDED.technical_correctness_stars,
  completeness_stars = EXCLUDED.completeness_stars,
  tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
  updated_at = NOW();

-- Employee 10 - DPR Review 2 (use different project to avoid unique constraint conflict)
-- Using project 5 instead of 4 for the second review
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (5, 9, 10, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '33 days', 5, 4, 5, 4, 5, 'Excellent work')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO NOTHING;

-- Employee 11 (Priya Das) - Project 5 - DPR Review 1
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (5, 9, 11, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '3 days', 5, 5, 4, 5, 5, 'Outstanding submission')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO UPDATE SET
  actual_submission_date = EXCLUDED.actual_submission_date,
  deadline = EXCLUDED.deadline,
  authenticity_stars = EXCLUDED.authenticity_stars,
  data_correctness_stars = EXCLUDED.data_correctness_stars,
  technical_correctness_stars = EXCLUDED.technical_correctness_stars,
  completeness_stars = EXCLUDED.completeness_stars,
  tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
  updated_at = NOW();

-- Employee 11 - DPR Review 2 (use different project to avoid unique constraint conflict)
-- Using project 4 instead of 5 for the second review
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (4, 9, 11, CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '30 days', 4, 5, 5, 4, 5, 'Very good work')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO NOTHING;

-- Add DPR reviews for remaining employees (12, 13, 15, 16, 17)
-- Employee 12 (Amit Kumar) - Project 4 - DPR Review 1
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (4, 9, 12, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '18 days', 4, 4, 4, 4, 4, 'Good submission')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO UPDATE SET
  actual_submission_date = EXCLUDED.actual_submission_date,
  deadline = EXCLUDED.deadline,
  authenticity_stars = EXCLUDED.authenticity_stars,
  data_correctness_stars = EXCLUDED.data_correctness_stars,
  technical_correctness_stars = EXCLUDED.technical_correctness_stars,
  completeness_stars = EXCLUDED.completeness_stars,
  tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
  updated_at = NOW();

-- Employee 12 - DPR Review 2 (use different project to avoid unique constraint conflict)
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (5, 9, 12, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '48 days', 3, 4, 3, 4, 3, 'Satisfactory work')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO NOTHING;

-- Employee 13 (Sneha Reddy) - Project 4 - DPR Review 1
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (4, 9, 13, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '22 days', 3, 4, 3, 3, 4, 'Acceptable submission')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO UPDATE SET
  actual_submission_date = EXCLUDED.actual_submission_date,
  deadline = EXCLUDED.deadline,
  authenticity_stars = EXCLUDED.authenticity_stars,
  data_correctness_stars = EXCLUDED.data_correctness_stars,
  technical_correctness_stars = EXCLUDED.technical_correctness_stars,
  completeness_stars = EXCLUDED.completeness_stars,
  tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
  updated_at = NOW();

-- Employee 13 - DPR Review 2 (use different project to avoid unique constraint conflict)
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (5, 9, 13, CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '52 days', 4, 3, 4, 3, 3, 'Decent work')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO NOTHING;

-- Employees 15, 16, 17 (Arunachal Pradesh) - Project 5
-- Employee 15 - DPR Review 1
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (5, 14, 15, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '12 days', 5, 4, 5, 4, 5, 'Excellent work')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO UPDATE SET
  actual_submission_date = EXCLUDED.actual_submission_date,
  deadline = EXCLUDED.deadline,
  authenticity_stars = EXCLUDED.authenticity_stars,
  data_correctness_stars = EXCLUDED.data_correctness_stars,
  technical_correctness_stars = EXCLUDED.technical_correctness_stars,
  completeness_stars = EXCLUDED.completeness_stars,
  tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
  updated_at = NOW();

-- Employee 15 - DPR Review 2 (use different project to avoid unique constraint conflict)
-- Note: For Arunachal Pradesh employees, we'll need to check what projects exist
-- For now, using project 4 (Assam project) with manager 14 as reviewer
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (4, 14, 15, CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '37 days', 4, 5, 4, 5, 4, 'Very good submission')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO NOTHING;

-- Employee 16 - DPR Review 1
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (5, 14, 16, CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '15 days', 4, 4, 4, 4, 4, 'Good submission')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO UPDATE SET
  actual_submission_date = EXCLUDED.actual_submission_date,
  deadline = EXCLUDED.deadline,
  authenticity_stars = EXCLUDED.authenticity_stars,
  data_correctness_stars = EXCLUDED.data_correctness_stars,
  technical_correctness_stars = EXCLUDED.technical_correctness_stars,
  completeness_stars = EXCLUDED.completeness_stars,
  tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
  updated_at = NOW();

-- Employee 16 - DPR Review 2 (use different project to avoid unique constraint conflict)
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (4, 14, 16, CURRENT_DATE - INTERVAL '38 days', CURRENT_DATE - INTERVAL '40 days', 4, 3, 4, 4, 3, 'Satisfactory work')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO NOTHING;

-- Employee 17 - DPR Review 1
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (5, 14, 17, CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '10 days', 4, 5, 4, 5, 4, 'Outstanding work')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO UPDATE SET
  actual_submission_date = EXCLUDED.actual_submission_date,
  deadline = EXCLUDED.deadline,
  authenticity_stars = EXCLUDED.authenticity_stars,
  data_correctness_stars = EXCLUDED.data_correctness_stars,
  technical_correctness_stars = EXCLUDED.technical_correctness_stars,
  completeness_stars = EXCLUDED.completeness_stars,
  tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
  updated_at = NOW();

-- Employee 17 - DPR Review 2 (use different project to avoid unique constraint conflict)
INSERT INTO dpr_reviews (
  project_id, reviewed_by, reviewed_for,
  actual_submission_date, deadline,
  authenticity_stars, data_correctness_stars,
  technical_correctness_stars, completeness_stars,
  tools_and_resources_stars, remarks
)
VALUES
  (4, 14, 17, CURRENT_DATE - INTERVAL '32 days', CURRENT_DATE - INTERVAL '35 days', 5, 4, 5, 4, 5, 'Excellent submission')
ON CONFLICT (project_id, reviewed_for, reviewed_by) DO NOTHING;

-- Update tasks with planned_duration and planned_completion_date for task timeliness calculation
-- Also add task submissions with costs for expenditure KPI
-- Employee 10 tasks
UPDATE tasks 
SET 
  planned_duration = 5, -- days
  planned_completion_date = due_date,
  cost = '₹2,50,000'
WHERE id = 10 AND assigned_to = 10;

UPDATE tasks 
SET 
  planned_duration = 7, -- days
  planned_completion_date = due_date,
  cost = '₹4,00,000'
WHERE id = 14 AND assigned_to = 10;

-- Employee 11 tasks
UPDATE tasks 
SET 
  planned_duration = 6, -- days
  planned_completion_date = due_date,
  cost = '₹2,50,000'
WHERE id = 11 AND assigned_to = 11;

UPDATE tasks 
SET 
  planned_duration = 8, -- days
  planned_completion_date = due_date,
  cost = '₹4,00,000'
WHERE id = 15 AND assigned_to = 11;

-- Update completed tasks with completed_at dates
UPDATE tasks 
SET completed_at = due_date + INTERVAL '1 day'
WHERE id IN (10, 11, 14, 15) AND status = 'completed';

-- Add tasks with costs and completed status for remaining employees
-- Employee 12 tasks
UPDATE tasks 
SET 
  planned_duration = 6,
  planned_completion_date = due_date,
  cost = '₹3,00,000',
  completed_at = due_date + INTERVAL '2 days',
  status = 'completed'
WHERE assigned_to = 12 AND id IN (SELECT id FROM tasks WHERE assigned_to = 12 LIMIT 2);

-- Employee 13 tasks
UPDATE tasks 
SET 
  planned_duration = 5,
  planned_completion_date = due_date,
  cost = '₹2,75,000',
  completed_at = due_date + INTERVAL '1 day',
  status = 'completed'
WHERE assigned_to = 13 AND id IN (SELECT id FROM tasks WHERE assigned_to = 13 LIMIT 2);

-- Employee 15 tasks
UPDATE tasks 
SET 
  planned_duration = 7,
  planned_completion_date = due_date,
  cost = '₹3,50,000',
  completed_at = due_date + INTERVAL '1 day',
  status = 'completed'
WHERE assigned_to = 15 AND id IN (SELECT id FROM tasks WHERE assigned_to = 15 LIMIT 2);

-- Employee 16 tasks
UPDATE tasks 
SET 
  planned_duration = 6,
  planned_completion_date = due_date,
  cost = '₹3,00,000',
  completed_at = due_date + INTERVAL '2 days',
  status = 'completed'
WHERE assigned_to = 16 AND id IN (SELECT id FROM tasks WHERE assigned_to = 16 LIMIT 2);

-- Employee 17 tasks
UPDATE tasks 
SET 
  planned_duration = 8,
  planned_completion_date = due_date,
  cost = '₹4,25,000',
  completed_at = due_date + INTERVAL '1 day',
  status = 'completed'
WHERE assigned_to = 17 AND id IN (SELECT id FROM tasks WHERE assigned_to = 17 LIMIT 2);

-- Update surveys to ensure they have total_area and expected_time
UPDATE surveys
SET 
  total_area = COALESCE(total_area, '10000'),
  expected_time = COALESCE(expected_time, '50')
WHERE created_by = 9 AND (total_area IS NULL OR expected_time IS NULL);

-- Update survey submissions with proper area_covered and time_taken
-- Employee 10 survey submissions
UPDATE survey_submissions
SET 
  area_covered = '8500',
  time_taken = '45',
  approval_status = 'approved',
  submitted_at = NOW() - INTERVAL '10 days'
WHERE submitted_by = 10 AND survey_id IN (SELECT id FROM surveys WHERE created_by = 9 LIMIT 1);

-- Employee 11 survey submissions
UPDATE survey_submissions
SET 
  area_covered = '9200',
  time_taken = '48',
  approval_status = 'approved',
  submitted_at = NOW() - INTERVAL '8 days'
WHERE submitted_by = 11 AND survey_id IN (SELECT id FROM surveys WHERE created_by = 9 LIMIT 1);

-- Add survey submissions for remaining employees
-- Employee 12 survey submissions
INSERT INTO survey_submissions (survey_id, submitted_by, area_covered, time_taken, notes, approval_status, submitted_at)
SELECT id, 12, '7800', '52', 'Survey completed', 'approved', NOW() - INTERVAL '12 days'
FROM surveys WHERE created_by = 9 LIMIT 1
ON CONFLICT DO NOTHING;

-- Employee 13 survey submissions
INSERT INTO survey_submissions (survey_id, submitted_by, area_covered, time_taken, notes, approval_status, submitted_at)
SELECT id, 13, '7500', '55', 'Survey completed', 'approved', NOW() - INTERVAL '15 days'
FROM surveys WHERE created_by = 9 LIMIT 1
ON CONFLICT DO NOTHING;

-- Employees 15, 16, 17 survey submissions (Arunachal Pradesh)
INSERT INTO survey_submissions (survey_id, submitted_by, area_covered, time_taken, notes, approval_status, submitted_at)
SELECT id, 15, '8800', '46', 'Survey completed', 'approved', NOW() - INTERVAL '9 days'
FROM surveys WHERE created_by = 14 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO survey_submissions (survey_id, submitted_by, area_covered, time_taken, notes, approval_status, submitted_at)
SELECT id, 16, '8200', '50', 'Survey completed', 'approved', NOW() - INTERVAL '11 days'
FROM surveys WHERE created_by = 14 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO survey_submissions (survey_id, submitted_by, area_covered, time_taken, notes, approval_status, submitted_at)
SELECT id, 17, '9000', '44', 'Survey completed', 'approved', NOW() - INTERVAL '7 days'
FROM surveys WHERE created_by = 14 LIMIT 1
ON CONFLICT DO NOTHING;

-- Add supervisor ratings for surveys
-- First, create survey field visits if they don't exist
INSERT INTO survey_field_visits (survey_id, visited_by, visit_date, notes)
SELECT s.id, 9, CURRENT_DATE - INTERVAL '5 days', 'Field visit for survey evaluation'
FROM surveys s
WHERE s.created_by = 9
LIMIT 2
ON CONFLICT DO NOTHING;

-- Add supervisor ratings for employees
INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
SELECT sfv.id, 10, 8.5, 'Good survey work'
FROM survey_field_visits sfv
JOIN surveys s ON s.id = sfv.survey_id
WHERE s.created_by = 9
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
SELECT sfv.id, 11, 9.0, 'Excellent survey accuracy'
FROM survey_field_visits sfv
JOIN surveys s ON s.id = sfv.survey_id
WHERE s.created_by = 9
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add supervisor ratings for remaining employees
INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
SELECT sfv.id, 12, 7.5, 'Good survey work'
FROM survey_field_visits sfv
JOIN surveys s ON s.id = sfv.survey_id
WHERE s.created_by = 9
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
SELECT sfv.id, 13, 7.0, 'Satisfactory survey work'
FROM survey_field_visits sfv
JOIN surveys s ON s.id = sfv.survey_id
WHERE s.created_by = 9
LIMIT 1
ON CONFLICT DO NOTHING;

-- Employees 15, 16, 17 supervisor ratings
INSERT INTO survey_field_visits (survey_id, visited_by, visit_date, notes)
SELECT s.id, 14, CURRENT_DATE - INTERVAL '6 days', 'Field visit for survey evaluation'
FROM surveys s
WHERE s.created_by = 14
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
SELECT sfv.id, 15, 8.5, 'Good survey work'
FROM survey_field_visits sfv
JOIN surveys s ON s.id = sfv.survey_id
WHERE s.created_by = 14
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
SELECT sfv.id, 16, 8.0, 'Good survey work'
FROM survey_field_visits sfv
JOIN surveys s ON s.id = sfv.survey_id
WHERE s.created_by = 14
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
SELECT sfv.id, 17, 8.8, 'Excellent survey work'
FROM survey_field_visits sfv
JOIN surveys s ON s.id = sfv.survey_id
WHERE s.created_by = 14
LIMIT 1
ON CONFLICT DO NOTHING;

-- Ensure project evaluations have technical_compliance for employees
-- Link project evaluations to employees via project_members
INSERT INTO project_members (project_id, user_id)
SELECT DISTINCT pe.project_id, pm.user_id
FROM project_evaluations pe
JOIN projects p ON p.id = pe.project_id
JOIN project_members pm ON pm.project_id = p.id
WHERE pm.user_id IN (10, 11, 12, 13, 15, 16, 17)
ON CONFLICT DO NOTHING;

-- Add project field visits with technical compliance ratings for all employees
-- First, ensure we have project field visits
INSERT INTO field_visits (visit_type, project_id, visited_by, visit_date, notes, status)
VALUES
  -- Project 4 visits (Assam - Manager 9)
  ('project', 4, 9, CURRENT_DATE - INTERVAL '20 days', 'Project field visit for technical compliance check', 'completed'),
  ('project', 4, 9, CURRENT_DATE - INTERVAL '45 days', 'Follow-up project field visit', 'completed'),
  -- Project 5 visits (Arunachal Pradesh - Manager 14)
  ('project', 5, 14, CURRENT_DATE - INTERVAL '18 days', 'Project field visit for technical compliance check', 'completed'),
  ('project', 5, 14, CURRENT_DATE - INTERVAL '40 days', 'Follow-up project field visit', 'completed')
ON CONFLICT DO NOTHING;

-- Add project field visit ratings for all employees
-- Employees 10, 11, 12, 13 (Project 4)
INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
SELECT fv.id, 10, 8.0, 'Good technical compliance'
FROM field_visits fv
WHERE fv.project_id = 4 AND fv.visit_type = 'project' AND fv.status = 'completed'
LIMIT 2
ON CONFLICT (field_visit_id, employee_id) DO UPDATE SET
  technical_compliance = EXCLUDED.technical_compliance,
  remarks = EXCLUDED.remarks;

INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
SELECT fv.id, 11, 8.5, 'Excellent technical compliance'
FROM field_visits fv
WHERE fv.project_id = 4 AND fv.visit_type = 'project' AND fv.status = 'completed'
LIMIT 2
ON CONFLICT (field_visit_id, employee_id) DO UPDATE SET
  technical_compliance = EXCLUDED.technical_compliance,
  remarks = EXCLUDED.remarks;

INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
SELECT fv.id, 12, 7.5, 'Good technical compliance'
FROM field_visits fv
WHERE fv.project_id = 4 AND fv.visit_type = 'project' AND fv.status = 'completed'
LIMIT 2
ON CONFLICT (field_visit_id, employee_id) DO UPDATE SET
  technical_compliance = EXCLUDED.technical_compliance,
  remarks = EXCLUDED.remarks;

INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
SELECT fv.id, 13, 7.2, 'Satisfactory technical compliance'
FROM field_visits fv
WHERE fv.project_id = 4 AND fv.visit_type = 'project' AND fv.status = 'completed'
LIMIT 2
ON CONFLICT (field_visit_id, employee_id) DO UPDATE SET
  technical_compliance = EXCLUDED.technical_compliance,
  remarks = EXCLUDED.remarks;

-- Employees 15, 16, 17 (Project 5)
INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
SELECT fv.id, 15, 8.2, 'Good technical compliance'
FROM field_visits fv
WHERE fv.project_id = 5 AND fv.visit_type = 'project' AND fv.status = 'completed'
LIMIT 2
ON CONFLICT (field_visit_id, employee_id) DO UPDATE SET
  technical_compliance = EXCLUDED.technical_compliance,
  remarks = EXCLUDED.remarks;

INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
SELECT fv.id, 16, 7.8, 'Good technical compliance'
FROM field_visits fv
WHERE fv.project_id = 5 AND fv.visit_type = 'project' AND fv.status = 'completed'
LIMIT 2
ON CONFLICT (field_visit_id, employee_id) DO UPDATE SET
  technical_compliance = EXCLUDED.technical_compliance,
  remarks = EXCLUDED.remarks;

INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
SELECT fv.id, 17, 8.0, 'Good technical compliance'
FROM field_visits fv
WHERE fv.project_id = 5 AND fv.visit_type = 'project' AND fv.status = 'completed'
LIMIT 2
ON CONFLICT (field_visit_id, employee_id) DO UPDATE SET
  technical_compliance = EXCLUDED.technical_compliance,
  remarks = EXCLUDED.remarks;

-- Add task submissions with costs for all employees (for Expenditure KPI)
-- Note: submission_type is required and must be 'file', 'image', or 'document'
-- Employee 10 task submissions
INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 10, 'document', '₹2,45,000', 'approved', NOW() - INTERVAL '5 days'
FROM tasks WHERE assigned_to = 10 AND cost IS NOT NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 10, 'document', '₹3,95,000', 'approved', NOW() - INTERVAL '3 days'
FROM tasks WHERE assigned_to = 10 AND cost IS NOT NULL LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Employee 11 task submissions
INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 11, 'document', '₹2,48,000', 'approved', NOW() - INTERVAL '4 days'
FROM tasks WHERE assigned_to = 11 AND cost IS NOT NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 11, 'document', '₹3,98,000', 'approved', NOW() - INTERVAL '2 days'
FROM tasks WHERE assigned_to = 11 AND cost IS NOT NULL LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Employee 12 task submissions
INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 12, 'document', '₹2,95,000', 'approved', NOW() - INTERVAL '6 days'
FROM tasks WHERE assigned_to = 12 AND cost IS NOT NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 12, 'document', '₹3,10,000', 'approved', NOW() - INTERVAL '4 days'
FROM tasks WHERE assigned_to = 12 AND cost IS NOT NULL LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Employee 13 task submissions
INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 13, 'document', '₹2,70,000', 'approved', NOW() - INTERVAL '7 days'
FROM tasks WHERE assigned_to = 13 AND cost IS NOT NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 13, 'document', '₹2,80,000', 'approved', NOW() - INTERVAL '5 days'
FROM tasks WHERE assigned_to = 13 AND cost IS NOT NULL LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Employee 15 task submissions
INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 15, 'document', '₹3,45,000', 'approved', NOW() - INTERVAL '8 days'
FROM tasks WHERE assigned_to = 15 AND cost IS NOT NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 15, 'document', '₹3,55,000', 'approved', NOW() - INTERVAL '6 days'
FROM tasks WHERE assigned_to = 15 AND cost IS NOT NULL LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Employee 16 task submissions
INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 16, 'document', '₹2,98,000', 'approved', NOW() - INTERVAL '9 days'
FROM tasks WHERE assigned_to = 16 AND cost IS NOT NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 16, 'document', '₹3,05,000', 'approved', NOW() - INTERVAL '7 days'
FROM tasks WHERE assigned_to = 16 AND cost IS NOT NULL LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Employee 17 task submissions
INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 17, 'document', '₹4,20,000', 'approved', NOW() - INTERVAL '10 days'
FROM tasks WHERE assigned_to = 17 AND cost IS NOT NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (task_id, submitted_by, submission_type, cost, status, submitted_at)
SELECT id, 17, 'document', '₹4,30,000', 'approved', NOW() - INTERVAL '8 days'
FROM tasks WHERE assigned_to = 17 AND cost IS NOT NULL LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Add initial dummy KPI snapshots for field employees (current month)
-- This provides starting KPI values that will be updated when recalculation triggers fire
INSERT INTO field_employee_kpi_snapshots (
  user_id, period_start, period_end,
  dpr_kpi, technical_compliance_kpi, survey_kpi,
  expenditure_kpi, task_timeliness_kpi, final_kpi
)
VALUES
  -- Employee 10 (Arjun Sharma) - Assam Region
  (10, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 75.0, 80.0, 70.0, 85.0, 78.0, 77.6),
  -- Employee 11 (Priya Das) - Assam Region
  (11, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 82.0, 85.0, 88.0, 80.0, 85.0, 84.0),
  -- Employee 12 (Amit Kumar) - Assam Region
  (12, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 70.0, 75.0, 65.0, 75.0, 72.0, 71.4),
  -- Employee 13 (Sneha Reddy) - Assam Region
  (13, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 68.0, 72.0, 68.0, 70.0, 70.0, 69.6),
  -- Employee 15 (Neha Verma) - Arunachal Pradesh Region
  (15, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 80.0, 82.0, 75.0, 88.0, 80.0, 81.0),
  -- Employee 16 (Rohit Desai) - Arunachal Pradesh Region
  (16, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 75.0, 78.0, 72.0, 80.0, 75.0, 76.0),
  -- Employee 17 (Kavita Nair) - Arunachal Pradesh Region
  (17, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date, 78.0, 80.0, 78.0, 82.0, 78.0, 79.2)
ON CONFLICT (user_id, period_start, period_end) DO UPDATE SET
  dpr_kpi = EXCLUDED.dpr_kpi,
  technical_compliance_kpi = EXCLUDED.technical_compliance_kpi,
  survey_kpi = EXCLUDED.survey_kpi,
  expenditure_kpi = EXCLUDED.expenditure_kpi,
  task_timeliness_kpi = EXCLUDED.task_timeliness_kpi,
  final_kpi = EXCLUDED.final_kpi,
  updated_at = NOW();

