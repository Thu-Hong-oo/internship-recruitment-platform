/**
 * UnitOfWork
 * Application Layer - Base
 * Manages repositories and services for CQRS operations
 */
class UnitOfWork {
  constructor(repositories = {}, services = {}) {
    this.repositories = repositories;
    this.services = services;
  }

  /**
   * Get repository by name
   * @param {string} name - Repository name
   * @returns {Object} Repository instance
   */
  getRepository(name) {
    return this.repositories[name];
  }

  /**
   * Get service by name
   * @param {string} name - Service name
   * @returns {Object} Service instance
   */
  getService(name) {
    return this.services[name];
  }

  /**
   * Set repository
   * @param {string} name - Repository name
   * @param {Object} repository - Repository instance
   */
  setRepository(name, repository) {
    this.repositories[name] = repository;
  }

  /**
   * Set service
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   */
  setService(name, service) {
    this.services[name] = service;
  }

  /**
   * Begin transaction (if supported by underlying storage)
   */
  async beginTransaction() {
    // Implementation depends on the storage technology
    // For MongoDB, this might involve starting a session
  }

  /**
   * Commit transaction
   */
  async commit() {
    // Implementation depends on the storage technology
  }

  /**
   * Rollback transaction
   */
  async rollback() {
    // Implementation depends on the storage technology
  }

  /**
   * Dispose resources
   */
  async dispose() {
    // Clean up resources if needed
  }
}

module.exports = UnitOfWork;
