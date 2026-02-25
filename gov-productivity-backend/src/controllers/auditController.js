const AuditLog = require('../models/AuditLog');

const listRecent = async (_req, res, next) => {
  try {
    const logs = await AuditLog.listRecent(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRecent,
};

