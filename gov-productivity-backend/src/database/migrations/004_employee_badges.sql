CREATE TABLE IF NOT EXISTS employee_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  awarded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  UNIQUE (user_id, name, awarded_at)
);

CREATE INDEX IF NOT EXISTS idx_employee_badges_user ON employee_badges (user_id);


