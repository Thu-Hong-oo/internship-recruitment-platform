# Test Document Upload Endpoint

## Endpoint: POST /api/employers/documents

### Changes Made:

1. **Route**: Added `upload.single('document')` middleware to handle file uploads
2. **Controller**: Completely rewritten to:
   - Accept file uploads via multipart/form-data
   - Upload files to Cloudinary
   - Store document metadata including file info
   - Clean up temporary files

### Request Format:

```
Content-Type: multipart/form-data

Fields:
- document: File (PDF, JPG, PNG)
- type: Text (business-license, tax-certificate, etc.)
- documentNumber: Text
- issueDate: Text (YYYY-MM-DD)
- issuePlace: Text
- validUntil: Text (YYYY-MM-DD) - optional
```

### Testing with Postman:

1. Set method to POST
2. Remove Content-Type header (let Postman auto-set for form-data)
3. In Body tab, select "form-data"
4. Add fields as shown in updated collection
5. For "document" field, select "File" type and choose your PDF/image

### Expected Response:

```json
{
  "success": true,
  "message": "Thêm tài liệu thành công",
  "data": {
    "type": "business-license",
    "url": "https://res.cloudinary.com/your-cloud/...",
    "filename": "original-filename.pdf",
    "metadata": {
      "documentNumber": "0123456789",
      "issueDate": "2023-01-01",
      "issuePlace": "Sở Kế hoạch và Đầu tư TP.HCM",
      "originalName": "original-filename.pdf",
      "size": 524288,
      "mimeType": "application/pdf"
    }
  }
}
```

### File Upload Process:

1. File received via multer middleware
2. Uploaded to Cloudinary with folder structure: `employers/{userId}/documents/`
3. Document added to profile with URL and metadata
4. Temporary file cleaned up
5. Response sent with file info

### Error Handling:

- Missing file: "Không có file được upload"
- Invalid document type: "Loại tài liệu không hợp lệ cho ngành nghề này"
- Missing metadata: Validation error with missing fields
- Upload failure: "Thêm tài liệu thất bại"
