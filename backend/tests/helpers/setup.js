/**
 * Jest Setup File
 * Global test setup and configuration
 */

// Load environment variables for testing
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external dependencies
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 1,
    on: jest.fn(),
    once: jest.fn(),
    close: jest.fn(),
  },
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    virtual: jest.fn(),
    index: jest.fn(),
    methods: {},
    statics: {},
  })),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn().mockImplementation(id => ({ toString: () => id })),
  },
}));

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
  }))
);

// Mock external APIs
jest.mock('@google/generative-ai');
jest.mock('openai');
jest.mock('nodemailer');

// Global test utilities
global.testUtils = {
  // Generate test IDs
  generateId: () => Math.random().toString(36).substr(2, 9),

  // Create mock user
  createMockUser: (overrides = {}) => ({
    _id: global.testUtils.generateId(),
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'candidate',
    isVerified: true,
    ...overrides,
  }),

  // Create mock job
  createMockJob: (overrides = {}) => ({
    _id: global.testUtils.generateId(),
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Great job opportunity',
    requirements: ['JavaScript', 'Node.js'],
    ...overrides,
  }),

  // Create mock candidate profile
  createMockCandidate: (overrides = {}) => ({
    _id: global.testUtils.generateId(),
    userId: global.testUtils.generateId(),
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: '2 years',
    education: 'Bachelor in Computer Science',
    ...overrides,
  }),

  // Clean up after each test
  cleanup: async () => {
    // Add cleanup logic here
    jest.clearAllMocks();
  },
};

// Setup and teardown
beforeAll(async () => {
  // Global setup
});

afterAll(async () => {
  // Global cleanup
});

beforeEach(async () => {
  // Per-test setup
});

afterEach(async () => {
  // Per-test cleanup
  await global.testUtils.cleanup();
});
