const { query } = require('../config/database');
const auditService = require('./auditService');
const milestoneService = require('./milestoneService');

const createProject = async (payload, managerId, userRole = null) => {
  // Ensure no ID is passed from frontend
  if (payload.id !== undefined) {
    delete payload.id;
  }

  // Handle budget - convert to string if provided, ensure it's not empty
  // Budget comes from "Total Cost" field in frontend
  let budgetValue = null;
  if (payload.budget !== undefined && payload.budget !== null && payload.budget !== '') {
    const budgetStr = String(payload.budget).trim();
    budgetValue = budgetStr !== '' ? budgetStr : null;
  }
  
  // Log to verify budget is being received
  console.log('Budget processing:', {
    received: payload.budget,
    receivedType: typeof payload.budget,
    processed: budgetValue,
    processedType: typeof budgetValue
  });
  
  const dprDeadlineValue = payload.dprDeadline !== undefined && payload.dprDeadline !== null && payload.dprDeadline !== ''
    ? payload.dprDeadline
    : null;

  // Determine project_type: if user is FIELD_MANAGER or payload has project_type='field', set to 'field'
  const projectType = (userRole === 'FIELD_MANAGER' || payload.project_type === 'field') ? 'field' : 'hq';

  // Debug logging
  console.log('Creating project with data:', {
    name: payload.name,
    budget: payload.budget,
    budgetValue: budgetValue,
    dprDeadline: dprDeadlineValue,
    projectType: projectType,
    milestonesCount: payload.milestones ? payload.milestones.length : 0,
    milestones: payload.milestones
  });

  const sql = `
    INSERT INTO projects (
      name, description, status, start_date, due_date, created_by, budget, dpr_deadline, project_type
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;

  try {
    const { rows } = await query(sql, [
      payload.name,
      payload.description || null,
      payload.status || 'active',
      payload.startDate || null,
      payload.dueDate || null,
      managerId,
      budgetValue,
      dprDeadlineValue,
      projectType,
    ]);

    const projectId = rows[0].id;

    // Add selected team members to the project
    if (payload.memberIds && Array.isArray(payload.memberIds) && payload.memberIds.length > 0) {
      // Insert members one by one to avoid SQL injection and ensure proper parameterization
      for (const memberId of payload.memberIds) {
        await query(
          `INSERT INTO project_members (project_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [projectId, memberId]
        );
      }
    }

    // Create milestones if provided
    if (payload.milestones && Array.isArray(payload.milestones) && payload.milestones.length > 0) {
      console.log(`Creating ${payload.milestones.length} milestones for project ${projectId}`);
      for (const milestone of payload.milestones) {
        try {
          console.log('Creating milestone:', { projectId, milestoneName: milestone.name, deadline: milestone.deadline });
          const createdMilestone = await milestoneService.createMilestone(projectId, milestone, managerId);
          console.log('Milestone created successfully:', { id: createdMilestone.id, name: createdMilestone.name });
        } catch (milestoneError) {
          console.error('Error creating milestone:', milestoneError);
          // Continue with other milestones even if one fails
        }
      }
    } else {
      console.log('No milestones provided for project creation');
    }

    // Always add hardcoded "Final DPR Submission" milestone for field projects
    if (projectType === 'field') {
      console.log(`[Project Creation] Adding hardcoded "Final DPR Submission" milestone for field project ${projectId}`);
      try {
        const finalDprMilestone = await milestoneService.createMilestone(projectId, {
          name: 'Final DPR Submission',
          description: 'Final DPR submission milestone for project completion',
          deadline: dprDeadlineValue,
          budget: null, // No budget for this milestone
          expectedOutput: null,
        }, managerId);
        console.log(`[Project Creation] Created Final DPR Submission milestone with ID: ${finalDprMilestone.id}`);
      } catch (dprMilestoneError) {
        console.error('[Project Creation] Error creating Final DPR Submission milestone:', dprMilestoneError);
        // Don't fail project creation if this milestone fails
      }
    }

    await auditService.logAction(managerId, 'PROJECT_CREATED', 'projects', projectId, payload);
    
    // Verify the project was saved with budget by querying it back
    const { rows: verifyRows } = await query('SELECT id, name, budget, project_type FROM projects WHERE id = $1', [projectId]);
    const savedProject = verifyRows[0];
    
    // Verify milestones were saved
    const { rows: milestoneRows } = await query('SELECT COUNT(*) as count FROM project_milestones WHERE project_id = $1', [projectId]);
    const milestoneCount = milestoneRows[0]?.count || 0;
    
    // Debug: Log created project to verify budget was saved
    console.log('Project created and verified:', {
      id: savedProject.id,
      name: savedProject.name,
      budget: savedProject.budget,
      budgetType: typeof savedProject.budget,
      project_type: savedProject.project_type,
      milestonesCount: milestoneCount,
      milestonesInPayload: payload.milestones ? payload.milestones.length : 0
    });
    
    // Return the verified project data with budget
    // Ensure we return the project with the budget that was actually saved
    const returnProject = { ...rows[0] };
    returnProject.budget = savedProject.budget; // Use verified budget from database
    return returnProject;
  } catch (error) {
    // Handle duplicate key constraint - reset sequence if needed
    if (error.code === '23505' && error.constraint === 'projects_pkey') {
      console.warn('Sequence out of sync, resetting projects_id_seq');
      try {
        // Reset sequence to max(id) + 1
        await query(`
          SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 0) + 1, false)
        `);
        // Retry the insert with ALL fields including budget, dpr_deadline, project_type
        const { rows } = await query(sql, [
          payload.name,
          payload.description || null,
          payload.status || 'active',
          payload.startDate || null,
          payload.dueDate || null,
          managerId,
          budgetValue,
          dprDeadlineValue,
          projectType,
        ]);

        const projectId = rows[0].id;

        // Add selected team members to the project
        if (payload.memberIds && Array.isArray(payload.memberIds) && payload.memberIds.length > 0) {
          // Insert members one by one to avoid SQL injection and ensure proper parameterization
          for (const memberId of payload.memberIds) {
            await query(
              `INSERT INTO project_members (project_id, user_id)
               VALUES ($1, $2)
               ON CONFLICT (project_id, user_id) DO NOTHING`,
              [projectId, memberId]
            );
          }
        }

        // Create milestones if provided (in retry logic)
        if (payload.milestones && Array.isArray(payload.milestones) && payload.milestones.length > 0) {
          console.log(`[RETRY] Creating ${payload.milestones.length} milestones for project ${projectId}`);
          for (const milestone of payload.milestones) {
            try {
              await milestoneService.createMilestone(projectId, milestone, managerId);
            } catch (milestoneError) {
              console.error('[RETRY] Error creating milestone:', milestoneError);
              // Continue with other milestones
            }
          }
        }

        // Always add hardcoded "Final DPR Submission" milestone for field projects (in retry logic)
        if (projectType === 'field') {
          console.log(`[RETRY] Adding hardcoded "Final DPR Submission" milestone for field project ${projectId}`);
          try {
            await milestoneService.createMilestone(projectId, {
              name: 'Final DPR Submission',
              description: 'Final DPR submission milestone for project completion',
              deadline: dprDeadlineValue,
              budget: null,
              expectedOutput: null,
            }, managerId);
          } catch (dprMilestoneError) {
            console.error('[RETRY] Error creating Final DPR Submission milestone:', dprMilestoneError);
          }
        }

        await auditService.logAction(managerId, 'PROJECT_CREATED', 'projects', projectId, payload);
        return rows[0];
      } catch (retryError) {
        throw retryError;
      }
    }
    throw error;
  }
};

const listProjects = async (userId, userRole, includeDetails = false) => {
  let whereClause = '';
  let queryParams = [];

  // Filter projects based on user role
  if (userRole === 'EMPLOYEE' || userRole === 'FIELD_EMPLOYEE') {
    // Employees only see projects they are assigned to
    whereClause = `
      WHERE EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = $1
      )
    `;
    queryParams = [userId];
  } else if (userRole === 'MANAGER') {
    // HQ Managers see projects they created OR projects where their team members are assigned
    whereClause = `
      WHERE p.created_by = $1
         OR EXISTS (
           SELECT 1 FROM project_members pm
           JOIN users u ON u.id = pm.user_id
           WHERE pm.project_id = p.id
             AND u.department = (SELECT department FROM users WHERE id = $1)
             AND u.role = 'EMPLOYEE'
         )
    `;
    queryParams = [userId];
  } else if (userRole === 'FIELD_MANAGER') {
    // Field Managers see projects they created OR projects where their field employees are assigned
    whereClause = `
      WHERE p.created_by = $1
         OR EXISTS (
           SELECT 1 FROM project_members pm
           JOIN users u ON u.id = pm.user_id
           WHERE pm.project_id = p.id
             AND u.department = (SELECT department FROM users WHERE id = $1)
             AND u.role = 'FIELD_EMPLOYEE'
         )
    `;
    queryParams = [userId];
  }
  // ADMIN sees all projects (no where clause)

  const { rows } = await query(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.start_date,
        p.due_date,
        p.created_by,
        p.created_at,
        p.budget,
        p.dpr_deadline,
        p.project_type,
        COUNT(DISTINCT t.id)::int AS total_tasks,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_tasks,
        CASE
          WHEN COUNT(DISTINCT t.id) = 0 THEN 0
          ELSE ROUND(100 * SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(DISTINCT t.id), 2)
        END AS progress_percent
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name, p.description, p.status, p.start_date, p.due_date, p.created_by, p.created_at, p.budget, p.dpr_deadline, p.project_type
      ORDER BY p.created_at DESC
    `,
    queryParams,
  );

  // If includeDetails is true, fetch milestones and tasks for each project
  if (includeDetails) {
    for (const project of rows) {
      // Ensure budget is always present (even if null)
      if (project.budget === undefined) {
        project.budget = null;
      }
      
      // Get milestones
      const milestones = await milestoneService.getMilestonesByProject(project.id);
      console.log(`Project ${project.id} (${project.name}): Found ${milestones ? milestones.length : 0} milestones, budget: ${project.budget}`);

      // For employees, only show tasks assigned to them. For managers/admins, show all tasks.
      const isEmployee = userRole === 'EMPLOYEE' || userRole === 'FIELD_EMPLOYEE';

      // Get tasks for each milestone
      for (const milestone of milestones) {
        let taskRows;
        if (isEmployee) {
          // Employees only see their own tasks
          const { rows } = await query(
            `
              SELECT 
                t.*,
                u.name as assigned_to_name,
                u.email as assigned_to_email,
                COUNT(ts.id)::int as submission_count
              FROM tasks t
              LEFT JOIN users u ON u.id = t.assigned_to
              LEFT JOIN task_submissions ts ON ts.task_id = t.id
              WHERE t.milestone_id = $1 AND t.assigned_to = $2
              GROUP BY t.id, u.name, u.email
              ORDER BY t.created_at DESC
            `,
            [milestone.id, userId]
          );
          taskRows = rows;
        } else {
          // Managers see all tasks
          const { rows } = await query(
            `
              SELECT 
                t.*,
                u.name as assigned_to_name,
                u.email as assigned_to_email,
                COUNT(ts.id)::int as submission_count
              FROM tasks t
              LEFT JOIN users u ON u.id = t.assigned_to
              LEFT JOIN task_submissions ts ON ts.task_id = t.id
              WHERE t.milestone_id = $1
              GROUP BY t.id, u.name, u.email
              ORDER BY t.created_at DESC
            `,
            [milestone.id]
          );
          taskRows = rows;
        }
        milestone.tasks = taskRows;

        // Get submissions for each task
        for (const task of taskRows) {
          const { rows: submissionRows } = await query(
            `
              SELECT 
                ts.*,
                fd.original_name,
                fd.mime_type,
                fd.file_size,
                fd.storage_path
              FROM task_submissions ts
              JOIN file_documents fd ON fd.id = ts.file_document_id
              WHERE ts.task_id = $1
              ORDER BY ts.submitted_at DESC
            `,
            [task.id]
          );
          task.submissions = submissionRows;
        }
      }

      // Ensure milestones array is always present
      project.milestones = Array.isArray(milestones) ? milestones : [];

      // Get project members
      const { rows: memberRows } = await query(
        `
          SELECT 
            pm.user_id,
            u.name,
            u.email,
            u.designation,
            u.role
          FROM project_members pm
          JOIN users u ON u.id = pm.user_id
          WHERE pm.project_id = $1
          ORDER BY u.name ASC
        `,
        [project.id]
      );
      project.members = memberRows;

      // Also get tasks not assigned to any milestone
      let projectTaskRows;
      if (isEmployee) {
        const { rows } = await query(
          `
            SELECT 
              t.*,
              u.name as assigned_to_name,
              u.email as assigned_to_email,
              COUNT(ts.id)::int as submission_count
            FROM tasks t
            LEFT JOIN users u ON u.id = t.assigned_to
            LEFT JOIN task_submissions ts ON ts.task_id = t.id
            WHERE t.project_id = $1 AND t.milestone_id IS NULL AND t.assigned_to = $2
            GROUP BY t.id, u.name, u.email
            ORDER BY t.created_at DESC
          `,
          [project.id, userId]
        );
        projectTaskRows = rows;
      } else {
        const { rows } = await query(
          `
            SELECT 
              t.*,
              u.name as assigned_to_name,
              u.email as assigned_to_email,
              COUNT(ts.id)::int as submission_count
            FROM tasks t
            LEFT JOIN users u ON u.id = t.assigned_to
            LEFT JOIN task_submissions ts ON ts.task_id = t.id
            WHERE t.project_id = $1 AND t.milestone_id IS NULL
            GROUP BY t.id, u.name, u.email
            ORDER BY t.created_at DESC
          `,
          [project.id]
        );
        projectTaskRows = rows;
      }
      project.tasks = projectTaskRows;
    }
  } else {
    // Even without includeDetails, ensure budget and arrays are present
    for (const project of rows) {
      if (project.budget === undefined) {
        project.budget = null;
      }
      // Initialize empty arrays for consistency
      if (!project.milestones) {
        project.milestones = [];
      }
      if (!project.members) {
        project.members = [];
      }
    }
  }

  return rows;
};

const updateProject = async (projectId, payload, actorId, actorRole) => {
  // First, check if project exists and user has permission to update it
  const { rows: projectRows } = await query(
    `SELECT created_by FROM projects WHERE id = $1`,
    [projectId]
  );

  if (!projectRows.length) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const project = projectRows[0];

  // Check authorization: Only ADMIN, project creator, or manager of team members in the project can update
  let hasPermission = false;

  if (actorRole === 'ADMIN') {
    hasPermission = true;
  } else if (project.created_by === actorId) {
    hasPermission = true;
  } else if (actorRole === 'MANAGER' || actorRole === 'FIELD_MANAGER') {
    // Manager can update if any of their team members are in the project
    const expectedEmployeeRole = actorRole === 'MANAGER' ? 'EMPLOYEE' : 'FIELD_EMPLOYEE';
    const { rows: memberRows } = await query(
      `
      SELECT 1 FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
        AND u.department = (SELECT department FROM users WHERE id = $2)
        AND u.role = $3
      LIMIT 1
      `,
      [projectId, actorId, expectedEmployeeRole]
    );
    hasPermission = memberRows.length > 0;
  }

  if (!hasPermission) {
    const error = new Error('Insufficient permissions to update this project');
    error.statusCode = 403;
    throw error;
  }

  // Update the project
  const sql = `
    UPDATE projects
    SET status = COALESCE($2, status),
        description = COALESCE($3, description)
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await query(sql, [projectId, payload.status || null, payload.description || null]);

  await auditService.logAction(actorId, 'PROJECT_UPDATED', 'projects', projectId, payload);
  return rows[0];
};

module.exports = {
  createProject,
  listProjects,
  updateProject,
};

