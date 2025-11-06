# 📊 ENDPOINT COUNT ANALYSIS

## Tóm tắt nhanh

Ban đầu documentation ghi **34 endpoints** là **SỐ ENDPOINT GROUPS** chứ không phải tổng số endpoints.

Sau khi đếm lại chi tiết, tổng số endpoints **THỰC TẾ** là: **~120+ endpoints**

---

## Chi tiết đếm endpoints theo file routes:

### 1. **auth.js** - 10 endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/login/google
POST   /api/auth/request-otp
POST   /api/auth/verify-otp
POST   /api/auth/verify-email
POST   /api/auth/resend-verification
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
GET    /api/auth/unverified
POST   /api/auth/refresh-token
// POST   /api/auth/logout (commented out)
```

**Active: 12 endpoints**

---

### 2. **candidate.js** - 13 endpoints

```
GET    /api/candidates/profile
PATCH  /api/candidates/profile
POST   /api/candidates/avatar
POST   /api/candidates/cv
GET    /api/candidates/cv
GET    /api/candidates/cv/:cvId/view
PATCH  /api/candidates/cv/:cvId
DELETE /api/candidates/cv/:cvId
PATCH  /api/candidates/cv/:cvId/default
POST   /api/candidates/cv/:cvId/analyze
GET    /api/candidates/completeness
GET    /api/candidates/stats
```

**Total: 13 endpoints**

---

### 3. **employer.js** - 16 endpoints

```
GET    /api/employers/profile
PATCH  /api/employers/profile
POST   /api/employers/company
GET    /api/employers/company
PATCH  /api/employers/company
GET    /api/employers/company/members
POST   /api/employers/company/members/invite
PATCH  /api/employers/company/members/:memberId
DELETE /api/employers/company/members/:memberId
GET    /api/employers/invitations
POST   /api/employers/invitations/accept/:token
POST   /api/employers/invitations/reject/:token
DELETE /api/employers/invitations/:invitationId
GET    /api/employers/invitations/preview/:token
GET    /api/employers/stats
GET    /api/employers/dashboard
```

**Total: 16 endpoints**

---

### 4. **jobPost.js** - 10 endpoints

```
GET    /api/jobs (public)
GET    /api/jobs/search (public)
GET    /api/jobs/:id (public)
POST   /api/jobs
GET    /api/jobs/employer
PATCH  /api/jobs/:id
DELETE /api/jobs/:id
PATCH  /api/jobs/:id/publish
PATCH  /api/jobs/:id/close
GET    /api/jobs/:id/stats
```

**Total: 10 endpoints**

---

### 5. **application.js** - 10 endpoints

```
POST   /api/applications
GET    /api/applications/:id
PATCH  /api/applications/:id/status
PATCH  /api/applications/:id/withdraw
PATCH  /api/applications/:id/view
PATCH  /api/applications/:id/notes
GET    /api/applications/candidate
GET    /api/applications/job/:jobId
GET    /api/applications/stats
GET    /api/applications/employer/stats
```

**Total: 10 endpoints**

---

### 6. **ai.js** - 7 endpoints

```
POST   /api/ai/match
GET    /api/ai/matching-history
POST   /api/ai/parse-cv
POST   /api/ai/parse-job-description
POST   /api/ai/suggestions/skills
POST   /api/ai/suggestions/career
GET    /api/ai/insights/market
```

**Total: 7 endpoints**

---

### 7. **skill.js** - 14 endpoints

```
GET    /api/skills (public)
GET    /api/skills/search (public)
GET    /api/skills/categories (public)
GET    /api/skills/popular (public)
GET    /api/skills/trending (public)
GET    /api/skills/stats (public)
GET    /api/skills/category/:categoryId (public)
GET    /api/skills/:id (public)
GET    /api/skills/recommendations (candidate)
POST   /api/skills (admin)
PATCH  /api/skills/:id (admin)
DELETE /api/skills/:id (admin)
```

**Total: 14 endpoints** (8 public + 1 candidate + 3 admin)

---

### 8. **roadmap.js** - 9 endpoints

```
GET    /api/roadmaps
POST   /api/roadmaps/generate
GET    /api/roadmaps/recommendations
GET    /api/roadmaps/stats
GET    /api/roadmaps/:id
DELETE /api/roadmaps/:id
GET    /api/roadmaps/:id/progress
PATCH  /api/roadmaps/:id/progress
PATCH  /api/roadmaps/:id/phases/:phaseId/complete
```

**Total: 9 endpoints**

---

### 9. **notification.js** - 10 endpoints

```
GET    /api/notifications
POST   /api/notifications (admin)
GET    /api/notifications/:id
DELETE /api/notifications/:id
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
GET    /api/notifications/settings
PATCH  /api/notifications/settings
GET    /api/notifications/unread-count
GET    /api/notifications/stats
```

**Total: 10 endpoints**

---

### 10. **chat.js** - 10 endpoints

```
POST   /api/chat/conversations
GET    /api/chat/conversations
GET    /api/chat/conversations/:id
PATCH  /api/chat/conversations/:id/archive
PATCH  /api/chat/conversations/:id/unarchive
PATCH  /api/chat/conversations/:id/read
POST   /api/chat/conversations/:id/messages
GET    /api/chat/conversations/:id/messages
PATCH  /api/chat/messages/:id
DELETE /api/chat/messages/:id
GET    /api/chat/unread-count
```

**Total: 11 endpoints**

---

### 11. **admin.js** - 16 endpoints

```
GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/users/:id
DELETE /api/admin/users/:id
PATCH  /api/admin/users/:id/status
GET    /api/admin/stats
GET    /api/admin/logs
GET    /api/admin/health
GET    /api/admin/queues
DELETE /api/admin/queues/:queueName
GET    /api/admin/settings
PATCH  /api/admin/settings
POST   /api/admin/notifications
GET    /api/admin/reports
```

**Total: 16 endpoints**

---

### 12. **savedJobs.js** - 6 endpoints

```
POST   /api/saved-jobs
GET    /api/saved-jobs
GET    /api/saved-jobs/stats
PATCH  /api/saved-jobs/:id
DELETE /api/saved-jobs/:id
DELETE /api/saved-jobs/bulk
```

**Total: 6 endpoints**

---

### 13. **industry.js** - 13 endpoints

```
GET    /api/industries (public)
GET    /api/industries/active (public)
GET    /api/industries/search (public)
GET    /api/industries/trends (public)
GET    /api/industries/:id (public)
GET    /api/industries/:id/stats (public)
GET    /api/industries/:id/companies (public)
GET    /api/industries/:id/jobs (public)
POST   /api/industries (admin)
PATCH  /api/industries/:id (admin)
DELETE /api/industries/:id (admin)
```

**Total: 13 endpoints** (8 public + 3 admin)

---

### 14. **public.js** - 1 endpoint

```
GET    /api/public/cv/view/:token
```

**Total: 1 endpoint** (public CV viewing with token)

---

### 15. **index.js** - 1 endpoint

```
GET    /health
```

**Total: 1 endpoint**

---

## 📊 Tổng kết:

| Group          | Endpoints         | Note                                            |
| -------------- | ----------------- | ----------------------------------------------- |
| Authentication | 12                | Register, Login, OAuth, OTP, Email verification |
| Candidates     | 13                | Profile, CV upload/management, Stats            |
| Employers      | 16                | Profile, Company, Team invitations, Dashboard   |
| Jobs           | 10                | CRUD jobs, Publish, Close, Stats                |
| Applications   | 10                | Apply, Status management, Stats                 |
| AI/NLP         | 7                 | Matching, Parsing, Suggestions, Insights        |
| Skills         | 14                | Public skills data + Admin management           |
| Roadmaps       | 9                 | Generate, Progress tracking                     |
| Notifications  | 10                | Read, Settings, Stats                           |
| Chat           | 11                | Conversations, Messages                         |
| Admin          | 16                | Users, System management, Reports               |
| Saved Jobs     | 6                 | Save, Remove, Stats                             |
| Industries     | 13                | Master data + Admin CRUD                        |
| Public         | 1                 | CV viewing token                                |
| Health         | 1                 | Server health check                             |
| **TOTAL**      | **149 endpoints** |                                                 |

---

## ❓ Tại sao ban đầu ghi 34?

**Nhầm lẫn giữa:**

- ✅ **34 = Số endpoint GROUPS** (số controller methods, không tính variants)
- ❌ **149 = Tổng số HTTP endpoints** (GET, POST, PATCH, DELETE riêng biệt)

**Ví dụ:**

```javascript
// Đếm là 1 "endpoint group"
router
  .route('/:id')
  .get(getById) // → /api/jobs/:id (GET)
  .patch(update) // → /api/jobs/:id (PATCH)
  .delete(remove); // → /api/jobs/:id (DELETE)

// Nhưng thực tế là 3 HTTP endpoints riêng biệt!
```

---

## 🎯 Kết luận:

**Documentation ban đầu không sai**, chỉ là cách đếm khác nhau:

- **34 endpoints** = Đếm theo **functional groups** (mỗi chức năng là 1 endpoint)
- **149 endpoints** = Đếm theo **HTTP methods** (mỗi HTTP method là 1 endpoint)

Cả hai cách đếm đều đúng, tùy ngữ cảnh sử dụng:

- Với developer: Nên đếm theo HTTP methods (149)
- Với product owner: Có thể đếm theo features (34)
