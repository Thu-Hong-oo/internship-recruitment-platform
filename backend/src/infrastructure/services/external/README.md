# External Services - Reorganized Structure

## 📁 Directory Structure

```
external/
├── core/                      # Core infrastructure services
│   ├── EmailService.js       # Email sending (nodemailer)
│   ├── JWTService.js         # JWT token management
│   ├── GoogleAuthService.js  # Google OAuth authentication
│   ├── OTPService.js         # OTP generation & verification (Redis)
│   ├── OTPCooldownService.js # OTP cooldown management
│   ├── UnifiedUploadService.js # File upload (Cloudinary)
│   ├── QueueService.js       # Job queue management (Bull/Redis)
│   ├── SocketService.js      # WebSocket real-time communication
│   └── index.js              # Core services export
│
├── ai/                        # AI-powered services
│   ├── GeminiAIService.js    # Google Gemini AI integration (implemented)
│   ├── aiService.js          # Base AI service interface
│   ├── openAIAIService.js    # OpenAI adapter (stub)
│   └── index.js              # AI services export
│
├── cv-resume/                 # CV & Resume processing
│   ├── CVParserService.js    # CV parsing
│   ├── CVPreviewGenerator.js # CV preview generation
│   ├── AICVEnhancementService.js # AI-powered CV enhancement
│   ├── ResumeGeneratorService.js # Resume HTML generation
│   ├── ResumeParserService.js    # Resume parsing
│   ├── templates/            # Resume HTML templates
│   └── index.js              # CV/Resume services export
│
├── matching/                  # Job & Skill matching
│   ├── JobMatcherService.js  # AI job matching
│   ├── SkillAnalysisService.js # Skill analysis
│   ├── ExperienceEnhancerService.js # Experience enhancement
│   └── index.js              # Matching services export
│
├── career/                    # Career guidance
│   ├── CareerGuidanceService.js # Career path recommendations
│   ├── PDFGenerationService.js  # PDF document generation
│   └── index.js              # Career services export
│
└── index.js                   # Main export file
```

## 🔧 Usage

### Option 1: Import from category (Recommended)

```javascript
// Import all services from a category
const { core } = require('./services/external');
const EmailService = core.EmailService;
const JWTService = core.JWTService;

// Or destructure directly
const { ai, cvResume, matching } = require('./services/external');
const GeminiAIService = ai.GeminiAIService;
const CVParserService = cvResume.CVParserService;
const JobMatcherService = matching.JobMatcherService;
```

### Option 2: Direct import (Backward compatible)

```javascript
// Import specific service directly
const EmailService = require('./services/external/core/EmailService');
const GeminiAIService = require('./services/external/ai/GeminiAIService');

// Or use the main index exports
const {
  EmailService,
  JWTService,
  GeminiAIService,
} = require('./services/external');
```

## 📦 Service Categories

### **Core Services**

Essential infrastructure services for authentication, communication, and storage:

- **Authentication**: JWT, Google OAuth, OTP
- **Communication**: Email, WebSocket
- **Storage**: File upload (Cloudinary)
- **Queue**: Background job processing (Bull/Redis)

### **AI Services**

AI-powered services using external AI APIs:

- **GeminiAIService**: Google Gemini AI integration
- Future: OpenAI, Claude, etc.

### **CV/Resume Services**

Services for CV/Resume processing and generation:

- Parsing, Preview, Enhancement
- HTML Resume generation with multiple templates

### **Matching Services**

AI-powered matching and analysis:

- Job-Candidate matching
- Skill gap analysis
- Experience enhancement suggestions

### **Career Services**

Career development and guidance:

- Career path recommendations
- PDF report generation

## 🔄 Migration Guide

If you have existing code using old paths:

**Old:**

```javascript
const EmailService = require('../services/external/EmailService');
const GeminiAIService = require('../services/external/GeminiAIService');
```

**New:**

```javascript
const EmailService = require('../services/external/core/EmailService');
const GeminiAIService = require('../services/external/ai/GeminiAIService');
```

## ✅ Benefits

1. **Better Organization**: Services grouped by functionality
2. **Easier Navigation**: Clear separation of concerns
3. **Scalability**: Easy to add new services in proper categories
4. **Maintainability**: Reduced clutter, cleaner structure
5. **Documentation**: Self-documenting through folder structure

## 📝 Notes

- All services are exported as singleton instances (already instantiated)
- Use dependency injection in business logic layers
- Container automatically resolves dependencies
- See `container.js` for DI configuration
