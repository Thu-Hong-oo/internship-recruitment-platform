# 📘 Hướng Dẫn Sử Dụng API Cho Nhà Tuyển Dụng (Employer)

## 🎯 Mục Lục

1. [Đăng Ký & Đăng Nhập](#1-đăng-ký--đăng-nhập)
2. [Xem & Cập Nhật Hồ Sơ](#2-xem--cập-nhật-hồ-sơ)
3. [Upload Tài Liệu Xác Minh](#3-upload-tài-liệu-xác-minh)
4. [Quản Lý Công Việc](#4-quản-lý-công-việc)
5. [Quản Lý Ứng Viên](#5-quản-lý-ứng-viên)
6. [Quản Lý Thành Viên Công Ty](#6-quản-lý-thành-viên-công-ty)
7. [Thống Kê & Dashboard](#7-thống-kê--dashboard)
8. [Lỗi Thường Gặp](#8-lỗi-thường-gặp)

---

## 1. Đăng Ký & Đăng Nhập

### 1.1. Đăng Ký Tài Khoản

```http
POST http://localhost:5001/api/auth/register
Content-Type: application/json

{
  "email": "employer@company.com",
  "password": "SecurePass123!",
  "fullName": "Nguyễn Văn A",
  "role": "employer"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
  "data": {
    "email": "employer@company.com"
  }
}
```

### 1.2. Xác Thực Email

Kiểm tra email và lấy mã OTP (6 ký tự viết hoa).

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
  "message": "Xác thực email thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6543210abcdef",
      "email": "employer@company.com",
      "fullName": "Nguyễn Văn A",
      "role": "employer",
      "status": "active"
    }
  }
}
```

**⚠️ LƯU Ý:** Lưu `token` này để sử dụng cho tất cả các request sau.

### 1.3. Đăng Nhập

```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "employer@company.com",
  "password": "SecurePass123!"
}
```

### 1.4. Quên Mật Khẩu

```http
POST http://localhost:5001/api/auth/forgot-password
Content-Type: application/json

{
  "email": "employer@company.com"
}
```

---

## 2. Xem & Cập Nhật Hồ Sơ

### 2.1. Xem Hồ Sơ Hiện Tại

```http
GET http://localhost:5001/api/employers/profile
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "company": {
      "id": "...",
      "name": "Công ty TNHH ABC",
      "industry": "technology",
      "size": "medium_51_200",
      "email": "contact@abc.com",
      "status": "pending",
      "verification": {
        "isVerified": false
      }
    },
    "position": {
      "title": "CEO",
      "level": "executive"
    },
    "role": "owner",
    "permissions": {
      "canPostJobs": true,
      "canEditJobs": true,
      "canDeleteJobs": true,
      "canViewApplications": true,
      "canReviewApplications": true,
      "canScheduleInterviews": true,
      "canManageMembers": true,
      "canEditCompanyInfo": true
    }
  }
}
```

### 2.2. Cập Nhật Thông Tin Công Ty

```http
PATCH http://localhost:5001/api/employers/profile
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "company": {
    "name": "Công ty TNHH Công Nghệ ABC",
    "legalName": "CÔNG TY TNHH CÔNG NGHỆ ABC",
    "industry": "technology",
    "size": "51-200",
    "description": "Công ty công nghệ hàng đầu tại Việt Nam chuyên về phát triển phần mềm",
    "website": "https://abc-tech.vn",
    "email": "contact@abc-tech.vn",
    "phone": "0901234567",
    "foundedYear": 2020
  },
  "address": {
    "street": "123 Đường Lê Lợi",
    "ward": "Phường Bến Nghé",
    "district": "Quận 1",
    "city": "TP. Hồ Chí Minh",
    "country": "Việt Nam"
  },
  "businessInfo": {
    "registrationNumber": "0123456789",
    "taxId": "0123456789-001",
    "issueDate": "2020-01-15",
    "issuePlace": "Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh"
  },
  "legalRepresentative": {
    "fullName": "Nguyễn Văn A",
    "position": "Giám đốc",
    "phone": "0901234567",
    "email": "ceo@abc-tech.vn"
  },
  "socialMedia": {
    "linkedin": "https://linkedin.com/company/abc-tech",
    "facebook": "https://facebook.com/abctech",
    "twitter": "https://twitter.com/abctech"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Hồ sơ nhà tuyển dụng đã được cập nhật thành công",
  "data": {
    "id": "...",
    "company": {
      "name": "Công ty TNHH Công Nghệ ABC",
      "industry": "technology",
      "size": "medium_51_200",
      "status": "pending"
    }
  }
}
```

---

## 3. Upload Tài Liệu Xác Minh

### 3.1. Kiểm Tra Trạng Thái Xác Minh

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
    "requiredDocuments": [
      {
        "id": "business-license",
        "name": "Giấy phép đăng ký kinh doanh",
        "description": "Giấy phép đăng ký kinh doanh do cơ quan có thẩm quyền cấp",
        "uploaded": false
      },
      {
        "id": "tax-certificate",
        "name": "Giấy chứng nhận đăng ký thuế",
        "description": "Giấy chứng nhận đăng ký thuế do cơ quan thuế cấp",
        "uploaded": false
      }
    ],
    "verification": {
      "isVerified": false,
      "steps": {
        "businessInfo": false,
        "documents": false
      }
    },
    "status": "pending"
  }
}
```

### 3.2. Upload Giấy Phép Đăng Ký Kinh Doanh

```http
POST http://localhost:5001/api/employers/documents/upload
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Form Data:
- document: [FILE] giay-phep-dkkd.pdf
- documentType: "business-license"
- metadata: {
    "documentNumber": "0123456789",
    "issueDate": "2020-01-15",
    "issuePlace": "Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh"
  }
```

**Response:**

```json
{
  "success": true,
  "message": "Tài liệu đã được upload thành công",
  "data": {
    "document": {
      "type": "business-license",
      "url": "https://res.cloudinary.com/...",
      "uploadedAt": "2025-11-07T10:00:00Z",
      "metadata": {
        "documentNumber": "0123456789",
        "issueDate": "2020-01-15",
        "issuePlace": "Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh",
        "originalName": "giay-phep-dkkd.pdf",
        "size": 1024000,
        "mimeType": "application/pdf"
      }
    },
    "verificationProgress": {
      "percentage": 50,
      "uploadedRequired": 1,
      "totalRequired": 2,
      "missingRequired": ["tax-certificate"]
    }
  }
}
```

### 3.3. Upload Giấy Chứng Nhận Thuế

```http
POST http://localhost:5001/api/employers/documents/upload
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Form Data:
- document: [FILE] giay-chung-nhan-thue.pdf
- documentType: "tax-certificate"
- metadata: {
    "documentNumber": "0123456789-001",
    "issueDate": "2020-01-20"
  }
```

**Response:**

```json
{
  "success": true,
  "message": "Tài liệu đã được upload thành công",
  "data": {
    "document": {
      "type": "tax-certificate",
      "url": "https://res.cloudinary.com/...",
      "uploadedAt": "2025-11-07T10:05:00Z"
    },
    "verificationProgress": {
      "percentage": 100,
      "uploadedRequired": 2,
      "totalRequired": 2,
      "missingRequired": []
    }
  }
}
```

### 3.4. Upload Tài Liệu Tùy Chọn (CMND/CCCD)

```http
POST http://localhost:5001/api/employers/documents/upload
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Form Data:
- document: [FILE] cmnd.pdf
- documentType: "legal-representative-id"
- metadata: {
    "documentNumber": "079012345678",
    "issueDate": "2019-05-10",
    "issuePlace": "Công an TP. Hồ Chí Minh"
  }
```

### 3.5. Xóa Tài Liệu

```http
DELETE http://localhost:5001/api/employers/documents/business-license
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Tài liệu đã được xóa thành công",
  "data": {
    "verificationProgress": {
      "percentage": 50,
      "uploadedRequired": 1,
      "totalRequired": 2,
      "missingRequired": ["business-license"]
    }
  }
}
```

---

## 4. Quản Lý Công Việc

### 4.1. Tạo Tin Tuyển Dụng Mới

```http
POST http://localhost:5001/api/jobs
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "title": "Senior Node.js Developer",
  "description": "Chúng tôi đang tìm kiếm một Node.js Developer giàu kinh nghiệm để tham gia đội ngũ phát triển sản phẩm.",
  "requirements": [
    "3+ năm kinh nghiệm với Node.js",
    "Thành thạo Express.js, NestJS",
    "Kinh nghiệm với MongoDB, PostgreSQL",
    "Hiểu biết về microservices",
    "Có kinh nghiệm với Docker, Kubernetes là một lợi thế"
  ],
  "responsibilities": [
    "Phát triển và bảo trì backend services",
    "Thiết kế API RESTful và GraphQL",
    "Tối ưu hóa hiệu suất hệ thống",
    "Code review và mentor junior developers"
  ],
  "location": "Quận 1, TP. Hồ Chí Minh",
  "workingMode": "hybrid",
  "employmentType": "fulltime",
  "experienceLevel": "senior",
  "salary": {
    "min": 2000,
    "max": 3500,
    "currency": "USD",
    "isNegotiable": true
  },
  "skills": [
    "Node.js",
    "Express.js",
    "MongoDB",
    "PostgreSQL",
    "Docker",
    "Microservices"
  ],
  "benefits": [
    "Lương tháng 13",
    "Bảo hiểm đầy đủ",
    "Du lịch hàng năm",
    "Thời gian làm việc linh hoạt",
    "Làm việc từ xa 2 ngày/tuần"
  ],
  "deadline": "2025-12-31T23:59:59Z",
  "numberOfPositions": 2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo tin tuyển dụng thành công",
  "data": {
    "id": "...",
    "title": "Senior Node.js Developer",
    "status": "draft",
    "createdAt": "2025-11-07T10:00:00Z"
  }
}
```

### 4.2. Xem Danh Sách Tin Tuyển Dụng Của Mình

```http
GET http://localhost:5001/api/jobs?employer=me&page=1&limit=20
Authorization: Bearer <your_token>
```

### 4.3. Cập Nhật Tin Tuyển Dụng

```http
PATCH http://localhost:5001/api/jobs/:jobId
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "status": "published",
  "deadline": "2025-12-31T23:59:59Z"
}
```

### 4.4. Xóa Tin Tuyển Dụng

```http
DELETE http://localhost:5001/api/jobs/:jobId
Authorization: Bearer <your_token>
```

---

## 5. Quản Lý Ứng Viên

### 5.1. Xem Danh Sách Ứng Tuyển

```http
GET http://localhost:5001/api/applications?jobId=<job_id>&page=1&limit=20
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "...",
        "candidate": {
          "id": "...",
          "fullName": "Trần Văn B",
          "email": "candidate@email.com",
          "phone": "+84901234567"
        },
        "job": {
          "id": "...",
          "title": "Senior Node.js Developer"
        },
        "status": "pending",
        "cv": {
          "url": "https://...",
          "fileName": "CV_TranVanB.pdf"
        },
        "coverLetter": "Tôi rất quan tâm đến vị trí này...",
        "appliedAt": "2025-11-07T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 5.2. Xem Chi Tiết Hồ Sơ Ứng Tuyển

```http
GET http://localhost:5001/api/applications/:applicationId
Authorization: Bearer <your_token>
```

### 5.3. Cập Nhật Trạng Thái Ứng Tuyển

```http
PATCH http://localhost:5001/api/applications/:applicationId
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "status": "reviewed",
  "notes": "Ứng viên có kinh nghiệm phù hợp, sẽ mời phỏng vấn"
}
```

**Các trạng thái:**

- `pending` - Chờ xem xét
- `reviewed` - Đã xem xét
- `shortlisted` - Lọt vòng trong
- `interviewing` - Đang phỏng vấn
- `offered` - Đã gửi offer
- `accepted` - Ứng viên chấp nhận
- `rejected` - Từ chối

### 5.4. Tải CV Của Ứng Viên

```http
GET http://localhost:5001/api/applications/:applicationId/cv
Authorization: Bearer <your_token>
```

---

## 6. Quản Lý Thành Viên Công Ty

### 6.1. Xem Danh Sách Thành Viên

```http
GET http://localhost:5001/api/employers/company/members
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "...",
        "user": {
          "id": "...",
          "fullName": "Nguyễn Văn A",
          "email": "ceo@company.com"
        },
        "position": {
          "title": "CEO",
          "level": "executive",
          "department": "Quản lý"
        },
        "role": "owner",
        "permissions": {
          "canPostJobs": true,
          "canEditJobs": true,
          "canDeleteJobs": true,
          "canViewApplications": true,
          "canReviewApplications": true,
          "canScheduleInterviews": true,
          "canManageMembers": true,
          "canEditCompanyInfo": true
        },
        "joinedAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 6.2. Mời Thành Viên Mới

```http
POST http://localhost:5001/api/employers/company/members/invite
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "hr@company.com",
  "position": {
    "title": "HR Manager",
    "level": "manager",
    "department": "Nhân sự"
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

**Response:**

```json
{
  "success": true,
  "message": "Đã gửi lời mời đến hr@company.com",
  "data": {
    "invitation": {
      "id": "...",
      "email": "hr@company.com",
      "status": "pending",
      "expiresAt": "2025-11-14T10:00:00Z"
    },
    "invitationLink": "http://localhost:5001/invitations/accept/abc123..."
  }
}
```

### 6.3. Cập Nhật Quyền Thành Viên

```http
PATCH http://localhost:5001/api/employers/company/members/:memberId
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "permissions": {
    "canPostJobs": true,
    "canEditJobs": true,
    "canDeleteJobs": true,
    "canViewApplications": true,
    "canReviewApplications": true,
    "canScheduleInterviews": true,
    "canManageMembers": false,
    "canEditCompanyInfo": false
  }
}
```

### 6.4. Xóa Thành Viên

```http
DELETE http://localhost:5001/api/employers/company/members/:memberId
Authorization: Bearer <your_token>
```

---

## 7. Thống Kê & Dashboard

### 7.1. Xem Thống Kê Tổng Quan

```http
GET http://localhost:5001/api/employers/stats
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalJobs": 15,
    "activeJobs": 8,
    "draftJobs": 3,
    "closedJobs": 4,
    "totalApplications": 156,
    "pendingApplications": 45,
    "reviewedApplications": 67,
    "shortlistedApplications": 23,
    "rejectedApplications": 21,
    "totalViews": 3420,
    "averageApplicationsPerJob": 10.4
  }
}
```

### 7.2. Xem Dashboard

```http
GET http://localhost:5001/api/employers/dashboard
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recentApplications": [...],
    "topJobs": [...],
    "statistics": {...},
    "verificationStatus": {
      "isVerified": true,
      "completedSteps": ["businessInfo", "documents"]
    }
  }
}
```

---

## 8. Lỗi Thường Gặp

### 8.1. Token Hết Hạn

**Lỗi:**

```json
{
  "success": false,
  "error": "Token expired"
}
```

**Giải pháp:** Đăng nhập lại để lấy token mới.

### 8.2. Thiếu Quyền

**Lỗi:**

```json
{
  "success": false,
  "error": "Bạn không có quyền thực hiện hành động này"
}
```

**Giải pháp:** Kiểm tra quyền của tài khoản hoặc liên hệ owner/admin.

### 8.3. Upload File Quá Lớn

**Lỗi:**

```json
{
  "success": false,
  "message": "File quá lớn. Giới hạn tối đa là 10MB"
}
```

**Giải pháp:** Nén file hoặc giảm chất lượng trước khi upload.

### 8.4. Định Dạng File Không Hỗ Trợ

**Lỗi:**

```json
{
  "success": false,
  "message": "Định dạng file không được hỗ trợ"
}
```

**Giải pháp:** Chỉ upload file PDF, JPG, hoặc PNG.

### 8.5. Thiếu Metadata Bắt Buộc

**Lỗi:**

```json
{
  "success": false,
  "error": "Missing required metadata: documentNumber, issueDate"
}
```

**Giải pháp:** Cung cấp đầy đủ thông tin metadata theo yêu cầu.

---

## 📚 Tài Liệu Tham Khảo

- [API Endpoints Documentation](./ACTIVE_API_ENDPOINTS.md)
- [Company Document Verification API](./COMPANY_DOCUMENT_VERIFICATION_API.md)
- [Quick Start Guide](../QUICK_START_DOCUMENT_VERIFICATION.md)
- [Postman Collection](../postman/Company_Document_Verification_API.postman_collection.json)

---

## 💡 Tips & Best Practices

### 1. Bảo Mật Token

- ❌ KHÔNG commit token vào Git
- ❌ KHÔNG share token với người khác
- ✅ Lưu token trong environment variables
- ✅ Sử dụng HTTPS trong production

### 2. Upload Tài Liệu

- ✅ Upload file PDF chất lượng cao
- ✅ Đảm bảo thông tin rõ ràng, không bị mờ
- ✅ Upload đầy đủ 2 tài liệu bắt buộc
- ✅ Kiểm tra metadata trước khi submit

### 3. Quản Lý Công Việc

- ✅ Viết mô tả công việc chi tiết, rõ ràng
- ✅ Cập nhật trạng thái tin tuyển dụng thường xuyên
- ✅ Đặt deadline hợp lý
- ✅ Review ứng viên kịp thời

### 4. Xử Lý Ứng Viên

- ✅ Phản hồi ứng viên trong vòng 48h
- ✅ Cập nhật trạng thái ứng tuyển đúng tiến độ
- ✅ Ghi chú đánh giá chi tiết
- ✅ Tôn trọng privacy của ứng viên

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra lại request format
2. Đọc error message cẩn thận
3. Xem lại documentation
4. Test với Postman collection
5. Liên hệ technical support

---

**Phiên bản:** 1.0.0  
**Cập nhật:** November 7, 2025  
**Ngôn ngữ:** Tiếng Việt
