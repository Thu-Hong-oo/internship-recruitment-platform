# 🔍 AI Endpoints - Duplicate Analysis

## ❌ Endpoints Trùng Lặp

### 1. **CV Improvements Coordinates** (DUPLICATE)
```javascript
Line 107: router.post('/cv-improvements/coordinates', protect, aiController.detectCVImprovementCoordinates);
Line 108: router.post('/cv-improvements/coordinates', protect, aiController.detectCVImprovementCoordinates);
```
**Status:** ❌ **DUPLICATE** - Xóa 1 trong 2

---

### 2. **Candidate Recommendations** (DUPLICATE)
```javascript
Line 201: router.post('/candidate-recommendations', aiController.getCandidateRecommendations);
Line 300: router.post('/candidate-recommendations', aiController.getCandidateRecommendations);
```
**Status:** ❌ **DUPLICATE** - Xóa 1 trong 2 (giữ line 201, xóa line 300)

---

### 3. **Job Analysis** (ALIAS - OK nhưng có thể gây confusion)
```javascript
Line 262: router.post('/analyze-job-posting', aiController.analyzeJobPosting);
Line 312: router.post('/analyze-job', aiController.analyzeJobPosting);
```
**Status:** ⚠️ **ALIAS** - Có thể giữ nhưng nên mark deprecated cho `/analyze-job`

---

### 4. **Job Match Analysis** (ALIAS - OK)
```javascript
Line 384: router.post('/analyze-job-match', aiController.analyzeJobMatch); // DEPRECATED
Line 396: router.post('/job-match-analysis', aiController.analyzeJobMatch); // DEPRECATED
```
**Status:** ✅ **OK** - Cả 2 đều deprecated, redirect đến `/api/nlp/matching-score`

---

### 5. **Learning Roadmap** (ALIAS - OK)
```javascript
Line 546: router.post('/skill-roadmap', aiController.generateSkillRoadmap); // DEPRECATED
Line 558: router.post('/learning-roadmap', aiController.generateSkillRoadmap); // DEPRECATED
```
**Status:** ✅ **OK** - Cả 2 đều deprecated, redirect đến `/api/nlp/learning-roadmap`

---

### 6. **CV Suggestions** (ALIAS - OK)
```javascript
Line 591: router.post('/suggestions', aiController.getAISuggestions);
Line 603: router.post('/cv-suggestions', aiController.getAISuggestions); // DEPRECATED
```
**Status:** ✅ **OK** - `/cv-suggestions` đã deprecated

---

### 7. **Insights** (OK - Different purposes)
```javascript
Line 621: router.get('/insights', aiController.getAIInsights); // Auto-detect role
Line 635: router.get('/candidate-insights', aiController.getCandidateInsights); // Candidate only
Line 649: router.get('/employer-insights', aiController.getEmployerInsights); // Employer only
```
**Status:** ✅ **OK** - Khác nhau về mục đích

---

### 8. **Batch Analyze** (ALIAS - OK)
```javascript
Line 681: router.post('/batch-analyze-applications', aiController.batchAnalyzeApplications);
Line 696: router.post('/batch-analyze', aiController.batchAnalyzeApplications); // DEPRECATED
```
**Status:** ✅ **OK** - `/batch-analyze` đã deprecated

---

## 📊 Summary

| Type | Count | Action |
|------|-------|--------|
| **Duplicate (Remove)** | 2 | Xóa ngay |
| **Alias (Keep)** | 6 | OK, đã deprecated |
| **Different Purpose** | 3 | OK |

---

## 🔧 Actions Required

### 1. **Remove Duplicates:**
- ❌ Line 108: Remove duplicate `/cv-improvements/coordinates`
- ❌ Line 300: Remove duplicate `/candidate-recommendations`

### 2. **Mark Deprecated (Optional):**
- ⚠️ Line 312: Mark `/analyze-job` as deprecated (alias of `/analyze-job-posting`)

---

## 📝 Endpoint Usage for CV Improvements

### Current Flow:
```
User uploads CV
  ↓
POST /api/ai/analyze-cv
  ↓
Returns: {
  extractedText,
  personalInfo,
  experience,
  education,
  skills,
  analysis
}
  ↓
User requests improvements
  ↓
POST /api/ai/analyze-cv-improvements
  ↓
Currently: Re-parses CV data (inefficient)
```

### Recommended Flow:
```
User uploads CV
  ↓
POST /api/ai/analyze-cv
  ↓
Returns: {
  extractedText,
  personalInfo,
  experience,
  education,
  skills,
  analysis
}
  ↓
User requests improvements
  ↓
POST /api/ai/analyze-cv-improvements
  Body: {
    cvId: "xxx",  // Reference to analyzed CV
    // OR
    cvData: {...},  // Use data from analyze-cv response
    cvText: "...",
    targetJobId: "xxx"
  }
  ↓
Use cvData from analyze-cv (if provided)
  OR
Fetch from database using cvId
  OR
Re-parse (fallback)
```

---

## ✅ Recommended Changes

1. **Remove duplicate routes** (Line 108, 300)
2. **Update `analyzeCVImprovements`** to:
   - Accept `cvId` to fetch from database
   - Accept `cvData` from previous `/analyze-cv` response
   - Use provided data instead of re-parsing
3. **Document** that `/analyze-cv-improvements` can use data from `/analyze-cv`

---

**Date**: 2025-12-07  
**Status**: ⚠️ Needs Fix

