const { query } = require('../config/database');
const kpiService = require('./kpiService');
const managerService = require('./managerService');
const feedbackService = require('./feedbackService');
const notificationService = require('./notificationService');
const authService = require('./authService');
const auditService = require('./auditService');

// Helper to ensure current period - returns date-only strings (YYYY-MM-DD)
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

// Get all HQ managers leaderboard
const getAllManagersLeaderboard = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all managers first
  const usersSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'MANAGER'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: userRows } = await query(usersSql);
  console.log(`Found ${userRows.length} managers in database`);
  
  // Get team sizes for all managers - ONLY from actual team assignments (team_members table)
  // This reflects the actual assignments made via the Assign Team modal
  const teamSizeSql = `
    SELECT 
      u.id as manager_id,
      COUNT(DISTINCT CASE 
        WHEN u_emp.id IS NOT NULL AND u_emp.is_active = TRUE AND u_emp.role = 'EMPLOYEE' 
        THEN tm.user_id 
        ELSE NULL 
      END) as team_size
    FROM users u
    LEFT JOIN teams t ON t.manager_id = u.id
    LEFT JOIN team_members tm ON tm.team_id = t.id
    LEFT JOIN users u_emp ON u_emp.id = tm.user_id
    WHERE u.role = 'MANAGER'
      AND u.is_active = TRUE
    GROUP BY u.id
  `;
  const { rows: teamSizeRows } = await query(teamSizeSql);
  console.log(`Team size query results for ${teamSizeRows.length} managers:`, teamSizeRows);
  const teamSizesMap = new Map(teamSizeRows.map(ts => [ts.manager_id, parseInt(ts.team_size) || 0]));
  
  console.log(`Team sizes map:`, Array.from(teamSizesMap.entries()));
  
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
      console.error(`Error fetching KPI snapshot for manager ${user.id}:`, error);
    }
    
    // If no KPI snapshot exists, compute it
    if (!snapshotFound) {
      try {
        const managerKpi = await managerService.computeManagerKpi(user.id, start, end);
        kpiScore = managerKpi.finalKpi || 0;
      } catch (error) {
        console.error(`Error computing KPI for manager ${user.id}:`, error);
      }
    }
    
    const teamSize = teamSizesMap.get(user.id) || 0;
    console.log(`Manager ${user.name} (ID: ${user.id}) has team size: ${teamSize}`);
    
    results.push({
      id: user.id.toString(),
      userId: user.id, // Add userId for compatibility
      name: user.name,
      department: user.department || 'N/A',
      designation: user.designation || null,
      kpiScore: Math.round(kpiScore * 100) / 100,
      finalKpi: Math.round(kpiScore * 100) / 100, // Add finalKpi alias for compatibility
      teamSize: teamSize,
    });
  }
  
  // Sort by KPI score descending
  results.sort((a, b) => b.kpiScore - a.kpiScore);
  
  console.log(`Returning ${results.length} manager leaderboard entries with team sizes:`, 
    results.map(r => ({ name: r.name, teamSize: r.teamSize }))
  );
  return results;
};

// Get all HQ employees leaderboard
const getAllEmployeesLeaderboard = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all employees first
  const usersSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: userRows } = await query(usersSql);
  console.log(`Found ${userRows.length} employees in database`);
  
  // Get completed projects count for all employees
  const projectsSql = `
    SELECT 
      pm.user_id,
      COUNT(DISTINCT p.id) as completed_count
    FROM project_members pm
    JOIN projects p ON p.id = pm.project_id
    WHERE p.status = 'completed'
      AND (p.project_type = 'hq' OR p.project_type IS NULL)
    GROUP BY pm.user_id
  `;
  const { rows: projectRows } = await query(projectsSql);
  const projectsMap = new Map(projectRows.map(pr => [pr.user_id, parseInt(pr.completed_count) || 0]));
  
  // Get KPI for each employee and build results
  const results = [];
  for (const user of userRows) {
    let kpiScore = 0;
    let snapshotFound = false;
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT final_kpi
        FROM employee_kpi_snapshots
        WHERE user_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [user.id]);
      if (kpiRows.length > 0) {
        snapshotFound = true;
        kpiScore = parseFloat(kpiRows[0].final_kpi) || 0;
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for employee ${user.id}:`, error);
    }
    
    // If no KPI snapshot exists, compute it
    if (!snapshotFound) {
      try {
        const employeeKpi = await kpiService.computeEmployeeKpis(user.id, start, end);
        kpiScore = employeeKpi.finalKpi || 0;
      } catch (error) {
        console.error(`Error computing KPI for employee ${user.id}:`, error);
      }
    }
    
    results.push({
      id: user.id.toString(),
      userId: user.id, // Add userId for compatibility
      name: user.name,
      department: user.department || 'N/A',
      designation: user.designation || null,
      kpiScore: Math.round(kpiScore * 100) / 100,
      finalKpi: Math.round(kpiScore * 100) / 100, // Add finalKpi alias for compatibility
      completedProjects: projectsMap.get(user.id) || 0,
    });
  }
  
  // Sort by KPI score descending
  results.sort((a, b) => b.kpiScore - a.kpiScore);
  
  console.log(`Returning ${results.length} employee leaderboard entries`);
  return results;
};

// Get all HQ managers for feedback dropdown
const getAllManagers = async () => {
  const usersSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'MANAGER'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows } = await query(usersSql);
  
  return rows.map(user => ({
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    department: user.department || 'N/A',
    designation: user.designation || null,
  }));
};

// Submit feedback to a manager (uses peer_feedbacks table)
const submitFeedbackToManager = async (fromUserId, managerId, payload) => {
  const notificationService = require('./notificationService');
  
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
  const senderRole = sender.role || 'HQ_ORG';
  
  // Determine organization type from role
  let orgType = 'Organization';
  if (senderRole === 'HQ_ORG') {
    orgType = 'HQ Organization';
  } else if (senderRole === 'FIELD_ORG') {
    orgType = 'Field Organization';
  } else if (senderRole === 'ADMIN') {
    orgType = 'Administration';
  }
  
  // Create notification for the manager
  try {
    await notificationService.createNotification(managerId, {
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
  } catch (err) {
    console.error('Failed to create feedback notification:', err);
    // Don't fail the whole operation if notification fails
  }
  
  return feedback;
};

// Get all unique departments from HQ users (MANAGER and EMPLOYEE roles)
const getDepartments = async () => {
  const sql = `
    SELECT DISTINCT department
    FROM users
    WHERE role IN ('MANAGER', 'EMPLOYEE')
      AND department IS NOT NULL
      AND department != ''
      AND is_active = TRUE
    ORDER BY department ASC
  `;
  
  const { rows } = await query(sql);
  return rows.map(row => row.department);
};

// Get managers by department
const getManagersByDepartment = async (department) => {
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation,
      COALESCE(COUNT(DISTINCT tm.user_id), 0) as team_size
    FROM users u
    LEFT JOIN teams t ON t.manager_id = u.id
    LEFT JOIN team_members tm ON tm.team_id = t.id
    WHERE u.role = 'MANAGER'
      AND u.department = $1
      AND u.is_active = TRUE
    GROUP BY u.id, u.name, u.email, u.department, u.designation
    ORDER BY u.name ASC
  `;
  
  const { rows } = await query(sql, [department]);
  return rows.map(user => ({
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    department: user.department || 'N/A',
    designation: user.designation || null,
    teamSize: parseInt(user.team_size) || 0,
  }));
};

// Get all HQ employees with their assignment status
const getEmployeesWithStatus = async () => {
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
    WHERE u.role = 'EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.department ASC, u.name ASC
  `;
  
  const { rows } = await query(sql);
  return rows.map(emp => ({
    id: emp.id.toString(),
    name: emp.name,
    email: emp.email,
    department: emp.department || 'N/A',
    designation: emp.designation || null,
    managerId: emp.manager_id ? emp.manager_id.toString() : null,
    managerName: emp.manager_name || null,
  }));
};

// Assign employee to manager
const assignEmployeeToManager = async (orgHeadId, employeeId, managerId) => {
  console.log(`\n========== [TEAM_ASSIGN] START ==========`);
  console.log(`[TEAM_ASSIGN] Parameters: orgHeadId=${orgHeadId}, employeeId=${employeeId}, managerId=${managerId}`);
  
  // Get org head name for notifications
  const { rows: orgHeadRows } = await query(
    'SELECT name FROM users WHERE id = $1',
    [orgHeadId]
  );
  const orgHeadName = orgHeadRows[0]?.name || 'Organization Head';
  
  // Get employee details
  const { rows: empRows } = await query(
    'SELECT name, email FROM users WHERE id = $1 AND role = \'EMPLOYEE\'',
    [employeeId]
  );
  if (empRows.length === 0) {
    throw new Error('Employee not found');
  }
  const employee = empRows[0];
  console.log(`[TEAM_ASSIGN] Employee: ${employee.name} (ID: ${employeeId})`);
  
  // Get manager details
  const { rows: mgrRows } = await query(
    'SELECT name, email FROM users WHERE id = $1 AND role = \'MANAGER\'',
    [managerId]
  );
  if (mgrRows.length === 0) {
    throw new Error('Manager not found');
  }
  const manager = mgrRows[0];
  console.log(`[TEAM_ASSIGN] Manager: ${manager.name} (ID: ${managerId})`);
  
  // Check if employee is already assigned to another manager
  const { rows: existingTeamRows } = await query(
    `SELECT t.id as team_id, t.manager_id 
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1`,
    [employeeId]
  );
  
  console.log(`[TEAM_ASSIGN] Existing assignments for employee ${employeeId}:`, existingTeamRows);
  
  // If already assigned, remove from old team first
  if (existingTeamRows.length > 0) {
    const oldTeamId = existingTeamRows[0].team_id;
    const oldManagerId = existingTeamRows[0].manager_id;
    
    // If already assigned to the same manager, return success
    if (oldManagerId === managerId) {
      console.log(`[TEAM_ASSIGN] Employee ${employeeId} already assigned to manager ${managerId}, returning success`);
      console.log(`========== [TEAM_ASSIGN] END (Already Assigned) ==========\n`);
      return {
        success: true,
        employeeId: employeeId.toString(),
        managerId: managerId.toString(),
        teamId: oldTeamId,
        message: 'Already assigned to this manager',
      };
    }
    
    console.log(`[TEAM_ASSIGN] Removing employee ${employeeId} from old team ${oldTeamId} (manager ${oldManagerId})`);
    const deleteResult = await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING *',
      [oldTeamId, employeeId]
    );
    console.log(`[TEAM_ASSIGN] Deleted ${deleteResult.rowCount} row(s) from old team`);
  }
  
  // Get or create team for the manager
  let { rows: teamRows } = await query(
    'SELECT id FROM teams WHERE manager_id = $1 LIMIT 1',
    [managerId]
  );
  
  let teamId;
  if (teamRows.length === 0) {
    console.log(`[TEAM_ASSIGN] Creating new team for manager ${managerId}`);
    // Create a new team for the manager
    const { rows: newTeamRows } = await query(
      `INSERT INTO teams (name, manager_id)
       VALUES ($1, $2)
       RETURNING id`,
      [`${manager.name}'s Team`, managerId]
    );
    teamId = newTeamRows[0].id;
    console.log(`[TEAM_ASSIGN] Created team ${teamId} for manager ${managerId}`);
  } else {
    teamId = teamRows[0].id;
    console.log(`[TEAM_ASSIGN] Using existing team ${teamId} for manager ${managerId}`);
  }
  
  // Check if employee is already in this team
  const { rows: alreadyInTeam } = await query(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, employeeId]
  );
  
  if (alreadyInTeam.length > 0) {
    console.log(`[TEAM_ASSIGN] Employee ${employeeId} already in team ${teamId}, skipping insert`);
  } else {
    // Add employee to team - Use RETURNING to verify insertion
    console.log(`[TEAM_ASSIGN] Inserting employee ${employeeId} into team ${teamId}`);
    const insertResult = await query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)
       RETURNING team_id, user_id`,
      [teamId, employeeId]
    );
    
    if (insertResult.rows.length === 0) {
      throw new Error(`Failed to insert employee ${employeeId} into team ${teamId}`);
    }
    
    console.log(`[TEAM_ASSIGN] Successfully inserted:`, insertResult.rows[0]);
  }
  
  // VERIFY: Check that the assignment actually exists in the database with full hierarchy
  const { rows: verifyRows } = await query(
    `SELECT 
      tm.team_id, 
      tm.user_id, 
      t.manager_id, 
      m.name as manager_name, 
      e.name as employee_name,
      e.role as employee_role
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     JOIN users m ON m.id = t.manager_id
     JOIN users e ON e.id = tm.user_id
     WHERE tm.user_id = $1 AND t.manager_id = $2`,
    [employeeId, managerId]
  );
  
  if (verifyRows.length === 0) {
    throw new Error(`Verification failed: Employee ${employeeId} not found in manager ${managerId}'s team after assignment`);
  }
  
  const verifiedAssignment = verifyRows[0];
  console.log(`[TEAM_ASSIGN] ✅ VERIFICATION SUCCESS:`);
  console.log(`  - Manager: ${verifiedAssignment.manager_name} (ID: ${verifiedAssignment.manager_id})`);
  console.log(`  - Employee: ${verifiedAssignment.employee_name} (ID: ${verifiedAssignment.user_id})`);
  console.log(`  - Team ID: ${verifiedAssignment.team_id}`);
  console.log(`  - Hierarchy: ${verifiedAssignment.manager_name} → ${verifiedAssignment.employee_name}`);
  
  // Get final team size for this manager
  const { rows: teamSizeRows } = await query(
    `SELECT COUNT(*) as count 
     FROM team_members tm 
     JOIN teams t ON t.id = tm.team_id 
     WHERE t.manager_id = $1`,
    [managerId]
  );
  console.log(`[TEAM_ASSIGN] Final team size for manager ${managerId}: ${teamSizeRows[0].count}`);
  console.log(`========== [TEAM_ASSIGN] END (SUCCESS) ==========\n`);
  
  // Create notifications
  try {
    // Notify employee
    await notificationService.createNotification(employeeId, {
      type: 'TEAM_ASSIGNMENT',
      title: 'Assigned to Manager',
      body: `You have been assigned under ${manager.name} by ${orgHeadName}`,
      metadata: {
        managerId: managerId,
        managerName: manager.name,
        assignedBy: orgHeadId,
        assignedByName: orgHeadName,
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
        assignedByName: orgHeadName,
      },
    });
  } catch (err) {
    console.error('Failed to create assignment notifications:', err);
    // Don't fail the whole operation if notification fails
  }
  
  return {
    success: true,
    employeeId: employeeId.toString(),
    managerId: managerId.toString(),
    teamId: teamId,
  };
};

// Deallocate employee from manager
const deallocateEmployee = async (orgHeadId, employeeId) => {
  console.log(`\n========== [TEAM_DEALLOCATE] START ==========`);
  console.log(`[TEAM_DEALLOCATE] Parameters: orgHeadId=${orgHeadId}, employeeId=${employeeId}`);
  
  // Get org head name for notifications
  const { rows: orgHeadRows } = await query(
    'SELECT name FROM users WHERE id = $1',
    [orgHeadId]
  );
  const orgHeadName = orgHeadRows[0]?.name || 'Organization Head';
  
  // Get employee details and current assignment
  const { rows: empRows } = await query(
    `SELECT u.name, u.email, t.manager_id, m.name as manager_name, t.id as team_id
     FROM users u
     JOIN team_members tm ON tm.user_id = u.id
     JOIN teams t ON t.id = tm.team_id
     LEFT JOIN users m ON m.id = t.manager_id
     WHERE u.id = $1 AND u.role = 'EMPLOYEE'`,
    [employeeId]
  );
  
  if (empRows.length === 0) {
    throw new Error('Employee not found or not assigned to any manager');
  }
  
  const employee = empRows[0];
  const managerId = employee.manager_id;
  const teamId = employee.team_id;
  
  console.log(`[TEAM_DEALLOCATE] Employee: ${employee.name} (ID: ${employeeId})`);
  console.log(`[TEAM_DEALLOCATE] Current Manager: ${employee.manager_name} (ID: ${managerId})`);
  console.log(`[TEAM_DEALLOCATE] Team ID: ${teamId}`);
  console.log(`[TEAM_DEALLOCATE] Breaking hierarchy: ${employee.manager_name} → ${employee.name}`);
  
  // Remove employee from team - Use RETURNING to verify deletion
  console.log(`[TEAM_DEALLOCATE] Removing employee ${employeeId} from team ${teamId}`);
  const deleteResult = await query(
    `DELETE FROM team_members tm
     USING teams t
     WHERE tm.team_id = t.id
       AND tm.user_id = $1
       AND t.manager_id = $2
     RETURNING tm.team_id, tm.user_id`,
    [employeeId, managerId]
  );
  
  if (deleteResult.rowCount === 0) {
    throw new Error(`Failed to deallocate: Employee ${employeeId} not found in manager ${managerId}'s team`);
  }
  
  console.log(`[TEAM_DEALLOCATE] Successfully deleted ${deleteResult.rowCount} row(s) from team_members table`);
  
  // VERIFY: Check that the employee is no longer in the team
  const { rows: verifyRows } = await query(
    `SELECT tm.team_id, tm.user_id, t.manager_id
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1 AND t.manager_id = $2`,
    [employeeId, managerId]
  );
  
  if (verifyRows.length > 0) {
    throw new Error(`Verification failed: Employee ${employeeId} still found in manager ${managerId}'s team after deallocation`);
  }
  
  console.log(`[TEAM_DEALLOCATE] ✅ VERIFICATION SUCCESS: Employee ${employee.name} (ID: ${employeeId}) successfully removed from manager ${employee.manager_name}'s team`);
  
  // Get final team size for this manager
  const { rows: teamSizeRows } = await query(
    `SELECT COUNT(*) as count 
     FROM team_members tm 
     JOIN teams t ON t.id = tm.team_id 
     WHERE t.manager_id = $1`,
    [managerId]
  );
  console.log(`[TEAM_DEALLOCATE] Final team size for manager ${managerId}: ${teamSizeRows[0].count}`);
  console.log(`========== [TEAM_DEALLOCATE] END (SUCCESS) ==========\n`);
  
  // Create notifications
  try {
    // Notify employee
    await notificationService.createNotification(employeeId, {
      type: 'TEAM_DEALLOCATION',
      title: 'Removed from Team',
      body: `You have been removed from ${employee.manager_name}'s team by ${orgHeadName}`,
      metadata: {
        previousManagerId: managerId,
        previousManagerName: employee.manager_name,
        deallocatedBy: orgHeadId,
        deallocatedByName: orgHeadName,
      },
    });
    
    // Notify manager
    await notificationService.createNotification(managerId, {
      type: 'TEAM_DEALLOCATION',
      title: 'Team Member Removed',
      body: `${employee.name} has been removed from your team by ${orgHeadName}`,
      metadata: {
        employeeId: employeeId,
        employeeName: employee.name,
        deallocatedBy: orgHeadId,
        deallocatedByName: orgHeadName,
      },
    });
  } catch (err) {
    console.error('Failed to create deallocation notifications:', err);
    // Don't fail the whole operation if notification fails
  }
  
  return {
    success: true,
    employeeId: employeeId.toString(),
  };
};

// Create a new HQ user (employee or manager)
const createUser = async (orgHeadId, payload) => {
  const { name, email, password, role, department, designation } = payload;
  
  // Validate role - must be EMPLOYEE or MANAGER for HQ
  if (role !== 'EMPLOYEE' && role !== 'MANAGER') {
    const error = new Error('Invalid role. Must be EMPLOYEE or MANAGER for HQ organization');
    error.statusCode = 400;
    throw error;
  }
  
  // Validate required fields
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }
  
  // Create user using authService.register
  const user = await authService.register(
    {
      name,
      email,
      password,
      role,
      department: department || null,
      designation: designation || null,
      is_active: true,
    },
    { id: orgHeadId } // actor for audit log
  );
  
  // Log the action
  await auditService.logAction(orgHeadId, 'USER_CREATED_BY_HQ_ORG', 'users', user.id, {
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
  });
  
  return user;
};

// Get promotion candidates - employees with high KPI scores and good manager ratings
const getPromotionCandidates = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all employees
  const employeesSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: employees } = await query(employeesSql);
  
  // Get KPI for each employee (compute if needed, like in leaderboard)
  const results = [];
  for (const employee of employees) {
    let kpiScore = 0;
    let snapshotFound = false;
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT final_kpi
        FROM employee_kpi_snapshots
        WHERE user_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [employee.id]);
      if (kpiRows.length > 0 && kpiRows[0].final_kpi !== null) {
        snapshotFound = true;
        kpiScore = parseFloat(kpiRows[0].final_kpi) || 0;
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for employee ${employee.id}:`, error);
    }
    
    // If no KPI snapshot exists, compute it
    if (!snapshotFound) {
      try {
        const employeeKpi = await kpiService.computeEmployeeKpis(employee.id, start, end);
        kpiScore = employeeKpi.finalKpi || 0;
      } catch (error) {
        console.error(`Error computing KPI for employee ${employee.id}:`, error);
      }
    }
    
    // Only include if KPI >= 85
    if (kpiScore >= 85) {
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
    .slice(0, 10) // Top 10
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

// Get training recommendations - employees with low KPI scores or performance issues
const getTrainingRecommendations = async (periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);
  
  // Get all employees
  const employeesSql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM users u
    WHERE u.role = 'EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  
  const { rows: employees } = await query(employeesSql);
  
  // Get KPI breakdown for each employee (compute if needed)
  const employeesWithKpi = [];
  for (const employee of employees) {
    let kpiData = {
      final_kpi: null,
      file_disposal_rate: null,
      responsiveness: null,
      tat_score: null,
      quality_of_drafting: null,
      digital_adoption: null,
    };
    
    // Try to get existing KPI snapshot
    try {
      const kpiSql = `
        SELECT 
          final_kpi,
          file_disposal_rate,
          responsiveness,
          tat_score,
          quality_of_drafting,
          digital_adoption
        FROM employee_kpi_snapshots
        WHERE user_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      `;
      const { rows: kpiRows } = await query(kpiSql, [employee.id]);
      if (kpiRows.length > 0) {
        kpiData = {
          final_kpi: kpiRows[0].final_kpi,
          file_disposal_rate: kpiRows[0].file_disposal_rate,
          responsiveness: kpiRows[0].responsiveness,
          tat_score: kpiRows[0].tat_score,
          quality_of_drafting: kpiRows[0].quality_of_drafting,
          digital_adoption: kpiRows[0].digital_adoption,
        };
      }
    } catch (error) {
      console.error(`Error fetching KPI snapshot for employee ${employee.id}:`, error);
    }
    
    // If no KPI snapshot exists, compute it
    if (kpiData.final_kpi === null) {
      try {
        const employeeKpi = await kpiService.computeEmployeeKpis(employee.id, start, end);
        kpiData = {
          final_kpi: employeeKpi.finalKpi || 0,
          file_disposal_rate: employeeKpi.fileDisposalRate || 0,
          responsiveness: employeeKpi.responsiveness || 0,
          tat_score: employeeKpi.tatScore || 0,
          quality_of_drafting: employeeKpi.qualityOfDrafting || 0,
          digital_adoption: employeeKpi.digitalAdoption || 0,
        };
      } catch (error) {
        console.error(`Error computing KPI for employee ${employee.id}:`, error);
      }
    }
    
    employeesWithKpi.push({
      ...employee,
      ...kpiData,
    });
  }
  
  // Get attendance scores for employees
  const attendanceSql = `
    SELECT 
      user_id,
      AVG(CASE 
        WHEN status = 'present' AND total_hours >= 8 THEN 100
        WHEN status = 'present' AND total_hours >= 6 THEN 75
        WHEN status = 'present' AND total_hours >= 4 THEN 50
        WHEN status = 'present' THEN 25
        ELSE 0
      END) as attendance_score,
      COUNT(*) as attendance_days
    FROM attendance
    WHERE user_id = ANY($1::int[])
      AND date >= $2::DATE
      AND date <= $3::DATE
    GROUP BY user_id
  `;
  
  const employeeIds = employeesWithKpi.map(e => e.id);
  const { rows: attendanceRows } = employeeIds.length > 0
    ? await query(attendanceSql, [employeeIds, start, end])
    : { rows: [] };
  
  const attendanceMap = new Map(
    attendanceRows.map(a => [a.user_id, {
      score: parseFloat(a.attendance_score) || 0,
      days: parseInt(a.attendance_days) || 0
    }])
  );
  
  // Identify training needs based on low KPI or specific performance issues
  // Exclude high performers (KPI >= 85) from training recommendations
  const trainingNeeds = employeesWithKpi
    .filter(emp => {
      const kpiScore = parseFloat(emp.final_kpi) || 0;
      // Include only employees with KPI < 85 (exclude promotion candidates)
      return kpiScore < 85; // Exclude high performers
    })
    .map(emp => {
      const kpiScore = parseFloat(emp.final_kpi) || 0;
      const fdr = parseFloat(emp.file_disposal_rate) || 0;
      const responsiveness = parseFloat(emp.responsiveness) || 0;
      const tat = parseFloat(emp.tat_score) || 0;
      const quality = parseFloat(emp.quality_of_drafting) || 0;
      const digital = parseFloat(emp.digital_adoption) || 0;
      
      // Identify the weakest area
      const areas = [
        { name: 'File Disposal Rate', score: fdr },
        { name: 'Responsiveness', score: responsiveness },
        { name: 'Turnaround Time', score: tat },
        { name: 'Quality of Drafting', score: quality },
        { name: 'Digital Adoption', score: digital },
      ];
      
      const weakestArea = areas.reduce((min, area) => 
        area.score < min.score ? area : min
      );
      
      // Determine performance issue description
      let performanceIssue = 'Overall performance improvement needed';
      if (weakestArea.score < 60) {
        if (weakestArea.name === 'Responsiveness' || weakestArea.name === 'Turnaround Time') {
          performanceIssue = 'Deadline adherence';
        } else if (weakestArea.name === 'Quality of Drafting') {
          performanceIssue = 'Quality control';
        } else if (weakestArea.name === 'Digital Adoption') {
          performanceIssue = 'Technology adoption';
        } else {
          performanceIssue = 'Work efficiency';
        }
      }
      
      const attendance = attendanceMap.get(emp.id) || { score: 0, days: 0 };
      
      return {
        id: emp.id.toString(),
        name: emp.name,
        department: emp.department || 'N/A',
        designation: emp.designation || null,
        performanceIssues: performanceIssue,
        attendanceScore: Math.round(attendance.score),
        skillGap: weakestArea.name,
        kpiScore: Math.round(kpiScore * 100) / 100,
      };
    })
    .sort((a, b) => a.kpiScore - b.kpiScore) // Sort by lowest KPI first
    .slice(0, 10); // Top 10 needing training
  
  return trainingNeeds;
};

module.exports = {
  getAllManagersLeaderboard,
  getAllEmployeesLeaderboard,
  getAllManagers,
  submitFeedbackToManager,
  getDepartments,
  getManagersByDepartment,
  getEmployeesWithStatus,
  assignEmployeeToManager,
  deallocateEmployee,
  createUser,
  getPromotionCandidates,
  getTrainingRecommendations,
};

