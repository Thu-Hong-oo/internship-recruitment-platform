# 🔧 UnifiedUploadService Usage Fix

## 📋 Problem

`UnifiedUploadService.uploadFile()` was being called incorrectly throughout the codebase, causing **"No file provided for upload"** errors.

## ❌ Wrong Usage

```javascript
// WRONG - Passing parameters separately
await uploadService.uploadFile(file, 'avatar');
await uploadService.uploadFile(file, 'resume');

// WRONG - Creating new instance (it's a singleton)
const uploadService = new UnifiedUploadService();
```

## ✅ Correct Usage

```javascript
// CORRECT - Pass object with named properties
await UnifiedUploadService.uploadFile({
  file: file, // Required: File object from multer
  type: 'avatar', // Required: Upload type (avatar, resume, document, etc.)
  userId: userId, // Optional: User ID for folder organization
  metadata: {}, // Optional: Additional metadata
  customFolder: '', // Optional: Custom folder path
  publicId: '', // Optional: Custom public ID
});
```

## 📝 Files Fixed (6 files)

### 1. **candidateController.js** ✅

```javascript
// Avatar upload
const uploadResult = await UnifiedUploadService.uploadFile({
  file: req.file,
  type: 'avatar',
  userId: userId,
});
```

### 2. **UploadCVUseCase.js** ✅

```javascript
const uploadResult = await this.uploadService.uploadFile({
  file: file,
  type: 'resume',
  userId: candidateId,
});
```

### 3. **UploadAvatarUseCase.js** ✅

```javascript
const uploadResult = await this.uploadService.uploadFile({
  file: file,
  type: 'avatar',
  userId: userId,
});
```

### 4. **DocumentService.js** ✅

```javascript
const uploadResult = await UnifiedUploadService.uploadFile({
  file: file,
  type: 'document',
  userId: userId,
  metadata: { documentType, ...metadata },
});
```

### 5. **ResumeParserService.js** ✅

```javascript
const uploadResult = await UnifiedUploadService.uploadFile({
  file: {
    buffer: fileBuffer,
    originalname: filename,
    mimetype: 'application/pdf',
  },
  type: 'resume',
});
```

### 6. **ResumeGeneratorService.js** ✅

```javascript
const uploadResult = await UnifiedUploadService.uploadFile({
  file: {
    buffer: Buffer.from(html, 'utf8'),
    originalname: fileName,
    mimetype: 'text/html',
  },
  type: 'document',
});
```

## 🎯 Key Points

1. **UnifiedUploadService is a Singleton**

   - Exported as instance: `module.exports = new UnifiedUploadService();`
   - Don't use `new UnifiedUploadService()`
   - Use directly: `UnifiedUploadService.uploadFile(...)`

2. **uploadFile() Signature**

   ```javascript
   async uploadFile({ file, type, userId, customFolder, publicId, metadata })
   ```

   - Takes a **single object parameter**
   - `file` and `type` are **required**
   - Other parameters are optional

3. **Supported Upload Types**
   - `avatar` - User avatars (400x400, 5MB max)
   - `logo` - Company logos (800x400, 5MB max)
   - `cover` - Cover images (1200x600, 10MB max)
   - `resume` - CV/Resume files (PDF, DOC, DOCX, 10MB max)
   - `document` - General documents (10MB max)
   - `employer_document` - Employer-specific documents

## ✅ Result

All file upload endpoints now work correctly:

- ✅ POST `/api/candidates/avatar` - Upload avatar
- ✅ POST `/api/candidates/cv` - Upload CV/Resume
- ✅ Employer document uploads
- ✅ Resume parser service
- ✅ Resume generator service

---

**Fixed Date:** November 5, 2025  
**Issue:** "No file provided for upload" error  
**Root Cause:** Incorrect parameter passing to UnifiedUploadService.uploadFile()  
**Files Modified:** 6 files across controllers, use cases, and services
