/**
 * SavedJob Domain Entity
 *
 * Represents a job saved by a candidate for later reference.
 * Contains save metadata, notes, and reminder information.
 *
 * Following Clean Architecture principles:
 * - No dependencies on infrastructure layer
 * - Business logic encapsulated within entity
 * - Constructor accepts only required fields
 * - Optional fields set to null (not undefined)
 * - No default values in constructor
 */
class SavedJob {
  constructor(
    savedJobId,
    candidateId,
    jobId,
    notes = null,
    tags = null,
    reminderDate = null,
    savedAt = null,
    createdAt = null,
    updatedAt = null
  ) {
    // Required fields
    this.savedJobId = savedJobId;
    this.candidateId = candidateId;
    this.jobId = jobId;

    // Optional fields
    this.notes = notes;
    this.tags = tags; // Array of tags
    this.reminderDate = reminderDate;

    // Timestamps
    this.savedAt = savedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validates the saved job entity
   * @throws {Error} if validation fails
   */
  validate() {
    if (!this.candidateId) {
      throw new Error('Candidate ID is required');
    }
    if (!this.jobId) {
      throw new Error('Job ID is required');
    }
  }

  /**
   * Adds or updates notes
   * @param {string} notes - Notes text
   */
  addNotes(notes) {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  /**
   * Removes notes
   */
  removeNotes() {
    this.notes = null;
    this.updatedAt = new Date();
  }

  /**
   * Adds a tag
   * @param {string} tag - Tag to add
   */
  addTag(tag) {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  /**
   * Removes a tag
   * @param {string} tag - Tag to remove
   */
  removeTag(tag) {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag);
      this.updatedAt = new Date();
    }
  }

  /**
   * Sets reminder date
   * @param {Date} date - Reminder date
   */
  setReminder(date) {
    this.reminderDate = date;
    this.updatedAt = new Date();
  }

  /**
   * Removes reminder
   */
  removeReminder() {
    this.reminderDate = null;
    this.updatedAt = new Date();
  }

  /**
   * Checks if reminder is set
   * @returns {boolean} True if reminder is set
   */
  hasReminder() {
    return this.reminderDate !== null;
  }

  /**
   * Checks if reminder is due
   * @returns {boolean} True if reminder date has passed
   */
  isReminderDue() {
    if (!this.reminderDate) return false;
    return new Date() >= new Date(this.reminderDate);
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
      isActive: this.isActive(),
    };
  }
}

module.exports = SavedJob;
