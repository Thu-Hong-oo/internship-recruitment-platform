# 📄 Company Document Verification - Implementation Summary

## ✅ What Was Implemented

A complete document verification system for companies to upload and manage business documents (business license, tax certificate, etc.) for account verification.

---

## 📁 Files Created

### 1. **Use Cases** (Business Logic)

- ✅ `UploadCompanyDocumentUseCase.js` - Upload and validate documents
- ✅ `GetCompanyDocumentsUseCase.js` - Retrieve documents and verification status
- ✅ `DeleteCompanyDocumentUseCase.js` - Delete documents with permission check

### 2. **Controllers** (HTTP Layer)

- ✅ `documentController.js` - Handle HTTP requests for document operations

### 3. **Routes** (API Endpoints)

- ✅ Updated `employer.js` routes:
  - `GET /api/employers/documents` - Get documents
  - `POST /api/employers/documents/upload` - Upload document
  - `DELETE /api/employers/documents/:documentType` - Delete document

### 4. **Configuration**

- ✅ Updated `container.js` - Registered use cases in DI container
- ✅ Existing `documentTypes.js` - Document type definitions and validation rules

### 5. **Documentation**

- ✅ `COMPANY_DOCUMENT_VERIFICATION_API.md` - Complete API documentation
- ✅ `Company_Document_Verification_API.postman_collection.json` - Postman collection

### 6. **Testing**

- ✅ `test-document-upload.js` - Automated test script

---

## 🔧 How It Works

### Flow Diagram

```
User Registration → Email Verification → Company Created (status: pending)
                                              ↓
                                    Upload Documents
                                    - Business License
                                    - Tax Certificate
                                              ↓
                                    Admin Reviews
                                              ↓
                                    Company Verified (status: active)
                                              ↓
                                    Get "Verified" Badge + Premium Features
```

### Architecture

```
Controller (documentController.js)
    ↓
Use Case (UploadCompanyDocumentUseCase.js)
    ↓ ↓ ↓
    Repository         UploadService         DocumentTypes
    (Company)          (Cloudinary)          (Validation)
    ↓
Database (MongoDB)
```

---

## 📋 API Endpoints

### 1. Get Documents

```http
GET /api/employers/documents
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "documents": [...],
    "verificationProgress": {
      "percentage": 50,
      "uploadedRequired": 1,
      "totalRequired": 2
    },
    "requiredDocuments": [...],
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

### 2. Upload Document

```http
POST /api/employers/documents/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Body:
  - document: [file]
  - documentType: "business-license"
  - metadata: {"documentNumber": "...", "issueDate": "...", ...}
```

### 3. Delete Document

```http
DELETE /api/employers/documents/:documentType
Authorization: Bearer <JWT_TOKEN>
```

---

## 📝 Document Types

### Required (All Companies)

1. **business-license** - Giấy phép đăng ký kinh doanh

   - Metadata: `documentNumber`, `issueDate`, `issuePlace`
   - File: PDF, JPG, PNG (max 10MB)

2. **tax-certificate** - Giấy chứng nhận đăng ký thuế
   - Metadata: `documentNumber`, `issueDate`
   - File: PDF, JPG, PNG (max 10MB)

### Optional

3. **legal-representative-id** - CMND/CCCD người đại diện
4. **business-plan** - Kế hoạch kinh doanh
5. **financial-statement** - Báo cáo tài chính

---

## 🔐 Permissions

| Action           | Required Permission                         |
| ---------------- | ------------------------------------------- |
| Upload documents | Employer authenticated                      |
| View documents   | Employer authenticated                      |
| Delete documents | `role: owner` OR `canEditCompanyInfo: true` |

---

## 🧪 Testing

### Manual Testing (Postman)

1. Import collection: `postman/Company_Document_Verification_API.postman_collection.json`
2. Set variables:
   - `base_url`: `http://localhost:5001`
   - `employer_token`: Your JWT token
3. Run requests in order

### Automated Testing (Node.js)

```bash
# Set environment variable
export EMPLOYER_TOKEN="your_jwt_token_here"

# Run test script
node scripts/test-document-upload.js
```

### Test Flow

```
1. Get initial status (should be empty)
2. Upload business license
3. Upload tax certificate
4. Get updated status (progress: 100%)
5. Upload optional document
6. Verify all documents uploaded
```

---

## 🎯 Use Cases

### Scenario 1: New Company Registration

```
1. User registers as employer
2. Verifies email
3. Company auto-created with status: "pending"
4. User uploads business license and tax certificate
5. Admin reviews documents
6. Company status → "active" + verified badge
```

### Scenario 2: Update Company Information

```
1. Company already exists (from old data)
2. User updates businessInfo via PATCH /employers/profile
3. User uploads verification documents
4. Admin verifies → company gets verified status
```

### Scenario 3: Replace Expired Document

```
1. Company already verified
2. Business license expired
3. User uploads new business license (replaces old one)
4. Admin re-verifies
5. Status maintained
```

---

## ⚠️ Important Notes

### 1. Existing Services Used

- ✅ `UnifiedUploadService` - Already exists, handles Cloudinary uploads
- ✅ `CompanyRepository` - Already exists, manages company data
- ✅ `EmployerRepository` - Already exists, manages employer profiles
- ✅ Upload middleware - Already exists in `middlewares/upload.js`

### 2. Database Schema

No schema changes needed! Uses existing `Company.verification` field:

```javascript
verification: {
  isVerified: Boolean,
  verifiedAt: Date,
  steps: {
    businessInfo: Boolean,
    documents: Boolean
  },
  documents: [{
    type: String,
    url: String,
    publicId: String,
    uploadedAt: Date,
    metadata: Object
  }]
}
```

### 3. Security

- ✅ JWT authentication required
- ✅ File type validation (PDF, JPG, PNG only)
- ✅ File size limits (10MB for documents)
- ✅ Metadata validation (required fields checked)
- ✅ Permission checks for delete operations
- ✅ Old files auto-deleted when replaced

### 4. Cloud Storage

- Files stored in Cloudinary
- Folder: `internbridge/documents`
- Auto-cleanup when deleted
- Public URLs generated for viewing

---

## 🚀 Next Steps

### For Development

1. ✅ Code is ready to use
2. ⏳ Test with real documents
3. ⏳ Implement admin verification interface
4. ⏳ Add email notifications when documents uploaded/verified

### For Production

1. ⏳ Set up proper Cloudinary credentials
2. ⏳ Configure file size limits based on hosting plan
3. ⏳ Add monitoring for upload failures
4. ⏳ Implement audit logs for document changes

### Admin Panel Features (Future)

- View all pending verifications
- Approve/reject documents with comments
- Bulk verification operations
- Document verification history
- Analytics dashboard

---

## 📊 Benefits After Verification

| Feature                | Pending | Verified |
| ---------------------- | ------- | -------- |
| Post jobs              | ✅      | ✅       |
| View applications      | ✅      | ✅       |
| Verified badge         | ❌      | ✅       |
| VIP job posts          | ❌      | ✅       |
| Unlimited team members | ❌      | ✅       |
| Advanced AI matching   | ❌      | ✅       |
| Priority in search     | ❌      | ✅       |
| Featured company page  | ❌      | ✅       |

---

## 💡 Tips

### For Frontend Developers

1. Use `verificationProgress.percentage` for progress bar
2. Show `missingRequired` documents to guide user
3. Display verified badge when `verification.isVerified = true`
4. Implement drag-and-drop file upload for better UX

### For Backend Developers

1. All validation logic is in `documentTypes.js`
2. Use cases handle all business logic
3. Controllers are thin, just handle HTTP
4. Dependencies injected via Awilix container

### For QA

1. Test with various file types (PDF, JPG, PNG, DOC - only first 3 should work)
2. Test with large files (>10MB should fail)
3. Test metadata validation (missing required fields should fail)
4. Test permissions (non-owner without canEditCompanyInfo can't delete)

---

## 🐛 Troubleshooting

### Error: "EMPLOYER_PROFILE_NOT_FOUND"

- User hasn't completed registration
- Profile was deleted
- Wrong user ID in token

### Error: "COMPANY_NOT_FOUND"

- Company wasn't auto-created during registration
- Check VerifyEmailUseCase logic

### Error: "Missing required metadata"

- Check documentType configuration in `documentTypes.js`
- Ensure all required fields provided in metadata

### Upload fails silently

- Check Cloudinary credentials
- Verify file is under 10MB
- Check file type is allowed

---

## 📞 Contact

For questions or issues with this implementation:

1. Check documentation: `src/docs/COMPANY_DOCUMENT_VERIFICATION_API.md`
2. Review Postman collection for examples
3. Run test script to verify setup

---

**Status:** ✅ Implementation Complete
**Date:** November 7, 2025
**Version:** 1.0.0
