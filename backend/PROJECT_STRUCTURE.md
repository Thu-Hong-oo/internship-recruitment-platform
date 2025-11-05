# 📂 Cấu trúc Thư mục Dự án - Internship Recruitment Platform

## 🏗️ Kiến trúc tổng quan

```
internship-recruitment-platform/
├── backend/
│   ├── src/
│   │   ├── application/           # Application Layer (Use Cases)
│   │   │   ├── [domain]/
│   │   │   │   ├── use-cases/     # Business Logic (Use Cases)
│   │   │   │   ├── repositories/  # Repository Interfaces
│   │   │   │   └── index.js       # Domain exports
│   │   │   ├── base/              # Base classes (UseCase, Repository)
│   │   │   ├── CqrsConfig.js      # ❌ REMOVED (CQRS pattern)
│   │   │   └── README.md          # Use Case documentation
│   │   ├── domain/                # Domain Layer (Entities, Value Objects)
│   │   │   ├── [domain]/
│   │   │   │   ├── entities/      # Domain Entities
│   │   │   │   ├── value-objects/ # Value Objects
│   │   │   │   └── index.js
│   │   │   └── shared/            # Shared domain concepts
│   │   ├── infrastructure/        # Infrastructure Layer
│   │   │   ├── config/
│   │   │   │   ├── diContainer.js # Dependency Injection Container
│   │   │   │   └── database.js    # Database configuration
│   │   │   ├── models/            # Database Models (MongoDB)
│   │   │   ├── repositories/      # Repository Implementations
│   │   │   ├── services/          # External Services (OTP, Email, etc.)
│   │   │   └── queue/             # Message Queue (Redis)
│   │   ├── presentation/          # Presentation Layer
│   │   │   ├── controllers/       # HTTP Controllers
│   │   │   ├── routes/            # Express Routes
│   │   │   ├── middlewares/       # Express Middlewares
│   │   │   ├── dtos/              # Data Transfer Objects
│   │   │   └── logs/              # Request/Response Logs
│   │   └── shared/                # Shared utilities
│   │       ├── utils/             # Utility functions
│   │       └── constants/         # Application constants
│   ├── tests/                     # Test suites
│   │   ├── unit/                  # Unit tests
│   │   │   ├── application/       # Use Case tests
│   │   │   ├── domain/            # Domain tests
│   │   │   └── infrastructure/    # Infrastructure tests
│   │   ├── integration/           # Integration tests
│   │   ├── e2e/                   # End-to-end tests
│   │   ├── fixtures/              # Test data fixtures
│   │   ├── helpers/               # Test helpers
│   │   └── unit/                  # Unit test utilities
│   ├── docs/                      # Documentation
│   │   ├── API_DOCUMENTATION.md   # API docs
│   │   ├── ARCHITECTURE_GUIDE.md  # Architecture guide
│   │   ├── DATABASE_SCHEMA.md     # Database schema
│   │   ├── DEPLOYMENT_GUIDE.md    # Deployment guide
│   │   ├── DEVELOPMENT_GUIDE.md   # Development guide
│   │   ├── DOMAIN_MODELS.md       # Domain models
│   │   ├── FREE_TIER_SETUP.md     # Free tier setup
│   │   └── TESTING_GUIDE.md       # Testing guide
│   ├── examples/                  # Code examples
│   │   ├── domain-model-usage.js  # Domain usage examples
│   │   └── README.md              # Examples guide
│   ├── postman/                   # API Testing Collections
│   │   ├── *.postman_collection.json
│   │   ├── postman_environment.json
│   │   └── README.md
│   ├── diagram/                   # Architecture Diagrams
│   │   ├── *.puml                 # PlantUML diagrams
│   │   └── *.png                  # Generated diagrams
│   ├── logs/                      # Application logs
│   ├── server.js                  # Main application entry
│   ├── jest.config.js             # Jest testing configuration
│   ├── package.json               # Node.js dependencies
│   ├── API_ENDPOINTS_COMPLETE.md  # Complete API endpoints
│   ├── API_ENDPOINTS_STRUCTURE.md # Current API structure
│   └── README.md                  # Project README
├── docker/                        # Docker configurations
├── kubernetes/                    # Kubernetes manifests
├── terraform/                     # Infrastructure as Code
└── scripts/                       # Build/Deploy scripts
```

## 📋 Chi tiết từng Layer

### 🎯 Application Layer (`src/application/`)

**Mô tả:** Chứa business logic theo Use Case pattern

```
application/
├── [domain]/                      # Domain-specific use cases
│   ├── use-cases/                 # Use Case implementations
│   │   ├── *.js                   # Execute business operations
│   │   └── index.js               # Export all use cases
│   ├── repositories/              # Repository interfaces/contracts
│   │   └── *.js                   # Abstract data access methods
│   └── index.js                   # Domain exports
├── base/                          # Base classes
│   ├── UseCase.js                 # Base Use Case class
│   └── Repository.js              # Base Repository class
└── README.md                      # Use Case documentation
```

### 🏛️ Domain Layer (`src/domain/`)

**Mô tả:** Chứa domain entities và business rules

```
domain/
├── [domain]/                      # Bounded contexts
│   ├── entities/                  # Domain entities
│   │   └── *.js                   # Entity classes with business rules
│   ├── value-objects/             # Value objects
│   │   └── *.js                   # Immutable value objects
│   └── index.js                   # Domain exports
└── shared/                        # Cross-domain concepts
    ├── entities/                  # Shared entities
    └── value-objects/             # Shared value objects
```

### 🔧 Infrastructure Layer (`src/infrastructure/`)

**Mô tả:** Chứa implementation details (database, external services)

```
infrastructure/
├── config/                        # Configuration files
│   ├── diContainer.js             # Dependency injection container
│   └── database.js                # Database connection config
├── models/                        # Database models (MongoDB schemas)
│   └── *.js                       # Mongoose models
├── repositories/                  # Repository implementations
│   └── *.js                       # Concrete data access classes
├── services/                      # External service integrations
│   ├── otpService.js              # OTP service
│   ├── emailService.js            # Email service
│   └── notificationService.js     # Push notifications
└── queue/                         # Message queue implementations
    └── redisQueue.js              # Redis-based queue
```

### 🌐 Presentation Layer (`src/presentation/`)

**Mô tả:** Chứa HTTP API và user interface concerns

```
presentation/
├── controllers/                   # HTTP request handlers
│   └── *.js                       # Express controllers
├── routes/                        # Route definitions
│   ├── index.js                   # Main router
│   └── *.js                       # Feature-specific routes
├── middlewares/                   # Express middlewares
│   ├── auth.js                    # Authentication middleware
│   └── validation.js              # Request validation
├── dtos/                          # Data transfer objects
│   └── *.js                       # Request/Response DTOs
└── logs/                          # HTTP request logs
```

### 🔄 Shared Layer (`src/shared/`)

**Mô tả:** Chứa utilities và constants dùng chung

```
shared/
├── utils/                         # Utility functions
│   ├── logger.js                  # Logging utility
│   ├── validator.js               # Validation helpers
│   └── crypto.js                  # Cryptography utilities
└── constants/                     # Application constants
    ├── roles.js                   # User roles
    ├── status.js                  # Status constants
    └── messages.js                # Response messages
```

## 📊 Thống kê cấu trúc

| Layer              | Files | Description                             |
| ------------------ | ----- | --------------------------------------- |
| **Application**    | ~50+  | Use Cases, Repository interfaces        |
| **Domain**         | ~30+  | Entities, Value Objects, Business Rules |
| **Infrastructure** | ~40+  | Database models, Services, Queue        |
| **Presentation**   | ~35+  | Controllers, Routes, Middlewares        |
| **Shared**         | ~15+  | Utilities, Constants                    |
| **Tests**          | ~60+  | Unit, Integration, E2E tests            |
| **Docs**           | 10+   | Documentation files                     |

## 🔄 Data Flow Architecture

```
HTTP Request
    ↓
Presentation Layer (Routes → Controllers → DTOs)
    ↓
Application Layer (Use Cases)
    ↓
Domain Layer (Entities → Business Rules)
    ↓
Infrastructure Layer (Repositories → Models → Database)
    ↓
External Services (Redis, Email, OTP, etc.)
```

## 🏗️ Architectural Patterns Used

- **Clean Architecture** - Layered architecture
- **Use Case Pattern** - Business logic organization
- **Repository Pattern** - Data access abstraction
- **Dependency Injection** - Loose coupling
- **CQRS** - ❌ Removed (simplified to Use Cases only)
- **Domain-Driven Design** - Domain modeling

## 📝 Development Guidelines

### File Naming Conventions

- **Use Cases:** `*.js` (e.g., `CreateJobUseCase.js`)
- **Entities:** `*.js` (e.g., `Job.js`)
- **Controllers:** `*Controller.js` (e.g., `jobPostController.js`)
- **Routes:** `*.js` (e.g., `jobPost.js`)
- **Models:** `*.js` (e.g., `JobModel.js`)

### Code Organization

- **One class per file** (except index.js exports)
- **Index.js files** for clean imports
- **Consistent folder structure** across domains
- **Separation of concerns** between layers

### Testing Strategy

- **Unit tests** for Use Cases and Entities
- **Integration tests** for Controllers and Routes
- **E2E tests** for complete user journeys
- **Test fixtures** for consistent test data

---

_Tạo ngày: November 4, 2025_
_Architecture: Clean Architecture with Use Case Pattern_</content>
<parameter name="filePath">D:\KhoaLuan_Internship\internship-recruitment-platform\backend\PROJECT_STRUCTURE.md
