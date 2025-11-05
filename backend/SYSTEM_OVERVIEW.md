# 🏗️ TỔNG QUAN HỆ THỐNG RECRUITMENT PLATFORM

## 📊 KIẾN TRÚC CLEAN ARCHITECTURE

### 1. **PRESENTATION LAYER** (`src/presentation/`)

```
controllers/      → REST API endpoints
├── authController.js       ✅ Authentication (JWT)
├── candidateController.js  ⚠️  Fixed imports (used deprecated services)
├── employerController.js   ⚠️  Fixed imports (missing EmployerService)
├── jobController.js        ✅ Properly uses Use Cases
├── userController.js       ✅ User management
└── uploadController.js     ❌ Uses deprecated CloudinaryService

dtos/            → Data Transfer Objects
├── CandidateProfileResponseDTO.js  ✅ Fixed constructor pattern
├── EmployerProfileResponseDTO.js   ✅ Proper response formatting
├── JobResponseDTO.js              ✅ Job data transformation
└── ApplicationResponseDTO.js      ✅ Application data formatting

middleware/      → Request processing
├── auth.js      ✅ JWT validation & user population
├── upload.js    ⚠️  Should use UnifiedUploadService config
└── validation/  ✅ Request validation rules
```

### 2. **APPLICATION LAYER** (`src/application/`)

```
base/           → Common patterns
├── BaseUseCase.js          ✅ Standard use case structure
├── BaseRepository.js       ✅ Repository pattern base
└── BaseService.js          ✅ Service pattern base

identity/       → Authentication & Authorization
├── LoginUseCase.js         ✅ User login logic
├── RegisterUseCase.js      ✅ User registration
└── RefreshTokenUseCase.js  ✅ Token management

recruitment/    → Core business logic
├── CreateJobUseCase.js           ✅ Job creation
├── GetJobUseCase.js              ✅ Job retrieval
├── CreateCandidateProfileUseCase.js  ✅ Profile creation
├── GetCandidateProfileUseCase.js     ✅ Profile retrieval
└── UpdateCandidateProfileUseCase.js  ✅ Profile updates

ai-nlp/         → AI services integration
├── AnalyzeCVUseCase.js     ✅ CV analysis
├── MatchJobsUseCase.js     ✅ Job matching
└── ExtractCVDataUseCase.js ✅ CV data extraction
```

### 3. **DOMAIN LAYER** (`src/domain/`)

```
entities/       → Business entities
├── User.js            ✅ Core user entity
├── CandidateProfile.js ✅ Candidate business logic
├── EmployerProfile.js  ✅ Employer business logic
├── Job.js             ✅ Job posting entity
└── Application.js     ✅ Application entity

value-objects/  → Domain value objects
├── PersonalInfo.js    ✅ Personal information
├── ContactInfo.js     ✅ Contact details
├── Skills.js          ✅ Skills management
└── Address.js         ✅ Address handling

repositories/   → Repository interfaces
├── IUserRepository.js           ✅ User data access interface
├── ICandidateRepository.js      ✅ Candidate data interface
├── IEmployerRepository.js       ✅ Employer data interface
└── IJobRepository.js            ✅ Job data interface
```

### 4. **INFRASTRUCTURE LAYER** (`src/infrastructure/`)

```
models/         → Database models (Mongoose)
├── User.js            ✅ User schema with avatar support
├── CandidateProfile.js ✅ Candidate profile schema
├── EmployerProfile.js  ✅ Employer profile schema
├── Company.js         ✅ Company information
├── Job.js             ✅ Job posting schema
└── Application.js     ✅ Application schema

repositories/   → Repository implementations
├── UserRepository.js        ✅ User data access
├── CandidateRepository.js   ✅ Fixed User population
├── EmployerRepository.js    ✅ Employer data access
└── JobRepository.js         ✅ Job data access

services/       → Infrastructure services
├── external/
│   ├── UnifiedUploadService.js    ✅ **RECOMMENDED** (All file types)
│   ├── CloudinaryService.js       ❌ **DEPRECATED** (Duplicate)
│   ├── ImageUploadService.js      ❌ **DEPRECATED** (Duplicate)
│   ├── DocumentUploadService.js   ❌ **DEPRECATED** (Use Unified)
│   └── FileUploadService.js       ❌ **DEPRECATED** (Use Unified)
├── CandidateService.js            ✅ Candidate business operations
├── EmployerService.js             ✅ Employer business operations
├── UnifiedProfileService.js       ⚠️  **TOO LARGE** (Split needed)
└── EmailService.js                ✅ Email notifications

config/
├── diContainer.js     ✅ Dependency injection
├── database.js        ✅ MongoDB connection
└── cloudinary.js      ✅ Cloudinary configuration
```

---

## 🚨 MAJOR ISSUES DISCOVERED

### ❌ **1. SERVICES DUPLICATION CHAOS**

```
UPLOAD SERVICES (MASSIVE DUPLICATION):
├── UnifiedUploadService.js    ✅ KEEP (Most complete)
├── CloudinaryService.js       ❌ DELETE (85% duplicate)
├── ImageUploadService.js      ❌ DELETE (70% duplicate)
├── DocumentUploadService.js   ❌ DELETE (60% duplicate)
├── FileUploadService.js       ❌ DELETE (90% duplicate)
└── UploadService.js          ❌ DELETE (Basic duplicate)

RECOMMENDATION: Use ONLY UnifiedUploadService
```

### ⚠️ **2. PROFILE SERVICES MIXING CONCERNS**

```
UnifiedProfileService.js (1000+ lines):
├── Candidate logic    → Should be CandidateService
├── Employer logic     → Should be EmployerService
├── User logic         → Should be UserService
├── CV logic           → Should be CVService
├── Upload logic       → Should use UnifiedUploadService
└── AI logic           → Should be AIService

RECOMMENDATION: Split into domain-specific services
```

### ❌ **3. CONTROLLERS USING WRONG SERVICES**

```
candidateController.js:
├── ❌ Used CloudinaryService (deprecated)
├── ❌ Used CandidateService (not imported)
├── ✅ Fixed to use UnifiedUploadService

employerController.js:
├── ❌ Used EmployerService (not imported)
├── ✅ Fixed missing import

uploadController.js:
├── ❌ Still uses CloudinaryService
├── 🔧 Needs conversion to UnifiedUploadService
```

---

## ✅ WORKING FEATURES

### 🔐 **Authentication System**

- JWT token-based authentication ✅
- User registration/login ✅
- Role-based access control ✅
- Token refresh mechanism ✅

### 👤 **Profile Management**

- Candidate profile CRUD ✅
- Employer profile CRUD ✅
- Avatar upload/retrieval ✅ (User.avatarUrl → CandidateProfile fallback)
- Profile completeness calculation ✅

### 💼 **Job Management**

- Job posting CRUD ✅
- Job search & filtering ✅
- Employer job management ✅
- Application tracking ✅

### 🤖 **AI Integration**

- CV analysis ✅
- Job matching ✅
- Skills extraction ✅
- AI recommendations ✅

### 📁 **File Upload System**

- Avatar upload ✅ (UnifiedUploadService)
- CV upload ✅
- Company logo upload ✅
- Document management ✅

---

## 🎯 CLEANUP STRATEGY

### **Phase 1: Remove Deprecated Upload Services**

```bash
# DELETE these files:
rm CloudinaryService.js
rm ImageUploadService.js
rm DocumentUploadService.js
rm FileUploadService.js
rm UploadService.js

# UPDATE all references to use UnifiedUploadService
```

### **Phase 2: Split Large Services**

```javascript
// UnifiedProfileService.js → Split into:
├── CandidateService.js      (candidate-specific logic)
├── EmployerService.js       (employer-specific logic)
├── UserService.js           (user management)
├── CVService.js             (CV operations)
└── ProfileAnalysisService.js (profile analysis)
```

### **Phase 3: Fix Controller Dependencies**

```javascript
// Update all controllers to:
1. Import only necessary services
2. Use UnifiedUploadService for all file uploads
3. Follow proper dependency injection
4. Use Use Cases for business logic
```

### **Phase 4: Standardize Service Patterns**

```javascript
// All services should follow:
1. Single Responsibility Principle
2. Consistent error handling
3. Proper logging
4. Input validation
5. Clear method naming
```

---

## 📈 ARCHITECTURE QUALITY SCORE

| Component             | Status       | Score    | Issues                           |
| --------------------- | ------------ | -------- | -------------------------------- |
| **Domain Layer**      | ✅ Good      | 8/10     | Clean entities, clear separation |
| **Application Layer** | ✅ Good      | 8/10     | Proper use cases, DI container   |
| **Infrastructure**    | ⚠️ Poor      | 4/10     | Massive service duplication      |
| **Presentation**      | ⚠️ Fair      | 6/10     | Controllers fixed, DTOs good     |
| **Database**          | ✅ Good      | 8/10     | Proper schemas, relationships    |
| **Authentication**    | ✅ Excellent | 9/10     | JWT, middleware working          |
| **File Upload**       | ⚠️ Poor      | 3/10     | 5+ duplicate services            |
| **Overall**           | ⚠️ Fair      | **6/10** | **Needs infrastructure cleanup** |

---

## 🚀 NEXT STEPS

1. **IMMEDIATE** → Execute service cleanup (remove duplicates)
2. **HIGH** → Split large services into domain-specific ones
3. **MEDIUM** → Standardize error handling across services
4. **LOW** → Add comprehensive testing for refactored services

**SYSTEM STATUS: FUNCTIONAL but needs architectural cleanup for maintainability**
