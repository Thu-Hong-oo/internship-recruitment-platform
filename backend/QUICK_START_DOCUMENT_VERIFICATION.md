# 🚀 Quick Start - Company Document Verification

## ⚡ TL;DR

Upload business documents (giấy phép kinh doanh, giấy thuế) để verify công ty.

---

## 📝 Step-by-Step Guide

### 1️⃣ Đăng ký và đăng nhập (nếu chưa có)

```bash
POST /api/auth/register
{
  "email": "employer@company.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "role": "employer"
}

POST /api/auth/verify-email
{
  "email": "employer@company.com",
  "otp": "ABC123"
}

# Lấy JWT token từ response
```

### 2️⃣ Kiểm tra trạng thái hiện tại

```bash
GET /api/employers/documents
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "data": {
    "documents": [],
    "verificationProgress": {
      "percentage": 0,
      "uploadedRequired": 0,
      "totalRequired": 2,
      "missingRequired": ["business-license", "tax-certificate"]
    }
  }
}
```

### 3️⃣ Upload Giấy phép đăng ký kinh doanh

```bash
POST /api/employers/documents/upload
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

# Form data:
document: [FILE] business-license.pdf
documentType: "business-license"
metadata: {
  "documentNumber": "0123456789",
  "issueDate": "2020-01-15",
  "issuePlace": "Sở Kế hoạch và Đầu tư TP. HCM"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tài liệu đã được upload thành công",
  "data": {
    "verificationProgress": {
      "percentage": 50,
      "uploadedRequired": 1,
      "totalRequired": 2
    }
  }
}
```

### 4️⃣ Upload Giấy chứng nhận thuế

```bash
POST /api/employers/documents/upload
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

# Form data:
document: [FILE] tax-certificate.pdf
documentType: "tax-certificate"
metadata: {
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
    "verificationProgress": {
      "percentage": 100,
      "uploadedRequired": 2,
      "totalRequired": 2,
      "missingRequired": []
    }
  }
}
```

### 5️⃣ Kiểm tra lại

```bash
GET /api/employers/documents
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "data": {
    "documents": [
      {
        "type": "business-license",
        "url": "https://cloudinary.com/...",
        "uploadedAt": "2025-11-07T10:00:00Z"
      },
      {
        "type": "tax-certificate",
        "url": "https://cloudinary.com/...",
        "uploadedAt": "2025-11-07T10:05:00Z"
      }
    ],
    "verificationProgress": {
      "percentage": 100
    },
    "verification": {
      "isVerified": false, // Chờ admin review
      "steps": {
        "businessInfo": false,
        "documents": false
      }
    },
    "status": "pending"
  }
}
```

### 6️⃣ Chờ Admin verify

- Admin sẽ review documents
- Sau khi approve:
  - `verification.isVerified` = `true`
  - `status` = `active`
  - Company hiển thị badge "✓ Verified"

---

## 🧪 Test Nhanh với cURL

### Get Documents

```bash
curl -X GET http://localhost:5001/api/employers/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Upload Business License

```bash
curl -X POST http://localhost:5001/api/employers/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@business-license.pdf" \
  -F "documentType=business-license" \
  -F 'metadata={"documentNumber":"0123456789","issueDate":"2020-01-15","issuePlace":"Sở KHĐT TP.HCM"}'
```

### Upload Tax Certificate

```bash
curl -X POST http://localhost:5001/api/employers/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@tax-certificate.pdf" \
  -F "documentType=tax-certificate" \
  -F 'metadata={"documentNumber":"0123456789-001","issueDate":"2020-01-20"}'
```

### Delete Document

```bash
curl -X DELETE http://localhost:5001/api/employers/documents/business-license \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Test với Node.js Script

```bash
# Set token
export EMPLOYER_TOKEN="your_jwt_token_here"

# Run test
node scripts/test-document-upload.js
```

**Output:**

```
═══ Test 1: Get Documents & Verification Status ═══
✓ GET /documents - Success

═══ Test 2: Upload business-license ═══
✓ POST /documents/upload (business-license) - Success

═══ Test 3: Upload tax-certificate ═══
✓ POST /documents/upload (tax-certificate) - Success

═══ Test Summary ═══
✓ All tests completed successfully!

Verification Progress:
  Percentage: 100%
  Uploaded: 2/2 required documents
  Missing: None
```

---

## 📋 Checklist

- [ ] Server đang chạy (`npm start`)
- [ ] Có JWT token của employer
- [ ] Có file PDF để upload (business license, tax certificate)
- [ ] Cloudinary credentials đã config đúng
- [ ] Test GET /documents - thành công
- [ ] Test POST upload business-license - thành công
- [ ] Test POST upload tax-certificate - thành công
- [ ] Test GET /documents - progress = 100%

---

## ❌ Common Errors

### "Vui lòng chọn file để upload"

→ Chưa chọn file trong form-data

### "Loại tài liệu không hợp lệ"

→ documentType sai, check lại: `business-license`, `tax-certificate`

### "Missing required metadata: documentNumber"

→ Thiếu field bắt buộc trong metadata

### "Không tìm thấy hồ sơ nhà tuyển dụng"

→ User chưa hoàn thành registration flow

---

## 📚 More Info

- Full API docs: `src/docs/COMPANY_DOCUMENT_VERIFICATION_API.md`
- Implementation details: `DOCUMENT_VERIFICATION_IMPLEMENTATION.md`
- Postman collection: `postman/Company_Document_Verification_API.postman_collection.json`

---

## 🎯 Expected Results

### Before Upload

```json
{
  "status": "pending",
  "verification": {
    "isVerified": false,
    "steps": {
      "businessInfo": false,
      "documents": false
    }
  }
}
```

### After Upload (Chờ admin)

```json
{
  "status": "pending",
  "verification": {
    "isVerified": false,
    "steps": {
      "businessInfo": false,
      "documents": false  // Admin chưa review
    }
  },
  "documents": [...]  // 2 documents uploaded
}
```

### After Admin Verify

```json
{
  "status": "active",
  "verification": {
    "isVerified": true,
    "verifiedAt": "2025-11-07T12:00:00Z",
    "steps": {
      "businessInfo": true,
      "documents": true
    }
  }
}
```

---

**Ready to test!** 🚀
