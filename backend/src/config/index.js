require('dotenv').config();

/**
 * Centralized Configuration Management
 * All environment variables and application settings
 */
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || '1.0.0',
  },

  // Database Configuration
  database: {
    mongoUri: process.env.MONGO_URI,
    redisUrl: process.env.REDIS_URL,
  },

  // Authentication & Security
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // External Services
  external: {
    // Email Service
    email: {
      fromName: process.env.EMAIL_FROM_NAME,
      fromAddress: process.env.EMAIL_FROM_ADDRESS,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
    },

    // Cloudinary
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },

    // Google AI
    googleAI: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
    },

    // Frontend URL
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  },

  // Feature Flags
  features: {
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
    enableRedisCaching: process.env.ENABLE_REDIS_CACHING !== 'false',
  },

  // Validation Rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    email: {
      maxLength: 254,
    },
  },
};

/**
 * Validate required environment variables
 */
const validateConfig = () => {
  const requiredVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate URLs
  if (
    config.database.mongoUri &&
    !config.database.mongoUri.startsWith('mongodb')
  ) {
    throw new Error('MONGO_URI must be a valid MongoDB connection string');
  }

  if (
    config.database.redisUrl &&
    !config.database.redisUrl.startsWith('redis://')
  ) {
    throw new Error('REDIS_URL must be a valid Redis connection string');
  }
};

/**
 * Get configuration for specific environment
 */
const getEnvConfig = () => {
  const env = config.server.nodeEnv;

  switch (env) {
    case 'production':
      return {
        ...config,
        logging: { ...config.logging, level: 'warn' },
        rateLimit: { ...config.rateLimit, max: 1000 },
      };

    case 'test':
      return {
        ...config,
        logging: { ...config.logging, level: 'error' },
        database: {
          ...config.database,
          mongoUri:
            process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test',
        },
      };

    default: // development
      return {
        ...config,
        logging: { ...config.logging, level: 'debug' },
      };
  }
};

// Validate configuration on module load
validateConfig();

// Export environment-specific configuration
module.exports = getEnvConfig();
