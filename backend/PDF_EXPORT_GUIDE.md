# PDF Export Feature - CV Builder

## 🎯 **Tính năng Export PDF**

Hệ thống CV Builder bây giờ hỗ trợ export CV sang định dạng PDF với chất lượng cao và tùy chỉnh linh hoạt.

## 🚀 **API Endpoints**

### 1. **Export PDF từ CV URL**

```http
POST /api/candidates/me/cv-builder/export-pdf
```

**Request Body:**

```json
{
  "cvId": "68e3478f37d338155fca7b40",
  "cvUrl": "https://res.cloudinary.com/du10thaqs/raw/upload/v1759725453/internbridge/documents/ai_resume_1759725454689_htkguhggv.html",
  "template": "modern",
  "pdfOptions": {
    "format": "A4",
    "printBackground": true,
    "margin": {
      "top": "15mm",
      "right": "15mm",
      "bottom": "15mm",
      "left": "15mm"
    }
  },
  "filename": "CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf"
}
```

### 2. **Export PDF trực tiếp từ HTML Content**

```http
POST /api/candidates/me/cv-builder/export-pdf-direct
```

**Request Body:**

```json
{
  "htmlContent": "<!DOCTYPE html>...",
  "template": "modern",
  "pdfOptions": {
    "format": "A4",
    "printBackground": true,
    "margin": {
      "top": "15mm",
      "right": "15mm",
      "bottom": "15mm",
      "left": "15mm"
    }
  },
  "filename": "CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf"
}
```

## 📋 **Response Format**

```json
{
  "success": true,
  "message": "CV exported to PDF successfully",
  "data": {
    "pdf": {
      "url": "https://res.cloudinary.com/du10thaqs/raw/upload/v1759726000/internbridge/documents/CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "publicId": "internbridge/documents/CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer",
      "format": "pdf",
      "size": 245760,
      "filename": "CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "uploadedAt": "2025-10-06T04:40:00.000Z"
    },
    "entry": {
      "url": "https://res.cloudinary.com/du10thaqs/raw/upload/v1759726000/internbridge/documents/CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "filename": "CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer.pdf",
      "displayName": "PDF - Nguyễn Thị Thu Hậu - Senior Full Stack Developer",
      "format": "pdf",
      "size": 245760,
      "uploadedAt": "2025-10-06T04:40:00.000Z",
      "aiGenerated": false,
      "template": "modern",
      "targetJob": "Senior Full Stack Developer",
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
    "message": "CV exported to PDF successfully"
  }
}
```

## ⚙️ **PDF Options**

### **Template-specific Options**

#### **Modern Template**

```json
{
  "format": "A4",
  "printBackground": true,
  "margin": {
    "top": "15mm",
    "right": "15mm",
    "bottom": "15mm",
    "left": "15mm"
  }
}
```

#### **Classic Template**

```json
{
  "format": "A4",
  "printBackground": true,
  "margin": {
    "top": "20mm",
    "right": "20mm",
    "bottom": "20mm",
    "left": "20mm"
  }
}
```

#### **Minimal Template**

```json
{
  "format": "A4",
  "printBackground": true,
  "margin": {
    "top": "10mm",
    "right": "10mm",
    "bottom": "10mm",
    "left": "10mm"
  }
}
```

#### **Executive Template**

```json
{
  "format": "A4",
  "printBackground": true,
  "margin": {
    "top": "25mm",
    "right": "25mm",
    "bottom": "25mm",
    "left": "25mm"
  }
}
```

### **Custom PDF Options**

```json
{
  "format": "A4", // A4, A3, Letter, Legal
  "printBackground": true, // Include background colors/images
  "margin": {
    "top": "20mm",
    "right": "20mm",
    "bottom": "20mm",
    "left": "20mm"
  },
  "displayHeaderFooter": false,
  "preferCSSPageSize": true,
  "scale": 1.0, // Scale factor (0.1 to 2.0)
  "width": "210mm", // Custom width
  "height": "297mm" // Custom height
}
```

## 🎨 **Tính năng**

### ✅ **High-Quality PDF Generation**

- Sử dụng Puppeteer với Chrome headless
- Hỗ trợ CSS3, fonts, và background images
- Chất lượng cao với vector graphics

### ✅ **Template Optimization**

- PDF options được tối ưu cho từng template
- Margin và spacing phù hợp với design
- Print-friendly formatting

### ✅ **Cloud Storage Integration**

- Tự động upload PDF lên Cloudinary
- CDN distribution cho tốc độ tải nhanh
- Metadata và file management

### ✅ **Filename Generation**

- Tự động generate filename từ candidate info
- Format: `CV_{Name}_{Job}_{Template}_{Timestamp}.pdf`
- Clean và SEO-friendly

### ✅ **Database Integration**

- Lưu PDF entry vào candidate profile
- Track PDF generation history
- Metadata và options storage

## 🔧 **Usage Examples**

### **JavaScript/Frontend**

```javascript
// Export PDF từ CV URL
const exportPDF = async cvUrl => {
  try {
    const response = await fetch('/api/candidates/me/cv-builder/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cvUrl: cvUrl,
        template: 'modern',
        pdfOptions: {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '15mm',
            right: '15mm',
            bottom: '15mm',
            left: '15mm',
          },
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Download PDF
      window.open(result.data.pdf.url, '_blank');

      // Or save to profile
      console.log('PDF saved:', result.data.entry);
    }
  } catch (error) {
    console.error('PDF export failed:', error);
  }
};

// Export PDF trực tiếp từ HTML
const exportPDFFromHTML = async htmlContent => {
  try {
    const response = await fetch(
      '/api/candidates/me/cv-builder/export-pdf-direct',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          htmlContent: htmlContent,
          template: 'modern',
          pdfOptions: {
            format: 'A4',
            printBackground: true,
          },
        }),
      }
    );

    const result = await response.json();
    return result.data.pdf.url;
  } catch (error) {
    console.error('PDF export failed:', error);
  }
};
```

### **React Component Example**

```jsx
import React, { useState } from 'react';

const PDFExportButton = ({ cvUrl, htmlContent }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/candidates/me/cv-builder/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          cvUrl: cvUrl,
          template: 'modern',
          pdfOptions: {
            format: 'A4',
            printBackground: true,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Open PDF in new tab
        window.open(result.data.pdf.url, '_blank');

        // Show success message
        alert('PDF exported successfully!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
};

export default PDFExportButton;
```

## 🎯 **Workflow**

1. **Generate CV** → Tạo CV HTML với AI
2. **Export PDF** → Convert HTML sang PDF với Puppeteer
3. **Upload Cloudinary** → Lưu PDF lên cloud storage
4. **Save Database** → Lưu metadata vào profile
5. **Return URL** → Trả về URL để download/view

## 🔍 **Error Handling**

```json
{
  "success": false,
  "message": "PDF generation failed: Navigation timeout",
  "error": {
    "code": "PDF_GENERATION_ERROR",
    "details": "Failed to load CV URL within timeout"
  }
}
```

## 📊 **Performance**

- **PDF Generation**: ~3-5 seconds
- **File Size**: ~200-500KB (tùy template)
- **Quality**: High-resolution vector PDF
- **Compatibility**: Works with all modern browsers

## 🎉 **Benefits**

✅ **Professional PDF Output** - Chất lượng cao, phù hợp cho ứng tuyển

✅ **Easy Integration** - API đơn giản, dễ tích hợp

✅ **Cloud Storage** - Tự động lưu trữ và CDN

✅ **Template Support** - Tối ưu cho từng template

✅ **Metadata Tracking** - Theo dõi lịch sử export

✅ **Error Handling** - Xử lý lỗi comprehensive

Bây giờ bạn có thể export CV sang PDF một cách dễ dàng và chuyên nghiệp! 🚀
