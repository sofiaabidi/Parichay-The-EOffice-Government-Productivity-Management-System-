
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (10, 'Surveying'),
  (10, 'DPR Preparation'),
  (10, 'Field Inspection'),
  (10, 'Measurement Work'),
  (10, 'Technical Compliance')
ON CONFLICT (user_id, name) DO NOTHING;

-- Priya Das (ID 11) - Surveyor - Excellent surveying skills, but missing some technical skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (11, 'Surveying'),
  (11, 'GIS Mapping'),
  (11, 'Field Inspection'),
  (11, 'Measurement Work')
ON CONFLICT (user_id, name) DO NOTHING;

-- Amit Kumar (ID 12) - Site Supervisor - Limited skills, needs training
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (12, 'Field Inspection'),
  (12, 'Measurement Work')
ON CONFLICT (user_id, name) DO NOTHING;

-- Sneha Reddy (ID 13) - Project Coordinator - Good project management skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (13, 'Project Management'),
  (13, 'DPR Preparation'),
  (13, 'Documentation'),
  (13, 'Data Analysis')
ON CONFLICT (user_id, name) DO NOTHING;

-- Arunachal Pradesh Employees (Manager: Rajesh Singh, ID 14)
-- Neha Verma (ID 15) - Junior Engineer - Well-rounded skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (15, 'Surveying'),
  (15, 'DPR Preparation'),
  (15, 'Drafting'),
  (15, 'Field Inspection'),
  (15, 'Technical Compliance'),
  (15, 'CAD Design')
ON CONFLICT (user_id, name) DO NOTHING;

-- Rohit Desai (ID 16) - Surveyor - Strong surveying, weak in documentation
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (16, 'Surveying'),
  (16, 'GIS Mapping'),
  (16, 'Field Inspection'),
  (16, 'Measurement Work'),
  (16, 'Data Analysis')
ON CONFLICT (user_id, name) DO NOTHING;

-- Kavita Nair (ID 17) - Site Supervisor - Basic skills only
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (17, 'Field Inspection'),
  (17, 'Measurement Work'),
  (17, 'Quality Assurance')
ON CONFLICT (user_id, name) DO NOTHING;

-- Additional Assam Employees (Manager: Vikram Mehta, ID 9)
-- Ravi Kumar (ID 18) - Junior Engineer - Good technical skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (18, 'Surveying'),
  (18, 'DPR Preparation'),
  (18, 'Drafting'),
  (18, 'Technical Compliance'),
  (18, 'CAD Design')
ON CONFLICT (user_id, name) DO NOTHING;

-- Sunita Devi (ID 19) - Surveyor - Excellent surveying skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (19, 'Surveying'),
  (19, 'GIS Mapping'),
  (19, 'Field Inspection'),
  (19, 'Measurement Work'),
  (19, 'Data Analysis')
ON CONFLICT (user_id, name) DO NOTHING;

-- Manoj Singh (ID 20) - Site Supervisor - Limited skills, needs significant training
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (20, 'Field Inspection')
ON CONFLICT (user_id, name) DO NOTHING;

-- Anjali Sharma (ID 21) - Project Coordinator - Good management skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (21, 'Project Management'),
  (21, 'DPR Preparation'),
  (21, 'Documentation'),
  (21, 'Quality Assurance')
ON CONFLICT (user_id, name) DO NOTHING;

-- Meghalaya Employees (Manager: Amitabh Das, ID 22)
-- Pankaj Mehta (ID 23) - Junior Engineer - Moderate skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (23, 'Surveying'),
  (23, 'Field Inspection'),
  (23, 'Measurement Work'),
  (23, 'Technical Compliance')
ON CONFLICT (user_id, name) DO NOTHING;

-- Rekha Patel (ID 24) - Surveyor - Strong surveying background
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (24, 'Surveying'),
  (24, 'GIS Mapping'),
  (24, 'Field Inspection'),
  (24, 'Measurement Work'),
  (24, 'Data Analysis')
ON CONFLICT (user_id, name) DO NOTHING;

-- Vikash Kumar (ID 25) - Site Supervisor - Very limited skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (25, 'Field Inspection'),
  (25, 'Measurement Work')
ON CONFLICT (user_id, name) DO NOTHING;

-- Manipur Employees (Manager: Sanjay Verma, ID 26)
-- Meera Nair (ID 27) - Junior Engineer - Good skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (27, 'Surveying'),
  (27, 'DPR Preparation'),
  (27, 'Drafting'),
  (27, 'Field Inspection'),
  (27, 'Technical Compliance')
ON CONFLICT (user_id, name) DO NOTHING;

-- Rajesh Iyer (ID 28) - Surveyor - Excellent skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (28, 'Surveying'),
  (28, 'GIS Mapping'),
  (28, 'Field Inspection'),
  (28, 'Measurement Work'),
  (28, 'Data Analysis'),
  (28, 'CAD Design')
ON CONFLICT (user_id, name) DO NOTHING;

-- Suresh Reddy (ID 29) - Site Supervisor - Basic skills
INSERT INTO field_employee_user_skills (user_id, name) VALUES
  (29, 'Field Inspection'),
  (29, 'Measurement Work'),
  (29, 'Quality Assurance')
ON CONFLICT (user_id, name) DO NOTHING;


INSERT INTO task_skills (task_id, skill_id)
SELECT 10, id FROM field_employee_skills WHERE skill_name IN ('Measurement Work', 'Field Inspection', 'Surveying')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 11: Take embankment site photographs (assigned to 11 - Priya)
INSERT INTO task_skills (task_id, skill_id)
SELECT 11, id FROM field_employee_skills WHERE skill_name IN ('Field Inspection', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 12: Prepare embankment cost estimates (assigned to 12 - Amit)
INSERT INTO task_skills (task_id, skill_id)
SELECT 12, id FROM field_employee_skills WHERE skill_name IN ('DPR Preparation', 'Data Analysis', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 13: Draft embankment technical specifications (assigned to 13 - Sneha)
INSERT INTO task_skills (task_id, skill_id)
SELECT 13, id FROM field_employee_skills WHERE skill_name IN ('Drafting', 'Technical Compliance', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Project 5 tasks (River Bank Erosion Control – Majuli Sector)
-- Task 14: River bank mapping (assigned to 10 - Arjun)
INSERT INTO task_skills (task_id, skill_id)
SELECT 14, id FROM field_employee_skills WHERE skill_name IN ('GIS Mapping', 'Surveying', 'Field Inspection')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 15: Erosion assessment analysis (assigned to 11 - Priya)
INSERT INTO task_skills (task_id, skill_id)
SELECT 15, id FROM field_employee_skills WHERE skill_name IN ('Surveying', 'Data Analysis', 'Technical Compliance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 16: Soil sample collection (assigned to 12 - Amit)
INSERT INTO task_skills (task_id, skill_id)
SELECT 16, id FROM field_employee_skills WHERE skill_name IN ('Field Inspection', 'Measurement Work', 'Quality Assurance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Project 6 tasks (Flood Management Infrastructure – Dhubri)
-- Task 17: Flood protection point survey (assigned to 11 - Priya)
INSERT INTO task_skills (task_id, skill_id)
SELECT 17, id FROM field_employee_skills WHERE skill_name IN ('Surveying', 'GIS Mapping', 'Field Inspection', 'Measurement Work')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 18: Flood infrastructure assessment (assigned to 12 - Amit)
INSERT INTO task_skills (task_id, skill_id)
SELECT 18, id FROM field_employee_skills WHERE skill_name IN ('Field Inspection', 'Technical Compliance', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Project 7 tasks (Hydrology Survey – Brahmaputra Stretch)
-- Task 19: Hydrology zone mapping (assigned to 15 - Neha)
INSERT INTO task_skills (task_id, skill_id)
SELECT 19, id FROM field_employee_skills WHERE skill_name IN ('GIS Mapping', 'Surveying', 'Data Analysis', 'CAD Design')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 20: Hydrology data analysis (assigned to 16 - Rohit)
INSERT INTO task_skills (task_id, skill_id)
SELECT 20, id FROM field_employee_skills WHERE skill_name IN ('Data Analysis', 'DPR Preparation', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Project 8 tasks (Embankment Construction – River Crossing)
-- Task 21: Embankment site survey (assigned to 17 - Kavita)
INSERT INTO task_skills (task_id, skill_id)
SELECT 21, id FROM field_employee_skills WHERE skill_name IN ('Surveying', 'Field Inspection', 'Measurement Work', 'Quality Assurance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 22: Embankment foundation design (assigned to 15 - Neha)
INSERT INTO task_skills (task_id, skill_id)
SELECT 22, id FROM field_employee_skills WHERE skill_name IN ('CAD Design', 'Drafting', 'Technical Compliance', 'DPR Preparation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Additional tasks from seed file 007
-- Task 41: Material Quality Testing (assigned to 18 - Ravi)
INSERT INTO task_skills (task_id, skill_id)
SELECT 41, id FROM field_employee_skills WHERE skill_name IN ('Quality Assurance', 'Technical Compliance', 'Field Inspection')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 42: Safety Inspection (assigned to 19 - Sunita)
INSERT INTO task_skills (task_id, skill_id)
SELECT 42, id FROM field_employee_skills WHERE skill_name IN ('Field Inspection', 'Quality Assurance', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 43: Erosion Monitoring Setup (assigned to 20 - Manoj)
INSERT INTO task_skills (task_id, skill_id)
SELECT 43, id FROM field_employee_skills WHERE skill_name IN ('Field Inspection', 'Measurement Work', 'Technical Compliance', 'Data Analysis')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 44: Vegetation Plan (assigned to 21 - Anjali)
INSERT INTO task_skills (task_id, skill_id)
SELECT 44, id FROM field_employee_skills WHERE skill_name IN ('Project Management', 'DPR Preparation', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 45: Infrastructure Site Survey (assigned to 18 - Ravi)
INSERT INTO task_skills (task_id, skill_id)
SELECT 45, id FROM field_employee_skills WHERE skill_name IN ('Surveying', 'Field Inspection', 'GIS Mapping', 'Measurement Work')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 46: Infrastructure Design Review (assigned to 19 - Sunita)
INSERT INTO task_skills (task_id, skill_id)
SELECT 46, id FROM field_employee_skills WHERE skill_name IN ('Technical Compliance', 'CAD Design', 'Quality Assurance', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 47: Repair Site Assessment (assigned to 18 - Ravi)
INSERT INTO task_skills (task_id, skill_id)
SELECT 47, id FROM field_employee_skills WHERE skill_name IN ('Field Inspection', 'Surveying', 'Technical Compliance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 48: Repair Material Estimation (assigned to 19 - Sunita)
INSERT INTO task_skills (task_id, skill_id)
SELECT 48, id FROM field_employee_skills WHERE skill_name IN ('DPR Preparation', 'Data Analysis', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 49: Repair Work Planning (assigned to 20 - Manoj)
INSERT INTO task_skills (task_id, skill_id)
SELECT 49, id FROM field_employee_skills WHERE skill_name IN ('Project Management', 'DPR Preparation', 'Documentation', 'Technical Compliance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 50: Quality Control Protocol (assigned to 21 - Anjali)
INSERT INTO task_skills (task_id, skill_id)
SELECT 50, id FROM field_employee_skills WHERE skill_name IN ('Quality Assurance', 'Project Management', 'Documentation', 'Technical Compliance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 51: Flood Risk Zone Mapping (assigned to 23 - Pankaj)
INSERT INTO task_skills (task_id, skill_id)
SELECT 51, id FROM field_employee_skills WHERE skill_name IN ('GIS Mapping', 'Surveying', 'Data Analysis', 'Field Inspection')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 52: Control Infrastructure Design (assigned to 24 - Rekha)
INSERT INTO task_skills (task_id, skill_id)
SELECT 52, id FROM field_employee_skills WHERE skill_name IN ('CAD Design', 'Drafting', 'Technical Compliance', 'DPR Preparation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 53: Construction Material Planning (assigned to 25 - Vikash)
INSERT INTO task_skills (task_id, skill_id)
SELECT 53, id FROM field_employee_skills WHERE skill_name IN ('Project Management', 'DPR Preparation', 'Data Analysis', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 54: River Bank Condition Survey (assigned to 23 - Pankaj)
INSERT INTO task_skills (task_id, skill_id)
SELECT 54, id FROM field_employee_skills WHERE skill_name IN ('Surveying', 'Field Inspection', 'Measurement Work', 'GIS Mapping')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 55: Protection Measure Design (assigned to 24 - Rekha)
INSERT INTO task_skills (task_id, skill_id)
SELECT 55, id FROM field_employee_skills WHERE skill_name IN ('CAD Design', 'Drafting', 'Technical Compliance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 56: Environmental Impact Study (assigned to 25 - Vikash)
INSERT INTO task_skills (task_id, skill_id)
SELECT 56, id FROM field_employee_skills WHERE skill_name IN ('Data Analysis', 'DPR Preparation', 'Documentation', 'Technical Compliance')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 57: Construction Site Survey (assigned to 27 - Meera)
INSERT INTO task_skills (task_id, skill_id)
SELECT 57, id FROM field_employee_skills WHERE skill_name IN ('Surveying', 'Field Inspection', 'GIS Mapping', 'Measurement Work')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 58: Embankment Design (assigned to 28 - Rajesh Iyer)
INSERT INTO task_skills (task_id, skill_id)
SELECT 58, id FROM field_employee_skills WHERE skill_name IN ('CAD Design', 'Drafting', 'Technical Compliance', 'DPR Preparation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 59: DPR Preparation (assigned to 29 - Suresh)
INSERT INTO task_skills (task_id, skill_id)
SELECT 59, id FROM field_employee_skills WHERE skill_name IN ('DPR Preparation', 'Documentation', 'Technical Compliance', 'Data Analysis')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 60: River Data Collection (assigned to 27 - Meera)
INSERT INTO task_skills (task_id, skill_id)
SELECT 60, id FROM field_employee_skills WHERE skill_name IN ('Surveying', 'Field Inspection', 'Measurement Work', 'Data Analysis')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 61: Data Validation (assigned to 28 - Rajesh Iyer)
INSERT INTO task_skills (task_id, skill_id)
SELECT 61, id FROM field_employee_skills WHERE skill_name IN ('Data Analysis', 'Quality Assurance', 'Technical Compliance', 'Documentation')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 62: Survey Report Compilation (assigned to 29 - Suresh)
INSERT INTO task_skills (task_id, skill_id)
SELECT 62, id FROM field_employee_skills WHERE skill_name IN ('Documentation', 'DPR Preparation', 'Data Analysis')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 63: Flood Zone Analysis (assigned to 15 - Neha)
INSERT INTO task_skills (task_id, skill_id)
SELECT 63, id FROM field_employee_skills WHERE skill_name IN ('GIS Mapping', 'Data Analysis', 'Surveying', 'Field Inspection')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 64: Management Strategy Design (assigned to 16 - Rohit)
INSERT INTO task_skills (task_id, skill_id)
SELECT 64, id FROM field_employee_skills WHERE skill_name IN ('DPR Preparation', 'Project Management', 'Documentation', 'Data Analysis')
ON CONFLICT (task_id, skill_id) DO NOTHING;

-- Task 65: Implementation Plan (assigned to 17 - Kavita)
INSERT INTO task_skills (task_id, skill_id)
SELECT 65, id FROM field_employee_skills WHERE skill_name IN ('Project Management', 'DPR Preparation', 'Documentation', 'Technical Compliance')
ON CONFLICT (task_id, skill_id) DO NOTHING;



DO $$
DECLARE
  task_rec RECORD;
  matched_count INTEGER;
  total_count INTEGER;
  calculated_score NUMERIC(5,4);
BEGIN
  -- Loop through all tasks that are assigned to field employees
  FOR task_rec IN 
    SELECT id, assigned_to 
    FROM tasks 
    WHERE assigned_to IS NOT NULL 
      AND assigned_to IN (SELECT id FROM users WHERE role = 'FIELD_EMPLOYEE')
  LOOP
    -- Get total number of skills required for this task
    SELECT COUNT(*) INTO total_count
    FROM task_skills
    WHERE task_id = task_rec.id;
    
    IF total_count > 0 THEN
      -- Count matched skills (employee has the skill that task requires)
      SELECT COUNT(*) INTO matched_count
      FROM task_skills ts
      JOIN field_employee_skills fes ON ts.skill_id = fes.id
      JOIN field_employee_user_skills feus ON feus.name = fes.skill_name
      WHERE ts.task_id = task_rec.id
        AND feus.user_id = task_rec.assigned_to;
      
      -- Calculate skill_score: matched / total
      calculated_score := CASE 
        WHEN total_count > 0 THEN ROUND(matched_count::NUMERIC / total_count::NUMERIC, 4)
        ELSE 0
      END;
    ELSE
      matched_count := 0;
      calculated_score := 0;
    END IF;
    
    -- Insert or update skill_score
    INSERT INTO skill_score (task_id, user_id, skill_score, matched_skills_count, total_skills_count, updated_at)
    VALUES (task_rec.id, task_rec.assigned_to, calculated_score, matched_count, total_count, NOW())
    ON CONFLICT (task_id, user_id) 
    DO UPDATE SET
      skill_score = EXCLUDED.skill_score,
      matched_skills_count = EXCLUDED.matched_skills_count,
      total_skills_count = EXCLUDED.total_skills_count,
      updated_at = NOW();
  END LOOP;
END $$;



