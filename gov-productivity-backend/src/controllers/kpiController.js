const kpiService = require('../services/kpiService');
const managerService = require('../services/managerService');

const getEmployeeKpi = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (req.user.role === 'EMPLOYEE' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Cannot view other employee KPIs' });
    }
    const metrics = await kpiService.getEmployeeKpi(
      userId,
      req.query.periodStart,
      req.query.periodEnd,
    );
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};

const getEmployeeHistory = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (req.user.role === 'EMPLOYEE' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Cannot view other employee KPIs' });
    }
    const history = await kpiService.getEmployeeHistory(userId);
    res.json(history);
  } catch (error) {
    next(error);
  }
};

const getManagerKpi = async (req, res, next) => {
  try {
    const managerId = Number(req.params.managerId);
    if (req.user.role === 'MANAGER' && req.user.id !== managerId) {
      return res.status(403).json({ message: 'Cannot view other manager KPIs' });
    }
    const metrics = await managerService.computeManagerKpi(
      managerId,
      req.query.periodStart,
      req.query.periodEnd,
    );
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};

const getManagerTeamTable = async (req, res, next) => {
  try {
    const managerId = Number(req.params.managerId);
    if (req.user.role === 'MANAGER' && req.user.id !== managerId) {
      return res.status(403).json({ message: 'Cannot view other manager KPIs' });
    }
    const rows = await kpiService.getTeamKpiTable(
      managerId,
      req.query.periodStart,
      req.query.periodEnd,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const adjustEmployeeKpi = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const result = await kpiService.applyManualAdjustment(
      userId,
      req.user,
      req.body.delta,
      req.body.reason,
      req.body.periodStart,
      req.body.periodEnd,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployeeKpi,
  getEmployeeHistory,
  getManagerKpi,
  getManagerTeamTable,
  adjustEmployeeKpi,
};

