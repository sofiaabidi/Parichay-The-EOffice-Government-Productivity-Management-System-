const { Router } = require('express');
const userController = require('../controllers/userController');
const badgeController = require('../controllers/badgeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { trainingSchema, recognitionSchema, skillSchema, badgeSchema } = require('../utils/validators');

const router = Router();

router.get('/me', auth, userController.getProfile);
router.get('/manager/team', auth, roleCheck('MANAGER', 'ADMIN', 'FIELD_MANAGER'), userController.getManagerTeam);
router.get('/employee/peers', auth, roleCheck('EMPLOYEE', 'FIELD_EMPLOYEE'), userController.getEmployeePeers);
router.get('/employee/department-leaderboard', auth, roleCheck('EMPLOYEE'), userController.getDepartmentLeaderboard);

router.get('/employee/trainings', auth, userController.getMyTrainings);
router.get('/employee/recognitions', auth, userController.getMyRecognitions);
router.get('/employee/skills', auth, userController.getMySkills);
router.get('/employee/badges', auth, userController.getMyBadges);

router.post(
  '/employee/trainings',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  validateRequest(trainingSchema),
  userController.addTraining,
);

router.post(
  '/employee/recognitions',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  validateRequest(recognitionSchema),
  userController.addRecognition,
);

router.post(
  '/employee/skills',
  auth,
  validateRequest(skillSchema),
  userController.addSkill,
);

router.delete('/employee/skills/:skillId', auth, userController.deleteSkill);

router.post(
  '/employee/badges',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  validateRequest(badgeSchema),
  userController.addBadge,
);

// System badge generation (for testing)
router.post(
  '/badges/generate',
  auth,
  badgeController.generateBadges,
);

module.exports = router;
