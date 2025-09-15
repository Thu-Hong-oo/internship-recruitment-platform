# Employer API Postman Collection - Updated Summary

## Cập nhật hoàn tất để đồng nhất với controller hiện tại

### 📋 **Các thay đổi chính đã thực hiện:**

#### 1. **Endpoint Structure** ✅

- **GET /employers/profile** - Lấy thông tin profile
- **PUT /employers/profile** - Cập nhật thông tin cá nhân (position, contact, officeAddress)
- **PUT /employers/company** - Cập nhật thông tin công ty và xác thực (company, businessInfo, legalRepresentative)

#### 2. **File Upload Endpoints** ✅

- **POST /employers/upload-logo** - Upload logo công ty (form-data với field `logo`)
- **POST /employers/upload-cover-image** - Upload ảnh bìa (form-data với field `coverImage`)
- **DELETE /employers/logo** - Xóa logo
- **DELETE /employers/cover-image** - Xóa ảnh bìa

#### 3. **Document Management** ✅ **[FIXED]**

- **GET /employers/document-types** - Lấy danh sách loại tài liệu
- **POST /employers/documents** - Upload tài liệu (**CẬP NHẬT: form-data thay vì JSON**)
  ```
  Form-data fields:
  - document: File (PDF/JPG/PNG)
  - type: Text (business-license, tax-certificate, etc.)
  - documentNumber: Text
  - issueDate: Text (YYYY-MM-DD)
  - issuePlace: Text
  - validUntil: Text (optional)
  ```
- **DELETE /employers/documents/:documentId** - Xóa tài liệu

#### 4. **Verification System** ✅

- **PUT /employers/verification/business-info** - Cập nhật thông tin doanh nghiệp
- **POST /employers/verify** - Gửi hồ sơ xác thực
- **GET /employers/verification-status** - Kiểm tra trạng thái xác thực
- **POST /employers/verify-company-email** - Xác thực email công ty (redirect to User model)
- **POST /employers/resend-verification-email** - Gửi lại email xác thực (redirect to User model)

#### 5. **Job & Application Management** ✅

- **GET /employers/jobs** - Lấy danh sách job đã đăng
- **GET /employers/applications** - Lấy danh sách ứng tuyển

#### 6. **Analytics & Dashboard** ✅

- **GET /employers/analytics** - Thống kê tổng quát
- **GET /employers/dashboard** - Dashboard stats
- **GET /employers/recommended-candidates** - Ứng viên được đề xuất (stub)

#### 7. **Preferences** ⚠️

- **PUT /employers/preferences** - Cài đặt preferences (Returns 501 - Not Implemented)

---

### 🔧 **Thay đổi quan trọng nhất:**

#### **Document Upload Endpoint**

**Trước:**

```json
{
  "documentId": "doc_business_license_001",
  "documentType": "business-license",
  "metadata": {
    "documentNumber": "0123456789",
    "issueDate": "2023-01-01"
  }
}
```

**Bây giờ:**

```
Content-Type: multipart/form-data

document: [FILE] business-license.pdf
type: business-license
documentNumber: 0123456789
issueDate: 2023-01-01
issuePlace: Sở Kế hoạch và Đầu tư TP.HCM
```

### 📁 **Files Created/Updated:**

1. `Employer API.postman_collection.json` - File gốc được cập nhật
2. `Employer API - Updated.postman_collection.json` - File mới hoàn toàn
3. `test_document_upload.md` - Hướng dẫn test document upload

### 🧪 **Testing Instructions:**

#### Document Upload Test:

1. Mở Postman
2. Select: POST `/api/employers/documents`
3. Body → form-data
4. Add fields:
   - `document` (File): Chọn PDF/image file
   - `type` (Text): "business-license"
   - `documentNumber` (Text): "0123456789"
   - `issueDate` (Text): "2023-01-01"
   - `issuePlace` (Text): "Sở Kế hoạch và Đầu tư TP.HCM"
5. Send request

#### Expected Response:

```json
{
  "success": true,
  "message": "Thêm tài liệu thành công",
  "data": {
    "type": "business-license",
    "url": "https://res.cloudinary.com/...",
    "filename": "business-license.pdf",
    "metadata": {
      "documentNumber": "0123456789",
      "issueDate": "2023-01-01",
      "issuePlace": "Sở Kế hoạch và Đầu tư TP.HCM",
      "originalName": "business-license.pdf",
      "size": 524288,
      "mimeType": "application/pdf"
    }
  }
}
```

### ✅ **Validation:**

- All endpoints match controller functions
- File upload patterns consistent across all endpoints
- Error responses properly documented
- Vietnamese validation messages included
- MST format validation: 10 digits (company), 13 digits (branch)

### 🎯 **Ready for Production:**

- Postman collection đã hoàn toàn đồng nhất với controller
- Document upload đã được fix để nhận file thay vì JSON
- Tất cả endpoints đều có response examples
- Pre-request và test scripts đã được thêm
