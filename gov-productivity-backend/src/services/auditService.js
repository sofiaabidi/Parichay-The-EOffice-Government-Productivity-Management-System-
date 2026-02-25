const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const logAction = async (userId, action, entityType, entityId, metadata = {}) => {
  try {
    await AuditLog.logAction({ userId, action, entityType, entityId, metadata });
  } catch (error) {
    logger.warn('Failed to write audit log', { error: error.message });
  }
};

module.exports = {
  logAction,
};

