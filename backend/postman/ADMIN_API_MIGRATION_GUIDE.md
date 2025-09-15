# Admin API - Modular Structure Update

## 📁 Cấu trúc Controller mới

Đã tách `adminController.js` (2211 lines) thành 7 controllers chuyên biệt:

```
src/controllers/admin/
├── index.js                    # Central exports
├── userController.js           # User management (7 functions)
├── analyticsController.js      # Analytics & dashboard (2 functions)
├── employerController.js       # Employer management (6 functions)
├── companyController.js        # Company management (7 functions)
├── verificationController.js   # Verification workflow (4 functions)
├── jobController.js           # Job moderation (5 functions)
└── systemController.js        # System management (4 functions)
```

## 🔄 Thay đổi Routes

### Routes đã cập nhật:

- **Import statements**: Sử dụng import từ các controller riêng biệt
- **Job routes**:
  - `updateJobStatusAdmin` → `updateJobStatus`
  - Thêm `GET /admin/jobs/:id` → `getJobAdmin`
  - Thêm `DELETE /admin/jobs/:id` → `deleteJobAdmin`
  - Thêm `GET /admin/jobs/:id/applications` → `getJobApplicationsAdmin`
- **System routes**:
  - Thêm `GET /admin/system/overview` → `getSystemOverview`
  - Thêm `PUT /admin/system/settings` → `updateSystemSettings`
- **Removed routes**: `/admin/applications`, `/admin/skills`, `/admin/settings` (deprecated)

### Route mapping mới:

| Method | Endpoint                                                    | Controller             | Function                       |
| ------ | ----------------------------------------------------------- | ---------------------- | ------------------------------ |
| GET    | `/admin/users`                                              | userController         | getUsers                       |
| GET    | `/admin/users/:id`                                          | userController         | getUser                        |
| POST   | `/admin/users`                                              | userController         | createUser                     |
| PUT    | `/admin/users/:id`                                          | userController         | updateUser                     |
| DELETE | `/admin/users/:id`                                          | userController         | deleteUser                     |
| PUT    | `/admin/users/:id/status`                                   | userController         | updateUserStatus               |
| PUT    | `/admin/users/:id/role`                                     | userController         | updateUserRole                 |
| GET    | `/admin/dashboard`                                          | analyticsController    | getDashboardStats              |
| GET    | `/admin/analytics/users`                                    | analyticsController    | getUserAnalytics               |
| GET    | `/admin/employers`                                          | employerController     | getEmployers                   |
| GET    | `/admin/employers/:id`                                      | employerController     | getEmployer                    |
| PUT    | `/admin/employers/:id/status`                               | employerController     | updateEmployerStatus           |
| GET    | `/admin/employers/:id/companies`                            | employerController     | getEmployerCompanies           |
| GET    | `/admin/employers/:id/jobs`                                 | employerController     | getEmployerJobs                |
| GET    | `/admin/employers/search`                                   | employerController     | searchEmployers                |
| GET    | `/admin/companies`                                          | companyController      | getCompanies                   |
| GET    | `/admin/companies/:id`                                      | companyController      | getCompany                     |
| PUT    | `/admin/companies/:id`                                      | companyController      | updateCompany                  |
| DELETE | `/admin/companies/:id`                                      | companyController      | deleteCompany                  |
| GET    | `/admin/companies/:id/jobs`                                 | companyController      | getCompanyJobs                 |
| GET    | `/admin/companies/:id/applications`                         | companyController      | getCompanyApplications         |
| PUT    | `/admin/companies/:id/status`                               | companyController      | updateCompanyStatus            |
| GET    | `/admin/verifications`                                      | verificationController | getPendingVerifications        |
| GET    | `/admin/verifications/:id`                                  | verificationController | getEmployerVerificationDetails |
| PUT    | `/admin/verifications/:id`                                  | verificationController | verifyEmployer                 |
| PUT    | `/admin/employers/:employerId/documents/:documentId/verify` | verificationController | verifyEmployerDocument         |
| GET    | `/admin/jobs`                                               | jobController          | getJobsAdmin                   |
| GET    | `/admin/jobs/:id`                                           | jobController          | getJobAdmin                    |
| PUT    | `/admin/jobs/:id/status`                                    | jobController          | updateJobStatus                |
| DELETE | `/admin/jobs/:id`                                           | jobController          | deleteJobAdmin                 |
| GET    | `/admin/jobs/:id/applications`                              | jobController          | getJobApplicationsAdmin        |
| GET    | `/admin/system/health`                                      | systemController       | getSystemHealth                |
| GET    | `/admin/system/logs`                                        | systemController       | getSystemLogs                  |
| GET    | `/admin/system/overview`                                    | systemController       | getSystemOverview              |
| PUT    | `/admin/system/settings`                                    | systemController       | updateSystemSettings           |

## 📊 Postman Collection

### File mới: `Admin API - Modular.postman_collection.json`

**Các folder được tổ chức:**

1. **👥 User Management** (7 requests)
2. **📊 Analytics & Dashboard** (2 requests)
3. **🏢 Employer Management** (6 requests)
4. **🏢 Company Management** (7 requests)
5. **✅ Verification Management** (6 requests)
6. **💼 Job Moderation** (5 requests)
7. **⚙️ System Management** (4 requests)

**Variables được định nghĩa:**

- `{{api_url}}`: Base API URL
- `{{admin_token}}`: Admin JWT token
- `{{user_id}}`, `{{employer_id}}`, `{{company_id}}`, etc.

## 🚀 Cách sử dụng

### 1. Import Postman Collection:

```bash
# Import file sau vào Postman:
postman/Admin API - Modular.postman_collection.json
```

### 2. Cập nhật Environment:

```json
{
  "api_url": "http://localhost:5000/api",
  "admin_token": "your_admin_jwt_token_here"
}
```

### 3. Test các endpoints:

- Bắt đầu với **User Management** để test cơ bản
- Kiểm tra **System Health** để đảm bảo hệ thống hoạt động
- Test **Verification Management** cho workflow chính

## ⚠️ Breaking Changes

### Routes đã bị xóa:

- `GET /admin/applications` (sử dụng `/admin/jobs/:id/applications` thay thế)
- `GET /admin/skills` (deprecated)
- `GET /admin/settings` (sử dụng `/admin/system/settings` thay thế)

### Function names đã thay đổi:

- `updateJobStatusAdmin` → `updateJobStatus`
- `getApplicationsAdmin` → `getJobApplicationsAdmin`
- `getSkillsAdmin` → removed
- `getSettingsAdmin` → `updateSystemSettings`

## 📈 Lợi ích

1. **Modular Architecture**: Dễ bảo trì và phát triển
2. **Single Responsibility**: Mỗi controller có trách nhiệm rõ ràng
3. **Better Testing**: Dễ test từng module riêng biệt
4. **Team Development**: Nhiều dev có thể làm việc song song
5. **Performance**: Import chỉ cần thiết, giảm memory usage

## 🔧 Migration Guide

### Nếu bạn đang sử dụng adminController cũ:

1. **Cập nhật imports trong routes:**

```javascript
// Cũ
const { getUsers } = require('../controllers/adminController');

// Mới
const { getUsers } = require('../controllers/admin/userController');
```

2. **Cập nhật function calls:**

```javascript
// Cũ
router.put('/jobs/:id/status', updateJobStatusAdmin);

// Mới
router.put('/jobs/:id/status', updateJobStatus);
```

3. **Cập nhật Postman requests:**

- Import collection mới
- Update variables và endpoints

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **Module not found**: Kiểm tra import paths
2. **Function not exported**: Kiểm tra module.exports trong controller
3. **Route not found**: Đảm bảo route đã được định nghĩa đúng

### Debug steps:

1. Check logs cho import errors
2. Verify controller exports
3. Test individual endpoints with Postman
4. Check database connections

---

**Tác giả**: Admin System Refactoring  
**Ngày cập nhật**: {{current_date}}  
**Version**: 2.0.0 - Modular Structure
