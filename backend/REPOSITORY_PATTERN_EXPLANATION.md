# Repository Pattern - Giải Thích Chi Tiết

## 🎯 Tại sao NÊN dùng IndustryRepository?

### 1. **Clean Architecture (Kiến trúc sạch)**

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                 │
│      (Controllers, Routes, DTOs)            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         Application Layer                   │
│    (Services, Use Cases, Business Logic)    │ ← IndustryService
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          Domain Layer                       │
│     (Entities, Value Objects, Repos)        │ ← IIndustryRepository (Interface)
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│      Infrastructure Layer                   │
│  (Database, External APIs, Implementations) │ ← IndustryRepository (Implementation)
└─────────────────────────────────────────────┘
```

### 2. **So sánh: Dùng Model trực tiếp vs Dùng Repository**

#### ❌ **CÁCH CŨ - Dùng Model trực tiếp (SAI)**

```javascript
// IndustryService.js
const Industry = require('../../models/Industry'); // ❌ Phụ thuộc trực tiếp vào Mongoose

class IndustryService {
  async getAllIndustries() {
    // ❌ Service biết chi tiết về MongoDB query
    const industries = await Industry.find({ visible: true })
      .sort({ sortOrder: 1 })
      .lean();

    // ❌ Phải xử lý Mongoose document → JSON
    return industries.map(i => ({
      id: i._id, // ❌ _id là MongoDB-specific
      name: i.name.vi,
    }));
  }
}
```

**Vấn đề:**

- 🔴 Service phụ thuộc vào Mongoose (nếu đổi sang PostgreSQL phải sửa toàn bộ)
- 🔴 Business logic lẫn lộn với database logic
- 🔴 Khó test (phải mock cả MongoDB)
- 🔴 Không theo Clean Architecture

#### ✅ **CÁCH MỚI - Dùng Repository (ĐÚNG)**

```javascript
// IndustryService.js
const IndustryRepository = require('../../repositories/IndustryRepository'); // ✅ Phụ thuộc vào abstraction

class IndustryService {
  constructor() {
    this.industryRepository = new IndustryRepository(); // ✅ Dependency Injection
  }

  async getAllIndustries() {
    // ✅ Service chỉ gọi method, không biết database
    const industries = await this.industryRepository.findVisible();

    // ✅ Nhận Domain Entity, không phải Mongoose document
    return industries.map(industry => ({
      id: industry.id, // ✅ id là domain property
      name: industry.name.vi,
    }));
  }
}
```

**Lợi ích:**

- 🟢 Service chỉ biết về Domain, không biết database
- 🟢 Dễ đổi database (chỉ sửa Repository implementation)
- 🟢 Dễ test (mock Repository dễ hơn)
- 🟢 Tuân theo SOLID principles

### 3. **Repository Pattern trong project này**

```javascript
// 1. Domain Interface (Contract)
// src/domain/master-data/repositories/IIndustryRepository.js
class IIndustryRepository {
  async findById(id) {
    throw new Error('Not implemented');
  }
  async findVisible() {
    throw new Error('Not implemented');
  }
  async create(entity) {
    throw new Error('Not implemented');
  }
}

// 2. Infrastructure Implementation
// src/infrastructure/repositories/IndustryRepository.js
class IndustryRepository extends IIndustryRepository {
  async findById(id) {
    const doc = await IndustryModel.findById(id);
    return IndustryMapper.toDomain(doc); // ✅ Convert to Domain Entity
  }

  async findVisible() {
    const docs = await IndustryModel.find({ visible: true });
    return IndustryMapper.toDomainArray(docs); // ✅ Convert to Domain Entities
  }
}

// 3. Domain Entity
// src/domain/master-data/entities/Industry.js
class Industry {
  constructor({ id, code, name, description, visible }) {
    this.id = id; // ✅ Not _id
    this.code = code;
    this.name = name; // ✅ Domain object
    this.description = description;
    this.visible = visible;
  }
}

// 4. Mapper (Chuyển đổi giữa Database ↔ Domain)
// src/infrastructure/mappers/IndustryMapper.js
class IndustryMapper {
  static toDomain(mongooseDoc) {
    return new Industry({
      id: mongooseDoc._id.toString(), // MongoDB _id → Domain id
      code: mongooseDoc.code,
      name: mongooseDoc.name,
      // ... other fields
    });
  }

  static toMongoose(domainEntity) {
    return {
      _id: domainEntity.id, // Domain id → MongoDB _id
      code: domainEntity.code,
      name: domainEntity.name,
      // ... other fields
    };
  }
}
```

### 4. **Khi nào dùng Model trực tiếp?**

Chỉ trong các trường hợp:

- 📝 Scripts migration/seeding
- 🔧 Admin tools
- 🧪 Test fixtures

**KHÔNG BAO GIỜ** dùng Model trực tiếp trong:

- ❌ Services
- ❌ Controllers
- ❌ Use Cases

### 5. **Ví dụ thực tế**

#### Scenario: Thay đổi database từ MongoDB sang PostgreSQL

**Với Repository Pattern:**

```javascript
// Chỉ cần tạo PostgreSQLIndustryRepository mới
class PostgreSQLIndustryRepository extends IIndustryRepository {
  async findVisible() {
    const rows = await this.pool.query(
      'SELECT * FROM industries WHERE visible = true'
    );
    return rows.map(row => IndustryMapper.toDomain(row));
  }
}

// Service KHÔNG CẦN SỬA GÌ! ✅
```

**Không dùng Repository:**

```javascript
// Phải sửa TẤT CẢ services có dùng Industry.find() ❌
// Có thể 50+ files phải sửa!
```

### 6. **Testing Benefits**

```javascript
// Mock Repository dễ dàng
describe('IndustryService', () => {
  it('should get all industries', async () => {
    // ✅ Mock repository
    const mockRepo = {
      findVisible: jest
        .fn()
        .mockResolvedValue([
          new Industry({ id: '1', name: { vi: 'IT', en: 'IT' } }),
        ]),
    };

    const service = new IndustryService();
    service.industryRepository = mockRepo;

    const result = await service.getAllIndustries();

    expect(result.industries).toHaveLength(1);
    expect(mockRepo.findVisible).toHaveBeenCalled();
  });
});
```

## 🎓 Kết luận

### NÊN dùng Repository vì:

1. ✅ **Separation of Concerns** - Tách biệt business logic và data access
2. ✅ **Testability** - Dễ test với mock
3. ✅ **Flexibility** - Dễ thay đổi database
4. ✅ **Clean Architecture** - Tuân theo best practices
5. ✅ **Domain-Driven Design** - Làm việc với Domain Entities
6. ✅ **SOLID Principles** - Dependency Inversion Principle

### KHÔNG nên dùng Model trực tiếp vì:

1. ❌ Vi phạm Clean Architecture
2. ❌ Tight coupling với database
3. ❌ Khó test
4. ❌ Khó maintain khi scale
5. ❌ Business logic lẫn với database logic

## 📚 Tài liệu tham khảo

- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
