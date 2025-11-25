# 🔐 Phân Tích Lỗi Authentication: "Not authorized to access this route"

## 🔴 Lỗi

```
error: Error: Not authorized to access this route
at D:\...\backend\src\middleware\auth.js:51:11
url: /api/candidates/me/resume
method: POST
```

---

## 📊 Nguyên Nhân

### **1. Route Yêu Cầu Authentication**

**File:** `backend/src/routes/candidate/candidates.js`

```javascript
// Line 15-16: Áp dụng authentication cho TẤT CẢ routes
router.use(protect);           // Yêu cầu JWT token
router.use(authorize('candidate')); // Chỉ cho phép role 'candidate'
```

**Route:** `POST /api/candidates/me/resume`
- ✅ Yêu cầu: JWT token trong header
- ✅ Yêu cầu: Role = 'candidate'

### **2. Middleware `protect` Kiểm Tra Token**

**File:** `backend/src/middleware/auth.js` (line 10-53)

```javascript
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new AppError('Not authorized to access this route', 401); // Line 23
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    // Check if account is active
    if (!req.user.isActive && req.originalUrl !== '/api/users/reactivate') {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản đã bị tạm ngưng...',
      });
    }

    next();
  } catch (error) {
    // If error is already AppError, throw it
    if (error.statusCode) {
      throw error;
    }
    // Otherwise, wrap in AppError with 401 status
    throw new AppError('Not authorized to access this route', 401); // Line 51 ← LỖI XẢY RA Ở ĐÂY
  }
});
```

---

## 🔍 Các Nguyên Nhân Có Thể

### **1. Không Có Token** ❌
```
Request không có header: Authorization: Bearer <token>
```

**Giải pháp:**
- ✅ Thêm header: `Authorization: Bearer <your-jwt-token>`

### **2. Token Không Hợp Lệ** ❌
```
Token đã hết hạn, bị sửa đổi, hoặc không đúng format
```

**Giải pháp:**
- ✅ Đăng nhập lại để lấy token mới
- ✅ Kiểm tra token có đúng format JWT không

### **3. Token Verify Fail** ❌
```
verifyToken(token) throw error → catch block → Line 51
```

**Nguyên nhân:**
- Token đã hết hạn (expired)
- Token signature không hợp lệ
- JWT_SECRET không khớp

### **4. User Không Tồn Tại** ❌
```
User.findById(decoded.id) return null → "User not found"
```

**Nguyên nhân:**
- User đã bị xóa
- Token chứa ID không tồn tại

### **5. User Role Không Phù Hợp** ❌
```
authorize('candidate') → User role không phải 'candidate'
```

**Nguyên nhân:**
- User có role khác (employer, admin, etc.)

---

## ✅ Giải Pháp

### **1. Kiểm Tra Request Headers**

**Đảm bảo request có:**
```http
POST /api/candidates/me/resume
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Ví dụ với cURL:**
```bash
curl -X POST http://localhost:5000/api/candidates/me/resume \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@resume.pdf" \
  -F "action=parse"
```

### **2. Kiểm Tra Token**

**Lấy token từ đăng nhập:**
```http
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Kiểm tra token có hợp lệ:**
- ✅ Format: `Bearer <token>`
- ✅ Token chưa hết hạn
- ✅ Token được tạo từ cùng JWT_SECRET

### **3. Kiểm Tra User Role**

**Đảm bảo user có role 'candidate':**
```javascript
// User model
{
  role: 'candidate', // ✅ Phải là 'candidate'
  isActive: true     // ✅ Phải là true
}
```

### **4. Debug Steps**

**1. Kiểm tra token trong request:**
```javascript
console.log('Authorization header:', req.headers.authorization);
```

**2. Kiểm tra token decode:**
```javascript
const decoded = verifyToken(token);
console.log('Decoded token:', decoded);
```

**3. Kiểm tra user:**
```javascript
const user = await User.findById(decoded.id);
console.log('User:', user);
console.log('User role:', user.role);
console.log('User isActive:', user.isActive);
```

---

## 🎯 Checklist

Trước khi gọi API, đảm bảo:

- [ ] ✅ Request có header `Authorization: Bearer <token>`
- [ ] ✅ Token hợp lệ và chưa hết hạn
- [ ] ✅ User tồn tại trong database
- [ ] ✅ User có role = 'candidate'
- [ ] ✅ User.isActive = true
- [ ] ✅ JWT_SECRET trong .env khớp với khi tạo token

---

## 📝 Code References

- **Auth Middleware**: `backend/src/middleware/auth.js` (line 10-53)
- **Route Definition**: `backend/src/routes/candidate/candidates.js` (line 15-16, 61-66)
- **Resume Controller**: `backend/src/controllers/candidate/ResumeController.js` (line 255-275)

---

## 🚀 Quick Fix

**Nếu đang test từ frontend:**

1. **Kiểm tra token trong localStorage/sessionStorage:**
```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);
```

2. **Thêm token vào request:**
```javascript
fetch('/api/candidates/me/resume', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});
```

3. **Nếu token không có hoặc hết hạn:**
```javascript
// Đăng nhập lại
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { token } = await response.json();
localStorage.setItem('token', token);
```

---

**Tài liệu này giải thích lỗi authentication và cách fix.**

