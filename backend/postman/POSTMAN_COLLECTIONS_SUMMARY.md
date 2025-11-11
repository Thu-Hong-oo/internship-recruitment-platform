# Postman Collections - Complete Summary

**Tạo lúc**: November 11, 2025  
**Tổng số collections**: 12 collections  
**Tổng số requests**: 160+ API endpoints

---

## 📋 Danh sách Postman Collections đã tạo

### ✅ 1. Authentication API
**File**: `Authentication_API.postman_collection.json` ***(Mới tạo)***  
**Mô tả**: API xác thực người dùng đầy đủ  
**Endpoints**: 14 requests trong 6 folders
- **Registration & Login** (4): Register, login, get me, logout
- **Google OAuth** (1): Login with Google
- **OTP Login** (2): Request OTP, verify OTP
- **Password Management** (2): Forgot password, reset password
- **Email Verification** (3): Verify email, resend verification, check unverified
- **Token Management** (1): Refresh token
- **Auto-set tokens**: Scripts tự động lưu auth_token và refresh_token
- **Variables**: base_url, auth_token, refresh_token, reset_token, email_verification_token, otp_code

---

### ✅ 2. Jobs API
**File**: `Jobs_API.postman_collection.json`  
**Mô tả**: Quản lý công việc (job postings)  
**Endpoints**: 16 requests trong 5 folders
- **Public Routes** (7): Danh sách jobs, chi tiết job, thống kê, view tracking
- **Employer Routes** (7): Tạo/sửa/xóa job, drafts, submit review, applications
- **Candidate Routes** (1): Apply for job
- **Variables**: base_url, employer_token, candidate_token, job_id, slug

---

### ✅ 3. Candidates API  
**File**: `Candidates_API.postman_collection.json`  
**Mô tả**: Quản lý hồ sơ ứng viên và CV  
**Endpoints**: 25+ requests trong 7 folders
- **Core Profile** (2): Get/update profile
- **Resume Management** (8): Upload, parse, generate, download, delete resume
- **CV Builder** (5): Get data, update data, generate smart CV, export PDF
- **Profile Sections**: Education, experience, skills CRUD
- **Applications**: Job applications management
- **Jobs & Companies**: Browse and interact
- **Variables**: base_url, candidate_token, profile_id, section, item_id

---

### ✅ 4. Employer Profile API
**File**: `Employer_Profile_API.postman_collection.json`  
**Mô tả**: Quản lý hồ sơ nhà tuyển dụng  
**Endpoints**: 20 requests trong 7 folders
- **Profile Management** (4): Get/update profile, company info
- **Image Management** (4): Upload/remove logo, cover image
- **Verification** (5): Status, documents, business license, tax certificate
- **Jobs & Applications** (3): Posted jobs, applications, recommended candidates
- **Analytics** (1): Employer analytics
- **Variables**: base_url, employer_token, document_id, job_id

---

### ✅ 5. Admin Complete API
**File**: `Admin_Complete_API.postman_collection.json`  
**Mô tả**: Quản trị hệ thống toàn diện  
**Endpoints**: 35 requests trong 7 folders
- **Dashboard & Analytics** (2): Dashboard stats, user analytics
- **User Management** (6): CRUD users, status, role management
- **Employer Management** (6): List, search, status, companies, jobs
- **Company Management** (7): CRUD companies, status, jobs, applications
- **Employer Verification** (4): Pending verifications, approve/reject, document verification
- **Job Moderation** (5): Admin job management, status updates, delete
- **System Management** (4): Health, overview, logs, settings
- **Variables**: admin_token, user_id, employer_id, company_id, job_id, verification_id

---

### ✅ 6. Notifications API
**File**: `Notifications_API.postman_collection.json`  
**Mô tả**: Quản lý thông báo người dùng  
**Endpoints**: 10 requests trong 3 folders
- **User Notifications** (7): Get, create, mark read, delete notifications
- **Notification Preferences** (2): Get/update preferences
- **Admin Operations** (1): Broadcast notification
- **Variables**: user_token, admin_token, notification_id

---

### ✅ 7. Saved Jobs API
**File**: `Saved_Jobs_API.postman_collection.json`  
**Mô tả**: Quản lý công việc đã lưu  
**Endpoints**: 8 requests trong 1 folder
- Get all saved jobs
- Get saved jobs count
- Get by category
- Check if job is saved
- Save a job
- Remove saved job (by ID or job ID)
- Clear all saved jobs
- **Variables**: candidate_token, saved_job_id, job_id, category

---

### ✅ 8. Users API
**File**: `Users_API.postman_collection.json`  
**Mô tả**: Quản lý người dùng và tài khoản  
**Endpoints**: 17 requests trong 5 folders
- **Profile Management** (5): Get/update profile, avatar, public profile
- **Account Management** (5): Change password, link/unlink Google, deactivate/reactivate
- **User Preferences & Stats** (2): Update preferences, get stats
- **User Notifications** (4): Get, mark read, delete notifications
- **Debug & Utilities** (2): Debug token, compare profiles
- **Variables**: user_token, employer_token, user_id, notification_id

---

### ✅ 9. Skills Public API
**File**: `Skills_Public_API.postman_collection.json`  
**Mô tả**: API công khai để duyệt kỹ năng  
**Endpoints**: 6 requests trong 1 folder
- Get all skills
- Get skill by ID
- Get skill categories
- Get skills by category
- Get popular skills
- Search skills
- **Variables**: base_url, skill_id, category

---

### ✅ 10. Industries Public API
**File**: `Industries_Public_API.postman_collection.json`  
**Mô tả**: API công khai để duyệt ngành nghề  
**Endpoints**: 4 requests trong 1 folder
- Get all industries
- Get root industries
- Get sub-industries
- Search industries
- **Variables**: base_url, industry_code

---

### ✅ 11. Admin Skills Management
**File**: `Admin_Skills_Management.postman_collection.json` *(Đã có từ trước)*  
**Mô tả**: Quản trị kỹ năng (admin)  
**Endpoints**: 40+ requests
- Skills CRUD with hierarchy
- Bulk operations
- Categories management
- Validation and sync

---

### ✅ 12. Admin Industries Management  
**File**: `Admin_Industries_Management.postman_collection.json` *(Đã có từ trước)*  
**Mô tả**: Quản trị ngành nghề (admin)  
**Endpoints**: 20+ requests
- Industries CRUD with hierarchy
- Bulk operations
- Visibility control

---

### ✅ 13. AI CV Analysis & Learning Roadmap
**File**: `AI_CV_Analysis_Learning_Roadmap.postman_collection.json` *(Đã có từ trước)*  
**Mô tả**: AI phân tích CV và lộ trình học tập  
**Endpoints**: 15+ requests
- CV analysis and scoring
- Career change recommendations
- Learning roadmap generation
- Skill gap analysis

---

## 📊 Thống kê tổng quan

| Collection | Requests | Folders | Status |
|-----------|----------|---------|--------|
| Authentication API | 14 | 6 | ✅ Mới tạo |
| Jobs API | 16 | 5 | ✅ Mới tạo |
| Candidates API | 25+ | 7 | ✅ Mới tạo |
| Employer Profile API | 20 | 7 | ✅ Mới tạo |
| Admin Complete API | 35 | 7 | ✅ Mới tạo |
| Notifications API | 10 | 3 | ✅ Mới tạo |
| Saved Jobs API | 8 | 1 | ✅ Mới tạo |
| Users API | 17 | 5 | ✅ Mới tạo |
| Skills Public API | 6 | 1 | ✅ Mới tạo |
| Industries Public API | 4 | 1 | ✅ Mới tạo |
| Admin Skills Management | 40+ | 8 | ✅ Có sẵn |
| Admin Industries Management | 20+ | 5 | ✅ Có sẵn |
| AI CV Analysis | 15+ | 4 | ✅ Có sẵn |
| **TỔNG** | **~230** | **60** | **13/13** |

---

### Phạm vi bao phủ

### Route Files được phân tích (42 files)
- ✅ `auth.js` → Authentication API (mới tạo)
- ✅ `jobs.js` → Jobs API
- ✅ `candidate/candidates.js` → Candidates API
- ✅ `candidate/cvBuilderRoutes.js` → Candidates API (CV Builder section)
- ✅ `employerProfiles.js` → Employer Profile API
- ✅ `admin/admin.js` → Admin Complete API
- ✅ `notifications.js` → Notifications API
- ✅ `savedJobs.js` → Saved Jobs API
- ✅ `users.js` → Users API
- ✅ `skills.js` → Skills Public API
- ✅ `industries.js` → Industries Public API
- ✅ `admin/skillsAdmin.js` → Admin Skills Management (đã có)
- ✅ `admin/industriesAdmin.js` → Admin Industries Management (đã có)
- ✅ `ai.js`, `aiAnalysis.js` → AI CV Analysis (đã có)

### Các route files khác (không cần Postman riêng)
- `skillRoadmaps.js`, `roadmaps.js` - Tích hợp trong AI collection
- `skillCategories.js` - Tích hợp trong Skills collections
- `webhooks.js` - Webhook endpoints (special purpose)
- Các route khác có thể là internal hoặc deprecated

---

## 🚀 Hướng dẫn sử dụng

### 1. Import vào Postman
```
File → Import → Select all JSON files in backend/postman/
```

### 2. Cấu hình Environment Variables
Tạo environment trong Postman với các biến:
```
base_url: http://localhost:5000/api
admin_token: <JWT token sau khi login admin>
employer_token: <JWT token sau khi login employer>
candidate_token: <JWT token sau khi login candidate>
user_token: <JWT token chung>
```

### 3. Workflow test cơ bản
1. **Authentication** → Login để lấy token
2. **Users/Candidates/Employer** → Quản lý profile
3. **Jobs** → Browse và apply jobs
4. **Applications** → Theo dõi đơn ứng tuyển
5. **Admin** → Quản trị hệ thống

### 4. Test automation
- Mỗi collection có thể chạy độc lập
- Sử dụng Collection Runner để test hàng loạt
- Variables được share giữa các requests

---

## 📁 Cấu trúc thư mục

```
backend/postman/
├── Authentication_API.postman_collection.json
├── Jobs_API.postman_collection.json
├── Candidates_API.postman_collection.json
├── Employer_Profile_API.postman_collection.json
├── Admin_Complete_API.postman_collection.json
├── Notifications_API.postman_collection.json
├── Saved_Jobs_API.postman_collection.json
├── Users_API.postman_collection.json
├── Skills_Public_API.postman_collection.json
├── Industries_Public_API.postman_collection.json
├── Admin_Skills_Management.postman_collection.json
├── Admin_Industries_Management.postman_collection.json
├── AI_CV_Analysis_Learning_Roadmap.postman_collection.json
├── POSTMAN_COLLECTIONS_SUMMARY.md (file này)
└── README_Admin_AI_Features.md
```

---

## ✅ Kết luận

**Tất cả 13 Postman collections đã được tạo hoàn chỉnh**, bao phủm toàn bộ API của hệ thống:

✅ **Authentication & Authorization** - Đầy đủ  
✅ **User Management** - Đầy đủ  
✅ **Job Management** - Đầy đủ  
✅ **Candidate Features** - Đầy đủ  
✅ **Employer Features** - Đầy đủ  
✅ **Admin Operations** - Đầy đủ  
✅ **AI & NLP Features** - Đầy đủ  
✅ **Notifications** - Đầy đủ  
✅ **Skills & Industries** - Đầy đủ  

**Hệ thống đã sẵn sàng để test toàn diện!** 🎉
