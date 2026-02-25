const managerService = require('../services/managerService');

const getSummary = async (req, res, next) => {
  try {
    const summary = await managerService.getDashboardSummary(
      req.user.id,
      req.query.periodStart,
      req.query.periodEnd,
    );
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await managerService.getLeaderboard(
      req.user.id,
      req.query.periodStart,
      req.query.periodEnd,
    );
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

const getStatusBreakdown = async (req, res, next) => {
  try {
    const data = await managerService.getStatusBreakdown(req.user.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const trends = await managerService.getTrends(req.user.id);
    res.json(trends);
  } catch (error) {
    next(error);
  }
};

const getPendingApprovals = async (req, res, next) => {
  try {
    const approvals = await managerService.getPendingApprovals(req.user.id);
    res.json(approvals);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getLeaderboard,
  getStatusBreakdown,
  getTrends,
  getPendingApprovals,
};

