-- Migration: Create skill_score table for task skill matching
-- This table stores skill scores for each task assignment
-- skill_score = number of matched skills / total number of skills required for the task

CREATE TABLE IF NOT EXISTS skill_score (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_score NUMERIC(5,4) NOT NULL CHECK (skill_score >= 0 AND skill_score <= 1),
  matched_skills_count INTEGER NOT NULL DEFAULT 0,
  total_skills_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_score_task_id ON skill_score(task_id);
CREATE INDEX IF NOT EXISTS idx_skill_score_user_id ON skill_score(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_score_user_task ON skill_score(user_id, task_id);

COMMENT ON TABLE skill_score IS 'Skill matching scores for tasks assigned to field employees';
COMMENT ON COLUMN skill_score.skill_score IS 'Ratio of matched skills to total required skills (0-1)';
COMMENT ON COLUMN skill_score.matched_skills_count IS 'Number of employee skills that match task requirements';
COMMENT ON COLUMN skill_score.total_skills_count IS 'Total number of skills required for the task';

-- Function to calculate and update skill_score when a task is assigned
CREATE OR REPLACE FUNCTION calculate_task_skill_score()
RETURNS TRIGGER AS $$
DECLARE
  v_task_id INTEGER;
  v_user_id INTEGER;
  v_matched_count INTEGER;
  v_total_count INTEGER;
  v_skill_score NUMERIC(5,4);
BEGIN
  -- Only process if assigned_to is set and changed
  IF NEW.assigned_to IS NULL THEN
    -- If task is unassigned, delete skill_score records
    DELETE FROM skill_score WHERE task_id = NEW.id;
    RETURN NEW;
  END IF;
  
  v_task_id := NEW.id;
  v_user_id := NEW.assigned_to;
  
  -- Get total number of skills required for this task
  SELECT COUNT(*) INTO v_total_count
  FROM task_skills
  WHERE task_id = v_task_id;
  
  -- If task has no required skills, set score to NULL or 0
  IF v_total_count = 0 THEN
    v_skill_score := 0;
    v_matched_count := 0;
  ELSE
    -- Count matched skills (employee has the skill that task requires)
    SELECT COUNT(*) INTO v_matched_count
    FROM task_skills ts
    JOIN field_employee_skills fes ON ts.skill_id = fes.id
    JOIN field_employee_user_skills feus ON feus.name = fes.skill_name
    WHERE ts.task_id = v_task_id
      AND feus.user_id = v_user_id;
    
    -- Calculate skill_score: matched / total
    v_skill_score := CASE 
      WHEN v_total_count > 0 THEN ROUND(v_matched_count::NUMERIC / v_total_count::NUMERIC, 4)
      ELSE 0
    END;
  END IF;
  
  -- Insert or update skill_score
  INSERT INTO skill_score (task_id, user_id, skill_score, matched_skills_count, total_skills_count, updated_at)
  VALUES (v_task_id, v_user_id, v_skill_score, v_matched_count, v_total_count, NOW())
  ON CONFLICT (task_id, user_id) 
  DO UPDATE SET
    skill_score = EXCLUDED.skill_score,
    matched_skills_count = EXCLUDED.matched_skills_count,
    total_skills_count = EXCLUDED.total_skills_count,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate skill_score when task is assigned or updated
CREATE TRIGGER trigger_calculate_skill_score
  AFTER INSERT OR UPDATE OF assigned_to ON tasks
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION calculate_task_skill_score();

-- Also trigger when task_skills are added/removed (to recalculate existing assignments)
CREATE OR REPLACE FUNCTION recalculate_skill_scores_for_task()
RETURNS TRIGGER AS $$
DECLARE
  v_task_id INTEGER;
  v_user_id INTEGER;
  v_matched_count INTEGER;
  v_total_count INTEGER;
  v_skill_score NUMERIC(5,4);
BEGIN
  -- Get the task_id from the trigger
  IF TG_OP = 'DELETE' THEN
    v_task_id := OLD.task_id;
  ELSE
    v_task_id := NEW.task_id;
  END IF;
  
  -- Recalculate skill_score for all users assigned to this task
  FOR v_user_id IN 
    SELECT DISTINCT assigned_to 
    FROM tasks 
    WHERE id = v_task_id AND assigned_to IS NOT NULL
  LOOP
    -- Get total number of skills required for this task
    SELECT COUNT(*) INTO v_total_count
    FROM task_skills
    WHERE task_id = v_task_id;
    
    -- If task has no required skills, set score to 0
    IF v_total_count = 0 THEN
      v_skill_score := 0;
      v_matched_count := 0;
    ELSE
      -- Count matched skills (employee has the skill that task requires)
      SELECT COUNT(*) INTO v_matched_count
      FROM task_skills ts
      JOIN field_employee_skills fes ON ts.skill_id = fes.id
      JOIN field_employee_user_skills feus ON feus.name = fes.skill_name
      WHERE ts.task_id = v_task_id
        AND feus.user_id = v_user_id;
      
      -- Calculate skill_score: matched / total
      v_skill_score := CASE 
        WHEN v_total_count > 0 THEN ROUND(v_matched_count::NUMERIC / v_total_count::NUMERIC, 4)
        ELSE 0
      END;
    END IF;
    
    -- Update skill_score directly
    INSERT INTO skill_score (task_id, user_id, skill_score, matched_skills_count, total_skills_count, updated_at)
    VALUES (v_task_id, v_user_id, v_skill_score, v_matched_count, v_total_count, NOW())
    ON CONFLICT (task_id, user_id) 
    DO UPDATE SET
      skill_score = EXCLUDED.skill_score,
      matched_skills_count = EXCLUDED.matched_skills_count,
      total_skills_count = EXCLUDED.total_skills_count,
      updated_at = NOW();
  END LOOP;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_on_skill_change
  AFTER INSERT OR UPDATE OR DELETE ON task_skills
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_skill_scores_for_task();

-- Also trigger when employee skills change (to recalculate all their task scores)
CREATE OR REPLACE FUNCTION recalculate_skill_scores_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id INTEGER;
  v_task_id INTEGER;
  v_matched_count INTEGER;
  v_total_count INTEGER;
  v_skill_score NUMERIC(5,4);
BEGIN
  -- Get the user_id from the trigger
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;
  
  -- Recalculate skill_score for all tasks assigned to this user
  FOR v_task_id IN 
    SELECT DISTINCT id 
    FROM tasks 
    WHERE assigned_to = v_user_id
  LOOP
    -- Get total number of skills required for this task
    SELECT COUNT(*) INTO v_total_count
    FROM task_skills
    WHERE task_id = v_task_id;
    
    -- If task has no required skills, set score to 0
    IF v_total_count = 0 THEN
      v_skill_score := 0;
      v_matched_count := 0;
    ELSE
      -- Count matched skills (employee has the skill that task requires)
      SELECT COUNT(*) INTO v_matched_count
      FROM task_skills ts
      JOIN field_employee_skills fes ON ts.skill_id = fes.id
      JOIN field_employee_user_skills feus ON feus.name = fes.skill_name
      WHERE ts.task_id = v_task_id
        AND feus.user_id = v_user_id;
      
      -- Calculate skill_score: matched / total
      v_skill_score := CASE 
        WHEN v_total_count > 0 THEN ROUND(v_matched_count::NUMERIC / v_total_count::NUMERIC, 4)
        ELSE 0
      END;
    END IF;
    
    -- Update skill_score directly
    INSERT INTO skill_score (task_id, user_id, skill_score, matched_skills_count, total_skills_count, updated_at)
    VALUES (v_task_id, v_user_id, v_skill_score, v_matched_count, v_total_count, NOW())
    ON CONFLICT (task_id, user_id) 
    DO UPDATE SET
      skill_score = EXCLUDED.skill_score,
      matched_skills_count = EXCLUDED.matched_skills_count,
      total_skills_count = EXCLUDED.total_skills_count,
      updated_at = NOW();
  END LOOP;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_on_user_skill_change
  AFTER INSERT OR UPDATE OR DELETE ON field_employee_user_skills
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_skill_scores_for_user();

