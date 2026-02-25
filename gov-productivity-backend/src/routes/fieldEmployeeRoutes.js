const { Router } = require('express');
const fieldEmployeeController = require('../controllers/fieldEmployeeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

// All routes require authentication and FIELD_EMPLOYEE role
router.use(auth, roleCheck('FIELD_EMPLOYEE'));

// Projects
router.get('/projects', fieldEmployeeController.getMyProjects);

// Surveys
router.get('/surveys', fieldEmployeeController.getMySurveys);
router.post('/surveys/submit', fieldEmployeeController.submitSurveySubmission);

// KPI
router.get('/kpi', fieldEmployeeController.getMyKPI);
router.get('/kpi/history', fieldEmployeeController.getMyKPIHistory);
router.get('/kpi/daily-history', fieldEmployeeController.getMyDailyKPIHistory);

// Locations
router.get('/locations/by-id/:locationId', fieldEmployeeController.getLocationById);
router.get('/locations', fieldEmployeeController.getMyLocations);
router.post('/locations', fieldEmployeeController.saveLocation);
router.delete('/locations/:id', fieldEmployeeController.deleteLocation);

// Field Visits
router.get('/field-visits', fieldEmployeeController.getMyFieldVisits);

// Trainings
router.get('/trainings', fieldEmployeeController.getMyTrainings);

// Peers
router.get('/peers', fieldEmployeeController.getMyPeers);

// Feedback
router.get('/feedback', fieldEmployeeController.getMyFeedback);

// Skills
router.get('/skills/available', fieldEmployeeController.getAvailableSkills);
router.get('/skills', fieldEmployeeController.getMySkills);
router.post('/skills', fieldEmployeeController.saveMySkills);

// Promotion Score
const promotionScoreController = require('../controllers/promotionScoreController');
router.get('/promotion-score', promotionScoreController.getMyPromotionScore);

module.exports = router;

