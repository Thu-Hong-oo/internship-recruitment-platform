// src/domain/recruitment/JobPosting.js
const JobType = require('./JobType');
const JobStatus = require('./JobStatus');

class JobPosting {
  constructor(jobId, title, description, companyId) {
    this.jobId = jobId;
    this.title = title;
    this.description = description;
    this.companyId = companyId;
    this.salaryMin = null;
    this.salaryMax = null;
    this.location = '';
    this.jobType = JobType.FULL_TIME;
    this.status = JobStatus.DRAFT;
    this.postedAt = null;
  }

  publish() {
    if (this.status !== JobStatus.DRAFT) {
      throw new Error('Only draft jobs can be published');
    }
    this.status = JobStatus.PUBLISHED;
    this.postedAt = new Date();
  }

  close() {
    this.status = JobStatus.CLOSED;
  }

  updateDetails(title, description) {
    if (title) this.title = title;
    if (description) this.description = description;
  }

  isPublished() {
    return this.status === JobStatus.PUBLISHED;
  }

  isActive() {
    return this.status === JobStatus.PUBLISHED;
  }
}

module.exports = JobPosting;
