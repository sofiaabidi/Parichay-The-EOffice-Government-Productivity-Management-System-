const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
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

const resolveManagerId = async (payload, employeeId) => {
  if (payload.managerId) return payload.managerId;
  if (payload.taskId) {
    const { rows } = await query(`SELECT assigned_by FROM tasks WHERE id = $1`, [payload.taskId]);
    if (rows[0]?.assigned_by) {
      return rows[0].assigned_by;
    }
  }
  const { rows } = await query(
    `
      SELECT t.manager_id
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY t.created_at ASC
      LIMIT 1
    `,
    [employeeId],
  );
  return rows[0]?.manager_id || null;
};

const createWorkFile = async (payload, userId) => {
  const managerId = await resolveManagerId(payload, userId);
  
  // Set first_response_at when work_file is created (uploading is a response)
  const firstResponseAt = new Date();
  
  const sql = `
    INSERT INTO work_files (
      employee_id, manager_id, task_id, title, description,
      complexity, complexity_weight, is_digital, target_time_hours, sla_time_hours,
      first_response_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    userId,
    managerId,
    payload.taskId || null,
    payload.title,
    payload.description || null,
    payload.complexity,
    payload.complexityWeight || 1,
    payload.isDigital,
    payload.targetTimeHours,
    payload.slaTimeHours,
    firstResponseAt,
  ]);
  console.log(`[Work File] Created work_file ${rows[0].id} for employee ${userId}, is_digital: ${payload.isDigital}, task_id: ${payload.taskId || 'N/A'}`);
  await auditService.logAction(userId, 'WORK_FILE_CREATED', 'work_files', rows[0].id, payload);
  return rows[0];
};

const completeWorkFile = async (fileId, payload, userId) => {
  // Grammar and clarity scores should only be set by manager during review
  // Employee completing file should only set completed_at and is_digital
  const sql = `
    UPDATE work_files
    SET completed_at = COALESCE($2, completed_at),
        is_digital = COALESCE($3, is_digital)
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await query(sql, [
    fileId,
    payload.completedAt || new Date(),
    payload.isDigital,
  ]);
  if (!rows.length) {
    const error = new Error('File not found');
    error.statusCode = 404;
    throw error;
  }
  await auditService.logAction(userId, 'WORK_FILE_COMPLETED', 'work_files', fileId, payload);
  return rows[0];
};

const listMyFiles = async (userId) => {
  const { rows } = await query(
    `
      SELECT *
      FROM work_files
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );
  return rows;
};

const getFileDocuments = async (fileId) => {
  const { rows } = await query(
    `
      SELECT *
      FROM file_documents
      WHERE work_file_id = $1
      ORDER BY created_at DESC
    `,
    [fileId],
  );
  return rows;
};

const getDocumentById = async (documentId) => {
  const { rows } = await query(
    `SELECT * FROM file_documents WHERE id = $1`,
    [documentId],
  );
  return rows[0] || null;
};

const saveDocumentRecord = async (fileId, uploadedBy, fileMeta) => {
  const sql = `
    INSERT INTO file_documents (
      work_file_id, uploaded_by, original_name,
      mime_type, file_size, storage_path
    ) VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    fileId,
    uploadedBy,
    fileMeta.originalname,
    fileMeta.mimetype,
    fileMeta.size,
    fileMeta.path,
  ]);
  await auditService.logAction(uploadedBy, 'FILE_DOCUMENT_UPLOADED', 'file_documents', rows[0].id, {
    fileId,
    name: fileMeta.originalname,
  });
  
  // Set completed_at when employee uploads document (completes the work)
  const { rows: workFileRows } = await query(
    `UPDATE work_files 
     SET completed_at = NOW()
     WHERE id = $1 AND completed_at IS NULL
     RETURNING employee_id, task_id`,
    [fileId]
  );
  
  // Trigger KPI recalculation for HQ employees when work file is completed
  if (workFileRows.length > 0) {
    const workFile = workFileRows[0];
    const { rows: userRows } = await query(
      `SELECT role FROM users WHERE id = $1`,
      [workFile.employee_id]
    );
    
    if (userRows.length > 0 && userRows[0].role === 'EMPLOYEE') {
      console.log(`[KPI Trigger] Work file completed - Recalculating KPI for HQ employee ${workFile.employee_id}`);
      const kpiService = require('./kpiService');
      kpiService.computeEmployeeKpis(workFile.employee_id, null, null, { persist: true })
        .then(result => {
          console.log(`[KPI Trigger] Work file completion - Successfully recalculated KPI for employee ${workFile.employee_id}:`, {
            fileDisposalRate: result.fileDisposalRate,
            responsiveness: result.responsiveness,
            tatScore: result.tatScore,
            qualityOfDrafting: result.qualityOfDrafting,
            digitalAdoption: result.digitalAdoption,
            finalKpi: result.finalKpi
          });
        })
        .catch(err => {
          console.error(`[KPI Trigger] Work file completion - Error recalculating KPI for employee ${workFile.employee_id}:`, err.message);
        });
    }
  }
  
  try {
    const { rows: workFileRows } = await query(
      `SELECT manager_id, employee_id, title FROM work_files WHERE id = $1`,
      [fileId],
    );
    const workFile = workFileRows[0];
    if (workFile?.manager_id) {
      await notificationService.createNotification(workFile.manager_id, {
        type: 'FILE',
        title: 'New submission awaiting review',
        body: `${fileMeta.originalname} uploaded for ${workFile.title}`,
        metadata: {
          workFileId: fileId,
          documentId: rows[0].id,
          employeeId: workFile.employee_id,
        },
      });
    }
  } catch (err) {
    console.warn('Failed to dispatch file notification', err.message);
  }
  return rows[0];
};

const getManagerFiles = async (managerId) => {
  const { rows } = await query(
    `
      SELECT *
      FROM work_files
      WHERE manager_id = $1
      ORDER BY created_at DESC
    `,
    [managerId],
  );
  return rows;
};

const reviewWorkFile = async (fileId, managerId, payload) => {
  // Manager reviews work file and sets grammar/clarity scores
  // These are for feedback only, NOT used in Quality KPI (which uses draft_number)
  const sql = `
    UPDATE work_files
    SET reviewed_by = $1,
        reviewed_at = NOW(),
        grammar_score = COALESCE($2, grammar_score),
        clarity_score = COALESCE($3, clarity_score)
    WHERE id = $4
      AND manager_id = $1
    RETURNING *
  `;
  const { rows } = await query(sql, [
    managerId,
    payload.grammarScore || null,
    payload.clarityScore || null,
    fileId,
  ]);
  if (!rows.length) {
    const error = new Error('Work file not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
  await auditService.logAction(managerId, 'WORK_FILE_REVIEWED', 'work_files', fileId, payload);
  return rows[0];
};

module.exports = {
  ensureUploadDir,
  createWorkFile,
  completeWorkFile,
  listMyFiles,
  getFileDocuments,
  getDocumentById,
  saveDocumentRecord,
  getManagerFiles,
  reviewWorkFile,
};

