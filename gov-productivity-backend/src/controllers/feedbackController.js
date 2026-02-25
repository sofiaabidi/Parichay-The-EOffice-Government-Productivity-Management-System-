const feedbackService = require('../services/feedbackService');

const addTaskFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.addFeedback(
      Number(req.params.taskId),
      req.user.id,
      req.body.toUserId || req.body.employeeId,
      req.body,
    );
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

const addPeerFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.addPeerFeedback(
      req.user.id,
      req.body.toUserId,
      req.body,
    );
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

const addManagerFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.addManagerFeedback(
      req.user.id,
      req.body.employeeId,
      req.body,
    );
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.getFeedbackForUser(req.user.id);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addTaskFeedback,
  addPeerFeedback,
  addManagerFeedback,
  getMyFeedback,
};

