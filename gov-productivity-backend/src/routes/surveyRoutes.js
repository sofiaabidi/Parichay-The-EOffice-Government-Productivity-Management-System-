const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { query } = require('../config/database');
const fileService = require('../services/fileService');

const router = Router();

// Configure multer for file uploads (images and PDFs)
const uploadPath = fileService.ensureUploadDir();
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Allow images and PDFs
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload file for survey submission (Field Employee)
router.post(
  '/submissions/:submissionId/files',
  auth,
  roleCheck('FIELD_EMPLOYEE'),
  upload.array('files', 10), // Allow up to 10 files
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const { submissionId } = req.params;
      
      // Verify submission belongs to user
      const verifySql = `
        SELECT ss.id, ss.survey_id
        FROM survey_submissions ss
        WHERE ss.id = $1 AND ss.submitted_by = $2
      `;
      const { rows: verifyRows } = await query(verifySql, [submissionId, req.user.id]);
      
      if (!verifyRows[0]) {
        return res.status(404).json({ message: 'Survey submission not found' });
      }

      const uploadedFiles = [];
      
      for (const file of req.files) {
        // Save file document record
        const fileDocSql = `
          INSERT INTO file_documents (uploaded_by, original_name, mime_type, file_size, storage_path)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, original_name, mime_type, file_size, storage_path
        `;
        const { rows: docRows } = await query(fileDocSql, [
          req.user.id,
          file.originalname,
          file.mimetype,
          file.size,
          file.path,
        ]);
        const fileDoc = docRows[0];
        
        // Determine file type
        const fileType = file.mimetype.startsWith('image/') ? 'image' :
                        file.mimetype === 'application/pdf' ? 'pdf' : 'document';
        
        // Link file to survey submission
        const linkSql = `
          INSERT INTO survey_submission_files (survey_submission_id, file_document_id, file_type)
          VALUES ($1, $2, $3)
          RETURNING id
        `;
        await query(linkSql, [submissionId, fileDoc.id, fileType]);
        
        uploadedFiles.push({
          id: fileDoc.id,
          original_name: fileDoc.original_name,
          mime_type: fileDoc.mime_type,
          file_size: fileDoc.file_size,
          storage_path: fileDoc.storage_path,
          file_type: fileType,
        });
      }
      
      res.status(201).json({ files: uploadedFiles });
    } catch (error) {
      next(error);
    }
  }
);

// Get files for a survey submission
router.get(
  '/submissions/:submissionId/files',
  auth,
  roleCheck('FIELD_MANAGER', 'FIELD_EMPLOYEE'),
  async (req, res, next) => {
    try {
      const { submissionId } = req.params;
      
      // Verify access
      const verifySql = `
        SELECT ss.id, ss.submitted_by, ss.survey_id, s.created_by
        FROM survey_submissions ss
        JOIN surveys s ON s.id = ss.survey_id
        WHERE ss.id = $1
      `;
      const { rows: verifyRows } = await query(verifySql, [submissionId]);
      
      if (!verifyRows[0]) {
        return res.status(404).json({ message: 'Survey submission not found' });
      }
      
      const submission = verifyRows[0];
      
      // Check access: employee can view their own, manager can view if they created the survey
      if (req.user.role === 'FIELD_EMPLOYEE' && submission.submitted_by !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      if (req.user.role === 'FIELD_MANAGER' && submission.created_by !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Get files
      const filesSql = `
        SELECT 
          fd.id,
          fd.original_name,
          fd.mime_type,
          fd.file_size,
          fd.storage_path,
          ssf.file_type,
          ssf.uploaded_at
        FROM survey_submission_files ssf
        JOIN file_documents fd ON fd.id = ssf.file_document_id
        WHERE ssf.survey_submission_id = $1
        ORDER BY ssf.uploaded_at ASC
      `;
      const { rows: files } = await query(filesSql, [submissionId]);
      
      res.json({ files });
    } catch (error) {
      next(error);
    }
  }
);

// Get file content for viewing (for manager to view images/PDFs)
router.get(
  '/files/:fileId',
  auth,
  roleCheck('FIELD_MANAGER', 'FIELD_EMPLOYEE'),
  async (req, res, next) => {
    try {
      const { fileId } = req.params;
      
      // Get file document
      const fileSql = `
        SELECT 
          fd.id,
          fd.original_name,
          fd.mime_type,
          fd.file_size,
          fd.storage_path,
          ssf.survey_submission_id,
          ss.survey_id,
          s.created_by
        FROM file_documents fd
        JOIN survey_submission_files ssf ON ssf.file_document_id = fd.id
        JOIN survey_submissions ss ON ss.id = ssf.survey_submission_id
        JOIN surveys s ON s.id = ss.survey_id
        WHERE fd.id = $1
      `;
      const { rows: fileRows } = await query(fileSql, [fileId]);
      
      if (!fileRows[0]) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      const file = fileRows[0];
      
      // Verify access: manager can view if they created the survey, employee can view if they submitted
      if (req.user.role === 'FIELD_MANAGER') {
        if (file.created_by !== req.user.id) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      } else if (req.user.role === 'FIELD_EMPLOYEE') {
        const checkSql = `
          SELECT submitted_by FROM survey_submissions WHERE id = $1
        `;
        const { rows: checkRows } = await query(checkSql, [file.survey_submission_id]);
        if (!checkRows[0] || checkRows[0].submitted_by !== req.user.id) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      }
      
      const fs = require('fs');
      const filePath = path.isAbsolute(file.storage_path) 
        ? file.storage_path 
        : path.join(process.cwd(), file.storage_path);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on server' });
      }
      
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

