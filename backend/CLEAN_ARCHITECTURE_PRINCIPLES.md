# Clean Architecture + DDD Implementation Principles

## 🎯 Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  (Controllers, Routes, DTOs, Middlewares)               │
│  - Handles HTTP requests/responses                      │
│  - Extracts data from domain entities for JSON          │
│  - No business logic                                    │
└─────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  (Use Cases)                                            │
│  - Orchestrates business logic                          │
│  - Sets defaults and prepares data                      │
│  - Validates input                                       │
│  - Calls Domain Entities + Repositories                 │
└─────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                          │
│  (Entities, Value Objects, Domain Services)             │
│  - Pure business logic                                   │
│  - NO DEFAULTS in constructors                          │
│  - NO infrastructure concerns                           │
│  - NO persistence logic                                 │
└─────────────────────────────────────────────────────────┘
                         ↑ ↓
┌─────────────────────────────────────────────────────────┐
│                Infrastructure Layer                      │
│  (Repositories, Mappers, External Services)             │
│  - Persistence implementation                            │
│  - Mappers: Pure transformation only                    │
│  - NO defaults, NO business logic, NO mutations         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Layer Responsibilities

### 1. Domain Layer (Core Business Logic)

**✅ Domain Entities (e.g., JobPosting, Company)**

- **Constructor**: Only required fields, NO defaults
- **Fields**: All optional fields = `null` initially
- **Methods**: Business logic only (publish(), verify(), setSalaryRange())
- **Pure**: No infrastructure dependencies

**Example:**

```javascript
class JobPosting {
  constructor(jobId, title, description, companyId) {
    this.jobId = jobId;
    this.title = title;
    this.description = description;
    this.companyId = companyId;

    // All optional fields - NO defaults
    this.employerId = null;
    this.status = null;
    this.location = null;
    this.salaryMin = null;
  }

  // Business methods
  publish() {
    if (this.status !== 'draft') {
      throw new Error('Only draft jobs can be published');
    }
    this.status = 'published';
    this.postedAt = new Date();
  }
}
```

**✅ Value Objects (e.g., Address)**

- Immutable
- No defaults in constructor
- Contains business methods (isValid(), getFullAddress())
- Includes `toPlainObject()` for Mapper use

**Example:**

```javascript
class Address {
  constructor(street, ward, district, city, country) {
    // NO defaults - pure data
    this.street = street;
    this.ward = ward;
    this.district = district;
    this.city = city;
    this.country = country;
  }

  isValid() {
    return !!this.city && !!this.country;
  }

  toPlainObject() {
    return {
      street: this.street,
      ward: this.ward,
      district: this.district,
      city: this.city,
      country: this.country,
    };
  }
}
```

---

### 2. Application Layer (Use Cases)

**✅ Responsibilities:**

- Orchestrate business logic
- **Set defaults HERE, not in Domain**
- Validate input
- Call Domain Entities
- Call Repositories

**Example:**

```javascript
class CreateJobUseCase {
  async execute({ employerId, jobData }) {
    // 1. Validation (Application responsibility)
    this._validateInput(jobData);

    // 2. Get dependencies
    const employer = await this.employerRepository.findById(employerId);

    // 3. Create domain entity
    const jobPosting = new JobPosting(
      null,
      jobData.title,
      jobData.description,
      employer.companyId
    );

    // 4. Set optional fields WITH defaults (Application Layer)
    jobPosting.employerId = employerId;
    jobPosting.status = 'draft'; // Default HERE
    jobPosting.location = jobData.location || 'Remote'; // Default HERE
    jobPosting.viewCount = 0; // Initialize HERE

    // 5. Use business methods
    if (jobData.salaryMin && jobData.salaryMax) {
      jobPosting.setSalaryRange(
        jobData.salaryMin,
        jobData.salaryMax,
        jobData.salaryCurrency || 'VND' // Default currency
      );
    }

    // 6. Save through repository
    const savedJob = await this.jobRepository.create(jobPosting);
    return { success: true, job: savedJob };
  }
}
```

**❌ Don't:**

- Don't put business rules here (belongs in Domain)
- Don't access database directly (use Repositories)
- Don't create plain objects (use Domain Entities)

---

### 3. Infrastructure Layer (Persistence & External)

**✅ Mappers**

- **Pure transformation only**
- NO defaults
- NO business logic
- NO mutations of mongoose docs
- NO HTTP knowledge

**Example:**

```javascript
class JobPostingMapper {
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    const jobPosting = new JobPosting(
      mongooseDoc._id.toString(),
      mongooseDoc.title,
      mongooseDoc.description,
      mongooseDoc.companyId
    );

    // Map fields AS-IS without defaults
    jobPosting.employerId = mongooseDoc.employerId;
    jobPosting.status = mongooseDoc.status; // NO default
    jobPosting.location = mongooseDoc.location; // NO default
    jobPosting.salaryMin = mongooseDoc.salaryRange?.min;

    return jobPosting;
  }

  static toMongoose(domainEntity) {
    const data = {
      title: domainEntity.title,
      description: domainEntity.description,
      companyId: domainEntity.companyId,
      employerId: domainEntity.employerId,
      status: domainEntity.status,
    };

    // Only include if provided
    if (domainEntity.salaryMin !== undefined) {
      data.salaryRange = {
        min: domainEntity.salaryMin,
        max: domainEntity.salaryMax,
        currency: domainEntity.salaryCurrency,
      };
    }

    return data; // Let Mongoose schema handle defaults
  }
}
```

**✅ Repositories**

- Accept Domain Entities
- Convert using Mappers
- Return Domain Entities
- Handle persistence

**Example:**

```javascript
class JobRepository {
  async create(jobData) {
    // Accept both Domain Entity and plain object
    const mongooseData =
      jobData.constructor.name === 'JobPosting'
        ? JobPostingMapper.toMongoose(jobData)
        : jobData;

    const doc = new JobModel(mongooseData);
    await doc.save();

    // Return Domain Entity
    return JobPostingMapper.toDomain(doc);
  }

  async findById(jobId) {
    const doc = await JobModel.findById(jobId);
    return JobPostingMapper.toDomain(doc); // Always return Domain Entity
  }
}
```

---

### 4. Presentation Layer (Controllers)

**✅ Responsibilities:**

- Handle HTTP requests
- Extract data from Domain Entities for JSON response
- Call Use Cases
- Handle errors

**Example:**

```javascript
const createJob = asyncHandler(async (req, res) => {
  const createJobUseCase = req.container.resolve('createJobUseCase');

  const result = await createJobUseCase.execute({
    employerId: req.user.id,
    jobData: req.body,
  });

  // Extract data from Domain Entity for JSON
  res.status(201).json({
    success: true,
    data: {
      id: result.job.jobId, // Domain Entity property
      title: result.job.title,
      status: result.job.status,
      location: result.job.location,
      salary: {
        min: result.job.salaryMin,
        max: result.job.salaryMax,
        currency: result.job.salaryCurrency,
      },
    },
  });
});
```

---

## 🚫 Anti-Patterns to Avoid

### ❌ Defaults in Domain Layer

```javascript
// BAD - Domain Entity
class JobPosting {
  constructor(id, title) {
    this.salaryCurrency = 'VND'; // ❌ Default in Domain
    this.status = 'draft'; // ❌ Default in Domain
  }
}
```

### ❌ Defaults in Mapper

```javascript
// BAD - Mapper
static toDomain(doc) {
  jobPosting.location = doc.location || ''; // ❌ Default in Mapper
  jobPosting.status = doc.status || 'draft'; // ❌ Default in Mapper
}
```

### ❌ Business Logic in Mapper

```javascript
// BAD - Mapper
static toMongoose(entity) {
  return {
    verification: {
      isVerified: entity.isVerified,
      steps: {
        // ❌ Business logic in Mapper
        businessInfo: !!entity.taxCode && !!entity.license,
      }
    }
  };
}
```

### ❌ Mutating Mongoose Doc in Mapper

```javascript
// BAD - Mapper
static updateMongooseFromDomain(doc, entity) {
  doc.title = entity.title;  // ❌ Mutating doc
  doc.status = entity.status; // ❌ Direct mutation
  return doc;
}
```

### ❌ Creating Objects in Mapper

```javascript
// BAD - Mapper
static toMongoose(entity) {
  return {
    legalRepresentative: { // ❌ Creating empty object
      fullName: '',
      position: '',
    }
  };
}
```

---

## ✅ Correct Patterns

### ✅ Defaults in Application Layer

```javascript
// GOOD - Use Case
const jobPosting = new JobPosting(null, title, description, companyId);
jobPosting.status = 'draft'; // ✅ Default in Application Layer
jobPosting.salaryCurrency = data.currency || 'VND'; // ✅ Default here
```

### ✅ Pure Mapper Transformation

```javascript
// GOOD - Mapper
static toDomain(doc) {
  jobPosting.location = doc.location; // ✅ No default
  jobPosting.status = doc.status;     // ✅ Just map
  return jobPosting;
}
```

### ✅ Business Logic in Domain

```javascript
// GOOD - Domain Entity
class Company {
  verify() {
    this.isVerified = true;
    this.verificationStatus = 'verified';
  }

  isFullyVerified() {
    return this.isVerified && !!this.taxCode && !!this.license;
  }
}
```

### ✅ Repository Handles Updates

```javascript
// GOOD - Repository
async save(entity) {
  if (entity.companyId) {
    const updateData = CompanyMapper.toMongoose(entity);
    const doc = await CompanyModel.findByIdAndUpdate(
      entity.companyId,
      updateData,
      { new: true }
    );
    return CompanyMapper.toDomain(doc);
  }
}
```

---

## 🎯 Summary

| Layer              | Defaults | Business Logic   | Persistence | HTTP   |
| ------------------ | -------- | ---------------- | ----------- | ------ |
| **Domain**         | ❌ No    | ✅ Yes           | ❌ No       | ❌ No  |
| **Application**    | ✅ Yes   | ✅ Orchestration | ❌ No       | ❌ No  |
| **Infrastructure** | ❌ No    | ❌ No            | ✅ Yes      | ❌ No  |
| **Presentation**   | ❌ No    | ❌ No            | ❌ No       | ✅ Yes |

---

## 📚 Key Principles

1. **Dependency Rule**: Dependencies point inward (Domain has no dependencies)
2. **Domain Purity**: No defaults, no infrastructure, pure business logic
3. **Mapper Purity**: No defaults, no business logic, no mutations
4. **Application Orchestration**: Defaults, validation, coordination
5. **Separation of Concerns**: Each layer has distinct responsibilities

---

## 🔍 Checklist

Before committing code, verify:

- [ ] Domain Entities have NO defaults in constructor
- [ ] Mappers do pure transformation only
- [ ] Use Cases set defaults and orchestrate
- [ ] Controllers extract data from Domain Entities
- [ ] Repositories return Domain Entities
- [ ] No business logic in Infrastructure layer
- [ ] No HTTP concerns in Application/Domain layers
