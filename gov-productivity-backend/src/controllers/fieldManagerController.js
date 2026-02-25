const fieldManagerService = require('../services/fieldManagerService');

const getMyTeam = async (req, res, next) => {
  try {
    const team = await fieldManagerService.getMyTeam(req.user.id);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

const getMyProjects = async (req, res, next) => {
  try {
    const projects = await fieldManagerService.getMyProjects(req.user.id);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const createSurvey = async (req, res, next) => {
  try {
    const survey = await fieldManagerService.createSurvey(req.user.id, req.body);
    res.status(201).json(survey);
  } catch (error) {
    next(error);
  }
};

const getMySurveys = async (req, res, next) => {
  try {
    const surveys = await fieldManagerService.getMySurveys(req.user.id);
    res.json(surveys);
  } catch (error) {
    next(error);
  }
};

const getSurveySubmissions = async (req, res, next) => {
  try {
    const submissions = await fieldManagerService.getSurveySubmissions(req.user.id);
    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

const reviewSurveySubmission = async (req, res, next) => {
  try {
    const result = await fieldManagerService.reviewSurveySubmission(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMyKPI = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const kpi = await fieldManagerService.getMyKPI(req.user.id, periodStart, periodEnd);
    res.json(kpi);
  } catch (error) {
    next(error);
  }
};

const getTeamKPITable = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const teamKPI = await fieldManagerService.getTeamKPITable(req.user.id, periodStart, periodEnd);
    res.json(teamKPI);
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const leaderboard = await fieldManagerService.getLeaderboard(req.user.id, periodStart, periodEnd);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

const getPendingApprovals = async (req, res, next) => {
  try {
    const approvals = await fieldManagerService.getPendingApprovals(req.user.id);
    res.json(approvals);
  } catch (error) {
    next(error);
  }
};

const getOngoingActivities = async (req, res, next) => {
  try {
    const activities = await fieldManagerService.getOngoingActivities(req.user.id);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const summary = await fieldManagerService.getDashboardSummary(req.user.id, periodStart, periodEnd);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await fieldManagerService.getMyFeedback(req.user.id);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

const getMyLocations = async (req, res, next) => {
  try {
    const locations = await fieldManagerService.getMyLocations(req.user.id);
    res.json(locations);
  } catch (error) {
    next(error);
  }
};

const getAvailableSkills = async (req, res, next) => {
  try {
    const fieldEmployeeService = require('../services/fieldEmployeeService');
    const skills = await fieldEmployeeService.getAvailableSkills();
    res.json(skills);
  } catch (error) {
    next(error);
  }
};

const saveLocation = async (req, res, next) => {
  try {
    const location = await fieldManagerService.saveLocation(req.user.id, req.body);
    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
};

const deleteLocation = async (req, res, next) => {
  try {
    const result = await fieldManagerService.deleteLocation(req.user.id, req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getActiveSurveys = async (req, res, next) => {
  try {
    const surveys = await fieldManagerService.getActiveSurveys(req.user.id);
    res.json(surveys);
  } catch (error) {
    next(error);
  }
};

const getSurveyEmployees = async (req, res, next) => {
  try {
    const employees = await fieldManagerService.getSurveyEmployees(req.user.id, req.params.surveyId);
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

const getActiveProjects = async (req, res, next) => {
  try {
    const projects = await fieldManagerService.getActiveProjects(req.user.id);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const getProjectEmployees = async (req, res, next) => {
  try {
    const employees = await fieldManagerService.getProjectEmployees(req.user.id, req.params.projectId);
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

const createSurveyFieldVisit = async (req, res, next) => {
  try {
    const result = await fieldManagerService.createSurveyFieldVisit(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const submitDprReview = async (req, res, next) => {
  try {
    const dprReviewService = require('../services/dprReviewService');
    const projectId = parseInt(req.params.projectId);
    const reviewData = req.body;
    const result = await dprReviewService.submitDprReview(
      req.user.id,
      projectId,
      reviewData
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const createProjectFieldVisit = async (req, res, next) => {
  try {
    const projectFieldVisitService = require('../services/projectFieldVisitService');
    const result = await projectFieldVisitService.createProjectFieldVisit(
      req.user.id,
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyTeam,
  getMyProjects,
  createSurvey,
  getMySurveys,
  getActiveSurveys,
  getSurveyEmployees,
  createSurveyFieldVisit,
  getSurveySubmissions,
  reviewSurveySubmission,
  getActiveProjects,
  getProjectEmployees,
  getMyKPI,
  getTeamKPITable,
  getLeaderboard,
  getPendingApprovals,
  getOngoingActivities,
  getDashboardSummary,
  getMyFeedback,
  getMyLocations,
  saveLocation,
  deleteLocation,
  submitDprReview,
  createProjectFieldVisit,
  getAvailableSkills,
};

