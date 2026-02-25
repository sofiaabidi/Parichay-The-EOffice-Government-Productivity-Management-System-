const { query } = require('../config/database');
const User = require('../models/User');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const getUserTeams = async (userId) => {
  const sql = `
    SELECT t.id, t.name, t.manager_id
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = $1
  `;
  const { rows } = await query(sql, [userId]);
  return rows;
};

const getManagerTeam = async (managerId) => {
  const teamSql = `
    SELECT t.id, t.name, t.created_at
    FROM teams t
    WHERE t.manager_id = $1
  `;
  const teamsResult = await query(teamSql, [managerId]);

  const members = await User.listTeamMembersByManager(managerId);

  await auditService.logAction(managerId, 'MANAGER_TEAM_VIEW', 'teams', null, {
    memberCount: members.length,
  });

  return {
    teams: teamsResult.rows,
    members,
  };
};

const getEmployeePeers = async (employeeId) => {
  // Get employee's department and role first
  const { rows: employeeRow } = await query(
    `SELECT department, role FROM users WHERE id = $1`,
    [employeeId]
  );
  
  if (!employeeRow[0]) {
    console.warn(`Employee ${employeeId} not found`);
    return [];
  }
  
  const department = employeeRow[0].department;
  const role = employeeRow[0].role;
  const isFieldEmployee = role === 'FIELD_EMPLOYEE';
  const expectedRole = isFieldEmployee ? 'FIELD_EMPLOYEE' : 'EMPLOYEE';
  
  console.log(`Getting peers for employee ${employeeId}, department: "${department}", role: "${role}"`);
  
  // Check if department exists and is not empty
  if (department && department.trim() !== '') {
    // Department-based filtering (works for both HQ and Field)
    const sql = `
      SELECT u.id, u.name, u.email, u.role, u.department, u.designation
      FROM users u
      WHERE u.department = $1 
        AND u.id != $2 
        AND u.role = $3
        AND u.is_active = TRUE
      ORDER BY u.name ASC
    `;
    const { rows } = await query(sql, [department.trim(), employeeId, expectedRole]);
    console.log(`Found ${rows.length} peers in department "${department}"`);
    
    // If no peers found in department, try team-based as fallback (for HQ only)
    if (rows.length === 0 && !isFieldEmployee) {
      console.log(`No peers in department, trying team-based fallback`);
      const teamSql = `
        SELECT u.id, u.name, u.email, u.role, u.department, u.designation
        FROM team_members tm1
        JOIN teams t ON t.id = tm1.team_id
        JOIN team_members tm2 ON tm2.team_id = t.id
        JOIN users u ON u.id = tm2.user_id
        WHERE tm1.user_id = $1 AND u.id != $1 AND u.role = $2
        ORDER BY u.name ASC
      `;
      const { rows: teamRows } = await query(teamSql, [employeeId, expectedRole]);
      console.log(`Found ${teamRows.length} peers in teams`);
      return teamRows;
    }
    
    return rows;
  } else {
    // Fallback to team-based filtering (for backward compatibility, HQ only)
    if (!isFieldEmployee) {
      console.log(`No department found, using team-based filtering`);
      const sql = `
        SELECT u.id, u.name, u.email, u.role, u.department, u.designation
        FROM team_members tm1
        JOIN teams t ON t.id = tm1.team_id
        JOIN team_members tm2 ON tm2.team_id = t.id
        JOIN users u ON u.id = tm2.user_id
        WHERE tm1.user_id = $1 AND u.id != $1 AND u.role = $2
        ORDER BY u.name ASC
      `;
      const { rows } = await query(sql, [employeeId, expectedRole]);
      console.log(`Found ${rows.length} peers in teams`);
      return rows;
    }
    return [];
  }
};

const getTrainings = async (userId) => {
  const { rows } = await query(
    `
      SELECT id, name, status, start_date AS "startDate",
             completion_date AS "completionDate", duration_hours AS "durationHours"
      FROM trainings
      WHERE user_id = $1
      ORDER BY start_date DESC NULLS LAST
    `,
    [userId],
  );
  return rows;
};

const getRecognitions = async (userId) => {
  const { rows } = await query(
    `
      SELECT id, title, type, description, date, issued_by AS "issuedBy"
      FROM recognitions
      WHERE user_id = $1
      ORDER BY date DESC NULLS LAST
    `,
    [userId],
  );
  return rows;
};

const getSkills = async (userId) => {
  const { rows } = await query(
    `
      SELECT id, name, created_at AS "createdAt"
      FROM employee_skills
      WHERE user_id = $1
      ORDER BY name ASC
    `,
    [userId],
  );
  return rows;
};

const addSkill = async (payload, actorId) => {
  const targetUserId = payload.userId || actorId;
  const { rows } = await query(
    `
      INSERT INTO employee_skills (user_id, name)
      VALUES ($1,$2)
      ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `,
    [targetUserId, payload.name.trim()],
  );
  await auditService.logAction(actorId, 'EMPLOYEE_SKILL_ADDED', 'employee_skills', rows[0].id, {
    targetUserId,
    name: payload.name,
  });
  return rows[0];
};

const removeSkill = async (skillId, actor) => {
  const { rows } = await query(
    `
      DELETE FROM employee_skills
      WHERE id = $1
        AND ($2 = 'ADMIN' OR $2 = 'MANAGER' OR user_id = $3)
      RETURNING *
    `,
    [skillId, actor.role, actor.id],
  );
  if (rows.length) {
    await auditService.logAction(actor.id, 'EMPLOYEE_SKILL_REMOVED', 'employee_skills', skillId, null);
  }
  return rows[0];
};

const getBadges = async (userId) => {
  const { rows } = await query(
    `
      SELECT id, name, description, icon, awarded_at AS "awardedAt", awarded_by AS "awardedBy", metadata
      FROM employee_badges
      WHERE user_id = $1
      ORDER BY awarded_at DESC
    `,
    [userId],
  );
  return rows;
};

const addBadge = async (payload, actorId) => {
  const { rows } = await query(
    `
      INSERT INTO employee_badges (user_id, name, description, icon, awarded_by, awarded_at, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
    [
      payload.userId,
      payload.name,
      payload.description || null,
      payload.icon || null,
      actorId,
      payload.awardedAt || new Date(),
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
  await auditService.logAction(actorId, 'EMPLOYEE_BADGE_AWARDED', 'employee_badges', rows[0].id, payload);
  try {
    await notificationService.createNotification(payload.userId, {
      type: 'BADGE',
      title: `Badge earned: ${payload.name}`,
      body: payload.description,
      metadata: {
        badgeId: rows[0].id,
      },
    });
  } catch (err) {
    console.warn('Failed to dispatch badge notification', err.message);
  }
  return rows[0];
};

const addTraining = async (payload, actorId) => {
  const sql = `
    INSERT INTO trainings (user_id, name, status, start_date, completion_date, duration_hours)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    payload.userId,
    payload.name,
    payload.status,
    payload.startDate || null,
    payload.completionDate || null,
    payload.durationHours || null,
  ]);
  await auditService.logAction(actorId, 'TRAINING_ADDED', 'trainings', rows[0].id, payload);
  try {
    await notificationService.createNotification(payload.userId, {
      type: 'TRAINING',
      title: 'New training assigned',
      body: payload.name,
      metadata: {
        status: payload.status,
        startDate: payload.startDate,
      },
    });
  } catch (err) {
    console.warn('Failed to dispatch training notification', err.message);
  }
  return rows[0];
};

const addRecognition = async (payload, actorId) => {
  const sql = `
    INSERT INTO recognitions (user_id, title, type, description, date, issued_by)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    payload.userId,
    payload.title,
    payload.type || null,
    payload.description || null,
    payload.date || null,
    payload.issuedBy || null,
  ]);
  await auditService.logAction(actorId, 'RECOGNITION_ADDED', 'recognitions', rows[0].id, payload);
  try {
    await notificationService.createNotification(payload.userId, {
      type: 'RECOGNITION',
      title: payload.title,
      body: payload.description,
      metadata: {
        issuedBy: payload.issuedBy,
        date: payload.date,
      },
    });
  } catch (err) {
    console.warn('Failed to dispatch recognition notification', err.message);
  }
  return rows[0];
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const teams = await getUserTeams(userId);
  const trainings = await getTrainings(userId);
  const recognitions = await getRecognitions(userId);
  
  // Get manager information if user is an employee
  let managerInfo = null;
  if (user.role === 'EMPLOYEE' || user.role === 'FIELD_EMPLOYEE') {
    const { rows } = await query(
      `
        SELECT u.id, u.name, u.email, u.department, u.designation
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        JOIN users u ON u.id = t.manager_id
        WHERE tm.user_id = $1
        LIMIT 1
      `,
      [userId]
    );
    if (rows.length > 0) {
      managerInfo = {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        department: rows[0].department,
        designation: rows[0].designation,
      };
    }
  }

  return {
    ...user,
    teams,
    trainings,
    recognitions,
    manager: managerInfo,
  };
};

const getDepartmentLeaderboard = async (employeeId) => {
  const kpiService = require('./kpiService');
  
  // Get employee's department
  const { rows: employeeRow } = await query(
    `SELECT department FROM users WHERE id = $1`,
    [employeeId]
  );
  
  if (!employeeRow[0] || !employeeRow[0].department) {
    return [];
  }
  
  const department = employeeRow[0].department.trim();
  
  // Get current period (current month)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Get all employees in the same department
  const { rows: employees } = await query(
    `
      SELECT u.id, u.name, u.email, u.designation
      FROM users u
      WHERE u.department = $1 
        AND u.role = 'EMPLOYEE'
        AND u.is_active = TRUE
      ORDER BY u.name ASC
    `,
    [department]
  );
  
  // Get KPI scores for all employees
  const leaderboard = [];
  for (const employee of employees) {
    let kpiScore = 0;
    
    // Try to get from snapshot first
    const { rows: snapshot } = await query(
      `
        SELECT final_kpi
        FROM employee_kpi_snapshots
        WHERE user_id = $1
          AND period_start = $2
          AND period_end = $3
        LIMIT 1
      `,
      [employee.id, periodStart, periodEnd]
    );
    
    if (snapshot.length > 0) {
      kpiScore = Number(snapshot[0].final_kpi) || 0;
    } else {
      // Compute KPI if no snapshot exists
      try {
        const metrics = await kpiService.computeEmployeeKpis(
          employee.id,
          periodStart,
          periodEnd,
          { persist: false }
        );
        kpiScore = metrics.finalKpi || 0;
      } catch (error) {
        console.warn(`Failed to compute KPI for user ${employee.id}:`, error.message);
        kpiScore = 0;
      }
    }
    
    leaderboard.push({
      userId: employee.id,
      name: employee.name,
      email: employee.email,
      designation: employee.designation,
      kpiScore: kpiScore,
    });
  }
  
  // Sort by KPI score descending
  leaderboard.sort((a, b) => b.kpiScore - a.kpiScore);
  
  // Add rank
  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

module.exports = {
  getUserProfile,
  getManagerTeam,
  getEmployeePeers,
  getDepartmentLeaderboard,
  getTrainings,
  getRecognitions,
  getSkills,
  addSkill,
  removeSkill,
  getBadges,
  addBadge,
  addTraining,
  addRecognition,
};
