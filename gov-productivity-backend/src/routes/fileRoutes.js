const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { createFileSchema, completeFileSchema, reviewFileSchema } = require('../utils/validators');
const fileService = require('../services/fileService');

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
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF uploads are allowed'));
    }
    cb(null, true);
  },
});

const router = Router();

router.post(
  '/',
  auth,
  roleCheck('EMPLOYEE'),
  validateRequest(createFileSchema),
  fileController.createFile,
);
router.patch('/:id/complete', auth, validateRequest(completeFileSchema), fileController.completeFile);

router.post(
  '/:id/upload',
  auth,
  roleCheck('EMPLOYEE'),
  upload.single('pdf'),
  fileController.uploadDocument,
);

router.get('/my', auth, fileController.listMyFiles);
router.get('/documents/:documentId/download', auth, fileController.downloadDocument);
router.get('/:id/documents', auth, roleCheck('MANAGER', 'ADMIN'), fileController.getDocuments);
router.patch('/:id/review', auth, roleCheck('MANAGER', 'ADMIN'), validateRequest(reviewFileSchema), fileController.reviewFile);

module.exports = router;

