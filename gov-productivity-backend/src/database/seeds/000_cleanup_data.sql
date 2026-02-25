-- Cleanup script: TRUNCATE all data tables in proper order (respecting foreign keys)
-- This script removes all test/junk data while preserving table schemas
-- Run this before re-seeding with Brahmaputra Board data

-- Disable foreign key checks temporarily (PostgreSQL doesn't support this, so we use CASCADE)
-- Order matters: child tables first, then parent tables

-- Field-specific tables (child tables first)
TRUNCATE TABLE field_employee_daily_kpi CASCADE;
TRUNCATE TABLE supervisor_ratings CASCADE;
TRUNCATE TABLE survey_field_visits CASCADE;
TRUNCATE TABLE survey_submission_files CASCADE;
TRUNCATE TABLE survey_submissions CASCADE;
TRUNCATE TABLE survey_members CASCADE;
TRUNCATE TABLE surveys CASCADE;
TRUNCATE TABLE field_visit_files CASCADE;
TRUNCATE TABLE field_visits CASCADE;
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE task_submission_files CASCADE;
TRUNCATE TABLE task_submissions CASCADE;
TRUNCATE TABLE project_field_visit_ratings CASCADE;
TRUNCATE TABLE project_evaluations CASCADE;
TRUNCATE TABLE dpr_reviews CASCADE;
TRUNCATE TABLE field_employee_kpi_snapshots CASCADE;
TRUNCATE TABLE project_milestones CASCADE;

-- KPI and feedback tables
TRUNCATE TABLE kpi_adjustments CASCADE;
TRUNCATE TABLE employee_kpi_snapshots CASCADE;
TRUNCATE TABLE manager_kpi_snapshots CASCADE;
TRUNCATE TABLE manager_feedbacks CASCADE;
TRUNCATE TABLE task_feedbacks CASCADE;

-- File and document tables
TRUNCATE TABLE file_documents CASCADE;
TRUNCATE TABLE work_files CASCADE;

-- Task and project tables
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE project_members CASCADE;
TRUNCATE TABLE projects CASCADE;

-- Attendance and related
TRUNCATE TABLE attendance_adjustments CASCADE;
TRUNCATE TABLE attendance CASCADE;

-- Training and recognition
TRUNCATE TABLE trainings CASCADE;
TRUNCATE TABLE recognitions CASCADE;
TRUNCATE TABLE employee_skills CASCADE;
TRUNCATE TABLE employee_badges CASCADE;

-- Communication
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- Team tables
TRUNCATE TABLE team_members CASCADE;
TRUNCATE TABLE teams CASCADE;

-- Audit logs (must be truncated before deleting users due to foreign key)
TRUNCATE TABLE audit_logs CASCADE;

-- Users table (keep admin, but remove all other users)
-- Note: We'll keep user ID 1 (admin) and recreate others
DELETE FROM users WHERE id > 1;

-- Reset sequences to start from appropriate values
SELECT pg_catalog.setval('users_id_seq', 1, false);
SELECT pg_catalog.setval('projects_id_seq', 1, false);
SELECT pg_catalog.setval('tasks_id_seq', 1, false);
SELECT pg_catalog.setval('work_files_id_seq', 1, false);
SELECT pg_catalog.setval('file_documents_id_seq', 1, false);
SELECT pg_catalog.setval('project_milestones_id_seq', 1, false);
SELECT pg_catalog.setval('surveys_id_seq', 1, false);
SELECT pg_catalog.setval('survey_submissions_id_seq', 1, false);
SELECT pg_catalog.setval('field_visits_id_seq', 1, false);
SELECT pg_catalog.setval('locations_id_seq', 1, false);
SELECT pg_catalog.setval('task_submissions_id_seq', 1, false);
SELECT pg_catalog.setval('project_evaluations_id_seq', 1, false);

