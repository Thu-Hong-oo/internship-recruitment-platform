# API STRUCTURE - Internship Recruitment Platform

## 📋 Tổng quan

Hệ thống API quản lý tuyển dụng thực tập sinh với đầy đủ quy trình từ đăng ký đến tuyển dụng.

## 🔒 Middleware & Security Layers

### 📌 Authentication Middleware

- `protect`: Xác thực JWT token
- `authorize(role)`: Kiểm tra quyền theo role (candidate/employer/admin)

### 📌 Employer Verification Middleware

- `requireEmployerProfile`: Đảm bảo employer có profile (auto-created khi verify email)
- `requireVerifiedEmployer`: Yêu cầu employer đã xác thực documents (business license + tax certificate)

### 📌 Workflow Logic

1. **Registration** → Email verification → **Auto-create EmployerProfile** (for employers)
2. **Profile Setup** → Upload documents → **Admin verification** → **Verified status**
3. **Job Management**: Draft jobs → Submit for review → **Admin approval** → Active jobs

---

## 🔐 AUTHENTICATION ENDPOINTS

### 📌 Đăng ký & Xác thực

```
POST   /api/auth/register              # Đăng ký tài khoản (candidate/employer)
POST   /api/auth/verify-email          # Xác thực email với OTP + AUTO-CREATE EmployerProfile
POST   /api/auth/resend-verification   # Gửi lại OTP xác thực
POST   /api/auth/login                 # Đăng nhập
POST   /api/auth/logout                # Đăng xuất
POST   /api/auth/refresh-token         # Làm mới token
```

### 📌 Quên mật khẩu

```
POST   /api/auth/forgot-password       # Gửi OTP reset password
POST   /api/auth/reset-password        # Reset password với OTP
POST   /api/auth/change-password       # Đổi password khi đã login
```

### 📌 Google OAuth

```
GET    /api/auth/google                # Google OAuth redirect
GET    /api/auth/google/callback       # Google OAuth callback
```

---

## 👤 USER MANAGEMENT ENDPOINTS

### 📌 Profile cơ bản

```
GET    /api/users/profile              # Lấy thông tin profile hiện tại
PUT    /api/users/profile              # Cập nhật profile cơ bản
POST   /api/users/avatar               # Upload avatar
DELETE /api/users/avatar               # Xóa avatar
```

### 📌 Tìm kiếm & Public

```
GET    /api/users/search               # Tìm kiếm users (public)
GET    /api/users/:id/public           # Xem public profile
```

---

## 👨‍🎓 CANDIDATE ENDPOINTS

### 📌 Profile quản lý

```
GET    /api/candidate-profiles/:userId # Lấy candidate profile
PUT    /api/candidate-profiles/update  # Cập nhật profile
```

### 📌 Resume & Documents

```
POST   /api/candidate-profiles/resume  # Upload resume
GET    /api/candidate-profiles/resume  # Download resume
PUT    /api/candidate-profiles/education # Cập nhật học vấn
PUT    /api/candidate-profiles/skills  # Cập nhật kỹ năng
PUT    /api/candidate-profiles/experience # Cập nhật kinh nghiệm
```

---

## 🏢 EMPLOYER ENDPOINTS

### 📌 Profile & Company Info [requireEmployerProfile]

```
GET    /api/employers/profile          # Lấy employer profile
PUT    /api/employers/company          # Cập nhật thông tin công ty
PUT    /api/employers/contact          # Cập nhật thông tin liên hệ
GET    /api/employers/verification-status # Trạng thái xác thực
```

### 📌 Document Upload & Verification [requireEmployerProfile]

```
POST   /api/employers/documents/business-license  # Upload giấy phép KD
POST   /api/employers/documents/tax-certificate   # Upload giấy chứng nhận thuế
GET    /api/employers/documents        # Lấy danh sách documents
DELETE /api/employers/documents/:id    # Xóa document
```

### 📌 Applications Management [requireVerifiedEmployer]

```
GET    /api/employers/applications     # Lấy danh sách ứng viên apply
PUT    /api/employers/applications/:id/status # Cập nhật trạng thái ứng viên
GET    /api/employers/recommended-candidates  # Gợi ý ứng viên phù hợp
GET    /api/employers/analytics        # Thống kê tuyển dụng
```

### 📌 Company Public Info

```
GET    /api/employers/company/public   # Thông tin công ty (public, safe fields)
GET    /api/employers/:id/jobs         # Jobs của employer cụ thể (public)
```

---

## 💼 JOB MANAGEMENT ENDPOINTS

### 📌 Public Job Browsing

```
GET    /api/jobs                       # Lấy tất cả jobs (với nhiều filter)
GET    /api/jobs/recent                # Jobs gần đây
GET    /api/jobs/slug/:slug            # Job theo slug
GET    /api/jobs/:id                   # Job detail theo ID
GET    /api/jobs/:id/company           # Thông tin công ty của job
GET    /api/jobs/:id/stats             # Thống kê job (views, applications)
POST   /api/jobs/:id/view              # Tăng view count
```

### 📌 Employer Job Management [requireEmployerProfile]

```
GET    /api/jobs/employer              # Lấy jobs của employer hiện tại
GET    /api/jobs/drafts                # Lấy draft jobs
POST   /api/jobs                       # Tạo job mới
PUT    /api/jobs/:id                   # Cập nhật job
DELETE /api/jobs/:id                   # Xóa job
```

### 📌 Job Publishing & Applications [requireVerifiedEmployer]

```
POST   /api/jobs/employer/:id/submit   # Submit job for admin review
GET    /api/jobs/:id/applications      # Lấy danh sách ứng viên của job
```

### 📌 Candidate Job Actions

```
POST   /api/jobs/:id/apply             # Apply for job [candidate only]
```

#### Filter parameters cho GET /api/jobs:

```
?page=1&limit=10                       # Phân trang
?q=developer                           # Text search
?location=Ho Chi Minh                  # Địa điểm
?skills=react,nodejs                   # Kỹ năng (comma separated)
?employer=employerId                   # Filter theo employer
?status=active                         # Trạng thái job
?jobType=internship                    # Loại job
?industry=technology                   # Ngành nghề
?category=frontend                     # Danh mục
?salaryMin=8000000&salaryMax=15000000  # Khoảng lương
?createdFrom=2024-01-01&createdTo=2024-12-31  # Thời gian tạo
?deadlineFrom=2024-01-01&deadlineTo=2024-12-31 # Thời gian deadline
?tags=react,frontend                   # Tags
?sortBy=createdAt&sortOrder=desc       # Sắp xếp
```

### 📌 Employer Job Management

```
GET    /api/jobs/employer              # Tất cả jobs của employer hiện tại
GET    /api/jobs/drafts                # Chỉ job drafts
POST   /api/jobs                       # Tạo job mới (luôn DRAFT)
PUT    /api/jobs/:id                   # Cập nhật job
DELETE /api/jobs/:id                   # Xóa job
GET    /api/jobs/:id/applications      # Ứng viên apply job
POST   /api/jobs/employer/:id/submit   # Gửi job cho admin duyệt (DRAFT→PENDING)
```

### 📌 Candidate Job Actions

```
POST   /api/jobs/:id/apply             # Apply job
```

---

## 📝 APPLICATION ENDPOINTS

### 📌 Candidate Applications

```
GET    /api/applications               # Danh sách đơn ứng tuyển của candidate
GET    /api/applications/:id           # Chi tiết đơn ứng tuyển
PUT    /api/applications/:id           # Cập nhật đơn ứng tuyển
DELETE /api/applications/:id           # Hủy đơn ứng tuyển
```

---

## 💾 SAVED JOBS ENDPOINTS

### 📌 Job Bookmarking

```
GET    /api/saved-jobs                 # Danh sách job đã lưu
POST   /api/saved-jobs                 # Lưu job
DELETE /api/saved-jobs/:id             # Bỏ lưu job
GET    /api/saved-jobs/check/:jobId    # Kiểm tra job đã lưu chưa
```

---

## 🛠️ SKILLS & CATEGORIES ENDPOINTS

### 📌 Skills Management

```
GET    /api/skills                     # Danh sách skills (có filter & search)
GET    /api/skills/:id                 # Chi tiết skill
POST   /api/skills                     # Tạo skill mới (Admin only)
PUT    /api/skills/:id                 # Cập nhật skill (Admin only)
DELETE /api/skills/:id                 # Xóa skill (Admin only)
```

### 📌 Skill Categories

```
GET    /api/skill-categories           # Danh sách categories
GET    /api/skill-categories/:id       # Chi tiết category
POST   /api/skill-categories           # Tạo category (Admin only)
PUT    /api/skill-categories/:id       # Cập nhật category (Admin only)
DELETE /api/skill-categories/:id       # Xóa category (Admin only)
```

---

## 🔔 NOTIFICATION ENDPOINTS

### 📌 User Notifications

```
GET    /api/notifications              # Danh sách thông báo
GET    /api/notifications/:id          # Chi tiết thông báo
POST   /api/notifications              # Tạo thông báo (Admin/System)
PUT    /api/notifications/:id/read     # Đánh dấu đã đọc
PUT    /api/notifications/mark-all-read # Đánh dấu tất cả đã đọc
DELETE /api/notifications/:id          # Xóa thông báo
```

---

## 🤖 AI SERVICES ENDPOINTS

### 📌 AI Analysis & Recommendations

```
POST   /api/ai/analyze-resume          # Phân tích resume
POST   /api/ai/job-recommendations     # Gợi ý job cho candidate
POST   /api/ai/candidate-matching      # Match candidate với job
POST   /api/ai/skill-gap-analysis      # Phân tích gap skills
```

---

## 🗺️ ROADMAP ENDPOINTS

### 📌 Learning Roadmaps

```
GET    /api/roadmaps                   # Danh sách roadmaps
GET    /api/roadmaps/:id               # Chi tiết roadmap
POST   /api/roadmaps                   # Tạo roadmap
PUT    /api/roadmaps/:id               # Cập nhật roadmap
DELETE /api/roadmaps/:id               # Xóa roadmap
POST   /api/roadmaps/:id/progress      # Cập nhật tiến độ
```

---

## 👨‍💼 ADMIN ENDPOINTS

### 📌 Dashboard & Analytics

```
GET    /api/admin/dashboard            # Dashboard tổng quan
GET    /api/admin/analytics            # Thống kê hệ thống
GET    /api/admin/reports              # Báo cáo
```

### 📌 User Management

```
GET    /api/admin/users                # Quản lý users
GET    /api/admin/users/:id            # Chi tiết user
PUT    /api/admin/users/:id/status     # Cập nhật trạng thái user
DELETE /api/admin/users/:id            # Xóa user
POST   /api/admin/users/:id/reset-password # Reset password user
```

### 📌 Employer Management

```
GET    /api/admin/employers            # Quản lý employers
GET    /api/admin/employers/:id        # Chi tiết employer
PUT    /api/admin/employers/:id/verify # Xác thực employer
PUT    /api/admin/employers/:id/status # Cập nhật trạng thái employer
```

### 📌 Job Moderation

```
GET    /api/admin/jobs                 # Quản lý jobs (có filter pending)
GET    /api/admin/jobs/:id             # Chi tiết job
PUT    /api/admin/jobs/:id/status      # Duyệt/Từ chối job
POST   /api/admin/jobs/:id/flag        # Flag job
```

### 📌 Application Analytics

```
GET    /api/admin/applications         # Quản lý applications
GET    /api/admin/applications/stats   # Thống kê applications
```

### 📌 System Management

```
GET    /api/admin/system/health        # System health check
POST   /api/admin/system/cache/clear   # Clear cache
GET    /api/admin/system/logs          # System logs
POST   /api/admin/system/backup        # Backup database
```

### 📌 Verification Management

```
GET    /api/admin/verifications        # Danh sách chờ xác thực
PUT    /api/admin/verifications/:id/approve # Duyệt xác thực
PUT    /api/admin/verifications/:id/reject  # Từ chối xác thực
```

---

## 🔧 UPLOAD SERVICES ENDPOINTS

### 📌 File Upload

```
POST   /api/upload/image               # Upload image (avatar, logo)
POST   /api/upload/document            # Upload document (resume, certificates)
POST   /api/upload/bulk                # Upload multiple files
DELETE /api/upload/:id                 # Xóa file
```

---

## 📊 WORKFLOW SUMMARY

### 🔄 Employer Journey:

1. **Đăng ký**: `POST /auth/register` → `POST /auth/verify-email` (auto tạo EmployerProfile)
2. **Hoàn thiện profile**: `PUT /employers/company` → Upload documents
3. **Xác thực**: Admin verify → status = VERIFIED
4. **Tạo job**: `POST /jobs` (DRAFT) → `POST /jobs/employer/:id/submit` (PENDING)
5. **Admin duyệt**: `PUT /admin/jobs/:id/status` (ACTIVE)

### 🔄 Candidate Journey:

1. **Đăng ký**: `POST /auth/register` → `POST /auth/verify-email` (auto tạo CandidateProfile)
2. **Hoàn thiện profile**: Upload resume, cập nhật skills/education
3. **Tìm job**: `GET /jobs` với filters
4. **Apply**: `POST /jobs/:id/apply`
5. **Theo dõi**: `GET /applications`

### 🔄 Admin Journey:

1. **Monitor**: `GET /admin/dashboard`
2. **Verify employers**: `GET /admin/employers` → `PUT /admin/employers/:id/verify`
3. **Moderate jobs**: `GET /admin/jobs` → `PUT /admin/jobs/:id/status`
4. **Analytics**: `GET /admin/analytics`

---

## 🚀 Status Codes & Response Format

### ✅ Success Response:

```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... },
  "pagination": { ... }  // nếu có
}
```

### ❌ Error Response:

```json
{
  "success": false,
  "message": "Lỗi mô tả",
  "error": "Chi tiết lỗi",
  "code": "ERROR_CODE" // nếu có
}
```

### 📋 Common Status Codes:

- `200` - OK
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🛡️ Authentication & Authorization

### 🔑 Token Types:

- **Access Token**: 15 phút (cho API calls)
- **Refresh Token**: 7 ngày (làm mới access token)

### 👥 Role Permissions:

- **Public**: Browse jobs, view company info
- **Candidate**: Apply jobs, manage applications, save jobs
- **Employer**: Post jobs, manage applications, view candidates
- **Admin**: Full system access, moderation, analytics

### 🔒 Protected Routes:

- Header: `Authorization: Bearer <access_token>`
- Middleware: `protect` (verify token) + `authorize(roles)` (check role)
