// src/domain/recruitment/value-objects/SalaryRange.js

class SalaryRange {
  constructor(min, max, currency = 'VND') {
    this.min = min;
    this.max = max;
    this.currency = currency;
  }

  getRange() {
    return `${this.min} - ${this.max} ${this.currency}`;
  }

  isValid() {
    return this.min >= 0 && this.max >= this.min;
  }
}

module.exports = SalaryRange;
