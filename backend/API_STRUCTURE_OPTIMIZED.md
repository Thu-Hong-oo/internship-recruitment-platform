# API Structure - Optimized Workflow

## 🎯 **Workflow mới (Tối ưu)**

```
1. Employer đăng ký → Tạo Company (status: "active")
2. Employer tạo EmployerProfile (thông tin cá nhân)
3. Employer đăng job → Job status: "pending" 
4. Admin duyệt job → Job status: "active"
5. Job hiển thị cho ứng viên
```

## 📋 **Phân chia trách nhiệm rõ ràng**

### **EmployerProfile Controller** 
**Mục đích**: Quản lý **hồ sơ cá nhân** của employer
**Base URL**: `/api/employer-profile`

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/` | GET | Lấy hồ sơ employer |
| `/` | POST | Tạo hồ sơ employer |
| `/` | PUT | Cập nhật hồ sơ employer |
| `/` | DELETE | Xóa hồ sơ employer |
| `/dashboard` | GET | Dashboard employer |
| `/completion` | GET | Trạng thái hoàn thành hồ sơ |
| `/company` | GET | **Deprecated** - Sử dụng `/api/companies/my-company` |

### **Company Controller**
**Mục đích**: Quản lý **thông tin công ty**
**Base URL**: `/api/companies`

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/` | GET | Lấy danh sách công ty (public) |
| `/:id` | GET | Lấy thông tin công ty (public) |
| `/` | POST | Tạo công ty (employer) |
| `/:id` | PUT | Cập nhật công ty (owner/admin) |
| `/:id` | DELETE | Xóa công ty (admin) |
| `/my-company` | GET | Lấy công ty của tôi (employer) |
| `/my-company` | PUT | Cập nhật công ty của tôi (employer) |
| `/my-company/logo` | PUT | Cập nhật logo công ty (employer) |
| `/:id/jobs` | GET | Lấy danh sách job của công ty |
| `/:id/stats` | GET | Thống kê công ty |

### **Admin Controller**
**Mục đích**: Quản lý hệ thống (admin only)
**Base URL**: `/api/admin`

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/companies/:id/status` | PUT | Cập nhật trạng thái công ty |
| `/verifications/:id` | PUT | Duyệt/từ chối employer profile |

## 🔄 **Workflow thực tế**

### **1. Employer đăng ký:**
```javascript
// 1. Tạo Company (tự động active)
POST /api/companies
{
  "name": "VNPT",
  "industry": "tech",
  "description": "..."
}
// Response: status: "active" - có thể đăng job ngay
```

### **2. Tạo EmployerProfile:**
```javascript
// 2. Tạo hồ sơ cá nhân
POST /api/employer-profile
{
  "personalInfo": {
    "bio": "Nhà tuyển dụng tại VNPT",
    "position": "HR Manager"
  }
}
```

### **3. Đăng job:**
```javascript
// 3. Đăng job (tự động pending)
POST /api/jobs
{
  "title": "Frontend Developer",
  "description": "...",
  "companyId": "company_id"
}
// Response: status: "pending" - chờ admin duyệt
```

### **4. Admin duyệt job:**
```javascript
// 4. Admin duyệt job
PUT /api/admin/jobs/:id/status
{
  "status": "active"
}
// Job hiển thị cho ứng viên
```

## ✅ **Lợi ích của workflow mới**

1. **Đơn giản hóa**: Employer không cần chờ duyệt company
2. **Tập trung**: Admin chỉ duyệt nội dung job thay vì thông tin công ty
3. **UX tốt**: Có thể đăng job ngay sau khi đăng ký
4. **Tách biệt rõ ràng**: 
   - EmployerProfile = Thông tin cá nhân
   - Company = Thông tin công ty
   - Job = Tin tuyển dụng

## 🚫 **Loại bỏ trùng lặp**

- ❌ `PUT /api/employer-profile/company` → Sử dụng `PUT /api/companies/my-company`
- ❌ `POST /api/employer-profile/company/logo` → Sử dụng `PUT /api/companies/my-company/logo`
- ❌ Company status "pending" → Mặc định "active"

## 📝 **Migration Guide**

### **Frontend cần cập nhật:**
```javascript
// Thay vì:
GET /api/employer-profile/company
PUT /api/employer-profile/company

// Sử dụng:
GET /api/companies/my-company
PUT /api/companies/my-company
```

### **Backend đã tối ưu:**
- Company mặc định `status: "active"`
- Loại bỏ việc duyệt company
- Tập trung duyệt job posting
- Tách biệt rõ ràng trách nhiệm
