const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

require('dotenv').config();

// Security & Performance middleware
const helmet = require('helmet');
const compression = require('compression');

// Rate limiting middleware
const {
  globalRateLimit,
  apiRateLimit,
  searchRateLimit,
  uploadRateLimit,
} = require('./src/middleware/globalRateLimit');

// Swagger documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Redis client
const { createClient } = require('redis');

// Core Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const adminRoutes = require('./src/routes/admin');
const employerRoutes = require('./src/routes/employerProfiles');

// Middleware & Utils
const errorHandler = require('./src/middleware/errorHandler');
const { logger } = require('./src/utils/logger');

// Socket.IO setup
const { setupSocket } = require('./src/socket');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Redis client setup
let redisClient = null;
let redisConnected = false;

const initializeRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        retry_strategy: options => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Redis connection refused, continuing without Redis');
            return false; // Stop retrying
          }
          return Math.min(options.attempt * 100, 3000);
        },
      });

      redisClient.on('error', err => {
        if (err.code === 'ECONNREFUSED') {
          logger.warn(
            'Redis connection refused, server will run without Redis'
          );
          redisConnected = false;
        } else {
          logger.error('Redis Client Error:', err);
        }
      });

      redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
        redisConnected = true;
      });

      await redisClient.connect();
    }
  } catch (error) {
    logger.warn(
      'Redis initialization failed, continuing without Redis:',
      error.message
    );
    redisConnected = false;
  }
};

// Database connection

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri)
      throw new Error('MONGO_URI environment variable is not defined');

    await mongoose.connect(mongoUri);

    logger.info('Database Connected Successfully');
  } catch (error) {
    logger.error('Database connection error:', error.message);

    process.exit(1);
  }
}

// Initialize database and Redis
connectDB();
initializeRedis().then(async () => {
  // Initialize OTP service after Redis is ready
  try {
    const {
      initializeRedisServices,
    } = require('./src/config/initializeServices');
    await initializeRedisServices();
    logger.info('OTP services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize OTP service:', error.message);
  }
});

// Security middleware
app.use(helmet());
app.use(compression());

// Global rate limiting - áp dụng cho tất cả requests
app.use(globalRateLimit);

// CORS configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI-Powered Internship Platform API',
      version: '1.0.0',
      description:
        'API for internship recruitment platform with AI-powered CV analysis and skill roadmap generation',
      contact: {
        name: 'Platform Support',
        email: 'support@intern-ai-platform.com',
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Interns', description: 'Intern profile management' },
        { name: 'Employers', description: 'Employer operations' },
        { name: 'Jobs', description: 'Internship posting management' },
        { name: 'Applications', description: 'Application processing' },
        { name: 'AI Analysis', description: 'CV and job matching analysis' },
        { name: 'Skills', description: 'Skill and roadmap management' },
      ],
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Internship Platform is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employers', employerRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Socket.IO
const io = setupSocket(server);

// Cron jobs for maintenance tasks
cron.schedule(
  '0 2 * * *',
  async () => {
    logger.info('Running daily maintenance tasks...');
    try {
      // Cleanup expired sessions/tokens
      // TODO: Implement session cleanup

      logger.info('Daily maintenance completed successfully');
    } catch (error) {
      logger.error('Daily maintenance task failed:', error);
    }
  },
  {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh',
  }
);

// Graceful shutdown
const gracefulShutdown = signal => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close MongoDB connection
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      // Close Redis connection
      if (redisClient && redisConnected) {
        await redisClient.quit();
        logger.info('Redis connection closed');
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  logger.info(`AI Internship Platform Server running on port ${PORT}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`Health Check: http://localhost:${PORT}/health`);

  if (!redisConnected) {
    logger.warn('Redis not connected - some features may be limited');
  }

  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing
module.exports = { app, server, redisClient, redisConnected };
