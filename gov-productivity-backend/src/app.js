const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const fileService = require('./services/fileService');

const app = express();
const uploadDir = fileService.ensureUploadDir();
const allowedOrigins = (process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

// CORS configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In development, allow all origins to prevent CORS issues
      if (isDevelopment) {
        logger.info(`Allowing CORS request from origin: ${origin} (development mode)`);
        return callback(null, true);
      }
      logger.warn(`Blocked CORS request from disallowed origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadDir));

app.use('/api', routes);

// Handle favicon requests
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Government Productivity API',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
