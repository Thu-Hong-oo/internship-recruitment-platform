/**
 * UserStatus Enum
 * Domain: Identity
 * Represents the status of a user account
 */
const UserStatus = Object.freeze({
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
});

module.exports = UserStatus;
