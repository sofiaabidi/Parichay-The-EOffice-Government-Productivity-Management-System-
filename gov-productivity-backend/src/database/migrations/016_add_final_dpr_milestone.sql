-- Migration: Add "Final DPR Submission" milestone to all existing field projects
-- This migration adds the hardcoded "Final DPR Submission" milestone to all field projects
-- that don't already have it

-- Insert "Final DPR Submission" milestone for all field projects that don't have it
INSERT INTO project_milestones (project_id, name, description, status, deadline, budget, expected_output)
SELECT 
  p.id as project_id,
  'Final DPR Submission' as name,
  'Final DPR submission milestone for project completion' as description,
  'pending' as status,
  p.dpr_deadline as deadline,
  NULL as budget,
  NULL as expected_output
FROM projects p
WHERE p.project_type = 'field'
  AND p.dpr_deadline IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM project_milestones pm 
    WHERE pm.project_id = p.id 
      AND pm.name = 'Final DPR Submission'
  );

-- Also add for field projects without dpr_deadline (use due_date as fallback)
INSERT INTO project_milestones (project_id, name, description, status, deadline, budget, expected_output)
SELECT 
  p.id as project_id,
  'Final DPR Submission' as name,
  'Final DPR submission milestone for project completion' as description,
  'pending' as status,
  COALESCE(p.dpr_deadline, p.due_date) as deadline,
  NULL as budget,
  NULL as expected_output
FROM projects p
WHERE p.project_type = 'field'
  AND p.dpr_deadline IS NULL
  AND p.due_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM project_milestones pm 
    WHERE pm.project_id = p.id 
      AND pm.name = 'Final DPR Submission'
  );

