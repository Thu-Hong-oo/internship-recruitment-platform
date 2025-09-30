## API Routes Structure (Internship Recruitment Platform)

This file consolidates all current route endpoints, grouped by module, and highlights missing areas for a complete internship recruitment platform.

### Auth (`/api/auth`)

- POST `/register`
- POST `/login`
- POST `/login/google`
- POST `/request-otp`
- POST `/verify-otp`
- POST `/verify-email`
- POST `/resend-verification`
- POST `/refresh-token`
- POST `/logout` (auth required)
- GET `/me` (auth required)
- GET `/unverified`

### Users (`/api/users`)

- GET `/profile` (auth)
- PUT `/profile` (auth)
- POST `/avatar` (auth, multipart)
- PUT `/password` (auth)
- POST `/link-google` (auth)
- DELETE `/unlink-google` (auth)
- PUT `/preferences` (auth)
- PUT `/deactivate` (auth)
- PUT `/reactivate` (auth)
- GET `/stats` (auth)
- GET `/:id` (auth)
- GET `/:id/public-profile` (auth, employer only)
- Notifications (duplicated under notifications router too):
  - GET `/notifications` (auth)
  - PUT `/notifications/read-all` (auth)
  - PUT `/notifications/read` (auth)
  - DELETE `/notifications` (auth)

### Employer Profiles (`/api/employers`)

- GET `/profile` (auth employer)
- GET `/company` (auth employer)
- PUT `/profile` (auth employer)
- PUT `/company` (auth employer)
- GET `/verification-status` (auth employer)
- GET `/document-types` (auth employer)
- POST `/documents/business-license` (auth employer, multipart)
- POST `/documents/tax-certificate` (auth employer, multipart)
- DELETE `/documents/:documentId` (auth employer)
- Media:
  - POST `/upload-logo` (auth employer, multipart)
  - POST `/upload-cover-image` (auth employer, multipart)
  - DELETE `/logo` (auth employer)
  - DELETE `/cover-image` (auth employer)
- Jobs & Applications:
  - GET `/jobs` (auth employer)
  - GET `/applications` (auth employer)
- Analytics:
  - GET `/analytics` (auth employer)
- Public company info (via controller, exposed elsewhere): N/A in this router

### Jobs (`/api/jobs`)

- GET `/` (public, with filters/search)
- GET `/recent` (public)
- GET `/slug/:slug` (public)
- GET `/:id` (public)
- GET `/:id/company` (public)
- GET `/:id/stats` (public)
- POST `/` (auth employer)
- PUT `/:id` (auth employer)
- DELETE `/:id` (auth employer)
- GET `/:id/applications` (auth employer)
- POST `/employer/:id/submit` (auth employer)
- POST `/:id/apply` (auth candidate)
- POST `/:id/view` (public)

### Candidate Profiles (`/api/candidate-profiles` and `/api/candidates` for CV upload)

- GET `/:userId` (auth candidate)
- PUT `/:userId` (auth candidate)
- POST `/:userId/cv` (auth candidate, multipart)
- GET `/:userId/cv/analysis` (auth candidate)
- PUT `/:userId/skills/verify` (auth candidate; controller may gate to admin/employer by flag)
- POST `/:userId/view` (public)
- GET `/:userId/analytics` (auth candidate)
- PUT `/:userId/experience` (auth candidate)
- PUT `/:userId/education` (auth candidate)
- PUT `/:userId/preferences` (auth candidate)
- GET `/:userId/progress` (auth candidate)
- DELETE `/:userId/cv/:cvIndex` (auth candidate)

### Saved Jobs (`/api/saved-jobs`)

- GET `/` (auth candidate)
- GET `/count` (auth candidate)
- GET `/category/:category` (auth candidate)
- GET `/check/:jobId` (auth candidate)
- POST `/` (auth candidate)
- DELETE `/` (auth candidate)
- DELETE `/:id` (auth candidate)
- DELETE `/job/:jobId` (auth candidate)

### Skills (`/api/skills`)

- GET `/` (public)
- GET `/categories` (public)
- GET `/category/:category` (public)
- GET `/popular` (public)
- GET `/search` (public)
- GET `/:id` (public)
- POST `/` (auth admin)
- PUT `/:id` (auth admin)
- DELETE `/:id` (auth admin)

### Skill Categories (`/api/skill-categories`)

- GET `/` (public)
- GET `/tree` (public)
- GET `/popular` (public)
- GET `/search` (public)
- GET `/:id` (public)
- POST `/` (auth admin)
- PUT `/:id` (auth admin)
- PUT `/:id/stats` (auth admin)
- DELETE `/:id` (auth admin)

### Roadmaps (`/api/roadmaps`)

- GET `/` (auth)
- GET `/recommended` (auth)
- GET `/:id` (auth)
- GET `/:id/analytics` (auth)
- POST `/` (auth)
- PUT `/:id` (auth)
- DELETE `/:id` (auth)
- PUT `/:id/complete-week/:weekNumber` (auth)
- PUT `/:id/progress/:weekNumber` (auth)
- POST `/generate-from-job/:jobId` (auth)

### Skill Roadmaps (`/api/skill-roadmaps`)

- POST `/` (auth intern)
- GET `/:id` (auth)
- PUT `/:id/progress` (auth intern)
- Milestones (auth admin/employer for write):
  - GET `/:id/milestones` (auth)
  - POST `/:id/milestones` (auth admin/employer)
  - PUT `/:id/milestones/:milestoneId` (auth admin/employer)
  - DELETE `/:id/milestones/:milestoneId` (auth admin/employer)
- Resources (auth admin/employer for write):
  - GET `/:id/resources` (auth)
  - POST `/:id/resources` (auth admin/employer)
  - PUT `/:id/resources/:resourceId` (auth admin/employer)
  - DELETE `/:id/resources/:resourceId` (auth admin/employer)
- Analytics & Feedback:
  - GET `/:id/analytics` (auth)
  - POST `/:id/feedback` (auth)
  - POST `/:id/share` (auth intern)

### Notifications (`/api/notifications`)

- GET `/` (auth)
- GET `/preferences` (auth)
- GET `/:id` (auth)
- POST `/` (auth)
- PUT `/preferences` (auth)
- PUT `/:id/read` (auth)
- PUT `/read-all` (auth)
- DELETE `/:id` (auth)
- DELETE `/` (auth)
- POST `/broadcast` (auth admin)

### AI Services (`/api/ai`)

- POST `/analyze-cv` (auth, rate-limited)
- POST `/job-recommendations` (auth)
- POST `/skill-roadmap` (auth)
- POST `/analyze-job` (auth employer/admin)
- POST `/match-score` (auth)
- GET `/insights` (auth)
- POST `/batch-analyze` (auth employer/admin)

### AI Analysis (legacy/alt) (`/api/ai-analysis`)

- POST `/cv` (auth)
- POST `/job-description` (auth employer)
- POST `/match-score` (auth)
- GET `/skill-gaps` (auth intern)
- GET `/recommendations` (auth)
- POST `/roadmap/generate` (auth intern)
- POST `/skills/proficiency` (auth)
- GET `/benchmark` (auth)
- GET `/market-insights` (auth)

### Admin (`/api/admin`)

- Users: GET `/users`, GET `/users/:id`, POST `/users`, PUT `/users/:id`, PUT `/users/:id/status`, PUT `/users/:id/role`
- Analytics: GET `/dashboard`, GET `/analytics/users`
- Employers: GET `/employers`, GET `/employers/:id`, PUT `/employers/:id/status`, GET `/employers/:id/companies`, GET `/employers/:id/jobs`, GET `/employers/search`
- Companies: GET `/companies`, GET `/companies/:id`, PUT `/companies/:id`, DELETE `/companies/:id`, GET `/companies/:id/jobs`, GET `/companies/:id/applications`, PUT `/companies/:id/status`
- Verifications: GET `/verifications`, GET `/verifications/:id`, PUT `/verifications/:id`, PUT `/employers/:employerId/documents/:documentId/verify`
- Jobs moderation: GET `/jobs`, GET `/jobs/:id`, PUT `/jobs/:id/status`, DELETE `/jobs/:id`, GET `/jobs/:id/applications`
- System: GET `/system/health`, GET `/system/logs`, GET `/system/overview`, PUT `/system/settings`

### Webhooks (`/api/webhooks`)

- POST `/email-bounce`
- POST `/email-delivery`
- POST `/validate-email`

---

## Observed Gaps vs Typical Internship Recruitment Platform

- Candidate Applications module (candidate side):
  - Missing: list my applications, view application status/timeline, withdraw application, update application documents.
- Employer Application management extensions:
  - Schedule interviews, set interview feedback/outcomes, move stages, send offers, reject with reason; bulk actions.
- Messaging/Chat:
  - Real-time messaging between employer and candidate, with threads per application or job.
- Interview scheduling integration:
  - Calendar slots, invitations, rescheduling, reminders, timezone support.
- Company public endpoints:
  - Public company profile by id/slug and list/search companies for candidates.
- Job bookmarking and alerts:
  - Saved searches, job alerts management (preferences exist but no routes to manage per-alert subscriptions).
- Resume visibility/privacy controls endpoints:
  - Toggle visibility, expose limited vs full CV to verified employers.
- Reviews/ratings (optional):
  - Candidate can review internship/company; moderation endpoints.
- Reporting/Analytics (employer):
  - Funnel reports, time-to-hire, source tracking, export endpoints.
- Admin moderation for content/users beyond current:
  - Audit logs browse/filter, role permissions matrix management.
- Payment/Billing (if paid features):
  - Plan management, invoices, webhook integrations.

If you want, I can scaffold missing route modules (applications, messaging, interview scheduling, company public) and add basic controllers with TODOs for implementation.
