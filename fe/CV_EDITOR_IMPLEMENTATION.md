# ✅ CV Editor với PDF Viewer & Annotations - Implementation

## 🎯 Tổng Quan

Đã triển khai CV Editor với:
- ✅ PDF Viewer sử dụng PDF.js (giữ nguyên layout, màu sắc)
- ✅ Annotation system để highlight suggestions
- ✅ Editable overlay cho user edit trực tiếp
- ✅ Tích hợp với CV improvement API
- ✅ Backend endpoint để detect box coordinates (Gemini Vision)

---

## 📁 Files Đã Tạo/Cập Nhật

### Frontend

1. **`fe/components/cv/PDFViewerWithAnnotations.tsx`** (NEW)
   - PDF viewer với react-pdf
   - Annotation overlay system
   - Editable text fields
   - Zoom, pagination controls
   - Save & Export buttons

2. **`fe/app/cv-edit/page.tsx`** (NEW)
   - Page để edit CV với suggestions
   - Tích hợp với CV improvement API
   - Load CV và auto-analyze

3. **`fe/app/my-cv/page.tsx`** (UPDATED)
   - Thêm button "Chỉnh sửa với gợi ý"
   - Navigate đến `/cv-edit?cvId=current`

### Backend

4. **`backend/src/controllers/aiController.js`** (UPDATED)
   - `detectCVImprovementCoordinates` method
   - Sử dụng Gemini Vision API để detect box positions
   - Fallback to mock coordinates nếu Gemini không available

5. **`backend/src/routes/ai.js`** (UPDATED)
   - Route: `POST /api/ai/cv-improvements/coordinates`

---

## 🔧 Dependencies

### Đã cài đặt:
```json
{
  "pdfjs-dist": "3.11.174",
  "react-pdf": "7.7.3"
}
```

### Cần cài đặt thêm (backend):
```bash
npm install canvas
```

---

## 🎨 Features

### 1. PDF Viewer
- Render PDF giữ nguyên layout, màu sắc, font
- Zoom in/out (50% - 300%)
- Pagination (prev/next)
- Text layer & annotation layer support

### 2. Annotation System
- Highlight boxes với màu sắc theo severity:
  - **High**: Red border
  - **Medium**: Amber border
  - **Low**: Blue border
- Hiển thị:
  - Issue
  - Original text
  - Suggestion
  - Evidence
  - Priority badge

### 3. Editable Overlay
- Click "Edit" button → Textarea xuất hiện
- User có thể chỉnh sửa text
- Save/Cancel buttons
- Edited text được highlight màu xanh

### 4. Suggestions Sidebar
- List tất cả suggestions cho page hiện tại
- Click để scroll đến annotation
- Badge màu theo severity

### 5. Save & Export
- **Save**: Lưu annotations vào backend
- **Export**: Xuất PDF mới với changes

---

## 📡 API Integration

### 1. Get CV Improvements
```typescript
POST /api/ai/cv-improvements
{
  "cvText": "...",
  "cvData": {...},
  "cvId": "...",
  "targetJobId": "..."
}
```

### 2. Detect Box Coordinates (NEW)
```typescript
POST /api/ai/cv-improvements/coordinates
{
  "pdfUrl": "https://...",
  "improvements": [
    {
      "text": "...",
      "issue": "...",
      "suggestion": "..."
    }
  ]
}

Response:
{
  "success": true,
  "data": [
    {
      "index": 0,
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 50,
      "page": 1,
      "confidence": 0.9
    }
  ]
}
```

### 3. Save Annotations
```typescript
POST /candidates/me/resume/update
{
  "cvId": "...",
  "annotations": [...]
}
```

### 4. Export PDF
```typescript
POST /candidates/me/resume/export
{
  "cvId": "..."
}
```

---

## 🔄 Flow

```
1. User click "Chỉnh sửa với gợi ý"
   ↓
2. Load CV PDF
   ↓
3. Auto-analyze CV improvements
   ↓
4. Get suggestions với coordinates
   - Try Gemini Vision API
   - Fallback to mock coordinates
   ↓
5. Render PDF với annotations
   ↓
6. User edit text trong annotations
   ↓
7. Save annotations → Backend
   ↓
8. Export PDF mới → Download
```

---

## 🎯 Usage

### Navigate to CV Editor:
```tsx
router.push(`/cv-edit?cvId=current`);
router.push(`/cv-edit?cvId=${cvId}&targetJobId=${jobId}`);
```

### Component Usage:
```tsx
<PDFViewerWithAnnotations
  pdfUrl={pdfUrl}
  suggestions={suggestions}
  onSave={handleSave}
  onExport={handleExport}
  targetJobId={targetJobId}
/>
```

---

## ⚠️ Limitations & Next Steps

### Current Limitations:
1. **Mock Coordinates**: Hiện tại dùng mock coordinates nếu Gemini Vision không available
2. **PDF Export**: Chưa implement export PDF với edited text (cần pdf-lib.js)
3. **Multi-page**: Annotations chỉ hiển thị trên page 1 (cần support multi-page)

### Next Steps:
1. **Backend**: Implement PDF export với pdf-lib.js
2. **Gemini Vision**: Improve coordinate detection accuracy
3. **Multi-page**: Support annotations trên nhiều pages
4. **Text Replacement**: Thực sự replace text trong PDF (không chỉ overlay)

---

## 🚀 Testing

### Test Cases:
1. ✅ Load CV PDF
2. ✅ Display annotations với suggestions
3. ✅ Edit text trong annotation
4. ✅ Save annotations
5. ⏳ Export PDF (pending backend implementation)

---

**Date**: 2025-12-07  
**Status**: ✅ Core Implementation Complete  
**Key Point**: PDF viewer với annotations, editable overlay, tích hợp CV improvement API

