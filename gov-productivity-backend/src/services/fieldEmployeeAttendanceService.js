const { query } = require('../config/database');
const auditService = require('./auditService');

const startOfDayUtc = (date) => {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const toDateOnly = (value) => {
  if (!value) return null;
  return new Date(value).toISOString().split('T')[0];
};

const toIsoStringOrNull = (value) => (value ? new Date(value).toISOString() : null);

const formatFieldEmployeeAttendanceRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    date: toDateOnly(row.date),
    checkin_time: toIsoStringOrNull(row.checkin_time),
    checkout_time: toIsoStringOrNull(row.checkout_time),
    total_time: row.total_time !== null ? Number(row.total_time) : null,
    present_absent: row.present_absent || null,
  };
};

const checkIn = async (userId, dateInput) => {
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Starting check-in process');
  console.log('[FIELD_EMPLOYEE_CHECK_IN] User ID:', userId);
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Date input:', dateInput);
  
  const date = startOfDayUtc(dateInput);
  const now = new Date();
  
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Normalized date:', date);
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Check-in time:', now.toISOString());
  
  const sql = `
    INSERT INTO field_employee_attendance (user_id, date, checkin_time)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, date)
    DO UPDATE SET checkin_time = $3,
                  checkout_time = NULL,
                  total_time = NULL,
                  present_absent = NULL,
                  updated_at = NOW()
    RETURNING *
  `;
  
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Executing SQL query');
  const { rows } = await query(sql, [userId, date, now]);
  
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Database record created/updated:', {
    id: rows[0].id,
    user_id: rows[0].user_id,
    date: rows[0].date,
    checkin_time: rows[0].checkin_time,
  });
  
  await auditService.logAction(userId, 'FIELD_EMPLOYEE_CHECK_IN', 'field_employee_attendance', rows[0].id, { date });
  
  const formatted = formatFieldEmployeeAttendanceRow(rows[0]);
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Check-in completed successfully');
  console.log('[FIELD_EMPLOYEE_CHECK_IN] Formatted response:', formatted);
  
  return formatted;
};

const checkOut = async (userId, dateInput) => {
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Starting check-out process');
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] User ID:', userId);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Date input:', dateInput);
  
  const date = startOfDayUtc(dateInput);
  const now = new Date();
  
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Normalized date:', date);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Check-out time:', now.toISOString());
  
  // Step 1: Fetch existing attendance record
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Step 1: Fetching existing attendance record from database');
  const existing = await query(
    `SELECT * FROM field_employee_attendance WHERE user_id = $1 AND date = $2`,
    [userId, date],
  );
  
  if (!existing.rows.length) {
    console.error('[FIELD_EMPLOYEE_CHECK_OUT] ERROR: No attendance record found for user', userId, 'on date', date);
    const error = new Error('Check-in not recorded for the day');
    error.statusCode = 400;
    throw error;
  }
  
  const record = existing.rows[0];
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Found existing record:', {
    id: record.id,
    checkin_time: record.checkin_time,
    checkout_time: record.checkout_time,
    total_time: record.total_time,
    present_absent: record.present_absent,
  });
  
  if (!record.checkin_time) {
    console.error('[FIELD_EMPLOYEE_CHECK_OUT] ERROR: Check-in time not found in record');
    const error = new Error('Check-in time not found');
    error.statusCode = 400;
    throw error;
  }
  
  // Step 2: Calculate total time worked
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Step 2: Calculating total time worked');
  const checkInTime = new Date(record.checkin_time);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Check-in time:', checkInTime.toISOString());
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Check-out time:', now.toISOString());
  
  // Calculate total time in hours: (checkout - checkin) in hours
  const timeDifferenceMs = now - checkInTime;
  const totalTimeHours = timeDifferenceMs / (1000 * 60 * 60); // Convert milliseconds to hours
  const totalTimeHoursRounded = parseFloat(totalTimeHours.toFixed(4)); // Round to 4 decimal places and ensure it's a number
  
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Time difference (ms):', timeDifferenceMs);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Total time calculated (hours):', totalTimeHours);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Total time rounded (hours):', totalTimeHoursRounded);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Total time type:', typeof totalTimeHoursRounded);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Total time is NaN?', isNaN(totalTimeHoursRounded));
  
  // Step 3: Check threshold and determine attendance status
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Step 3: Checking threshold and determining attendance status');
  // Threshold: 5 minutes = 5/60 = 0.083333... hours for testing
  // For production, use: const THRESHOLD_HOURS = 8.0; // 8 hours
  const THRESHOLD_HOURS = 5 / 60; // 5 minutes for testing (0.083333... hours)
  
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Threshold (hours):', THRESHOLD_HOURS);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Total time > Threshold?', totalTimeHoursRounded > THRESHOLD_HOURS);
  
  // If total_time > threshold (5 minutes), then present, else absent
  const presentAbsent = totalTimeHoursRounded > THRESHOLD_HOURS ? 'present' : 'absent';
  
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Attendance status determined:', presentAbsent);
  
  // Step 4: Update database with checkout time, total time, and attendance status
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Step 4: Updating database with checkout information');
  
  // Ensure totalTimeHoursRounded is a proper number (not string)
  const totalTimeValue = typeof totalTimeHoursRounded === 'number' ? totalTimeHoursRounded : parseFloat(totalTimeHoursRounded);
  
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Update values:', {
    checkout_time: now.toISOString(),
    total_time: totalTimeValue,
    total_time_type: typeof totalTimeValue,
    present_absent: presentAbsent,
  });
  
  // Use explicit NUMERIC casting to ensure PostgreSQL accepts the decimal value
  // Also validate that totalTimeValue is a valid number
  if (isNaN(totalTimeValue) || !isFinite(totalTimeValue)) {
    console.error('[FIELD_EMPLOYEE_CHECK_OUT] ERROR: Invalid total_time value:', totalTimeValue);
    const error = new Error('Invalid total time calculated');
    error.statusCode = 500;
    throw error;
  }
  
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Executing UPDATE query with parameters:', {
    userId: userId,
    userIdType: typeof userId,
    date: date,
    dateType: typeof date,
    checkout_time: now,
    checkout_timeType: typeof now,
    total_time: totalTimeValue,
    total_timeType: typeof totalTimeValue,
    present_absent: presentAbsent,
    present_absentType: typeof presentAbsent,
  });
  
  let rows;
  try {
    // Use CAST function instead of :: syntax for better compatibility
    // Also ensure the value is passed as a proper number, not a string
    const result = await query(
      `
        UPDATE field_employee_attendance
        SET checkout_time = $3,
            total_time = CAST($4 AS NUMERIC(10,4)),
            present_absent = $5,
            updated_at = NOW()
        WHERE user_id = $1 AND date = $2
        RETURNING *
      `,
      [
        parseInt(userId, 10), // Ensure userId is integer
        date,
        now,
        parseFloat(totalTimeValue), // Ensure totalTimeValue is float
        presentAbsent,
      ],
    );
    rows = result.rows;
  } catch (dbError) {
    console.error('[FIELD_EMPLOYEE_CHECK_OUT] Database error:', dbError.message);
    console.error('[FIELD_EMPLOYEE_CHECK_OUT] Database error details:', dbError);
    console.error('[FIELD_EMPLOYEE_CHECK_OUT] Query parameters that caused error:', {
      userId,
      date,
      checkout_time: now,
      total_time: totalTimeValue,
      present_absent: presentAbsent,
    });
    
    // Check if this is the specific "invalid input syntax for type integer" error
    if (dbError.message && dbError.message.includes('invalid input syntax for type integer')) {
      console.error('[FIELD_EMPLOYEE_CHECK_OUT] CRITICAL: The total_time column appears to be INTEGER instead of NUMERIC');
      console.error('[FIELD_EMPLOYEE_CHECK_OUT] SOLUTION: Run migration 023_fix_field_employee_attendance_total_time.sql to fix the column type');
      const error = new Error('Database schema issue: total_time column must be NUMERIC(10,4), not INTEGER. Please run migration 023 to fix this.');
      error.statusCode = 500;
      error.originalError = dbError;
      throw error;
    }
    
    // Re-throw with more context for other errors
    const error = new Error(`Database update failed: ${dbError.message}`);
    error.statusCode = 500;
    error.originalError = dbError;
    throw error;
  }
  
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Database updated successfully');
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Updated record:', {
    id: rows[0].id,
    checkout_time: rows[0].checkout_time,
    total_time: rows[0].total_time,
    total_time_type: typeof rows[0].total_time,
    present_absent: rows[0].present_absent,
  });
  
  // Step 5: Log audit trail
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Step 5: Logging audit action');
  await auditService.logAction(userId, 'FIELD_EMPLOYEE_CHECK_OUT', 'field_employee_attendance', rows[0].id, { 
    date,
    totalTimeHours: totalTimeHoursRounded,
    presentAbsent
  });
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Audit log created');
  
  const formatted = formatFieldEmployeeAttendanceRow(rows[0]);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Check-out completed successfully');
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Final response:', formatted);
  console.log('[FIELD_EMPLOYEE_CHECK_OUT] Summary:', {
    totalTimeHours: totalTimeHoursRounded,
    threshold: THRESHOLD_HOURS,
    attendanceStatus: presentAbsent,
    markedInCalendar: presentAbsent === 'present' ? 'YES' : 'NO',
  });
  
  // Trigger promotion score recalculation when attendance status changes (async, don't wait)
  // When absent attendance changes, normalization changes for all employees, so recalculate all
  if (presentAbsent === 'absent') {
    console.log(`[Promotion Score Trigger] ATTENDANCE MARKED AS ABSENT - Triggering Promotion Score Recalculation`);
    console.log(`[Promotion Score Trigger] Employee ID: ${userId}`);
    
    const promotionScoreService = require('./promotionScoreService');
    promotionScoreService.calculateAndStorePromotionScores()
      .then(results => {
        console.log(`[Promotion Score Trigger] ✅ Successfully recalculated promotion scores for all ${results.length} employees after attendance change`);
      })
      .catch(err => {
        console.error(`[Promotion Score Trigger] ❌ Error recalculating promotion scores after attendance change:`, err);
      });
  }
  
  return formatted;
};

const getMyAttendance = async (userId, month, year) => {
  const targetMonth = Number(month ?? new Date().getUTCMonth() + 1);
  const targetYear = Number(year ?? new Date().getUTCFullYear());
  const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
  const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));
  const { rows } = await query(
    `
      SELECT *
      FROM field_employee_attendance
      WHERE user_id = $1 AND date BETWEEN $2 AND $3
      ORDER BY date ASC
    `,
    [userId, start, end],
  );
  return rows.map(formatFieldEmployeeAttendanceRow);
};

const getTodayAttendance = async (userId) => {
  const today = startOfDayUtc();
  const { rows } = await query(
    `SELECT * FROM field_employee_attendance WHERE user_id = $1 AND date = $2`,
    [userId, today],
  );
  return rows.length > 0 ? formatFieldEmployeeAttendanceRow(rows[0]) : null;
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayAttendance,
};

