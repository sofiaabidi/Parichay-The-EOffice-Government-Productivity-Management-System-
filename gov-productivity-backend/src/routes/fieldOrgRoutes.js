const { Router } = require('express');
const fieldOrgController = require('../controllers/fieldOrgController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

// All routes require FIELD_ORG role
router.use(auth);
router.use(roleCheck('FIELD_ORG'));

router.get('/managers', fieldOrgController.getAllFieldManagers);
router.get('/employees', fieldOrgController.getFieldEmployeesWithStatus);
router.get('/stats', fieldOrgController.getFieldUserStats);
router.get('/leaderboard/managers', fieldOrgController.getFieldManagersLeaderboard);
router.get('/leaderboard/employees', fieldOrgController.getFieldEmployeesLeaderboard);
router.get('/average-kpi/managers', fieldOrgController.getAverageManagerKPI);
router.get('/average-kpi/employees', fieldOrgController.getAverageEmployeeKPI);
router.get('/promotion-candidates', fieldOrgController.getPromotionCandidates);
router.get('/training-recommendations', fieldOrgController.getTrainingRecommendations);
router.get('/weekly-kpi-snapshots', fieldOrgController.getWeeklyKpiSnapshots);
router.get('/staffing-overview', fieldOrgController.getStaffingOverview);
router.post('/staffing-overview/predict-all', fieldOrgController.predictAllTeamsStaffing);
router.post('/feedback/manager', fieldOrgController.submitFeedbackToManager);
router.post('/users', fieldOrgController.createUser);
router.post('/assign-team', fieldOrgController.assignEmployeeToManager);
router.post('/deallocate-team', fieldOrgController.deallocateEmployee);

// Promotion Scores
const promotionScoreController = require('../controllers/promotionScoreController');
router.get('/promotion-scores/top', fieldOrgController.getTopPromotionScores);
router.get('/promotion-scores', promotionScoreController.getAllPromotionScores);
router.get('/promotion-scores/:userId', promotionScoreController.getPromotionScoreById);
router.post('/promotion-scores/calculate', promotionScoreController.calculateAllPromotionScores);
router.post('/promotion-scores/:userId/recalculate', promotionScoreController.recalculatePromotionScore);

module.exports = router;

