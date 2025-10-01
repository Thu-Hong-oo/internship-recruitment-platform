# 🔍 ROUTE ANALYSIS - Current vs Available

## 📊 Routes Currently Loaded in server.js

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
```

## 📁 Available Route Files

### ✅ **Currently Loaded**:

- `/api/auth` → `authRoutes` → `src/routes/auth.js`
- `/api/users` → `userRoutes` → `src/routes/users.js`
- `/api/admin` → `adminRoutes` → `src/routes/admin.js`
- `/api/employers` → `employerRoutes` → `src/routes/employerProfiles.js`
- `/api/jobs` → `jobRoutes` → `src/routes/jobs.js`
- `/api/candidates` → `candidateRoutes` → `src/routes/candidateProfiles.js`

### ❌ **MISSING Routes** (Available but not loaded):

- `src/routes/savedJobs.js` → Should be `/api/saved-jobs`
- `src/routes/roadmaps.js` → Should be `/api/roadmaps`
- `src/routes/notifications.js` → Should be `/api/notifications`
- `src/routes/skillCategories.js` → Should be `/api/skill-categories`
- `src/routes/skills.js` → Should be `/api/skills`
- `src/routes/skillRoadmaps.js` → Should be `/api/skill-roadmaps`
- `src/routes/webhooks.js` → Should be `/api/webhooks`
- `src/routes/aiAnalysis.js` → Should be `/api/ai-analysis`
- `src/routes/ai.js` → Should be `/api/ai`

## 🔧 Controller vs Route Mapping Analysis

### 📝 **Job Controller vs Routes** ✅ CORRECT

**Controller exports**:

```javascript
{
  getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    applyForJob,
    getJobApplications,
    getJobBySlug,
    incrementJobViews,
    getJobCompany,
    getJobStats,
    getRecentJobs,
    submitJobForReview,
    getEmployerJobs,
    getDraftJobs;
}
```

**Routes usage**:

```javascript
// All functions are properly imported and used ✅
```

### 🏢 **Employer Controller vs Routes** ✅ CORRECT

**Controller exports**:

```javascript
{
  getProfile,
    updateProfile,
    getCompanyInfo,
    updateCompanyInfo,
    getVerificationStatus,
    getDocumentTypes,
    uploadBusinessLicense,
    uploadTaxCertificate,
    removeDocument,
    getPostedJobs,
    getApplications,
    getAnalytics,
    getRecommendedCandidates,
    uploadCompanyLogo,
    uploadCoverImage,
    removeLogo,
    removeCoverImage,
    getPublicCompanyInfo;
}
```

**Routes usage**:

```javascript
// All main functions are properly imported and used ✅
// getPublicCompanyInfo might need separate route or update
```

## 🚨 **Critical Issues Found**

### 1. **Missing Routes in server.js**

Nhiều route files có sẵn nhưng không được load:

- Skills & Roadmaps management
- Notifications system
- Saved jobs functionality
- AI analysis features
- Webhooks support

### 2. **Middleware Application**

Routes hiện tại đã có middleware layers phù hợp:

- `requireEmployerProfile` cho basic operations
- `requireVerifiedEmployer` cho sensitive operations

### 3. **Route Order Issues** ⚠️

Trong `jobs.js`, có potential conflict:

```javascript
router.get('/employer', ...); // Should come before /:id
router.get('/drafts', ...);   // Should come before /:id
router.get('/:id', ...);      // Catch-all should be last
```

## ✅ **Recommendations**

### 1. **Add Missing Routes to server.js**

```javascript
// Add these to server.js
const savedJobRoutes = require('./src/routes/savedJobs');
const notificationRoutes = require('./src/routes/notifications');
const skillRoutes = require('./src/routes/skills');
const roadmapRoutes = require('./src/routes/roadmaps');
const aiRoutes = require('./src/routes/ai');

app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/ai', aiRoutes);
```

### 2. **Fix Route Order in jobs.js**

Move specific routes before parameterized routes

### 3. **Add Public Company Route**

Consider adding public company info route separately

## 📊 **Current Status**

- **Core Routes**: ✅ Working properly with correct middleware
- **Missing Routes**: ❌ 9 route files not loaded
- **Controller Mapping**: ✅ All functions properly exported/imported
- **Middleware Security**: ✅ Proper verification layers applied

## 🎯 **Next Steps**

1. Load missing routes in server.js
2. Test all endpoints
3. Verify middleware applications
4. Update API documentation
