const { query } = require('../config/database');
const userService = require('./userService');
const kpiService = require('./kpiService');

/**
 * Generate system badges based on various metrics
 * Creates entries in both employee_badges and recognitions tables
 */
const generateSystemBadges = async () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Calculate period dates
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0);
  
  const badgesAwarded = [];
  
  try {
    // 1. Perfect Attendance (Yearly) - Highest attendance
    const attendanceBadge = await awardPerfectAttendanceBadge(yearStart, yearEnd);
    if (attendanceBadge) badgesAwarded.push(attendanceBadge);
    
    // 2. Employee of the Month (KPI based)
    const monthBadge = await awardEmployeeOfMonth(monthStart, monthEnd);
    if (monthBadge) badgesAwarded.push(monthBadge);
    
    // 3. Employee of the Year (KPI based)
    const yearBadge = await awardEmployeeOfYear(yearStart, yearEnd);
    if (yearBadge) badgesAwarded.push(yearBadge);
    
    // 4. Office Sunshine (Best peer feedback - Yearly)
    const sunshineBadge = await awardOfficeSunshine(yearStart, yearEnd);
    if (sunshineBadge) badgesAwarded.push(sunshineBadge);
    
    // 5. Best Performing Team (Department avg KPI - Yearly)
    const teamBadge = await awardBestPerformingTeam(yearStart, yearEnd);
    if (teamBadge) badgesAwarded.push(teamBadge);
    
    // 6. Deadline Smasher (Best on-time with minimum drafts)
    const deadlineBadge = await awardDeadlineSmasher(yearStart, yearEnd);
    if (deadlineBadge) badgesAwarded.push(deadlineBadge);
    
    return {
      success: true,
      badgesAwarded: badgesAwarded.length,
      details: badgesAwarded,
    };
  } catch (error) {
    console.error('Error generating badges:', error);
    throw error;
  }
};

/**
 * Perfect Attendance - Highest attendance rate yearly
 */
const awardPerfectAttendanceBadge = async (yearStart, yearEnd) => {
  const { rows } = await query(
    `
      SELECT 
        u.id,
        u.name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END)::float / 
        NULLIF(COUNT(a.id), 0) * 100 AS attendance_rate,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_days
      FROM users u
      LEFT JOIN attendance a ON a.user_id = u.id 
        AND a.date >= $1 
        AND a.date <= $2
      WHERE u.role = 'EMPLOYEE' AND u.is_active = TRUE
      GROUP BY u.id, u.name
      HAVING COUNT(a.id) > 0
      ORDER BY attendance_rate DESC, present_days DESC
      LIMIT 1
    `,
    [yearStart, yearEnd]
  );
  
  if (rows.length === 0 || !rows[0].id) return null;
  
  const winner = rows[0];
  const badgeName = 'Perfect Attendance';
  const description = `Achieved ${winner.present_days} days of perfect attendance in ${yearStart.getFullYear()} with ${winner.attendance_rate.toFixed(1)}% attendance rate`;
  
  return await createBadgeAndRecognition(winner.id, winner.name, badgeName, description);
};

/**
 * Employee of the Month - Highest KPI for current month
 */
const awardEmployeeOfMonth = async (monthStart, monthEnd) => {
  // Get all employees
  const { rows: employees } = await query(
    `SELECT id, name FROM users WHERE role = 'EMPLOYEE' AND is_active = TRUE`
  );
  
  let highestKpi = 0;
  let winner = null;
  
  for (const employee of employees) {
    // Get KPI snapshot for the month
    const { rows: snapshot } = await query(
      `
        SELECT final_kpi
        FROM employee_kpi_snapshots
        WHERE user_id = $1
          AND period_start = $2
          AND period_end = $3
        LIMIT 1
      `,
      [employee.id, monthStart, monthEnd]
    );
    
    let kpi = 0;
    if (snapshot.length > 0) {
      kpi = Number(snapshot[0].final_kpi) || 0;
    } else {
      // Compute if not exists
      try {
        const metrics = await kpiService.computeEmployeeKpis(
          employee.id,
          monthStart,
          monthEnd,
          { persist: false }
        );
        kpi = metrics.finalKpi || 0;
      } catch (error) {
        console.warn(`Failed to compute KPI for user ${employee.id}:`, error.message);
        continue;
      }
    }
    
    if (kpi > highestKpi) {
      highestKpi = kpi;
      winner = { ...employee, kpi };
    }
  }
  
  if (!winner || highestKpi === 0) return null;
  
  const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const badgeName = 'Employee of the Month';
  const description = `Highest KPI score of ${highestKpi.toFixed(1)} for ${monthName}`;
  
  return await createBadgeAndRecognition(winner.id, winner.name, badgeName, description);
};

/**
 * Employee of the Year - Highest average KPI yearly
 */
const awardEmployeeOfYear = async (yearStart, yearEnd) => {
  // Get all employees
  const { rows: employees } = await query(
    `SELECT id, name FROM users WHERE role = 'EMPLOYEE' AND is_active = TRUE`
  );
  
  let highestAvgKpi = 0;
  let winner = null;
  
  for (const employee of employees) {
    // Get all monthly snapshots for the year
    const { rows: snapshots } = await query(
      `
        SELECT final_kpi
        FROM employee_kpi_snapshots
        WHERE user_id = $1
          AND period_start >= $2
          AND period_end <= $3
      `,
      [employee.id, yearStart, yearEnd]
    );
    
    if (snapshots.length === 0) continue;
    
    const avgKpi = snapshots.reduce((sum, s) => sum + (Number(s.final_kpi) || 0), 0) / snapshots.length;
    
    if (avgKpi > highestAvgKpi) {
      highestAvgKpi = avgKpi;
      winner = { ...employee, avgKpi };
    }
  }
  
  if (!winner || highestAvgKpi === 0) return null;
  
  const badgeName = 'Employee of the Year';
  const description = `Highest average KPI score of ${highestAvgKpi.toFixed(1)} for ${yearStart.getFullYear()}`;
  
  return await createBadgeAndRecognition(winner.id, winner.name, badgeName, description);
};

/**
 * Office Sunshine - Best peer feedback rating (yearly)
 */
const awardOfficeSunshine = async (yearStart, yearEnd) => {
  const { rows } = await query(
    `
      SELECT 
        to_user_id AS user_id,
        u.name,
        AVG(rating)::numeric(5,2) AS avg_rating,
        COUNT(*) AS feedback_count
      FROM peer_feedbacks pf
      JOIN users u ON u.id = pf.to_user_id
      WHERE pf.created_at >= $1 
        AND pf.created_at <= $2
        AND u.role = 'EMPLOYEE'
        AND u.is_active = TRUE
      GROUP BY to_user_id, u.name
      HAVING COUNT(*) >= 3
      ORDER BY avg_rating DESC, feedback_count DESC
      LIMIT 1
    `,
    [yearStart, yearEnd]
  );
  
  if (rows.length === 0 || !rows[0].user_id) return null;
  
  const winner = rows[0];
  const badgeName = 'Office Sunshine';
  const description = `Highest peer feedback rating of ${Number(winner.avg_rating).toFixed(2)} stars from ${winner.feedback_count} peers in ${yearStart.getFullYear()}`;
  
  return await createBadgeAndRecognition(winner.user_id, winner.name, badgeName, description);
};

/**
 * Best Performing Team - Department with highest average KPI (yearly)
 */
const awardBestPerformingTeam = async (yearStart, yearEnd) => {
  // Get all departments
  const { rows: departments } = await query(
    `
      SELECT DISTINCT department
      FROM users
      WHERE department IS NOT NULL 
        AND department != ''
        AND role = 'EMPLOYEE'
        AND is_active = TRUE
    `
  );
  
  let highestAvgKpi = 0;
  let winnerDept = null;
  let winnerEmployees = [];
  
  for (const dept of departments) {
    const { rows: employees } = await query(
      `SELECT id, name FROM users WHERE department = $1 AND role = 'EMPLOYEE' AND is_active = TRUE`,
      [dept.department]
    );
    
    if (employees.length === 0) continue;
    
    let totalKpi = 0;
    let count = 0;
    
    for (const emp of employees) {
      const { rows: snapshots } = await query(
        `
          SELECT AVG(final_kpi)::numeric(5,2) AS avg_kpi
          FROM employee_kpi_snapshots
          WHERE user_id = $1
            AND period_start >= $2
            AND period_end <= $3
        `,
        [emp.id, yearStart, yearEnd]
      );
      
      if (snapshots.length > 0 && snapshots[0].avg_kpi) {
        totalKpi += Number(snapshots[0].avg_kpi);
        count++;
      }
    }
    
    if (count > 0) {
      const avgKpi = totalKpi / count;
      if (avgKpi > highestAvgKpi) {
        highestAvgKpi = avgKpi;
        winnerDept = dept.department;
        winnerEmployees = employees;
      }
    }
  }
  
  if (!winnerDept || highestAvgKpi === 0) return null;
  
  // Award badge to all employees in the winning department
  const results = [];
  for (const emp of winnerEmployees) {
    const badgeName = 'Best Performing Team';
    const description = `Part of the best performing department (${winnerDept}) with average KPI of ${highestAvgKpi.toFixed(1)} in ${yearStart.getFullYear()}`;
    const badge = await createBadgeAndRecognition(emp.id, emp.name, badgeName, description);
    if (badge) results.push(badge);
  }
  
  return results.length > 0 ? results[0] : null; // Return first one as representative
};

/**
 * Deadline Smasher - Best on-time completion with minimum drafts
 */
const awardDeadlineSmasher = async (yearStart, yearEnd) => {
  const { rows } = await query(
    `
      SELECT 
        wf.employee_id AS user_id,
        u.name,
        COUNT(*) AS total_files,
        COUNT(CASE 
          WHEN wf.completed_at IS NOT NULL 
            AND (wf.completed_at::date - wf.created_at::date) <= (wf.sla_time_hours / 24)
          THEN 1 
        END) AS on_time_count,
        AVG(COALESCE(t.draft_number, 1))::numeric(5,2) AS avg_drafts
      FROM work_files wf
      JOIN users u ON u.id = wf.employee_id
      LEFT JOIN tasks t ON t.id = wf.task_id
      WHERE wf.created_at >= $1 
        AND wf.created_at <= $2
        AND u.role = 'EMPLOYEE'
        AND u.is_active = TRUE
        AND wf.completed_at IS NOT NULL
      GROUP BY wf.employee_id, u.name
      HAVING COUNT(*) >= 3
      ORDER BY 
        (COUNT(CASE WHEN wf.completed_at IS NOT NULL 
          AND (wf.completed_at::date - wf.created_at::date) <= (wf.sla_time_hours / 24) 
          THEN 1 END)::float / COUNT(*)) DESC,
        AVG(COALESCE(t.draft_number, 1)) ASC
      LIMIT 1
    `,
    [yearStart, yearEnd]
  );
  
  if (rows.length === 0 || !rows[0].user_id) return null;
  
  const winner = rows[0];
  const onTimeRate = (Number(winner.on_time_count) / Number(winner.total_files) * 100).toFixed(1);
  const badgeName = 'Deadline Smasher';
  const description = `${onTimeRate}% on-time completion rate with average ${Number(winner.avg_drafts).toFixed(1)} drafts per task in ${yearStart.getFullYear()}`;
  
  return await createBadgeAndRecognition(winner.user_id, winner.name, badgeName, description);
};

/**
 * Create badge entry and recognition entry
 */
const createBadgeAndRecognition = async (userId, userName, badgeName, description) => {
  try {
    // Check if badge already awarded this period (prevent duplicates)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // For monthly badges, check this month; for yearly, check this year
    const isYearly = badgeName.includes('Year') || badgeName === 'Perfect Attendance' || 
                     badgeName === 'Office Sunshine' || badgeName === 'Best Performing Team' || 
                     badgeName === 'Deadline Smasher';
    
    const periodStart = isYearly 
      ? new Date(currentYear, 0, 1)
      : new Date(currentYear, currentMonth - 1, 1);
    
    // Check if badge already awarded in this period
    const { rows: existing } = await query(
      `
        SELECT id FROM employee_badges
        WHERE user_id = $1 
          AND name = $2
          AND awarded_at >= $3
        LIMIT 1
      `,
      [userId, badgeName, periodStart]
    );
    
    if (existing.length > 0) {
      console.log(`Badge ${badgeName} already awarded to user ${userId} in this period`);
      return null; // Already awarded
    }
    
    // Create badge entry
    const { rows: badge } = await query(
      `
        INSERT INTO employee_badges (user_id, name, description, awarded_by, awarded_at)
        VALUES ($1, $2, $3, NULL, NOW())
        RETURNING *
      `,
      [userId, badgeName, description]
    );
    
    // Create recognition entry
    await query(
      `
        INSERT INTO recognitions (user_id, title, type, description, date, issued_by)
        VALUES ($1, $2, 'Badge', $3, CURRENT_DATE, 'System')
      `,
      [userId, badgeName, description]
    );
    
    return {
      userId,
      userName,
      badgeName,
      description,
    };
  } catch (error) {
    console.error(`Error creating badge for user ${userId}:`, error);
    return null;
  }
};

module.exports = {
  generateSystemBadges,
};

