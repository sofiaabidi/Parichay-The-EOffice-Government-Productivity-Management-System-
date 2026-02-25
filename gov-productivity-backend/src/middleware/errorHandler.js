const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  logger.error('Request failed', { status, message: err.message, stack: err.stack });
  res.status(status).json({
    message: err.message || 'Internal server error',
    details: err.details || null,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};