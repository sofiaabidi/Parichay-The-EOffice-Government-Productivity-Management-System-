const { Router } = require('express');
const fieldManagerController = require('../controllers/fieldManagerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

// All routes require authentication and FIELD_MANAGER role
router.use(auth, roleCheck('FIELD_MANAGER'));

// Team
router.get('/team', fieldManagerController.getMyTeam);

// Projects
router.get('/projects', fieldManagerController.getMyProjects);
router.get('/projects/active', fieldManagerController.getActiveProjects);
router.get('/projects/:projectId/employees', fieldManagerController.getProjectEmployees);
router.post('/projects/:projectId/dpr-review', fieldManagerController.submitDprReview);
router.post('/projects/field-visits', fieldManagerController.createProjectFieldVisit);

// Surveys
router.post('/surveys', fieldManagerController.createSurvey);
router.get('/surveys', fieldManagerController.getMySurveys);
router.get('/surveys/active', fieldManagerController.getActiveSurveys);
router.get('/surveys/:surveyId/employees', fieldManagerController.getSurveyEmployees);
router.post('/surveys/field-visits', fieldManagerController.createSurveyFieldVisit);
router.get('/surveys/submissions', fieldManagerController.getSurveySubmissions);
router.post('/surveys/submissions/:id/review', fieldManagerController.reviewSurveySubmission);

// KPI
router.get('/kpi', fieldManagerController.getMyKPI);
router.get('/kpi/team-table', fieldManagerController.getTeamKPITable);
router.get('/kpi/leaderboard', fieldManagerController.getLeaderboard);

// Dashboard
router.get('/dashboard/summary', fieldManagerController.getDashboardSummary);
router.get('/dashboard/ongoing-activities', fieldManagerController.getOngoingActivities);
router.get('/dashboard/pending-approvals', fieldManagerController.getPendingApprovals);

// Feedback
router.get('/feedback', fieldManagerController.getMyFeedback);

// Locations
router.get('/locations', fieldManagerController.getMyLocations);
router.post('/locations', fieldManagerController.saveLocation);
router.delete('/locations/:id', fieldManagerController.deleteLocation);

// Skills
router.get('/skills/available', fieldManagerController.getAvailableSkills);

module.exports = router;

