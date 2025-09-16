# User Status Management Update

## 🎯 Mục đích

Cập nhật hệ thống quản lý trạng thái user để có thể quản lý chi tiết hơn các trạng thái tài khoản.

## 🆕 Thay đổi chính

### 1. **User Model - Trường mới:**

```javascript
// Trường status mới
status: {
  type: String,
  enum: ['active', 'inactive', 'suspended', 'banned', 'pending'],
  default: 'active'
}

// Thông tin bổ sung
statusReason: String,           // Lý do thay đổi status
statusChangedBy: ObjectId,      // Admin đã thay đổi
statusChangedAt: Date           // Thời gian thay đổi
```

### 2. **Định nghĩa trạng thái:**

| Status      | Mô tả                           | Có thể đăng nhập | Sử dụng                                   |
| ----------- | ------------------------------- | ---------------- | ----------------------------------------- |
| `active`    | Tài khoản hoạt động bình thường | ✅ Yes           | User có thể sử dụng đầy đủ tính năng      |
| `inactive`  | Tài khoản không hoạt động       | ❌ No            | User tự deactivate hoặc chưa verify email |
| `suspended` | Tạm khóa bởi admin              | ❌ No            | Vi phạm nhẹ, có thể mở lại                |
| `banned`    | Bị cấm vĩnh viễn                | ❌ No            | Vi phạm nghiêm trọng                      |
| `pending`   | Chờ duyệt                       | ❌ No            | Tài khoản mới, chờ admin xác nhận         |

### 3. **Methods mới:**

```javascript
user.isAccountActive(); // Kiểm tra có thể hoạt động
user.isAccountLocked(); // Kiểm tra có bị khóa
user.updateStatus(status, reason, adminId); // Cập nhật status
user.statusDisplay; // Hiển thị status bằng tiếng Việt
```

## 📋 API Endpoints được cập nhật

### **GET /admin/users**

**Filters mới:**

```http
GET /admin/users?status=suspended&page=1&limit=20
```

**Response mới:**

```json
{
  "data": [
    {
      "id": "...",
      "email": "user@example.com",
      "status": "suspended",
      "statusDisplay": "Tạm khóa",
      "statusReason": "Vi phạm chính sách",
      "statusChangedAt": "2025-09-15T08:00:00.000Z",
      "statusChangedBy": {
        "id": "admin_id",
        "fullName": "Admin Name",
        "email": "admin@example.com"
      },
      "isActive": false
    }
  ]
}
```

### **PUT /admin/users/:id/status**

**Request body mới:**

```json
{
  "status": "suspended",
  "reason": "Vi phạm chính sách sử dụng dịch vụ"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công",
  "data": {
    "id": "user_id",
    "status": "suspended",
    "statusDisplay": "Tạm khóa",
    "statusReason": "Vi phạm chính sách sử dụng dịch vụ",
    "statusChangedAt": "2025-09-15T08:00:00.000Z",
    "isActive": false
  }
}
```

## 🔄 Migration

Chạy script migration để cập nhật dữ liệu hiện tại:

```bash
# Chạy migration
node scripts/migrateUserStatus.js
```

**Script sẽ:**

- Cập nhật tất cả users hiện tại
- Set `status = 'active'` cho users có `isActive = true`
- Set `status = 'inactive'` cho users có `isActive = false`
- Giữ nguyên field `isActive` để tương thích ngược

## 📱 Sử dụng trong Admin Panel

### **1. Xem danh sách users theo status:**

```http
GET /admin/users?status=suspended    # Xem users bị suspend
GET /admin/users?status=pending      # Xem users chờ duyệt
GET /admin/users?status=active       # Xem users hoạt động
```

### **2. Suspend user:**

```http
PUT /admin/users/USER_ID/status
{
  "status": "suspended",
  "reason": "Vi phạm quy định đăng tin"
}
```

### **3. Unban user:**

```http
PUT /admin/users/USER_ID/status
{
  "status": "active",
  "reason": "Đã xử lý vi phạm, cho phép hoạt động lại"
}
```

### **4. Ban user vĩnh viễn:**

```http
PUT /admin/users/USER_ID/status
{
  "status": "banned",
  "reason": "Vi phạm nghiêm trọng: spam, lừa đảo"
}
```

## 🛡️ Tương thích ngược

- Field `isActive` vẫn được giữ và đồng bộ với `status`
- API cũ vẫn hoạt động bình thường
- Filter `?status=active/inactive` vẫn work như cũ

## 🔍 Filter Options

```http
# Tất cả filters có thể dùng
GET /admin/users?role=employer&status=active&emailVerified=true&search=john&page=1&limit=20
```

**Available filters:**

- `role`: admin, employer, candidate, recruiter, hr_manager, moderator
- `status`: active, inactive, suspended, banned, pending
- `emailVerified`: true, false
- `search`: tìm theo email hoặc fullName
- `page`, `limit`: pagination

## 🎯 Use Cases thực tế

### **Moderator workflow:**

1. User báo cáo vi phạm
2. Admin xem chi tiết user: `GET /admin/users/USER_ID`
3. Suspend tạm thời: `PUT /admin/users/USER_ID/status` với `status: "suspended"`
4. Xem lại sau và quyết định: active lại hoặc ban vĩnh viễn

### **New user approval:**

1. User đăng ký tài khoản → `status: "pending"`
2. Admin review: `GET /admin/users?status=pending`
3. Approve: `PUT /admin/users/USER_ID/status` với `status: "active"`

### **Compliance tracking:**

- Xem tất cả users bị suspend: `GET /admin/users?status=suspended`
- Export danh sách users có vấn đề để report
- Track ai đã suspend user nào và tại sao

## ✅ Testing

Sử dụng Postman collection đã được cập nhật:

- **Admin API Organized.postman_collection.json**
- Folder: **👥 User Management**
- Endpoints: "Get All Users", "Update User Status"
