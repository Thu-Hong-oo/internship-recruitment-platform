# 📋 ĐÁNH GIÁ USERS API ENDPOINTS

## 1. ✅ CÁC ENDPOINT CẦN THIẾT

### Profile Management (7 endpoints)
- ✅ `GET /api/users/profile` - Lấy profile đầy đủ (user + profile theo role)
- ✅ `PUT /api/users/profile` - Cập nhật profile (hỗ trợ cả candidate và employer)
- ✅ `POST /api/users/avatar` - Upload avatar
- ❌ **THIẾU** `DELETE /api/users/avatar` - Xóa avatar
- ✅ `GET /api/users/:id` - Lấy thông tin user cơ bản
- ✅ `GET /api/users/:id/public-profile` - Lấy public profile (employer only)

### Account Management (5 endpoints)
- ✅ `PUT /api/users/password` - Đổi mật khẩu
- ✅ `POST /api/users/link-google` - Liên kết Google
- ✅ `DELETE /api/users/unlink-google` - Hủy liên kết Google
- ✅ `PUT /api/users/deactivate` - Tạm ngưng tài khoản
- ✅ `PUT /api/users/reactivate` - Kích hoạt lại tài khoản

### Preferences & Stats (2 endpoints)
- ✅ `PUT /api/users/preferences` - Cập nhật preferences
- ✅ `GET /api/users/stats` - Lấy thống kê user

### Notifications (4 endpoints)
- ✅ `GET /api/users/notifications` - Lấy danh sách notifications
- ✅ `PUT /api/users/notifications/read` - Đánh dấu đã đọc
- ✅ `PUT /api/users/notifications/read-all` - Đánh dấu tất cả đã đọc
- ✅ `DELETE /api/users/notifications` - Xóa notification

### Debug & Utilities (2 endpoints - NÊN XÓA TRONG PRODUCTION)
- ⚠️ `GET /api/users/debug-token` - Debug token (CHỈ DÙNG TRONG DEVELOPMENT)
- ⚠️ `GET /api/users/compare-profiles` - So sánh profile (CHỈ DÙNG TRONG DEVELOPMENT)

---

## 2. 🔍 PHÂN TÍCH CẤU TRÚC RESPONSE

### GET `/api/users/profile` (Employer)

**Response hiện tại:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "fullName": "...",
      "role": "employer",
      ...
    },
    "profile": {
      "company": { ... },
      "position": { ... },
      "contact": { ... },
      "businessInfo": { ... },
      "legalRepresentative": { ... }
    }
  }
}
```

**Lý do trả về như vậy:**
- ✅ **Đúng thiết kế**: `UnifiedProfileService.getCompleteProfile()` trả về `user` + `profile` theo role
- ✅ **Phân tách rõ ràng**: User info (chung) và Profile info (theo role)
- ⚠️ **Lưu ý**: Có endpoint trùng `/api/employers/profile` - cần phân biệt:
  - `/api/users/profile`: Unified endpoint (cho cả candidate và employer)
  - `/api/employers/profile`: Employer-specific endpoint (chi tiết hơn)

---

## 3. 📝 CÁC THÔNG TIN CÓ THỂ CẬP NHẬT

### A. PUT `/api/users/profile` - Universal Update

#### **User Model Fields** (chung cho tất cả roles):
```javascript
{
  "fullName": "string",
  "email": "string",      // Phải validate email format
  "phone": "string"       // Phải validate phone format
}
```

#### **Employer Profile Fields**:
```javascript
{
  // Cập nhật trực tiếp object
  "company": {
    "name": "string",
    "industry": "string",
    "size": "string",
    "description": "string",
    "website": "string",
    "email": "string",
    // ... other company fields
  },
  "position": {
    "title": "string",
    "level": "string",
    "department": "string"
  },
  "contact": {
    "name": "string",
    "phone": "string",
    "email": "string"
  },
  "businessInfo": {
    "registrationNumber": "string",
    "taxId": "string",        // ⚠️ Kiểm tra trùng lặp
    "issueDate": "Date",
    "issuePlace": "string",
    "address": { ... }
  },
  "legalRepresentative": {
    "fullName": "string",
    "position": "string",
    "phone": "string",
    "email": "string",
    "identification": { ... }
  }
}
```

**Hoặc sử dụng dot-notation:**
```javascript
{
  "company.name": "Tên công ty",
  "position.title": "HR Manager",
  "contact.phone": "0123456789"
}
```

#### **Candidate Profile Fields**:
```javascript
{
  "education": { ... },
  "skills": { ... },
  "preferences": { ... },
  "resume": { ... },
  "experience": { ... },
  "address": "string",
  "dob": "Date",
  "gender": "string",
  "avatar": "string",
  "summary": "string",
  "socialLinks": { ... }
}
```

### B. PUT `/api/users/preferences`

```javascript
{
  "notifications": {
    "emailNotifications": boolean,
    "jobAlerts": boolean,
    // ... other notification preferences
  },
  "privacy": {
    "profileVisibility": "public" | "private",
    "showEmail": boolean,
    "showPhone": boolean
  },
  "language": "vi" | "en",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

---

## 4. ⚠️ VẤN ĐỀ VÀ ĐỀ XUẤT

### Vấn đề 1: Endpoint trùng lặp
- `/api/users/profile` vs `/api/employers/profile`
- **Đề xuất**: 
  - Giữ `/api/users/profile` như unified endpoint (cơ bản)
  - `/api/employers/profile` cho employer-specific operations (chi tiết hơn)

### Vấn đề 2: Thiếu DELETE avatar endpoint
- **Đề xuất**: Thêm `DELETE /api/users/avatar`

### Vấn đề 3: Example trong Postman không khớp với implementation
- **Hiện tại trong Postman**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1995-05-15",
    "address": "..."
  }
  ```
- **Thực tế implementation**: Không hỗ trợ `firstName`, `lastName` (chỉ có `fullName`)
- **Đề xuất**: Cập nhật example trong Postman cho đúng

### Vấn đề 4: Debug endpoints trong production
- **Đề xuất**: 
  - Xóa hoặc protect debug endpoints
  - Chỉ enable trong development mode

### Vấn đề 5: Notification endpoint có vấn đề route
- `PUT /api/users/notifications/read` yêu cầu `notificationId` trong body
- Nhưng route conflict với `GET /api/users/:id`
- **Đề xuất**: Nên dùng `PUT /api/users/notifications/:id/read`

---

## 5. ✅ KẾT LUẬN

### Tổng số endpoints: **19 endpoints**

### Đánh giá:
- ✅ **Cần thiết**: 17/19 endpoints
- ⚠️ **Cần cải thiện**: 5 vấn đề nêu trên
- ❌ **Thiếu**: 1 endpoint (DELETE avatar)
- 🔧 **Nên xóa trong production**: 2 debug endpoints

### Trạng thái:
- ✅ **Chuẩn**: Cấu trúc RESTful, phân quyền rõ ràng
- ⚠️ **Chưa đủ**: Thiếu một số endpoint cơ bản
- ✅ **Đủ chức năng**: Đáp ứng đủ nhu cầu user management cơ bản

