# File Upload Service Consolidation

## Overview

Đã tối ưu hóa và hợp nhất tất cả các upload services thành một **UnifiedUploadService** duy nhất để:

- ✅ Loại bỏ code trùng lặp
- ✅ Thống nhất logic validation và error handling
- ✅ Centralized configuration management
- ✅ Improved maintainability

## Deprecated Files (KHÔNG SỬ DỤNG NỮA)

```
❌ src/services/documentUploadService.js
❌ src/services/documentService.js
❌ src/services/imageUploadService.js
❌ src/services/fileUploadService.js
```

## New Unified Service

```
✅ src/services/unifiedUploadService.js - SINGLE upload service for all needs
```

## Supported Upload Types

### 1. **Avatar Images**

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'avatar',
  userId: req.user.id,
});
```

- **Formats**: jpg, jpeg, png, webp
- **Size limit**: 5MB
- **Auto transformation**: 400x400px, face-centered crop

### 2. **Company Logos**

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'logo',
  userId: req.user.id,
});
```

- **Formats**: jpg, jpeg, png, webp, svg
- **Size limit**: 5MB
- **Auto transformation**: 800x400px max, preserve aspect ratio

### 3. **Cover Images**

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'cover',
  userId: req.user.id,
});
```

- **Formats**: jpg, jpeg, png, webp
- **Size limit**: 10MB
- **Auto transformation**: 1200x600px, center crop

### 4. **Resume Files**

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'resume',
  userId: req.user.id,
  publicId: `resume_${userId}_${Date.now()}`,
});
```

- **Formats**: pdf, doc, docx, jpg, jpeg, png
- **Size limit**: 10MB
- **Folder**: `internbridge/resumes/{userId}`

### 5. **General Documents**

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'document',
  userId: req.user.id,
});
```

- **Formats**: pdf, doc, docx, ppt, pptx, xls, xlsx, jpg, jpeg, png
- **Size limit**: 20MB
- **Folder**: `internbridge/documents/{userId}`

### 6. **Employer Documents** (Business licenses, etc.)

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'employer_document',
  userId: req.user.id,
  metadata: { documentType: 'business-license' },
});
```

- **Formats**: pdf, jpg, jpeg, png, gif, webp
- **Size limit**: 20MB
- **Folder**: `internbridge/employers/documents/{userId}`

### 7. **Videos**

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'video',
  userId: req.user.id,
});
```

- **Formats**: mp4, mov, avi, mkv, webm
- **Size limit**: 50MB

### 8. **Audio Files**

```javascript
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'audio',
  userId: req.user.id,
});
```

- **Formats**: mp3, wav, ogg, aac
- **Size limit**: 20MB

## Usage Examples

### Basic Upload

```javascript
const uploadService = require('../services/unifiedUploadService');

// Upload avatar
const result = await uploadService.uploadFile({
  file: req.file, // Multer file object
  type: 'avatar', // Upload type
  userId: req.user.id, // User ID for folder structure
});

console.log(result);
/*
{
  success: true,
  publicId: "internbridge/avatars/123/avatar_1234567890",
  url: "https://res.cloudinary.com/...",
  originalName: "profile.jpg",
  size: 102400,
  mimeType: "image/jpeg",
  format: "jpg",
  width: 400,
  height: 400,
  uploadedAt: "2025-10-02T11:30:00.000Z"
}
*/
```

### Custom Configuration

```javascript
// Upload with custom folder
const result = await uploadService.uploadFile({
  file: req.file,
  type: 'document',
  customFolder: 'special/folder/path',
  publicId: 'custom_filename',
  metadata: { purpose: 'contract', version: 1 },
});
```

### Delete Files

```javascript
// Delete file
await uploadService.deleteFile(publicId);

// Delete with specific resource type
await uploadService.deleteFile(publicId, 'video');
```

### Get File Metadata

```javascript
const metadata = await uploadService.getFileMetadata(publicId);
console.log(metadata.metadata);
/*
{
  publicId: "internbridge/documents/123/file_1234567890",
  url: "https://res.cloudinary.com/...",
  format: "pdf",
  size: 2048000,
  width: null,
  height: null,
  createdAt: "2025-10-02T11:30:00.000Z",
  resourceType: "raw"
}
*/
```

## Error Handling

```javascript
try {
  const result = await uploadService.uploadFile({
    file: req.file,
    type: 'avatar',
    userId: req.user.id,
  });
} catch (error) {
  // Automatic validation errors:
  // - "File validation failed: Invalid file type. Allowed formats: jpg, jpeg, png, webp"
  // - "File validation failed: File too large. Maximum size: 5.0MB"
  // - "No file provided for upload"
  // - "Unsupported upload type: unknown_type"

  console.error('Upload failed:', error.message);
}
```

## Migration Guide

### For Existing Code:

1. **Replace imports**:

   ```javascript
   // OLD
   const { uploadFile, deleteFile } = require('../services/fileUploadService');
   const {
     uploadImage,
     deleteImage,
   } = require('../services/imageUploadService');

   // NEW
   const uploadService = require('../services/unifiedUploadService');
   ```

2. **Update upload calls**:

   ```javascript
   // OLD
   const result = await uploadFile('image', req.file.buffer, {
     folder: 'avatars',
   });

   // NEW
   const result = await uploadService.uploadFile({
     file: req.file,
     type: 'avatar',
     userId: req.user.id,
   });
   ```

3. **Update delete calls**:

   ```javascript
   // OLD
   await deleteFile(publicId, 'image');

   // NEW
   await uploadService.deleteFile(publicId);
   ```

## Benefits of Unified Service

### ✅ **Consistency**

- Cùng một interface cho tất cả upload types
- Consistent error messages và validation
- Unified response format

### ✅ **Maintainability**

- Single source of truth cho upload logic
- Easy to add new upload types
- Centralized configuration management

### ✅ **Performance**

- Optimized transformations per file type
- Smart file size limits based on type
- Automatic format validation

### ✅ **Developer Experience**

- Clear, type-safe API
- Comprehensive error messages
- Built-in logging và monitoring

## Adding New Upload Types

```javascript
// In unifiedUploadService.js, add to configs object:
this.configs.new_type = {
  folder: 'internbridge/new_folder',
  resource_type: 'auto',
  allowed_formats: ['pdf', 'jpg'],
  max_size: 5 * 1024 * 1024, // 5MB
  transformation: [{ quality: 85 }],
};
```

Bây giờ tất cả upload operations được thống nhất và tối ưu hóa thông qua một service duy nhất!
