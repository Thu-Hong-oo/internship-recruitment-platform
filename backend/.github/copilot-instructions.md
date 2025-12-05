# AI Coding Agent Instructions for Internship Recruitment Platform Backend

## Project Overview

This is a **self-sufficient AI-powered internship recruitment platform backend** built with Node.js/Express, featuring a complete offline NLP stack. The system prioritizes local AI models (PhoBERT, Sentence-BERT) over external APIs, with optional Gemini enhancement.

**Tech Stack**: Node.js 18+, Express 4, MongoDB (Mongoose), Redis (optional), Python 3.8+ (for PhoBERT inference), Socket.IO

## Architecture

### Layered Architecture Pattern
```
API Routes → Controllers → Services → Models → Database
```

- **Routes** (`src/routes/`): Express route definitions with middleware
- **Controllers** (`src/controllers/`): Request/response handling, input validation
- **Services** (`src/services/`): Business logic, AI processing, external integrations
- **Models** (`src/models/`): Mongoose schemas with validation
- **Middleware** (`src/middleware/`): Auth, rate limiting, error handling

### AI Service Architecture
```
Self-Sufficient Stack (Primary):
├── PhoBERT NER (Vietnamese skill extraction - 96% F1)
├── Sentence-BERT (Semantic similarity - 768-dim embeddings)
├── TF-IDF + Cosine (Fast job-candidate matching)
└── ChromaDB Vector Store (Learning resources)

Optional Enhancement:
└── Gemini API (Only when explicitly requested)
```

## Critical Development Patterns

### 1. AI Service Call Priority
Always prioritize self-sufficient methods:
```javascript
// ✅ CORRECT: Use hybrid system (rule-based + NER)
const skills = await skillExtractionService.extractSkills(cvText, {
  useHybrid: true,    // Primary method
  useGemini: false,   // Optional enhancement only
});

// ❌ AVOID: External API first
const skills = await skillExtractionService.extractSkills(cvText, {
  useGemini: true,    // Only if explicitly needed
});
```

### 2. Async Handler Pattern
All route handlers must use `express-async-handler`:
```javascript
const asyncHandler = require('express-async-handler');

router.post('/analyze-cv', asyncHandler(async (req, res) => {
  const result = await aiService.analyzeCV(req.body.cvText);
  res.json({ success: true, data: result });
}));
```

### 3. Error Response Format
Consistent JSON responses:
```javascript
// Success
res.json({ success: true, data: result, message: "Operation completed" });

// Error
res.status(400).json({ success: false, error: "Validation failed" });
```

### 4. Job Matching Scoring Formula
Multi-dimensional weighted scoring:
```
Total Score = (Skills × 0.40) + (Experience × 0.30) + (Education × 0.15) + (Projects × 0.15)

Tiers: A (90-100%), B (75-89%), C (60-74%), D (<60%)
```

### 5. Logging Pattern
Use Winston logger with appropriate levels:
```javascript
const { logger } = require('../utils/logger');

logger.info('Operation started', { userId, operation: 'cv_analysis' });
logger.error('Operation failed', { error: error.message, stack: error.stack });
```

## Key File Locations & Purposes

### Entry Point
- `server.js`: Express app setup, middleware, routes, Socket.IO initialization

### Core Directories
- `src/controllers/`: Request handlers (aiController.js, authController.js)
- `src/services/ai/`: AI business logic (skillExtractionService.js, jobMatchingService.js)
- `src/models/`: Mongoose schemas (User.js, Job.js, CandidateProfile.js, Application.js, EmployerProfile.js, etc.)
- `src/routes/`: API route definitions
- `src/middleware/`: Auth, validation, rate limiting
- `python/`: PhoBERT inference scripts
- `models/phobert-cv-ner-final/`: Fine-tuned PhoBERT model (1.8GB)

### Configuration
- `.env`: Environment variables (API keys, DB URLs)
- `src/config/`: Service configurations, feature flags

### Model Structure Patterns
All models follow consistent Mongoose patterns:
```javascript
const Schema = new mongoose.Schema({
  // Core fields with validation
  fieldName: { type: String, required: true, trim: true, maxlength: 100 },
  
  // References
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Enums from constants
  status: { type: String, enum: Object.values(STATUS_ENUM), default: STATUS_ENUM.ACTIVE },
  
  // AI integration fields
  embedding: [Number],  // Vector embeddings
  aiAnalysis: mongoose.Schema.Types.Mixed,  // AI-generated data
  
  // Soft delete
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true,  // createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
Schema.index({ field: 1, createdAt: -1 });
Schema.index({ embedding: 1 });  // Vector search

// Virtual fields
Schema.virtual('virtualField').get(function() { return this.field + ' computed'; });

// Instance methods
Schema.methods.instanceMethod = function() { return this.save(); };

// Static methods
Schema.statics.staticMethod = function() { return this.find({}); };
```

## Development Workflows

### Starting Development
```bash
npm run dev          # Nodemon auto-reload
npm start            # Production mode
npm run check-env    # Verify environment setup
```

### Code Quality
```bash
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier formatting
```

### AI/NLP Testing
```bash
npm run rag:populate    # Populate ChromaDB vector store
npm run rag:health      # Check vector store status
node python/phobert_inference.py "<text>"  # Test PhoBERT
```

### Database Operations
```bash
# MongoDB connection verified in server.js startup
# Redis optional - system works without it
```

## Environment Variables (Required vs Optional)

### Critical (Required)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `PORT`: Server port (default: 3000)

### AI/NLP (Self-Sufficient - No External APIs Required)
- `USE_LOCAL_EMBEDDINGS=true`: Use Sentence-BERT locally
- `USE_LOCAL_LLM=true`: Use Ollama instead of Gemini

### Optional Enhancements
- `GEMINI_API_KEY`: Google Gemini (enhancement only)
- `OLLAMA_URL`: Local Ollama endpoint
- `REDIS_URL`: Caching layer

## Common Patterns & Conventions

### Service Initialization
Services use singleton pattern with lazy loading:
```javascript
const { getSelfSufficientAIService } = require('./selfSufficientAIService');
const aiService = getSelfSufficientAIService();
```

### Model Validation
Mongoose schemas include validation and indexes:
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  skills: [{ name: String, level: String }]
});
```

### Constants Usage
All enums and constants defined in `src/constants/`:
```javascript
const { USER_ROLES, SKILL_LEVELS, APPLICATION_STATUS } = require('../constants/common.constants');

// Use in schemas
role: { type: String, enum: Object.values(USER_ROLES) }
```

### File Upload Handling
Use multer with validation:
```javascript
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Validate file types
  }
});
```

### Rate Limiting
Applied globally and per-route:
```javascript
const globalRateLimit = require('./middleware/globalRateLimit');
app.use(globalRateLimit);
```

## AI-Specific Patterns

### Skill Extraction Flow
1. Language detection (Vietnamese vs English)
2. Hybrid system: Rule-based (Vietnamese) + NER (English)
3. Optional Gemini enhancement
4. Skill normalization and deduplication

### Learning Roadmap Generation
```
Skill Gap Analysis → Resource Search (ChromaDB) → Weekly Plan → Structured Output
```

### Vector Store Usage
ChromaDB for learning resources:
```javascript
const vectorStore = require('./vectorStoreService');
const resources = await vectorStore.searchSimilarDocuments(query, { limit: 5 });
```

## Testing & Validation

### API Testing
- Postman collections in `postman/` directory
- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

### AI Evaluation
```bash
node src/research/evaluation/quickEvaluate.js  # Test on 50 CVs
```

### Model Validation
- PhoBERT: Check `models/phobert-cv-ner-final/` exists
- ChromaDB: Run `npm run rag:health`

## Security & Performance

### Authentication
JWT-based with role checking:
```javascript
const auth = require('./middleware/auth');
router.use(auth);  // Requires valid JWT
router.use(auth(['employer']));  // Role-based access
```

### Data Validation
Use Joi or express-validator:
```javascript
const { body, validationResult } = require('express-validator');
```

### Caching Strategy
Redis optional - graceful fallback to no caching.

## Deployment Considerations

### Docker Support
- `Dockerfile`: Multi-stage build
- `docker-compose.yml`: Full stack with MongoDB/Redis
- `docker-compose.ollama.yml`: Ollama LLM container

### Environment Setup
- Python 3.8+ required for PhoBERT
- Node.js 18+ required
- MongoDB 4.4+ recommended

## File Naming Conventions

- Controllers: `featureController.js`
- Services: `featureService.js`
- Models: `Feature.js` (PascalCase)
- Routes: `feature.js`
- Utils: `featureHelper.js`

## Error Handling

Centralized error handling in `src/middleware/errorHandler.js`:
- Logs errors with context
- Returns consistent error format
- Handles different error types (validation, auth, server)

## Real-time Features

Socket.IO integration in `src/socket.js`:
- Real-time notifications
- Live updates for job applications
- Chat functionality (if implemented)

## Migration & Updates

### Schema Changes
- Use Mongoose migration patterns
- Backward compatibility for existing data
- Update model indexes as needed

### AI Model Updates
- PhoBERT model in `models/` directory
- Version control for model files
- Fallback mechanisms for model failures

## Performance Optimization

### AI Processing
- Cache frequent operations
- Batch processing for multiple CVs
- Timeout handling for long-running tasks

### Database
- Proper indexing on query fields
- Connection pooling
- Query optimization

### Caching
- Redis for session/auth tokens
- In-memory cache for AI results
- CDN for static assets

## Monitoring & Logging

### Application Logs
- Winston logger with file rotation
- Structured logging with context
- Error tracking with stack traces

### AI Performance
- Response time monitoring
- Accuracy metrics tracking
- Fallback usage statistics

## Contributing Guidelines

### Code Style
- ESLint configuration
- Prettier formatting
- Consistent async/await usage

### Commit Messages
- Clear, descriptive messages
- Reference issue numbers
- Separate subject from body

### PR Process
- Test locally before submitting
- Update documentation
- Include migration scripts if needed

## Troubleshooting

### Common Issues
- PhoBERT timeouts: Check Python subprocess
- MongoDB connection: Verify URI and network
- Redis warnings: Non-critical, system continues
- ChromaDB errors: Reset vector store

### Debug Commands
```bash
npm run check-env    # Environment validation
npm run test-api     # Health check
node scripts/test-local-models.js  # AI model validation
```

## Key Integration Points

### External Services
- Google OAuth (optional)
- Cloudinary (file uploads)
- SMTP (email notifications)
- YouTube API (learning resources)

### Internal Services
- PhoBERT subprocess communication
- ChromaDB vector operations
- Socket.IO real-time events
- Cron jobs for maintenance

This guidance ensures AI agents can work productively by understanding the project's self-sufficient AI architecture, layered design patterns, and development conventions.</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\backend\.github\copilot-instructions.md