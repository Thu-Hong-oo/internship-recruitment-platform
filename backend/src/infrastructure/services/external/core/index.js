/**
 * Core External Services - Export all core infrastructure services
 * These are fundamental services for authentication, communication, and storage
 */

module.exports = {
  // Authentication & Authorization
  JWTService: require('./JWTService'),
  GoogleAuthService: require('./GoogleAuthService'),
  OTPService: require('./OTPService'),
  OTPCooldownService: require('./OTPCooldownService'),

  // Communication
  EmailService: require('./EmailService'),
  SocketService: require('./SocketService'),

  // Storage & File Management
  UnifiedUploadService: require('./UnifiedUploadService'),

  // Queue Management
  QueueService: require('./QueueService'),
};
