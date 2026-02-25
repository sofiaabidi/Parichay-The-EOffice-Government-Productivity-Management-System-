const { Router } = require('express');
const milestoneController = require('../controllers/milestoneController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

// Create milestone for a project (Manager only)
router.post(
  '/projects/:projectId/milestones',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  milestoneController.createMilestone
);

// Get milestones for a project
router.get(
  '/projects/:projectId/milestones',
  auth,
  milestoneController.getMilestones
);

// Update milestone (Manager only)
router.patch(
  '/milestones/:id',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  milestoneController.updateMilestone
);

// Delete milestone (Manager only)
router.delete(
  '/milestones/:id',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  milestoneController.deleteMilestone
);

module.exports = router;

