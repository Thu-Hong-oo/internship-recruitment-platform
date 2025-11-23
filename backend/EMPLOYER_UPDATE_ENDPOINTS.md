# 📋 CÁC PHẦN CẬP NHẬT THÔNG TIN EMPLOYER

## Tổng quan: **3 PHẦN CHÍNH**

---

## 1️⃣ **THÔNG TIN CÁ NHÂN**
**Endpoints:** `/api/users/*` và `/api/employers/profile`

### 1.1. Upload Avatar
- **Method:** `POST /api/users/avatar`
- **Body:** FormData với field `avatar` (file image)
- **Max Size:** 5MB
- **Allowed Types:** JPEG, PNG, GIF, WebP
- **Cập nhật:** `User.avatar`
- **Socket Event:** `user_avatar_updated` (real-time)

### 1.2. Update FullName
- **Method:** `PUT /api/employers/profile` (với `fullName` trong body)
- **Body:** `{ "fullName": "Tên mới" }`
- **Cập nhật:** `User.fullName`
- **Notifications:** Log để theo dõi (có thể mở rộng update notifications sau)

### 1.3. Update Position (Vị trí trong công ty)
- **Method:** `PUT /api/employers/profile`
- **Body:** 
```json
{
  "position": {
    "title": "HR Manager",
    "level": "manager",
    "department": "Human Resources"
  }
}
```
- **Cập nhật:** `profile.position`

### 1.4. Update Contact (Thông tin liên hệ)
- **Method:** `PUT /api/employers/profile`
- **Body:**
```json
{
  "contact": {
    "name": "Nguyen Van A",
    "phone": "+84901234567",
    "email": "contact@company.com"
  }
}
```
- **Cập nhật:** `profile.contact`

### Example - Update tất cả thông tin cá nhân:
```json
{
  "fullName": "Nguyen Van A",
  "position": {
    "title": "HR Manager",
    "level": "manager",
    "department": "Human Resources"
  },
  "contact": {
    "name": "Nguyen Van A",
    "phone": "+84901234567",
    "email": "contact@company.com"
  }
}
```

---

## 2️⃣ **THÔNG TIN CÔNG TY**
**Endpoints:** `/api/employers/company` và `/api/employers/upload-*`

### 2.1. Update Company Info (Thông tin công ty)
- **Method:** `PUT /api/employers/company`
- **Body:** Có thể update một hoặc nhiều phần:

#### a) Company (Thông tin công ty)
```json
{
  "company": {
    "name": "VNPT Software Co., Ltd.",
    "industry": "technology",
    "size": "large",
    "email": "contact@fpt.com.vn",
    "website": "https://fpt.com.vn",
    "description": "Leading Vietnamese technology company...",
    "employeesCount": 5000,
    "foundedYear": 1999,
    "officeAddress": {
      "street": "Lot T2, Saigon Hi-Tech Park",
      "ward": "Tan Phu Ward",
      "district": "District 9",
      "city": "Ho Chi Minh City",
      "country": "Vietnam"
    }
  }
}
```

#### b) Business Info (Thông tin đăng ký kinh doanh)
```json
{
  "businessInfo": {
    "registrationNumber": "0301234567",
    "taxId": "0301234567",
    "issueDate": "1999-09-13",
    "issuePlace": "Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh",
    "address": {
      "street": "Lot T2, Saigon Hi-Tech Park",
      "ward": "Tan Phu Ward",
      "district": "District 9",
      "city": "Ho Chi Minh City",
      "country": "Vietnam"
    }
  }
}
```
**Lưu ý:** `address` tự động sync với `company.officeAddress`

#### c) Legal Representative (Người đại diện pháp luật)
```json
{
  "legalRepresentative": {
    "fullName": "Nguyen Van Khoa",
    "position": "General Director",
    "phone": "+84283730888",
    "email": "khoa.nguyen@fpt.com.vn",
    "identification": { ... }
  }
}
```

**Auto-sync:**
- Khi update `company.officeAddress` → tự động sync sang `businessInfo.address`
- Khi update `businessInfo.address` → tự động sync sang `company.officeAddress`

**Notifications:**
- Khi `company.name` thay đổi → tự động update tên công ty trong các notifications liên quan (JOB_MATCH, NEW_JOB_MATCH)

### 2.2. Upload Logo
- **Method:** `POST /api/employers/upload-logo`
- **Body:** FormData với field `logo` (file image)
- **Max Size:** 5MB
- **Allowed Types:** JPEG, PNG, GIF, WebP
- **Cập nhật:** `company.logo`

### 2.3. Upload Cover Image
- **Method:** `POST /api/employers/upload-cover-image`
- **Body:** FormData với field `coverImage` (file image)
- **Max Size:** 10MB
- **Allowed Types:** JPEG, PNG, GIF, WebP
- **Cập nhật:** `company.coverImage`

### 2.4. Remove Logo
- **Method:** `DELETE /api/employers/logo`
- **Xóa:** `company.logo`

### 2.5. Remove Cover Image
- **Method:** `DELETE /api/employers/cover-image`
- **Xóa:** `company.coverImage`

---

## 3️⃣ **TÀI LIỆU** (Giấy tờ xác thực)
**Endpoints:** `/api/employers/documents/*`

### 3.1. Upload Business License (Giấy phép kinh doanh)
- **Method:** `POST /api/employers/documents/business-license`
- **Body:** FormData với:
  - `document` (file PDF hoặc image)
  - `documentNumber` (string, optional)
  - `issueDate` (string, optional)
  - `validUntil` (string, optional)
- **Max Size:** 20MB
- **Allowed Types:** PDF, JPEG, PNG, GIF, WebP
- **Cập nhật:** `verification.documents[]` với `documentType: "business-license"`

### 3.2. Upload Tax Certificate (Giấy chứng nhận đăng ký thuế)
- **Method:** `POST /api/employers/documents/tax-certificate`
- **Body:** FormData với:
  - `document` (file PDF hoặc image)
  - `documentNumber` (string, **required**)
  - `issueDate` (string, **required**)
  - `validUntil` (string, optional)
- **Max Size:** 20MB
- **Allowed Types:** PDF, JPEG, PNG, GIF, WebP
- **Cập nhật:** `verification.documents[]` với `documentType: "tax-certificate"`

### 3.3. Remove Document (Xóa tài liệu)
- **Method:** `DELETE /api/employers/documents/:documentId`
- **Xóa:** Document khỏi `verification.documents[]`

---

## 📊 TÓM TẮT THEO COMPLETION TRACKING

Dựa trên `completion` object, các phần được track theo 3 nhóm chính:

### 1️⃣ **THÔNG TIN CÁ NHÂN** (25% weight)
- **userInfo** (10%)
  - Required: `fullName`
  - Optional: `avatar`
  - Endpoint: `POST /api/users/avatar`, `PUT /api/employers/profile` (với `fullName`)
- **position** (5%)
  - Required: `position`
  - Endpoint: `PUT /api/employers/profile`
- **contact** (10%)
  - Required: `phone`, `email`
  - Optional: `address`
  - Endpoint: `PUT /api/employers/profile`

### 2️⃣ **THÔNG TIN CÔNG TY** (60% weight)
- **company** (25%)
  - Required: `name`, `industry`
  - Optional: `description`, `website`, `logo`, `coverImage`
  - Endpoint: `PUT /api/employers/company`, `POST /api/employers/upload-logo`, `POST /api/employers/upload-cover-image`
- **businessInfo** (20%)
  - Required: `registrationNumber`, `taxId`
  - Optional: `issueDate`, `issuePlace`, `address`
  - Endpoint: `PUT /api/employers/company`
- **legalRepresentative** (15%)
  - Required: `fullName`, `position`
  - Optional: `phone`, `email`
  - Endpoint: `PUT /api/employers/company`

### 3️⃣ **TÀI LIỆU** (15% weight)
- **documents** (15%)
  - Required: `businessLicense` (verified), `taxCertificate` (verified)
  - Endpoint: `POST /api/employers/documents/business-license`, `POST /api/employers/documents/tax-certificate`

---

## 🔄 FLOW CẬP NHẬT THÔNG TIN

### Khi đăng nhập:
1. FE gọi `GET /api/employers/profile-completion`
2. Kiểm tra `completion.percentage` và `completion.priorityMissing`
3. Hiển thị form yêu cầu cập nhật các field còn thiếu theo 3 phần:
   - **Thông tin cá nhân**: fullName, avatar, position, contact
   - **Thông tin công ty**: company, businessInfo, legalRepresentative, logo, coverImage
   - **Tài liệu**: businessLicense, taxCertificate

### Khi cập nhật:
1. FE gọi endpoint tương ứng để update
2. Backend tự động:
   - Update database
   - Update notifications (nếu có thay đổi name/company name)
   - Emit socket events (nếu có)
3. FE có thể gọi lại `GET /api/employers/profile-completion` để check completion mới

---

## ✅ CHECKLIST CHO FE

### 1️⃣ Thông tin cá nhân
- [ ] Upload avatar với socket listener (`user_avatar_updated`)
- [ ] Update fullName
- [ ] Update position (title, level, department)
- [ ] Update contact (name, phone, email)

### 2️⃣ Thông tin công ty
- [ ] Update company info (name, industry, description, website, officeAddress)
- [ ] Update businessInfo (registrationNumber, taxId, issueDate, issuePlace)
- [ ] Update legalRepresentative (fullName, position, phone, email)
- [ ] Upload logo (max 5MB)
- [ ] Upload cover image (max 10MB)
- [ ] Remove logo/cover image

### 3️⃣ Tài liệu
- [ ] Upload business license (max 20MB, PDF hoặc image)
- [ ] Upload tax certificate (max 20MB, PDF hoặc image)
- [ ] Remove document

### General
- [ ] Check completion status khi đăng nhập (`GET /api/employers/profile-completion`)
- [ ] Hiển thị form yêu cầu cập nhật các field còn thiếu từ `completion.priorityMissing`
- [ ] Handle real-time updates qua socket (avatar updates)

