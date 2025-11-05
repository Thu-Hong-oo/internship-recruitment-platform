/**
 * LearningDuration Value Object
 * Domain: Learning
 * Represents a duration for learning activities
 */
class LearningDuration {
  constructor(props) {
    this.hours = props.hours || 0;
    this.minutes = props.minutes || 0;

    this.validate();
    this.normalize();
  }

  validate() {
    if (this.hours < 0) {
      throw new Error('Hours cannot be negative');
    }
    if (this.minutes < 0) {
      throw new Error('Minutes cannot be negative');
    }
  }

  normalize() {
    // Convert excess minutes to hours
    const totalMinutes = this.hours * 60 + this.minutes;
    this.hours = Math.floor(totalMinutes / 60);
    this.minutes = totalMinutes % 60;
  }

  getTotalMinutes() {
    return this.hours * 60 + this.minutes;
  }

  getTotalHours() {
    return this.hours + (this.minutes / 60);
  }

  add(other) {
    if (!(other instanceof LearningDuration)) {
      throw new Error('Can only add LearningDuration objects');
    }

    return new LearningDuration({
      hours: this.hours + other.hours,
      minutes: this.minutes + other.minutes
    });
  }

  subtract(other) {
    if (!(other instanceof LearningDuration)) {
      throw new Error('Can only subtract LearningDuration objects');
    }

    const thisTotal = this.getTotalMinutes();
    const otherTotal = other.getTotalMinutes();

    if (thisTotal < otherTotal) {
      throw new Error('Cannot subtract larger duration from smaller one');
    }

    const resultMinutes = thisTotal - otherTotal;
    return new LearningDuration({
      hours: Math.floor(resultMinutes / 60),
      minutes: resultMinutes % 60
    });
  }

  multiply(factor) {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative');
    }

    const totalMinutes = Math.round(this.getTotalMinutes() * factor);
    return new LearningDuration({
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    });
  }

  equals(other) {
    return other instanceof LearningDuration &&
           this.hours === other.hours &&
           this.minutes === other.minutes;
  }

  compareTo(other) {
    if (!(other instanceof LearningDuration)) {
      throw new Error('Can only compare with LearningDuration objects');
    }

    const thisTotal = this.getTotalMinutes();
    const otherTotal = other.getTotalMinutes();

    if (thisTotal > otherTotal) return 1;
    if (thisTotal < otherTotal) return -1;
    return 0;
  }

  toString() {
    if (this.hours === 0) {
      return `${this.minutes}m`;
    } else if (this.minutes === 0) {
      return `${this.hours}h`;
    } else {
      return `${this.hours}h ${this.minutes}m`;
    }
  }

  toJSON() {
    return {
      hours: this.hours,
      minutes: this.minutes,
      totalMinutes: this.getTotalMinutes(),
      totalHours: this.getTotalHours(),
      formatted: this.toString()
    };
  }
}

module.exports = LearningDuration;