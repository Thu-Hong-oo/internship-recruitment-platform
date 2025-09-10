# API Routes - Optimized Structure

## 🎯 **Tổng quan API Routes**

### **Base URL**: `http://localhost:3000/api`

---

## 📋 **1. Employer Profile Routes**
**File**: `routes/employerProfiles.js`  
**Base**: `/api/employer-profile`  
**Mục đích**: Quản lý hồ sơ cá nhân của employer

| Method | Endpoint | Mô tả | Access |
|--------|----------|-------|--------|
| GET | `/` | Lấy hồ sơ employer | Employer |
| POST | `/` | Tạo hồ sơ employer | Employer |
| PUT | `/` | Cập nhật hồ sơ employer | Employer |
| DELETE | `/` | Xóa hồ sơ employer | Employer |
| GET | `/dashboard` | Dashboard employer | Employer |
| GET | `/completion` | Trạng thái hoàn thành hồ sơ | Employer |
| GET | `/company` | **DEPRECATED** - Sử dụng `/api/companies/my-company` | Employer |

---

## 🏢 **2. Company Routes**
**File**: `routes/companies.js`  
**Base**: `/api/companies`  
**Mục đích**: Quản lý thông tin công ty

### **Public Routes**
| Method | Endpoint | Mô tả | Access |
|--------|----------|-------|--------|
| GET | `/` | Lấy danh sách công ty | Public |
| GET | `/:id` | Lấy thông tin công ty | Public |
| GET | `/:id/jobs` | Lấy danh sách job của công ty | Public |
| GET | `/:id/stats` | Thống kê công ty | Public |

### **Employer Routes**
| Method | Endpoint | Mô tả | Access |
|--------|----------|-------|--------|
| GET | `/me` | Lấy công ty của tôi | Employer |
| POST | `/` | Tạo công ty | Employer |
| PUT | `/me` | Cập nhật công ty của tôi | Employer |
| PUT | `/me/logo` | Cập nhật logo công ty | Employer |

### **Admin/Owner Routes**
| Method | Endpoint | Mô tả | Access |
|--------|----------|-------|--------|
| PUT | `/:id` | Cập nhật công ty (admin/owner) | Admin/Owner |
| DELETE | `/:id` | Xóa công ty | Admin |

---

## 👑 **3. Admin Routes**
**File**: `routes/admin.js`  
**Base**: `/api/admin`  
**Mục đích**: Quản lý hệ thống (admin only)

| Method | Endpoint | Mô tả | Access |
|--------|----------|-------|--------|
| GET | `/users` | Lấy danh sách users | Admin |
| GET | `/users/:id` | Lấy thông tin user | Admin |
| POST | `/users` | Tạo user | Admin |
| PUT | `/users/:id` | Cập nhật user | Admin |
| DELETE | `/users/:id` | Xóa user | Admin |
| PUT | `/users/:id/status` | Cập nhật trạng thái user | Admin |
| GET | `/dashboard` | Dashboard admin | Admin |
| GET | `/analytics/users` | Thống kê users | Admin |
| GET | `/verifications` | Lấy danh sách chờ duyệt | Admin |
| PUT | `/verifications/:id` | Duyệt/từ chối employer | Admin |
| PUT | `/companies/:id/status` | Cập nhật trạng thái công ty | Admin |
| GET | `/system/health` | Kiểm tra sức khỏe hệ thống | Admin |
| GET | `/system/logs` | Lấy logs hệ thống | Admin |

---

## 🔄 **Workflow mới (Tối ưu)**

### **1. Employer đăng ký:**
```javascript
// Tạo Company (tự động active)
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
// Tạo hồ sơ cá nhân
POST /api/employer-profile
{
  "personalInfo": {
    "bio": "Nhà tuyển dụng tại VNPT",
    "position": "HR Manager"
  }
}
```

### **3. Quản lý thông tin công ty:**
```javascript
// Lấy thông tin công ty
GET /api/companies/me

// Cập nhật thông tin công ty
PUT /api/companies/me
{
  "name": "VNPT Updated",
  "description": "New description"
}

// Cập nhật logo
PUT /api/companies/me/logo
{
  "logo": {
    "url": "https://...",
    "filename": "logo.jpg"
  }
}
```

### **4. Đăng job:**
```javascript
// Đăng job (tự động pending)
POST /api/jobs
{
  "title": "Frontend Developer",
  "description": "...",
  "companyId": "company_id"
}
// Response: status: "pending" - chờ admin duyệt
```

### **5. Admin duyệt job:**
```javascript
// Admin duyệt job
PUT /api/admin/jobs/:id/status
{
  "status": "active"
}
// Job hiển thị cho ứng viên
```

---

## ✅ **Lợi ích của cấu trúc mới**

1. **Tách biệt rõ ràng**: 
   - EmployerProfile = Hồ sơ cá nhân
   - Company = Thông tin công ty
   - Job = Tin tuyển dụng

2. **Workflow đơn giản**: 
   - Employer đăng job ngay
   - Admin chỉ duyệt nội dung job

3. **API nhất quán**:
   - `/my-company` thay vì `/company`
   - Routes được nhóm theo chức năng

4. **Loại bỏ trùng lặp**:
   - Không còn duplicate endpoints
   - Mỗi controller có trách nhiệm riêng

---

## 🚫 **Deprecated Endpoints**

| Endpoint | Thay thế | Lý do |
|----------|----------|-------|
| `GET /api/employer-profile/company` | `GET /api/companies/me` | Tách biệt trách nhiệm |
| `PUT /api/employer-profile/company` | `PUT /api/companies/me` | Tách biệt trách nhiệm |
| `POST /api/employer-profile/company/logo` | `PUT /api/companies/me/logo` | Tách biệt trách nhiệm |

---

## 📝 **Migration Guide cho Frontend**

### **Thay đổi endpoints:**
```javascript
// Cũ
GET /api/employer-profile/company
PUT /api/employer-profile/company
POST /api/employer-profile/company/logo

// Mới
GET /api/companies/me
PUT /api/companies/me
PUT /api/companies/me/logo
```

### **Workflow mới:**
1. Employer đăng ký → Company tự động active
2. Tạo EmployerProfile (hồ sơ cá nhân)
3. Đăng job ngay (status: pending)
4. Admin duyệt job (status: active)
