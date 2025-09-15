# Cấu trúc Document cuối cùng

## **EmployerProfile Model - Documents Structure**

### **1. Schema Definition:**

```javascript
verification: {
  // ... other fields

  documents: [
    {
      documentId: { type: String, required: true }, // ID của document
      documentType: { type: String, required: true }, // Loại document (từ documentTypes.js)
      uploadedAt: { type: Date, default: Date.now }, // Thời gian upload
      verified: { type: Boolean, default: false }, // Đã được verify chưa
      verifiedBy: { type: ObjectId, ref: 'User' }, // Ai verify
      verifiedAt: Date, // Khi nào verify
      rejectionReason: String, // Lý do reject
      metadata: { type: Mixed, default: {} }, // Metadata từ documentTypes.js
    },
  ];
}
```

### **2. Methods sử dụng documents array:**

#### **A. Basic Operations:**

```javascript
// Thêm document mới hoặc cập nhật document hiện tại
profile.addDocument(documentId, documentType, metadata);

// Xóa document
profile.removeDocument(documentId);

// Kiểm tra có document không
profile.hasDocument(documentId);

// Lấy document theo ID
profile.getDocument(documentId);

// Lấy tất cả documents theo loại
profile.getDocumentsByType(documentType);
```

#### **B. Verification Operations:**

```javascript
// Verify document
profile.verifyDocument(documentId, verifiedBy);

// Reject document
profile.rejectDocument(documentId, rejectionReason, verifiedBy);
```

### **3. Integration với documentTypes.js:**

#### **A. Validation trong Controller:**

```javascript
// Validate document type theo ngành nghề
if (!validateDocumentType(documentType, profile.company.industry)) {
  return error
}

// Validate metadata theo yêu cầu
const metadataValidation = validateDocumentMetadata(documentType, metadata);
if (!metadataValidation.valid) {
  return error with missing fields
}
```

#### **B. Progress Tracking:**

```javascript
// Lấy progress từ documentTypes.js
const progress = getVerificationProgress(
  profile.verification.documents,
  industry
);
const requiredCheck = checkRequiredDocuments(
  profile.verification.documents,
  industry
);
```

### **4. API Response Structure:**

#### **GET /api/employers/document-types:**

```javascript
{
  "success": true,
  "data": {
    "industry": "technology",
    "required": [...],           // Từ documentTypes.js
    "optional": [...],           // Từ documentTypes.js
    "uploadedDocuments": [...],  // Từ profile.verification.documents
    "progress": {
      "percentage": 75,
      "uploadedRequired": 3,
      "totalRequired": 4,
      "missingRequired": ["financial-license"]
    },
    "requiredCheck": {
      "allRequiredUploaded": false,
      "missingRequired": ["financial-license"],
      "requiredCount": 4,
      "uploadedCount": 3
    }
  }
}
```

#### **POST /api/employers/documents:**

```javascript
// Request
{
  "documentId": "doc_123",
  "documentType": "business-license",
  "metadata": {
    "documentNumber": "0123456789",
    "issueDate": "2023-01-01",
    "issuePlace": "Hà Nội"
  }
}

// Response
{
  "success": true,
  "message": "Thêm tài liệu thành công",
  "data": {
    "documentId": "doc_123",
    "documentType": "business-license",
    "metadata": {...},
    "uploadedDocuments": [...]  // Full documents array
  }
}
```

### **5. Workflow hoàn chỉnh:**

1. **Frontend gọi** `GET /document-types` để lấy requirements
2. **System hiển thị** progress và missing documents
3. **User upload** file và nhập metadata
4. **Frontend gọi** `POST /documents` với validation
5. **Backend validate** document type và metadata
6. **Model lưu** document vào `verification.documents` array
7. **System cập nhật** progress và verification status
8. **Admin có thể** verify/reject từng document

### **6. Lợi ích của cấu trúc này:**

✅ **Consistent** - Schema và methods đều sử dụng `documents` array  
✅ **Rich data** - Lưu đầy đủ thông tin document và metadata  
✅ **Validation** - Tích hợp chặt chẽ với documentTypes.js  
✅ **Progress tracking** - Real-time theo dõi tiến độ  
✅ **Verification** - Hỗ trợ verify/reject từng document  
✅ **Flexible** - Dễ dàng extend và modify

## **Kết luận:**

Bây giờ `EmployerProfile` đã có cấu trúc document **nhất quán và mạnh mẽ**, tích hợp hoàn hảo với `documentTypes.js` để quản lý documents một cách hiệu quả! 🎉
