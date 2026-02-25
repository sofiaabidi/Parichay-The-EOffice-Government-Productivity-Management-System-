const notificationService = require('../services/notificationService');

const listNotifications = async (req, res, next) => {
  try {
    const requestedLimit = req.query.limit ? Number(req.query.limit) : undefined;
    const notifications = await notificationService.listNotifications(req.user.id, {
      unreadOnly: req.query.unreadOnly === 'true',
      limit: Number.isFinite(requestedLimit) ? requestedLimit : undefined,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

const markNotificationsRead = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    const result = await notificationService.markAsRead(req.user.id, ids);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markNotificationsRead,
};


