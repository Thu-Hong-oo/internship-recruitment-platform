# PDF Preview Feature - CV Builder

## 🎯 **Tính năng Preview PDF**

Bây giờ bạn có thể xem CV đã upload dưới dạng PDF giống như cách xem CV được tạo bằng AI! Hệ thống hỗ trợ preview PDF với embedded viewer chuyên nghiệp.

## 🚀 **API Endpoints**

### 1. **Preview PDF CV Info**

```http
GET /api/candidates/me/cv-builder/preview-pdf/:cvId
```

**Response:**

```json
{
  "success": true,
  "message": "PDF CV preview retrieved successfully",
  "data": {
    "cv": {
      "id": "68e3478f37d338155fca7b40",
      "url": "https://res.cloudinary.com/du10thaqs/raw/upload/v1759726000/internbridge/documents/CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "filename": "CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "displayName": "PDF - Nguyễn Thị Thu Hậu - Senior Full Stack Developer",
      "format": "pdf",
      "size": 245760,
      "uploadedAt": "2025-10-06T04:40:00.000Z",
      "template": "modern",
      "targetJob": "Senior Full Stack Developer",
      "aiGenerated": false,
      "pdfOptions": {
        "format": "A4",
        "printBackground": true,
        "margin": {
          "top": "15mm",
          "right": "15mm",
          "bottom": "15mm",
          "left": "15mm"
        }
      }
    },
    "previewType": "pdf",
    "message": "PDF CV preview data retrieved successfully"
  }
}
```

### 2. **PDF Viewer với Embedded Viewer**

```http
GET /api/candidates/me/cv-builder/pdf-viewer/:cvId
```

**Response:**

```json
{
  "success": true,
  "message": "PDF viewer generated successfully",
  "data": {
    "viewerHTML": "<!DOCTYPE html>...",
    "pdfInfo": {
      "id": "68e3478f37d338155fca7b40",
      "url": "https://res.cloudinary.com/du10thaqs/raw/upload/v1759726000/internbridge/documents/CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "filename": "CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "displayName": "PDF - Nguyễn Thị Thu Hậu - Senior Full Stack Developer",
      "format": "pdf",
      "size": 245760,
      "uploadedAt": "2025-10-06T04:40:00.000Z",
      "template": "modern",
      "targetJob": "Senior Full Stack Developer"
    },
    "message": "PDF viewer generated successfully"
  }
}
```

## 🎨 **PDF Viewer Features**

### ✅ **Professional PDF Viewer**

- **Embedded iframe** với PDF toolbar
- **Full-screen viewing** với responsive design
- **Loading states** và error handling
- **File information** overlay

### ✅ **Interactive Controls**

- **📥 Download PDF** - Tải xuống file PDF
- **🔗 Open in New Tab** - Mở PDF trong tab mới
- **🔄 Retry** - Thử lại khi có lỗi
- **📊 File Info** - Hiển thị thông tin file

### ✅ **Responsive Design**

- **Mobile-friendly** với responsive layout
- **Touch controls** cho mobile devices
- **Adaptive sizing** cho các screen sizes

### ✅ **Error Handling**

- **Loading spinner** khi đang tải PDF
- **Error messages** khi không tải được
- **Retry mechanism** để thử lại
- **Timeout handling** sau 5 giây

## 🔧 **Usage Examples**

### **JavaScript/Frontend**

```javascript
// Preview PDF CV
const previewPDF = async cvId => {
  try {
    const response = await fetch(
      `/api/candidates/me/cv-builder/preview-pdf/${cvId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log('PDF CV Info:', result.data.cv);

      // Show PDF info
      displayPDFInfo(result.data.cv);

      // Open PDF viewer
      openPDFViewer(cvId);
    }
  } catch (error) {
    console.error('PDF preview failed:', error);
  }
};

// Open PDF Viewer
const openPDFViewer = cvId => {
  // Method 1: Open in new window
  window.open(`/api/candidates/me/cv-builder/pdf-viewer/${cvId}`, '_blank');

  // Method 2: Embed in iframe
  const iframe = document.createElement('iframe');
  iframe.src = `/api/candidates/me/cv-builder/pdf-viewer/${cvId}`;
  iframe.style.width = '100%';
  iframe.style.height = '600px';
  iframe.style.border = 'none';

  document.getElementById('pdf-container').appendChild(iframe);
};

// Get PDF Viewer HTML
const getPDFViewerHTML = async cvId => {
  try {
    const response = await fetch(
      `/api/candidates/me/cv-builder/pdf-viewer/${cvId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (result.success) {
      // Inject HTML into page
      document.getElementById('pdf-viewer').innerHTML = result.data.viewerHTML;
    }
  } catch (error) {
    console.error('PDF viewer failed:', error);
  }
};
```

### **React Component Example**

```jsx
import React, { useState, useEffect } from 'react';

const PDFPreview = ({ cvId }) => {
  const [pdfInfo, setPdfInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPDFInfo();
  }, [cvId]);

  const fetchPDFInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/candidates/me/cv-builder/preview-pdf/${cvId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setPdfInfo(result.data.cv);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load PDF info');
    } finally {
      setIsLoading(false);
    }
  };

  const openPDFViewer = () => {
    window.open(`/api/candidates/me/cv-builder/pdf-viewer/${cvId}`, '_blank');
  };

  const downloadPDF = () => {
    if (pdfInfo) {
      const link = document.createElement('a');
      link.href = pdfInfo.url;
      link.download = pdfInfo.filename;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-8">
        <h3>❌ Error</h3>
        <p>{error}</p>
        <button
          onClick={fetchPDFInfo}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!pdfInfo) {
    return (
      <div className="text-gray-500 text-center p-8">
        <p>No PDF found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            📄 {pdfInfo.displayName}
          </h3>
          <p className="text-gray-600 text-sm">
            {pdfInfo.filename} • {formatFileSize(pdfInfo.size)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openPDFViewer}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            👁️ Preview
          </button>
          <button
            onClick={downloadPDF}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            📥 Download
          </button>
        </div>
      </div>

      {/* PDF Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold">Format:</span>{' '}
          {pdfInfo.format.toUpperCase()}
        </div>
        <div>
          <span className="font-semibold">Size:</span>{' '}
          {formatFileSize(pdfInfo.size)}
        </div>
        <div>
          <span className="font-semibold">Created:</span>{' '}
          {new Date(pdfInfo.uploadedAt).toLocaleDateString()}
        </div>
        <div>
          <span className="font-semibold">Template:</span>{' '}
          {pdfInfo.template || 'N/A'}
        </div>
      </div>

      {/* Embedded PDF Preview */}
      <div className="mt-6">
        <iframe
          src={`${pdfInfo.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          width="100%"
          height="600"
          className="border rounded-lg"
          title="PDF Preview"
        />
      </div>
    </div>
  );
};

// Helper function
const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default PDFPreview;
```

## 🎯 **Workflow**

1. **Upload PDF** → CV được upload và lưu vào database
2. **Preview Request** → Gọi API preview PDF
3. **PDF Info** → Nhận thông tin PDF từ database
4. **Viewer Generation** → Tạo embedded PDF viewer
5. **Display** → Hiển thị PDF với controls

## 🔍 **Error Handling**

```json
{
  "success": false,
  "message": "CV not found",
  "error": {
    "code": "CV_NOT_FOUND",
    "details": "CV with ID 68e3478f37d338155fca7b40 not found"
  }
}
```

## 📊 **Features Comparison**

| Feature       | HTML CV Preview   | PDF Preview        |
| ------------- | ----------------- | ------------------ |
| **Rendering** | ✅ Native HTML    | ✅ Embedded iframe |
| **Download**  | ✅ HTML file      | ✅ PDF file        |
| **Print**     | ✅ Browser print  | ✅ PDF print       |
| **Zoom**      | ✅ Browser zoom   | ✅ PDF zoom        |
| **Search**    | ✅ Browser search | ✅ PDF search      |
| **Mobile**    | ✅ Responsive     | ✅ Responsive      |
| **File Size** | ✅ Smaller        | ✅ Larger          |
| **Quality**   | ✅ Good           | ✅ Excellent       |

## 🎉 **Benefits**

✅ **Consistent Experience** - Giống như preview HTML CV

✅ **Professional Viewer** - Embedded PDF viewer với controls

✅ **Mobile Support** - Responsive design cho mobile

✅ **Error Handling** - Comprehensive error handling

✅ **File Management** - Download, open in new tab

✅ **Metadata Display** - Hiển thị thông tin file chi tiết

✅ **Loading States** - Loading spinner và error messages

Bây giờ bạn có thể xem CV PDF đã upload giống như CV HTML được tạo bằng AI! 🚀
