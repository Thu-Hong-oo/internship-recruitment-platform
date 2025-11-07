# 📝 API Endpoints Update - November 7, 2025

## ✨ New Endpoints Added

### Company Document Verification (3 endpoints)

| Method | Endpoint                                 | Description                                               |
| ------ | ---------------------------------------- | --------------------------------------------------------- |
| GET    | `/api/employers/documents`               | Get all documents and verification status                 |
| POST   | `/api/employers/documents/upload`        | Upload verification document (business license, tax cert) |
| DELETE | `/api/employers/documents/:documentType` | Delete a specific document                                |

---

## 📊 Updated Statistics

### Before:

- Total: **149 HTTP Endpoints**
- Employers section: **16 endpoints**

### After:

- Total: **152 HTTP Endpoints** (+3)
- Employers section: **19 endpoints** (+3)

---

## 📄 Document Types Supported

### Required:

1. `business-license` - Giấy phép đăng ký kinh doanh
2. `tax-certificate` - Giấy chứng nhận đăng ký thuế

### Optional:

3. `legal-representative-id` - CMND/CCCD người đại diện
4. `business-plan` - Kế hoạch kinh doanh
5. `financial-statement` - Báo cáo tài chính

---

## 🔗 Related Files Updated

- ✅ `/src/docs/ACTIVE_API_ENDPOINTS.md` - Main API documentation
- ✅ `/src/docs/COMPANY_DOCUMENT_VERIFICATION_API.md` - Detailed verification API docs
- ✅ `/postman/Company_Document_Verification_API.postman_collection.json` - Postman collection
- ✅ `/QUICK_START_DOCUMENT_VERIFICATION.md` - Quick start guide
- ✅ `/DOCUMENT_VERIFICATION_IMPLEMENTATION.md` - Implementation details

---

## 🚀 Quick Test

```bash
# Get documents
GET http://localhost:5001/api/employers/documents
Authorization: Bearer <token>

# Upload business license
POST http://localhost:5001/api/employers/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

document: [FILE]
documentType: "business-license"
metadata: {"documentNumber":"...","issueDate":"...","issuePlace":"..."}

# Check progress
GET http://localhost:5001/api/employers/documents
# Response: verificationProgress.percentage = 50% or 100%
```

---

## 📈 Verification Flow

```
1. Company created (status: pending)
   └─ GET /documents → 0% progress

2. Upload business license
   └─ POST /documents/upload → 50% progress

3. Upload tax certificate
   └─ POST /documents/upload → 100% progress

4. Admin reviews
   └─ verification.isVerified = true

5. Company verified!
   └─ status = "active" + badge "✓ Verified"
```

---

**Status**: ✅ All endpoint documentation updated
**Date**: November 7, 2025
