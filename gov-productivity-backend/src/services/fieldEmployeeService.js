const { query } = require('../config/database');
const auditService = require('./auditService');

// Get Field Employee's projects with milestones
const getMyProjects = async (employeeId) => {
  const sql = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.status,
      p.due_date,
      p.budget,
      p.dpr_deadline,
      p.progress_percent,
      p.created_at,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
    FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    LEFT JOIN tasks t ON t.project_id = p.id AND t.assigned_to = $1
    WHERE (pm.user_id = $1 OR p.created_by = $1)
      AND p.project_type = 'field'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  const { rows: projects } = await query(sql, [employeeId]);

  // Get milestones for each project
  for (const project of projects) {
    const milestonesSql = `
      SELECT 
        pm.id,
        pm.name,
        pm.description,
        pm.status,
        pm.deadline,
        pm.budget,
        pm.expected_output,
        pm.progress_percent,
        COUNT(DISTINCT t.id) as task_count
      FROM project_milestones pm
      LEFT JOIN tasks t ON t.milestone_id = pm.id AND t.assigned_to = $1
      WHERE pm.project_id = $2
      GROUP BY pm.id
      ORDER BY pm.deadline ASC
    `;
    const { rows: milestones } = await query(milestonesSql, [employeeId, project.id]);
    project.milestones = milestones;

    // Get tasks for each milestone
    for (const milestone of milestones) {
      const tasksSql = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.deadline as due_date,
          t.cost,
          t.expected_output,
          COUNT(DISTINCT ts.id) as submission_count
        FROM tasks t
        LEFT JOIN task_submissions ts ON ts.task_id = t.id
        WHERE t.milestone_id = $1 AND t.assigned_to = $2
        GROUP BY t.id
        ORDER BY t.deadline ASC
      `;
      const { rows: tasks } = await query(tasksSql, [milestone.id, employeeId]);
      milestone.tasks = tasks;
    }
  }

  return projects;
};

// Get Field Employee's surveys (assigned to them via survey_members)
const getMySurveys = async (employeeId) => {
  const sql = `
    SELECT 
      s.id,
      s.name,
      s.description,
      s.status,
      s.start_date,
      s.end_date,
      s.total_area as area,
      s.expected_time,
      s.expected_time as "estimatedTime",
      s.deadline,
      s.location_id,
      s.created_at,
      ss.id as submission_id,
      ss.approval_status,
      ss.area_covered,
      ss.time_taken,
      ss.survey_accuracy,
      ss.survey_score,
      ss.manager_remarks,
      ss.submitted_at as submittedDate
    FROM survey_members sm
    JOIN surveys s ON s.id = sm.survey_id
    LEFT JOIN survey_submissions ss ON ss.survey_id = s.id AND ss.submitted_by = $1
    WHERE sm.user_id = $1 AND s.status = 'active'
    ORDER BY s.created_at DESC
  `;
  const { rows } = await query(sql, [employeeId]);
  
  // Format status for frontend
  return rows.map(row => {
    // Determine status: if no submission, it's 'pending'
    // If submission exists, use approval_status (which could be 'pending', 'approved', 'rejected')
    let status = 'pending';
    if (row.submission_id) {
      status = row.approval_status === 'pending' ? 'submitted' : row.approval_status;
    }
    
    // Get estimatedTime - PostgreSQL returns quoted aliases as-is, unquoted as lowercase
    // Check both camelCase alias (with quotes) and original column name
    const estimatedTime = row.estimatedTime || row.expected_time || null;
    
    // Create result object, explicitly setting estimatedTime
    const result = {
      ...row,
      estimatedTime: estimatedTime, // Explicitly set from either source
      status, // Override with computed status
    };
    
    // Remove original expected_time to avoid confusion (keep only estimatedTime)
    delete result.expected_time;
    
    return result;
  });
};

// Submit survey data (files are uploaded separately via the file upload endpoint)
const submitSurveySubmission = async (employeeId, surveyId, submissionData) => {
  const { getClient } = require('../config/database');
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Verify employee is assigned to this survey
    const verifySql = `
      SELECT sm.user_id
      FROM survey_members sm
      WHERE sm.survey_id = $1 AND sm.user_id = $2
    `;
    const { rows: verifyRows } = await client.query(verifySql, [surveyId, employeeId]);
    
    if (!verifyRows[0]) {
      throw new Error('You are not assigned to this survey');
    }
    
    // Check if submission already exists
    const checkSql = `
      SELECT id FROM survey_submissions
      WHERE survey_id = $1 AND submitted_by = $2
    `;
    const { rows: checkRows } = await client.query(checkSql, [surveyId, employeeId]);
    
    let submissionId;
    if (checkRows[0]) {
      // Update existing submission
      const updateSql = `
        UPDATE survey_submissions
        SET 
          area_covered = $1,
          time_taken = $2,
          notes = $3,
          approval_status = 'pending',
          submitted_at = NOW(),
          updated_at = NOW()
        WHERE id = $4
        RETURNING id
      `;
      const { rows: updateRows } = await client.query(updateSql, [
        submissionData.area_covered,
        submissionData.time_taken,
        submissionData.notes || null,
        checkRows[0].id,
      ]);
      submissionId = updateRows[0].id;
    } else {
      // Create new submission
      const insertSql = `
        INSERT INTO survey_submissions (survey_id, submitted_by, area_covered, time_taken, notes, approval_status, submitted_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        RETURNING id
      `;
      const { rows: insertRows } = await client.query(insertSql, [
        surveyId,
        employeeId,
        submissionData.area_covered,
        submissionData.time_taken,
        submissionData.notes || null,
      ]);
      submissionId = insertRows[0].id;
    }
    
    await client.query('COMMIT');
    
    // NOTE: KPI recalculation is NOT triggered on survey submission
    // Survey submissions start with 'pending' status and only count toward KPI when 'approved'
    // KPI recalculation is triggered on survey approval (see fieldManagerService.reviewSurveySubmission)
    // This prevents invalid zero KPI calculations from overwriting valid snapshots
    
    // Return the submission with details
    const resultSql = `
      SELECT 
        ss.*,
        s.name as survey_name
      FROM survey_submissions ss
      JOIN surveys s ON s.id = ss.survey_id
      WHERE ss.id = $1
    `;
    const { rows: resultRows } = await query(resultSql, [submissionId]);
    return resultRows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get Field Employee's KPI data
const getMyKPI = async (employeeId, periodStart, periodEnd) => {
  const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');
  
  // Try to get existing snapshot first
  let kpi = await fieldEmployeeKpiService.getFieldEmployeeKpi(employeeId, periodStart, periodEnd);
  
  // If no snapshot exists, calculate it
  if (!kpi) {
    kpi = await fieldEmployeeKpiService.computeFieldEmployeeKpis(employeeId, periodStart, periodEnd);
  }
  
  return kpi;
};

// Get Field Employee's KPI history
const getMyKPIHistory = async (employeeId) => {
  const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');
  return await fieldEmployeeKpiService.getFieldEmployeeKpiHistory(employeeId);
};

// Get location by location_id (for survey locations)
const getLocationById = async (locationId) => {
  const sql = `
    SELECT 
      id,
      location_id,
      latitude,
      longitude,
      description,
      interest,
      created_at,
      user_id,
      (SELECT name FROM users WHERE id = locations.user_id) as saved_by_name
    FROM locations
    WHERE location_id = $1
    LIMIT 1
  `;
  const { rows } = await query(sql, [locationId]);
  return rows[0] || null;
};

// Get Field Employee's locations
const getMyLocations = async (employeeId) => {
  const sql = `
    SELECT 
      id,
      location_id,
      latitude,
      longitude,
      description,
      interest,
      created_at,
      (SELECT name FROM users WHERE id = locations.user_id) as saved_by_name
    FROM locations
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await query(sql, [employeeId]);
  return rows;
};

// Save a location (Field Employee - no interest)
const saveLocation = async (employeeId, locationData) => {
  // Check if location already exists (might be created by manager)
  const checkSql = `
    SELECT id, user_id, location_id, latitude, longitude, description, interest, created_at
    FROM locations
    WHERE location_id = $1
    LIMIT 1
  `;
  const { rows: existingRows } = await query(checkSql, [locationData.location_id]);
  
  if (existingRows.length > 0) {
    const existingLocation = existingRows[0];
    // If location already exists and belongs to this employee, return it
    if (existingLocation.user_id === employeeId) {
      return existingLocation;
    }
    // If location exists but belongs to another user (e.g., manager),
    // create a new entry with employee-specific location_id to avoid unique constraint violation
    const employeeLocationId = `${locationData.location_id}_emp_${employeeId}`;
    
    // Check if employee already has this location saved
    const { rows: empRows } = await query(checkSql, [employeeLocationId]);
    if (empRows.length > 0) {
      return empRows[0];
    }
    
    // Insert with employee-specific location_id
    const sql = `
      INSERT INTO locations (location_id, user_id, latitude, longitude, description, interest)
      VALUES ($1, $2, $3, $4, $5, NULL)
      RETURNING id, location_id, latitude, longitude, description, interest, created_at
    `;
    const { rows } = await query(sql, [
      employeeLocationId,
      employeeId,
      locationData.latitude,
      locationData.longitude,
      locationData.description || null,
    ]);
    return rows[0];
  }

  // Insert new location
  const sql = `
    INSERT INTO locations (location_id, user_id, latitude, longitude, description, interest)
    VALUES ($1, $2, $3, $4, $5, NULL)
    RETURNING id, location_id, latitude, longitude, description, interest, created_at
  `;
  try {
    const { rows } = await query(sql, [
      locationData.location_id,
      employeeId,
      locationData.latitude,
      locationData.longitude,
      locationData.description || null,
    ]);
    return rows[0];
  } catch (error) {
    // Handle unique constraint violation - race condition where location was just created
    if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
      // Location was inserted by another process, fetch it
      const { rows: fetchedRows } = await query(checkSql, [locationData.location_id]);
      if (fetchedRows.length > 0 && fetchedRows[0].user_id === employeeId) {
        return fetchedRows[0];
      }
      // If it belongs to someone else, create employee-specific version
      const employeeLocationId = `${locationData.location_id}_emp_${employeeId}`;
      const uniqueSql = `
        INSERT INTO locations (location_id, user_id, latitude, longitude, description, interest)
        VALUES ($1, $2, $3, $4, $5, NULL)
        RETURNING id, location_id, latitude, longitude, description, interest, created_at
      `;
      const { rows: uniqueInsertRows } = await query(uniqueSql, [
        employeeLocationId,
        employeeId,
        locationData.latitude,
        locationData.longitude,
        locationData.description || null,
      ]);
      return uniqueInsertRows[0];
    }
    throw error;
  }
};

// Delete a location
const deleteLocation = async (employeeId, locationId) => {
  const sql = `
    DELETE FROM locations
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;
  const { rows } = await query(sql, [locationId, employeeId]);
  return rows[0];
};

// Get Field Employee's field visits
const getMyFieldVisits = async (employeeId) => {
  const sql = `
    SELECT 
      fv.id,
      fv.visit_type,
      fv.project_id,
      fv.survey_id,
      fv.visit_date,
      fv.location_id,
      fv.latitude,
      fv.longitude,
      fv.notes,
      fv.status,
      fv.created_at,
      p.name as project_name,
      s.name as survey_name
    FROM field_visits fv
    LEFT JOIN projects p ON p.id = fv.project_id
    LEFT JOIN surveys s ON s.id = fv.survey_id
    WHERE fv.visited_by = $1
    ORDER BY fv.visit_date DESC
  `;
  const { rows } = await query(sql, [employeeId]);
  return rows;
};

// Get Field Employee's training programs
const getMyTrainings = async (employeeId) => {
  const sql = `
    SELECT 
      id,
      name,
      status,
      start_date,
      completion_date,
      duration_hours
    FROM trainings
    WHERE user_id = $1
    ORDER BY start_date DESC
  `;
  const { rows } = await query(sql, [employeeId]);
  return rows;
};

// Get Field Employee's peers (same department)
const getMyPeers = async (employeeId) => {
  // Get employee's department
  const { rows: employeeRow } = await query(
    `SELECT department, role FROM users WHERE id = $1 AND role = 'FIELD_EMPLOYEE'`,
    [employeeId]
  );
  
  if (!employeeRow[0]) {
    console.log(`[getMyPeers] Employee ${employeeId} not found or not a FIELD_EMPLOYEE`);
    return [];
  }
  
  if (!employeeRow[0].department) {
    console.log(`[getMyPeers] Employee ${employeeId} has no department`);
    return [];
  }
  
  const department = employeeRow[0].department ? employeeRow[0].department.trim() : null;
  console.log(`[getMyPeers] Finding peers for employee ${employeeId} in department: "${department}"`);
  
  if (!department) {
    console.log(`[getMyPeers] No department found for employee ${employeeId}`);
    return [];
  }
  
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.designation,
      u.role,
      u.department
    FROM users u
    WHERE TRIM(COALESCE(u.department, '')) = $1
      AND u.id != $2
      AND u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
    ORDER BY u.name ASC
  `;
  const { rows } = await query(sql, [department, employeeId]);
  console.log(`[getMyPeers] Found ${rows.length} peers for employee ${employeeId} in department "${department}"`);
  if (rows.length > 0) {
    console.log(`[getMyPeers] Peer names: ${rows.map(r => r.name).join(', ')}`);
  }
  return rows;
};

// Get Field Employee's feedback
const getMyFeedback = async (employeeId) => {
  // Combine task feedback, peer feedback, and manager feedback
  const taskFeedbackSql = `
    SELECT 
      'task' as feedback_type,
      tf.id,
      tf.rating,
      tf.comment,
      tf.created_at,
      t.title as regarding,
      u.name as from_user_name
    FROM task_feedbacks tf
    JOIN tasks t ON t.id = tf.task_id
    JOIN users u ON u.id = tf.from_user_id
    WHERE tf.to_user_id = $1
    ORDER BY tf.created_at DESC
    LIMIT 10
  `;
  const { rows: taskFeedback } = await query(taskFeedbackSql, [employeeId]);

  const peerFeedbackSql = `
    SELECT 
      'peer' as feedback_type,
      pf.id,
      pf.rating,
      pf.comment,
      pf.created_at,
      pf.regarding,
      pf.sentiment,
      pf.emotion,
      u.name as from_user_name
    FROM peer_feedbacks pf
    JOIN users u ON u.id = pf.from_user_id
    WHERE pf.to_user_id = $1
    ORDER BY pf.created_at DESC
    LIMIT 10
  `;
  const { rows: peerFeedback } = await query(peerFeedbackSql, [employeeId]);

  const managerFeedbackSql = `
    SELECT 
      'manager' as feedback_type,
      mf.id,
      mf.rating,
      mf.comment,
      mf.created_at,
      mf.regarding,
      mf.sentiment,
      mf.emotion,
      u.name as from_user_name,
      u.role as from_user_role
    FROM manager_feedbacks mf
    JOIN users u ON u.id = mf.manager_id
    WHERE mf.employee_id = $1
    ORDER BY mf.created_at DESC
    LIMIT 10
  `;
  const { rows: managerFeedback } = await query(managerFeedbackSql, [employeeId]);

  // Format for frontend - combine all feedback types and format consistently
  const allFeedback = [
    ...peerFeedback.map(f => ({
      id: f.id,
      from: f.from_user_name,
      role: 'Peer',
      subject: f.regarding || 'Peer Feedback',
      message: f.comment || '',
      date: new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      rating: f.rating,
      sentiment: f.sentiment || 'neutral',
      emotion: f.emotion || 'Neutral',
      initials: f.from_user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    })),
    ...managerFeedback.map(f => ({
      id: f.id,
      from: f.from_user_name,
      role: 'Manager',
      subject: f.regarding || 'Manager Feedback',
      message: f.comment || '',
      date: new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      rating: f.rating,
      sentiment: f.sentiment || 'neutral',
      emotion: f.emotion || 'Neutral',
      initials: f.from_user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return allFeedback;
};

// Get all available skills from field_employee_skills table
const getAvailableSkills = async () => {
  const sql = `
    SELECT id, skill_name as name
    FROM field_employee_skills
    ORDER BY skill_name ASC
  `;
  const { rows } = await query(sql);
  return rows;
};

// Get user's selected skills
const getMySkills = async (userId) => {
  const sql = `
    SELECT id, name, created_at
    FROM field_employee_user_skills
    WHERE user_id = $1
    ORDER BY name ASC
  `;
  const { rows } = await query(sql, [userId]);
  return rows;
};

// Save/update user's skills
const saveMySkills = async (userId, skillNames) => {
  const { getClient } = require('../config/database');
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Delete all existing skills for this user
    await client.query(
      'DELETE FROM field_employee_user_skills WHERE user_id = $1',
      [userId]
    );

    // Insert new skills
    if (skillNames && skillNames.length > 0) {
      const values = skillNames.map((name, index) => 
        `($${index * 2 + 1}, $${index * 2 + 2})`
      ).join(', ');
      
      const params = skillNames.flatMap(name => [userId, name]);
      const sql = `
        INSERT INTO field_employee_user_skills (user_id, name)
        VALUES ${values}
        ON CONFLICT (user_id, name) DO NOTHING
      `;
      await client.query(sql, params);
    }

    await client.query('COMMIT');

    // Return updated skills
    return await getMySkills(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getMyProjects,
  getMySurveys,
  submitSurveySubmission,
  getMyKPI,
  getMyKPIHistory,
  getLocationById,
  getMyLocations,
  saveLocation,
  deleteLocation,
  getMyFieldVisits,
  getMyTrainings,
  getMyPeers,
  getMyFeedback,
  getAvailableSkills,
  getMySkills,
  saveMySkills,
};

