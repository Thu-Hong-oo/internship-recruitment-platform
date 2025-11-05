// src/domain/recruitment/entities/JobSaving.js

class JobSaving {
  constructor(savingId, userId, jobId, savedAt = new Date()) {
    this.savingId = savingId;
    this.userId = userId;
    this.jobId = jobId;
    this.savedAt = savedAt;
  }

  save() {
    // Logic to save job
  }

  unsave() {
    // Logic to unsave job
  }
}

module.exports = JobSaving;
