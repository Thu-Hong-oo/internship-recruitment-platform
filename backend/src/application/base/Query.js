/**
 * Base Query class for CQRS pattern
 * Queries represent read operations that don't change state
 */
class Query {
  constructor(data = {}) {
    this.id = data.id || require('crypto').randomUUID();
    this.timestamp = data.timestamp || new Date();
    this.metadata = data.metadata || {};
  }

  /**
   * Validate query data
   * @returns {boolean}
   */
  validate() {
    return true;
  }

  /**
   * Get query type name
   * @returns {string}
   */
  getQueryType() {
    return this.constructor.name;
  }
}

module.exports = Query;
