const app = require('./app');
const connectDB = require('./database/connection');
const config = require('./config');
const logger = require('./utils/logger');

// Handle uncaught exceptions BEFORE starting
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 NexusMail API running on port ${config.port} [${config.nodeEnv}]`);
    logger.info(`📋 Health check: http://localhost:${config.port}/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Process terminated.');
    });
  });
};

startServer();
