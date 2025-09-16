# Postman API Collections

Thư mục này chứa các Postman collection được tách riêng theo từng module để dễ quản lý và test API.

## 📁 Cấu trúc Files

### 1. **01-Authentication.json**

- **Mô tả**: API xác thực người dùng
- **Endpoints**:
  - `POST /auth/register` - Đăng ký tài khoản
  - `POST /auth/login` - Đăng nhập
  - `POST /auth/logout` - Đăng xuất
  - `GET /auth/me` - Lấy thông tin user hiện tại
  - `POST /auth/forgotpassword` - Quên mật khẩu
  - `PUT /auth/resetpassword` - Đặt lại mật khẩu
  - `POST /auth/google` - Đăng nhập Google
  - `POST /auth/verify-email` - Xác thực email
  - `POST /auth/resend-verification` - Gửi lại email xác thực

### 2. **02-Users.json**

- **Mô tả**: Quản lý người dùng và profile
- **Endpoints**:
  - `GET /users/profile` - Lấy profile
  - `PUT /users/profile` - Cập nhật profile
  - `POST /users/upload-avatar` - Upload avatar
  - `PUT /users/password` - Đổi mật khẩu
  - `POST /users/link-google` - Liên kết Google
  - `DELETE /users/unlink-google` - Hủy liên kết Google
  - `GET /users/search` - Tìm kiếm users
  - `GET /users/stats` - Thống kê user
  - `PUT /users/preferences` - Cập nhật preferences
  - `PUT /users/deactivate` - Vô hiệu hóa tài khoản
  - `PUT /users/reactivate` - Kích hoạt lại tài khoản

### 3. **03-Profiles.json**

- **Mô tả**: Quản lý profile ứng viên và nhà tuyển dụng
- **Endpoints**:
  - `GET /profiles/candidate` - Lấy profile ứng viên
  - `PUT /profiles/candidate` - Cập nhật profile ứng viên
  - `GET /profiles/employer` - Lấy profile nhà tuyển dụng
  - `PUT /profiles/employer` - Cập nhật profile nhà tuyển dụng

### 4. **04-Companies.json**

- **Mô tả**: Quản lý công ty
- **Endpoints**:
  - `GET /companies` - Danh sách công ty
  - `GET /companies/search` - Tìm kiếm công ty
  - `GET /companies/{id}` - Chi tiết công ty
  - `POST /companies` - Tạo công ty

### 5. **05-Skills.json**

- **Mô tả**: Quản lý kỹ năng
- **Endpoints**:
  - `GET /skills` - Danh sách kỹ năng
  - `GET /skills/search` - Tìm kiếm kỹ năng
  - `POST /skills` - Tạo kỹ năng

### 6. **06-Applications.json**

- **Mô tả**: Quản lý ứng tuyển
- **Endpoints**:
  - `GET /applications` - Danh sách ứng tuyển của user
  - `GET /applications/{id}` - Chi tiết ứng tuyển
  - `PUT /applications/{id}` - Cập nhật ứng tuyển
  - `DELETE /applications/{id}` - Xóa ứng tuyển

### 7. **07-Skill-Roadmaps.json**

- **Mô tả**: Quản lý roadmap kỹ năng
- **Endpoints**:
  - `GET /roadmaps` - Danh sách roadmap của user
  - `GET /roadmaps/{id}` - Chi tiết roadmap
  - `POST /roadmaps` - Tạo roadmap
  - `POST /roadmaps/generate-from-job` - Tạo roadmap từ job
  - `POST /roadmaps/{id}/complete-week` - Hoàn thành tuần
  - `PUT /roadmaps/{id}/progress` - Cập nhật tiến độ

### 8. **Jobs Enhanced API.postman_collection.json**

- **Mô tả**: Quản lý việc làm với tính năng nâng cao, AI integration và InternBridge-style features
- **Phân loại**: Public APIs (không cần token) và Protected APIs (cần token + role)

#### 🔍 **Tìm kiếm & Lọc Jobs (Public)**

- `GET /jobs` - **Lấy danh sách jobs với filtering và pagination**

  - **Mục đích**: API chính để browse jobs, hỗ trợ text search + filter
  - **Tính năng**: Pagination, sorting, filtering theo category/location/salary/skills
  - **Sử dụng**: Trang chủ, danh sách jobs, filter sidebar
  - **Parameters**: `q` (optional), `category`, `location`, `salaryMin/Max`, `skills`, `page`, `limit`

- `GET /jobs/search` - **AI Semantic Search cho jobs**
  - **Mục đích**: Tìm kiếm thông minh bằng AI, hiểu ngữ cảnh và ý định
  - **Tính năng**: AI semantic search + fallback text search, pagination
  - **Sử dụng**: Search box chính, tìm kiếm nâng cao
  - **Parameters**: `q` (required), `skills`, `location`, `category`, `page`, `limit`

#### 🏆 **Jobs Đặc Biệt (Public)**

- `GET /jobs/featured` - **Jobs nổi bật được highlight**

  - **Mục đích**: Hiển thị jobs premium, được trả phí để nổi bật
  - **Sử dụng**: Banner trên trang chủ, section "Jobs nổi bật"
  - **Logic**: `isFeatured: true`, sort theo `priority`

- `GET /jobs/urgent` - **Jobs khẩn cấp cần tuyển gấp**

  - **Mục đích**: Jobs có deadline gần, cần tuyển ngay
  - **Sử dụng**: Section "Tuyển gấp", notification banner
  - **Logic**: `isUrgent: true`, sort theo `createdAt`

- `GET /jobs/hot` - **Jobs được xem nhiều nhất**

  - **Mục đích**: Jobs phổ biến, thu hút nhiều ứng viên
  - **Sử dụng**: Section "Jobs hot", trending jobs
  - **Logic**: Sort theo `stats.views` desc

- `GET /jobs/recent` - **Jobs mới đăng gần đây**

  - **Mục đích**: Hiển thị jobs mới nhất để ứng viên không bỏ lỡ
  - **Sử dụng**: Section "Jobs mới", homepage feed
  - **Logic**: Sort theo `createdAt` desc

- `GET /jobs/popular` - **Jobs phổ biến theo thời gian**
  - **Mục đích**: Jobs có nhiều views/applications trong khoảng thời gian
  - **Sử dụng**: Analytics dashboard, trending analysis
  - **Logic**: Filter theo `period` (day/week/month), sort theo views/applications

#### 📂 **Jobs Theo Danh Mục (Public)**

- `GET /jobs/category/{category}` - **Jobs theo danh mục cụ thể**

  - **Mục đích**: Browse jobs theo lĩnh vực (tech, marketing, sales...)
  - **Sử dụng**: Category pages, navigation menu
  - **Parameters**: `category` (tech, marketing, sales...), `page`, `limit`

- `GET /jobs/location/{location}` - **Jobs theo địa điểm**

  - **Mục đích**: Tìm jobs ở thành phố/khu vực cụ thể
  - **Sử dụng**: Location filter, map view
  - **Parameters**: `location` (Ho Chi Minh, Hanoi...), `page`, `limit`

- `GET /jobs/company/{companyId}` - **Jobs của công ty cụ thể**

  - **Mục đích**: Xem tất cả jobs của một công ty
  - **Sử dụng**: Company profile page, employer branding
  - **Parameters**: `companyId`, `status`, `page`, `limit`

- `GET /jobs/skills` - **Jobs theo kỹ năng**
  - **Mục đích**: Tìm jobs yêu cầu kỹ năng cụ thể
  - **Sử dụng**: Skill-based search, skill pages
  - **Parameters**: `skillIds` (comma-separated), `page`, `limit`

#### 📄 **Chi Tiết Job (Public)**

- `GET /jobs/{id}` - **Chi tiết job theo ID**

  - **Mục đích**: Xem thông tin đầy đủ của job
  - **Sử dụng**: Job detail page, job cards
  - **Response**: Full job data + company info + skills

- `GET /jobs/slug/{slug}` - **Chi tiết job theo slug**

  - **Mục đích**: SEO-friendly URL cho job detail
  - **Sử dụng**: Public job links, sharing
  - **Example**: `/jobs/frontend-developer-intern-tech-solutions`

- `GET /jobs/{id}/similar` - **Jobs tương tự**

  - **Mục đích**: Gợi ý jobs có cùng category/skills
  - **Sử dụng**: "Jobs tương tự" section, recommendation
  - **Logic**: Same category, different skills overlap

- `GET /jobs/{id}/stats` - **Thống kê job**

  - **Mục đích**: Hiển thị metrics của job (views, applications, saves)
  - **Sử dụng**: Job detail page, analytics
  - **Response**: views, applications, saves, shares, clicks

- `POST /jobs/{id}/view` - **Tăng lượt xem job**
  - **Mục đích**: Track job views cho analytics
  - **Sử dụng**: Khi user click vào job detail
  - **Logic**: Increment `stats.views`

#### 🤖 **AI Features (Public)**

- `GET /jobs/{id}/recommendations` - **Gợi ý jobs cho user**

  - **Mục đích**: AI-powered job recommendations dựa trên profile
  - **Sử dụng**: "Jobs phù hợp với bạn", recommendation engine
  - **Parameters**: `userId`, `limit`
  - **Logic**: Match skills, experience, preferences

- `GET /jobs/{id}/match-score` - **Điểm phù hợp job-user**

  - **Mục đích**: Tính toán % match giữa user profile và job requirements
  - **Sử dụng**: Job cards, match indicator, sorting
  - **Parameters**: `userId`
  - **Response**: Match percentage + breakdown

- `GET /jobs/{id}/skill-analysis` - **Phân tích kỹ năng job**

  - **Mục đích**: AI phân tích job description để extract skills
  - **Sử dụng**: Job posting, skill tagging, recommendations
  - **Response**: Extracted skills, importance levels

- `GET /jobs/{id}/roadmap` - **Tạo roadmap kỹ năng**
  - **Mục đích**: Tạo lộ trình học để đạt được job requirements
  - **Sử dụng**: Learning path, skill development
  - **Parameters**: `userId`, `duration` (weeks)
  - **Response**: Structured learning roadmap

#### 👨‍💼 **Quản Lý Jobs (Protected - Employer)**

- `POST /jobs` - **Tạo job mới**

  - **Mục đích**: Employer đăng job mới
  - **Access**: Employer role required
  - **Features**: AI analysis, auto-categorization, skill extraction
  - **Body**: Full job data (title, description, requirements, salary...)

- `PUT /jobs/{id}` - **Cập nhật job**

  - **Mục đích**: Employer chỉnh sửa job đã đăng
  - **Access**: Job owner only
  - **Features**: Re-analyze với AI nếu description thay đổi
  - **Body**: Partial job data

- `DELETE /jobs/{id}` - **Xóa job**
  - **Mục đích**: Employer xóa job không còn cần
  - **Access**: Job owner only
  - **Logic**: Soft delete hoặc hard delete

#### 📝 **Quản Lý Ứng Tuyển (Protected)**

- `POST /jobs/{id}/apply` - **Ứng tuyển job**

  - **Mục đích**: Candidate nộp đơn ứng tuyển
  - **Access**: Candidate role required
  - **Features**: Cover letter, resume, portfolio, custom questions
  - **Validation**: Check deadline, duplicate application

- `GET /jobs/{id}/applications` - **Danh sách ứng tuyển**

  - **Mục đích**: Employer xem danh sách ứng viên
  - **Access**: Job owner only
  - **Features**: Filter by status, pagination, candidate info
  - **Parameters**: `status`, `page`, `limit`

- `PUT /jobs/{id}/applications/{appId}` - **Cập nhật trạng thái ứng tuyển**
  - **Mục đích**: Employer cập nhật status (pending → reviewing → accepted/rejected)
  - **Access**: Job owner only
  - **Features**: Status update, feedback, rating
  - **Body**: `status`, `feedback`

#### 📊 **Analytics & Insights (Protected - Employer)**

- `GET /jobs/{id}/analytics` - **Thống kê chi tiết job**
  - **Mục đích**: Employer xem analytics của job
  - **Access**: Job owner only
  - **Features**: Applications breakdown, timeline, top skills, match scores
  - **Response**: Comprehensive analytics data

### 9. **09-AI-Services.json**

- **Mô tả**: Các dịch vụ AI
- **Endpoints**:
  - `POST /ai/analyze-cv` - Phân tích CV
  - `POST /ai/job-recommendations` - Gợi ý jobs
  - `POST /ai/skill-roadmap` - Tạo roadmap kỹ năng
  - `POST /ai/analyze-job` - Phân tích job posting
  - `POST /ai/match-score` - Tính điểm phù hợp
  - `GET /ai/insights` - Insights AI
  - `POST /ai/batch-analyze` - Phân tích hàng loạt ứng tuyển

### 10. **10-Upload-Services.json**

- **Mô tả**: Dịch vụ upload file
- **Endpoints**:
  - `POST /upload/image` - Upload 1 ảnh
  - `POST /upload/images` - Upload nhiều ảnh
  - `POST /upload/avatar` - Upload avatar
  - `POST /upload/company-logo` - Upload logo công ty
  - `DELETE /upload/{public_id}` - Xóa ảnh
  - `GET /upload/{public_id}/info` - Thông tin ảnh

### 11. **11-Notifications.json**

- **Mô tả**: Quản lý thông báo
- **Endpoints**:
  - `GET /notifications` - Danh sách thông báo
  - `PUT /notifications/{id}/read` - Đánh dấu đã đọc
  - `PUT /notifications/mark-all-read` - Đánh dấu tất cả đã đọc
  - `DELETE /notifications/{id}` - Xóa thông báo

### 12. **12-Dashboard-Analytics.json**

- **Mô tả**: Dashboard và phân tích
- **Endpoints**:
  - `GET /dashboard/stats` - Thống kê dashboard
  - `GET /analytics/user` - Thống kê user
  - `GET /analytics/platform` - Thống kê platform

### 13. **13-Saved-Jobs.json**

- **Mô tả**: Quản lý jobs đã lưu
- **Endpoints**:
  - `GET /saved-jobs` - Danh sách jobs đã lưu
  - `POST /saved-jobs` - Lưu job
  - `PUT /saved-jobs/{id}` - Cập nhật saved job
  - `DELETE /saved-jobs/{id}` - Xóa saved job

### 14. **14-Admin.json**

- **Mô tả**: API quản trị hệ thống
- **Endpoints**:
  - `GET /admin/users` - Danh sách users (admin)
  - `GET /admin/users/{id}` - Chi tiết user (admin)
  - `POST /admin/users` - Tạo user (admin)
  - `PUT /admin/users/{id}` - Cập nhật user (admin)
  - `DELETE /admin/users/{id}` - Xóa user (admin)
  - `PUT /admin/users/{id}/status` - Cập nhật trạng thái user
  - `GET /admin/dashboard` - Dashboard admin
  - `GET /admin/analytics/users` - Thống kê users
  - `GET /admin/verifications` - Danh sách xác thực chờ duyệt
  - `PUT /admin/verifications/{id}` - Duyệt xác thực
  - `GET /admin/system/health` - Sức khỏe hệ thống
  - `GET /admin/system/logs` - Logs hệ thống

## 🚀 Cách sử dụng

### 1. Import vào Postman

1. Mở Postman
2. Click **Import**
3. Chọn từng file JSON hoặc chọn tất cả files
4. Import vào workspace

### 2. Thiết lập Environment Variables

Tạo environment với các biến:

```json
{
  "base_url": "http://localhost:3000",
  "api_url": "http://localhost:3000/api",
  "token": "",
  "user_id": "",
  "job_id": "",
  "company_id": "",
  "skill_id": "",
  "application_id": "",
  "roadmap_id": "",
  "notification_id": "",
  "saved_job_id": "",
  "verification_id": "",
  "public_id": "",
  "google_id_token": "",
  "job_slug": ""
}
```

### 3. Test Flow

1. **Authentication**: Đăng ký → Đăng nhập → Lấy token
2. **Users**: Cập nhật profile → Upload avatar
3. **Jobs**: Tạo job → Tìm kiếm → Ứng tuyển
4. **AI Services**: Phân tích CV → Gợi ý jobs
5. **Admin**: Quản lý users → Xem thống kê

## 📝 Ghi chú

- **Authentication**: Tất cả endpoints cần token (trừ public endpoints)
- **Role-based**: Một số endpoints chỉ dành cho admin/employer
- **File Upload**: Sử dụng form-data cho upload
- **Pagination**: Hầu hết list endpoints đều hỗ trợ pagination
- **Filtering**: Jobs có nhiều filter options
- **AI Features**: Cần cấu hình AI service

## 🔧 Cấu hình Backend

Đảm bảo backend đang chạy trên:

- **URL**: `http://localhost:3000`
- **API Base**: `/api`
- **Database**: MongoDB
- **File Storage**: Cloudinary (cho upload)
- **AI Service**: Đã cấu hình

## 📊 Test Scripts

Một số endpoints có test scripts tự động:

- **Login**: Tự động lưu token và user_id
- **Get Job**: Tự động lưu job_id và job_slug
- **Apply Job**: Tự động lưu application_id

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **401 Unauthorized**: Kiểm tra token
2. **403 Forbidden**: Kiểm tra role/permissions
3. **404 Not Found**: Kiểm tra endpoint URL
4. **500 Internal Error**: Kiểm tra backend logs

### Debug:

1. Kiểm tra Console logs
2. Xem Response body
3. Kiểm tra Environment variables
4. Xem backend logs

## 📋 Tổ chức Collections

### **Cấu trúc theo thứ tự ưu tiên:**

1. **01-Authentication**: Đăng ký, đăng nhập, xác thực
2. **02-Users**: Profile, avatar, preferences
3. **03-Profiles**: Profile ứng viên và nhà tuyển dụng
4. **04-Companies**: Quản lý công ty
5. **05-Skills**: Quản lý kỹ năng
6. **06-Applications**: Quản lý ứng tuyển
7. **07-Skill-Roadmaps**: Roadmap kỹ năng
8. **08-Jobs-Enhanced**: Tất cả về việc làm (tìm kiếm, ứng tuyển, quản lý)
9. **09-AI-Services**: CV analysis, recommendations, roadmaps
10. **10-Upload-Services**: Upload ảnh, avatar, logo
11. **11-Notifications**: Quản lý thông báo
12. **12-Dashboard-Analytics**: Dashboard và phân tích
13. **13-Saved-Jobs**: Jobs đã lưu
14. **14-Admin**: Quản trị hệ thống

### **Workflow Test:**

1. **Authentication** → **Users** → **Profiles**
2. **Companies** → **Skills** → **Jobs-Enhanced**
3. **Applications** → **Skill-Roadmaps** → **AI-Services**
4. **Upload-Services** → **Notifications** → **Dashboard-Analytics**
5. **Saved-Jobs** → **Admin**

## 🎯 **Jobs API - Hướng Dẫn Sử Dụng Chi Tiết**

### **📋 Test Flow cho Jobs API:**

#### **1. Browse Jobs (Public - Không cần token)**

```bash
# Lấy danh sách jobs với filter
GET /api/jobs?page=1&limit=10&category=tech&location=Ho Chi Minh

# Tìm kiếm jobs với text search
GET /api/jobs?q=react developer&salaryMin=5000000&salaryMax=15000000

# Jobs đặc biệt
GET /api/jobs/featured?limit=5
GET /api/jobs/urgent?limit=5
GET /api/jobs/hot?limit=5
GET /api/jobs/recent?limit=10

# Jobs theo danh mục
GET /api/jobs/category/tech?page=1&limit=10
GET /api/jobs/location/Ho Chi Minh?page=1&limit=10
GET /api/jobs/company/{{company_id}}?page=1&limit=10
```

#### **2. AI Search (Public - Không cần token)**

```bash
# AI Semantic Search
GET /api/jobs/search?q=frontend developer&skills=react,javascript&location=Ho Chi Minh&page=1&limit=10

# Lấy job recommendations
GET /api/jobs/{{job_id}}/recommendations?userId={{user_id}}&limit=5

# Tính match score
GET /api/jobs/{{job_id}}/match-score?userId={{user_id}}

# Phân tích kỹ năng job
GET /api/jobs/{{job_id}}/skill-analysis

# Tạo roadmap kỹ năng
GET /api/jobs/{{job_id}}/roadmap?userId={{user_id}}&duration=8
```

#### **3. Job Management (Protected - Cần token + Employer role)**

```bash
# Tạo job mới
POST /api/jobs
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "title": "Frontend Developer Intern",
  "description": "Job description...",
  "requirements": {...},
  "salary": {...},
  "location": {...}
}

# Cập nhật job
PUT /api/jobs/{{job_id}}
Authorization: Bearer {{token}}

# Xóa job
DELETE /api/jobs/{{job_id}}
Authorization: Bearer {{token}}
```

#### **4. Application Management (Protected)**

```bash
# Ứng tuyển job (Candidate)
POST /api/jobs/{{job_id}}/apply
Authorization: Bearer {{token}}
{
  "coverLetter": "Cover letter content...",
  "resumeUrl": "https://...",
  "questions": [...]
}

# Xem danh sách ứng tuyển (Employer)
GET /api/jobs/{{job_id}}/applications?status=pending&page=1&limit=10
Authorization: Bearer {{token}}

# Cập nhật trạng thái ứng tuyển (Employer)
PUT /api/jobs/{{job_id}}/applications/{{application_id}}
Authorization: Bearer {{token}}
{
  "status": "shortlisted",
  "feedback": {...}
}
```

#### **5. Analytics (Protected - Employer)**

```bash
# Thống kê job
GET /api/jobs/{{job_id}}/analytics
Authorization: Bearer {{token}}

# Thống kê cơ bản
GET /api/jobs/{{job_id}}/stats
```

### **🔧 Environment Variables cần thiết:**

```json
{
  "api_url": "http://localhost:3000/api",
  "token": "jwt_token_from_login",
  "user_id": "user_id_from_login",
  "job_id": "job_id_from_get_job",
  "company_id": "company_id_for_job_creation",
  "application_id": "application_id_from_apply",
  "skill_id": "skill_id_for_job_requirements"
}
```

### **📊 Response Format:**

#### **1. Endpoints có Pagination (getAllJobs, searchJobs, getJobsByCategory, etc.):**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "filters": {
    "appliedFilters": 3,
    "searchQuery": "react developer",
    "availableFilters": {...}
  }
}
```

#### **2. Endpoints không có Pagination (featured, urgent, hot, recent, popular, similar):**

```json
{
  "success": true,
  "data": [...],
  "total": 25,
  "limit": 10,
  "message": "Tìm thấy 25 công việc nổi bật"
}
```

#### **3. Single Job Endpoint:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Frontend Developer Intern",
    "companyId": {...},
    "requirements": {...},
    "salary": {...}
  }
}
```

#### **4. Job Stats Endpoint:**

```json
{
  "success": true,
  "data": {
    "views": 150,
    "applications": 25,
    "saves": 8,
    "shares": 3,
    "clicks": 45
  }
}
```

### **⚠️ Lưu ý quan trọng:**

1. **Public APIs**: Không cần token, ai cũng có thể gọi
2. **Protected APIs**: Cần token từ login, check role (employer/candidate)
3. **AI Features**: Cần cấu hình AI service, có thể fallback về text search
4. **Pagination**: Hầu hết list APIs đều hỗ trợ `page` và `limit`
5. **Filtering**: Jobs API có nhiều filter options, có thể combine
6. **Error Handling**: Check status code và error message trong response
