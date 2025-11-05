/**
 * JobStatus Enum
 * Domain: Recruitment
 * Represents the status of a job posting
 */
const JobStatus = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
});

module.exports = JobStatus;
