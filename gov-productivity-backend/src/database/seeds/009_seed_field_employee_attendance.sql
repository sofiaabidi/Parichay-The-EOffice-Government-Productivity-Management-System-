

-- Employee 10 (Arjun Sharma) - Low attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (10, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 13:30:00+05:30', 4.5000, 'absent'),
  (10, '2025-12-05', '2025-12-05 09:15:00+05:30', '2025-12-05 14:00:00+05:30', 4.7500, 'absent'),
  (10, '2025-12-06', '2025-12-06 09:30:00+05:30', '2025-12-06 14:45:00+05:30', 5.2500, 'absent'),
  (10, '2025-12-07', '2025-12-07 10:00:00+05:30', '2025-12-07 15:30:00+05:30', 5.5000, 'absent'),
  (10, '2025-12-08', '2025-12-08 09:45:00+05:30', '2025-12-08 15:00:00+05:30', 5.2500, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 11 (Priya Das) - Low attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (11, '2025-12-04', '2025-12-04 10:00:00+05:30', '2025-12-04 14:30:00+05:30', 4.5000, 'absent'),
  (11, '2025-12-05', '2025-12-05 10:30:00+05:30', '2025-12-05 15:00:00+05:30', 4.5000, 'absent'),
  (11, '2025-12-06', '2025-12-06 09:00:00+05:30', '2025-12-06 13:00:00+05:30', 4.0000, 'absent'),
  (11, '2025-12-07', '2025-12-07 09:30:00+05:30', '2025-12-07 14:00:00+05:30', 4.5000, 'absent'),
  (11, '2025-12-08', '2025-12-08 10:00:00+05:30', '2025-12-08 15:30:00+05:30', 5.5000, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 12 (Amit Kumar) - Low attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (12, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 15:00:00+05:30', 6.0000, 'absent'),
  (12, '2025-12-05', '2025-12-05 09:30:00+05:30', '2025-12-05 14:30:00+05:30', 5.0000, 'absent'),
  (12, '2025-12-06', '2025-12-06 10:00:00+05:30', '2025-12-06 15:30:00+05:30', 5.5000, 'absent'),
  (12, '2025-12-07', '2025-12-07 09:15:00+05:30', '2025-12-07 14:15:00+05:30', 5.0000, 'absent'),
  (12, '2025-12-08', '2025-12-08 09:45:00+05:30', '2025-12-08 15:15:00+05:30', 5.5000, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 15 (Neha Verma) - Low attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (15, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 14:00:00+05:30', 5.0000, 'absent'),
  (15, '2025-12-05', '2025-12-05 09:30:00+05:30', '2025-12-05 13:30:00+05:30', 4.0000, 'absent'),
  (15, '2025-12-06', '2025-12-06 10:00:00+05:30', '2025-12-06 15:00:00+05:30', 5.0000, 'absent'),
  (15, '2025-12-07', '2025-12-07 09:15:00+05:30', '2025-12-07 14:45:00+05:30', 5.5000, 'absent'),
  (15, '2025-12-08', '2025-12-08 10:15:00+05:30', '2025-12-08 15:15:00+05:30', 5.0000, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 16 (Rohit Desai) - Low attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (16, '2025-12-04', '2025-12-04 09:30:00+05:30', '2025-12-04 14:30:00+05:30', 5.0000, 'absent'),
  (16, '2025-12-05', '2025-12-05 10:00:00+05:30', '2025-12-05 15:30:00+05:30', 5.5000, 'absent'),
  (16, '2025-12-06', '2025-12-06 09:00:00+05:30', '2025-12-06 13:00:00+05:30', 4.0000, 'absent'),
  (16, '2025-12-07', '2025-12-07 09:45:00+05:30', '2025-12-07 14:15:00+05:30', 4.5000, 'absent'),
  (16, '2025-12-08', '2025-12-08 10:30:00+05:30', '2025-12-08 15:00:00+05:30', 4.5000, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();



-- Employee 13 (Sneha Reddy) - High attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (13, '2025-12-04', '2025-12-04 08:00:00+05:30', '2025-12-04 17:30:00+05:30', 9.5000, 'present'),
  (13, '2025-12-05', '2025-12-05 08:30:00+05:30', '2025-12-05 18:00:00+05:30', 9.5000, 'present'),
  (13, '2025-12-06', '2025-12-06 08:00:00+05:30', '2025-12-06 17:00:00+05:30', 9.0000, 'present'),
  (13, '2025-12-07', '2025-12-07 08:15:00+05:30', '2025-12-07 17:45:00+05:30', 9.5000, 'present'),
  (13, '2025-12-08', '2025-12-08 08:30:00+05:30', '2025-12-08 18:00:00+05:30', 9.5000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 18 (Ravi Kumar) - High attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (18, '2025-12-04', '2025-12-04 08:00:00+05:30', '2025-12-04 17:00:00+05:30', 9.0000, 'present'),
  (18, '2025-12-05', '2025-12-05 08:15:00+05:30', '2025-12-05 17:45:00+05:30', 9.5000, 'present'),
  (18, '2025-12-06', '2025-12-06 08:30:00+05:30', '2025-12-06 18:00:00+05:30', 9.5000, 'present'),
  (18, '2025-12-07', '2025-12-07 08:00:00+05:30', '2025-12-07 17:30:00+05:30', 9.5000, 'present'),
  (18, '2025-12-08', '2025-12-08 08:15:00+05:30', '2025-12-08 17:15:00+05:30', 9.0000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 19 (Sunita Devi) - High attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (19, '2025-12-04', '2025-12-04 08:00:00+05:30', '2025-12-04 18:00:00+05:30', 10.0000, 'present'),
  (19, '2025-12-05', '2025-12-05 08:30:00+05:30', '2025-12-05 17:30:00+05:30', 9.0000, 'present'),
  (19, '2025-12-06', '2025-12-06 08:00:00+05:30', '2025-12-06 17:00:00+05:30', 9.0000, 'present'),
  (19, '2025-12-07', '2025-12-07 08:15:00+05:30', '2025-12-07 18:15:00+05:30', 10.0000, 'present'),
  (19, '2025-12-08', '2025-12-08 08:30:00+05:30', '2025-12-08 18:00:00+05:30', 9.5000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 20 (Manoj Singh) - High attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (20, '2025-12-04', '2025-12-04 08:15:00+05:30', '2025-12-04 17:45:00+05:30', 9.5000, 'present'),
  (20, '2025-12-05', '2025-12-05 08:00:00+05:30', '2025-12-05 17:00:00+05:30', 9.0000, 'present'),
  (20, '2025-12-06', '2025-12-06 08:30:00+05:30', '2025-12-06 18:00:00+05:30', 9.5000, 'present'),
  (20, '2025-12-07', '2025-12-07 08:00:00+05:30', '2025-12-07 17:30:00+05:30', 9.5000, 'present'),
  (20, '2025-12-08', '2025-12-08 08:15:00+05:30', '2025-12-08 18:15:00+05:30', 10.0000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 21 (Anjali Sharma) - High attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (21, '2025-12-04', '2025-12-04 08:00:00+05:30', '2025-12-04 17:00:00+05:30', 9.0000, 'present'),
  (21, '2025-12-05', '2025-12-05 08:30:00+05:30', '2025-12-05 18:00:00+05:30', 9.5000, 'present'),
  (21, '2025-12-06', '2025-12-06 08:15:00+05:30', '2025-12-06 17:45:00+05:30', 9.5000, 'present'),
  (21, '2025-12-07', '2025-12-07 08:00:00+05:30', '2025-12-07 17:30:00+05:30', 9.5000, 'present'),
  (21, '2025-12-08', '2025-12-08 08:15:00+05:30', '2025-12-08 17:15:00+05:30', 9.0000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();


-- Employee 17 (Kavita Nair) - Moderate attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (17, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 16:30:00+05:30', 7.5000, 'absent'),
  (17, '2025-12-05', '2025-12-05 09:00:00+05:30', '2025-12-05 17:00:00+05:30', 8.0000, 'present'),
  (17, '2025-12-06', '2025-12-06 09:15:00+05:30', '2025-12-06 17:15:00+05:30', 8.0000, 'present'),
  (17, '2025-12-07', '2025-12-07 09:00:00+05:30', '2025-12-07 16:45:00+05:30', 7.7500, 'absent'),
  (17, '2025-12-08', '2025-12-08 09:30:00+05:30', '2025-12-08 17:30:00+05:30', 8.0000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 23 (Pankaj Mehta) - Moderate attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (23, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 17:00:00+05:30', 8.0000, 'present'),
  (23, '2025-12-05', '2025-12-05 09:15:00+05:30', '2025-12-05 16:45:00+05:30', 7.5000, 'absent'),
  (23, '2025-12-06', '2025-12-06 09:00:00+05:30', '2025-12-06 17:30:00+05:30', 8.5000, 'present'),
  (23, '2025-12-07', '2025-12-07 09:30:00+05:30', '2025-12-07 17:30:00+05:30', 8.0000, 'present'),
  (23, '2025-12-08', '2025-12-08 09:00:00+05:30', '2025-12-08 16:30:00+05:30', 7.5000, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 24 (Rekha Patel) - Moderate attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (24, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 17:15:00+05:30', 8.2500, 'present'),
  (24, '2025-12-05', '2025-12-05 09:30:00+05:30', '2025-12-05 17:00:00+05:30', 7.5000, 'absent'),
  (24, '2025-12-06', '2025-12-06 09:00:00+05:30', '2025-12-06 17:00:00+05:30', 8.0000, 'present'),
  (24, '2025-12-07', '2025-12-07 09:15:00+05:30', '2025-12-07 17:45:00+05:30', 8.5000, 'present'),
  (24, '2025-12-08', '2025-12-08 09:00:00+05:30', '2025-12-08 16:45:00+05:30', 7.7500, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 25 (Vikash Kumar) - Moderate attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (25, '2025-12-04', '2025-12-04 09:15:00+05:30', '2025-12-04 16:45:00+05:30', 7.5000, 'absent'),
  (25, '2025-12-05', '2025-12-05 09:00:00+05:30', '2025-12-05 17:00:00+05:30', 8.0000, 'present'),
  (25, '2025-12-06', '2025-12-06 09:30:00+05:30', '2025-12-06 17:00:00+05:30', 7.5000, 'absent'),
  (25, '2025-12-07', '2025-12-07 09:00:00+05:30', '2025-12-07 17:30:00+05:30', 8.5000, 'present'),
  (25, '2025-12-08', '2025-12-08 09:15:00+05:30', '2025-12-08 17:15:00+05:30', 8.0000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 27 (Meera Nair) - Moderate attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (27, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 17:00:00+05:30', 8.0000, 'present'),
  (27, '2025-12-05', '2025-12-05 09:30:00+05:30', '2025-12-05 17:00:00+05:30', 7.5000, 'absent'),
  (27, '2025-12-06', '2025-12-06 09:00:00+05:30', '2025-12-06 17:30:00+05:30', 8.5000, 'present'),
  (27, '2025-12-07', '2025-12-07 09:15:00+05:30', '2025-12-07 17:15:00+05:30', 8.0000, 'present'),
  (27, '2025-12-08', '2025-12-08 09:00:00+05:30', '2025-12-08 16:45:00+05:30', 7.7500, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 28 (Rajesh Iyer) - Moderate attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (28, '2025-12-04', '2025-12-04 09:15:00+05:30', '2025-12-04 17:45:00+05:30', 8.5000, 'present'),
  (28, '2025-12-05', '2025-12-05 09:00:00+05:30', '2025-12-05 16:30:00+05:30', 7.5000, 'absent'),
  (28, '2025-12-06', '2025-12-06 09:30:00+05:30', '2025-12-06 17:30:00+05:30', 8.0000, 'present'),
  (28, '2025-12-07', '2025-12-07 09:00:00+05:30', '2025-12-07 17:00:00+05:30', 8.0000, 'present'),
  (28, '2025-12-08', '2025-12-08 09:15:00+05:30', '2025-12-08 17:15:00+05:30', 8.0000, 'present')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

-- Employee 29 (Suresh Reddy) - Moderate attendance
INSERT INTO field_employee_attendance (user_id, date, checkin_time, checkout_time, total_time, present_absent)
VALUES
  (29, '2025-12-04', '2025-12-04 09:00:00+05:30', '2025-12-04 16:30:00+05:30', 7.5000, 'absent'),
  (29, '2025-12-05', '2025-12-05 09:30:00+05:30', '2025-12-05 17:30:00+05:30', 8.0000, 'present'),
  (29, '2025-12-06', '2025-12-06 09:00:00+05:30', '2025-12-06 17:00:00+05:30', 8.0000, 'present'),
  (29, '2025-12-07', '2025-12-07 09:15:00+05:30', '2025-12-07 17:45:00+05:30', 8.5000, 'present'),
  (29, '2025-12-08', '2025-12-08 09:00:00+05:30', '2025-12-08 16:45:00+05:30', 7.7500, 'absent')
ON CONFLICT (user_id, date) DO UPDATE SET
  checkin_time = EXCLUDED.checkin_time,
  checkout_time = EXCLUDED.checkout_time,
  total_time = EXCLUDED.total_time,
  present_absent = EXCLUDED.present_absent,
  updated_at = NOW();

