# Use Case Architecture

## Overview

This application layer follows a **Use Case Pattern** architecture, which provides a clean and consistent way to organize business logic. Each use case represents a specific business operation that can be executed independently.

## Structure

```
src/application/
├── [domain]/
│   ├── use-cases/
│   │   ├── [UseCaseName].js
│   │   └── index.js
│   ├── repositories/
│   │   └── [RepositoryName].js
│   └── index.js
└── base/
    ├── UseCase.js
    └── Repository.js
```

## Use Case Pattern

### Base Use Case Class

All use cases extend from the base `UseCase` class:

```javascript
const { UseCase } = require('../base');

class ExampleUseCase extends UseCase {
  constructor(repository) {
    super();
    this.repository = repository;
  }

  async execute(input) {
    // Business logic implementation
    return await this.repository.save(input);
  }
}

module.exports = ExampleUseCase;
```

### Key Principles

1. **Single Responsibility**: Each use case handles one specific business operation
2. **Dependency Injection**: Dependencies are injected through constructor
3. **Async Execution**: All use cases return promises
4. **Input Validation**: Input validation happens at use case level
5. **Error Handling**: Business errors are thrown as exceptions

### Use Case Naming Convention

- Use descriptive names that clearly indicate the business operation
- Follow PascalCase naming (e.g., `CreateJobPostUseCase`, `GetUserProfileUseCase`)
- End with `UseCase` suffix for clarity

## Dependency Injection

Use cases are instantiated in the DI container (`src/infrastructure/config/diContainer.js`) with their required dependencies:

```javascript
const {
  CreateJobPostUseCase,
} = require('../application/recruitment/use-cases');

const createJobPostUseCase = new CreateJobPostUseCase(
  getJobPostRepository(),
  getUserRepository(),
  getNotificationService()
);
```

## Controller Integration

Controllers import use cases from the DI container and execute them:

```javascript
const {
  createJobPostUseCase,
} = require('../infrastructure/config/diContainer');

class JobPostController {
  async createJobPost(req, res) {
    try {
      const result = await createJobPostUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

## Benefits

1. **Testability**: Easy to unit test with mocked dependencies
2. **Maintainability**: Clear separation of concerns
3. **Reusability**: Use cases can be reused across different controllers
4. **Consistency**: Uniform pattern across all business operations
5. **Clean Architecture**: Proper layering with dependency inversion

## Migration from CQRS

This architecture replaces the previous CQRS (Command Query Responsibility Segregation) pattern with a simpler, more maintainable Use Case approach. The CQRS patterns (commands, queries, handlers) have been removed in favor of unified use cases that handle both read and write operations.

## Domains

- **Identity**: User authentication and authorization
- **Recruitment**: Job posting and application management
- **AI-NLP**: AI-powered candidate matching
- **Master Data**: Reference data management
- **Notification**: System notifications
- **Profile**: User profile management
- **Skill Development**: Learning and skill tracking</content>
  <parameter name="filePath">D:\KhoaLuan_Internship\internship-recruitment-platform\backend\src\application\README.md
