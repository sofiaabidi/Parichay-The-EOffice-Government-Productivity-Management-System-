const taskSubmissionService = require('../services/taskSubmissionService');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const absolute = path.join(process.cwd(), uploadDir);
    require('fs').mkdirSync(absolute, { recursive: true });
    cb(null, absolute);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents (PDF, DOC, DOCX, XLS, XLSX) are allowed'));
    }
  },
});

const createSubmission = async (req, res, next) => {
  try {
    const { taskId, milestoneId, cost, notes } = req.body;
    const files = req.files || [];
    
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }
    
    if (files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required' });
    }
    
    const submissions = await taskSubmissionService.createTaskSubmission(
      Number(taskId),
      milestoneId ? Number(milestoneId) : null,
      req.user.id,
      files,
      cost || null,
      notes || null
    );
    
    res.status(201).json(submissions);
  } catch (error) {
    next(error);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const { taskId, milestoneId } = req.query;
    
    if (taskId) {
      const submissions = await taskSubmissionService.getTaskSubmissions(
        Number(taskId),
        req.user.id,
        req.user.role
      );
      return res.json(submissions);
    }
    
    if (milestoneId) {
      const submissions = await taskSubmissionService.getMilestoneSubmissions(
        Number(milestoneId),
        req.user.id,
        req.user.role
      );
      return res.json(submissions);
    }
    
    return res.status(400).json({ message: 'Either taskId or milestoneId is required' });
  } catch (error) {
    next(error);
  }
};

const updateSubmissionStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const { id } = req.params;
    
    if (!status || !['approved', 'rejected', 'pending-review'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (approved, rejected, pending-review)' });
    }
    
    const submission = await taskSubmissionService.updateSubmissionStatus(
      Number(id),
      status,
      req.user.id,
      remarks || null
    );
    
    res.json(submission);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  updateSubmissionStatus,
  upload,
};

