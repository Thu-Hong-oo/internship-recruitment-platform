const winston = require('winston');

// Lazy-loaded logger to avoid initialization issues
let logger = null;

const getLogger = () => {
  if (!logger) {
    try {
      logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'internship-ai-platform' },
        transports: [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      });

      if (process.env.NODE_ENV !== 'production') {
        logger.add(
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          })
        );
      }
    } catch (error) {
      // If logger creation fails, create a simple console logger
      logger = {
        info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
        error: (message, meta) =>
          console.error(`[ERROR] ${message}`, meta || ''),
        warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
        debug: (message, meta) => console.log(`[DEBUG] ${message}`, meta || ''),
      };
    }
  }
  return logger;
};

// Safe logger wrapper
const safeLogger = {
  info: (message, meta) => {
    try {
      getLogger().info(message, meta);
    } catch (error) {
      console.log(`[INFO] ${message}`, meta || '');
    }
  },
  error: (message, meta) => {
    try {
      getLogger().error(message, meta);
    } catch (error) {
      console.error(`[ERROR] ${message}`, meta || '');
    }
  },
  warn: (message, meta) => {
    try {
      getLogger().warn(message, meta);
    } catch (error) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  },
  debug: (message, meta) => {
    try {
      getLogger().debug(message, meta);
    } catch (error) {
      console.log(`[DEBUG] ${message}`, meta || '');
    }
  },
};

module.exports = { logger: safeLogger };
