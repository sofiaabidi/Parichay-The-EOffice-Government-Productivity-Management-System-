const path = require('path');
const fs = require('fs');
const { query, getClient } = require('../config/database');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const ensureUploadDir = () => {
  const dir = process.env.UPLOAD_DIR || 'uploads';
  const absolute = path.join(process.cwd(), dir);
  if (!fs.existsSync(absolute)) {
    fs.mkdirSync(absolute, { recursive: true });
  }
  return absolute;
};

// Note: Files are already saved by multer, we just need to use the path
// Multer's diskStorage saves files and provides req.file.path

// Create file document record
const createFileDocument = async (fileMeta, uploadedBy) => {
  const sql = `
    INSERT INTO file_documents (
      uploaded_by, original_name, mime_type, file_size, storage_path
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const { rows } = await query(sql, [
    uploadedBy,
    fileMeta.originalName,
    fileMeta.mimeType || 'application/octet-stream',
    fileMeta.size,
    fileMeta.filepath,
  ]);
  
  return rows[0];
};

// Determine submission type from mime type
const getSubmissionType = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType === 'application/pdf' || mimeType.includes('document') || mimeType.includes('spreadsheet')) {
    return 'document';
  }
  return 'file';
};

// Create task submission
const createTaskSubmission = async (taskId, milestoneId, submittedBy, files, cost, notes) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Files are already saved by multer, create file_documents records
    const fileDocuments = [];
    for (const file of files) {
      // File is already saved by multer, use its path
      const fileDoc = await createFileDocument({
        originalName: file.originalname,
        filepath: file.path,
        mimeType: file.mimetype,
        size: file.size,
      }, submittedBy);
      fileDocuments.push(fileDoc);
    }
    
    // Create task submissions for each file
    const submissions = [];
    for (const fileDoc of fileDocuments) {
      const submissionType = getSubmissionType(fileDoc.mime_type);
      
      const sql = `
        INSERT INTO task_submissions (
          task_id, milestone_id, submitted_by, submission_type,
          file_document_id, cost, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const { rows } = await query(sql, [
        taskId,
        milestoneId || null,
        submittedBy,
        submissionType,
        fileDoc.id,
        cost || null,
        'submitted',
        notes || null,
      ]);
      
      submissions.push(rows[0]);
    }
    
    // Update task status to awaiting-review
    await query(
      `UPDATE tasks SET status = 'awaiting-review', updated_at = NOW() WHERE id = $1`,
      [taskId]
    );
    
    // Get task details for notification
    const { rows: taskRows } = await query(
      `SELECT assigned_by, title FROM tasks WHERE id = $1`,
      [taskId]
    );
    const task = taskRows[0];
    
    // Notify manager
    if (task?.assigned_by) {
      try {
        await notificationService.createNotification(task.assigned_by, {
          type: 'TASK',
          title: 'Task submission received',
          body: `${task.title} - Files submitted for review`,
          metadata: {
            taskId,
            milestoneId,
            submissionCount: submissions.length,
          },
        });
      } catch (err) {
        console.warn('Failed to dispatch submission notification', err.message);
      }
    }
    
    await auditService.logAction(submittedBy, 'TASK_SUBMISSION_CREATED', 'task_submissions', taskId, {
      milestoneId,
      fileCount: files.length,
      cost,
    });
    
    // Get task details for KPI recalculation
    const { rows: taskDetailRows } = await query(
      `SELECT assigned_to, cost as task_cost FROM tasks WHERE id = $1`,
      [taskId]
    );
    const employeeId = submittedBy; // Use submittedBy (the person who submitted) for KPI calculation
    const taskCost = taskDetailRows[0]?.task_cost || 'N/A';
    
    await client.query('COMMIT');
    
    // Fetch complete submission data with file info
    const submissionIds = submissions.map(s => s.id);
    const { rows: completeSubmissions } = await query(
      `
        SELECT 
          ts.*,
          fd.original_name,
          fd.mime_type,
          fd.file_size,
          fd.storage_path,
          fd.created_at as file_uploaded_at
        FROM task_submissions ts
        JOIN file_documents fd ON fd.id = ts.file_document_id
        WHERE ts.id = ANY($1::int[])
        ORDER BY ts.submitted_at DESC
      `,
      [submissionIds]
    );
    
    // Recalculate employee KPI when task is submitted (async, don't wait)
    // This ensures expenditure KPI updates immediately when employee submits
    // Recalculate on ANY task submission, even if awaiting review (as per requirements)
    // The calculation itself will filter out submissions without costs
    if (employeeId) {
      console.log(`[KPI Trigger] ========================================`);
      console.log(`[KPI Trigger] TASK SUBMISSION CREATED - Triggering KPI Recalculation`);
      console.log(`[KPI Trigger] Employee ID: ${employeeId}`);
      console.log(`[KPI Trigger] Task ID: ${taskId}`);
      console.log(`[KPI Trigger] Submission IDs: ${submissionIds.join(', ')}`);
      console.log(`[KPI Trigger] Cost Information:`, {
        taskPlannedCost: taskCost,
        submissionActualCost: cost || 'Not provided',
        hasCost: !!cost
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
        console.log(`[KPI Trigger] ✅ Successfully recalculated KPI for employee ${employeeId} after task submission:`, {
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
        console.error(`[KPI Trigger] ❌ Error recalculating KPI for employee ${employeeId} after task submission:`, err);
        console.error(`[KPI Trigger] Error stack:`, err.stack);
        console.log(`[KPI Trigger] ========================================`);
      });
    } else {
      console.log(`[KPI Trigger] Skipping KPI recalculation on submission: No employee ID found`);
    }
    
    return completeSubmissions;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get submissions for a task
const getTaskSubmissions = async (taskId, userId, userRole) => {
  // Check if user has access to this task
  const { rows: taskRows } = await query(
    `
      SELECT t.assigned_to, t.assigned_by, t.project_id
      FROM tasks t
      WHERE t.id = $1
    `,
    [taskId]
  );
  
  if (!taskRows.length) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  
  const task = taskRows[0];
  
  // Check permissions
  // Get project info to check if user is project creator (for FIELD_MANAGER)
  const { rows: projectRows } = await query(
    `SELECT created_by FROM projects WHERE id = $1`,
    [task.project_id]
  );
  const projectCreatedBy = projectRows[0]?.created_by;
  
  const hasAccess = 
    task.assigned_to === userId ||
    task.assigned_by === userId ||
    userRole === 'ADMIN' ||
    (userRole === 'MANAGER' && task.assigned_by === userId) ||
    (userRole === 'FIELD_MANAGER' && projectCreatedBy === userId) ||
    (userRole === 'FIELD_EMPLOYEE' && task.assigned_to === userId);
  
  if (!hasAccess) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }
  
  const { rows } = await query(
    `
      SELECT 
        ts.*,
        fd.original_name,
        fd.mime_type,
        fd.file_size,
        fd.storage_path,
        fd.created_at as file_uploaded_at,
        u.name as submitted_by_name
      FROM task_submissions ts
      JOIN file_documents fd ON fd.id = ts.file_document_id
      JOIN users u ON u.id = ts.submitted_by
      WHERE ts.task_id = $1
      ORDER BY ts.submitted_at DESC
    `,
    [taskId]
  );
  
  return rows;
};

// Get submissions for a milestone
const getMilestoneSubmissions = async (milestoneId, userId, userRole) => {
  // Check if user has access to this milestone's project
  const { rows: projectRows } = await query(
    `
      SELECT pm.project_id, p.created_by
      FROM project_milestones pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.id = $1
    `,
    [milestoneId]
  );
  
  if (!projectRows.length) {
    const error = new Error('Milestone not found');
    error.statusCode = 404;
    throw error;
  }
  
  const project = projectRows[0];
  
  // Check if user is project member or manager
  const { rows: memberRows } = await query(
    `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [project.project_id, userId]
  );
  
  const hasAccess = 
    project.created_by === userId ||
    memberRows.length > 0 ||
    userRole === 'ADMIN' ||
    userRole === 'FIELD_MANAGER' ||
    userRole === 'MANAGER';
  
  if (!hasAccess) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }
  
  const { rows } = await query(
    `
      SELECT 
        ts.*,
        fd.original_name,
        fd.mime_type,
        fd.file_size,
        fd.storage_path,
        fd.created_at as file_uploaded_at,
        u.name as submitted_by_name,
        t.title as task_title
      FROM task_submissions ts
      JOIN file_documents fd ON fd.id = ts.file_document_id
      JOIN users u ON u.id = ts.submitted_by
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.milestone_id = $1
      ORDER BY ts.submitted_at DESC
    `,
    [milestoneId]
  );
  
  return rows;
};

// Update submission status (approve/reject)
const updateSubmissionStatus = async (submissionId, status, reviewedBy, remarks) => {
  const sql = `
    UPDATE task_submissions
    SET status = $2,
        reviewed_by = $3,
        reviewed_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  
  const { rows } = await query(sql, [submissionId, status, reviewedBy]);
  
  if (!rows.length) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }
  
  const submission = rows[0];
  
  // Get task details for KPI recalculation
  const { rows: taskRows } = await query(
    `SELECT assigned_to, cost FROM tasks WHERE id = $1`,
    [submission.task_id]
  );
  const employeeId = taskRows[0]?.assigned_to;
  const taskCost = taskRows[0]?.cost || 'N/A';
  const submissionCost = submission.cost || 'N/A';
  
  // If approved, update task status to completed
  if (status === 'approved') {
    await query(
      `UPDATE tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [submission.task_id]
    );
  }
  
  // Notify submitter
  try {
    await notificationService.createNotification(submission.submitted_by, {
      type: 'TASK',
      title: `Task submission ${status}`,
      body: `Your submission has been ${status}`,
      metadata: {
        submissionId,
        taskId: submission.task_id,
        status,
      },
    });
  } catch (err) {
    console.warn('Failed to dispatch status notification', err.message);
  }
  
  await auditService.logAction(reviewedBy, 'TASK_SUBMISSION_STATUS_UPDATED', 'task_submissions', submissionId, {
    status,
    remarks,
  });
  
  // Recalculate employee KPI if approved (async, don't wait)
  if (status === 'approved' && employeeId) {
    console.log(`[KPI Trigger] ========================================`);
    console.log(`[KPI Trigger] TASK SUBMISSION APPROVED - Triggering KPI Recalculation`);
    console.log(`[KPI Trigger] Employee ID: ${employeeId}`);
    console.log(`[KPI Trigger] Task ID: ${submission.task_id}`);
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
      status,
      employeeId,
      reason: status !== 'approved' ? 'Submission not approved' : 'No employee ID'
    });
  }
  
  return rows[0];
};

module.exports = {
  createTaskSubmission,
  getTaskSubmissions,
  getMilestoneSubmissions,
  updateSubmissionStatus,
};
