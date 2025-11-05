# Huong dan Phat trien

## Moi truong Phat trien

### Yeu cau He thong

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis >= 6.0
- Git

### Cau hinh Moi truong

1. **Clone repository**

```bash
git clone <repository-url>
cd internship-recruitment-platform/backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Cau hinh environment variables**

```bash
cp .env.example .env
# Edit .env file with your configuration
```

4. **Start MongoDB va Redis**

```bash
# MongoDB (neu su dung local)
mongod

# Redis (neu su dung local)
redis-server
```

5. **Run database migrations** (neu co)

```bash
npm run migrate
```

6. **Start development server**

```bash
npm run dev
```

## Cau truc Du an

### Thu muc Quan trong

```
src/
├── presentation/     # API Layer
├── application/      # CQRS Layer
├── domain/          # Business Logic
└── infrastructure/  # External Services

tests/               # Unit & Integration Tests
docs/               # Documentation
```

### Quy tac Dat ten

- **Files**: PascalCase cho classes, camelCase cho functions
- **Folders**: kebab-case
- **Constants**: UPPER_SNAKE_CASE
- **Variables**: camelCase

## Quy trinh Phat trien

### 1. Tao Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Implement Feature

#### a. Domain Layer First

```javascript
// 1. Tao Entity
class Job {
  constructor(props) {
    // Business logic here
  }
}

// 2. Tao Repository Interface
class IJobRepository {
  async findById(id) {
    /* abstract */
  }
  async save(job) {
    /* abstract */
  }
}
```

#### b. Application Layer

```javascript
// 3. Tao Command
class CreateJobCommand {
  constructor(data) {
    this.title = data.title;
    this.description = data.description;
  }
}

// 4. Tao Command Handler
class CreateJobCommandHandler {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async handle(command) {
    const job = new Job(command);
    return await this.jobRepository.save(job);
  }
}
```

#### c. Infrastructure Layer

```javascript
// 5. Implement Repository
class JobRepository extends IJobRepository {
  async save(job) {
    const jobModel = new JobModel(job);
    return await jobModel.save();
  }
}
```

#### d. Presentation Layer

```javascript
// 6. Tao Controller
const createJob = async (req, res) => {
  const command = new CreateJobCommand(req.body);
  const result = await cqrsBus.sendCommand(command);
  res.status(201).json(result);
};

// 7. Tao Route
router.post('/jobs', createJob);
```

### 3. Write Tests

```javascript
describe('CreateJobCommandHandler', () => {
  it('should create job successfully', async () => {
    // Arrange
    const mockRepository = { save: jest.fn() };
    const handler = new CreateJobCommandHandler(mockRepository);

    // Act
    const command = new CreateJobCommand({ title: 'Test Job' });
    await handler.handle(command);

    // Assert
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/domain/job/CreateJobCommandHandler.test.js

# Run with coverage
npm run test:coverage
```

### 5. Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check (neu co TypeScript)
npm run type-check
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add job creation feature

- Add Job entity with business rules
- Implement CreateJobCommand and handler
- Add JobRepository implementation
- Create job creation API endpoint
- Add unit tests for all components"
```

## Coding Standards

### JavaScript/Node.js Best Practices

#### 1. ES6+ Features

```javascript
// Use arrow functions
const getUser = async id => {
  return await userRepository.findById(id);
};

// Use destructuring
const { name, email } = user;

// Use async/await
const createUser = async userData => {
  try {
    const user = new User(userData);
    return await userRepository.save(user);
  } catch (error) {
    throw new ValidationError('Invalid user data');
  }
};
```

#### 2. Error Handling

```javascript
// Use custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Handle errors properly
const controllerMethod = async (req, res) => {
  try {
    const result = await service.method(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### 3. Validation

```javascript
// Use Joi or similar for input validation
const createJobSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).required(),
  salary: Joi.number().min(0),
});

const validateCreateJob = (req, res, next) => {
  const { error } = createJobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
```

### Database Best Practices

#### 1. Schema Design

```javascript
const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ company: 1, createdAt: -1 });
```

#### 2. Repository Pattern

```javascript
class JobRepository {
  async findById(id) {
    return await JobModel.findById(id).populate('company');
  }

  async findByCompany(companyId, options = {}) {
    const { page = 1, limit = 10 } = options;
    return await JobModel.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
  }

  async save(job) {
    const jobDoc = new JobModel(job);
    return await jobDoc.save();
  }
}
```

### API Design

#### 1. RESTful Conventions

```javascript
// GET /api/jobs - List jobs
// GET /api/jobs/:id - Get job by ID
// POST /api/jobs - Create job
// PUT /api/jobs/:id - Update job
// DELETE /api/jobs/:id - Delete job
```

#### 2. Response Format

```javascript
// Success response
res.status(200).json({
  success: true,
  data: job,
  message: 'Job created successfully',
});

// Error response
res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: error.details,
});

// Paginated response
res.status(200).json({
  success: true,
  data: jobs,
  pagination: {
    page: 1,
    limit: 10,
    total: 50,
    pages: 5,
  },
});
```

#### 3. Authentication & Authorization

```javascript
// Protect route middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Authorize role middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
```

## Testing Guidelines

### Unit Tests

```javascript
describe('Job Entity', () => {
  it('should create job with valid data', () => {
    const jobData = {
      title: 'Software Engineer',
      description: 'Great job opportunity',
    };

    const job = new Job(jobData);

    expect(job.title).toBe(jobData.title);
    expect(job.description).toBe(jobData.description);
  });

  it('should throw error for invalid title', () => {
    expect(() => {
      new Job({ title: 'A' }); // Too short
    }).toThrow('Job title must be at least 5 characters');
  });
});
```

### Integration Tests

```javascript
describe('Job Creation API', () => {
  it('should create job via API', async () => {
    const jobData = {
      title: 'Test Job',
      description: 'Test description',
      companyId: 'company-id',
    };

    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(jobData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(jobData.title);
  });
});
```

## Debugging

### Logging

```javascript
// Use structured logging
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});

// Log errors with context
logger.error('Failed to create job', {
  error: error.message,
  jobData: req.body,
  userId: req.user?.id,
});
```

### Debug Mode

```javascript
// Use debug package for development
const debug = require('debug')('app:job-controller');

const createJob = async (req, res) => {
  debug('Creating job with data:', req.body);

  try {
    const job = await jobService.createJob(req.body);
    debug('Job created successfully:', job.id);

    res.status(201).json(job);
  } catch (error) {
    debug('Error creating job:', error);
    res.status(500).json({ error: error.message });
  }
};
```

## Performance Optimization

### Database Queries

```javascript
// Use select to limit fields
const user = await User.findById(id).select('name email');

// Use lean() for read-only operations
const users = await User.find().lean();

// Use indexes effectively
UserSchema.index({ email: 1 }); // For login
UserSchema.index({ createdAt: -1 }); // For recent users
```

### Caching

```javascript
// Cache expensive operations
const cache = require('memory-cache');

const getPopularJobs = async () => {
  const cacheKey = 'popular-jobs';
  let jobs = cache.get(cacheKey);

  if (!jobs) {
    jobs = await jobRepository.findPopular();
    cache.put(cacheKey, jobs, 300000); // Cache for 5 minutes
  }

  return jobs;
};
```

### API Optimization

```javascript
// Implement pagination
const getJobs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const jobs = await jobRepository.findPaginated({ page, limit });
  const total = await jobRepository.count();

  res.json({
    data: jobs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};
```

## Deployment

### Environment Variables

```bash
# .env file
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/app_prod
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database connections tested
- [ ] Redis cache configured
- [ ] SSL certificates installed
- [ ] Monitoring tools set up
- [ ] Backup strategy implemented
- [ ] Error logging configured
- [ ] Performance monitoring enabled

---

_Generated on: October 30, 2025_
