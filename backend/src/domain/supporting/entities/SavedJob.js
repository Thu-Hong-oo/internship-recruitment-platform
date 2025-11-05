/**
 * SavedJob Entity
 * Domain: Supporting
 * Represents a job saved by a user for later reference
 */
class SavedJob {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.jobId = props.jobId;
    this.savedJobStatus = props.savedJobStatus;
    this.notes = props.notes || '';
    this.savedAt = props.savedAt;
    this.reminderDate = props.reminderDate;
    this.tags = props.tags || [];

    this.validate();
  }

  validate() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    if (!this.jobId) {
      throw new Error('Job ID is required');
    }
    if (!this.savedJobStatus) {
      throw new Error('Saved job status is required');
    }
  }

  isActive() {
    return this.savedJobStatus === 'ACTIVE';
  }

  isArchived() {
    return this.savedJobStatus === 'ARCHIVED';
  }

  archive() {
    this.savedJobStatus = 'ARCHIVED';
  }

  activate() {
    this.savedJobStatus = 'ACTIVE';
  }

  delete() {
    this.savedJobStatus = 'DELETED';
  }

  addNote(note) {
    this.notes += (this.notes ? '\n' : '') + note;
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }

  setReminder(date) {
    this.reminderDate = date;
  }

  clearReminder() {
    this.reminderDate = null;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      jobId: this.jobId,
      savedJobStatus: this.savedJobStatus,
      notes: this.notes,
      savedAt: this.savedAt,
      reminderDate: this.reminderDate,
      tags: this.tags,
      isActive: this.isActive()
    };
  }
}

module.exports = SavedJob;