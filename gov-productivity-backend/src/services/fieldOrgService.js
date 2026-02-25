const { query } = require('../config/database');
const logger = require('../utils/logger');
const feedbackService = require('./feedbackService');
const notificationService = require('./notificationService');
const authService = require('./authService');
const auditService = require('./auditService');
const managerService = require('./managerService');
const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');
const weeklyKpiSnapshotService = require('./weeklyKpiSnapshotService');

// Helper function to ensure period dates
const ensurePeriod = (start, end) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const toDateOnly = (value, fallback) => {
    const date = value ? new Date(value) : fallback;
    return date.toISOString().slice(0, 10); // Returns 'YYYY-MM-DD'
  };
  return [toDateOnly(start, first), toDateOnly(end, last)];
};

// Get all Field Managers from database
const getAllFieldManagers = async () => {
  const usersSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'FIELD_MANAGER'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows } = await query(usersSql);
  console.log(`[getAllFieldManagers] Found ${rows.length} field managers in database`);
  
  const result = rows.map(user => ({
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    department: user.department || 'N/A',
    designation: user.designation || null,
  }));
  
  console.log(`[getAllFieldManagers] Returning ${result.length} managers:`, result.map(m => m.name));
  return result;
};

// Submit feedback to a field manager (uses peer_feedbacks table)
const submitFeedbackToManager = async (fromUserId, managerId, payload) => {
  // Use the existing peer feedback service
  const feedback = await feedbackService.addPeerFeedback(fromUserId, managerId, {
    regarding: payload.regarding || 'General Feedback',
    rating: payload.rating,
    comment: payload.comment || null,
  });
  
  // Get sender name and role for notification
  const { rows: senderRows } = await query(
    'SELECT name, role FROM users WHERE id = $1', 
    [fromUserId]
  );
  const sender = senderRows[0] || {};
  const senderName = sender.name || 'Organization Head';
  const senderRole = sender.role || 'FIELD_ORG';
  
  // Determine organization type from role
  let orgType = 'Field Organization';
  if (senderRole === 'HQ_ORG') {
    orgType = 'HQ Organization';
  } else if (senderRole === 'FIELD_ORG') {
    orgType = 'Field Organization';
  } else if (senderRole === 'ADMIN') {
    orgType = 'Administration';
  }
  
  // Create notification for the manager
  try {
    const notification = await notificationService.createNotification(managerId, {
      type: 'FEEDBACK',
      title: `Feedback received from ${orgType}`,
      body: `${senderName} (${orgType}) has provided feedback with ${payload.rating} star${payload.rating !== 1 ? 's' : ''} rating${payload.regarding ? ` - ${payload.regarding}` : ''}`,
      metadata: {
        feedbackId: feedback.id,
        fromUserId: fromUserId,
        fromUserName: senderName,
        fromUserRole: senderRole,
        rating: payload.rating,
        regarding: payload.regarding || 'General Feedback',
      },
    });
    console.log(`Notification created successfully for manager ${managerId}:`, notification.id);
  } catch (err) {
    console.error('Failed to create feedback notification:', err);
    console.error('Error details:', {
      managerId,
      fromUserId,
      senderName,
      senderRole,
      error: err.message,
      stack: err.stack,
    });
    // Don't fail the whole operation if notification fails, but log it clearly
  }
  
  return feedback;
};

// Create a new field user (FIELD_MANAGER or FIELD_EMPLOYEE)
const createUser = async (orgHeadId, payload) => {
  const { name, email, password, role, department, designation, phone, qualifications, joiningMonth, joiningYear } = payload;
  
  // Validate role - must be FIELD_EMPLOYEE or FIELD_MANAGER
  if (role !== 'FIELD_EMPLOYEE' && role !== 'FIELD_MANAGER') {
    const error = new Error('Invalid role. Must be FIELD_EMPLOYEE or FIELD_MANAGER for Field organization');
    error.statusCode = 400;
    throw error;
  }
  
  // Validate required fields
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }
  
  // Set default department if not provided
  const userDepartment = department || (role === 'FIELD_MANAGER' ? 'Field Operations' : 'Field Operations');
  
  // Set default designation if not provided
  const userDesignation = designation || (role === 'FIELD_MANAGER' ? 'Field Manager' : 'Field Employee');
  
  // Create user using authService.register
  const user = await authService.register(
    {
      name,
      email,
      password,
      role,
      department: userDepartment,
      designation: userDesignation,
      is_active: true,
    },
    { id: orgHeadId } // actor for audit log
  );
  
  // Log additional user creation details if provided
  if (phone || qualifications || joiningMonth || joiningYear) {
    await auditService.logAction(orgHeadId, 'FIELD_USER_CREATED', 'users', user.id, {
      email: user.email,
      role: user.role,
      phone: phone || null,
      qualifications: qualifications || null,
      joiningDate: joiningMonth && joiningYear ? `${joiningYear}-${String(joiningMonth).padStart(2, '0')}-01` : null,
    });
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
  };
};

// Get all Field Employees with their assignment status
const getFieldEmployeesWithStatus = async () => {
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation,
      t.manager_id,
      m.name as manager_name
    FROM users u
    LEFT JOIN team_members tm ON tm.user_id = u.id
    LEFT JOIN teams t ON t.id = tm.team_id
    LEFT JOIN users m ON m.id = t.manager_id
    WHERE u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.department ASC, u.name ASC
  `;
  
  const { rows } = await query(sql);
  console.log(`[getFieldEmployeesWithStatus] Found ${rows.length} field employees in database`);
  
  const result = rows.map(emp => ({
    id: emp.id.toString(),
    name: emp.name,
    email: emp.email,
    department: emp.department || 'N/A',
    designation: emp.designation || null,
    managerId: emp.manager_id ? emp.manager_id.toString() : null,
    managerName: emp.manager_name || null,
  }));
  
  console.log(`[getFieldEmployeesWithStatus] Returning ${result.length} employees:`, result.map(e => e.name));
  return result;
};

// Get field user statistics
const getFieldUserStats = async () => {
  const statsSql = `
    SELECT 
      role,
      COUNT(*) as count
    FROM users
    WHERE role IN ('FIELD_MANAGER', 'FIELD_EMPLOYEE')
      AND is_active = TRUE
    GROUP BY role
    ORDER BY role
  `;
  
  const { rows } = await query(statsSql);
  
  const stats = {
    managers: 0,
    employees: 0,
    total: 0,
  };
  
  rows.forEach(row => {
    if (row.role === 'FIELD_MANAGER') {
      stats.managers = parseInt(row.count);
    } else if (row.role === 'FIELD_EMPLOYEE') {
      stats.employees = parseInt(row.count);
    }
  });
  
  stats.total = stats.managers + stats.employees;
  
  return stats;
};

// Assign field employee to field manager
const assignEmployeeToManager = async (orgHeadId, employeeId, managerId) => {
  // Get org head name for notifications
  const { rows: orgHeadRows } = await query(
    'SELECT name FROM users WHERE id = $1',
    [orgHeadId]
  );
  const orgHeadName = orgHeadRows[0]?.name || 'Organization Head';
  
  // Get employee details
  const { rows: empRows } = await query(
    'SELECT name, email FROM users WHERE id = $1 AND role = \'FIELD_EMPLOYEE\'',
    [employeeId]
  );
  if (empRows.length === 0) {
    throw new Error('Field Employee not found');
  }
  const employee = empRows[0];
  
  // Get manager details
  const { rows: mgrRows } = await query(
    'SELECT name, email FROM users WHERE id = $1 AND role = \'FIELD_MANAGER\'',
    [managerId]
  );
  if (mgrRows.length === 0) {
    throw new Error('Field Manager not found');
  }
  const manager = mgrRows[0];
  
  // Check if employee is already assigned to another manager
  const { rows: existingTeamRows } = await query(
    `SELECT t.id as team_id, t.manager_id 
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1`,
    [employeeId]
  );
  
  // If already assigned, remove from old team first
  if (existingTeamRows.length > 0) {
    const oldTeamId = existingTeamRows[0].team_id;
    const oldManagerId = existingTeamRows[0].manager_id;
    
    // If already assigned to the same manager, return success
    if (oldManagerId === managerId) {
      return {
        success: true,
        employeeId: employeeId.toString(),
        managerId: managerId.toString(),
        teamId: oldTeamId,
        message: 'Already assigned to this manager',
      };
    }
    
    // Remove from old team
    await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [oldTeamId, employeeId]
    );
  }
  
  // Get or create team for the manager
  let { rows: teamRows } = await query(
    'SELECT id FROM teams WHERE manager_id = $1 LIMIT 1',
    [managerId]
  );
  
  let teamId;
  let isNewTeam = false;
  if (teamRows.length === 0) {
    // Create a new team for the manager
    const { rows: newTeamRows } = await query(
      `INSERT INTO teams (name, manager_id)
       VALUES ($1, $2)
       RETURNING id`,
      [`${manager.name}'s Team`, managerId]
    );
    teamId = newTeamRows[0].id;
    isNewTeam = true;
  } else {
    teamId = teamRows[0].id;
  }
  
  // Check if employee is already in this team
  const { rows: alreadyInTeam } = await query(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, employeeId]
  );
  
  if (alreadyInTeam.length === 0) {
    // Add employee to team
    await query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)`,
      [teamId, employeeId]
    );
  }
  
  // Create notifications
  try {
    // Notify employee
    await notificationService.createNotification(employeeId, {
      type: 'TEAM_ASSIGNMENT',
      title: 'Team Assignment',
      body: `You have been assigned to ${manager.name}'s team by ${orgHeadName}`,
      metadata: {
        managerId: managerId,
        managerName: manager.name,
        assignedBy: orgHeadId,
      },
    });
    
    // Notify manager
    await notificationService.createNotification(managerId, {
      type: 'TEAM_ASSIGNMENT',
      title: 'New Team Member',
      body: `${employee.name} has been assigned to your team by ${orgHeadName}`,
      metadata: {
        employeeId: employeeId,
        employeeName: employee.name,
        assignedBy: orgHeadId,
      },
    });
  } catch (err) {
    console.error('Failed to create assignment notifications:', err);
  }
  
  // Trigger staff adequacy prediction for the team (both new teams and when members are added)
  try {
    const staffAdequacyService = require('./staffAdequacyService');
    // Wait a bit for the team to be fully set up, then predict
    setTimeout(async () => {
      try {
        logger.info(`[Field Org] Triggering staff adequacy prediction for team ${teamId} (isNewTeam: ${isNewTeam})`);
        await staffAdequacyService.predictAndUpdateTeamStatus(teamId);
        logger.info(`[Field Org] Successfully updated predictions for team ${teamId}`);
      } catch (predError) {
        logger.error(`[Field Org] Failed to predict staff adequacy for team ${teamId}:`, predError);
      }
    }, 2000); // Wait 2 seconds for team setup
  } catch (err) {
    logger.error('[Field Org] Failed to trigger staff adequacy prediction:', err);
    // Don't fail the whole operation
  }
  
  return {
    success: true,
    employeeId: employeeId.toString(),
    managerId: managerId.toString(),
    teamId: teamId,
    message: 'Employee assigned successfully',
  };
};

// Deallocate field employee from manager
const deallocateEmployee = async (orgHeadId, employeeId) => {
  // Get employee details
  const { rows: empRows } = await query(
    'SELECT name FROM users WHERE id = $1 AND role = \'FIELD_EMPLOYEE\'',
    [employeeId]
  );
  if (empRows.length === 0) {
    throw new Error('Field Employee not found');
  }
  
  // Find team assignment
  const { rows: teamRows } = await query(
    `SELECT tm.team_id, t.manager_id, m.name as manager_name
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     JOIN users m ON m.id = t.manager_id
     WHERE tm.user_id = $1`,
    [employeeId]
  );
  
  if (teamRows.length === 0) {
    throw new Error('Employee is not assigned to any team');
  }
  
  const teamId = teamRows[0].team_id;
  const managerId = teamRows[0].manager_id;
  const managerName = teamRows[0].manager_name;
  
  // Remove from team
  await query(
    'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, employeeId]
  );
  
  // Create notifications
  try {
    // Notify employee
    await notificationService.createNotification(employeeId, {
      type: 'TEAM_ASSIGNMENT',
      title: 'Team Assignment Removed',
      body: `You have been removed from ${managerName}'s team`,
      metadata: {
        managerId: managerId,
        managerName: managerName,
      },
    });
  } catch (err) {
    console.error('Failed to create deallocation notification:', err);
  }
  
  return {
    success: true,
    employeeId: employeeId.toString(),
    message: 'Employee deallocated successfully',
  };
};

// Get all Field Managers leaderboard with KPI scores
const getFieldManagersLeaderboard = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all field managers first
  const usersSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'FIELD_MANAGER'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: userRows } = await query(usersSql);
  console.log(`Found ${userRows.length} field managers in database`);
  
  // Get team sizes for all managers from actual team assignments
  const teamSizeSql = `
    SELECT 
      u.id as manager_id,
      COUNT(DISTINCT CASE 
        WHEN u_emp.id IS NOT NULL AND u_emp.is_active = TRUE AND u_emp.role = 'FIELD_EMPLOYEE' 
        THEN tm.user_id 
        ELSE NULL 
      END) as team_size
    FROM users u
    LEFT JOIN teams t ON t.manager_id = u.id
    LEFT JOIN team_members tm ON tm.team_id = t.id
    LEFT JOIN users u_emp ON u_emp.id = tm.user_id
    WHERE u.role = 'FIELD_MANAGER'
      AND u.is_active = TRUE
    GROUP BY u.id
  `;
  const { rows: teamSizeRows } = await query(teamSizeSql);
  const teamSizesMap = new Map(teamSizeRows.map(ts => [ts.manager_id, parseInt(ts.team_size) || 0]));
  
  // Get project counts for managers
  const projectsSql = `
    SELECT 
      p.created_by as manager_id,
      COUNT(DISTINCT p.id) as project_count
    FROM projects p
    WHERE p.project_type = 'field'
      AND p.status IN ('in_progress', 'completed')
    GROUP BY p.created_by
  `;
  const { rows: projectRows } = await query(projectsSql);
  const projectsMap = new Map(projectRows.map(pr => [pr.manager_id, parseInt(pr.project_count) || 0]));
  
  // Get KPI for each manager and build results
  const results = [];
  for (const user of userRows) {
    let kpiScore = 0;
    let snapshotFound = false;
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT final_kpi
        FROM manager_kpi_snapshots
        WHERE manager_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [user.id]);
      if (kpiRows.length > 0) {
        snapshotFound = true;
        kpiScore = parseFloat(kpiRows[0].final_kpi) || 0;
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for field manager ${user.id}:`, error);
    }
    
    // If no KPI snapshot exists, compute it
    if (!snapshotFound) {
      try {
        const managerKpi = await managerService.computeManagerKpi(user.id, start, end);
        kpiScore = managerKpi.finalKpi || 0;
      } catch (error) {
        console.error(`Error computing KPI for field manager ${user.id}:`, error);
      }
    }
    
    const teamSize = teamSizesMap.get(user.id) || 0;
    const projects = projectsMap.get(user.id) || 0;
    
    results.push({
      id: user.id.toString(),
      userId: user.id,
      name: user.name,
      department: user.department || 'N/A',
      designation: user.designation || null,
      kpiScore: Math.round(kpiScore * 100) / 100,
      finalKpi: Math.round(kpiScore * 100) / 100,
      teamSize: teamSize,
      projects: projects,
    });
  }
  
  // Sort by KPI score descending
  results.sort((a, b) => b.kpiScore - a.kpiScore);
  
  // Add rank
  return results.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
};

// Get all Field Employees leaderboard with KPI scores
const getFieldEmployeesLeaderboard = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all field employees first
  const usersSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: userRows } = await query(usersSql);
  console.log(`Found ${userRows.length} field employees in database`);
  
  // Get KPI for each employee and build results
  const results = [];
  for (const user of userRows) {
    let kpiScore = 0;
    let dprKpi = 0;
    let surveyKpi = 0;
    let timelineKpi = 0;
    let snapshotFound = false;
    
    // Try to get existing KPI snapshot from field_employee_kpi_snapshots
    try {
      const kpiSql = `
        SELECT 
          final_kpi,
          dpr_kpi,
          survey_kpi,
          task_timeliness_kpi
        FROM field_employee_kpi_snapshots
        WHERE user_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [user.id]);
      if (kpiRows.length > 0 && parseFloat(kpiRows[0].final_kpi) > 0) {
        snapshotFound = true;
        kpiScore = parseFloat(kpiRows[0].final_kpi) || 0;
        dprKpi = parseFloat(kpiRows[0].dpr_kpi) || 0;
        surveyKpi = parseFloat(kpiRows[0].survey_kpi) || 0;
        timelineKpi = parseFloat(kpiRows[0].task_timeliness_kpi) || 0;
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for field employee ${user.id}:`, error);
    }
    
    // If no KPI snapshot exists, try to compute it
    if (!snapshotFound) {
      try {
        const employeeKpi = await fieldEmployeeKpiService.computeFieldEmployeeKpis(user.id, start, end);
        if (employeeKpi && employeeKpi.finalKpi > 0) {
          kpiScore = employeeKpi.finalKpi || 0;
          dprKpi = employeeKpi.dprKpi || 0;
          surveyKpi = employeeKpi.surveyKpi || 0;
          timelineKpi = employeeKpi.taskTimelinessKpi || 0;
        }
        // If computation returns 0 or no data, keep scores at 0 (initial state for new employees)
      } catch (error) {
        console.error(`Error computing KPI for field employee ${user.id}:`, error);
        // Keep scores at 0 if computation fails (initial state)
      }
    }
    // If snapshot exists but score is 0, that's fine - it's the initial state for new employees
    
    results.push({
      id: user.id.toString(),
      userId: user.id,
      name: user.name,
      department: user.department || 'N/A',
      designation: user.designation || null,
      kpiScore: Math.round(kpiScore * 100) / 100,
      finalKpi: Math.round(kpiScore * 100) / 100,
      dprQuality: Math.round(dprKpi * 100) / 100,
      surveyAccuracy: Math.round(surveyKpi * 100) / 100,
      timeline: Math.round(timelineKpi * 100) / 100,
    });
  }
  
  // Sort by KPI score descending
  results.sort((a, b) => b.kpiScore - a.kpiScore);
  
  // Add rank
  return results.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
};

// Get average Manager KPI score
const getAverageManagerKPI = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all field managers
  const managersSql = `
    SELECT u.id
    FROM users u
    WHERE u.role = 'FIELD_MANAGER'
      AND u.is_active = TRUE
  `;
  const { rows: managerRows } = await query(managersSql);
  
  if (managerRows.length === 0) {
    return { averageKPI: 0, count: 0 };
  }
  
  const managerIds = managerRows.map(m => m.id);
  let totalKPI = 0;
  let count = 0;
  
  for (const manager of managerRows) {
    let kpiScore = 0;
    let snapshotFound = false;
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT final_kpi
        FROM manager_kpi_snapshots
        WHERE manager_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [manager.id]);
      if (kpiRows.length > 0) {
        snapshotFound = true;
        kpiScore = parseFloat(kpiRows[0].final_kpi) || 0;
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for manager ${manager.id}:`, error);
    }
    
    // If no KPI snapshot exists, compute it
    if (!snapshotFound) {
      try {
        const managerKpi = await managerService.computeManagerKpi(manager.id, start, end);
        kpiScore = managerKpi.finalKpi || 0;
      } catch (error) {
        console.error(`Error computing KPI for manager ${manager.id}:`, error);
      }
    }
    
    if (kpiScore > 0) {
      totalKPI += kpiScore;
      count++;
    }
  }
  
  const averageKPI = count > 0 ? totalKPI / count : 0;
  
  return {
    averageKPI: Math.round(averageKPI * 100) / 100,
    count: count,
  };
};

// Get average Field Employee KPI score
// @param {Date|string} periodStart - Start date for period
// @param {Date|string} periodEnd - End date for period
// @param {boolean} skipComputation - If true, only reads existing snapshots, never triggers computation (prevents circular dependency)
const getAverageEmployeeKPI = async (periodStart, periodEnd, skipComputation = false) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all field employees
  const employeesSql = `
    SELECT u.id
    FROM users u
    WHERE u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
  `;
  const { rows: employeeRows } = await query(employeesSql);
  
  if (employeeRows.length === 0) {
    return { averageKPI: 0, count: 0 };
  }
  
  let totalKPI = 0;
  let count = 0;
  
  for (const employee of employeeRows) {
    let kpiScore = 0;
    let snapshotFound = false;
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT final_kpi
        FROM field_employee_kpi_snapshots
        WHERE user_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [employee.id]);
      if (kpiRows.length > 0 && parseFloat(kpiRows[0].final_kpi) > 0) {
        snapshotFound = true;
        kpiScore = parseFloat(kpiRows[0].final_kpi) || 0;
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for employee ${employee.id}:`, error);
    }
    
    // If no KPI snapshot exists, try to compute it (unless skipComputation is true)
    // skipComputation prevents circular dependency when called from promotion score calculation
    if (!snapshotFound && !skipComputation) {
      try {
        const employeeKpi = await fieldEmployeeKpiService.computeFieldEmployeeKpis(employee.id, start, end, { persist: false });
        if (employeeKpi && employeeKpi.finalKpi > 0) {
          kpiScore = employeeKpi.finalKpi || 0;
        }
      } catch (error) {
        console.error(`Error computing KPI for employee ${employee.id}:`, error);
      }
    }
    
    if (kpiScore > 0) {
      totalKPI += kpiScore;
      count++;
    }
  }
  
  const averageKPI = count > 0 ? totalKPI / count : 0;
  
  return {
    averageKPI: Math.round(averageKPI * 100) / 100,
    count: count,
  };
};

// Get promotion candidates - field employees with KPI >= 85
const getPromotionCandidates = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all field employees
  const employeesSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: employees } = await query(employeesSql);
  
  // Get KPI for each employee
  const results = [];
  for (const employee of employees) {
    let kpiScore = 0;
    let snapshotFound = false;
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT final_kpi
        FROM field_employee_kpi_snapshots
        WHERE user_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [employee.id]);
      if (kpiRows.length > 0 && parseFloat(kpiRows[0].final_kpi) > 0) {
        snapshotFound = true;
        kpiScore = parseFloat(kpiRows[0].final_kpi) || 0;
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for field employee ${employee.id}:`, error);
    }
    
    // If no KPI snapshot exists, try to compute it
    if (!snapshotFound) {
      try {
        const employeeKpi = await fieldEmployeeKpiService.computeFieldEmployeeKpis(employee.id, start, end);
        if (employeeKpi && employeeKpi.finalKpi > 0) {
          kpiScore = employeeKpi.finalKpi || 0;
        }
      } catch (error) {
        console.error(`Error computing KPI for field employee ${employee.id}:`, error);
      }
    }
    
    // Only include if KPI > 80
    if (kpiScore > 80) {
      results.push({
        id: employee.id,
        name: employee.name,
        department: employee.department || 'N/A',
        designation: employee.designation || null,
        kpiScore: Math.round(kpiScore * 100) / 100,
      });
    }
  }
  
  // Get average manager feedback ratings for promotion candidates
  const candidateIds = results.map(r => r.id);
  const feedbackSql = `
    SELECT 
      mf.employee_id,
      AVG(mf.rating) as avg_rating,
      COUNT(*) as feedback_count
    FROM manager_feedbacks mf
    WHERE mf.employee_id = ANY($1::int[])
    GROUP BY mf.employee_id
  `;
  
  const { rows: feedbackRows } = candidateIds.length > 0 
    ? await query(feedbackSql, [candidateIds])
    : { rows: [] };
  
  const feedbackMap = new Map(
    feedbackRows.map(f => [f.employee_id, {
      avgRating: parseFloat(f.avg_rating) || 0,
      feedbackCount: parseInt(f.feedback_count) || 0
    }])
  );
  
  // Format and sort by KPI score descending
  const candidates = results
    .sort((a, b) => b.kpiScore - a.kpiScore)
    .map(emp => {
      const feedback = feedbackMap.get(emp.id) || { avgRating: 0, feedbackCount: 0 };
      return {
        id: emp.id.toString(),
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        performanceScore: emp.kpiScore,
        managerRating: feedback.feedbackCount > 0 
          ? Math.round(feedback.avgRating * 10) / 10 
          : 0,
      };
    });
  
  return candidates;
};

// Get training recommendations - field employees with KPI < 85
const getTrainingRecommendations = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all field employees
  const employeesSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: employees } = await query(employeesSql);
  
  // Get KPI breakdown for each employee
  const employeesWithKpi = [];
  for (const employee of employees) {
    let kpiData = {
      final_kpi: null,
      dpr_kpi: null,
      survey_kpi: null,
      task_timeliness_kpi: null,
      technical_compliance_kpi: null,
      expenditure_kpi: null,
    };
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT 
          final_kpi,
          dpr_kpi,
          survey_kpi,
          task_timeliness_kpi,
          technical_compliance_kpi,
          expenditure_kpi
        FROM field_employee_kpi_snapshots
        WHERE user_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [employee.id]);
      if (kpiRows.length > 0) {
        kpiData = {
          final_kpi: kpiRows[0].final_kpi,
          dpr_kpi: kpiRows[0].dpr_kpi,
          survey_kpi: kpiRows[0].survey_kpi,
          task_timeliness_kpi: kpiRows[0].task_timeliness_kpi,
          technical_compliance_kpi: kpiRows[0].technical_compliance_kpi,
          expenditure_kpi: kpiRows[0].expenditure_kpi,
        };
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for field employee ${employee.id}:`, error);
    }
    
    // If no KPI snapshot exists, try to compute it
    if (!kpiData.final_kpi) {
      try {
        const employeeKpi = await fieldEmployeeKpiService.computeFieldEmployeeKpis(employee.id, start, end);
        if (employeeKpi && employeeKpi.finalKpi > 0) {
          kpiData = {
            final_kpi: employeeKpi.finalKpi,
            dpr_kpi: employeeKpi.dprKpi,
            survey_kpi: employeeKpi.surveyKpi,
            task_timeliness_kpi: employeeKpi.taskTimelinessKpi,
            technical_compliance_kpi: employeeKpi.technicalComplianceKpi,
            expenditure_kpi: employeeKpi.expenditureKpi,
          };
        }
      } catch (error) {
        console.error(`Error computing KPI for field employee ${employee.id}:`, error);
      }
    }
    
    employeesWithKpi.push({
      id: employee.id,
      name: employee.name,
      department: employee.department || 'N/A',
      designation: employee.designation || null,
      ...kpiData,
    });
  }
  
  // Calculate average skill scores for each employee
  const employeeIds = employeesWithKpi.map(emp => emp.id);
  const avgSkillScoresMap = new Map();
  
  if (employeeIds.length > 0) {
    const skillScoreSql = `
      SELECT 
        ss.user_id,
        AVG(ss.skill_score) as avg_skill_score,
        COUNT(ss.task_id) as task_count
      FROM skill_score ss
      WHERE ss.user_id = ANY($1::INTEGER[])
      GROUP BY ss.user_id
    `;
    
    try {
      const { rows: skillScoreRows } = await query(skillScoreSql, [employeeIds]);
      skillScoreRows.forEach(row => {
        avgSkillScoresMap.set(row.user_id, {
          avgScore: parseFloat(row.avg_skill_score) || 0,
          taskCount: parseInt(row.task_count) || 0
        });
      });
    } catch (error) {
      console.error('Error fetching average skill scores:', error);
    }
  }
  
  // Identify training needs - only employees with KPI <= 80
  const trainingNeeds = employeesWithKpi
    .filter(emp => {
      const kpiScore = parseFloat(emp.final_kpi) || 0;
      return kpiScore <= 80; // Only include employees with KPI <= 80
    })
    .map(emp => {
      const kpiScore = parseFloat(emp.final_kpi) || 0;
      const dpr = parseFloat(emp.dpr_kpi) || 0;
      const survey = parseFloat(emp.survey_kpi) || 0;
      const timeline = parseFloat(emp.task_timeliness_kpi) || 0;
      const technical = parseFloat(emp.technical_compliance_kpi) || 0;
      const expenditure = parseFloat(emp.expenditure_kpi) || 0;
      
      // Get average skill score for this employee
      const skillScoreData = avgSkillScoresMap.get(emp.id);
      const avgSkillScore = skillScoreData ? skillScoreData.avgScore : 0;
      const taskCount = skillScoreData ? skillScoreData.taskCount : 0;
      
      // Identify the weakest area
      const areas = [
        { name: 'DPR Quality', score: dpr, issue: 'DPR Quality Issues', skillGap: 'Documentation' },
        { name: 'Survey Accuracy', score: survey, issue: 'Survey Accuracy', skillGap: 'Technical Skills' },
        { name: 'Timeline Adherence', score: timeline, issue: 'Timeline Adherence', skillGap: 'Time Management' },
        { name: 'Technical Compliance', score: technical, issue: 'Technical Standards', skillGap: 'Quality Control' },
        { name: 'Expenditure Management', score: expenditure, issue: 'Budget Management', skillGap: 'Financial Planning' },
      ];
      
      const weakestArea = areas.reduce((min, area) => 
        area.score < min.score ? area : min
      );
      
      return {
        id: emp.id.toString(),
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        kpiScore: Math.round(kpiScore * 100) / 100,
        issues: weakestArea.issue,
        skillGap: taskCount > 0 ? Math.round(avgSkillScore * 100) / 100 : null, // Average skill score as percentage, or null if no tasks
        avgSkillScore: taskCount > 0 ? avgSkillScore : null,
        taskCount: taskCount,
      };
    })
    .sort((a, b) => a.kpiScore - b.kpiScore); // Sort by KPI ascending (lowest first)
  
  return trainingNeeds;
};

// Calculate and get training need scores (triggered when Training Needed button is clicked)
const calculateAndGetTrainingNeedScores = async () => {
  const trainingNeedScoreService = require('./trainingNeedScoreService');
  
  // Calculate and store training need scores for all employees
  await trainingNeedScoreService.calculateAndStoreTrainingNeedScores();
  
  // Get top 5 employees with highest training needs (lowest scores)
  const topTrainingNeeds = await trainingNeedScoreService.getTopTrainingNeeds(5);
  
  // Format for frontend
  const formatted = topTrainingNeeds.map(emp => {
    const kpi = parseFloat(emp.kpi || 0);
    const absentee = parseInt(emp.absentee || 0); // Integer count of absent days
    const skillGap = emp.avg_skill_score !== null ? parseFloat(emp.avg_skill_score || 0) : null;
    
    console.log(`[Training Need] ${emp.name}: KPI=${kpi}, Absentee=${absentee}, SkillGap=${skillGap}`);
    
    return {
      id: emp.user_id.toString(),
      name: emp.name,
      department: emp.department || 'N/A',
      designation: emp.designation || null,
      kpi: kpi,
      absentee: absentee, // Integer count of absent days
      skillGap: skillGap, // null if no tasks assigned
      trainingNeedScore: parseFloat(emp.training_need_score || 0),
    };
  });
  
  return formatted;
};

// Get weekly KPI snapshots for field organization
const getWeeklyKpiSnapshots = async (limit = 12) => {
  try {
    const snapshots = await weeklyKpiSnapshotService.getWeeklyKpiSnapshots(limit, 0);
    return snapshots;
  } catch (error) {
    console.error('[getWeeklyKpiSnapshots] Error:', error);
    throw error;
  }
};

module.exports = {
  getAllFieldManagers,
  submitFeedbackToManager,
  createUser,
  getFieldEmployeesWithStatus,
  getFieldUserStats,
  assignEmployeeToManager,
  deallocateEmployee,
  getFieldManagersLeaderboard,
  getFieldEmployeesLeaderboard,
  getAverageManagerKPI,
  getAverageEmployeeKPI,
  getPromotionCandidates,
  getTrainingRecommendations,
  calculateAndGetTrainingNeedScores,
  getWeeklyKpiSnapshots,
};

