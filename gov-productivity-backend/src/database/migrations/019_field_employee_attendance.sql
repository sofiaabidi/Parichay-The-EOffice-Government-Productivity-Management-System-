-- Create field-employee-attendance table
CREATE TABLE IF NOT EXISTS field_employee_attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  checkin_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  total_time NUMERIC(10,4), -- Total time in hours
  present_absent VARCHAR(20) CHECK (present_absent IN ('present', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_field_employee_attendance_user_date ON field_employee_attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_field_employee_attendance_date ON field_employee_attendance(date);

