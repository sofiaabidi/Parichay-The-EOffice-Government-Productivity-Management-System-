const { Router } = require('express');
const hqOrgController = require('../controllers/hqOrgController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

// All routes require HQ_ORG role
router.use(auth);
router.use(roleCheck('HQ_ORG'));

router.get('/leaderboard/managers', hqOrgController.getManagersLeaderboard);
router.get('/leaderboard/employees', hqOrgController.getEmployeesLeaderboard);
router.get('/managers', hqOrgController.getAllManagers);
router.post('/feedback/manager', hqOrgController.submitFeedbackToManager);
router.get('/departments', hqOrgController.getDepartments);
router.get('/managers/department/:department', hqOrgController.getManagersByDepartment);
router.get('/employees', hqOrgController.getEmployeesWithStatus);
router.post('/assign-team', hqOrgController.assignEmployeeToManager);
router.post('/deallocate-team', hqOrgController.deallocateEmployee);
router.post('/users', hqOrgController.createUser);
router.get('/promotion-candidates', hqOrgController.getPromotionCandidates);
router.get('/training-recommendations', hqOrgController.getTrainingRecommendations);

module.exports = router;

