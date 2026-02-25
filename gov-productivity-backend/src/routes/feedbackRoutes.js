const { Router } = require('express');
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { feedbackSchema, peerFeedbackSchema, managerFeedbackSchema } = require('../utils/validators');

const router = Router();

router.post(
  '/tasks/:taskId',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  validateRequest(feedbackSchema),
  feedbackController.addTaskFeedback,
);

router.post(
  '/peer',
  auth,
  roleCheck('EMPLOYEE', 'FIELD_EMPLOYEE'),
  validateRequest(peerFeedbackSchema),
  feedbackController.addPeerFeedback,
);

router.post(
  '/manager',
  auth,
  roleCheck('MANAGER', 'ADMIN', 'FIELD_MANAGER'),
  validateRequest(managerFeedbackSchema),
  feedbackController.addManagerFeedback,
);

router.get('/my', auth, feedbackController.getMyFeedback);

module.exports = router;

