# 📚 Chỉ mục tài liệu - Documentation Index

> Hệ thống tài liệu đầy đủ cho InternBridge Platform

## 🚀 Quick Start

### Cho Nhà tuyển dụng (For Employers)

- 🇻🇳 **[HUONG_DAN_EMPLOYER.md](./HUONG_DAN_EMPLOYER.md)** - Hướng dẫn toàn diện (Tiếng Việt)
- 🇬🇧 **[EMPLOYER_GUIDE.md](./EMPLOYER_GUIDE.md)** - Complete Guide (English)

### Cho Developer

- 📘 **[README.md](./README.md)** - Overview & Getting Started
- 🏗️ **[docs/ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)** - System Architecture
- 💻 **[docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)** - Development Guidelines

---

## 📋 I. Hướng dẫn người dùng (User Guides)

### 👔 Nhà tuyển dụng (Employers)

| Tài liệu                                             | Nội dung                                           | Ngôn ngữ      |
| ---------------------------------------------------- | -------------------------------------------------- | ------------- |
| **[HUONG_DAN_EMPLOYER.md](./HUONG_DAN_EMPLOYER.md)** | Hướng dẫn chi tiết từ đăng ký đến quản lý ứng viên | 🇻🇳 Tiếng Việt |
| **[EMPLOYER_GUIDE.md](./EMPLOYER_GUIDE.md)**         | Complete workflow guide for employers              | 🇬🇧 English    |

**Nội dung bao gồm:**

- ✅ Đăng ký & Xác thực email
- ✅ Quản lý hồ sơ công ty
- ✅ Xác minh giấy tờ (Giấy phép kinh doanh, Giấy chứng nhận thuế)
- ✅ Đăng & Quản lý tin tuyển dụng
- ✅ Xem & Xử lý đơn ứng tuyển
- ✅ Mời & Quản lý thành viên công ty
- ✅ Thống kê & Dashboard

### 👤 Ứng viên (Candidates)

> Coming soon...

---

## 🔌 II. API Documentation

### Danh sách Endpoints

| Tài liệu                                                                       | Mô tả                                  | Trạng thái             |
| ------------------------------------------------------------------------------ | -------------------------------------- | ---------------------- |
| **[ACTIVE_API_ENDPOINTS.md](./ACTIVE_API_ENDPOINTS.md)**                       | 152 endpoints đang hoạt động           | ✅ Updated Nov 7, 2025 |
| **[API_ENDPOINTS_STRUCTURE.md](./API_ENDPOINTS_STRUCTURE.md)**                 | Chi tiết cấu trúc API                  | ✅ Active              |
| **[API_ENDPOINTS_UPDATE_2025-11-07.md](./API_ENDPOINTS_UPDATE_2025-11-07.md)** | Changelog - Document Verification APIs | 📝 Latest              |

### API chi tiết theo chức năng

#### 📄 Document Verification (Xác minh giấy tờ)

- **[COMPANY_DOCUMENT_VERIFICATION_API.md](./COMPANY_DOCUMENT_VERIFICATION_API.md)** - Complete API Specification
  - GET /api/employers/documents - Lấy danh sách giấy tờ
  - POST /api/employers/documents/upload - Upload giấy tờ
  - DELETE /api/employers/documents/:type - Xóa giấy tờ

**Hỗ trợ:**

- ✅ Postman Collection: `Company_Document_Verification_API.postman_collection.json`
- ✅ Test Script: `scripts/test-document-upload.js`
- ✅ Quick Start: `QUICK_START_DOCUMENT_VERIFICATION.md`

#### 🏢 Identity & Profile

- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - Complete API Reference

---

## 🏗️ III. Kiến trúc & Thiết kế (Architecture)

### Tổng quan

| Tài liệu                                                       | Mô tả                    |
| -------------------------------------------------------------- | ------------------------ |
| **[docs/ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)** | Clean Architecture + DDD |
| **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)**                 | System Overview          |
| **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**             | Cấu trúc thư mục         |

### Domain Models

| Tài liệu                                                               | Mô tả                            |
| ---------------------------------------------------------------------- | -------------------------------- |
| **[docs/DOMAIN_MODELS.md](./docs/DOMAIN_MODELS.md)**                   | Domain entities & business logic |
| **[examples/domain-model-usage.js](./examples/domain-model-usage.js)** | Usage examples                   |

### UML Diagrams

```
diagram/
├── improved_domain_model.puml      # Domain model diagram
├── logic_entity.puml               # Entity relationships
├── ai_matching_sequence.puml       # AI matching flow
├── uc002_apply_sequence.puml       # Application process
├── uc004_manage_applications_sequence.puml
└── activity.puml
```

---

## 💻 IV. Development (Phát triển)

### Getting Started

| Tài liệu                                                     | Mô tả                        |
| ------------------------------------------------------------ | ---------------------------- |
| **[docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)** | Setup & Development workflow |
| **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)**         | Testing strategies           |

### Implementation Guides

| Tài liệu                                                                                 | Mô tả                        |
| ---------------------------------------------------------------------------------------- | ---------------------------- |
| **[DOCUMENT_VERIFICATION_IMPLEMENTATION.md](./DOCUMENT_VERIFICATION_IMPLEMENTATION.md)** | Document verification system |
| **[QUICK_START_DOCUMENT_VERIFICATION.md](./QUICK_START_DOCUMENT_VERIFICATION.md)**       | Quick implementation guide   |
| **[src/application/README.md](./src/application/README.md)**                             | Use Case pattern             |

### Scripts

```
scripts/
├── test-document-upload.js         # Test document upload flow
├── clean-architecture-refactor.js  # Architecture migration
└── evaluate-nlp-research.js        # NLP evaluation
```

---

## 🗄️ V. Database (Cơ sở dữ liệu)

| Tài liệu                                                 | Mô tả                         |
| -------------------------------------------------------- | ----------------------------- |
| **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** | Complete schema documentation |
| **[docs/DOMAIN_MODELS.md](./docs/DOMAIN_MODELS.md)**     | Domain models & validation    |

**Key Schemas:**

- User & Authentication
- Company & Employer Profile
- Job & Application
- Document Verification ⭐ New
- Skills & Assessments
- Notifications & Chat

---

## 🚀 VI. Deployment (Triển khai)

| Tài liệu                                                                       | Mô tả                        |
| ------------------------------------------------------------------------------ | ---------------------------- |
| **[docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)**                     | Full deployment instructions |
| **[docs/FREE_TIER_SETUP.md](./docs/FREE_TIER_SETUP.md)**                       | Free tier configuration      |
| **[docs/DEPLOYMENT_RECOMMENDATIONS.md](./docs/DEPLOYMENT_RECOMMENDATIONS.md)** | Best practices               |

**Environment:**

- Node.js 18+
- MongoDB 6.0+
- Redis (optional)
- Cloudinary (file storage)

---

## 🧪 VII. Testing

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   └── domain/            # Domain logic tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
└── research/
    └── nlp-research.test.js
```

### Testing Guides

| Tài liệu                                               | Mô tả                  |
| ------------------------------------------------------ | ---------------------- |
| **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)**   | Complete testing guide |
| **[tests/helpers/setup.js](./tests/helpers/setup.js)** | Test configuration     |

---

## 🔬 VIII. Research & AI

| Tài liệu                                                               | Mô tả                 |
| ---------------------------------------------------------------------- | --------------------- |
| **[NLP_RESEARCH_DOCUMENTATION.md](./NLP_RESEARCH_DOCUMENTATION.md)**   | NLP research findings |
| **[NLP_RESEARCH_SUMMARY_REPORT.md](./NLP_RESEARCH_SUMMARY_REPORT.md)** | Research summary      |

---

## 📦 IX. Postman Collections

```
postman/
├── Admin_API.postman_collection.json
├── AI_Services_API.postman_collection.json
├── Candidate_API_Corrected.postman_collection.json
├── Chat_API.postman_collection.json
├── Employer_API_Corrected.postman_collection.json
├── Job_Management_API_Corrected.postman_collection.json
├── Notifications_API.postman_collection.json
├── Skills_API.postman_collection.json
└── Company_Document_Verification_API.postman_collection.json ⭐ New
```

**How to use:**

1. Import vào Postman
2. Set environment variables:
   - `baseUrl`: http://localhost:5001
   - `token`: Your JWT token
3. Run collection

---

## 🆘 X. Troubleshooting & FAQs

### Common Issues

#### 1. Token Expired

```json
{
  "status": "error",
  "message": "Token hết hạn"
}
```

**Solution:** Login lại để lấy token mới

#### 2. File Upload Failed

```json
{
  "status": "error",
  "message": "Kích thước file vượt quá giới hạn"
}
```

**Solution:** Giảm kích thước file xuống < 10MB

#### 3. Missing Metadata

```json
{
  "status": "error",
  "message": "Thiếu thông tin metadata"
}
```

**Solution:** Kiểm tra metadata theo loại giấy tờ trong `COMPANY_DOCUMENT_VERIFICATION_API.md`

### Support

- 📧 Email: support@internbridge.com
- 📖 Documentation: [docs/README.md](./docs/README.md)
- 🐛 Issues: GitHub Issues

---

## 📊 XI. Statistics & Metrics

### Current System Status

- **Total Endpoints:** 152
- **Documentation Files:** 30+
- **Test Coverage:** In progress
- **Clean Architecture:** 56% complete (11/20 repositories)

### Recent Updates

#### November 7, 2025

- ✅ Added Document Verification APIs (+3 endpoints)
- ✅ Created Employer Guides (Vietnamese + English)
- ✅ Updated ACTIVE_API_ENDPOINTS.md
- ✅ Added Postman collection for document verification

---

## 🔄 XII. Migration & Refactoring

| Tài liệu                                                                               | Mô tả                    |
| -------------------------------------------------------------------------------------- | ------------------------ |
| **[CLEANUP_DEPRECATED_SERVICES.md](./CLEANUP_DEPRECATED_SERVICES.md)**                 | Deprecated services list |
| **[scripts/clean-architecture-refactor.js](./scripts/clean-architecture-refactor.js)** | Refactoring script       |

**Clean Architecture Progress:** 56% (11/20 repositories migrated)

---

## 🎯 XIII. Roadmap & Next Steps

### Completed ✅

- Document Verification System
- Employer API Documentation
- Postman Collections
- Vietnamese & English User Guides

### In Progress 🔄

- Candidate User Guide
- Admin Panel Documentation
- Test Coverage Improvement

### Planned 📅

- Email Notification Templates
- Webhook Documentation
- API Rate Limiting Guide
- GraphQL API (future)

---

## 📝 XIV. Contributing

Before contributing, please read:

1. **[docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)** - Development guidelines
2. **[docs/ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)** - Architecture principles
3. **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Testing requirements

---

## 📞 Contact & Support

- **Developer:** InternBridge Team
- **Email:** dev@internbridge.com
- **Documentation Issues:** Create GitHub issue
- **API Questions:** Check [HUONG_DAN_EMPLOYER.md](./HUONG_DAN_EMPLOYER.md) first

---

## 🏷️ Tags & Keywords

`internship` `recruitment` `ai-matching` `document-verification` `clean-architecture` `domain-driven-design` `nodejs` `express` `mongodb` `cloudinary` `api-documentation` `employer-guide` `vietnamese`

---

**Last Updated:** November 7, 2025  
**Version:** 2.0.0  
**Maintained by:** InternBridge Development Team
