# ✅ Pre-Test Checklist - Document Verification Feature

## 🎯 Purpose

This checklist ensures all components are ready before testing the document verification feature.

---

## ✅ 1. Code Quality & Syntax

| Check                          | Status  | Notes                    |
| ------------------------------ | ------- | ------------------------ |
| No syntax errors in Use Cases  | ✅ PASS | All 3 use cases clean    |
| No syntax errors in Controller | ✅ PASS | documentController clean |
| No syntax errors in Routes     | ✅ PASS | employer.js clean        |
| No syntax errors in Container  | ✅ PASS | DI container clean       |
| All modules loadable           | ✅ PASS | No require() errors      |

---

## ✅ 2. Dependencies & Services

| Component                | Status  | Method Checks                           |
| ------------------------ | ------- | --------------------------------------- |
| **CompanyRepository**    | ✅ PASS | ✅ findById(), ✅ update(), ✅ create() |
| **EmployerRepository**   | ✅ PASS | ✅ findByUserId(), ✅ findById()        |
| **UnifiedUploadService** | ✅ PASS | ✅ uploadFile(), ✅ deleteFile()        |
| **documentTypes config** | ✅ PASS | ✅ All validation functions             |

---

## ✅ 3. Use Cases Implementation

| Use Case                         | Status  | Constructor Params                                 |
| -------------------------------- | ------- | -------------------------------------------------- |
| **UploadCompanyDocumentUseCase** | ✅ PASS | employerRepo, companyRepo, uploadService, userRepo |
| **GetCompanyDocumentsUseCase**   | ✅ PASS | employerRepo, companyRepo                          |
| **DeleteCompanyDocumentUseCase** | ✅ PASS | employerRepo, companyRepo, uploadService           |

---

## ✅ 4. DI Container Registration

| Registration                 | Status  | Injection Mode                |
| ---------------------------- | ------- | ----------------------------- |
| uploadCompanyDocumentUseCase | ✅ PASS | CLASSIC                       |
| getCompanyDocumentsUseCase   | ✅ PASS | CLASSIC                       |
| deleteCompanyDocumentUseCase | ✅ PASS | CLASSIC                       |
| uploadService                | ✅ PASS | asValue(UnifiedUploadService) |

---

## ✅ 5. Routes Configuration

| Route                                    | Method | Handler                   | Status  |
| ---------------------------------------- | ------ | ------------------------- | ------- |
| `/api/employers/documents`               | GET    | getDocuments              | ✅ PASS |
| `/api/employers/documents/upload`        | POST   | uploadDocument            | ✅ PASS |
| `/api/employers/documents/:documentType` | DELETE | deleteDocument            | ✅ PASS |
| Middleware: uploadMiddleware             | -      | multer single('document') | ✅ PASS |

---

## ✅ 6. Document Types Configuration

| Document Type           | Required | Metadata Fields                       | Status  |
| ----------------------- | -------- | ------------------------------------- | ------- |
| business-license        | ✅ YES   | documentNumber, issueDate, issuePlace | ✅ PASS |
| tax-certificate         | ✅ YES   | documentNumber, issueDate             | ✅ PASS |
| legal-representative-id | ❌ NO    | documentNumber, issueDate, issuePlace | ✅ PASS |

---

## ✅ 7. Validation Functions

| Function                   | Test                            | Status  |
| -------------------------- | ------------------------------- | ------- |
| validateDocumentType()     | business-license for technology | ✅ PASS |
| validateDocumentType()     | tax-certificate for technology  | ✅ PASS |
| validateDocumentMetadata() | Valid metadata                  | ✅ PASS |
| getVerificationProgress()  | Calculate percentage            | ✅ PASS |

---

## ⚠️ 8. Environment Configuration

| Variable              | Required For                 | Status        |
| --------------------- | ---------------------------- | ------------- |
| CLOUDINARY_CLOUD_NAME | File upload                  | ⚠️ CHECK .env |
| CLOUDINARY_API_KEY    | File upload                  | ⚠️ CHECK .env |
| CLOUDINARY_API_SECRET | File upload                  | ⚠️ CHECK .env |
| MONGO_URI             | Database                     | ⚠️ CHECK .env |
| JWT_SECRET            | Auth (if testing with token) | ⚠️ CHECK .env |

**Note**: These warnings are expected if `.env` not loaded in check script.

---

## ✅ 9. File Structure Verification

```
✅ src/application/profile/use-cases/
   ✅ UploadCompanyDocumentUseCase.js
   ✅ GetCompanyDocumentsUseCase.js
   ✅ DeleteCompanyDocumentUseCase.js

✅ src/presentation/controllers/
   ✅ documentController.js

✅ src/presentation/routes/
   ✅ employer.js (updated)

✅ src/infrastructure/config/
   ✅ container.js (updated)
   ✅ documentTypes.js (existing)

✅ src/infrastructure/repositories/
   ✅ CompanyRepository.js
   ✅ EmployerRepository.js

✅ src/infrastructure/services/external/core/
   ✅ UnifiedUploadService.js

✅ src/presentation/middlewares/
   ✅ upload.js

✅ docs/
   ✅ COMPANY_DOCUMENT_VERIFICATION_API.md
   ✅ ACTIVE_API_ENDPOINTS.md (updated)

✅ postman/
   ✅ Company_Document_Verification_API.postman_collection.json

✅ scripts/
   ✅ test-document-upload.js
   ✅ pre-flight-check.js
```

---

## ✅ 10. Testing Prerequisites

| Prerequisite          | Status  | Command/Action               |
| --------------------- | ------- | ---------------------------- |
| Server can start      | ⏳ TODO | `npm start`                  |
| MongoDB connected     | ⏳ TODO | Check logs on startup        |
| Cloudinary configured | ⏳ TODO | Check .env file              |
| Employer user exists  | ⏳ TODO | Register or use existing     |
| JWT token obtained    | ⏳ TODO | Login to get token           |
| Test PDF files ready  | ⏳ TODO | Create test-files/ directory |

---

## 🚀 Ready to Test!

### Pre-Flight Check Result

```
✅ Passed: 38 checks
❌ Failed: 0 checks
⚠️  Warnings: 4 checks (environment variables - expected)
```

### Next Steps

1. **Start Server**

   ```bash
   npm start
   # Should see: "Server running on port 5001"
   # Should see: "MongoDB connected"
   ```

2. **Get Employer Token**

   ```bash
   # Option A: Register new employer
   POST http://localhost:5001/api/auth/register
   {
     "email": "test-employer@company.com",
     "password": "Test123!@#",
     "fullName": "Test Employer",
     "role": "employer"
   }

   # Verify email
   POST http://localhost:5001/api/auth/verify-email
   {
     "email": "test-employer@company.com",
     "otp": "<OTP_FROM_EMAIL>"
   }

   # Option B: Login existing employer
   POST http://localhost:5001/api/auth/login
   {
     "email": "existing@company.com",
     "password": "password"
   }
   ```

3. **Run Automated Test**

   ```bash
   export EMPLOYER_TOKEN="<your_jwt_token>"
   node scripts/test-document-upload.js
   ```

4. **Or Manual Test with Postman**
   - Import: `postman/Company_Document_Verification_API.postman_collection.json`
   - Set variable: `employer_token`
   - Run requests in order

---

## 🎯 Expected Test Flow

```
1. GET /api/employers/documents
   ✅ Status: 200
   ✅ Response: { documents: [], verificationProgress: { percentage: 0 } }

2. POST /api/employers/documents/upload (business-license)
   ✅ Status: 200
   ✅ Response: { success: true, verificationProgress: { percentage: 50 } }

3. POST /api/employers/documents/upload (tax-certificate)
   ✅ Status: 200
   ✅ Response: { success: true, verificationProgress: { percentage: 100 } }

4. GET /api/employers/documents
   ✅ Status: 200
   ✅ Response: { documents: [2 items], verificationProgress: { percentage: 100 } }

5. DELETE /api/employers/documents/business-license
   ✅ Status: 200
   ✅ Response: { success: true, verificationProgress: { percentage: 50 } }
```

---

## 🐛 Common Issues & Solutions

### Issue: "EMPLOYER_PROFILE_NOT_FOUND"

**Solution**: User hasn't verified email or profile wasn't auto-created

- Check VerifyEmailUseCase creates employer profile
- Or create profile via PATCH /api/employers/profile

### Issue: "COMPANY_NOT_FOUND"

**Solution**: Company wasn't created during registration

- Check Company.owner field matches user.\_id
- Company should be auto-created on email verification

### Issue: Upload fails silently

**Solution**: Check Cloudinary credentials

- Verify CLOUDINARY\_\* environment variables
- Test Cloudinary connection separately

### Issue: "Missing required metadata"

**Solution**: Check metadata fields

- business-license needs: documentNumber, issueDate, issuePlace
- tax-certificate needs: documentNumber, issueDate

### Issue: File size too large

**Solution**: Check file size limits

- Max 10MB for documents
- Use compressed PDF files for testing

---

## ✅ Final Checklist

- [ ] All code syntax checks passed ✅
- [ ] All dependencies verified ✅
- [ ] All use cases implemented ✅
- [ ] DI container configured ✅
- [ ] Routes registered ✅
- [ ] Document types configured ✅
- [ ] Validation functions tested ✅
- [ ] File structure verified ✅
- [ ] Documentation complete ✅
- [ ] Pre-flight check passed ✅
- [ ] Environment variables checked ⚠️
- [ ] Server starts successfully ⏳
- [ ] Test token obtained ⏳
- [ ] End-to-end test passed ⏳

---

**Status**: 🟢 **READY FOR TESTING**

**Date**: November 7, 2025

**Next Action**: Start server and run tests!
