/**
 * ApplicationStatus Enum
 * Domain: Recruitment
 * Represents the status of a job application
 */
const ApplicationStatus = Object.freeze({
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  INTERVIEW: 'interview',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
});

module.exports = ApplicationStatus;
