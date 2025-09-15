# Hệ Thống Xác Thực Công Ty Nâng Cao

## Tổng Quan

Hệ thống xác thực công ty đã được nâng cấp để đáp ứng các yêu cầu thực tế của việc xác minh doanh nghiệp tại Việt Nam, bao gồm validation chi tiết, xác thực email công ty, và quy trình admin review toàn diện.

## Các Tính Năng Mới

### 1. Thông Tin Chi Tiết Tài Liệu

- **Số đăng ký doanh nghiệp**: Validation format và độ dài
- **Mã số thuế**: Kiểm tra checksum cho mã số thuế 10 chữ số
- **Địa chỉ trụ sở**: Thông tin đầy đủ (đường, phường, quận, thành phố)
- **Ngày cấp, nơi cấp**: Metadata cho từng tài liệu

### 2. Thông Tin Người Đại Diện Pháp Luật

- Họ tên, chức vụ
- Loại giấy tờ (CMND/CCCD/Passport)
- Số giấy tờ, ngày cấp, nơi cấp
- Thông tin liên hệ

### 3. Xác Thực Email Công Ty

- Kiểm tra email tên miền công ty (không chấp nhận Gmail, Yahoo, Hotmail)
- Gửi mã OTP xác thực
- Thời hạn mã 15 phút
- Chức năng gửi lại mã

### 4. Quy Trình Admin Review Nâng Cao

- Review từng tài liệu riêng biệt
- Thêm ghi chú admin
- Kiểm tra tất cả bước xác thực trước khi approve
- Cross-check thông tin giữa các tài liệu

## API Endpoints Mới

### Employer Endpoints

#### `POST /api/employers/verify`

Submit hồ sơ xác thực với thông tin chi tiết

**Request Body:**

```json
{
  "businessInfo": {
    "registrationNumber": "0123456789",
    "issueDate": "2023-01-01",
    "issuePlace": "Sở Kế hoạch và Đầu tư TP.HCM",
    "taxId": "0123456789",
    "legalAddress": {
      "street": "123 Đường ABC",
      "ward": "Phường 1",
      "district": "Quận 1",
      "city": "TP.HCM",
      "country": "Vietnam"
    }
  },
  "legalRepresentative": {
    "fullName": "Nguyễn Văn A",
    "position": "Giám đốc",
    "idType": "CCCD",
    "idNumber": "123456789",
    "idIssueDate": "2020-01-01",
    "idIssuePlace": "Công an TP.HCM",
    "phone": "0123456789",
    "email": "nguyenvana@company.com"
  },
  "companyEmail": "contact@company.com",
  "documents": [
    {
      "type": "business-license",
      "url": "https://...",
      "filename": "business-license.pdf",
      "metadata": {
        "documentNumber": "0123456789",
        "issueDate": "2023-01-01",
        "issuePlace": "Sở Kế hoạch và Đầu tư TP.HCM"
      }
    }
  ]
}
```

#### `POST /api/employers/verify-company-email`

Xác thực email công ty bằng mã OTP

**Request Body:**

```json
{
  "verificationCode": "123456"
}
```

#### `POST /api/employers/resend-verification-email`

Gửi lại mã xác thực email

### Admin Endpoints

#### `GET /api/admin/verifications`

Lấy danh sách hồ sơ chờ duyệt

#### `GET /api/admin/verifications/:id`

Lấy chi tiết hồ sơ xác thực

#### `PUT /api/admin/verifications/:id`

Review và approve/reject hồ sơ

**Request Body:**

```json
{
  "action": "approve",
  "reason": "Tất cả tài liệu hợp lệ",
  "documentReviews": [
    {
      "documentId": "document_id_here",
      "verified": true,
      "rejectionReason": null
    }
  ],
  "notes": "Ghi chú của admin"
}
```

## Validation Rules

### 1. Business Info Validation

- Số đăng ký doanh nghiệp: tối thiểu 10 ký tự
- Mã số thuế: 10-13 chữ số, có checksum validation
- Địa chỉ: bắt buộc có đường và thành phố

### 2. Legal Representative Validation

- Họ tên: tối thiểu 2 ký tự
- Số CMND/CCCD: 9-12 chữ số
- Loại giấy tờ: CMND, CCCD, hoặc Passport

### 3. Company Email Validation

- Format email hợp lệ
- Không phải domain cá nhân (Gmail, Yahoo, Hotmail, etc.)

### 4. Document Metadata Validation

- Số tài liệu: tối thiểu 5 ký tự
- Ngày cấp: bắt buộc
- Nơi cấp: tối thiểu 2 ký tự

## Verification Steps

Hệ thống theo dõi 6 bước xác thực:

1. **documentsUploaded**: Đã upload tài liệu
2. **businessInfoValidated**: Đã điền thông tin công ty
3. **legalRepresentativeVerified**: Đã điền thông tin người đại diện
4. **companyEmailVerified**: Đã xác thực email công ty
5. **crossCheckCompleted**: Đã đối chiếu thông tin
6. **adminReviewed**: Admin đã review

## Database Schema Updates

### EmployerProfile.verification

```javascript
{
  isVerified: Boolean,
  verifiedAt: Date,
  verifiedBy: ObjectId,
  rejectionReason: String,

  businessInfo: {
    registrationNumber: String,
    issueDate: Date,
    issuePlace: String,
    taxId: String,
    legalAddress: {
      street: String,
      ward: String,
      district: String,
      city: String,
      country: String
    }
  },

  legalRepresentative: {
    fullName: String,
    position: String,
    idType: String,
    idNumber: String,
    idIssueDate: Date,
    idIssuePlace: String,
    phone: String,
    email: String
  },

  companyEmail: {
    email: String,
    verified: Boolean,
    verificationCode: String,
    verifiedAt: Date
  },

  documents: [{
    type: String,
    url: String,
    filename: String,
    uploadedAt: Date,
    verified: Boolean,
    verifiedBy: ObjectId,
    verifiedAt: Date,
    rejectionReason: String,
    metadata: {
      documentNumber: String,
      issueDate: Date,
      issuePlace: String,
      expiryDate: Date,
      extractedText: String
    }
  }],

  verificationSteps: {
    documentsUploaded: Boolean,
    businessInfoValidated: Boolean,
    legalRepresentativeVerified: Boolean,
    companyEmailVerified: Boolean,
    crossCheckCompleted: Boolean,
    adminReviewed: Boolean
  },

  adminNotes: [{
    note: String,
    addedBy: ObjectId,
    addedAt: Date
  }]
}
```

## Security Features

1. **Input Sanitization**: Tất cả input được sanitize trước khi lưu
2. **Validation**: Validation chi tiết cho từng trường
3. **Rate Limiting**: Giới hạn số lần gửi email xác thực
4. **Audit Trail**: Log đầy đủ các hoạt động xác thực
5. **Admin Notes**: Ghi chú admin cho mỗi hồ sơ

## Error Handling

Hệ thống có error handling toàn diện với:

- Validation errors chi tiết
- Logging đầy đủ
- Response messages rõ ràng
- Graceful fallback

## Future Enhancements

1. **OCR Integration**: Tự động trích xuất text từ tài liệu
2. **Government API Integration**: Đối chiếu với cơ sở dữ liệu nhà nước
3. **Document Analysis**: Phân tích tự động tài liệu
4. **Notification System**: Thông báo real-time cho admin
5. **Bulk Verification**: Xử lý hàng loạt hồ sơ
