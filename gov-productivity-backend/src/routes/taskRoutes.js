const { Router } = require('express');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { createTaskSchema, updateTaskStatusSchema } = require('../utils/validators');

const router = Router();

router.post(
  '/',
  auth,
  roleCheck('MANAGER', 'ADMIN', 'FIELD_MANAGER'),
  validateRequest(createTaskSchema),
  taskController.createTask,
);

router.get('/my', auth, taskController.getMyTasks);

router.patch(
  '/:id/status',
  auth,
  validateRequest(updateTaskStatusSchema),
  taskController.updateStatus,
);

router.get('/team', auth, roleCheck('MANAGER', 'ADMIN', 'FIELD_MANAGER'), taskController.getTeamTasks);

module.exports = router;

