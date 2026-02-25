const hqOrgService = require('../services/hqOrgService');

const getManagersLeaderboard = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const leaderboard = await hqOrgService.getAllManagersLeaderboard(periodStart, periodEnd);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

const getEmployeesLeaderboard = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const leaderboard = await hqOrgService.getAllEmployeesLeaderboard(periodStart, periodEnd);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

const getAllManagers = async (req, res, next) => {
  try {
    const managers = await hqOrgService.getAllManagers();
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
    
    const feedback = await hqOrgService.submitFeedbackToManager(
      req.user.id,
      parseInt(managerId),
      { rating, comment, regarding }
    );
    
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const departments = await hqOrgService.getDepartments();
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

const getManagersByDepartment = async (req, res, next) => {
  try {
    const { department } = req.params;
    if (!department) {
      return res.status(400).json({ message: 'Department is required' });
    }
    const managers = await hqOrgService.getManagersByDepartment(department);
    res.json(managers);
  } catch (error) {
    next(error);
  }
};

const getEmployeesWithStatus = async (req, res, next) => {
  try {
    const employees = await hqOrgService.getEmployeesWithStatus();
    res.json(employees);
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
    
    const result = await hqOrgService.assignEmployeeToManager(
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
    
    const result = await hqOrgService.deallocateEmployee(
      req.user.id,
      parseInt(employeeId)
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, designation } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }
    
    // Validate role
    if (role !== 'EMPLOYEE' && role !== 'MANAGER') {
      return res.status(400).json({ message: 'Role must be EMPLOYEE or MANAGER' });
    }
    
    const user = await hqOrgService.createUser(req.user.id, {
      name,
      email,
      password,
      role,
      department: department || null,
      designation: designation || null,
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

const getPromotionCandidates = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const candidates = await hqOrgService.getPromotionCandidates(periodStart, periodEnd);
    res.json(candidates);
  } catch (error) {
    next(error);
  }
};

const getTrainingRecommendations = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const recommendations = await hqOrgService.getTrainingRecommendations(periodStart, periodEnd);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManagersLeaderboard,
  getEmployeesLeaderboard,
  getAllManagers,
  submitFeedbackToManager,
  getDepartments,
  getManagersByDepartment,
  getEmployeesWithStatus,
  assignEmployeeToManager,
  deallocateEmployee,
  createUser,
  getPromotionCandidates,
  getTrainingRecommendations,
};

