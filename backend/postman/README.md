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

### 8. **08-Jobs-Enhanced.json**
- **Mô tả**: Quản lý việc làm với tính năng nâng cao
- **Endpoints**:
  - `GET /jobs` - Lấy danh sách jobs (có filter)
  - `GET /jobs/search` - Tìm kiếm jobs
  - `GET /jobs/featured` - Jobs nổi bật
  - `GET /jobs/urgent` - Jobs khẩn cấp
  - `GET /jobs/hot` - Jobs hot
  - `GET /jobs/category/{category}` - Jobs theo danh mục
  - `GET /jobs/location/{location}` - Jobs theo địa điểm
  - `GET /jobs/{id}` - Chi tiết job
  - `GET /jobs/slug/{slug}` - Job theo slug
  - `GET /jobs/{id}/recommendations` - Gợi ý jobs
  - `GET /jobs/{id}/match-score` - Điểm phù hợp
  - `GET /jobs/{id}/skill-analysis` - Phân tích kỹ năng
  - `GET /jobs/{id}/roadmap` - Tạo roadmap
  - `POST /jobs` - Tạo job (employer)
  - `PUT /jobs/{id}` - Cập nhật job (employer)
  - `DELETE /jobs/{id}` - Xóa job (employer)
  - `POST /jobs/{id}/apply` - Ứng tuyển job
  - `GET /jobs/{id}/applications` - Danh sách ứng tuyển (employer)
  - `PUT /jobs/{id}/applications/{appId}` - Cập nhật trạng thái ứng tuyển
  - `GET /jobs/{id}/analytics` - Thống kê job (employer)
  - `GET /jobs/{id}/similar` - Jobs tương tự
  - `GET /jobs/{id}/stats` - Thống kê job
  - `POST /jobs/{id}/view` - Tăng lượt xem
  - `GET /jobs/company/{companyId}` - Jobs theo công ty
  - `GET /jobs/skills` - Jobs theo kỹ năng
  - `GET /jobs/recent` - Jobs mới nhất
  - `GET /jobs/popular` - Jobs phổ biến

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
