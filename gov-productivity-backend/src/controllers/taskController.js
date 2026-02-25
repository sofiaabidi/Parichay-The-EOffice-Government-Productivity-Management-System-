const taskService = require('../services/taskService');

const createTask = async (req, res, next) => {
  try {
    console.log('[Task Controller] Creating task with payload:', {
      ...req.body,
      skillIds: req.body.skillIds,
      skillIdsType: typeof req.body.skillIds,
      skillIdsIsArray: Array.isArray(req.body.skillIds),
    });
    const task = await taskService.createTask(req.body, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getMyTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const task = await taskService.updateTaskStatus(
      Number(req.params.id),
      req.body.status,
      req.user.id,
      req.body.completedAt,
      req.body.feedback, // Include feedback data for rejections
    );
    res.json(task);
  } catch (error) {
    next(error);
  }
};

const getTeamTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getTeamTasks(req.user.id, req.query.status);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getMyTasks,
  updateStatus,
  getTeamTasks,
};

