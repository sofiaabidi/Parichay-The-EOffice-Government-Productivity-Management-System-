const userService = require('../services/userService');

const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getUserProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

const getManagerTeam = async (req, res, next) => {
  try {
    const data = await userService.getManagerTeam(req.user.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getEmployeePeers = async (req, res, next) => {
  try {
    const peers = await userService.getEmployeePeers(req.user.id);
    console.log(`[getEmployeePeers] User ${req.user.id} (${req.user.email}): Found ${peers.length} peers`);
    res.json({ members: peers });
  } catch (error) {
    console.error(`[getEmployeePeers] Error for user ${req.user.id}:`, error);
    next(error);
  }
};

const getDepartmentLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await userService.getDepartmentLeaderboard(req.user.id);
    res.json(leaderboard);
  } catch (error) {
    console.error(`[getDepartmentLeaderboard] Error for user ${req.user.id}:`, error);
    next(error);
  }
};

const getMyTrainings = async (req, res, next) => {
  try {
    const trainings = await userService.getTrainings(req.user.id);
    res.json(trainings);
  } catch (error) {
    next(error);
  }
};

const getMyRecognitions = async (req, res, next) => {
  try {
    const recognitions = await userService.getRecognitions(req.user.id);
    res.json(recognitions);
  } catch (error) {
    next(error);
  }
};

const getMySkills = async (req, res, next) => {
  try {
    const skills = await userService.getSkills(req.user.id);
    res.json(skills);
  } catch (error) {
    next(error);
  }
};

const addSkill = async (req, res, next) => {
  try {
    const record = await userService.addSkill(req.body, req.user.id);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    const removed = await userService.removeSkill(Number(req.params.skillId), req.user);
    if (!removed) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getMyBadges = async (req, res, next) => {
  try {
    const badges = await userService.getBadges(req.user.id);
    res.json(badges);
  } catch (error) {
    next(error);
  }
};

const addBadge = async (req, res, next) => {
  try {
    const badge = await userService.addBadge(req.body, req.user.id);
    res.status(201).json(badge);
  } catch (error) {
    next(error);
  }
};

const addTraining = async (req, res, next) => {
  try {
    const record = await userService.addTraining(req.body, req.user.id);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

const addRecognition = async (req, res, next) => {
  try {
    const record = await userService.addRecognition(req.body, req.user.id);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getManagerTeam,
  getEmployeePeers,
  getDepartmentLeaderboard,
  getMyTrainings,
  getMyRecognitions,
  getMySkills,
  addSkill,
  deleteSkill,
  getMyBadges,
  addBadge,
  addTraining,
  addRecognition,
};
