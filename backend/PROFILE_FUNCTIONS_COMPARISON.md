# 🔍 PROFILE FUNCTIONS COMPARISON

## 📊 So sánh 3 Profile Functions

### 1. 👤 **getUserProfile** (UserController)

**Route**: `GET /api/users/profile`  
**Scope**: Universal profile getter for ANY user role  
**Technology**: Sử dụng UnifiedProfileService.getCompleteProfile()

```javascript
const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const result = await UnifiedProfileService.getCompleteProfile(
      req.user.id,
      req.user.role // 👈 Dynamic role detection
    );
    UnifiedProfileService.successResponse(res, null, result);
  } catch (error) {
    UnifiedProfileService.handleError(error, res, 'Lấy thông tin hồ sơ');
  }
});
```

**Data returned**:

```javascript
{
  success: true,
  data: {
    user: {
      id, email, fullName, role, authMethod,
      isEmailVerified, isActive, avatar, phone,
      lastLogin, createdAt, updatedAt
    },
    profile: {
      // Role-specific fields based on req.user.role
      // For candidate: education, skills, preferences, resume, experience
      // For employer: company, position, contact, businessInfo, legalRepresentative
    }
  }
}
```

### 2. 🏢 **getProfile** (EmployerProfileController)

**Route**: `GET /api/employers/profile`  
**Scope**: Employer-specific profile only  
**Technology**: Sử dụng EmployerServices.getProfile()

```javascript
const getProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await EmployerServices.getProfile(req.user.id);
    return success(res, 'Lấy profile thành công', {
      _id: profile._id,
      company: profile.company,
      businessInfo: profile.businessInfo,
      legalRepresentative: profile.legalRepresentative,
      contact: profile.contact,
      position: profile.position,
      stats: profile.stats,
      status: profile.status,
      verification: profile.verification,
      companyMembers: profile.companyMembers,
      documents: profile.documents || [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (err) {
    return error(res, 'Lỗi lấy profile', err);
  }
});
```

**Data returned**: Complete EmployerProfile object with detailed company info

### 3. 👨‍🎓 **getProfile** (CandidateProfileController)

**Route**: `GET /api/candidates/:userId` or `GET /api/candidates/profile`  
**Scope**: Candidate-specific profile only  
**Technology**: Direct CandidateProfile query with ensureCandidateProfile()

```javascript
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await ensureCandidateProfile(userId);
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  res.status(200).json({ success: true, data: profile });
});
```

**Data returned**: Complete CandidateProfile object

## 🎯 **Key Differences**

### **Architecture Approach**:

| Function             | Service Layer            | Auto-Creation             | Role Handling            |
| -------------------- | ------------------------ | ------------------------- | ------------------------ |
| getUserProfile       | ✅ UnifiedProfileService | ❌ Read-only              | ✅ Dynamic based on role |
| employer/getProfile  | ✅ EmployerServices      | ✅ Creates if missing     | ❌ Employer only         |
| candidate/getProfile | ❌ Direct model access   | ✅ ensureCandidateProfile | ❌ Candidate only        |

### **Data Structure**:

```javascript
// getUserProfile - Unified response
{
  user: { /* User table fields */ },
  profile: { /* Role-specific profile */ }
}

// employer/getProfile - Direct EmployerProfile
{
  _id, company, businessInfo, verification,
  documents, stats, status, ...
}

// candidate/getProfile - Direct CandidateProfile
{
  userId, education, skills, experience,
  resume, preferences, ...
}
```

### **Use Cases**:

#### 🌟 **getUserProfile** - Best for:

- Dashboard trang chủ
- Navigation bars (hiển thị user info + role-specific data)
- Universal profile display
- Mobile apps (single endpoint cho mọi role)

#### 🏢 **employer/getProfile** - Best for:

- Employer dashboard
- Company management pages
- Document verification workflows
- Detailed company information editing

#### 👨‍🎓 **candidate/getProfile** - Best for:

- Candidate dashboard
- Resume management
- Job application workflows
- Skills and education editing

## 🚨 **Issues Identified**

### 1. **Inconsistent Architecture**:

- UserController uses service layer ✅
- EmployerController uses service layer ✅
- CandidateController uses direct model access ❌

### 2. **Response Format Inconsistency**:

- getUserProfile: `{ user: {}, profile: {} }`
- employer/getProfile: Direct profile object
- candidate/getProfile: Direct profile object

### 3. **Auto-Creation Logic**:

- EmployerServices.getProfile(): Auto-creates if missing ✅
- ensureCandidateProfile(): Auto-creates if missing ✅
- getUserProfile(): No auto-creation, may return empty profile ❌

## ✅ **Recommendations**

### 1. **Standardize CandidateController**:

```javascript
// Move to service layer approach
const profile = await CandidateServices.getProfile(req.user.id);
```

### 2. **Unify Response Formats**:

All profile endpoints should return consistent structure

### 3. **Role-Based Routing Strategy**:

```javascript
// Option A: Keep separate endpoints (current)
GET /api/users/profile          # Universal
GET /api/employers/profile      # Employer-specific
GET /api/candidates/profile     # Candidate-specific

// Option B: Unified endpoint with role detection
GET /api/profile               # Auto-detect role
```

### 4. **Auto-Creation Consistency**:

All profile getters should auto-create if missing

## 🎯 **Current Status**

- **getUserProfile**: ✅ Universal but limited auto-creation
- **employer/getProfile**: ✅ Complete with auto-creation
- **candidate/getProfile**: ⚠️ Needs service layer refactor

Employer profile system đã hoàn thiện nhất, candidate system cần cải tiến để đạt consistency!
