/**
 * ProgressStatus Enum
 * Domain: Learning
 * Represents the progress status of a learning activity
 */
const ProgressStatus = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
  DROPPED: 'DROPPED'
});

module.exports = ProgressStatus;