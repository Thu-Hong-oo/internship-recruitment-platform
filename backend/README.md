# 🚀 Internship Recruitment Platform - Backend

> **Self-Sufficient AI/NLP Recruitment Platform** - No mandatory external AI APIs required

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![PhoBERT](https://img.shields.io/badge/PhoBERT-F1%2096%25-orange.svg)](https://github.com/VinAIResearch/PhoBERT)
[![Sentence-BERT](https://img.shields.io/badge/Sentence--BERT-768--dim-purple.svg)](https://www.sbert.net/)

## 📋 Table of Contents

- [Overview](#overview)
- [Self-Sufficient NLP Stack](#self-sufficient-nlp-stack)
- [Architecture](#architecture)
- [Core AI Services](#core-ai-services)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 🎯 Overview

A modern recruitment platform backend built with **self-sufficient AI/NLP capabilities**:

- ✅ **No mandatory external AI APIs** (Google Gemini optional for enhancement only)
- ✅ **Fine-tuned PhoBERT** for Vietnamese skill extraction (F1 score: 96%)
- ✅ **Sentence-BERT** for semantic similarity (768-dimensional embeddings)
- ✅ **TF-IDF + Cosine Similarity** for job-candidate matching
- ✅ **ChromaDB Vector Store** for learning resource recommendations
- ✅ **Self-hosted & Offline Capable** - No internet required for core features

**Use Cases:**
- 🎓 Candidate CV analysis and skill extraction
- 💼 Job recommendations for candidates
- 👥 Candidate recommendations for employers
- 📊 Job-candidate matching with detailed scoring
- 🎯 Skill gap analysis with priority levels
- 📚 Personalized learning roadmaps with weekly plans

---

## 🧠 Self-Sufficient NLP Stack

### Why Self-Sufficient?

Traditional recruitment platforms depend on expensive external AI APIs (OpenAI, Google Gemini, etc.) which:
- ❌ Cost money per API call
- ❌ Require internet connectivity
- ❌ Have rate limits and quotas
- ❌ Send sensitive data to external servers
- ❌ Cannot be customized for Vietnamese language

**Our Solution:** Build a complete self-sufficient NLP stack using:

### 1️⃣ PhoBERT NER (Primary Skill Extraction)

**Fine-tuned Vietnamese BERT model** for Named Entity Recognition:
- **Model:** `vinai/phobert-base-v2` fine-tuned on Vietnamese recruitment dataset
- **Performance:** F1 score **96%** on skill extraction task
- **Size:** 1.8 GB (stored locally in `models/phobert-cv-ner-final/`)
- **Confidence Threshold:** 0.88 (filters low-quality predictions)
- **Entities:** SKILL, EXPERIENCE, EDUCATION, CERTIFICATE, LANGUAGE, FRAMEWORK, TOOL

```javascript
// Example: Extract skills from CV text
const skills = await skillExtractionService.extractSkillsFromText(cvText);
// Returns: ["React", "Node.js", "MongoDB", "Docker", "AWS"]
```

**Why PhoBERT?**
- ✅ Fine-tuned specifically for Vietnamese recruitment domain
- ✅ High accuracy (96% F1) vs baseline rule-based (65% F1)
- ✅ Understands context (e.g., "React 3 năm kinh nghiệm" → skill + experience)
- ✅ Handles Vietnamese-specific patterns (tone marks, multi-word skills)

### 2️⃣ Sentence-BERT (Semantic Similarity)

**Multilingual sentence embeddings** for semantic matching:
- **Model:** `paraphrase-multilingual-mpnet-base-v2`
- **Dimensions:** 768-dimensional dense vectors
- **Supports:** Vietnamese, English, and 50+ languages
- **Use Cases:** 
  - Job description similarity
  - Candidate profile matching
  - Learning resource recommendations

```javascript
// Example: Calculate semantic similarity between job and CV
const similarity = await sentenceBertService.calculateSimilarity(
  jobDescription,
  candidateCV
);
// Returns: 0.87 (87% similar)
```

**Why Sentence-BERT?**
- ✅ Captures semantic meaning beyond keyword matching
- ✅ Multilingual support (handles mixed Vietnamese-English text)
- ✅ Fast inference (milliseconds per sentence)
- ✅ Pre-trained on paraphrase task (ideal for job matching)

### 3️⃣ TF-IDF + Cosine Similarity (Fast Matching)

**Traditional NLP algorithms** for quick scoring:
- **TF-IDF:** Term Frequency-Inverse Document Frequency vectorization
- **Cosine Similarity:** Measures angle between document vectors
- **Performance:** < 100ms per job-candidate pair
- **Use Cases:**
  - Quick candidate filtering (top 100 from 10,000+)
  - Keyword-based matching
  - Fallback when semantic models unavailable

```javascript
// Example: Match job with candidate pool
const matches = await jobMatchingService.findMatchingCandidates(job, candidates);
// Returns: [
//   { candidateId, score: 0.92, tier: 'A', matchDetails: {...} },
//   { candidateId, score: 0.85, tier: 'B', matchDetails: {...} }
// ]
```

**Scoring Formula:**
```
Total Score = (Skills * 0.40) + (Experience * 0.30) + (Education * 0.15) + (Projects * 0.15)
```

### 4️⃣ ChromaDB (Vector Store)

**Local vector database** for learning resources:
- **Storage:** Embedded SQLite database (no external service)
- **Collections:** Skills, tutorials, courses, documentation
- **Search:** Similarity search with TF-IDF + embeddings
- **Size:** ~500 MB (10,000+ learning resources)

```javascript
// Example: Find learning resources for skill gap
const resources = await vectorStoreService.searchSimilarDocuments(
  'React Hooks',
  { limit: 5 }
);
// Returns: [
//   { title: "React Hooks Tutorial", url: "...", relevance: 0.95 },
//   { title: "useEffect Deep Dive", url: "...", relevance: 0.89 }
// ]
```

### 5️⃣ Optional: Google Gemini (Enhancement Only)

**External AI API** for advanced features (completely optional):
- ⚠️ **NOT REQUIRED** for core functionality
- 🎨 Used only for: Interview question generation, CV summary enhancement
- 💰 Free tier: 15 RPM, 1M TPM, 1.5k RPD
- 🔧 Graceful fallback: System works without Gemini API key

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (Express)                       │
│  /api/ai/*  /api/nlp/*  /api/jobs/*  /api/candidates/*         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼─────────┐
│   AI Services   │                    │  Business Logic  │
│  (Self-Sufficient)                   │  (Jobs, Users)  │
└───────┬────────┘                    └────────┬─────────┘
        │                                       │
        │  ┌────────────────────────────────────┘
        │  │
┌───────▼──▼──────────────────────────────────────────────────────┐
│                     Core AI/NLP Services                         │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ PhoBERT NER     │  │ Sentence-BERT    │  │ TF-IDF         │ │
│  │ (Skill Extract) │  │ (Semantic Match) │  │ (Fast Match)   │ │
│  │ F1: 96%         │  │ 768-dim vectors  │  │ < 100ms        │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Job Matching    │  │ Candidate Rec    │  │ Learning       │ │
│  │ Service         │  │ Service          │  │ Roadmap        │ │
│  │ (Multi-dim)     │  │ (Reverse Match)  │  │ (Skill Gaps)   │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐                     │
│  │ ChromaDB        │  │ Rule-Based       │                     │
│  │ (Vector Store)  │  │ (Baseline)       │                     │
│  │ 10k+ resources  │  │ Fallback         │                     │
│  └─────────────────┘  └──────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐     ┌───────▼────────┐
        │   PostgreSQL    │     │   File Storage │
        │   (Database)    │     │   (Uploads)    │
        └────────────────┘     └────────────────┘
```

### Folder Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── ai/
│   │   │   ├── skillExtractionService.js     # PhoBERT NER (PRIMARY)
│   │   │   ├── sentenceBertService.js        # Semantic similarity
│   │   │   ├── jobMatchingService.js         # Job-candidate matching
│   │   │   ├── candidateRecommendationService.js  # Reverse matching
│   │   │   ├── learningRoadmapService.js     # Skill gap + roadmap
│   │   │   ├── aiService.js                  # High-level orchestration
│   │   │   ├── ruleBasedCVParser.js          # Baseline fallback
│   │   │   └── vectorStoreService.js         # ChromaDB wrapper
│   │   └── ...
│   ├── controllers/
│   │   ├── aiController.js                   # /api/ai/* endpoints
│   │   ├── advancedNLPController.js          # /api/nlp/* endpoints
│   │   └── roadmapController.js              # Learning roadmap
│   ├── routes/
│   │   ├── ai.js                             # AI/CV analysis routes
│   │   ├── advancedNLP.js                    # Advanced NLP routes
│   │   └── ...
│   └── research/
│       └── evaluation/
│           ├── quickEvaluate.js              # Fast evaluation script
│           └── modelEvaluator.js             # Comprehensive evaluation
├── models/
│   └── phobert-cv-ner-final/                 # Fine-tuned PhoBERT (1.8 GB)
├── python/
│   ├── phobert_inference.py                  # Python PhoBERT wrapper
│   ├── finetune_phobert.py                   # Training script
│   └── generate_charts.py                    # Thesis visualizations
├── thesis/
│   ├── datasets/                             # Training/test datasets
│   ├── results/                              # Evaluation results
│   └── figures/                              # Charts and visualizations
├── postman/                                  # API collections
│   ├── AI_CV_Analysis_Learning_Roadmap.postman_collection.json
│   ├── Advanced_NLP_APIs.postman_collection.json
│   └── Jobs_API.postman_collection.json
└── tests/                                    # Unit and integration tests
```

---

## 🎨 Core AI Services

### 1. Skill Extraction Service

**Location:** `src/services/ai/skillExtractionService.js`

**Purpose:** Extract skills, experience, education, and entities from CV text using PhoBERT NER.

**Methods:**
- `extractSkillsFromText(text, options)` - Extract all entities from text
- `extractSkillsFromCV(cvData)` - Extract from structured CV
- `extractJobSkills(jobDescription)` - Extract required skills from job posting
- `categorizeSkills(skills)` - Categorize into technical/soft/language skills
- `normalizeSkill(skill)` - Normalize skill names (e.g., "ReactJS" → "React")

**Example:**
```javascript
const skillExtractionService = require('./services/ai/skillExtractionService');

const cvText = `
  Tôi có 3 năm kinh nghiệm phát triển web với React, Node.js, và MongoDB.
  Tốt nghiệp Đại học Bách Khoa chuyên ngành Khoa học máy tính.
  Có chứng chỉ AWS Certified Solutions Architect.
`;

const result = await skillExtractionService.extractSkillsFromText(cvText);

console.log(result);
// Output:
// {
//   skills: ["React", "Node.js", "MongoDB"],
//   experience: ["3 năm kinh nghiệm phát triển web"],
//   education: ["Đại học Bách Khoa", "Khoa học máy tính"],
//   certificates: ["AWS Certified Solutions Architect"],
//   confidence: 0.94
// }
```

**Performance:**
- F1 Score: **96%** on test dataset (417 CVs)
- Confidence threshold: **0.88** (filters low-quality predictions)
- Processing time: ~200ms per CV

### 2. Job Matching Service

**Location:** `src/services/ai/jobMatchingService.js`

**Purpose:** Match candidates with jobs using multi-dimensional scoring algorithm.

**Scoring Components:**
- **Skills Match (40%):** TF-IDF + Sentence-BERT similarity
- **Experience Match (30%):** Years of experience + domain relevance
- **Education Match (15%):** Degree level + field of study
- **Projects Match (15%):** Relevant projects + technologies

**Tier System:**
- **Tier A (90-100%):** Perfect match - Immediate interview
- **Tier B (75-89%):** Strong match - High priority
- **Tier C (60-74%):** Good match - Consider
- **Tier D (<60%):** Weak match - Not recommended

**Methods:**
- `findMatchingCandidates(job, candidatePool, options)` - Find best candidates for job
- `calculateMatchScore(job, candidate)` - Calculate detailed match score
- `analyzeMatchDetails(job, candidate)` - Get detailed match breakdown
- `generateMatchReport(matches)` - Generate human-readable report

**Example:**
```javascript
const jobMatchingService = require('./services/ai/jobMatchingService');

const job = {
  title: 'Senior Full Stack Developer',
  description: 'We need a developer with 5+ years experience in React, Node.js, AWS...',
  requiredSkills: ['React', 'Node.js', 'TypeScript', 'AWS'],
  experienceYears: 5
};

const candidates = await Candidate.find({ isActive: true });

const matches = await jobMatchingService.findMatchingCandidates(job, candidates, {
  limit: 10,
  minScore: 0.6
});

console.log(matches);
// Output:
// [
//   {
//     candidateId: '123',
//     name: 'Nguyễn Văn A',
//     score: 0.92,
//     tier: 'A',
//     matchDetails: {
//       skillsScore: 0.95,
//       experienceScore: 0.88,
//       educationScore: 0.90,
//       projectsScore: 0.92
//     },
//     strengths: ['React expert', '6 years experience', 'AWS certified'],
//     concerns: ['Limited TypeScript experience'],
//     skillGaps: { missing: ['GraphQL'], weak: ['TypeScript'] }
//   }
// ]
```

### 3. Candidate Recommendation Service

**Location:** `src/services/ai/candidateRecommendationService.js`

**Purpose:** Reverse matching - Recommend candidates to employers based on job requirements.

**Features:**
- Reverse matching algorithm (job → candidates)
- Skill gap analysis with priority levels (critical/important/optional)
- AI-generated interview questions based on candidate profile
- Strengths and concerns analysis

**Methods:**
- `recommendCandidatesForJob(job, options)` - Get top candidates for job
- `analyzeSkillGap(jobSkills, candidateSkills)` - Analyze missing/weak skills
- `generateInterviewQuestions(job, candidate)` - Generate personalized questions
- `rankCandidates(candidates, job)` - Rank by relevance and fit

**Example:**
```javascript
const candidateRecommendationService = require('./services/ai/candidateRecommendationService');

const job = {
  id: 'job-456',
  title: 'Backend Developer',
  requiredSkills: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  experienceYears: 3
};

const recommendations = await candidateRecommendationService.recommendCandidatesForJob(job, {
  limit: 20,
  includeInterviewQuestions: true
});

console.log(recommendations);
// Output:
// [
//   {
//     candidateId: '789',
//     rank: 1,
//     score: 0.88,
//     tier: 'B',
//     matchDetails: {...},
//     skillGaps: {
//       critical: [],  // No critical missing skills
//       important: ['Docker'],
//       optional: ['Kubernetes']
//     },
//     interviewQuestions: [
//       'Describe your experience with Node.js microservices...',
//       'How would you optimize PostgreSQL queries for...',
//       'Explain your approach to API error handling...'
//     ]
//   }
// ]
```

### 4. Learning Roadmap Service

**Location:** `src/services/ai/learningRoadmapService.js`

**Purpose:** Generate personalized learning roadmaps based on skill gaps.

**Features:**
- Skill gap analysis (3 levels: critical, important, optional)
- Intelligent prioritization with time estimation
- Resource recommendations from ChromaDB vector store
- Weekly roadmap generation with milestones and tasks
- Adaptive difficulty calculation

**Methods:**
- `generateRoadmapForJob(job, candidateProfile, duration)` - Generate complete roadmap
- `analyzeSkillGaps(candidateSkills, jobSkills)` - Identify gaps by priority
- `prioritizeSkills(skillGaps, duration)` - Order skills with time estimates
- `findLearningResources(skillName)` - Search ChromaDB + fallback resources
- `createWeeklyRoadmap(prioritizedSkills, duration)` - Generate week-by-week plan
- `calculateDifficulty(skillGaps, experience)` - Determine difficulty level

**Example:**
```javascript
const learningRoadmapService = require('./services/ai/learningRoadmapService');

const job = {
  title: 'Full Stack Developer',
  requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker']
};

const candidateProfile = {
  currentSkills: ['JavaScript', 'React', 'HTML', 'CSS'],
  experienceYears: 2
};

const roadmap = await learningRoadmapService.generateRoadmapForJob(
  job,
  candidateProfile,
  12  // 12 weeks duration
);

console.log(roadmap);
// Output:
// {
//   metadata: {
//     candidateId: '...',
//     jobId: '...',
//     duration: 12,
//     difficulty: 'intermediate'
//   },
//   skillGaps: {
//     critical: ['Node.js', 'MongoDB'],  // Required but missing
//     important: ['TypeScript'],          // Preferred but missing
//     optional: ['Docker']                // Nice-to-have
//   },
//   phases: [
//     {
//       phase: 'Foundation (Weeks 1-4)',
//       weeks: [
//         {
//           week: 1,
//           title: 'Node.js Fundamentals',
//           description: 'Learn Node.js basics, async/await, and Express...',
//           skills: ['Node.js'],
//           resources: [
//             { title: 'Node.js Official Docs', url: '...', type: 'documentation' },
//             { title: 'Node.js Crash Course', url: '...', type: 'video' }
//           ],
//           tasks: [
//             'Complete Node.js tutorial',
//             'Build a REST API',
//             'Practice async/await'
//           ],
//           estimatedHours: 15,
//           milestone: 'Build your first Node.js server'
//         }
//       ]
//     }
//   ],
//   estimatedCompletionDate: '2025-03-02'
// }
```

---

## 🔌 API Endpoints

### AI & CV Analysis (`/api/ai/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze-cv` | Analyze CV and extract skills/experience |
| POST | `/api/ai/job-recommendations` | Get job recommendations for candidate |
| POST | `/api/ai/candidate-recommendations` | Get candidate recommendations for job (employer) |
| POST | `/api/ai/skill-gap-analysis` | Analyze skill gaps between candidate and job |
| POST | `/api/ai/match-cv-job` | Match CV with job and calculate score |

### Advanced NLP (`/api/nlp/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nlp/matching-score` | Calculate detailed matching score |
| POST | `/api/nlp/learning-roadmap` | Generate personalized learning roadmap |
| POST | `/api/nlp/skill-similarity` | Calculate skill similarity |
| POST | `/api/nlp/semantic-search` | Semantic search in job/candidate database |

### Jobs & Candidates (Standard CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create new job |
| GET | `/api/jobs/:id` | Get job details |
| PUT | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |

**Full API Documentation:** Import Postman collections from `/postman/` folder

---

## 📦 Installation

### Prerequisites

- **Node.js:** >= 18.x
- **Python:** >= 3.8 (for PhoBERT inference)
- **PostgreSQL:** >= 14.x
- **RAM:** >= 8 GB (recommended 16 GB for PhoBERT)
- **Storage:** >= 10 GB free space

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/internship-recruitment-platform.git
cd internship-recruitment-platform/backend
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

**Key Dependencies:**
- `express` - Web framework
- `pg`, `sequelize` - PostgreSQL ORM
- `@google/generative-ai` - Gemini API (optional)
- `natural` - NLP library (TF-IDF)
- `chromadb` - Vector database
- `jsonwebtoken`, `bcryptjs` - Authentication

### Step 3: Install Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

**Key Python Dependencies:**
- `transformers` - Hugging Face Transformers
- `torch` - PyTorch (PhoBERT backend)
- `sentence-transformers` - Sentence-BERT
- `numpy`, `pandas` - Data processing

### Step 4: Download PhoBERT Model

**Option A: Download Pre-trained Model** (Recommended)

```bash
# Download from Google Drive / Hugging Face
# Place in backend/models/phobert-cv-ner-final/
```

**Option B: Train Your Own Model**

```bash
cd python
python finetune_phobert.py --dataset ../thesis/datasets/processed/train.jsonl
```

**Model Files:**
```
models/phobert-cv-ner-final/
├── config.json              # Model configuration
├── pytorch_model.bin        # Model weights (1.8 GB)
├── tokenizer_config.json    # Tokenizer config
├── vocab.txt                # Vocabulary
└── special_tokens_map.json  # Special tokens
```

### Step 5: Setup Database

```bash
# Create PostgreSQL database
createdb recruitment_platform

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

### Step 6: Configure Environment Variables

Create `.env` file in `backend/` folder:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recruitment_platform
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_secret_key_here

# Google Gemini (OPTIONAL - for enhancement only)
GEMINI_API_KEY=your_gemini_api_key_here

# PhoBERT Model Path
PHOBERT_MODEL_PATH=./models/phobert-cv-ner-final

# Sentence-BERT Model
SBERT_MODEL_NAME=bkai-foundation-models/vietnamese-bi-encoder

# Performance Tuning (optional)
SENTENCE_BERT_CHECK_TIMEOUT_MS=60000  # 60 seconds for model loading
PYTHON_CMD=python                      # or 'py' on Windows

# ChromaDB (Vector Database)
# For Docker: Use http://chromadb:8000 (service name in docker-compose)
# For Local: Use http://localhost:8000
CHROMA_URL=http://localhost:8000
CHROMADB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=learning-resources
CHROMADB_PATH=./data/chromadb  # Only for embedded mode (not used in Docker)
```

**⚠️ Important:** `GEMINI_API_KEY` is **optional**. System works without it.

### Step 7: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

---

## ⚙️ Configuration

### AI/NLP Configuration

Edit `src/config/ai.config.js`:

```javascript
module.exports = {
  // PhoBERT NER Configuration
  phobert: {
    modelPath: process.env.PHOBERT_MODEL_PATH || './models/phobert-cv-ner-final',
    confidenceThreshold: 0.88,  // Minimum confidence for predictions
    maxLength: 512,              // Maximum token length
    batchSize: 16,               // Inference batch size
    device: 'cpu'                // 'cpu' or 'cuda'
  },

  // Sentence-BERT Configuration
  sentenceBert: {
    modelName: process.env.SBERT_MODEL_NAME || 'paraphrase-multilingual-mpnet-base-v2',
    dimensions: 768,
    batchSize: 32,
    maxLength: 256
  },

  // Job Matching Configuration
  jobMatching: {
    weights: {
      skills: 0.40,
      experience: 0.30,
      education: 0.15,
      projects: 0.15
    },
    tierThresholds: {
      A: 0.90,  // 90-100%
      B: 0.75,  // 75-89%
      C: 0.60,  // 60-74%
      D: 0.00   // <60%
    },
    minScore: 0.50  // Minimum score to return
  },

  // Learning Roadmap Configuration
  learningRoadmap: {
    defaultDuration: 12,  // weeks
    priorityWeights: {
      critical: 3,
      important: 2,
      optional: 1
    },
    hoursPerWeek: 15,
    resourcesPerSkill: 5
  },

  // Gemini API (Optional)
  gemini: {
    enabled: !!process.env.GEMINI_API_KEY,
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    fallback: true  // Use self-sufficient methods if Gemini fails
  }
};
```

---

## 🚀 Deployment

### Docker Deployment (Recommended)

**Step 1: Build Docker Image**

```bash
docker build -t recruitment-backend:latest .
```

**Step 2: Run with Docker Compose**

The `docker-compose.yml` file includes all required services:
- **Backend**: Node.js application
- **MongoDB**: Database
- **Redis**: Caching
- **ChromaDB**: Vector database for RAG (Learning Roadmap)

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f chromadb
```

**ChromaDB Configuration:**
- ChromaDB runs on port `8000`
- Data is persisted in `chromadb_data` volume
- Backend connects via `http://chromadb:8000` (internal Docker network)
- Collection name: `learning-resources`

**Environment Variables for ChromaDB:**
```bash
CHROMA_URL=http://chromadb:8000
CHROMADB_URL=http://chromadb:8000
CHROMA_COLLECTION_NAME=learning-resources
```

### Manual Deployment (VPS/Cloud)

**Step 1: Install Dependencies on Server**

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.8+
sudo apt-get install -y python3 python3-pip

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
```

**Step 2: Clone and Setup**

```bash
git clone https://github.com/your-org/internship-recruitment-platform.git
cd internship-recruitment-platform/backend
npm install --production
cd python && pip3 install -r requirements.txt
```

**Step 3: Configure PM2 (Process Manager)**

```bash
npm install -g pm2

# Start server with PM2
pm2 start server.js --name "recruitment-backend"

# Enable auto-restart on server reboot
pm2 startup
pm2 save
```

**Step 4: Setup Nginx Reverse Proxy**

```nginx
# /etc/nginx/sites-available/recruitment-backend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/recruitment-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/services/skillExtractionService.test.js

# Run with coverage
npm run test:coverage
```

### Performance Testing

**Sentence-BERT Performance Test:**

```bash
node scripts/test-sentence-bert-performance.js
```

**Output Example:**
```
🔍 Testing Sentence-BERT Performance...

Test 1: Model Availability
✅ Available: true (150ms)

Test 2: Single Text Encoding
✅ Embedding dimension: 768
⏱️ Time: 523ms

Test 3: Batch Encoding (10 texts)
✅ Encoded 10 texts
⏱️ Total time: 1234ms
⏱️ Average per text: 123.40ms

Test 4: Similarity Batch (Job Matching Simulation)
✅ Compared 1 job skill vs 12 candidate skills
⏱️ Time: 456ms

Test 5: Multiple Queries Performance Test
Old Method (Sequential): ⏱️ Time: 1823ms (3 Python calls)
New Method (Parallel): ⏱️ Time: 645ms (parallel execution)
🚀 Performance improvement: ~182% faster!
```

**Important Notes:**
- **First run**: Slower (~30-60s) due to model download from HuggingFace
- **Subsequent runs**: Fast (~5-10s) using cached model
- **Cache location**: `backend/models/sentence_bert_cache/`

See [SENTENCE_BERT_OPTIMIZATION.md](SENTENCE_BERT_OPTIMIZATION.md) for details.

### AI/NLP Evaluation

**Quick Evaluation** (Fast, uses real services):

```bash
node src/research/evaluation/quickEvaluate.js
```

**Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║           QUICK EVALUATION REPORT                             ║
╠═══════════════════════════════════════════════════════════════╣
║ Test Dataset: 50 CVs from thesis/datasets/processed/test.jsonl║
║ Date: 2025-12-02 15:30:45                                     ║
╠═══════════════════════════════════════════════════════════════╣
║ SKILL EXTRACTION PERFORMANCE                                  ║
╟───────────────────────────────────────────────────────────────╢
║ Method        │ Precision │ Recall │ F1 Score │ Accuracy      ║
╟───────────────┼───────────┼────────┼──────────┼───────────────╢
║ PhoBERT NER   │  0.94     │  0.90  │   0.92   │   0.91       ║
║ Rule-Based    │  0.72     │  0.65  │   0.68   │   0.70       ║
╚═══════════════════════════════════════════════════════════════╝

Results saved to: thesis/results/evaluation-results.json
```

**Comprehensive Evaluation** (Slower, more detailed):

```bash
node src/research/evaluation/modelEvaluator.js
```

**Generate Thesis Visualizations**:

```bash
cd python
python generate_charts.py
```

Creates:
- `thesis/figures/comparison-bar-chart.png`
- `thesis/figures/precision-recall-curve.png`
- `thesis/figures/confusion-matrix.png`
- `thesis/tables/results-table.tex` (LaTeX format)

### API Testing with Postman

Import collections from `postman/` folder:

1. **AI_CV_Analysis_Learning_Roadmap.postman_collection.json** - CV analysis, job/candidate recommendations
2. **Advanced_NLP_APIs.postman_collection.json** - Matching scores, learning roadmaps
3. **Jobs_API.postman_collection.json** - Job CRUD operations

**Environment Variables:**
- `base_url` = `http://localhost:3000/api`
- `candidate_token` = JWT token for candidate
- `employer_token` = JWT token for employer

---

## 📚 Documentation

### Additional Documentation Files

- **ARCHITECTURE.md** - Detailed system architecture and design decisions
- **RESEARCH_SUMMARY.md** - NLP research and algorithm explanations
- **KAGGLE_DATASET_GUIDE.md** - Dataset creation and preparation guide
- **THESIS_ACTION_PLAN.md** - Thesis milestones and progress tracking
- **postman/POSTMAN_COLLECTIONS_GUIDE.md** - API testing guide

### Code Documentation

All services include inline JSDoc comments:

```javascript
/**
 * Extract skills from CV text using PhoBERT NER
 * @param {string} text - Raw CV text
 * @param {Object} options - Extraction options
 * @param {number} options.confidenceThreshold - Minimum confidence (default: 0.88)
 * @param {boolean} options.normalize - Normalize skill names (default: true)
 * @returns {Promise<Object>} Extracted entities with confidence scores
 */
async extractSkillsFromText(text, options = {}) {
  // Implementation
}
```

### API Documentation

Full API documentation available at:
- Swagger UI: `http://localhost:3000/api-docs` (when server running)
- Postman Collections: Import from `postman/` folder

---

## 🐛 Troubleshooting

### Sentence-BERT Performance Issues

#### ❌ Problem: Job matching takes too long (30+ seconds per job)

**Symptoms:**
```
error: ⏱️ Sentence-BERT timeout after 30s
error: ❌ Python script error (code null)
```

**Solutions:**

1. **First-time setup** (Model downloading):
   - ✅ **Expected behavior** - Model downloads from HuggingFace (~200MB)
   - Check progress: Model will be cached to `backend/models/sentence_bert_cache/`
   - Subsequent runs will be much faster

2. **Increase timeout** (if needed):
```bash
# .env file
SENTENCE_BERT_CHECK_TIMEOUT_MS=120000  # 2 minutes for first load
```

3. **Verify cache**:
```bash
ls -la backend/models/sentence_bert_cache/
# Should contain: bkai-foundation-models_vietnamese-bi-encoder/
```

4. **Test performance**:
```bash
node scripts/test-sentence-bert-performance.js
```

5. **Clear cache and retry** (if corrupted):
```bash
rm -rf backend/models/sentence_bert_cache/
# Restart server to re-download
```

**Expected Performance:**
- **First run**: 30-60 seconds (downloading model)
- **Subsequent runs**: 5-10 seconds per job
- **After optimization**: ~80% faster

See [SENTENCE_BERT_OPTIMIZATION.md](SENTENCE_BERT_OPTIMIZATION.md) for detailed guide.

### PhoBERT Not Loading

#### ❌ Problem: PhoBERT model not found

**Solution:**
```bash
# Check model directory
ls -la backend/models/phobert-cv-ner-final/

# Should contain:
# - config.json
# - pytorch_model.bin
# - vocab.txt
```

If missing, download from project repository or train your own model.

### Python Command Not Found

#### ❌ Problem: `Python not found (code 1)`

**Solutions:**

**Windows:**
```bash
# Set Python command in .env
PYTHON_CMD=py
# or
PYTHON_CMD=python3
```

**Linux/Mac:**
```bash
# Install Python 3.8+
sudo apt install python3 python3-pip  # Ubuntu
brew install python3                   # macOS

# Verify
python3 --version
```

### ChromaDB Connection Error

#### ❌ Problem: `ChromaDB client initialization failed`

**Solution:**
```bash
# Start ChromaDB with Docker
docker run -d -p 8000:8000 chromadb/chroma

# Verify connection
curl http://localhost:8000/api/v1/heartbeat
```

### High Memory Usage

#### ❌ Problem: Server using too much RAM

**Solutions:**

1. **Reduce batch sizes**:
```javascript
// src/config/ai.config.js
phobert: {
  batchSize: 8  // Reduce from 16 to 8
}
```

2. **Use CPU instead of GPU** (already default):
```python
# python/sentence_bert_inference.py
model = SentenceTransformer(MODEL_NAME, device='cpu')
```

3. **Limit concurrent job matching**:
```javascript
// Process jobs in smaller batches
const BATCH_SIZE = 5;  // Adjust based on RAM
```

### API Documentation

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- **ESLint:** Run `npm run lint` to check code style
- **Prettier:** Run `npm run format` to auto-format code
- Follow existing code patterns and conventions

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Thu Hong** - Backend Developer & AI/NLP Engineer
- **Project Supervisor** - Dr. [Supervisor Name]

---

## 🙏 Acknowledgments

- **VinAI Research** - PhoBERT pre-trained model
- **Sentence-Transformers** - Multilingual sentence embeddings
- **Hugging Face** - Transformers library and model hub
- **ChromaDB** - Vector database for resource recommendations

---

## 📧 Contact & Support

- **Email:** your.email@example.com
- **GitHub Issues:** [Report a bug](https://github.com/your-org/internship-recruitment-platform/issues)
- **Documentation:** [Wiki](https://github.com/your-org/internship-recruitment-platform/wiki)

---

## 🎓 Thesis Information

This backend is part of a **Bachelor's Thesis** project:

**Title:** "Building a Self-Sufficient AI-Powered Recruitment Platform Using Fine-Tuned Vietnamese BERT"

**University:** [Your University Name]

**Year:** 2024-2025

**Thesis Chapters:**
- Chapter 1: Introduction
- Chapter 2: Literature Review
- Chapter 3: Methodology (PhoBERT Fine-tuning, Sentence-BERT, TF-IDF)
- Chapter 4: Implementation (Services, APIs, Deployment)
- Chapter 5: Results and Evaluation (See `thesis/` folder)
- Chapter 6: Conclusion and Future Work

---

**⭐ Star this repo if you find it helpful!**

**🚀 Built with ❤️ using Self-Sufficient AI/NLP Stack**
