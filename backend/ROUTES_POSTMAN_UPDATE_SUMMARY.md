# Cập nhật Routes và Postman cho Employer API

## **Tóm tắt thay đổi:**

Đã cập nhật routes và Postman collection để phù hợp với những thay đổi trong `EmployerProfile` model và controller.

## **1. Routes Updates (`src/routes/employerProfiles.js`):**

### **✅ Thay đổi:**

- **Thêm comment** cho email verification endpoints
- **Giữ nguyên** tất cả routes hiện tại
- **Không thay đổi** cấu trúc API endpoints

### **📝 Comment được thêm:**

```javascript
// Email verification is now handled in User model
// These endpoints redirect to User model endpoints
```

## **2. Postman Collection Updates (`postman/Employer API.postman_collection.json`):**

### **✅ Cập nhật Description:**

```json
"description": "Employer endpoints under /api/employers with optimized verification system. Updated to work with new EmployerProfile model structure and documentTypes.js integration. CCCD is now optional."
```

### **✅ Cập nhật Business Info Structure:**

**Trước:**

```json
"legalAddress": {
  "street": "123 Đường ABC",
  "ward": "Phường 1",
  "district": "Quận 1",
  "city": "TP.HCM",
  "country": "Vietnam"
}
```

**Sau:**

```json
"address": {
  "street": "123 Đường ABC",
  "ward": "Phường 1",
  "district": "Quận 1",
  "city": "TP.HCM",
  "country": "Vietnam"
}
```

### **✅ Cập nhật Legal Representative Structure:**

**Trước:**

```json
"legalRepresentative": {
  "fullName": "Nguyễn Văn A",
  "position": "Giám đốc",
  "idType": "CCCD",
  "idNumber": "123456789",
  "idIssueDate": "2020-01-01",
  "idIssuePlace": "Công an TP.HCM",
  "phone": "0123456789",
  "email": "nguyenvana@company.com"
}
```

**Sau:**

```json
"legalRepresentative": {
  "fullName": "Nguyễn Văn A",
  "position": "Giám đốc",
  "phone": "0123456789",
  "email": "nguyenvana@company.com",
  "identification": {
    "type": "CCCD",
    "number": "123456789",
    "issueDate": "2020-01-01",
    "issuePlace": "Công an TP.HCM"
  }
}
```

### **✅ Cập nhật Document Structure:**

**Trước:**

```json
"documents": [
  {
    "type": "business-license",
    "url": "https://example.com/business-license.pdf",
    "filename": "business-license.pdf",
    "metadata": { ... }
  }
]
```

**Sau:**

```json
"documents": [
  {
    "documentId": "doc_business_license_001",
    "type": "business-license",
    "metadata": { ... }
  }
]
```

### **✅ Thêm Document Management Endpoints:**

1. **POST /employers/documents** - Thêm document mới
2. **DELETE /employers/documents/:documentId** - Xóa document

### **✅ Cập nhật Email Verification:**

- **Thêm response examples** cho email verification endpoints
- **Ghi chú** rằng email verification được xử lý trong User model
- **Response mẫu:**

```json
{
  "success": true,
  "message": "Email verification is handled in User model",
  "data": {
    "note": "Use User model email verification endpoints"
  }
}
```

## **3. API Endpoints Summary:**

### **✅ Profile Management:**

- `GET /employers/profile` - Lấy thông tin profile
- `PUT /employers/profile` - Cập nhật profile
- `PUT /employers/company` - Cập nhật thông tin công ty
- `POST /employers/upload-logo` - Upload logo công ty

### **✅ Verification System:**

- `GET /employers/document-types` - Lấy danh sách loại tài liệu
- `POST /employers/documents` - Thêm tài liệu mới
- `DELETE /employers/documents/:documentId` - Xóa tài liệu
- `PUT /employers/verification/business-info` - Cập nhật thông tin doanh nghiệp
- `POST /employers/verify` - Gửi hồ sơ xác thực
- `GET /employers/verification-status` - Kiểm tra trạng thái xác thực
- `POST /employers/verify-company-email` - Xác thực email công ty (redirected)
- `POST /employers/resend-verification-email` - Gửi lại email xác thực (redirected)

### **✅ Jobs & Applications:**

- `GET /employers/jobs` - Lấy danh sách công việc đã đăng
- `GET /employers/applications` - Lấy danh sách ứng viên
- `GET /employers/recommended-candidates` - Lấy danh sách ứng viên được đề xuất

### **✅ Analytics & Dashboard:**

- `GET /employers/analytics` - Lấy thống kê
- `GET /employers/dashboard` - Lấy dữ liệu dashboard

### **✅ Settings & Preferences:**

- `PUT /employers/preferences` - Cập nhật preferences

### **✅ Company Reviews:**

- `GET /employers/company/reviews` - Lấy đánh giá công ty
- `POST /employers/company/reviews/:reviewId/respond` - Phản hồi đánh giá

## **4. Key Changes Summary:**

### **🔄 Model Structure Changes:**

- `businessInfo` moved from `verification.businessInfo` to top level
- `legalRepresentative` moved from `verification.legalRepresentative` to top level
- `verificationSteps` renamed to `steps`
- Email verification moved to User model

### **📄 Document Management:**

- Documents now use `documentId` instead of `url`/`filename`
- CCCD is now optional (moved from required to optional)
- Better integration with `documentTypes.js`

### **📧 Email Verification:**

- Email verification endpoints redirect to User model
- Clear messaging about where to find email verification

## **5. Testing Notes:**

### **✅ Ready for Testing:**

- All endpoints updated with correct request/response formats
- Document management endpoints added
- Email verification endpoints show proper redirect messages
- Business info and legal representative structures updated

### **🔍 Test Scenarios:**

1. **Profile Management** - Create/update employer profile
2. **Document Management** - Add/remove documents with new structure
3. **Verification Flow** - Submit verification with updated data structure
4. **Email Verification** - Test redirect to User model
5. **Business Info** - Update with new address structure

## **Kết luận:**

Routes và Postman collection đã được cập nhật hoàn toàn để phù hợp với:

- ✅ **EmployerProfile model mới**
- ✅ **Controller changes**
- ✅ **DocumentTypes.js integration**
- ✅ **CCCD optional requirement**
- ✅ **Email verification redirect**

Tất cả API endpoints sẵn sàng để test và sử dụng! 🎉
