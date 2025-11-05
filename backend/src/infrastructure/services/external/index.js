/**
 * External Services - Main Export File
 * Centralized export for all external services organized by category
 *
 * Usage:
 * const { core, ai, cvResume, matching, career } = require('./services/external');
 * const EmailService = core.EmailService;
 * const GeminiAIService = ai.GeminiAIService;
 */

module.exports = {
  // Core infrastructure services
  core: require('./core'),

  // AI-powered services
  ai: require('./ai'),

  // CV and Resume processing services
  cvResume: require('./cv-resume'),

  // Job and skill matching services
  matching: require('./matching'),

  // Career guidance services
  career: require('./career'),

  // Direct exports for backward compatibility (optional)
  EmailService: require('./core/EmailService'),
  JWTService: require('./core/JWTService'),
  GoogleAuthService: require('./core/GoogleAuthService'),
  OTPService: require('./core/OTPService'),
  OTPCooldownService: require('./core/OTPCooldownService'),
  UnifiedUploadService: require('./core/UnifiedUploadService'),
  QueueService: require('./core/QueueService'),
  SocketService: require('./core/SocketService'),
  GeminiAIService: require('./ai/GeminiAIService'),
};
