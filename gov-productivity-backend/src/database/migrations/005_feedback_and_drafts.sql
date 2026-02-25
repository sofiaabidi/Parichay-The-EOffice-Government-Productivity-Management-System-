-- Add draft_number to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS draft_number INTEGER DEFAULT 1;

-- Create peer feedbacks table
CREATE TABLE IF NOT EXISTS peer_feedbacks (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_user_id INTEGER NOT NULL REFERENCES users(id),
  regarding VARCHAR(200),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_user_id != to_user_id)
);

-- Create manager feedbacks table
CREATE TABLE IF NOT EXISTS manager_feedbacks (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER NOT NULL REFERENCES users(id),
  employee_id INTEGER NOT NULL REFERENCES users(id),
  regarding VARCHAR(200),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (manager_id != employee_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_to_user ON peer_feedbacks(to_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_from_user ON peer_feedbacks(from_user_id);
CREATE INDEX IF NOT EXISTS idx_manager_feedbacks_employee ON manager_feedbacks(employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_feedbacks_manager ON manager_feedbacks(manager_id);

