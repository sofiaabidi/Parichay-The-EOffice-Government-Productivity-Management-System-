const fileService = require('../services/fileService');

const createFile = async (req, res, next) => {
  try {
    const record = await fileService.createWorkFile(req.body, req.user.id);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

const completeFile = async (req, res, next) => {
  try {
    const record = await fileService.completeWorkFile(Number(req.params.id), req.body, req.user.id);
    res.json(record);
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF is required' });
    }
    const document = await fileService.saveDocumentRecord(
      Number(req.params.id),
      req.user.id,
      req.file,
    );
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

const listMyFiles = async (req, res, next) => {
  try {
    const files = await fileService.listMyFiles(req.user.id);
    res.json(files);
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const docs = await fileService.getFileDocuments(Number(req.params.id));
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { query } = require('../config/database');
    const document = await fileService.getDocumentById(Number(req.params.documentId));
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check permissions - user must be the uploader, manager, or employee associated with the file
    // Also check if manager is assigned_by in the task or manages employees in the same department
    const { rows: fileRows } = await query(
      `SELECT 
         wf.employee_id, 
         wf.manager_id, 
         wf.task_id, 
         t.assigned_by,
         u_employee.department AS employee_department,
         u_manager.department AS manager_department
       FROM work_files wf
       LEFT JOIN tasks t ON t.id = wf.task_id
       LEFT JOIN users u_employee ON u_employee.id = wf.employee_id
       LEFT JOIN users u_manager ON u_manager.id = $2
       WHERE wf.id = (SELECT work_file_id FROM file_documents WHERE id = $1)`,
      [req.params.documentId, req.user.id]
    );
    const workFile = fileRows[0];
    
    // Check multiple access conditions
    const hasAccess = 
      document.uploaded_by === req.user.id ||
      req.user.role === 'ADMIN' ||
      (workFile && (
        workFile.employee_id === req.user.id || 
        workFile.manager_id === req.user.id ||
        (req.user.role === 'MANAGER' && workFile.assigned_by === req.user.id) ||
        (req.user.role === 'MANAGER' && workFile.employee_department && workFile.manager_department && 
         workFile.employee_department === workFile.manager_department)
      ));
    
    if (!hasAccess) {
      console.error('PDF access denied:', {
        userId: req.user.id,
        role: req.user.role,
        uploadedBy: document.uploaded_by,
        workFile: workFile
      });
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Get the upload directory (absolute path)
    const uploadDir = fileService.ensureUploadDir();
    
    // Handle different storage_path formats
    let filePath;
    const storagePath = document.storage_path || '';
    
    // Normalize the storage path
    if (path.isAbsolute(storagePath)) {
      // Already absolute path
      filePath = storagePath;
    } else {
      // Remove leading slashes and normalize
      let cleanPath = storagePath.replace(/^\/+/, '');
      
      // If it starts with 'uploads/', remove that prefix
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replace(/^uploads\//, '');
      }
      
      // Join with upload directory
      filePath = path.join(uploadDir, cleanPath);
    }
    
    // Normalize path separators
    filePath = path.normalize(filePath);
    
    console.log(`PDF Download Request:`);
    console.log(`  Document ID: ${req.params.documentId}`);
    console.log(`  Storage path from DB: "${storagePath}"`);
    console.log(`  Upload directory: "${uploadDir}"`);
    console.log(`  Resolved file path: "${filePath}"`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // Try alternative: just the filename
      const filename = path.basename(storagePath);
      const altPath = path.join(uploadDir, filename);
      
      console.log(`  File not found, trying alternative: "${altPath}"`);
      
      if (fs.existsSync(altPath)) {
        filePath = altPath;
        console.log(`  ✓ Found at alternative path`);
      } else {
        // List files in upload directory for debugging
        try {
          const files = fs.readdirSync(uploadDir);
          console.error(`  ✗ File not found. Available files in uploads:`, files.slice(0, 10));
        } catch (err) {
          console.error(`  ✗ Cannot read upload directory:`, err.message);
        }
        
        return res.status(404).json({ 
          message: 'File not found on server',
          storagePath: storagePath,
          resolvedPath: filePath
        });
      }
    }
    
    console.log(`  ✓ Serving PDF: "${filePath}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.original_name}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

const reviewFile = async (req, res, next) => {
  try {
    const record = await fileService.reviewWorkFile(
      Number(req.params.id),
      req.user.id,
      req.body
    );
    res.json(record);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFile,
  completeFile,
  uploadDocument,
  listMyFiles,
  getDocuments,
  downloadDocument,
  reviewFile,
};

