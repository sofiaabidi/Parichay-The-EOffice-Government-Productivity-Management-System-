-- Additional helpers for KPI heavy queries
CREATE INDEX idx_work_files_employee_period ON work_files (employee_id, created_at);
CREATE INDEX idx_work_files_manager ON work_files (manager_id);
CREATE INDEX idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX idx_employee_kpi_period ON employee_kpi_snapshots (period_start, period_end);
CREATE INDEX idx_manager_kpi_period ON manager_kpi_snapshots (period_start, period_end);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_employee_kpi_updated_at
BEFORE UPDATE ON employee_kpi_snapshots
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_manager_kpi_updated_at
BEFORE UPDATE ON manager_kpi_snapshots
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

