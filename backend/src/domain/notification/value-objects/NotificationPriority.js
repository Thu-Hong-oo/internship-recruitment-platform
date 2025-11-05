/**
 * NotificationPriority Value Object
 * Domain: Notification
 * Represents the priority level of a notification
 */
class NotificationPriority {
  constructor(props) {
    this.level = props.level || 'NORMAL';
    this.weight = props.weight || 0;
    this.retryAttempts = props.retryAttempts || 0;
    this.expirationHours = props.expirationHours || 24;

    this.validate();
  }

  validate() {
    const validLevels = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    if (!validLevels.includes(this.level)) {
      throw new Error('Invalid priority level');
    }
    if (this.weight < 0 || this.weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }
    if (this.retryAttempts < 0) {
      throw new Error('Retry attempts cannot be negative');
    }
    if (this.expirationHours < 1) {
      throw new Error('Expiration hours must be at least 1');
    }
  }

  static LOW() {
    return new NotificationPriority({
      level: 'LOW',
      weight: 10,
      retryAttempts: 1,
      expirationHours: 72
    });
  }

  static NORMAL() {
    return new NotificationPriority({
      level: 'NORMAL',
      weight: 50,
      retryAttempts: 3,
      expirationHours: 24
    });
  }

  static HIGH() {
    return new NotificationPriority({
      level: 'HIGH',
      weight: 80,
      retryAttempts: 5,
      expirationHours: 12
    });
  }

  static URGENT() {
    return new NotificationPriority({
      level: 'URGENT',
      weight: 100,
      retryAttempts: 10,
      expirationHours: 1
    });
  }

  isLow() {
    return this.level === 'LOW';
  }

  isNormal() {
    return this.level === 'NORMAL';
  }

  isHigh() {
    return this.level === 'HIGH';
  }

  isUrgent() {
    return this.level === 'URGENT';
  }

  compareTo(other) {
    if (!(other instanceof NotificationPriority)) {
      throw new Error('Can only compare with NotificationPriority objects');
    }

    if (this.weight > other.weight) return 1;
    if (this.weight < other.weight) return -1;
    return 0;
  }

  getExpirationDate(fromDate = new Date()) {
    const expirationDate = new Date(fromDate);
    expirationDate.setHours(expirationDate.getHours() + this.expirationHours);
    return expirationDate;
  }

  equals(other) {
    return other instanceof NotificationPriority &&
           this.level === other.level &&
           this.weight === other.weight &&
           this.retryAttempts === other.retryAttempts &&
           this.expirationHours === other.expirationHours;
  }

  toJSON() {
    return {
      level: this.level,
      weight: this.weight,
      retryAttempts: this.retryAttempts,
      expirationHours: this.expirationHours,
      isUrgent: this.isUrgent()
    };
  }
}

module.exports = NotificationPriority;