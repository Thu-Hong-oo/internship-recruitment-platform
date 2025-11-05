# Cấu trúc Source Code Chuẩn - Clean Architecture + CQRS

## 📁 Cấu trúc thư mục đề xuất

```
src/
├── application/           # Application Layer (Use Cases, Commands, Queries)
│   ├── commands/         # Command DTOs (Data Transfer Objects)
│   ├── queries/          # Query DTOs
│   ├── use-cases/        # Business Logic Orchestration
│   ├── handlers/         # Command/Query Handlers (nếu dùng CQRS thuần)
│   └── repositories/     # Repository Interfaces
│
├── domain/               # Domain Layer (Business Rules)
│   ├── entities/         # Domain Entities
│   ├── services/         # Domain Services
│   ├── value-objects/    # Value Objects
│   └── events/           # Domain Events
│
├── infrastructure/       # Infrastructure Layer
│   ├── repositories/     # Repository Implementations
│   ├── services/         # External Services (Email, File, etc.)
│   ├── config/           # Database, External APIs config
│   └── persistence/      # Database models/schemas
│
├── presentation/         # Presentation Layer
│   ├── controllers/      # HTTP Controllers
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # Route definitions
│   ├── dtos/             # Data Transfer Objects
│   └── validators/       # Request validators
│
└── shared/               # Shared Kernel
    ├── utils/            # Utility functions
    ├── exceptions/       # Custom exceptions
    ├── interfaces/       # Common interfaces
    └── constants/        # Constants
```

## 🎯 Cách tiếp cận đề xuất: Clean Architecture với Use Cases

### Tại sao không dùng CQRS thuần?

1. **Đơn giản hơn**: Ít boilerplate code
2. **Dễ hiểu**: Use Cases rõ ràng về business logic
3. **Phù hợp với hệ thống CRUD**: Hầu hết operations đều có read/write

### Cấu trúc Use Case chuẩn

```javascript
// application/use-cases/CreateJobUseCase.js
class CreateJobUseCase {
  constructor(jobRepository, employerRepository, validationService) {
    this.jobRepository = jobRepository;
    this.employerRepository = employerRepository;
    this.validationService = validationService;
  }

  async execute(input) {
    // 1. Validate input
    // 2. Check business rules
    // 3. Execute business logic
    // 4. Return result
  }
}
```

### Cấu trúc Repository Interface

```javascript
// application/repositories/IJobRepository.js
class IJobRepository {
  async create(jobData) {
    throw new Error('Not implemented');
  }
  async findById(id) {
    throw new Error('Not implemented');
  }
  async findAll(filter) {
    throw new Error('Not implemented');
  }
  async update(id, data) {
    throw new Error('Not implemented');
  }
  async delete(id) {
    throw new Error('Not implemented');
  }
}
```

### Cấu trúc Controller chuẩn

```javascript
// presentation/controllers/JobController.js
class JobController {
  constructor(createJobUseCase, getJobUseCase, updateJobUseCase) {
    this.createJobUseCase = createJobUseCase;
    this.getJobUseCase = getJobUseCase;
    this.updateJobUseCase = updateJobUseCase;
  }

  async createJob(req, res) {
    const result = await this.createJobUseCase.execute({
      employerId: req.user.employerId,
      jobData: req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }
}
```

## 🔄 Dependency Injection Container

```javascript
// infrastructure/config/diContainer.js
const { CreateJobUseCase } = require('../../application/use-cases');
const { JobRepository } = require('../repositories');

class DIContainer {
  constructor() {
    this.jobRepository = new JobRepository();
    this.createJobUseCase = new CreateJobUseCase(this.jobRepository);
  }

  getCreateJobUseCase() {
    return this.createJobUseCase;
  }
}

module.exports = new DIContainer();
```

## 📋 Naming Conventions

### Use Cases:

- `CreateJobUseCase` - Tạo job mới
- `GetJobUseCase` - Lấy job theo ID
- `GetAllJobsUseCase` - Lấy danh sách jobs
- `UpdateJobUseCase` - Cập nhật job
- `DeleteJobUseCase` - Xóa job

### Repositories:

- `IJobRepository` - Interface
- `JobRepository` - Implementation

### Controllers:

- `JobController` - HTTP handlers cho jobs
- `AuthController` - Authentication handlers

## ✅ Lợi ích của cấu trúc này

1. **Separation of Concerns**: Mỗi layer có trách nhiệm riêng
2. **Testability**: Dễ mock dependencies
3. **Maintainability**: Dễ thay đổi implementation
4. **Scalability**: Dễ mở rộng features
5. **Readability**: Code dễ đọc, dễ hiểu

## 🚀 Migration Plan từ cấu trúc hiện tại

1. **Giữ lại Use Cases** (đã tốt)
2. **Xóa Commands/Queries** (redundant)
3. **Đơn giản hóa Controllers** (inject use cases qua constructor)
4. **Cập nhật DI Container** (register use cases)
5. **Refactor Handlers** (nếu có) thành Use Cases

Bạn có muốn tôi giúp refactor theo cấu trúc này không?
