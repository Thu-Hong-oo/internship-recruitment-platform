/**
 * CQRS Bus for dispatching commands and queries to their handlers
 * Implements the Mediator pattern for CQRS
 * Tự động route đến handler phù hợp
 */
class CqrsBus {
  constructor() {
    this.commandHandlers = new Map();
    this.queryHandlers = new Map();
  }

  /**
   * Register a command handler
   * @param {string} commandType - The command type (class name)
   * @param {CommandHandler} handler - The handler instance
   */
  registerCommandHandler(commandType, handler) {
    this.commandHandlers.set(commandType, handler);
  }

  /**
   * Register a query handler
   * @param {string} queryType - The query type (class name)
   * @param {QueryHandler} handler - The handler instance
   */
  registerQueryHandler(queryType, handler) {
    this.queryHandlers.set(queryType, handler);
  }

  /**
   * Send a command to its handler
   * @param {Command} command - The command to send
   * @returns {Promise<any>} - Result from the handler
   */
  async send(command) {
    const commandType = command.getCommandType();
    const handler = this.commandHandlers.get(commandType);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandType}`);
    }

    return await handler.handle(command);
  }

  /**
   * Send a query to its handler
   * @param {Query} query - The query to send
   * @returns {Promise<any>} - Result from the handler
   */
  async query(query) {
    const queryType = query.getQueryType();
    const handler = this.queryHandlers.get(queryType);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryType}`);
    }

    return await handler.handle(query);
  }

  /**
   * Register multiple handlers at once
   * @param {Object} handlers - Object containing command and query handlers
   * @param {Object} handlers.commands - Command handlers {CommandType: HandlerInstance}
   * @param {Object} handlers.queries - Query handlers {QueryType: HandlerInstance}
   */
  registerHandlers(handlers) {
    if (handlers.commands) {
      Object.entries(handlers.commands).forEach(([commandType, handler]) => {
        this.registerCommandHandler(commandType, handler);
      });
    }

    if (handlers.queries) {
      Object.entries(handlers.queries).forEach(([queryType, handler]) => {
        this.registerQueryHandler(queryType, handler);
      });
    }
  }

  /**
   * Get registered command types
   * @returns {string[]}
   */
  getRegisteredCommands() {
    return Array.from(this.commandHandlers.keys());
  }

  /**
   * Get registered query types
   * @returns {string[]}
   */
  getRegisteredQueries() {
    return Array.from(this.queryHandlers.keys());
  }
}

module.exports = CqrsBus;
