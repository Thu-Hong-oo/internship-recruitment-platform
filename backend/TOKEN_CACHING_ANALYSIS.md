# 🚨 TOKEN CACHING & REDUNDANT ENDPOINTS ANALYSIS

## 🔍 **Vấn đề được phát hiện:**

### 1. **Token Caching Issue** 🐛

User báo: "get UserProfile với token employer nhưng trả về thông tin candidate trước đó"

#### **Root Cause Analysis:**

**Middleware Auth Logic** ✅ ĐÚNG:

```javascript
// src/middleware/auth.js - Line 28
req.user = await User.findById(decoded.id).select('-password');
```

👆 **Mỗi request đều query fresh data từ DB**, không có caching issue ở backend.

**UnifiedProfileService Logic** ✅ ĐÚNG:

```javascript
// Line 432-460
static async getCompleteProfile(userId, role) {
  const user = await User.findById(userId).select('-password'); // Fresh query

  if (role === 'candidate') {
    const candidateProfile = await CandidateProfile.findOne({ userId }); // Correct field
  } else if (role === 'employer') {
    const employerProfile = await EmployerProfile.findOne({ owner: userId }); // Correct field
  }
}
```

👆 **Logic đúng**, query đúng fields.

#### **Possible Issues:**

1. **Frontend Token Caching** 🔥

   - Browser localStorage/sessionStorage chưa clear token cũ
   - Frontend app chưa reload user context sau login
   - Token expiry chưa được handle properly

2. **Database State Issue** ⚠️

   - User role trong DB chưa được update
   - Profile data còn link tới user ID cũ

3. **Race Condition** ⚠️
   - Multiple requests đồng thời
   - Session conflicts

### 2. **Redundant Endpoints Issue** ❌

#### **Current Status:**

```javascript
// 3 endpoints làm việc giống nhau:
GET /api/users/profile          -> getUserProfile() -> UnifiedProfileService.getCompleteProfile()
GET /api/employers/profile      -> getProfile() -> EmployerServices.getProfile()
GET /api/candidates/profile     -> getProfile() -> Direct model query
```

#### **Why 3 endpoints when 1 is enough?** 🤔

**getUserProfile** đã trả về:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "role": "employer", // ← Dynamic role
      "email": "...",
      "fullName": "..."
    },
    "profile": {
      // ← Dynamic profile based on role
      // If employer: company, businessInfo, verification...
      // If candidate: education, skills, experience...
    }
  }
}
```

**employer/getProfile** trả về:

```json
{
  "success": true,
  "message": "Lấy profile thành công",
  "data": {
    "_id": "...",
    "company": {...},
    "businessInfo": {...},
    "verification": {...}
    // Only employer fields
  }
}
```

### 3. **Architecture Issues** 🏗️

#### **Inconsistent Service Usage:**

- **UserController**: ✅ Uses UnifiedProfileService
- **EmployerController**: ✅ Uses EmployerServices
- **CandidateController**: ❌ Direct model access

#### **Response Format Inconsistency:**

- **getUserProfile**: `{ user: {}, profile: {} }`
- **employer/getProfile**: Direct profile object
- **candidate/getProfile**: Direct profile object

## 💡 **SOLUTIONS**

### **Immediate Fix for Token Issue:**

#### 1. **Frontend Debug** 🔧

```javascript
// Check token payload
const token = localStorage.getItem('token');
const decoded = jwt_decode(token);
console.log('Token user ID:', decoded.id);
console.log('Token role:', decoded.role);

// Force clear token
localStorage.removeItem('token');
// Login lại
```

#### 2. **Backend Debug Endpoint** 🔍

```javascript
// Add to userController.js
const debugToken = asyncHandler(async (req, res) => {
  res.json({
    tokenUserId: req.user.id,
    tokenRole: req.user.role,
    dbUser: await User.findById(req.user.id).select('role'),
    timestamp: new Date().toISOString(),
  });
});
```

### **Long-term Architecture Fix:**

#### **Option A: Unify to Single Endpoint** ⭐ RECOMMENDED

```javascript
// Keep only GET /api/users/profile
// Remove redundant endpoints
// Fix UnifiedProfileService để return complete data
```

#### **Option B: Keep Specialized Endpoints**

```javascript
// GET /api/users/profile       -> Basic user info only
// GET /api/employers/profile   -> Full employer profile
// GET /api/candidates/profile  -> Full candidate profile
```

## 🎯 **RECOMMENDATIONS**

### **Phase 1: Debug Token Issue** 🚨

1. Add debug endpoint để check token content
2. Clear browser cache/localStorage
3. Login lại với user mới
4. Test với different browsers

### **Phase 2: Architecture Cleanup** 🧹

1. **Choose Option A**: Unify to single getUserProfile endpoint
2. Enhance UnifiedProfileService để return complete profile data
3. Remove redundant employer/candidate profile endpoints
4. Update frontend to use single endpoint

### **Phase 3: Service Layer Consistency** 🔧

1. Create CandidateServices (giống EmployerServices)
2. Standardize response formats
3. Improve error handling

## 🔄 **Testing Strategy**

1. **Login với candidate** → Call GET /api/users/profile → Check data
2. **Logout completely** → Clear all tokens
3. **Login với employer** → Call GET /api/users/profile → Check data
4. **Switch browsers** → Test cross-session isolation

**Expected Result**: getUserProfile should return correct role-specific data based on current token, không có caching issues.

## 🚀 **Conclusion**

- **Token caching**: Likely frontend issue, backend logic đúng
- **Redundant endpoints**: getUserProfile đã đủ cho most use cases
- **Architecture**: Cần cleanup để consistent và maintainable

**Immediate action**: Debug token content và clear browser cache! 🔥
