const { Router } = require('express');
const taskSubmissionController = require('../controllers/taskSubmissionController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

// Create task submission (Employee and Field Employee)
router.post(
  '/',
  auth,
  roleCheck('EMPLOYEE', 'FIELD_EMPLOYEE'),
  taskSubmissionController.upload.array('files', 10), // Allow up to 10 files
  taskSubmissionController.createSubmission
);

// Get submissions (for task or milestone)
router.get(
  '/',
  auth,
  taskSubmissionController.getSubmissions
);

// Update submission status (Manager, Admin, and Field Manager)
router.patch(
  '/:id/status',
  auth,
  roleCheck('MANAGER', 'ADMIN', 'FIELD_MANAGER'),
  taskSubmissionController.updateSubmissionStatus
);

module.exports = router;

