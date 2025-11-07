# 📘 Employer API Guide

## 🎯 Table of Contents

1. [Registration & Login](#1-registration--login)
2. [View & Update Profile](#2-view--update-profile)
3. [Upload Verification Documents](#3-upload-verification-documents)
4. [Job Management](#4-job-management)
5. [Application Management](#5-application-management)
6. [Company Members](#6-company-members)
7. [Statistics & Dashboard](#7-statistics--dashboard)
8. [Common Errors](#8-common-errors)

---

## 1. Registration & Login

### 1.1. Register Account

```http
POST http://localhost:5001/api/auth/register
Content-Type: application/json

{
  "email": "employer@company.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "role": "employer"
}
```

### 1.2. Verify Email

Check your email for the OTP code (6 uppercase characters).

```http
POST http://localhost:5001/api/auth/verify-email
Content-Type: application/json

{
  "email": "employer@company.com",
  "otp": "ABC123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6543210abcdef",
      "email": "employer@company.com",
      "fullName": "John Doe",
      "role": "employer",
      "status": "active"
    }
  }
}
```

**⚠️ IMPORTANT:** Save this `token` for all subsequent requests.

### 1.3. Login

```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "employer@company.com",
  "password": "SecurePass123!"
}
```

---

## 2. View & Update Profile

### 2.1. Get Current Profile

```http
GET http://localhost:5001/api/employers/profile
Authorization: Bearer <your_token>
```

### 2.2. Update Company Information

```http
PATCH http://localhost:5001/api/employers/profile
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "company": {
    "name": "ABC Technology Ltd.",
    "industry": "technology",
    "size": "51-200",
    "description": "Leading software development company",
    "website": "https://abc-tech.com",
    "email": "contact@abc-tech.com",
    "phone": "+84901234567"
  },
  "address": {
    "street": "123 Le Loi Street",
    "ward": "Ben Nghe Ward",
    "district": "District 1",
    "city": "Ho Chi Minh City",
    "country": "Vietnam"
  },
  "businessInfo": {
    "registrationNumber": "0123456789",
    "taxId": "0123456789-001",
    "issueDate": "2020-01-15",
    "issuePlace": "Department of Planning and Investment HCMC"
  }
}
```

---

## 3. Upload Verification Documents

### 3.1. Check Verification Status

```http
GET http://localhost:5001/api/employers/documents
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "documents": [],
    "verificationProgress": {
      "percentage": 0,
      "uploadedRequired": 0,
      "totalRequired": 2,
      "missingRequired": ["business-license", "tax-certificate"]
    },
    "verification": {
      "isVerified": false,
      "steps": {
        "businessInfo": false,
        "documents": false
      }
    }
  }
}
```

### 3.2. Upload Business Registration Certificate

```http
POST http://localhost:5001/api/employers/documents/upload
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Form Data:
- document: [FILE] business-registration.pdf
- documentType: "business-license"
- metadata: {
    "documentNumber": "0123456789",
    "issueDate": "2020-01-15",
    "issuePlace": "Department of Planning and Investment HCMC"
  }
```

### 3.3. Upload Tax Certificate

```http
POST http://localhost:5001/api/employers/documents/upload
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Form Data:
- document: [FILE] tax-certificate.pdf
- documentType: "tax-certificate"
- metadata: {
    "documentNumber": "0123456789-001",
    "issueDate": "2020-01-20"
  }
```

### 3.4. Delete Document

```http
DELETE http://localhost:5001/api/employers/documents/business-license
Authorization: Bearer <your_token>
```

---

## 4. Job Management

### 4.1. Create Job Posting

```http
POST http://localhost:5001/api/jobs
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "title": "Senior Node.js Developer",
  "description": "We are looking for an experienced Node.js developer...",
  "requirements": [
    "3+ years Node.js experience",
    "Strong knowledge of Express.js",
    "Experience with MongoDB"
  ],
  "responsibilities": [
    "Develop and maintain backend services",
    "Design RESTful APIs"
  ],
  "location": "District 1, Ho Chi Minh City",
  "workingMode": "hybrid",
  "employmentType": "fulltime",
  "experienceLevel": "senior",
  "salary": {
    "min": 2000,
    "max": 3500,
    "currency": "USD",
    "isNegotiable": true
  },
  "skills": ["Node.js", "Express.js", "MongoDB"],
  "benefits": [
    "13th month salary",
    "Health insurance",
    "Flexible working hours"
  ],
  "deadline": "2025-12-31T23:59:59Z"
}
```

### 4.2. View My Job Postings

```http
GET http://localhost:5001/api/jobs?employer=me&page=1&limit=20
Authorization: Bearer <your_token>
```

### 4.3. Update Job Posting

```http
PATCH http://localhost:5001/api/jobs/:jobId
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "status": "published",
  "deadline": "2025-12-31T23:59:59Z"
}
```

### 4.4. Delete Job Posting

```http
DELETE http://localhost:5001/api/jobs/:jobId
Authorization: Bearer <your_token>
```

---

## 5. Application Management

### 5.1. View Applications

```http
GET http://localhost:5001/api/applications?jobId=<job_id>&page=1&limit=20
Authorization: Bearer <your_token>
```

### 5.2. View Application Details

```http
GET http://localhost:5001/api/applications/:applicationId
Authorization: Bearer <your_token>
```

### 5.3. Update Application Status

```http
PATCH http://localhost:5001/api/applications/:applicationId
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "status": "reviewed",
  "notes": "Good experience, will invite for interview"
}
```

**Status Values:**

- `pending` - Waiting for review
- `reviewed` - Reviewed
- `shortlisted` - Shortlisted
- `interviewing` - In interview process
- `offered` - Offer sent
- `accepted` - Candidate accepted
- `rejected` - Rejected

---

## 6. Company Members

### 6.1. View Members

```http
GET http://localhost:5001/api/employers/company/members
Authorization: Bearer <your_token>
```

### 6.2. Invite Member

```http
POST http://localhost:5001/api/employers/company/members/invite
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "hr@company.com",
  "position": {
    "title": "HR Manager",
    "level": "manager",
    "department": "Human Resources"
  },
  "permissions": {
    "canPostJobs": true,
    "canEditJobs": true,
    "canDeleteJobs": false,
    "canViewApplications": true,
    "canReviewApplications": true,
    "canScheduleInterviews": true,
    "canManageMembers": false,
    "canEditCompanyInfo": false
  }
}
```

### 6.3. Update Member Permissions

```http
PATCH http://localhost:5001/api/employers/company/members/:memberId
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "permissions": {
    "canPostJobs": true,
    "canEditJobs": true,
    "canDeleteJobs": true
  }
}
```

### 6.4. Remove Member

```http
DELETE http://localhost:5001/api/employers/company/members/:memberId
Authorization: Bearer <your_token>
```

---

## 7. Statistics & Dashboard

### 7.1. View Statistics

```http
GET http://localhost:5001/api/employers/stats
Authorization: Bearer <your_token>
```

### 7.2. View Dashboard

```http
GET http://localhost:5001/api/employers/dashboard
Authorization: Bearer <your_token>
```

---

## 8. Common Errors

### 8.1. Token Expired

**Error:**

```json
{
  "success": false,
  "error": "Token expired"
}
```

**Solution:** Login again to get a new token.

### 8.2. File Too Large

**Error:**

```json
{
  "success": false,
  "message": "File too large. Maximum size is 10MB"
}
```

**Solution:** Compress the file or reduce quality before uploading.

### 8.3. Missing Required Metadata

**Error:**

```json
{
  "success": false,
  "error": "Missing required metadata: documentNumber, issueDate"
}
```

**Solution:** Provide all required metadata fields.

---

## 💡 Best Practices

### 1. Security

- ✅ Use environment variables for tokens
- ✅ Use HTTPS in production
- ❌ Never commit tokens to Git
- ❌ Never share tokens

### 2. Document Upload

- ✅ Upload high-quality PDF files
- ✅ Ensure information is clear and readable
- ✅ Upload all 2 required documents
- ✅ Verify metadata before submitting

### 3. Job Management

- ✅ Write detailed job descriptions
- ✅ Update job status regularly
- ✅ Set reasonable deadlines
- ✅ Review applications promptly

### 4. Candidate Management

- ✅ Respond to candidates within 48 hours
- ✅ Update application status timely
- ✅ Write detailed evaluation notes
- ✅ Respect candidate privacy

---

## 📚 References

- [API Endpoints Documentation](./ACTIVE_API_ENDPOINTS.md)
- [Company Document Verification API](./COMPANY_DOCUMENT_VERIFICATION_API.md)
- [Postman Collection](../postman/Company_Document_Verification_API.postman_collection.json)

---

**Version:** 1.0.0  
**Updated:** November 7, 2025  
**Language:** English
