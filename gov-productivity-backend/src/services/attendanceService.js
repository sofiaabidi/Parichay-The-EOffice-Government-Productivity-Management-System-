const { query } = require('../config/database');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const startOfDayUtc = (date) => {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const toDateOnly = (value) => {
  if (!value) return null;
  return new Date(value).toISOString().split('T')[0];
};

const toIsoStringOrNull = (value) => (value ? new Date(value).toISOString() : null);

const formatAttendanceRow = (row) => {
  if (!row) return row;
  let workedHours = row.total_hours !== null ? Number(row.total_hours) : null;
  if (
    (workedHours === null || Number.isNaN(workedHours)) &&
    row.check_in_time &&
    row.check_out_time
  ) {
    workedHours = Number(
      ((new Date(row.check_out_time) - new Date(row.check_in_time)) / 36e5).toFixed(2),
    );
  }

  return {
    ...row,
    date: toDateOnly(row.date),
    check_in_time: toIsoStringOrNull(row.check_in_time),
    check_out_time: toIsoStringOrNull(row.check_out_time),
    worked_hours: workedHours ?? 0,
    workedHours: workedHours ?? 0,
  };
};

const checkIn = async (userId, dateInput) => {
  const date = startOfDayUtc(dateInput);
  const now = new Date();
  const sql = `
    INSERT INTO attendance (user_id, date, check_in_time, status)
    VALUES ($1, $2, $3, 'present')
    ON CONFLICT (user_id, date)
    DO UPDATE SET check_in_time = $3,
                  check_out_time = NULL,
                  status = 'present'
    RETURNING *
  `;
  const { rows } = await query(sql, [userId, date, now]);
  await auditService.logAction(userId, 'ATTENDANCE_CHECK_IN', 'attendance', rows[0].id, { date });
  return formatAttendanceRow(rows[0]);
};

const checkOut = async (userId, dateInput) => {
  const date = startOfDayUtc(dateInput);
  const now = new Date();
  const existing = await query(
    `SELECT * FROM attendance WHERE user_id = $1 AND date = $2`,
    [userId, date],
  );
  if (!existing.rows.length) {
    const error = new Error('Check-in not recorded for the day');
    error.statusCode = 400;
    throw error;
  }
  const record = existing.rows[0];
  const checkInTime = record.check_in_time ? new Date(record.check_in_time) : now;
  
  // Calculate hours for this session: checkout - latest checkin
  const sessionHours = (now - checkInTime) / 36e5;
  const sessionHoursRounded = Number(Math.max(sessionHours, 0).toFixed(2));
  
  // Accumulate hours: total_hours = COALESCE(total_hours, 0) + sessionHours
  const existingTotalHours = record.total_hours ? Number(record.total_hours) : 0;
  const newTotalHours = existingTotalHours + sessionHoursRounded;
  
  // Mark as present if total_hours > 0, else absent
  const newStatus = newTotalHours > 0 ? 'present' : 'absent';
  
  const { rows } = await query(
    `
      UPDATE attendance
      SET check_out_time = $3,
          total_hours = $4,
          status = $5
      WHERE user_id = $1 AND date = $2
      RETURNING *
    `,
    [userId, date, now, newTotalHours, newStatus],
  );
  await auditService.logAction(userId, 'ATTENDANCE_CHECK_OUT', 'attendance', rows[0].id, { 
    date,
    sessionHours: sessionHoursRounded,
    totalHours: newTotalHours
  });
  return formatAttendanceRow(rows[0]);
};

const getAttendance = async (userId, month, year) => {
  const targetMonth = Number(month ?? new Date().getUTCMonth() + 1);
  const targetYear = Number(year ?? new Date().getUTCFullYear());
  const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
  const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));
  const { rows } = await query(
    `
      SELECT *
      FROM attendance
      WHERE user_id = $1 AND date BETWEEN $2 AND $3
      ORDER BY date ASC
    `,
    [userId, start, end],
  );
  return rows.map(formatAttendanceRow);
};

const canManagerUpdate = async (managerId, targetUserId) => {
  if (managerId === targetUserId) {
    return true;
  }
  const { rows } = await query(
    `
      SELECT 1
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.manager_id = $1
        AND tm.user_id = $2
      LIMIT 1
    `,
    [managerId, targetUserId],
  );
  return rows.length > 0;
};

const updateAttendanceRecord = async (attendanceId, payload, actor) => {
  const existing = await query(`SELECT * FROM attendance WHERE id = $1`, [attendanceId]);
  if (!existing.rows.length) {
    const error = new Error('Attendance record not found');
    error.statusCode = 404;
    throw error;
  }
  const record = existing.rows[0];
  if (actor.role !== 'ADMIN') {
    const allowed = await canManagerUpdate(actor.id, record.user_id);
    if (!allowed) {
      const error = new Error('Not authorized to update this attendance');
      error.statusCode = 403;
      throw error;
    }
  }

  const nextCheckIn =
    payload.checkInTime !== undefined ? payload.checkInTime : record.check_in_time;
  const nextCheckOut =
    payload.checkOutTime !== undefined ? payload.checkOutTime : record.check_out_time;

  let computedHours = record.total_hours;
  if (nextCheckIn && nextCheckOut) {
    computedHours = Number(((new Date(nextCheckOut) - new Date(nextCheckIn)) / 36e5).toFixed(2));
  }

  const { rows: updatedRows } = await query(
    `
      UPDATE attendance
      SET status = COALESCE($2, status),
          check_in_time = COALESCE($3, check_in_time),
          check_out_time = COALESCE($4, check_out_time),
          total_hours = COALESCE($5, total_hours)
      WHERE id = $1
      RETURNING *
    `,
    [
      attendanceId,
      payload.status || null,
      payload.checkInTime || null,
      payload.checkOutTime || null,
      computedHours,
    ],
  );

  await query(
    `
      INSERT INTO attendance_adjustments (attendance_id, manager_id, adjustment)
      VALUES ($1,$2,$3)
    `,
    [attendanceId, actor.id, JSON.stringify(payload || {})],
  );

  await auditService.logAction(actor.id, 'ATTENDANCE_MANUAL_UPDATE', 'attendance', attendanceId, {
    payload,
  });

  // Notification will be created if notificationService is fully implemented
  try {
    await notificationService.createNotification(record.user_id, {
      type: 'ATTENDANCE',
      title: 'Attendance updated',
      body: 'Your manager updated one of your attendance entries.',
      metadata: {
        attendanceId,
        date: record.date,
      },
    });
  } catch (err) {
    // Silently fail if notification service is not fully implemented
    console.warn('Notification service not available:', err.message);
  }

  return formatAttendanceRow(updatedRows[0]);
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  updateAttendanceRecord,
};

