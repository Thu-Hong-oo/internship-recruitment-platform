# Testing Guide

## Tong quan

He thong su dung Jest va Supertest cho testing. Co 3 loai test: Unit, Integration va E2E.

## Cau truc Testing

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
├── fixtures/      # Test data
└── helpers/       # Test utilities
```

## Unit Tests

### Service Layer Testing

```javascript
// tests/unit/services/userService.test.js
const UserService = require('../../../src/application/identity/services/UserService');
const UserRepository = require('../../../src/infrastructure/repositories/UserRepository');

jest.mock('../../../src/infrastructure/repositories/UserRepository');

describe('UserService', () => {
  let userService;
  let mockUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    UserRepository.mockImplementation(() => mockUserRepository);
    userService = new UserService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      const expectedUser = {
        _id: 'userId123',
        ...userData,
        role: 'CANDIDATE',
        status: 'PENDING_VERIFICATION',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await userService.createUser(userData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userData.email
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        role: 'CANDIDATE',
        status: 'PENDING_VERIFICATION',
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      mockUserRepository.findByEmail.mockResolvedValue({ _id: 'existingId' });

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        _id: 'userId123',
        email: 'test@example.com',
        password: '$2a$10$hashedPassword',
        status: 'ACTIVE',
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);

      const result = await userService.authenticateUser(loginData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginData.email
      );
      expect(result).toEqual(user);
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.authenticateUser(loginData)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });
});
```

### Domain Model Testing

```javascript
// tests/unit/domain/User.test.js
const User = require('../../../src/domain/identity/User');
const { UserStatus, UserRole } = require('../../../src/domain/identity/enums');

describe('User Domain Model', () => {
  describe('User Creation', () => {
    it('should create user with valid data', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.CANDIDATE,
      };

      const user = new User(userData);

      expect(user.email).toBe(userData.email);
      expect(user.fullName).toBe(userData.fullName);
      expect(user.role).toBe(UserRole.CANDIDATE);
      expect(user.status).toBe(UserStatus.PENDING_VERIFICATION);
    });

    it('should throw error for invalid email', () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
      };

      expect(() => new User(userData)).toThrow('Invalid email format');
    });

    it('should throw error for weak password', () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
      };

      expect(() => new User(userData)).toThrow(
        'Password must be at least 8 characters'
      );
    });
  });

  describe('User Status Transitions', () => {
    let user;

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });
    });

    it('should activate user', () => {
      user.activate();

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.emailVerified).toBe(true);
    });

    it('should suspend user', () => {
      user.suspend();

      expect(user.status).toBe(UserStatus.SUSPENDED);
    });

    it('should not allow activation of suspended user', () => {
      user.suspend();

      expect(() => user.activate()).toThrow('Cannot activate suspended user');
    });
  });

  describe('Password Management', () => {
    let user;

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });
    });

    it('should verify correct password', async () => {
      const isValid = await user.verifyPassword('password123');

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await user.verifyPassword('wrongpassword');

      expect(isValid).toBe(false);
    });

    it('should change password', async () => {
      const newPassword = 'newpassword123';

      await user.changePassword('password123', newPassword);

      const isValid = await user.verifyPassword(newPassword);
      expect(isValid).toBe(true);
    });
  });
});
```

## Integration Tests

### API Integration Testing

```javascript
// tests/integration/routes/authRoutes.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/presentation/http/app');
const User = require('../../../src/infrastructure/models/User');
const { setupTestDB, teardownTestDB } = require('../helpers/testSetup');

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.fullName).toBe(userData.fullName);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      // Create first user
      await request(app).post('/api/auth/register').send(userData).expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      await request(app).post('/api/auth/register').send(userData);
    });

    it('should login with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
```

### Database Integration Testing

```javascript
// tests/integration/repositories/userRepository.test.js
const UserRepository = require('../../../src/infrastructure/repositories/UserRepository');
const User = require('../../../src/infrastructure/models/User');
const { setupTestDB, teardownTestDB } = require('../helpers/testSetup');

describe('UserRepository', () => {
  let userRepository;

  beforeAll(async () => {
    await setupTestDB();
    userRepository = new UserRepository();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        fullName: 'Test User',
        role: 'CANDIDATE',
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.fullName).toBe(userData.fullName);
      expect(user._id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        fullName: 'Test User',
      };

      await userRepository.create(userData);
      const user = await userRepository.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        fullName: 'Test User',
      };

      const user = await userRepository.create(userData);
      const updateData = { fullName: 'Updated Name' };

      const updatedUser = await userRepository.update(user._id, updateData);

      expect(updatedUser.fullName).toBe(updateData.fullName);
      expect(updatedUser.updatedAt).toBeDefined();
    });
  });
});
```

## E2E Tests

### Full User Journey Testing

```javascript
// tests/e2e/userJourney.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/presentation/http/app');
const User = require('../../../src/infrastructure/models/User');
const Job = require('../../../src/infrastructure/models/Job');
const Application = require('../../../src/infrastructure/models/Application');
const { setupTestDB, teardownTestDB } = require('../helpers/testSetup');

describe('User Journey E2E', () => {
  let candidateToken;
  let employerToken;
  let candidateId;
  let employerId;
  let jobId;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should complete candidate registration and login', async () => {
      const registerData = {
        email: 'candidate@example.com',
        password: 'password123',
        fullName: 'Test Candidate',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      candidateId = registerResponse.body.data.user._id;

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      candidateToken = loginResponse.body.data.token;
    });

    it('should complete employer registration and login', async () => {
      const registerData = {
        email: 'employer@example.com',
        password: 'password123',
        fullName: 'Test Employer',
        role: 'EMPLOYER',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      employerId = registerResponse.body.data.user._id;

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      employerToken = loginResponse.body.data.token;
    });
  });

  describe('Job Creation and Application Flow', () => {
    beforeEach(async () => {
      // Setup users and tokens (assuming above tests passed)
      // ... setup code ...
    });

    it('should create a job posting', async () => {
      const jobData = {
        title: 'Software Engineer Intern',
        description: 'Great internship opportunity',
        location: 'Ho Chi Minh City',
        type: 'INTERNSHIP',
        experience: 'ENTRY',
        requirements: ['JavaScript', 'Node.js'],
        benefits: ['Mentorship', 'Learning opportunities'],
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      jobId = response.body.data.job._id;
    });

    it('should apply for a job', async () => {
      const applicationData = {
        coverLetter: 'I am very interested in this position...',
      };

      const response = await request(app)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.status).toBe('PENDING');
    });

    it('should retrieve applications for employer', async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.applications)).toBe(true);
      expect(response.body.data.applications.length).toBe(1);
    });
  });
});
```

## Test Utilities

### Test Database Setup

```javascript
// tests/helpers/testSetup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

const teardownTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

const clearCollections = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearCollections,
};
```

### Test Data Factories

```javascript
// tests/fixtures/userFactory.js
const faker = require('faker');

const createUserData = (overrides = {}) => {
  return {
    email: faker.internet.email(),
    password: 'password123',
    fullName: faker.name.findName(),
    role: 'CANDIDATE',
    status: 'ACTIVE',
    ...overrides,
  };
};

const createJobData = (companyId, overrides = {}) => {
  return {
    title: faker.name.jobTitle(),
    description: faker.lorem.paragraphs(3),
    company: companyId,
    location: faker.address.city(),
    type: 'FULL_TIME',
    experience: 'ENTRY',
    requirements: [faker.random.word(), faker.random.word()],
    benefits: [faker.random.words(2), faker.random.words(2)],
    status: 'ACTIVE',
    ...overrides,
  };
};

module.exports = {
  createUserData,
  createJobData,
};
```

### Mock Services

```javascript
// tests/helpers/mockServices.js
const mockQueueService = {
  addJob: jest.fn().mockResolvedValue({ id: 'jobId' }),
  getJob: jest.fn().mockResolvedValue({ id: 'jobId', finished: true }),
  removeJob: jest.fn().mockResolvedValue(true),
};

const mockEmailService = {
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendJobApplicationEmail: jest.fn().mockResolvedValue(true),
};

const mockFileUploadService = {
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://example.com/file.pdf',
    publicId: 'fileId',
  }),
  deleteFile: jest.fn().mockResolvedValue(true),
};

module.exports = {
  mockQueueService,
  mockEmailService,
  mockFileUploadService,
};
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/presentation/http/app.js',
    '!src/config/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
```

### Test Setup File

```javascript
// tests/setup.js
const { setupTestDB, teardownTestDB } = require('./helpers/testSetup');

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

// Mock external services
jest.mock('../src/infrastructure/services/EmailService');
jest.mock('../src/infrastructure/services/FileUploadService');
jest.mock('../src/infrastructure/queue/QueueService');

// Global test utilities
global.testUtils = {
  generateToken: payload => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
  },

  createAuthenticatedRequest: token => {
    return {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
  },
};
```

## Running Tests

### Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:ci": "jest --coverage --watchAll=false"
  }
}
```

### Test Execution Examples

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test tests/unit/services/userService.test.js

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration
```

## Best Practices

### Test Structure

- Arrange-Act-Assert pattern
- One assertion per test
- Descriptive test names
- Proper setup and teardown

### Mocking Strategy

- Mock external dependencies
- Use spies for internal methods
- Avoid mocking domain logic

### Coverage Goals

- 80% code coverage minimum
- Focus on critical business logic
- Cover error paths and edge cases

### Performance Testing

```javascript
// tests/performance/apiPerformance.test.js
const request = require('supertest');
const app = require('../../../src/presentation/http/app');

describe('API Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    const promises = Array(10)
      .fill()
      .map(() => request(app).get('/api/jobs'));

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });
});
```

---

_Generated on: October 30, 2025_
