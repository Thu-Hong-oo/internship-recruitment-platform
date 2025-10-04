# API V2 Documentation - Optimized Candidate & AI Endpoints

## Overview

This document describes the optimized API V2 structure that consolidates over 200 endpoints into 80 using modern patterns including:

- **Pattern-based design**: Unified endpoints with action parameters
- **Flexible data loading**: `?include` query parameters for selective data retrieval
- **Section-based CRUD**: Dynamic section management for candidate profiles
- **Action-based operations**: Single endpoints handling multiple related operations
- **Comprehensive AI integration**: 8 AI endpoints covering all candidate AI needs

## Architecture Principles

### 1. Unified Endpoint Pattern

Instead of separate endpoints for each operation, we use action parameters:

```
❌ Old approach:
POST /api/candidates/education/create
PUT /api/candidates/education/update/:id
DELETE /api/candidates/education/delete/:id

✅ New approach:
POST /api/v2/candidates/profile/sections/education?action=create
PUT /api/v2/candidates/profile/sections/education/:itemId?action=update
DELETE /api/v2/candidates/profile/sections/education/:itemId?action=delete
```

### 2. Flexible Data Loading

Use `?include` parameters to load only needed data:

```
GET /api/v2/candidates/profile?include=basic,education,skills
GET /api/v2/candidates/profile?include=all
GET /api/v2/candidates/profile  // Basic info only
```

### 3. Section-based Management

All profile sections use consistent patterns:

```
GET    /api/v2/candidates/profile/sections/:section          // Get section data
POST   /api/v2/candidates/profile/sections/:section          // Add to section
PUT    /api/v2/candidates/profile/sections/:section/:itemId  // Update item
DELETE /api/v2/candidates/profile/sections/:section/:itemId  // Delete item
```

## Core Candidate API (12 Endpoints)

### 1. Profile Management (3 endpoints)

#### GET /api/v2/candidates/profile

Get candidate profile with flexible data loading.

**Query Parameters:**

- `include` (string): Comma-separated sections to include
  - Valid values: `basic,contact,education,experience,skills,projects,certifications,languages,preferences,resume,progress,settings`
  - Special value: `all` includes everything
  - Default: Returns basic info only

**Examples:**

```bash
GET /api/v2/candidates/profile?include=basic,education,skills
GET /api/v2/candidates/profile?include=all
GET /api/v2/candidates/profile  # Basic info only
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "basic": { ... },
    "education": { ... },  // Only if included
    "skills": { ... },     // Only if included
    "profileCompletion": {
      "percentage": 85,
      "completedSections": ["basic", "education"],
      "missingSections": ["experience"]
    }
  },
  "metadata": {
    "dataIncluded": ["basic", "education", "skills"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /api/v2/candidates/profile

Update multiple profile sections in a single request.

**Request Body:**

```json
{
  "basic": {
    "fullName": "John Doe",
    "title": "Software Engineer",
    "summary": "Passionate developer..."
  },
  "contact": {
    "phone": "+1234567890",
    "location": "San Francisco, CA"
  }
}
```

#### DELETE /api/v2/candidates/profile

Delete entire candidate profile (soft delete).

### 2. Section Management (4 endpoints)

#### GET /api/v2/candidates/profile/sections/:section

Get specific section data.

**Path Parameters:**

- `section`: Section name (education, experience, skills, etc.)

**Examples:**

```bash
GET /api/v2/candidates/profile/sections/education
GET /api/v2/candidates/profile/sections/skills
```

#### POST /api/v2/candidates/profile/sections/:section

Add new item to a section.

**Examples:**

```bash
POST /api/v2/candidates/profile/sections/education
{
  "institution": "Stanford University",
  "degree": "Bachelor of Science",
  "field": "Computer Science",
  "startDate": "2020-09-01",
  "endDate": "2024-05-15"
}

POST /api/v2/candidates/profile/sections/skills
{
  "category": "technical",
  "name": "React",
  "level": "intermediate",
  "endorsements": 5
}
```

#### PUT /api/v2/candidates/profile/sections/:section/:itemId

Update specific item within a section.

**Path Parameters:**

- `section`: Section name
- `itemId`: ID of the item to update

#### DELETE /api/v2/candidates/profile/sections/:section/:itemId

Delete specific item from a section.

### 3. Resume Operations (2 endpoints)

#### POST /api/v2/candidates/resume

Upload and manage resume files.

**Query Parameters:**

- `action`: Operation type (`upload`, `update`, `delete`)

**Examples:**

```bash
POST /api/v2/candidates/resume?action=upload
Content-Type: multipart/form-data
# File upload with metadata

POST /api/v2/candidates/resume?action=update
{
  "version": "latest",
  "metadata": {
    "title": "Software Engineer Resume",
    "description": "Updated with latest projects"
  }
}
```

#### GET /api/v2/candidates/resume

Get resume information and download links.

**Query Parameters:**

- `version`: Resume version (`current`, `previous`, specific ID)
- `format`: Response format (`metadata`, `download`)

### 4. Applications & Jobs (2 endpoints)

#### GET /api/v2/candidates/applications

Get candidate's job applications with filtering.

**Query Parameters:**

- `status`: Filter by status (`pending`, `reviewed`, `accepted`, `rejected`)
- `page`, `limit`: Pagination
- `sort`: Sorting (`-appliedAt`, `status`)

#### POST /api/v2/candidates/jobs/:jobId

Apply to a job or manage job-related actions.

**Query Parameters:**

- `action`: Action type (`apply`, `withdraw`, `save`, `unsave`)

**Examples:**

```bash
POST /api/v2/candidates/jobs/507f1f77bcf86cd799439011?action=apply
{
  "coverLetter": "I am excited to apply...",
  "resumeVersion": "latest"
}

POST /api/v2/candidates/jobs/507f1f77bcf86cd799439011?action=save
```

### 5. Companies & Insights (1 endpoint)

#### GET /api/v2/candidates/companies

Get company information and candidate-company interactions.

**Query Parameters:**

- `action`: Action type (`following`, `applied`, `interested`, `all`)
- `include`: Data to include (`basic`, `jobs`, `insights`)

**Examples:**

```bash
GET /api/v2/candidates/companies?action=following&include=basic,jobs
GET /api/v2/candidates/companies?action=applied&include=insights
```

## AI Endpoints (8 Endpoints)

### 1. Recommendations & Matching (2 endpoints)

#### GET /api/v2/ai/candidates/recommendations

Unified recommendations for all types.

**Query Parameters:**

- `type`: Recommendation type (`jobs`, `skills`, `courses`, `career-paths`, `similar-jobs`)
- `limit`: Number of recommendations (1-50, default: 10)
- `job_id`: Required for `similar-jobs` type
- `current_role`, `target_role`: For `career-paths` type

**Examples:**

```bash
GET /api/v2/ai/candidates/recommendations?type=jobs&limit=5
GET /api/v2/ai/candidates/recommendations?type=skills&limit=8
GET /api/v2/ai/candidates/recommendations?type=similar-jobs&job_id=507f...&limit=3
GET /api/v2/ai/candidates/recommendations?type=career-paths&current_role=intern&target_role=senior-developer
```

**Response:**

```json
{
  "success": true,
  "message": "Job recommendations generated successfully",
  "data": {
    "type": "jobs",
    "recommendations": {
      "jobs": [
        {
          "id": "...",
          "title": "Software Engineer",
          "company": "TechCorp",
          "matchScore": 0.92,
          "reasons": ["React skills match", "Location preference"]
        }
      ],
      "criteria_used": {
        "skills": ["React", "JavaScript"],
        "locations": ["San Francisco"],
        "experience_level": "junior"
      },
      "personalization_score": 85
    },
    "profile_id": "...",
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET/POST /api/v2/ai/candidates/matching

Job matching analysis with multiple action types.

**Query Parameters:**

- `job_id`: Job ID for single job analysis
- `action`: Action type (`score`, `analysis`, `fit`, `compare`)
- `job_ids`: Comma-separated job IDs for comparison (GET method)

**Request Body (POST for compare):**

```json
{
  "job_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Examples:**

```bash
GET /api/v2/ai/candidates/matching?job_id=507f...&action=score
GET /api/v2/ai/candidates/matching?job_id=507f...&action=analysis
GET /api/v2/ai/candidates/matching?action=compare&job_ids=id1,id2,id3
POST /api/v2/ai/candidates/matching?action=compare
```

### 2. Search & Resume AI (3 endpoints)

#### POST /api/v2/ai/candidates/search

Semantic search for jobs and companies.

**Request Body:**

```json
{
  "query": "machine learning positions at tech startups with remote options",
  "type": "jobs" // or "companies"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Semantic jobs search completed successfully",
  "data": {
    "query": "machine learning positions...",
    "type": "jobs",
    "results": {
      "items": [...],
      "total_found": 45,
      "semantic_matches": [...],
      "personalized": true
    },
    "search_metadata": {
      "personalized": true,
      "result_count": 20,
      "search_time": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### POST /api/v2/ai/candidates/resume

Resume AI operations.

**Request Body:**

```json
{
  "action": "analyze", // "analyze", "optimize", "score", "ats-check"
  "target_job_id": "507f1f77bcf86cd799439011" // optional
}
```

**Examples:**

```bash
POST /api/v2/ai/candidates/resume
{
  "action": "analyze"
}

POST /api/v2/ai/candidates/resume
{
  "action": "optimize",
  "target_job_id": "507f1f77bcf86cd799439011"
}

POST /api/v2/ai/candidates/resume
{
  "action": "score",
  "target_job_id": "507f1f77bcf86cd799439011"
}
```

#### POST /api/v2/ai/candidates/resume/builder

AI resume content generation.

**Request Body:**

```json
{
  "action": "summary",  // "summary", "bullets", "skills", "tailor"
  "data": {             // optional, required for "bullets"
    "position": "Software Intern",
    "company": "TechCorp",
    "responsibilities": [...],
    "achievements": [...]
  },
  "job_id": "507f..."   // optional, required for "tailor"
}
```

### 3. Career Development (2 endpoints)

#### GET /api/v2/ai/candidates/career

Career development analysis.

**Query Parameters:**

- `type`: Analysis type (`path`, `skill-gap`, `learning`)
- `current_role`, `target_role`: Role information
- `skill`: Specific skill for learning paths
- `level`: Skill level (`beginner`, `intermediate`, `advanced`)

**Examples:**

```bash
GET /api/v2/ai/candidates/career?type=path&current_role=intern&target_role=senior-developer
GET /api/v2/ai/candidates/career?type=skill-gap&target_role=data-scientist
GET /api/v2/ai/candidates/career?type=learning&skill=react&level=intermediate
```

#### POST /api/v2/ai/candidates/career/:pathId

Career path actions.

**Request Body:**

```json
{
  "action": "select" // "select" or "enroll"
}
```

### 4. Interview Preparation (1 endpoint)

#### POST /api/v2/ai/candidates/interview

Interview preparation and mock interviews.

**Request Body:**

```json
{
  "job_id": "507f1f77bcf86cd799439011",
  "action": "prep" // "prep" or "mock"
}
```

**Mock Interview Example:**

```json
{
  "job_id": "507f1f77bcf86cd799439011",
  "action": "mock",
  "questions": ["Tell me about yourself", "What are your strengths?"],
  "answers": ["I'm a passionate developer...", "My greatest strength is..."]
}
```

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": 400,
    "details": {
      "field": "validation error details"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

Common HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

## Rate Limiting

Different rate limits apply based on endpoint type:

- **Regular APIs**: 100 requests per 15 minutes
- **AI APIs**: 50 requests per 15 minutes
- **Heavy AI operations** (resume analysis, mock interviews): 10 requests per 15 minutes

Rate limit headers:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248600
```

## Authentication

All endpoints require authentication via Bearer token:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Examples Collection

### Complete Job Application Workflow

```bash
# 1. Get job recommendations
GET /api/v2/ai/candidates/recommendations?type=jobs&limit=5

# 2. Analyze job compatibility
GET /api/v2/ai/candidates/matching?job_id=507f...&action=analysis

# 3. Optimize resume for job
POST /api/v2/ai/candidates/resume
{
  "action": "optimize",
  "target_job_id": "507f1f77bcf86cd799439011"
}

# 4. Apply to job
POST /api/v2/candidates/jobs/507f1f77bcf86cd799439011?action=apply
{
  "coverLetter": "...",
  "resumeVersion": "latest"
}

# 5. Prepare for interview
POST /api/v2/ai/candidates/interview
{
  "job_id": "507f1f77bcf86cd799439011",
  "action": "prep"
}
```

### Profile Management Workflow

```bash
# 1. Get current profile
GET /api/v2/candidates/profile?include=basic,education,skills

# 2. Add new education
POST /api/v2/candidates/profile/sections/education
{
  "institution": "Stanford University",
  "degree": "Master of Science",
  "field": "Computer Science"
}

# 3. Update skills
POST /api/v2/candidates/profile/sections/skills
{
  "category": "technical",
  "name": "Machine Learning",
  "level": "advanced"
}

# 4. Upload resume
POST /api/v2/candidates/resume?action=upload
# Multipart form data with file

# 5. Check completion
GET /api/v2/candidates/profile?include=basic
# Response includes profileCompletion data
```

## Migration Guide

### From V1 to V2

1. **Update endpoint URLs**:

   ```
   /api/candidates/* → /api/v2/candidates/*
   ```

2. **Replace multiple requests with include parameters**:

   ```bash
   # Old (3 requests)
   GET /api/candidates/profile
   GET /api/candidates/education
   GET /api/candidates/skills

   # New (1 request)
   GET /api/v2/candidates/profile?include=basic,education,skills
   ```

3. **Use section-based endpoints**:

   ```bash
   # Old
   POST /api/candidates/education/create

   # New
   POST /api/v2/candidates/profile/sections/education
   ```

4. **Update AI endpoint calls**:

   ```bash
   # Old (multiple endpoints)
   GET /api/ai/job-recommendations
   GET /api/ai/skill-recommendations

   # New (unified endpoint)
   GET /api/v2/ai/candidates/recommendations?type=jobs
   GET /api/v2/ai/candidates/recommendations?type=skills
   ```

## Best Practices

1. **Use include parameters** to minimize data transfer
2. **Implement proper error handling** for all API calls
3. **Respect rate limits** and implement backoff strategies
4. **Cache responses** where appropriate
5. **Use pagination** for large data sets
6. **Validate data** before sending to API
7. **Handle async operations** properly for AI endpoints

This documentation provides comprehensive coverage of the optimized API V2 structure, enabling efficient integration and usage of all candidate and AI features.
