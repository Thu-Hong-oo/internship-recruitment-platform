# 📬 Postman Collections - API Testing

Complete Postman collections for testing the Internship Recruitment Platform API.

---

## 📦 Available Collections

### 1. **Employer_API_Complete.postman_collection.json** ✨ NEW

Complete API collection for **Employer** role with 10 categories:

1. **Authentication** (3 endpoints)

   - Register Employer
   - Login Employer
   - Verify Email

2. **Employer Profile** (4 endpoints)

   - Get My Profile
   - Update Profile
   - Get Dashboard Stats
   - Get Employer Stats

3. **Company Management** (3 endpoints)

   - Create Company
   - Get Company Info
   - Update Company

4. **Team Management** (6 endpoints)

   - Get Company Members
   - Invite Member
   - Get My Invitations
   - Accept Invitation
   - Update Member Permissions
   - Remove Member

5. **Job Management** (8 endpoints)

   - Create Job Post
   - Get My Job Posts
   - Get Job Details
   - Update Job Post
   - Publish Job
   - Close Job
   - Get Job Stats
   - Delete Job Post

6. **Application Management** (6 endpoints)

   - Get Job Applications
   - Get Application Details
   - Update Application Status
   - Mark Application as Viewed
   - Add Employer Notes
   - Get Application Stats

7. **Skills & Industries** (4 endpoints)

   - Get All Skills
   - Search Skills
   - Get All Industries
   - Get Industry Jobs

8. **AI & Matching** (3 endpoints)

   - Match Candidate to Job
   - Parse Job Description
   - Get Market Insights

9. **Notifications** (4 endpoints)

   - Get My Notifications
   - Mark Notification as Read
   - Mark All as Read
   - Get Unread Count

10. **Chat & Messaging** (5 endpoints)
    - Get Conversations
    - Create Conversation
    - Get Conversation Messages
    - Send Message
    - Get Unread Messages Count

**Total: 46 endpoints**

---

### 2. **Candidate_API_Corrected.postman_collection.json**

API collection for **Candidate** role (legacy)

### 3. **Job_Management_API_Corrected.postman_collection.json**

Job posting and management APIs (legacy)

### 4. **AI_Services_API.postman_collection.json**

AI/NLP services and matching APIs

### 5. **Other Collections**

- `Admin_API.postman_collection.json` - Admin features
- `Chat_API.postman_collection.json` - Chat and messaging
- `Skills_API.postman_collection.json` - Skills and roadmaps
- `Notifications_API.postman_collection.json` - Notification system

---

## 🚀 Quick Start

### 1. Import Collection

**Option A: Postman Desktop App**

1. Open Postman
2. Click **Import** button
3. Select `Employer_API_Complete.postman_collection.json`
4. Click **Import**

**Option B: Drag & Drop**

1. Drag the `.json` file into Postman window
2. Collection will be imported automatically

### 2. Set Variables

The collection uses variables for easy configuration:

```javascript
// Collection Variables (set automatically)
base_url = http://localhost:3000
employer_token = (auto-set after login)
employer_id = (auto-set after login)
company_id = (auto-set after company creation)
job_id = (auto-set after job creation)
```

**Manual Setup** (if needed):

1. Click on collection name
2. Go to **Variables** tab
3. Update `base_url` if using different port

### 3. Test Workflow

**Step 1: Authentication**

```
1. Run "Register Employer" → Token auto-saved
2. Check email for OTP (or use test OTP: 123456)
3. Run "Verify Email"
4. Run "Login Employer" → Token refreshed
```

**Step 2: Setup Company**

```
5. Run "Create Company" → company_id auto-saved
6. Run "Get Company Info" → Verify creation
7. Run "Update Company" → Add benefits, culture
```

**Step 3: Post Jobs**

```
8. Run "Create Job Post" → job_id auto-saved
9. Run "Publish Job" → Make it visible
10. Run "Get My Job Posts" → View all jobs
```

**Step 4: Manage Applications**

```
11. Run "Get Job Applications" → See candidates
12. Run "Update Application Status" → Shortlist/Reject
13. Run "Add Employer Notes" → Document feedback
```

---

## 🔧 Configuration

### Environment Setup

Create Postman Environment for different stages:

**Development**

```json
{
  "base_url": "http://localhost:3000",
  "env": "development"
}
```

**Staging**

```json
{
  "base_url": "https://staging-api.yourcompany.com",
  "env": "staging"
}
```

**Production**

```json
{
  "base_url": "https://api.yourcompany.com",
  "env": "production"
}
```

### Authentication

All protected endpoints use **Bearer Token** authentication:

```
Authorization: Bearer {{employer_token}}
```

Token is **automatically set** after successful login/register.

**Manual Token Setup:**

1. Login via API or UI
2. Copy JWT token from response
3. Set `employer_token` variable in collection
4. All requests will use this token automatically

---

## 📝 Request Examples

### Create Job Post

```json
POST /api/jobs
Authorization: Bearer {{employer_token}}

{
  "title": "Senior Full-Stack Developer",
  "description": "We are looking for an experienced developer...",
  "requirements": [
    "5+ years experience",
    "Node.js & React expertise"
  ],
  "skills": ["Node.js", "React", "MongoDB"],
  "type": "fulltime",
  "level": "senior",
  "location": "Ho Chi Minh City",
  "salary": {
    "min": 2000,
    "max": 3500,
    "currency": "USD"
  },
  "deadline": "2025-12-31"
}
```

### Update Application Status

```json
PATCH /api/applications/:applicationId/status
Authorization: Bearer {{employer_token}}

{
  "status": "shortlisted",
  "message": "Your profile matches our requirements. We will contact you soon."
}
```

**Available Statuses:**

- `pending` - Just submitted
- `shortlisted` - Selected for review
- `interviewing` - In interview process
- `offered` - Job offer extended
- `rejected` - Not selected
- `hired` - Successfully hired

---

## 🧪 Testing Tips

### 1. Use Pre-request Scripts

Auto-generate test data:

```javascript
// Pre-request Script
pm.variables.set('timestamp', Date.now());
pm.variables.set('random_email', `employer${Date.now()}@test.com`);
```

### 2. Use Test Scripts

Validate responses:

```javascript
// Test Script
pm.test('Status is 200', () => {
  pm.response.to.have.status(200);
});

pm.test('Has token', () => {
  const response = pm.response.json();
  pm.expect(response.token).to.exist;
});
```

### 3. Chain Requests

Use Collection Runner for sequential testing:

1. Select collection
2. Click **Run** button
3. Configure order and iterations
4. Click **Run Collection**

### 4. Monitor APIs

Set up monitoring for production:

1. Click **...** on collection
2. Select **Monitor Collection**
3. Schedule runs (hourly, daily)
4. Get email alerts on failures

---

## 🐛 Troubleshooting

### Error: Unauthorized (401)

**Solution:**

1. Check if token is set: `{{employer_token}}`
2. Login again to refresh token
3. Verify token in Authorization header

### Error: Forbidden (403)

**Solution:**

1. Check user role (must be `employer`)
2. Verify email is confirmed
3. Check permissions for team members

### Error: Not Found (404)

**Solution:**

1. Verify IDs are correct (`job_id`, `company_id`)
2. Check if resource exists
3. Ensure you're the owner

### Error: Validation Error (400)

**Solution:**

1. Check required fields
2. Verify data types (dates, numbers)
3. Review example requests in collection

---

## 📚 API Documentation

Full API documentation available at:

- **Swagger UI**: http://localhost:3000/api-docs
- **Markdown**: [ACTIVE_API_ENDPOINTS.md](../src/docs/ACTIVE_API_ENDPOINTS.md)
- **Quick Ref**: [QUICK_API_REFERENCE.md](../src/docs/QUICK_API_REFERENCE.md)

---

## 🔄 Updates

**v2.0.0** - November 6, 2025

- ✨ New: Complete Employer API collection
- ✨ 46 endpoints across 10 categories
- ✨ Auto-save tokens and IDs
- ✨ Pre-configured with examples
- ✨ Test scripts included

**v1.0.0** - November 5, 2025

- Initial collections for Candidate, Job, AI, Admin

---

## 💡 Best Practices

1. **Always verify email** before testing other features
2. **Create company first** before posting jobs
3. **Use meaningful names** for test data
4. **Clean up test data** after testing
5. **Use Collection Runner** for regression testing
6. **Monitor production APIs** regularly
7. **Keep tokens secure** - don't commit to git

---

## 📞 Support

Issues or questions?

- Check [API Documentation](../src/docs/)
- Review [Development Guide](../src/docs/DEVELOPMENT_GUIDE.md)
- Contact: dev-team@yourcompany.com

---

**Happy Testing! 🚀**
