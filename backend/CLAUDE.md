# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered internship recruitment platform backend with **self-sufficient NLP capabilities**. The system can operate entirely offline using fine-tuned PhoBERT (96% F1 score) for Vietnamese skill extraction, Sentence-BERT for semantic matching, and TF-IDF for fast candidate-job matching. Gemini API integration is optional and only used for enhancement features.

**Stack**: Node.js 18+, Express 4, MongoDB (Mongoose), Redis (optional), Python 3.8+ (for PhoBERT inference), Socket.IO

## Development Commands

### Starting the Server
```bash
npm run dev          # Development with nodemon (auto-reload)
npm start            # Production mode
npm run check-env    # Verify environment variables
```

### Code Quality
```bash
npm run lint         # Check code style (ESLint)
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format code (Prettier)
npm run format:check # Check formatting
```

### Testing & Evaluation
```bash
npm test             # Run all tests
npm run test-api     # Health check API endpoint
node src/research/evaluation/quickEvaluate.js    # Quick AI evaluation (50 CVs)
node src/research/evaluation/modelEvaluator.js   # Comprehensive evaluation
```

### AI/NLP Tools
```bash
# PhoBERT & NLP Services
node python/phobert_inference.py "<text>"   # Test PhoBERT directly
node python/generate_charts.py              # Generate thesis charts

# ChromaDB Vector Store
npm run rag:populate    # Populate vector DB with learning resources
npm run rag:refresh     # Refresh vector DB data
npm run rag:health      # Check vector DB health
npm run rag:clear       # Clear vector DB

# Ollama (Local LLM - Optional)
npm run ollama:start    # Start Ollama Docker container
npm run ollama:stop     # Stop Ollama
npm run ollama:check    # Check installed models
npm run ollama:test     # Test Ollama integration
```

### Database Management
```bash
node scripts/seed-skills.js                           # Seed skills database
node scripts/cleanup-duplicate-certifications.js      # Check duplicates (dry-run)
node scripts/cleanup-duplicate-certifications.js --execute  # Execute cleanup
```

## Architecture

### High-Level System Design

The backend follows a **layered architecture** with emphasis on self-sufficient AI/NLP services:

```
API Layer (Express Routes)
    ↓
Controllers (Request/Response Handling)
    ↓
Services (Business Logic)
    ├── AI Services (Self-Sufficient Stack)
    │   ├── PhoBERT NER (Primary - 96% F1)
    │   ├── Sentence-BERT (Semantic Similarity)
    │   ├── TF-IDF + Cosine Similarity (Fast Matching)
    │   ├── Job Matching Service (Multi-dimensional scoring)
    │   ├── Candidate Recommendation Service (Reverse matching)
    │   ├── Learning Roadmap Service (Skill gap + resources)
    │   └── ChromaDB Vector Store (Learning resources)
    └── Domain Services (Jobs, Users, Auth, etc.)
    ↓
Models (Mongoose Schemas)
    ↓
Database (MongoDB)
```

### Key Service Layers

**1. Core AI Services** (`src/services/ai/`)
- **skillExtractionService.js**: Orchestrates PhoBERT (primary) + optional Gemini enhancement. Always prefers PhoBERT.
- **phobertService.js**: Wraps Python PhoBERT inference subprocess. Spawns `python/phobert_inference.py` with text input.
- **sentenceBertService.js**: Multilingual semantic embeddings (768-dim vectors) for job-CV similarity.
- **jobMatchingService.js**: Multi-dimensional scoring (skills 40%, experience 30%, education 15%, projects 15%). Returns tier A/B/C/D matches.
- **candidateRecommendationService.js**: Reverse matching - find best candidates for a job posting.
- **learningRoadmapService.js**: Generates personalized learning roadmaps from skill gaps with weekly plans and ChromaDB resources.
- **vectorStoreService.js**: ChromaDB wrapper for learning resource search.
- **ruleBasedCVParser.js**: Baseline fallback using regex patterns and NLP library `natural`.

**2. Python Integration**
- **PhoBERT NER Model**: Located in `models/phobert-cv-ner-final/` (1.8 GB fine-tuned model)
- **Communication**: Node.js spawns Python subprocess via `child_process.spawn()` in `src/services/phobertService.js`
- **Input/Output**: JSON via stdin/stdout. Format: `{ text, confidence_threshold, max_length }`
- **Health Check**: `python phobert_inference.py --check` verifies model loads correctly

**3. Database Architecture**
- **MongoDB**: Primary database (Mongoose ODM). Connection string in `MONGO_URI` env var.
- **Redis**: Optional caching layer. System works without Redis (graceful fallback).
- **Models Location**: `src/models/` contains Mongoose schemas (User, Job, Candidate, Application, etc.)

**4. Real-time Features**
- **Socket.IO**: Configured in `src/socket.js` for real-time notifications
- **Integration**: Socket instance attached to Express server in `server.js:358`

### Important File Locations

**Entry Point**:
- `server.js` - Express app initialization, middleware setup, route registration

**Configuration**:
- `.env` - Environment variables (DATABASE, API keys, feature flags)
- `src/config/` - Database, AI model, and service configurations

**Routes** (`src/routes/`):
- `ai.js` - CV analysis, job/candidate recommendations (`/api/ai/*`)
- `advancedNLP.js` - Matching scores, learning roadmaps (`/api/nlp/*`)
- `jobs.js` - Job CRUD operations
- `candidate/candidates.js` - Candidate profiles and resume uploads
- `auth.js` - Authentication (JWT + Google OAuth)

**Controllers** (`src/controllers/`):
- Map routes to service functions, handle request validation
- `aiController.js` - Orchestrates AI service calls
- `advancedNLPController.js` - Advanced NLP endpoints (matching, roadmaps)

**Models** (`src/models/`):
- Mongoose schemas with validation and middleware
- **Important**: `LearningRoadmap` (used in `/api/nlp/learning-roadmap`) vs `SkillRoadmap` (legacy model in `/api/roadmaps`)

**Middleware** (`src/middleware/`):
- `auth.js` - JWT authentication, role-based access control
- `globalRateLimit.js` - Rate limiting (global, API, search, upload limits)
- `errorHandler.js` - Centralized error handling

**Utils** (`src/utils/`):
- `logger.js` - Winston logger (console + file)
- Helper functions for validation, data transformation

## Key Development Patterns

### AI Service Call Pattern

When working with AI services, always follow this priority:

1. **PhoBERT First** (Default, Self-Sufficient)
```javascript
const skillExtractionService = require('./services/ai/skillExtractionService');
const skills = await skillExtractionService.extractSkills(cvText, {
  usePhoBERT: true,   // DEFAULT: true
  useGemini: false,   // DEFAULT: false
  useHybrid: false    // ONLY use if explicitly needed
});
```

2. **Optional Gemini Enhancement** (Only when explicitly requested)
```javascript
const skills = await skillExtractionService.extractSkills(cvText, {
  useGemini: true,    // Enable Gemini enhancement
  useHybrid: true     // Use PhoBERT + Gemini hybrid
});
```

3. **Graceful Fallback** (Automatic)
- PhoBERT fails → Rule-based fallback
- Gemini unavailable → PhoBERT only (system continues working)

### Job Matching Score Formula

The `jobMatchingService` uses a weighted multi-dimensional scoring system:

```
Total Score = (Skills × 0.40) + (Experience × 0.30) + (Education × 0.15) + (Projects × 0.15)

Tiers:
- A (90-100%): Perfect match - Immediate interview
- B (75-89%):  Strong match - High priority
- C (60-74%):  Good match - Consider
- D (<60%):    Weak match - Not recommended
```

When modifying scoring logic, update weights in `src/services/ai/jobMatchingService.js:calculateMatchScore()`.

### Learning Roadmap Generation Flow

```
1. Skill Gap Analysis (learningRoadmapService.analyzeSkillGaps)
   ↓
2. Prioritize Skills by urgency: critical > important > optional
   ↓
3. Search ChromaDB for learning resources (vectorStoreService.searchSimilarDocuments)
   ↓
4. Generate weekly roadmap with milestones and tasks
   ↓
5. Return structured roadmap with phases, resources, estimated hours
```

**Critical**: Skill gaps are categorized as:
- **critical**: Required skills completely missing
- **important**: Preferred skills missing
- **optional**: Nice-to-have skills missing

### Error Handling Pattern

All async route handlers should use `express-async-handler`:

```javascript
const asyncHandler = require('express-async-handler');

router.post('/analyze-cv', asyncHandler(async (req, res) => {
  const result = await aiService.analyzeCV(req.body.cvText);
  res.json({ success: true, data: result });
}));
```

Errors are caught by `src/middleware/errorHandler.js` and formatted consistently.

## Environment Variables

**Critical Variables** (Required):
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 3000)

**AI/NLP Configuration** (Optional for core features):
- `GEMINI_API_KEY` - Google Gemini API key (OPTIONAL - enhancement only)
- `GEMINI_MODEL` - Gemini model name (default: `gemini-2.0-flash`)
- `USE_LOCAL_EMBEDDINGS` - Use local Sentence-BERT (default: `true`)
- `USE_LOCAL_LLM` - Use local Ollama instead of Gemini (default: `true`)
- `ALLOW_RULE_BASED_FALLBACK` - Enable rule-based fallback (default: `true`)

**External Services** (Optional):
- `REDIS_URL` - Redis connection URL (system works without Redis)
- `CLOUDINARY_*` - File upload (cloud storage)
- `SMTP_*` - Email notifications
- `OLLAMA_URL` - Local Ollama LLM endpoint (optional)

**Important**: The system is designed to work with **minimal configuration**. PhoBERT and core AI features work offline without any external API keys.

## Testing AI/NLP Features

### Quick Evaluation (Recommended)

```bash
node src/research/evaluation/quickEvaluate.js
```

Runs evaluation on 50 CVs from `thesis/datasets/processed/test.jsonl`. Compares:
- PhoBERT NER (trained model)
- Rule-based fallback (baseline)

Outputs precision, recall, F1 score, and saves results to `thesis/results/`.

### Testing Individual AI Services

```javascript
// Test PhoBERT skill extraction
const phobertService = require('./src/services/phobertService');
const result = await phobertService.extractSkills('Tôi có 3 năm kinh nghiệm với React và Node.js');

// Test job matching
const jobMatchingService = require('./src/services/ai/jobMatchingService');
const matches = await jobMatchingService.findMatchingCandidates(job, candidates);

// Test learning roadmap
const learningRoadmapService = require('./src/services/ai/learningRoadmapService');
const roadmap = await learningRoadmapService.generateRoadmapForJob(job, candidateProfile, 12);
```

### API Testing

Import Postman collections from `postman/`:
1. **AI_CV_Analysis_Learning_Roadmap.postman_collection.json** - Primary AI features
2. **Advanced_NLP_APIs.postman_collection.json** - NLP endpoints
3. **Jobs_API.postman_collection.json** - Job management

Set environment variables:
- `base_url` = `http://localhost:3000/api`
- `candidate_token` = JWT token from `/api/auth/login`

## Common Pitfalls & Solutions

### PhoBERT Model Issues

**Problem**: `python phobert_inference.py` fails or returns empty results

**Solution**:
1. Verify model exists: `ls -lh models/phobert-cv-ner-final/`
2. Check Python dependencies: `cd python && pip install -r requirements.txt`
3. Test model health: `python python/phobert_inference.py --check`
4. Check logs in `logs/error.log` for Python subprocess errors

**Important**: PhoBERT model files (~1.8 GB) should be in `models/phobert-cv-ner-final/`. If missing, the system will fall back to rule-based extraction.

### MongoDB Connection Issues

**Problem**: Server fails to start with "Database connection error"

**Solution**:
1. Verify `MONGO_URI` in `.env` is correct
2. Check MongoDB cluster is accessible (network/firewall)
3. Test connection: `mongosh "<MONGO_URI>"`

### Redis Optional but Recommended

**Problem**: "Redis connection refused" warnings

**Impact**: Non-critical. System continues without Redis, but loses caching and session features.

**Solution**:
- Install Redis locally: `npm run redis:install` (if script exists)
- Use cloud Redis: Set `REDIS_URL` to cloud provider URL
- Disable Redis: Remove `REDIS_URL` from `.env` (warnings are expected)

### ChromaDB Vector Store

**Problem**: Learning roadmap returns generic resources instead of relevant ones

**Solution**:
1. Populate/refresh vector DB: `npm run rag:populate`
2. Check ChromaDB health: `npm run rag:health`
3. If corrupted: `npm run rag:clear && npm run rag:populate`

Vector DB is stored in `data/chromadb/` (embedded SQLite). Delete folder to reset.

## Development Guidelines

### When Adding New AI Features

1. **Self-Sufficient First**: Always implement using PhoBERT/Sentence-BERT/TF-IDF before considering external APIs
2. **Graceful Fallback**: External APIs (Gemini, Ollama) must have fallback to self-sufficient methods
3. **Optional Enhancement**: External APIs should enhance, not replace, core functionality
4. **Performance**: Aim for <500ms response time for CV analysis, <2s for roadmap generation

### When Modifying Matching Algorithms

1. **Document Scoring Formula**: Update comments in service file and this CLAUDE.md
2. **Test with Real Data**: Run `node src/research/evaluation/quickEvaluate.js` after changes
3. **Preserve Tiers**: Keep A/B/C/D tier system for consistency with frontend
4. **Version Results**: Save evaluation results to `thesis/results/` with timestamps

### When Working with Models

1. **Mongoose Schemas**: Always add validation and indexes for frequently queried fields
2. **Migration Strategy**: For schema changes, consider backward compatibility
3. **Model Files**: Located in `src/models/` (NOT `models/` which is for ML models)
4. **Naming Convention**: Use PascalCase for model names, singular form (e.g., `Candidate` not `Candidates`)

### Code Style

- Follow existing patterns in the codebase
- Use `async/await` over promises chains
- Wrap route handlers with `express-async-handler`
- Log important operations with `logger.info()`, errors with `logger.error()`
- Return consistent JSON format: `{ success: boolean, data?: any, error?: string }`

## Useful Resources

**API Documentation**: `http://localhost:3000/api-docs` (Swagger UI when server running)

**Project Documentation**:
- `README.md` - Comprehensive project overview and NLP stack details
- `ARCHITECTURE.md` - Detailed system design (if exists)
- `thesis/` - Research datasets, evaluation results, thesis figures

**External Resources**:
- PhoBERT: https://github.com/VinAIResearch/PhoBERT
- Sentence-BERT: https://www.sbert.net/
- ChromaDB: https://docs.trychroma.com/

## Branch Strategy

- `master` - Main production branch (PR target)
- `develop` - Development branch (if exists)
- `hong/be` - Current working branch (feature branch pattern: `name/scope`)

When creating PRs, target the `master` branch unless instructed otherwise.
