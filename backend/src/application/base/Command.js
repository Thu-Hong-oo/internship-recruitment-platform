/**
 * Base Command class for CQRS pattern
 * Commands represent actions that change the state of the system
 */
class Command {
  constructor(data = {}) {
    this.id = data.id || require('crypto').randomUUID();
    this.timestamp = data.timestamp || new Date();
    this.metadata = data.metadata || {};
  }

  /**
   * Validate command data
   * @returns {boolean}
   */
  validate() {
    return true; // // Validation method (override)
  }

  /**
   * Get command type name
   * @returns {string}
   */
  getCommandType() {
    return this.constructor.name;
  }
}

module.exports = Command;
