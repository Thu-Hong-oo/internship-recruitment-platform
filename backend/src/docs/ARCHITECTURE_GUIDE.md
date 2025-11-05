# Huong dan Kien truc He thong

## Tong quan Kien truc

He thong Internship Recruitment Platform su dung **Clean Architecture** voi CQRS pattern, chia thanh 4 tang chinh:

### 1. Presentation Layer (Tang Trinh bay)

- **Chuc nang**: Xu ly HTTP request/response, validation, authentication
- **Thanh phan**:
  - Controllers: Xu ly request va tra ve response
  - Routes: Dinh nghia API endpoints
  - Middlewares: Authentication, validation, rate limiting
  - DTOs: Data Transfer Objects

### 2. Application Layer (Tang Ung dung)

- **Chuc nang**: Orchestrate business logic, implement CQRS pattern
- **Thanh phan**:
  - Commands: Write operations (Create, Update, Delete)
  - Queries: Read operations (Get, List, Search)
  - Command Handlers: Xu ly commands
  - Query Handlers: Xu ly queries
  - CQRS Bus: Dieu phoi commands va queries

### 3. Domain Layer (Tang Domain)

- **Chuc nang**: Chua business logic core, entities, business rules
- **Thanh phan**:
  - Entities: Business objects voi identity va behavior
  - Value Objects: Immutable data structures
  - Domain Services: Business logic khong thuoc ve entity nao
  - Repository Interfaces: Contracts cho data access
  - Domain Events: Su kien domain

### 4. Infrastructure Layer (Tang Infrastructure)

- **Chuc nang**: Implement external concerns, data persistence
- **Thanh phan**:
  - Repository Implementations: Thuc thi data access
  - External Services: Email, file storage, payment gateways
  - Database Models: Mongoose schemas
  - Configuration: Environment variables, connection strings

## Luong xu ly Request

```
Client Request
       ↓
Presentation Layer
  - Route matching
  - Middleware processing
  - Request validation
       ↓
Application Layer
  - Command/Query creation
  - CQRS Bus routing
  - Handler execution
       ↓
Domain Layer
  - Business rule validation
  - Entity creation/modification
  - Domain event publishing
       ↓
Infrastructure Layer
  - Data persistence
  - External service calls
  - Response formatting
       ↓
Response to Client
```

## CQRS Pattern

### Commands (Write Operations)

```javascript
// Command
class CreateJobCommand {
  constructor(data) {
    this.title = data.title;
    this.description = data.description;
    this.companyId = data.companyId;
  }
}

// Command Handler
class CreateJobCommandHandler {
  constructor(jobRepository, eventPublisher) {
    this.jobRepository = jobRepository;
    this.eventPublisher = eventPublisher;
  }

  async handle(command) {
    // Business logic
    const job = new Job(command);
    await this.jobRepository.save(job);

    // Publish domain event
    await this.eventPublisher.publish(new JobCreatedEvent(job.id));

    return job;
  }
}
```

### Queries (Read Operations)

```javascript
// Query
class GetJobsQuery {
  constructor(filters) {
    this.page = filters.page || 1;
    this.limit = filters.limit || 10;
    this.search = filters.search;
  }
}

// Query Handler
class GetJobsQueryHandler {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async handle(query) {
    return await this.jobRepository.findJobs(query);
  }
}
```

## Dependency Injection

He thong su dung dependency injection de manage dependencies:

```javascript
// Trong Application Layer
class JobApplicationService {
  constructor(jobRepository, candidateRepository) {
    this.jobRepository = jobRepository;
    this.candidateRepository = candidateRepository;
  }
}

// Trong Infrastructure Layer
const jobRepository = new JobRepository();
const candidateRepository = new CandidateRepository();
const jobApplicationService = new JobApplicationService(
  jobRepository,
  candidateRepository
);
```

## Domain Models

### Entities

- Co identity (ID) duy nhat
- Co lifecycle va state
- Chua business logic
- Validation business rules

```javascript
class Job {
  constructor(props) {
    this.id = props.id;
    this.title = props.title;
    this.validateTitle();
  }

  validateTitle() {
    if (!this.title || this.title.length < 5) {
      throw new Error('Job title must be at least 5 characters');
    }
  }

  updateTitle(newTitle) {
    this.title = newTitle;
    this.validateTitle();
  }
}
```

### Value Objects

- Immutable
- Khong co identity
- So sanh theo gia tri
- Co thể share

```javascript
class Email {
  constructor(value) {
    this.value = value;
    this.validate();
  }

  validate() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new Error('Invalid email format');
    }
  }

  equals(other) {
    return this.value === other.value;
  }
}
```

## Repository Pattern

### Repository Interface (Domain Layer)

```javascript
class IJobRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async save(job) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }
}
```

### Repository Implementation (Infrastructure Layer)

```javascript
class JobRepository extends IJobRepository {
  constructor(jobModel) {
    this.jobModel = jobModel;
  }

  async findById(id) {
    return await this.jobModel.findById(id);
  }

  async save(job) {
    const jobDoc = new this.jobModel(job);
    return await jobDoc.save();
  }

  async findAll() {
    return await this.jobModel.find({});
  }
}
```

## Error Handling

He thong su dung centralized error handling:

```javascript
// Domain Errors
class BusinessRuleViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessRuleViolationError';
    this.statusCode = 400;
  }
}

// Application Errors
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Infrastructure Errors
class DatabaseConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.statusCode = 500;
  }
}
```

## Testing Strategy

### Unit Tests

- Test cac domain entities va services
- Mock external dependencies
- Test business logic

### Integration Tests

- Test interaction giua cac layers
- Test repository implementations
- Test external service integrations

### E2E Tests

- Test full request/response cycle
- Test API endpoints
- Test user workflows

## Performance Considerations

### Caching Strategy

- Redis cho session va temporary data
- In-memory cache cho static data
- Database query result caching

### Database Optimization

- Proper indexing
- Connection pooling
- Query optimization
- Read/write separation

### API Optimization

- Rate limiting
- Request compression
- Pagination
- Response caching

---

_Generated on: October 30, 2025_
