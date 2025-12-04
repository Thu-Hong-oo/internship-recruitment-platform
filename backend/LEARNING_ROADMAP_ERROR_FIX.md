# ❌ Learning Roadmap RAG Error - Troubleshooting Guide

## 🔍 Error Message
```json
{
  "success": false,
  "message": "Unable to identify skill gaps. Please ensure you have a complete profile with skills, experience, and education.",
  "details": {
    "candidateId": "68da2e6362b86d4ab4daff7b",
    "suggestion": "Please complete your profile at /api/candidate-profile or provide targetRole in request body"
  }
}
```

**API**: `POST /api/nlp/learning-roadmap-rag`

---

## 🎯 Root Cause

**Primary Issue**: **Candidate Profile does not exist in database**

Your database currently has:
- ❌ **0 candidate profiles**
- ❌ **0 candidate users**

The API flow:
```
1. API receives: { candidateId: "68da2e6362b86d4ab4daff7b" }
2. Tries to find CandidateProfile with userId = "68da2e6362b86d4ab4daff7b"
3. ❌ NOT FOUND
4. Cannot calculate skill gaps without CV data
5. Returns error message
```

---

## ✅ Solutions

### Solution 1: Create User & Profile (Recommended for Real Testing)

#### Step 1: Register a Candidate User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "testcandidate@example.com",
  "password": "Test123!@#",
  "fullName": "Test Candidate",
  "role": "candidate"
}
```

**Response**:
```json
{
  "success": true,
  "token": "<JWT_TOKEN>",
  "user": {
    "_id": "675e8a41fb6068fb80971f65",  // Use this as candidateId
    "email": "testcandidate@example.com",
    "role": "candidate"
  }
}
```

#### Step 2: Create Candidate Profile
```bash
POST /api/candidate-profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "skills": {
    "technical": [
      { "name": "React", "level": "intermediate" },
      { "name": "JavaScript", "level": "advanced" },
      { "name": "HTML", "level": "advanced" },
      { "name": "CSS", "level": "advanced" },
      { "name": "Node.js", "level": "intermediate" },
      { "name": "Git", "level": "intermediate" }
    ],
    "soft": ["Communication", "Teamwork", "Problem Solving"],
    "languages": [
      { "name": "English", "proficiency": "intermediate" },
      { "name": "Vietnamese", "proficiency": "native" }
    ]
  },
  "experience": {
    "internships": [
      {
        "company": "Tech Company",
        "position": "Frontend Developer Intern",
        "startDate": "2023-06-01",
        "endDate": "2023-09-01",
        "description": "Developed web applications",
        "skills": ["React", "JavaScript"]
      }
    ]
  },
  "education": {
    "university": {
      "name": "University of Technology",
      "degree": "Bachelor's Degree",
      "major": "Computer Science",
      "graduationYear": 2025
    }
  },
  "targetJob": {
    "title": "Frontend Developer",
    "level": "mid"
  }
}
```

#### Step 3: Call Learning Roadmap RAG
```bash
POST /api/nlp/learning-roadmap-rag
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "candidateId": "675e8a41fb6068fb80971f65",  // From Step 1
  "targetRole": "Frontend Developer",
  "timeframe": 12
}
```

---

### Solution 2: Use Script to Create Test Data (Faster)

#### If you have a valid User ID:
```bash
# First, find existing users
node -e "const m=require('mongoose'),U=require('./src/models/User');m.connect('mongodb://localhost:27017/internship-platform').then(async()=>{const u=await U.find({role:'candidate'}).select('_id email');console.log('Users:',u);process.exit(0)});"

# Then create profile with that user ID
node scripts/create-test-profile.js <userId>
```

#### If no users exist:
You **must** create user via API first (Solution 1, Step 1).

---

### Solution 3: Provide Complete CV Data in Request (Bypass Profile)

If you don't want to create profile, provide `cvData` directly:

```bash
POST /api/nlp/learning-roadmap-rag
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "targetRole": "Frontend Developer",
  "cvData": {
    "skills": {
      "technical": ["React", "JavaScript", "HTML", "CSS", "Node.js"],
      "soft": ["Communication", "Teamwork"]
    },
    "experience": [
      {
        "position": "Frontend Developer Intern",
        "company": "Tech Company",
        "startDate": "2023-06-01",
        "endDate": "2023-09-01"
      }
    ],
    "education": [
      {
        "degree": "Bachelor's Degree",
        "major": "Computer Science",
        "school": "University of Technology"
      }
    ]
  },
  "timeframe": 12
}
```

**Note**: This bypasses the database profile but still requires valid authentication.

---

### Solution 4: Provide Job ID (Best for Skill Gap Analysis)

If you have a specific job in mind:

```bash
POST /api/nlp/learning-roadmap-rag
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "candidateId": "<userId>",
  "targetJobId": "677b5a0ed3eff8fc71a6f654",  // Actual job in database
  "timeframe": 12
}
```

This will:
1. Get job requirements
2. Get candidate profile
3. Calculate skill gaps automatically
4. Generate roadmap

---

## 🔧 Quick Fix Commands

### Check Database State
```bash
# Check if users exist
node -e "const m=require('mongoose'),U=require('./src/models/User');m.connect('mongodb://localhost:27017/internship-platform').then(async()=>{const c=await U.countDocuments({role:'candidate'});console.log('Candidate users:',c);process.exit(0)});"

# Check if profiles exist
node -e "const m=require('mongoose'),C=require('./src/models/CandidateProfile');m.connect('mongodb://localhost:27017/internship-platform').then(async()=>{const c=await C.countDocuments();console.log('Candidate profiles:',c);process.exit(0)});"

# Check if jobs exist
node -e "const m=require('mongoose'),J=require('./src/models/Job');m.connect('mongodb://localhost:27017/internship-platform').then(async()=>{const c=await J.countDocuments();console.log('Jobs:',c);process.exit(0)});"
```

### Debug Specific Candidate
```bash
node scripts/debug-roadmap-rag.js <candidateId>
```

---

## 📊 Required Data for API to Work

The API needs **at least ONE** of these:

### Option A: Profile in Database
- ✅ User exists with role='candidate'
- ✅ CandidateProfile exists with skills
- ✅ Provide `candidateId` + `targetRole` OR `targetJobId`

### Option B: CV Data in Request
- ✅ Provide `cvData` object with skills
- ✅ Provide `targetRole`

### Option C: Job-based Analysis
- ✅ Provide `targetJobId` (job must exist)
- ✅ Provide `candidateId` (profile must exist)

---

## ✅ Verification Steps

After creating profile, verify:

```bash
# 1. Check profile exists
node scripts/debug-roadmap-rag.js <candidateId>

# Should show:
# ✅ Candidate profile found
# ✅ Technical Skills: X
# ✅ Profile looks good!

# 2. Test API
POST /api/nlp/learning-roadmap-rag
{
  "candidateId": "<candidateId>",
  "targetRole": "Frontend Developer",
  "timeframe": 12
}

# Should return:
# ✅ 201 Created
# ✅ roadmap object with phases, resources, etc.
```

---

## 🎯 Summary

**Your Current Issue**: No candidate profile exists in database.

**Quick Fix**: 
1. Register user: `POST /api/auth/register` (role: candidate)
2. Create profile: `POST /api/candidate-profile` (with skills)
3. Retry API: `POST /api/nlp/learning-roadmap-rag` (with candidateId + targetRole)

**Root Cause**: Database is empty (no users, no profiles).

**API is Working Correctly**: It's checking for required data and returning appropriate error message.

---

Generated: 2025-12-04  
Issue: Missing Candidate Profile  
Status: ✅ Solutions Provided
