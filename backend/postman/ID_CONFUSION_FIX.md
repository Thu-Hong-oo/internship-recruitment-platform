# 🔍 FIX: ID Confusion trong Admin API

## ❌ **Vấn đề**: "Không tìm thấy employer profile"

### 🎯 **Nguyên nhân**:

Có **2 loại ID** khác nhau được sử dụng cho employers:

1. **`User._id`** - ID của user account (role: 'employer')
2. **`EmployerProfile._id`** - ID của employer profile document

### 📊 **Trước khi fix**:

| Endpoint                       | ID Type Required      | Controller Function            |
| ------------------------------ | --------------------- | ------------------------------ |
| `GET /admin/employers/:id`     | `User._id`            | getEmployer                    |
| `GET /admin/verifications/:id` | `EmployerProfile._id` | getEmployerVerificationDetails |
| `PUT /admin/verifications/:id` | `EmployerProfile._id` | verifyEmployer                 |

➡️ **Kết quả**: Cùng 1 ID không work cho cả 2 endpoints!

### ✅ **Sau khi fix**:

| Endpoint                       | ID Type Required  | Controller Function            |
| ------------------------------ | ----------------- | ------------------------------ |
| `GET /admin/employers/:id`     | `User._id`        | getEmployer                    |
| `GET /admin/verifications/:id` | **`User._id`** ✅ | getEmployerVerificationDetails |
| `PUT /admin/verifications/:id` | **`User._id`** ✅ | verifyEmployer                 |

➡️ **Kết quả**: Tất cả endpoints giờ đều sử dụng `User._id`!

## 🔧 **Thay đổi trong Code**:

### **verificationController.js**:

```javascript
// TRƯỚC (tìm bằng EmployerProfile._id):
const employerProfile = await EmployerProfile.findById(id);

// SAU (tìm bằng User._id):
const employerProfile = await EmployerProfile.findOne({ mainUserId: id });
```

### **Postman Collection**:

```json
// TRƯỚC:
"{{api_url}}/admin/verifications/{{employer_profile_id}}"

// SAU:
"{{api_url}}/admin/verifications/{{user_id}}"
```

## 🚀 **Cách sử dụng đúng**:

### 1. **Lấy User ID của employer**:

```bash
GET /admin/employers
# Response:
{
  "data": [
    {
      "_id": "66c7cccfe8bb152544f47c36", // ← ĐÂY LÀ USER._ID
      "user": {...},
      "profileId": "66c7cccfe8bb152544f47c3a" // ← ĐÂY LÀ EMPLOYERPROFILE._ID
    }
  ]
}
```

### 2. **Sử dụng User.\_id cho tất cả endpoints**:

```bash
# Sử dụng: 66c7cccfe8bb152544f47c36 (User._id)
GET /admin/employers/66c7cccfe8bb152544f47c36
GET /admin/verifications/66c7cccfe8bb152544f47c36
PUT /admin/verifications/66c7cccfe8bb152544f47c36
```

## 📱 **Update Postman Variables**:

```json
{
  "user_id": "66c7cccfe8bb152544f47c36", // ← User._id của employer
  "employer_id": "66c7cccfe8bb152544f47c36", // ← DEPRECATED: Dùng user_id
  "employer_profile_id": "66c7cccfe8bb152544f47c3a" // ← DEPRECATED: Không dùng nữa
}
```

## ⚡ **Test ngay**:

1. **Set variable trong Postman**:

   - `user_id` = User.\_id của employer (lấy từ GET /admin/employers)

2. **Test các endpoints**:
   - ✅ `GET /admin/employers/{{user_id}}`
   - ✅ `GET /admin/verifications/{{user_id}}`
   - ✅ `PUT /admin/verifications/{{user_id}}`

## 🎉 **Kết quả**:

- **Consistent API**: Tất cả employer endpoints đều dùng User.\_id
- **No more confusion**: Một ID cho tất cả operations
- **Better UX**: Dễ sử dụng và hiểu hơn

---

**Fixed**: 2025-09-15 ✅
