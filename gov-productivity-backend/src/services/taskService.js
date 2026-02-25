const { query } = require('../config/database');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const createTask = async (payload, managerId) => {
  // Ensure no ID is passed from frontend
  if (payload.id !== undefined) {
    delete payload.id;
  }

  const { getClient } = require('../config/database');
  const client = await getClient();

  const sql = `
    INSERT INTO tasks (
      title, description, project_id, milestone_id, assigned_to, assigned_by,
      priority, status, due_date, expected_output, cost
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10)
    RETURNING *
  `;
  
  try {
    await client.query('BEGIN');
    
    const { rows } = await client.query(sql, [
      payload.title,
      payload.description || null,
      payload.projectId || null,
      payload.milestoneId || null,
      payload.assignedTo,
      managerId,
      payload.priority || 'medium',
      payload.dueDate,
      payload.expectedOutput || null,
      payload.cost || null,
    ]);
    
    const taskId = rows[0].id;

    // Save task skills if provided
    if (payload.skillIds && Array.isArray(payload.skillIds) && payload.skillIds.length > 0) {
      console.log(`[Task Service] Saving ${payload.skillIds.length} skills for task ${taskId}:`, payload.skillIds);
      const skillValues = payload.skillIds.map((skillId, index) => 
        `($${index * 2 + 1}, $${index * 2 + 2})`
      ).join(', ');
      
      const skillParams = payload.skillIds.flatMap(skillId => [taskId, skillId]);
      const skillSql = `
        INSERT INTO task_skills (task_id, skill_id)
        VALUES ${skillValues}
        ON CONFLICT (task_id, skill_id) DO NOTHING
      `;
      const skillResult = await client.query(skillSql, skillParams);
      console.log(`[Task Service] Successfully saved skills for task ${taskId}. Rows affected:`, skillResult.rowCount);
    } else {
      console.log(`[Task Service] No skills provided for task ${taskId}. skillIds:`, payload.skillIds);
    }

    await client.query('COMMIT');
    
    await auditService.logAction(managerId, 'TASK_CREATED', 'tasks', taskId, payload);
    try {
      await notificationService.createNotification(payload.assignedTo, {
        type: 'TASK',
        title: 'New task assigned',
        body: payload.title,
        metadata: {
          taskId: taskId,
          projectId: payload.projectId,
          dueDate: payload.dueDate,
        },
      });
    } catch (err) {
      console.warn('Failed to dispatch task notification', err.message);
    }
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    // Handle duplicate key constraint - reset sequence if needed
    if (error.code === '23505' && error.constraint === 'tasks_pkey') {
      console.warn('Sequence out of sync, resetting tasks_id_seq');
      try {
        // Reset sequence to max(id) + 1
        await query(`
          SELECT setval('tasks_id_seq', COALESCE((SELECT MAX(id) FROM tasks), 0) + 1, false)
        `);
        // Retry the insert (without transaction for retry)
        const { rows } = await query(sql, [
          payload.title,
          payload.description || null,
          payload.projectId || null,
          payload.milestoneId || null,
          payload.assignedTo,
          managerId,
          payload.priority || 'medium',
          payload.dueDate,
          payload.expectedOutput || null,
          payload.cost || null,
        ]);
        
        await auditService.logAction(managerId, 'TASK_CREATED', 'tasks', rows[0].id, payload);
        try {
          await notificationService.createNotification(payload.assignedTo, {
            type: 'TASK',
            title: 'New task assigned',
            body: payload.title,
            metadata: {
              taskId: rows[0].id,
              projectId: payload.projectId,
              dueDate: payload.dueDate,
            },
          });
        } catch (err) {
          console.warn('Failed to dispatch task notification', err.message);
        }
        return rows[0];
      } catch (retryError) {
        throw retryError;
      }
    }
    throw error;
  } finally {
    client.release();
  }
};

const getMyTasks = async (userId) => {
  const { rows } = await query(
    `
      SELECT 
        t.*,
        p.name as project_name,
        (
          SELECT tf.comment 
          FROM task_feedbacks tf 
          WHERE tf.task_id = t.id 
          ORDER BY tf.created_at DESC 
          LIMIT 1
        ) as latest_feedback
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.assigned_to = $1
      ORDER BY t.due_date ASC
    `,
    [userId],
  );
  return rows;
};

const updateTaskStatus = async (taskId, status, actorId, completedAt, feedbackData) => {
  // Get current task
  const { rows: currentTaskRows } = await query(
    `SELECT * FROM tasks WHERE id = $1`,
    [taskId]
  );
  if (!currentTaskRows.length) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  const currentTask = currentTaskRows[0];

  // If rejecting, increment draft number and reassign
  if (status === 'rejected') {
    const newDraftNumber = (currentTask.draft_number || 1) + 1;
    const sql = `
      UPDATE tasks
      SET status = 'pending',
          draft_number = $2,
          completed_at = NULL
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await query(sql, [taskId, newDraftNumber]);
    
    // Add task feedback if provided
    if (feedbackData && feedbackData.rating && feedbackData.comment) {
      const feedbackService = require('./feedbackService');
      await feedbackService.addFeedback(
        taskId,
        actorId,
        currentTask.assigned_to,
        {
          rating: feedbackData.rating,
          comment: feedbackData.comment,
        }
      );
    }

    await auditService.logAction(actorId, 'TASK_REJECTED', 'tasks', taskId, {
      status: 'rejected',
      draftNumber: newDraftNumber,
    });

    // Update work_files reviewed_at when manager rejects
    const { rows: workFileRows } = await query(
      `UPDATE work_files 
       SET reviewed_by = $1, reviewed_at = NOW()
       WHERE task_id = $2 AND reviewed_at IS NULL
       RETURNING employee_id`,
      [actorId, taskId]
    );
    
    // Trigger KPI recalculation for HQ employees when task is rejected
    if (workFileRows.length > 0) {
      for (const workFile of workFileRows) {
        const { rows: userRows } = await query(
          `SELECT role FROM users WHERE id = $1`,
          [workFile.employee_id]
        );
        
        if (userRows.length > 0 && userRows[0].role === 'EMPLOYEE') {
          console.log(`[KPI Trigger] Task rejected - Recalculating KPI for HQ employee ${workFile.employee_id}`);
          const kpiService = require('./kpiService');
          kpiService.computeEmployeeKpis(workFile.employee_id, null, null, { persist: true })
            .then(result => {
              console.log(`[KPI Trigger] Task rejection - Successfully recalculated KPI for employee ${workFile.employee_id}:`, {
                fileDisposalRate: result.fileDisposalRate,
                responsiveness: result.responsiveness,
                tatScore: result.tatScore,
                qualityOfDrafting: result.qualityOfDrafting,
                digitalAdoption: result.digitalAdoption,
                finalKpi: result.finalKpi
              });
            })
            .catch(err => {
              console.error(`[KPI Trigger] Task rejection - Error recalculating KPI for employee ${workFile.employee_id}:`, err.message);
            });
        }
      }
    }

    // Notify employee
    try {
      await notificationService.createNotification(currentTask.assigned_to, {
        type: 'TASK',
        title: 'Task requires revision',
        body: `${currentTask.title} - Draft ${newDraftNumber}`,
        metadata: {
          taskId,
          status: 'pending',
          draftNumber: newDraftNumber,
        },
      });
    } catch (err) {
      console.warn('Failed to dispatch task rejection notification', err.message);
    }

    return rows[0];
  }

  // For other status updates
  const sql = `
    UPDATE tasks
    SET status = $2,
        completed_at = COALESCE($3, completed_at)
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await query(sql, [taskId, status, completedAt || null]);
  
  const updatedTask = rows[0];
  
  // When manager approves or rejects, update work_files reviewed_at
  if ((status === 'completed' || status === 'rejected') && actorId === updatedTask.assigned_by) {
    const { rows: workFileRows } = await query(
      `UPDATE work_files 
       SET reviewed_by = $1, reviewed_at = NOW()
       WHERE task_id = $2 AND reviewed_at IS NULL
       RETURNING employee_id`,
      [actorId, taskId]
    );
    
    // Trigger KPI recalculation for HQ employees when task is reviewed
    if (workFileRows.length > 0) {
      for (const workFile of workFileRows) {
        const { rows: userRows } = await query(
          `SELECT role FROM users WHERE id = $1`,
          [workFile.employee_id]
        );
        
        if (userRows.length > 0 && userRows[0].role === 'EMPLOYEE') {
          console.log(`[KPI Trigger] Task reviewed (${status}) - Recalculating KPI for HQ employee ${workFile.employee_id}`);
          const kpiService = require('./kpiService');
          kpiService.computeEmployeeKpis(workFile.employee_id, null, null, { persist: true })
            .then(result => {
              console.log(`[KPI Trigger] Task review - Successfully recalculated KPI for employee ${workFile.employee_id}:`, {
                fileDisposalRate: result.fileDisposalRate,
                responsiveness: result.responsiveness,
                tatScore: result.tatScore,
                qualityOfDrafting: result.qualityOfDrafting,
                digitalAdoption: result.digitalAdoption,
                finalKpi: result.finalKpi
              });
            })
            .catch(err => {
              console.error(`[KPI Trigger] Task review - Error recalculating KPI for employee ${workFile.employee_id}:`, err.message);
            });
        }
      }
    }
  }
  
  await auditService.logAction(actorId, 'TASK_STATUS_UPDATED', 'tasks', taskId, {
    status,
  });
  const notifyUserId = actorId === updatedTask.assigned_to ? updatedTask.assigned_by : updatedTask.assigned_to;
  if (notifyUserId) {
    try {
      await notificationService.createNotification(notifyUserId, {
        type: 'TASK',
        title: `Task status updated to ${status}`,
        body: updatedTask.title,
        metadata: {
          taskId,
          status,
          completedAt: updatedTask.completed_at,
        },
      });
    } catch (err) {
      console.warn('Failed to dispatch task status notification', err.message);
    }
  }
  return rows[0];
};

const getTeamTasks = async (managerId, status) => {
  // Get manager's department
  const { rows: managerRow } = await query(
    `SELECT department FROM users WHERE id = $1 AND role = 'MANAGER'`,
    [managerId]
  );
  
  let rows;
  if (managerRow[0] && managerRow[0].department) {
    // Department-based filtering
    const result = await query(
      `
        SELECT ta.*
        FROM tasks ta
        JOIN users u ON u.id = ta.assigned_to
        WHERE u.department = $1 
          AND u.role = 'EMPLOYEE'
          AND ($2::text IS NULL OR ta.status = $2)
        ORDER BY ta.created_at DESC
      `,
      [managerRow[0].department, status || null],
    );
    rows = result.rows;
  } else {
    // Fallback to team-based filtering
    const result = await query(
      `
        SELECT ta.*
        FROM tasks ta
        JOIN team_members tm ON tm.user_id = ta.assigned_to
        JOIN teams t ON t.id = tm.team_id
        WHERE t.manager_id = $1
          AND ($2::text IS NULL OR ta.status = $2)
        ORDER BY ta.created_at DESC
      `,
      [managerId, status || null],
    );
    rows = result.rows;
  }
  return rows;
};

const getStatusBreakdown = async (managerId) => {
  // Get manager's department
  const { rows: managerRow } = await query(
    `SELECT department FROM users WHERE id = $1 AND role = 'MANAGER'`,
    [managerId]
  );
  
  let rows;
  if (managerRow[0] && managerRow[0].department) {
    // Department-based filtering
    const result = await query(
      `
        SELECT ta.status, COUNT(*)::int AS count
        FROM tasks ta
        JOIN users u ON u.id = ta.assigned_to
        WHERE u.department = $1 
          AND u.role = 'EMPLOYEE'
        GROUP BY ta.status
      `,
      [managerRow[0].department],
    );
    rows = result.rows;
  } else {
    // Fallback to team-based filtering
    const result = await query(
      `
        SELECT ta.status, COUNT(*)::int AS count
        FROM tasks ta
        JOIN team_members tm ON tm.user_id = ta.assigned_to
        JOIN teams t ON t.id = tm.team_id
        WHERE t.manager_id = $1
        GROUP BY ta.status
      `,
      [managerId],
    );
    rows = result.rows;
  }
  return rows;
};

const getPendingApprovals = async (managerId) => {
  // Get manager's department
  const { rows: managerRow } = await query(
    `SELECT department FROM users WHERE id = $1 AND role = 'MANAGER'`,
    [managerId]
  );
  
  let rows;
  if (managerRow[0] && managerRow[0].department) {
    // Department-based filtering
    const result = await query(
      `
        SELECT
          ta.*,
          COALESCE(ta.draft_number, 1) AS draft_number,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', fd.id,
              'originalName', fd.original_name,
              'storagePath', fd.storage_path,
              'uploadedBy', fd.uploaded_by,
              'uploadedAt', fd.created_at
            )
          ) FILTER (WHERE fd.id IS NOT NULL) AS documents
        FROM tasks ta
        JOIN users u ON u.id = ta.assigned_to
        LEFT JOIN work_files wf ON wf.task_id = ta.id
        LEFT JOIN file_documents fd ON fd.work_file_id = wf.id
        WHERE u.department = $1 
          AND ta.status = 'awaiting-review'
          AND u.role = 'EMPLOYEE'
        GROUP BY ta.id
        ORDER BY ta.updated_at DESC
      `,
      [managerRow[0].department],
    );
    rows = result.rows;
  } else {
    // Fallback to assigned_by (for backward compatibility)
    const result = await query(
      `
        SELECT
          ta.*,
          COALESCE(ta.draft_number, 1) AS draft_number,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', fd.id,
              'originalName', fd.original_name,
              'storagePath', fd.storage_path,
              'uploadedBy', fd.uploaded_by,
              'uploadedAt', fd.created_at
            )
          ) FILTER (WHERE fd.id IS NOT NULL) AS documents
        FROM tasks ta
        LEFT JOIN work_files wf ON wf.task_id = ta.id
        LEFT JOIN file_documents fd ON fd.work_file_id = wf.id
        WHERE ta.assigned_by = $1 AND ta.status = 'awaiting-review'
        GROUP BY ta.id
        ORDER BY ta.updated_at DESC
      `,
      [managerId],
    );
    rows = result.rows;
  }
  return rows;
};

const getTrends = async (managerId) => {
  // Get manager's department
  const { rows: managerRow } = await query(
    `SELECT department FROM users WHERE id = $1 AND role = 'MANAGER'`,
    [managerId]
  );
  
  let rows;
  if (managerRow[0] && managerRow[0].department) {
    // Department-based filtering
    const result = await query(
      `
        SELECT DATE_TRUNC('month', ta.created_at) AS month,
               SUM(CASE WHEN ta.status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
               SUM(CASE WHEN ta.status = 'delayed' THEN 1 ELSE 0 END)::int AS delayed
        FROM tasks ta
        JOIN users u ON u.id = ta.assigned_to
        WHERE u.department = $1 
          AND u.role = 'EMPLOYEE'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `,
      [managerRow[0].department],
    );
    rows = result.rows;
  } else {
    // Fallback to team-based filtering
    const result = await query(
      `
        SELECT DATE_TRUNC('month', ta.created_at) AS month,
               SUM(CASE WHEN ta.status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
               SUM(CASE WHEN ta.status = 'delayed' THEN 1 ELSE 0 END)::int AS delayed
        FROM tasks ta
        JOIN team_members tm ON tm.user_id = ta.assigned_to
        JOIN teams t ON t.id = tm.team_id
        WHERE t.manager_id = $1
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `,
      [managerId],
    );
    rows = result.rows;
  }
  return rows;
};

module.exports = {
  createTask,
  getMyTasks,
  updateTaskStatus,
  getTeamTasks,
  getPendingApprovals,
  getStatusBreakdown,
  getTrends,
};

