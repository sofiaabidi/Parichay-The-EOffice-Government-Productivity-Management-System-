const fieldOrgService = require('../services/fieldOrgService');

const getAllFieldManagers = async (req, res, next) => {
  try {
    const managers = await fieldOrgService.getAllFieldManagers();
    res.json(managers);
  } catch (error) {
    next(error);
  }
};

const submitFeedbackToManager = async (req, res, next) => {
  try {
    const { managerId, rating, comment, regarding } = req.body;
    
    if (!managerId || !rating) {
      return res.status(400).json({ message: 'Manager ID and rating are required' });
    }
    
    const feedback = await fieldOrgService.submitFeedbackToManager(
      req.user.id,
      parseInt(managerId),
      { rating, comment, regarding }
    );
    
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, designation, phone, qualifications, joiningMonth, joiningYear } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }
    
    // Validate role
    if (role !== 'FIELD_EMPLOYEE' && role !== 'FIELD_MANAGER') {
      return res.status(400).json({ message: 'Role must be FIELD_EMPLOYEE or FIELD_MANAGER' });
    }
    
    const user = await fieldOrgService.createUser(req.user.id, {
      name,
      email,
      password,
      role,
      department: department || null,
      designation: designation || null,
      phone: phone || null,
      qualifications: qualifications || null,
      joiningMonth: joiningMonth || null,
      joiningYear: joiningYear || null,
    });
    
    res.status(201).json({
      message: `${role} account created successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFieldEmployeesWithStatus = async (req, res, next) => {
  try {
    const employees = await fieldOrgService.getFieldEmployeesWithStatus();
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

const getFieldUserStats = async (req, res, next) => {
  try {
    const stats = await fieldOrgService.getFieldUserStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const assignEmployeeToManager = async (req, res, next) => {
  try {
    const { employeeId, managerId } = req.body;
    
    if (!employeeId || !managerId) {
      return res.status(400).json({ message: 'Employee ID and Manager ID are required' });
    }
    
    const result = await fieldOrgService.assignEmployeeToManager(
      req.user.id,
      parseInt(employeeId),
      parseInt(managerId)
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deallocateEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    
    const result = await fieldOrgService.deallocateEmployee(
      req.user.id,
      parseInt(employeeId)
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getFieldManagersLeaderboard = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const leaderboard = await fieldOrgService.getFieldManagersLeaderboard(periodStart, periodEnd);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

const getFieldEmployeesLeaderboard = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const leaderboard = await fieldOrgService.getFieldEmployeesLeaderboard(periodStart, periodEnd);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

const getAverageManagerKPI = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const result = await fieldOrgService.getAverageManagerKPI(periodStart, periodEnd);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getAverageEmployeeKPI = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const result = await fieldOrgService.getAverageEmployeeKPI(periodStart, periodEnd);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPromotionCandidates = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const candidates = await fieldOrgService.getPromotionCandidates(periodStart, periodEnd);
    res.json(candidates);
  } catch (error) {
    next(error);
  }
};

const getTrainingRecommendations = async (req, res, next) => {
  try {
    // When Training Needed button is clicked, calculate and return training need scores
    // This triggers recalculation of all training need scores from recent data
    const trainingNeeds = await fieldOrgService.calculateAndGetTrainingNeedScores();
    res.json(trainingNeeds);
  } catch (error) {
    next(error);
  }
};

const getWeeklyKpiSnapshots = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const snapshots = await fieldOrgService.getWeeklyKpiSnapshots(limit);
    res.json(snapshots);
  } catch (error) {
    next(error);
  }
};

const getStaffingOverview = async (req, res, next) => {
  try {
    const staffAdequacyService = require('../services/staffAdequacyService');
    const overview = await staffAdequacyService.getStaffingOverview();
    res.json(overview);
  } catch (error) {
    next(error);
  }
};

const predictAllTeamsStaffing = async (req, res, next) => {
  try {
    const staffAdequacyService = require('../services/staffAdequacyService');
    const result = await staffAdequacyService.predictAndUpdateAllTeams();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getTopPromotionScores = async (req, res, next) => {
  try {
    const promotionScoreService = require('../services/promotionScoreService');
    const limit = parseInt(req.query.limit) || 5;
    const scores = await promotionScoreService.getAllPromotionScores(limit);
    res.json(scores);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFieldManagers,
  submitFeedbackToManager,
  createUser,
  getFieldEmployeesWithStatus,
  getFieldUserStats,
  assignEmployeeToManager,
  deallocateEmployee,
  getFieldManagersLeaderboard,
  getFieldEmployeesLeaderboard,
  getAverageManagerKPI,
  getAverageEmployeeKPI,
  getPromotionCandidates,
  getTrainingRecommendations,
  getWeeklyKpiSnapshots,
  getStaffingOverview,
  predictAllTeamsStaffing,
  getTopPromotionScores,
};

