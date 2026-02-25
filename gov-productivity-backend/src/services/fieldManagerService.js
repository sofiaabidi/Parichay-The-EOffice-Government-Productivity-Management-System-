const { query, getClient } = require('../config/database');
const User = require('../models/User');

// Get Field Manager's team members
const getMyTeam = async (managerId) => {
  return await User.listTeamMembersByManager(managerId);
};

// Get Field Manager's projects with all details
const getMyProjects = async (managerId) => {
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
      COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'awaiting-review' THEN t.id END) as pending_approvals
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.created_by = $1 AND p.project_type = 'field'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  const { rows: projects } = await query(sql, [managerId]);

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
          COUNT(DISTINCT t.id) as total_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'awaiting-review' THEN t.id END) as pending_tasks
        FROM project_milestones pm
        LEFT JOIN tasks t ON t.milestone_id = pm.id
        WHERE pm.project_id = $1
        GROUP BY pm.id
        ORDER BY pm.deadline ASC
      `;
      const { rows: milestones } = await query(milestonesSql, [project.id]);
      // Mark "Final DPR Submission" milestone with isFinalDPR flag
      const milestonesWithFlag = milestones.map(m => ({
        ...m,
        isFinalDPR: m.name === 'Final DPR Submission'
      }));
      project.milestones = milestonesWithFlag;

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
          t.assigned_to,
          u.name as assigned_to_name,
          u.email as assigned_to_email,
          COUNT(DISTINCT ts.id) as submission_count,
          MAX(ts.submitted_at) as last_submission_at
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN task_submissions ts ON ts.task_id = t.id
        WHERE t.milestone_id = $1
        GROUP BY t.id, u.name, u.email
        ORDER BY t.deadline ASC
      `;
      const { rows: tasks } = await query(tasksSql, [milestone.id]);
      milestone.tasks = tasks;
    }

    // Get project evaluation if exists
    const evalSql = `
      SELECT 
        quality_score,
        technical_compliance,
        remarks,
        created_at,
        updated_at
      FROM project_evaluations
      WHERE project_id = $1 AND evaluated_by = $2
    `;
    const { rows: evaluations } = await query(evalSql, [project.id, managerId]);
    project.evaluation = evaluations[0] || null;
  }

  return projects;
};

// Create a new survey
const createSurvey = async (managerId, surveyData) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Insert survey
    const surveySql = `
      INSERT INTO surveys (name, description, created_by, status, start_date, end_date, total_area, expected_time, location_id, deadline)
      VALUES ($1, $2, $3, 'active', CURRENT_DATE, $4, $5, $6, $7, $8)
      RETURNING id, name, description, status, start_date, end_date, total_area, expected_time, location_id, deadline, created_at
    `;
    const { rows: surveyRows } = await client.query(surveySql, [
      surveyData.name,
      surveyData.description || null,
      managerId,
      surveyData.deadline || null,
      surveyData.total_area,
      surveyData.expected_time,
      surveyData.location_id || null,
      surveyData.deadline || null,
    ]);
    const survey = surveyRows[0];
    
    // Insert survey members
    if (surveyData.member_ids && surveyData.member_ids.length > 0) {
      const memberValues = surveyData.member_ids.map((memberId, idx) => 
        `($${idx * 2 + 1}, $${idx * 2 + 2})`
      ).join(', ');
      const memberParams = surveyData.member_ids.flatMap(id => [survey.id, id]);
      const memberSql = `
        INSERT INTO survey_members (survey_id, user_id)
        VALUES ${memberValues}
        ON CONFLICT (survey_id, user_id) DO NOTHING
      `;
      await client.query(memberSql, memberParams);
    }
    
    await client.query('COMMIT');
    return survey;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get Field Manager's surveys
const getMySurveys = async (managerId) => {
  const sql = `
    SELECT 
      s.id,
      s.name,
      s.description,
      s.status,
      s.start_date,
      s.end_date,
      s.total_area,
      s.expected_time,
      s.location_id,
      s.deadline,
      s.created_at,
      COUNT(DISTINCT ss.id) as submission_count,
      COUNT(DISTINCT CASE WHEN ss.approval_status = 'pending' THEN ss.id END) as pending_reviews
    FROM surveys s
    LEFT JOIN survey_submissions ss ON ss.survey_id = s.id
    WHERE s.created_by = $1
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;
  const { rows } = await query(sql, [managerId]);
  return rows;
};

// Get survey submissions for manager review
const getSurveySubmissions = async (managerId) => {
  const sql = `
    SELECT 
      ss.id,
      ss.survey_id,
      ss.submitted_by,
      ss.area_covered,
      ss.time_taken,
      ss.notes,
      ss.survey_accuracy,
      ss.survey_score,
      ss.manager_remarks,
      ss.approval_status,
      ss.submitted_at,
      ss.reviewed_at,
      s.name as survey_name,
      s.total_area,
      s.expected_time,
      s.deadline,
      u.name as submitted_by_name,
      u.email as submitted_by_email
    FROM survey_submissions ss
    JOIN surveys s ON s.id = ss.survey_id
    JOIN users u ON u.id = ss.submitted_by
    WHERE s.created_by = $1 AND ss.approval_status = 'pending'
    ORDER BY ss.submitted_at DESC
  `;
  const { rows } = await query(sql, [managerId]);
  
  // Get files for each submission
  for (const submission of rows) {
    const filesSql = `
      SELECT 
        fd.id,
        fd.original_name,
        fd.mime_type,
        fd.file_size,
        fd.storage_path,
        ssf.file_type
      FROM survey_submission_files ssf
      JOIN file_documents fd ON fd.id = ssf.file_document_id
      WHERE ssf.survey_submission_id = $1
      ORDER BY ssf.uploaded_at ASC
    `;
    const { rows: files } = await query(filesSql, [submission.id]);
    submission.files = files;
  }
  
  return rows;
};

// Calculate survey score using the formula
const calculateSurveyScore = async (submissionId, surveyId, employeeId) => {
  const LAMBDA_COVERAGE = 0.4;
  const LAMBDA_SPEED = 0.3;
  const LAMBDA_SUPERVISOR = 0.3;
  const UPPER_SPEED_LIMIT = 1.5; // Cap speed score at 1.5x
  
  // Get submission data
  const submissionSql = `
    SELECT area_covered, time_taken
    FROM survey_submissions
    WHERE id = $1
  `;
  const { rows: subRows } = await query(submissionSql, [submissionId]);
  if (!subRows[0]) return null;
  
  const areaCovered = parseFloat(subRows[0].area_covered) || 0;
  const timeTaken = parseFloat(subRows[0].time_taken) || 1; // Avoid division by zero
  
  // Get survey data
  const surveySql = `
    SELECT total_area, expected_time
    FROM surveys
    WHERE id = $1
  `;
  const { rows: surveyRows } = await query(surveySql, [surveyId]);
  if (!surveyRows[0]) return null;
  
  const areaPlanned = parseFloat(surveyRows[0].total_area) || 0;
  const estimatedTime = parseFloat(surveyRows[0].expected_time) || 1;
  
  // Get number of people assigned to this survey
  const numPeopleSql = `
    SELECT COUNT(*) as count
    FROM survey_members
    WHERE survey_id = $1
  `;
  const { rows: numPeopleRows } = await query(numPeopleSql, [surveyId]);
  const numPeople = parseInt(numPeopleRows[0]?.count || 1);
  
  // Calculate AreaPerPerson
  const areaPerPerson = areaPlanned / numPeople;
  
  // 3A. Coverage Score
  const coverage = Math.min(1, areaCovered / areaPerPerson);
  
  // 3B. Speed Score
  const v_person = areaCovered / timeTaken;
  const v_plan = areaPerPerson / estimatedTime;
  const speed = Math.min(UPPER_SPEED_LIMIT, v_person / v_plan);
  
  // 3C. Supervisor Score (average of all ratings for this employee on this survey)
  const supervisorSql = `
    SELECT AVG(sr.rating / 10.0) as avg_rating, COUNT(*) as rating_count
    FROM supervisor_ratings sr
    JOIN survey_field_visits sfv ON sfv.id = sr.survey_field_visit_id
    WHERE sfv.survey_id = $1 AND sr.employee_id = $2
  `;
  const { rows: supervisorRows } = await query(supervisorSql, [surveyId, employeeId]);
  const supervisorScore = parseFloat(supervisorRows[0]?.avg_rating || 0);
  const m = parseInt(supervisorRows[0]?.rating_count || 0);
  
  // 3D. Final Survey Score
  const surveyScore = 100 * (
    LAMBDA_COVERAGE * coverage +
    LAMBDA_SPEED * speed +
    LAMBDA_SUPERVISOR * supervisorScore
  );
  
  return Math.round(surveyScore * 100) / 100; // Round to 2 decimal places
};

// Approve or reject survey submission with feedback
const reviewSurveySubmission = async (managerId, submissionId, reviewData) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Verify the submission belongs to a survey created by this manager
    const verifySql = `
      SELECT ss.id, ss.survey_id, ss.submitted_by, s.created_by
      FROM survey_submissions ss
      JOIN surveys s ON s.id = ss.survey_id
      WHERE ss.id = $1
    `;
    const { rows: verifyRows } = await client.query(verifySql, [submissionId]);
    
    if (!verifyRows[0] || verifyRows[0].created_by !== managerId) {
      throw new Error('Survey submission not found or unauthorized');
    }
    
    let surveyScore = null;
    // Calculate survey score if approving
    if (reviewData.status === 'approved') {
      surveyScore = await calculateSurveyScore(
        submissionId,
        verifyRows[0].survey_id,
        verifyRows[0].submitted_by
      );
    }
    
    // Update submission
    const updateSql = `
      UPDATE survey_submissions
      SET 
        approval_status = $1,
        survey_score = $2,
        manager_remarks = $3,
        reviewed_by = $4,
        reviewed_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const { rows: updateRows } = await client.query(updateSql, [
      reviewData.status, // 'approved' or 'rejected'
      surveyScore,
      reviewData.remarks || null,
      managerId,
      submissionId,
    ]);
    
    await client.query('COMMIT');
    
    // Recalculate employee KPI if approved (async, don't wait)
    if (reviewData.status === 'approved') {
      const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');
      const employeeId = verifyRows[0].submitted_by;
      console.log(`[KPI Trigger] Survey approval trigger - Recalculating KPI for employee ${employeeId} after survey approval`);
      console.log(`[KPI Trigger] Survey approval - Submission ID: ${submissionId}, Survey ID: ${verifyRows[0].survey_id}`);
      fieldEmployeeKpiService.computeFieldEmployeeKpis(
        employeeId,
        null,
        null,
        { persist: true }
      )
      .then(result => {
        console.log(`[KPI Trigger] Survey approval - Successfully recalculated KPI for employee ${employeeId}:`, {
          dprKpi: result.dprKpi,
          technicalComplianceKpi: result.technicalComplianceKpi,
          surveyKpi: result.surveyKpi,
          expenditureKpi: result.expenditureKpi,
          taskTimelinessKpi: result.taskTimelinessKpi,
          finalKpi: result.finalKpi,
          periodStart: result.periodStart,
          periodEnd: result.periodEnd
        });
      })
      .catch(err => {
        console.error(`[KPI Trigger] Survey approval - Error recalculating KPI for employee ${employeeId} after survey approval:`, err);
      });
    }
    
    return updateRows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get Field Manager's KPI data
const getMyKPI = async (managerId, periodStart, periodEnd) => {
  const sql = `
    SELECT 
      avg_team_kpi,
      review_ratio,
      final_kpi,
      period_start,
      period_end
    FROM manager_kpi_snapshots
    WHERE manager_id = $1
      AND ($2::DATE IS NULL OR period_start >= $2)
      AND ($3::DATE IS NULL OR period_end <= $3)
    ORDER BY period_end DESC
    LIMIT 1
  `;
  const { rows } = await query(sql, [managerId, periodStart || null, periodEnd || null]);
  return rows[0] || null;
};

// Get team KPI table
const getTeamKPITable = async (managerId, periodStart, periodEnd) => {
  // Get team members
  const teamMembers = await User.listTeamMembersByManager(managerId);
  
  // Get KPI for each team member
  const teamKPIs = [];
  for (const member of teamMembers) {
    const kpiSql = `
      SELECT 
        final_kpi,
        file_disposal_rate,
        responsiveness,
        tat_score,
        quality_of_drafting,
        digital_adoption,
        period_start,
        period_end
      FROM employee_kpi_snapshots
      WHERE user_id = $1
        AND ($2::DATE IS NULL OR period_start >= $2)
        AND ($3::DATE IS NULL OR period_end <= $3)
      ORDER BY period_end DESC
      LIMIT 1
    `;
    const { rows } = await query(kpiSql, [member.id, periodStart || null, periodEnd || null]);
    teamKPIs.push({
      ...member,
      kpi: rows[0] || null,
    });
  }

  return teamKPIs;
};

// Get leaderboard
const getLeaderboard = async (managerId, periodStart, periodEnd) => {
  const teamMembers = await User.listTeamMembersByManager(managerId);
  const memberIds = teamMembers.map(m => m.id);

  if (memberIds.length === 0) {
    return [];
  }

  const placeholders = memberIds.map((_, i) => `$${i + 3}`).join(',');
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.designation,
      eks.final_kpi,
      eks.period_start,
      eks.period_end
    FROM users u
    JOIN employee_kpi_snapshots eks ON eks.user_id = u.id
    WHERE u.id IN (${placeholders})
      AND ($1::DATE IS NULL OR eks.period_start >= $1)
      AND ($2::DATE IS NULL OR eks.period_end <= $2)
    ORDER BY eks.final_kpi DESC
    LIMIT 10
  `;
  const { rows } = await query(sql, [periodStart || null, periodEnd || null, ...memberIds]);
  return rows;
};

// Get pending approvals
const getPendingApprovals = async (managerId) => {
  // Get tasks awaiting review
  const tasksSql = `
    SELECT 
      t.id,
      t.title,
      t.description,
      t.status,
      t.deadline,
      t.assigned_to,
      u.name as assigned_to_name,
      u.email as assigned_to_email,
      p.name as project_name,
      pm.name as milestone_name,
      COUNT(DISTINCT ts.id) as submission_count,
      MAX(ts.submitted_at) as last_submission_at
    FROM tasks t
    JOIN users u ON u.id = t.assigned_to
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN project_milestones pm ON pm.id = t.milestone_id
    LEFT JOIN task_submissions ts ON ts.task_id = t.id
    WHERE t.status = 'awaiting-review'
      AND EXISTS (
        SELECT 1 FROM projects p2 
        WHERE p2.id = t.project_id 
          AND p2.created_by = $1
      )
    GROUP BY t.id, u.name, u.email, p.name, pm.name
    ORDER BY t.deadline ASC
  `;
  const { rows: tasks } = await query(tasksSql, [managerId]);

  // Get survey submissions pending review
  const surveysSql = `
    SELECT 
      ss.id,
      ss.survey_id,
      s.name as survey_name,
      ss.submitted_by,
      u.name as submitted_by_name,
      u.email as submitted_by_email,
      ss.submitted_at,
      ss.status
    FROM survey_submissions ss
    JOIN surveys s ON s.id = ss.survey_id
    JOIN users u ON u.id = ss.submitted_by
    WHERE ss.status = 'submitted'
      AND s.created_by = $1
    ORDER BY ss.submitted_at DESC
  `;
  const { rows: surveys } = await query(surveysSql, [managerId]);

  return {
    tasks,
    surveys,
  };
};

// Get ongoing activities (projects with active tasks)
const getOngoingActivities = async (managerId) => {
  const sql = `
    SELECT 
      p.id as project_id,
      p.name as project_name,
      p.status as project_status,
      p.progress_percent,
      COUNT(DISTINCT pm.id) as milestone_count,
      COUNT(DISTINCT t.id) as task_count,
      COUNT(DISTINCT CASE WHEN t.status = 'in-progress' THEN t.id END) as active_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'awaiting-review' THEN t.id END) as pending_reviews
    FROM projects p
    LEFT JOIN project_milestones pm ON pm.project_id = p.id
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.created_by = $1
      AND p.project_type = 'field'
      AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  const { rows } = await query(sql, [managerId]);
  return rows;
};

// Get dashboard summary
const getDashboardSummary = async (managerId, periodStart, periodEnd) => {
  const teamMembers = await User.listTeamMembersByManager(managerId);
  const memberIds = teamMembers.map(m => m.id);

  // Get manager KPI
  const managerKPI = await getMyKPI(managerId, periodStart, periodEnd);

  // Get team average KPI
  let teamAverageKPI = 0;
  if (memberIds.length > 0) {
    const placeholders = memberIds.map((_, i) => `$${i + 1}`).join(',');
    const avgSql = `
      SELECT AVG(final_kpi) as avg_kpi
      FROM employee_kpi_snapshots
      WHERE user_id IN (${placeholders})
        AND ($1::DATE IS NULL OR period_start >= $1)
        AND ($2::DATE IS NULL OR period_end <= $2)
    `;
    const { rows } = await query(avgSql, [periodStart || null, periodEnd || null, ...memberIds]);
    teamAverageKPI = parseFloat(rows[0]?.avg_kpi || 0);
  }

  // Get project counts
  const projectSql = `
    SELECT 
      COUNT(*) as total_projects,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects
    FROM projects
    WHERE created_by = $1 AND project_type = 'field'
  `;
  const { rows: projectStats } = await query(projectSql, [managerId]);

  // Get task counts
  const taskSql = `
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN status = 'awaiting-review' THEN 1 END) as pending_reviews
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE p.created_by = $1 AND p.project_type = 'field'
  `;
  const { rows: taskStats } = await query(taskSql, [managerId]);

  return {
    managerKPI: managerKPI?.final_kpi || 0,
    teamAverageKPI,
    projects: projectStats[0] || {},
    tasks: taskStats[0] || {},
    teamSize: teamMembers.length,
  };
};

// Get Field Manager's feedback (from employees/peers)
const getMyFeedback = async (managerId) => {
  // Get peer feedbacks (employees can give peer feedback to manager)
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
      u.name as from_user_name,
      u.role as from_user_role,
      u.designation
    FROM peer_feedbacks pf
    JOIN users u ON u.id = pf.from_user_id
    WHERE pf.to_user_id = $1
    ORDER BY pf.created_at DESC
    LIMIT 20
  `;
  const { rows: peerFeedback } = await query(peerFeedbackSql, [managerId]);

  // Format for frontend
  const allFeedback = peerFeedback.map(f => {
    // Determine role display based on from_user_role
    let roleDisplay = f.designation || 'Employee';
    if (f.from_user_role === 'FIELD_ORG') {
      roleDisplay = 'Field Organization';
    } else if (f.from_user_role === 'HQ_ORG') {
      roleDisplay = 'HQ Organization';
    } else if (f.from_user_role === 'ADMIN') {
      roleDisplay = 'Administration';
    }
    
    return {
      id: f.id,
      name: f.from_user_name,
      role: roleDisplay,
      date: new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      subject: f.regarding || 'Feedback',
      comment: f.comment || '',
      rating: f.rating,
      sentiment: f.sentiment || 'neutral',
      emotion: f.emotion || 'Neutral',
      avatar: f.from_user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      avatarColor: getAvatarColor(f.from_user_name),
    };
  });

  return allFeedback;
};

// Helper function to get avatar color
const getAvatarColor = (name) => {
  const colors = [
    'bg-pink-100 text-pink-600',
    'bg-purple-100 text-purple-600',
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-orange-100 text-orange-600',
    'bg-indigo-100 text-indigo-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Get Field Manager's locations
const getMyLocations = async (managerId) => {
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
  const { rows } = await query(sql, [managerId]);
  return rows;
};

// Save a location (Field Manager - with interest)
const saveLocation = async (managerId, locationData) => {
  const sql = `
    INSERT INTO locations (location_id, user_id, latitude, longitude, description, interest)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, location_id, latitude, longitude, description, interest, created_at
  `;
  const { rows } = await query(sql, [
    locationData.location_id,
    managerId,
    locationData.latitude,
    locationData.longitude,
    locationData.description || null,
    locationData.interest || null,
  ]);
  return rows[0];
};

// Delete a location
const deleteLocation = async (managerId, locationId) => {
  const sql = `
    DELETE FROM locations
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;
  const { rows } = await query(sql, [locationId, managerId]);
  return rows[0];
};

// Get active surveys for field visit dropdown
const getActiveSurveys = async (managerId) => {
  const sql = `
    SELECT 
      s.id,
      s.name,
      s.total_area,
      s.expected_time,
      s.deadline
    FROM surveys s
    WHERE s.created_by = $1 AND s.status = 'active'
    ORDER BY s.created_at DESC
  `;
  const { rows } = await query(sql, [managerId]);
  return rows;
};

// Get employees assigned to a survey
const getSurveyEmployees = async (managerId, surveyId) => {
  // Verify manager owns this survey
  const verifySql = `
    SELECT id FROM surveys WHERE id = $1 AND created_by = $2
  `;
  const { rows: verifyRows } = await query(verifySql, [surveyId, managerId]);
  if (!verifyRows[0]) {
    throw new Error('Survey not found or unauthorized');
  }
  
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.designation
    FROM survey_members sm
    JOIN users u ON u.id = sm.user_id
    WHERE sm.survey_id = $1
    ORDER BY u.name ASC
  `;
  const { rows } = await query(sql, [surveyId]);
  return rows;
};

// Get active projects for field visit dropdown
const getActiveProjects = async (managerId) => {
  const sql = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.status,
      p.due_date
    FROM projects p
    WHERE p.created_by = $1 AND p.project_type = 'field' AND p.status = 'active'
    ORDER BY p.created_at DESC
  `;
  const { rows } = await query(sql, [managerId]);
  return rows;
};

// Get employees assigned to a project
const getProjectEmployees = async (managerId, projectId) => {
  // Verify manager owns this project
  const verifySql = `
    SELECT id FROM projects WHERE id = $1 AND created_by = $2 AND project_type = 'field'
  `;
  const { rows: verifyRows } = await query(verifySql, [projectId, managerId]);
  if (!verifyRows[0]) {
    throw new Error('Project not found or unauthorized');
  }
  
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.designation
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = $1
    ORDER BY u.name ASC
  `;
  const { rows } = await query(sql, [projectId]);
  return rows;
};

// Create survey field visit with supervisor ratings
const createSurveyFieldVisit = async (managerId, visitData) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Verify manager owns this survey
    const verifySql = `
      SELECT id FROM surveys WHERE id = $1 AND created_by = $2
    `;
    const { rows: verifyRows } = await client.query(verifySql, [visitData.survey_id, managerId]);
    if (!verifyRows[0]) {
      throw new Error('Survey not found or unauthorized');
    }
    
    // Create field visit
    const visitSql = `
      INSERT INTO survey_field_visits (survey_id, visited_by, visit_date, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const { rows: visitRows } = await client.query(visitSql, [
      visitData.survey_id,
      managerId,
      visitData.visit_date || new Date().toISOString().split('T')[0],
      visitData.notes || null,
    ]);
    const visitId = visitRows[0].id;
    
    // Insert supervisor ratings
    if (visitData.ratings && visitData.ratings.length > 0) {
      for (const rating of visitData.ratings) {
        const ratingSql = `
          INSERT INTO supervisor_ratings (survey_field_visit_id, employee_id, rating, notes)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (survey_field_visit_id, employee_id) 
          DO UPDATE SET rating = $3, notes = $4
        `;
        await client.query(ratingSql, [
          visitId,
          rating.employee_id,
          rating.rating,
          rating.notes || null,
        ]);
      }
    }
    
    await client.query('COMMIT');
    
    // Recalculate KPIs for all employees who received ratings (async, don't wait)
    if (visitData.ratings && visitData.ratings.length > 0) {
      console.log(`[KPI Trigger] Survey field visit trigger - Recalculating KPIs for employees after survey field visit`);
      console.log(`[KPI Trigger] Survey field visit - Survey ID: ${visitData.survey_id}, Visit ID: ${visitId}`);
      const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');
      const employeeIds = [...new Set(visitData.ratings.map(r => r.employee_id))];
      console.log(`[KPI Trigger] Survey field visit - Employee IDs to recalculate:`, employeeIds);
      for (const empId of employeeIds) {
        fieldEmployeeKpiService.computeFieldEmployeeKpis(
          empId,
          null,
          null,
          { persist: true }
        )
        .then(result => {
          console.log(`[KPI Trigger] Survey field visit - Successfully recalculated KPI for employee ${empId}:`, {
            surveyKpi: result.surveyKpi,
            finalKpi: result.finalKpi
          });
        })
        .catch(err => {
          console.error(`[KPI Trigger] Survey field visit - Error recalculating KPI for employee ${empId} after survey visit:`, err);
        });
      }
    }
    
    return { id: visitId, survey_id: visitData.survey_id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Create field project with milestones and tasks
const createFieldProject = async (managerId, projectData) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Insert project
    const projectSql = `
      INSERT INTO projects (name, description, status, start_date, due_date, created_by, budget, dpr_deadline, project_type)
      VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, 'field')
      RETURNING id, name, description, status, start_date, due_date, budget, dpr_deadline, created_at
    `;
    const { rows: projectRows } = await client.query(projectSql, [
      projectData.name || projectData.title,
      projectData.description || null,
      projectData.startDate || null,
      projectData.dueDate || null,
      managerId,
      projectData.totalCost || projectData.budget || null,
      projectData.dprDeadline || null,
    ]);
    const project = projectRows[0];
    
    // Insert project members
    if (projectData.memberIds && projectData.memberIds.length > 0) {
      for (const memberId of projectData.memberIds) {
        await client.query(
          `INSERT INTO project_members (project_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [project.id, memberId]
        );
      }
    }
    
    // Insert milestones
    if (projectData.milestones && projectData.milestones.length > 0) {
      for (const milestone of projectData.milestones) {
        const milestoneSql = `
          INSERT INTO project_milestones (project_id, name, description, status, deadline, budget, expected_output)
          VALUES ($1, $2, $3, 'pending', $4, $5, $6)
          RETURNING id
        `;
        const { rows: milestoneRows } = await client.query(milestoneSql, [
          project.id,
          milestone.name,
          milestone.description || null,
          milestone.deadline || null,
          milestone.budget || null,
          milestone.expectedOutput || null,
        ]);
        const milestoneId = milestoneRows[0].id;
        
        // Insert tasks for this milestone (if provided)
        if (milestone.tasks && milestone.tasks.length > 0) {
          for (const task of milestone.tasks) {
            await client.query(
              `INSERT INTO tasks (title, description, project_id, milestone_id, assigned_to, assigned_by, priority, status, due_date, expected_output)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)`,
              [
                task.title,
                task.description || null,
                project.id,
                milestoneId,
                task.assignedTo || null,
                managerId,
                task.priority || 'medium',
                task.dueDate || null,
                task.expectedOutput || null,
              ]
            );
          }
        }
      }
    }
    
    // Always add hardcoded "Final DPR Submission" milestone
    console.log(`[Project Creation] Adding hardcoded "Final DPR Submission" milestone for project ${project.id}`);
    const finalDprMilestoneSql = `
      INSERT INTO project_milestones (project_id, name, description, status, deadline, budget, expected_output)
      VALUES ($1, 'Final DPR Submission', 'Final DPR submission milestone for project completion', 'pending', $2, NULL, NULL)
      RETURNING id
    `;
    const { rows: finalDprRows } = await client.query(finalDprMilestoneSql, [
      project.id,
      projectData.dprDeadline || project.dpr_deadline || null, // Use DPR deadline as milestone deadline
    ]);
    console.log(`[Project Creation] Created Final DPR Submission milestone with ID: ${finalDprRows[0].id}`);
    
    await client.query('COMMIT');
    return project;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Add task to a milestone
const addTaskToMilestone = async (managerId, milestoneId, taskData) => {
  // Verify milestone belongs to a project created by this manager
  const verifySql = `
    SELECT pm.id, pm.project_id, p.created_by
    FROM project_milestones pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.id = $1
  `;
  const { rows: verifyRows } = await query(verifySql, [milestoneId]);
  
  if (!verifyRows[0] || verifyRows[0].created_by !== managerId) {
    throw new Error('Milestone not found or unauthorized');
  }
  
  const sql = `
    INSERT INTO tasks (title, description, project_id, milestone_id, assigned_to, assigned_by, priority, status, due_date, expected_output)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    taskData.title,
    taskData.description || null,
    verifyRows[0].project_id,
    milestoneId,
    taskData.assignedTo || null,
    managerId,
    taskData.priority || 'medium',
    taskData.dueDate || null,
    taskData.expectedOutput || null,
  ]);
  
  return rows[0];
};

// Get task submissions for review
const getTaskSubmissions = async (managerId) => {
  const sql = `
    SELECT 
      ts.id,
      ts.task_id,
      ts.milestone_id,
      ts.submitted_by,
      ts.submission_type,
      ts.cost,
      ts.status,
      ts.submitted_at,
      ts.reviewed_by,
      ts.reviewed_at,
      t.title as task_title,
      t.description as task_description,
      t.due_date as task_due_date,
      pm.name as milestone_name,
      p.name as project_name,
      p.id as project_id,
      u.name as submitted_by_name,
      u.email as submitted_by_email
    FROM task_submissions ts
    JOIN tasks t ON t.id = ts.task_id
    LEFT JOIN project_milestones pm ON pm.id = ts.milestone_id
    LEFT JOIN projects p ON p.id = t.project_id
    JOIN users u ON u.id = ts.submitted_by
    WHERE ts.status = 'pending-review'
      AND EXISTS (
        SELECT 1 FROM projects p2 
        WHERE p2.id = t.project_id 
          AND p2.created_by = $1
      )
    ORDER BY ts.submitted_at DESC
  `;
  const { rows: submissions } = await query(sql, [managerId]);
  
  // Get files for each submission
  for (const submission of submissions) {
    const filesSql = `
      SELECT 
        fd.id,
        fd.original_name,
        fd.mime_type,
        fd.file_size,
        fd.storage_path,
        tsf.file_type
      FROM task_submission_files tsf
      JOIN file_documents fd ON fd.id = tsf.file_document_id
      WHERE tsf.task_submission_id = $1
      ORDER BY tsf.uploaded_at ASC
    `;
    const { rows: files } = await query(filesSql, [submission.id]);
    submission.files = files || [];
  }
  
  return submissions;
};

// Review task submission (approve/reject)
const reviewTaskSubmission = async (managerId, submissionId, reviewData) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Verify submission belongs to a task in a project created by this manager
    const verifySql = `
      SELECT ts.id, ts.task_id, ts.status, t.project_id, p.created_by
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      JOIN projects p ON p.id = t.project_id
      WHERE ts.id = $1
    `;
    const { rows: verifyRows } = await client.query(verifySql, [submissionId]);
    
    if (!verifyRows[0] || verifyRows[0].created_by !== managerId) {
      throw new Error('Task submission not found or unauthorized');
    }
    
    if (verifyRows[0].status !== 'pending-review') {
      throw new Error('Submission has already been reviewed');
    }
    
    // Update submission
    const updateSql = `
      UPDATE task_submissions
      SET 
        status = $1,
        reviewed_by = $2,
        reviewed_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const { rows: updateRows } = await client.query(updateSql, [
      reviewData.status, // 'approved' or 'rejected'
      managerId,
      submissionId,
    ]);
    
    // Update task status based on review
    const newTaskStatus = reviewData.status === 'approved' ? 'completed' : 'in-progress';
    await client.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newTaskStatus, verifyRows[0].task_id]
    );
    
    // Get task assigned_to for KPI recalculation
    const { rows: taskRows } = await client.query(
      `SELECT assigned_to FROM tasks WHERE id = $1`,
      [verifyRows[0].task_id]
    );
    const employeeId = taskRows[0]?.assigned_to;

    // Note: We do NOT update task.cost when approving submission
    // task.cost should remain as the planned cost (B_i) set when task is created
    // submission.cost is the actual cost (C_i) set when employee submits
    // This allows us to calculate expenditure KPI correctly
    
    if (reviewData.status === 'approved') {
      // Update completed_at if task is being completed
      await client.query(
        `UPDATE tasks SET completed_at = NOW() WHERE id = $1 AND completed_at IS NULL`,
        [verifyRows[0].task_id]
      );
    }
    
    // Get submission and task cost for logging (before commit)
    let submissionCost = 'N/A';
    let taskCost = 'N/A';
    if (reviewData.status === 'approved') {
      const costSql = `SELECT cost FROM task_submissions WHERE id = $1`;
      const { rows: costRows } = await client.query(costSql, [submissionId]);
      submissionCost = costRows[0]?.cost || 'N/A';
      
      const taskCostSql = `SELECT cost FROM tasks WHERE id = $1`;
      const { rows: taskCostRows } = await client.query(taskCostSql, [verifyRows[0].task_id]);
      taskCost = taskCostRows[0]?.cost || 'N/A';
    }
    
    await client.query('COMMIT');
    
    // Recalculate employee KPI if approved (async, don't wait)
    if (reviewData.status === 'approved' && employeeId) {
      console.log(`[KPI Trigger] ========================================`);
      console.log(`[KPI Trigger] TASK SUBMISSION APPROVED - Triggering KPI Recalculation`);
      console.log(`[KPI Trigger] Employee ID: ${employeeId}`);
      console.log(`[KPI Trigger] Task ID: ${verifyRows[0].task_id}`);
      console.log(`[KPI Trigger] Submission ID: ${submissionId}`);
      console.log(`[KPI Trigger] Cost Information:`, {
        taskPlannedCost: taskCost,
        submissionActualCost: submissionCost,
        overspend: taskCost && submissionCost && taskCost !== 'N/A' && submissionCost !== 'N/A' && parseFloat(submissionCost) > parseFloat(taskCost) 
          ? ((parseFloat(submissionCost) / parseFloat(taskCost)) - 1).toFixed(2) 
          : 'N/A'
      });
      
      console.log(`[KPI Trigger] Calling computeFieldEmployeeKpis for employee ${employeeId}...`);
      const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');
      fieldEmployeeKpiService.computeFieldEmployeeKpis(
        employeeId,
        null,
        null,
        { persist: true }
      )
      .then(result => {
        console.log(`[KPI Trigger] ✅ Successfully recalculated KPI for employee ${employeeId}:`, {
          dprKpi: result.dprKpi?.toFixed(2),
          technicalComplianceKpi: result.technicalComplianceKpi?.toFixed(2),
          surveyKpi: result.surveyKpi?.toFixed(2),
          expenditureKpi: result.expenditureKpi?.toFixed(2),
          taskTimelinessKpi: result.taskTimelinessKpi?.toFixed(2),
          finalKpi: result.finalKpi?.toFixed(2),
          periodStart: result.periodStart,
          periodEnd: result.periodEnd
        });
        console.log(`[KPI Trigger] ========================================`);
      })
      .catch(err => {
        console.error(`[KPI Trigger] ❌ Error recalculating KPI for employee ${employeeId} after task completion:`, err);
        console.error(`[KPI Trigger] Error stack:`, err.stack);
        console.log(`[KPI Trigger] ========================================`);
      });
    } else {
      console.log(`[KPI Trigger] Skipping KPI recalculation:`, {
        status: reviewData.status,
        employeeId,
        reason: reviewData.status !== 'approved' ? 'Submission not approved' : 'No employee ID'
      });
    }
    
    return updateRows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getMyTeam,
  getMyProjects,
  createFieldProject,
  addTaskToMilestone,
  getTaskSubmissions,
  reviewTaskSubmission,
  createSurvey,
  getMySurveys,
  getActiveSurveys,
  getSurveyEmployees,
  createSurveyFieldVisit,
  getSurveySubmissions,
  reviewSurveySubmission,
  getActiveProjects,
  getProjectEmployees,
  getMyKPI,
  getTeamKPITable,
  getLeaderboard,
  getPendingApprovals,
  getOngoingActivities,
  getDashboardSummary,
  getMyFeedback,
  getMyLocations,
  saveLocation,
  deleteLocation,
};

