/**
 * Jest Configuration
 * Testing framework configuration for the internship recruitment platform
 */
module.exports = {
  // Root directory
  rootDir: __dirname,

  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['<rootDir>/tests/**/*.test.js', '<rootDir>/tests/**/*.spec.js'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
};
