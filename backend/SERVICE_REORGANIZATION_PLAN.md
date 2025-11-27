# 📁 Service Reorganization Plan

## 🎯 MỤC TIÊU

Tổ chức lại các service files vào các thư mục con theo nhóm chức năng để dễ quản lý và maintain.

---

## 📂 CẤU TRÚC MỚI

```
src/services/
├── api/                    # External API services
│   ├── youtubeApiService.js
│   ├── githubApiService.js
│   ├── googleSearchService.js
│   ├── devToApiService.js
│   ├── stackOverflowApiService.js
│   └── khanAcademyApiService.js
│
├── resource/              # Resource recommendation services
│   ├── resourceRecommendationService.js
│   ├── resourceFilterService.js
│   ├── resourceHealthCheckService.js
│   ├── resourceIndexingService.js
│   ├── realResourceUrlService.js
│   ├── curatedResourcesDatabase.js
│   ├── industryMappingService.js
│   └── personalizationService.js
│
├── ai/                    # AI services
│   ├── aiService.js
│   ├── aICVEnhancementService.js
│   ├── embeddingService.js
│   └── vectorStoreService.js
│
├── upload/                # Upload services
│   ├── fileUploadService.js
│   ├── imageUploadService.js
│   ├── documentUploadService.js
│   └── unifiedUploadService.js
│
├── auth/                  # Authentication services
│   ├── googleAuth.js
│   ├── otpService.js
│   └── otpCooldownService.js
│
├── resume/                # Resume/CV services
│   ├── resumeParserService.js
│   ├── resumeGeneratorService.js
│   ├── cvPreviewGenerator.js
│   └── pdfGenerationService.js
│
├── notification/          # Notification services
│   ├── notificationService.js
│   └── emailService.js
│
├── roadmap/               # Roadmap services
│   └── ruleBasedRoadmapGenerator.js
│
├── cache/                 # Cache services
│   └── cacheService.js
│
├── document/              # Document services
│   └── documentService.js
│
├── employers/            # Employer services (đã có sẵn)
│   ├── employerDocumentService.js
│   ├── employerServices.js
│   └── employerVerificationService.js
│
└── migration/            # Migration services
    └── addressMigrationService.js
```

---

## 📋 MAPPING FILES

### api/
- `youtubeApiService.js` → `api/youtubeApiService.js`
- `githubApiService.js` → `api/githubApiService.js`
- `googleSearchService.js` → `api/googleSearchService.js`
- `devToApiService.js` → `api/devToApiService.js`
- `stackOverflowApiService.js` → `api/stackOverflowApiService.js`
- `khanAcademyApiService.js` → `api/khanAcademyApiService.js`

### resource/
- `resourceRecommendationService.js` → `resource/resourceRecommendationService.js`
- `resourceFilterService.js` → `resource/resourceFilterService.js`
- `resourceHealthCheckService.js` → `resource/resourceHealthCheckService.js`
- `resourceIndexingService.js` → `resource/resourceIndexingService.js`
- `realResourceUrlService.js` → `resource/realResourceUrlService.js`
- `curatedResourcesDatabase.js` → `resource/curatedResourcesDatabase.js`
- `industryMappingService.js` → `resource/industryMappingService.js`
- `personalizationService.js` → `resource/personalizationService.js`

### ai/
- `aiService.js` → `ai/aiService.js`
- `aICVEnhancementService.js` → `ai/aICVEnhancementService.js`
- `embeddingService.js` → `ai/embeddingService.js`
- `vectorStoreService.js` → `ai/vectorStoreService.js`

### upload/
- `fileUploadService.js` → `upload/fileUploadService.js`
- `imageUploadService.js` → `upload/imageUploadService.js`
- `documentUploadService.js` → `upload/documentUploadService.js`
- `unifiedUploadService.js` → `upload/unifiedUploadService.js`

### auth/
- `googleAuth.js` → `auth/googleAuth.js`
- `otpService.js` → `auth/otpService.js`
- `otpCooldownService.js` → `auth/otpCooldownService.js`

### resume/
- `resumeParserService.js` → `resume/resumeParserService.js`
- `resumeGeneratorService.js` → `resume/resumeGeneratorService.js`
- `cvPreviewGenerator.js` → `resume/cvPreviewGenerator.js`
- `pdfGenerationService.js` → `resume/pdfGenerationService.js`

### notification/
- `notificationService.js` → `notification/notificationService.js`
- `emailService.js` → `notification/emailService.js`

### roadmap/
- `ruleBasedRoadmapGenerator.js` → `roadmap/ruleBasedRoadmapGenerator.js`

### cache/
- `cacheService.js` → `cache/cacheService.js`

### document/
- `documentService.js` → `document/documentService.js`

### migration/
- `addressMigrationService.js` → `migration/addressMigrationService.js`

---

## 🔄 FILES CẦN UPDATE IMPORTS

Sau khi di chuyển files, cần update imports trong:

1. **Controllers**:
   - `src/controllers/advancedNLPController.js`
   - `src/controllers/employerProfileController.js`
   - `src/controllers/userController.js`
   - `src/controllers/candidate/ProfileController.js`
   - `src/controllers/jobController.js`
   - `src/controllers/candidate/ApplicationController.js`
   - `src/controllers/admin/verificationController.js`
   - `src/controllers/applicationController.js`
   - `src/controllers/candidate/ResumeController.js`
   - `src/controllers/aiController.js`
   - `src/controllers/roadmapController.js`
   - `src/controllers/candidate/CVBuilderController.js`
   - `src/controllers/authController.js`

2. **Models**:
   - `src/models/Application.js`
   - `src/models/EmployerProfile.js`

3. **Routes**:
   - `src/routes/testNotifications.js`
   - `src/routes/admin/templatesAdmin.js`

4. **Middleware**:
   - `src/middleware/employerVerification.js`

5. **Config**:
   - `src/config/initializeServices.js`

6. **Services** (internal imports):
   - `src/services/resourceRecommendationService.js`
   - `src/services/documentService.js`

---

## ✅ NEXT STEPS

1. Tạo các thư mục con
2. Di chuyển files
3. Update tất cả imports
4. Test để đảm bảo không có lỗi
5. Update documentation

