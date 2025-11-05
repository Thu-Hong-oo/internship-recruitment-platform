const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cron = require('node-cron'); //Lên lịch task định kỳ (maintenance)
const path = require('path');

require('dotenv').config();

// Security & Performance middleware
const helmet = require('helmet');
const compression = require('compression'); //Nén response để tối ưu performance

// Rate limiting middleware
const {
  globalRateLimit,
  apiRateLimit,
  searchRateLimit,
  uploadRateLimit,
} = require('./src/presentation/middlewares/globalRateLimit');

// Swagger documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Redis client
const { createClient } = require('redis');

// Core Routes - All Domains
const apiRoutes = require('./src/presentation/routes');

// Middleware & Utils
const {
  errorHandler,
  notFound,
  asyncHandler,
} = require('./src/presentation/middlewares/errorHandler');
const { logger } = require('./src/shared/utils/logger');
const corsMiddleware = require('./src/presentation/middlewares/cors');
const {
  createSecurityMiddleware,
} = require('./src/presentation/middlewares/security');
const {
  generalLimiter,
  authLimiter,
} = require('./src/presentation/middlewares/rateLimiter');
const {
  requestId,
  responseTime,
  accessLogger,
  errorLogger,
} = require('./src/presentation/middlewares/logger');

// Socket.IO setup
const { setupSocket } = require('./src/presentation/websocket/socket');

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
// Initialize Redis and then initialize Redis-backed services (OTP). Pass the
// already-connected redis client to avoid creating a second client and extra
// connection overhead during startup.
initializeRedis().then(async () => {
  // Initialize OTP service after Redis is ready
  try {
    const {
      initializeRedisServices,
    } = require('./src/infrastructure/config/initializeServices');
    await initializeRedisServices(redisClient);
    console.log('OTP services initialized successfully');

    // Initialize identity use cases after OTP services are ready
    const {
      initializeIdentityUseCases,
    } = require('./src/infrastructure/config/diContainer');
    initializeIdentityUseCases();
    console.log('Identity use cases initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error.message);
  }
});

// Security middleware
app.use(helmet());
app.use(compression());

// Request ID and response time
app.use(requestId);
app.use(responseTime);

// Logging
app.use(accessLogger);
app.use(errorLogger);

// Security middleware
const securityMiddleware = createSecurityMiddleware(
  process.env.NODE_ENV || 'development'
);
app.use(securityMiddleware);

// Global rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving (removed for Identity domain only)
// app.use('/templates', express.static(path.join(__dirname, 'public/templates')));

// 🔧 FIX: Add timeout handling for all API routes
app.use('/api', (req, res, next) => {
  // Increase timeout for all API endpoints
  req.setTimeout(60000); // 1 minute
  res.setTimeout(60000); // 1 minute

  // Add timeout headers
  res.setHeader('Keep-Alive', 'timeout=60, max=1000');
  res.setHeader('Connection', 'keep-alive');

  console.log(`API request: ${req.method} ${req.path}`);

  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`API request completed in ${duration}ms`);
  });

  next();
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Recruitment Platform API',
      version: '1.0.0',
      description:
        'Complete API for Smart Recruitment Platform - AI-powered candidate-job matching with NLP capabilities',
      contact: {
        name: 'Platform Support',
        email: 'support@intern-ai-platform.com',
      },
      tags: [
        { name: 'Auth', description: 'Authentication and user management' },
        { name: 'Candidates', description: 'Candidate profile management' },
        { name: 'Employers', description: 'Employer profile management' },
        { name: 'Jobs', description: 'Job posting and management' },
        { name: 'Applications', description: 'Job application management' },
        { name: 'Skills', description: 'Skills and master data management' },
        { name: 'Roadmaps', description: 'Skill development roadmaps' },
        { name: 'Notifications', description: 'Notification management' },
        { name: 'Chat', description: 'Real-time messaging' },
        { name: 'Admin', description: 'Administrative functions' },
        { name: 'AI/NLP', description: 'AI-powered matching and NLP services' },
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
  apis: ['./src/presentation/routes/*.js', './src/presentation/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Nền tảng Tuyển dụng Thông minh đang chạy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    domains: [
      'Identity',
      'Recruitment',
      'Profile',
      'Master Data',
      'Notification',
      'Skill Development',
      'AI/NLP',
    ],
    features: [
      'User Authentication & OAuth',
      'Candidate Profile Management',
      'Employer Profile Management',
      'Job Posting & Management',
      'Job Application Processing',
      'AI-Powered Candidate-Job Matching',
      'CV/Resume Parsing with NLP',
      'Skill Gap Analysis',
      'Skill Development Roadmaps',
      'Real-time Notifications',
      'Chat & Messaging',
      'Master Data Management',
      'Administrative Functions',
      'OTP Services',
      'Google OAuth Integration',
    ],
  });
});

// API Routes - All Domains
app.use('/api', apiRoutes);

// 404 handler
app.use('*', notFound);

// Error handling middleware
app.use(errorHandler);

// Initialize Socket.IO
const io = setupSocket(server);

// Cron jobs for maintenance tasks (All domains)
cron.schedule(
  '0 2 * * *',
  async () => {
    logger.info('Running daily maintenance tasks for all domains...');
    try {
      // Cleanup expired OTPs and tokens (Identity domain)
      // TODO: Implement OTP cleanup using Identity domain services

      // Cleanup expired job postings (Recruitment domain)
      // TODO: Implement job posting cleanup using Recruitment domain services

      // Cleanup old notifications (Notification domain)
      // TODO: Implement notification cleanup using Notification domain services

      // Update skill development progress (Skill Development domain)
      // TODO: Implement progress updates using Skill Development domain services

      // Refresh AI/NLP model caches (AI/NLP domain)
      // TODO: Implement cache refresh using AI/NLP domain services

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
  logger.info(`Smart Recruitment Platform Server running on port ${PORT}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`Health Check: http://localhost:${PORT}/health`);
  logger.info(`Available API endpoints:`);
  logger.info(`   AUTHENTICATION:`);
  logger.info(`    - POST /api/auth/register`);
  logger.info(`    - POST /api/auth/login`);
  logger.info(`    - POST /api/auth/login/google`);
  logger.info(`    - POST /api/auth/verify-email`);
  logger.info(`    - POST /api/auth/forgot-password`);
  logger.info(`    - POST /api/auth/reset-password`);
  logger.info(` CANDIDATES:`);
  logger.info(`    - GET /api/candidates`);
  logger.info(`    - POST /api/candidates`);
  logger.info(`    - GET /api/candidates/:id`);
  logger.info(`    - PUT /api/candidates/:id`);
  logger.info(`  EMPLOYERS:`);
  logger.info(`    - GET /api/employers`);
  logger.info(`    - POST /api/employers`);
  logger.info(`    - GET /api/employers/:id`);
  logger.info(`    - PUT /api/employers/:id`);
  logger.info(`  JOBS:`);
  logger.info(`    - GET /api/jobs`);
  logger.info(`    - POST /api/jobs`);
  logger.info(`    - GET /api/jobs/:id`);
  logger.info(`    - PUT /api/jobs/:id`);
  logger.info(`  APPLICATIONS:`);
  logger.info(`    - GET /api/applications`);
  logger.info(`    - POST /api/applications`);
  logger.info(`    - PUT /api/applications/:id`);
  logger.info(`  AI/NLP:`);
  logger.info(`    - POST /api/ai/match`);
  logger.info(`    - GET /api/ai/matching-history`);
  logger.info(`    - POST /api/ai/parse-cv`);
  logger.info(`    - POST /api/ai/parse-job-description`);
  logger.info(`  SKILLS & ROADMAPS:`);
  logger.info(`    - GET /api/skills`);
  logger.info(`    - GET /api/roadmaps`);
  logger.info(`    - POST /api/roadmaps`);
  logger.info(`  NOTIFICATIONS:`);
  logger.info(`    - GET /api/notifications`);
  logger.info(`    - POST /api/notifications/mark-read`);
  logger.info(`  CHAT:`);
  logger.info(`    - GET /api/chat/rooms`);
  logger.info(`    - POST /api/chat/messages`);
  logger.info(`  ADMIN:`);
  logger.info(`    - GET /api/admin/dashboard`);
  logger.info(`    - GET /api/admin/users`);

  if (!redisConnected) {
    logger.warn('Redis not connected - OTP features may be limited');
  }

  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(
    `Platform Features: AI-Powered Matching, NLP Processing, Skill Development`
  );
});

// Export for testing
module.exports = { app, server, redisClient, redisConnected };
