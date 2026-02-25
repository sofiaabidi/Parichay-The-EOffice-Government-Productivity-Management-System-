const milestoneService = require('../services/milestoneService');

const createMilestone = async (req, res, next) => {
  try {
    const milestone = await milestoneService.createMilestone(
      Number(req.params.projectId),
      req.body,
      req.user.id
    );
    res.status(201).json(milestone);
  } catch (error) {
    next(error);
  }
};

const getMilestones = async (req, res, next) => {
  try {
    const milestones = await milestoneService.getMilestonesByProject(Number(req.params.projectId));
    res.json(milestones);
  } catch (error) {
    next(error);
  }
};

const updateMilestone = async (req, res, next) => {
  try {
    const milestone = await milestoneService.updateMilestone(
      Number(req.params.id),
      req.body,
      req.user.id
    );
    res.json(milestone);
  } catch (error) {
    next(error);
  }
};

const deleteMilestone = async (req, res, next) => {
  try {
    await milestoneService.deleteMilestone(Number(req.params.id), req.user.id);
    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMilestone,
  getMilestones,
  updateMilestone,
  deleteMilestone,
};

