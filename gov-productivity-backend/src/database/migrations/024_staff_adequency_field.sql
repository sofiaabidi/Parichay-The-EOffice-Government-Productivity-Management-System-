-- Create staff_adequency_field table
-- This table tracks team utilization, output to manpower, and cost to output metrics for field teams

CREATE TABLE IF NOT EXISTS staff_adequency_field (
  team_id INTEGER NOT NULL PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  team_util NUMERIC(10,4), -- Team utilisation rate (mean total_time / 8 for current day)
  otm NUMERIC(15,4), -- Output to manpower (total tasks / team size)
  cto NUMERIC(20,4), -- Cost to output (total cost / completed tasks) - needs large precision for cost values
  current_team_size INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_adequency_field_team ON staff_adequency_field(team_id);

-- Helper function to parse cost string (removes ₹ symbol and commas, converts to numeric)
CREATE OR REPLACE FUNCTION parse_cost(cost_str VARCHAR)
RETURNS NUMERIC AS $$
BEGIN
  IF cost_str IS NULL OR cost_str = '' THEN
    RETURN 0;
  END IF;
  
  -- Remove ₹ symbol, commas, and whitespace, then convert to numeric
  RETURN COALESCE(
    NULLIF(
      REGEXP_REPLACE(
        REGEXP_REPLACE(cost_str, '[₹,]', '', 'g'),
        '[^0-9.]',
        '',
        'g'
      ),
      ''
    )::NUMERIC,
    0
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate team_util for a specific team and date
CREATE OR REPLACE FUNCTION calculate_team_util(team_id_param INTEGER, target_date DATE DEFAULT CURRENT_DATE)
RETURNS NUMERIC AS $$
DECLARE
  avg_total_time NUMERIC;
BEGIN
  -- Get average total_time for all field employees in the team for the target date
  SELECT COALESCE(AVG(fea.total_time), 0)
  INTO avg_total_time
  FROM team_members tm
  JOIN users u ON u.id = tm.user_id
  JOIN field_employee_attendance fea ON fea.user_id = tm.user_id
  WHERE tm.team_id = team_id_param
    AND u.role = 'FIELD_EMPLOYEE'
    AND fea.date = target_date
    AND fea.total_time IS NOT NULL;
  
  -- Divide by 8 to get utilization rate
  RETURN COALESCE(avg_total_time / 8.0, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate otm (output to manpower) for a specific team
CREATE OR REPLACE FUNCTION calculate_otm(team_id_param INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  total_tasks INTEGER;
  team_size INTEGER;
BEGIN
  -- Get total number of tasks assigned to team members
  SELECT COUNT(*)
  INTO total_tasks
  FROM tasks t
  JOIN team_members tm ON tm.user_id = t.assigned_to
  WHERE tm.team_id = team_id_param;
  
  -- Get team size (number of field employees in team)
  SELECT COUNT(*)
  INTO team_size
  FROM team_members tm
  JOIN users u ON u.id = tm.user_id
  WHERE tm.team_id = team_id_param
    AND u.role = 'FIELD_EMPLOYEE';
  
  -- Return 0 if team size is 0 to avoid division by zero
  IF team_size = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN COALESCE(total_tasks::NUMERIC / team_size::NUMERIC, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cto (cost to output) for a specific team
CREATE OR REPLACE FUNCTION calculate_cto(team_id_param INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  total_cost NUMERIC;
  completed_tasks_count INTEGER;
BEGIN
  -- Get total cost of all tasks assigned to team members
  SELECT COALESCE(SUM(parse_cost(t.cost)), 0)
  INTO total_cost
  FROM tasks t
  JOIN team_members tm ON tm.user_id = t.assigned_to
  WHERE tm.team_id = team_id_param
    AND t.cost IS NOT NULL;
  
  -- Get count of completed tasks
  SELECT COUNT(*)
  INTO completed_tasks_count
  FROM tasks t
  JOIN team_members tm ON tm.user_id = t.assigned_to
  WHERE tm.team_id = team_id_param
    AND t.status = 'completed';
  
  -- Return 0 if no completed tasks to avoid division by zero
  IF completed_tasks_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN COALESCE(total_cost / completed_tasks_count::NUMERIC, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get current team size
CREATE OR REPLACE FUNCTION get_current_team_size(team_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
  team_size INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO team_size
  FROM team_members tm
  JOIN users u ON u.id = tm.user_id
  WHERE tm.team_id = team_id_param
    AND u.role = 'FIELD_EMPLOYEE';
  
  RETURN COALESCE(team_size, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update staff_adequency_field for a specific team
CREATE OR REPLACE FUNCTION update_staff_adequency_field(team_id_param INTEGER, target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  v_team_util NUMERIC;
  v_otm NUMERIC;
  v_cto NUMERIC;
  v_team_size INTEGER;
BEGIN
  -- Calculate metrics
  v_team_util := calculate_team_util(team_id_param, target_date);
  v_otm := calculate_otm(team_id_param);
  v_cto := calculate_cto(team_id_param);
  v_team_size := get_current_team_size(team_id_param);
  
  -- Insert or update the record
  INSERT INTO staff_adequency_field (team_id, team_util, otm, cto, current_team_size, last_updated)
  VALUES (team_id_param, v_team_util, v_otm, v_cto, v_team_size, NOW())
  ON CONFLICT (team_id) DO UPDATE SET
    team_util = EXCLUDED.team_util,
    otm = EXCLUDED.otm,
    cto = EXCLUDED.cto,
    current_team_size = EXCLUDED.current_team_size,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update staff_adequency_field for all field teams
CREATE OR REPLACE FUNCTION update_all_staff_adequency_field(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  team_record RECORD;
BEGIN
  -- Loop through all teams that have FIELD_MANAGER as manager
  FOR team_record IN
    SELECT t.id
    FROM teams t
    JOIN users u ON u.id = t.manager_id
    WHERE u.role = 'FIELD_MANAGER'
  LOOP
    PERFORM update_staff_adequency_field(team_record.id, target_date);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update staff_adequency_field when a task is inserted, updated, or deleted
CREATE OR REPLACE FUNCTION trg_update_staff_adequency_on_task()
RETURNS TRIGGER AS $$
DECLARE
  affected_team_id INTEGER;
  user_id_to_check INTEGER;
BEGIN
  -- Determine which user_id to check (NEW for INSERT/UPDATE, OLD for DELETE)
  user_id_to_check := COALESCE(NEW.assigned_to, OLD.assigned_to);
  
  -- Skip if no user_id to check
  IF user_id_to_check IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get the team_id for the assigned_to user
  SELECT tm.team_id INTO affected_team_id
  FROM team_members tm
  JOIN users u ON u.id = tm.user_id
  WHERE tm.user_id = user_id_to_check
    AND u.role = 'FIELD_EMPLOYEE'
  LIMIT 1;
  
  -- If the user belongs to a field team, update the metrics
  IF affected_team_id IS NOT NULL THEN
    PERFORM update_staff_adequency_field(affected_team_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on tasks table for INSERT, UPDATE, and DELETE
CREATE TRIGGER trg_tasks_update_staff_adequency
AFTER INSERT OR UPDATE OF assigned_to, status, cost ON tasks
FOR EACH ROW
WHEN (NEW.assigned_to IS NOT NULL)
EXECUTE FUNCTION trg_update_staff_adequency_on_task();

CREATE TRIGGER trg_tasks_delete_update_staff_adequency
AFTER DELETE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trg_update_staff_adequency_on_task();

-- Trigger function to update staff_adequency_field when team_members changes
CREATE OR REPLACE FUNCTION trg_update_staff_adequency_on_team_member()
RETURNS TRIGGER AS $$
DECLARE
  affected_team_id INTEGER;
BEGIN
  -- Get the team_id from the trigger
  affected_team_id := COALESCE(NEW.team_id, OLD.team_id);
  
  -- Check if this is a field team
  IF EXISTS (
    SELECT 1
    FROM teams t
    JOIN users u ON u.id = t.manager_id
    WHERE t.id = affected_team_id
      AND u.role = 'FIELD_MANAGER'
  ) THEN
    PERFORM update_staff_adequency_field(affected_team_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on team_members table for INSERT and DELETE
CREATE TRIGGER trg_team_members_update_staff_adequency
AFTER INSERT OR DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION trg_update_staff_adequency_on_team_member();

-- Initial population: Create entries for all existing field teams
INSERT INTO staff_adequency_field (team_id, team_util, otm, cto, current_team_size, last_updated)
SELECT 
  t.id,
  calculate_team_util(t.id),
  calculate_otm(t.id),
  calculate_cto(t.id),
  get_current_team_size(t.id),
  NOW()
FROM teams t
JOIN users u ON u.id = t.manager_id
WHERE u.role = 'FIELD_MANAGER'
ON CONFLICT (team_id) DO UPDATE SET
  team_util = EXCLUDED.team_util,
  otm = EXCLUDED.otm,
  cto = EXCLUDED.cto,
  current_team_size = EXCLUDED.current_team_size,
  last_updated = NOW();

