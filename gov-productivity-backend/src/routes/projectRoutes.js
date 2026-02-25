const { Router } = require('express');
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { createProjectSchema } = require('../utils/validators');

const router = Router();

router.post(
  '/',
  auth,
  roleCheck('MANAGER', 'ADMIN', 'FIELD_MANAGER'),
  validateRequest(createProjectSchema),
  projectController.createProject,
);

router.get('/', auth, projectController.listProjects);

router.patch('/:id', auth, roleCheck('MANAGER', 'ADMIN', 'FIELD_MANAGER'), projectController.updateProject);

module.exports = router;

