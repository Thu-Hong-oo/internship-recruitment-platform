# Hướng dẫn quản lý CV Templates

## 📍 Vị trí lưu trữ Templates

Templates được định nghĩa trong file: **`backend/src/config/cvTemplates.js`**

Đây là file JavaScript chứa object `CV_TEMPLATES` với cấu trúc:

```javascript
const CV_TEMPLATES = {
  // ID template (dùng làm key)
    name: 'Tên Template',
    description: 'Mô tả template',
    sections: ['personalInfo', 'experience', 'education', ...],
    style: 'modern', // modern, classic, creative, minimal, executive, professional
    color: '#2563eb', // Màu chủ đạo
    industryCode: 'general', // general, technology, business, design, etc.
    preview: {
      image: '/templates/previews/template-preview.jpg',
      thumbnail: '/templates/previews/template-thumb.jpg',
      description: 'Mô tả preview'
    },
    customization: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#10b981'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      },
      layout: 'two-column' // hoặc 'single-column'
    }
  }
};
```

## 📝 Cách thêm Template mới

### Bước 1: Thêm template vào `cvTemplates.js`

Mở file `backend/src/config/cvTemplates.js` và thêm template mới:

```javascript
const CV_TEMPLATES = {
  // ... các template khác
  
  // Template mới của bạn
  'my-new-template': {
    name: 'My New Template',
    description: 'Mô tả template mới',
    sections: [
      'personalInfo',
      'careerObjective',
      'experience',
      'education',
      'skills',
      'projects'
    ],
    style: 'modern',
    color: '#ff6b6b',
    industryCode: 'general',
    preview: {
      image: '/templates/previews/my-new-template-preview.jpg',
      thumbnail: '/templates/previews/my-new-template-thumb.jpg',
      description: 'Template mới với thiết kế hiện đại'
    },
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false
    },
    customization: {
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#45b7d1'
      },
      fonts: {
        heading: 'Montserrat',
        body: 'Open Sans'
      },
      layout: 'two-column'
    }
  }
};
```

### Bước 2: Thêm preview images (tùy chọn)

Tạo thư mục và thêm ảnh preview:

```
backend/public/templates/previews/
  ├── my-new-template-preview.jpg  (Ảnh preview lớn)
  └── my-new-template-thumb.jpg    (Ảnh thumbnail nhỏ)
```

**Lưu ý:** Backend đã có route static file tại `/templates` để serve các ảnh này.

### Bước 3: Restart backend server

Sau khi thêm template, restart backend server để load template mới.

## 🎨 Các thuộc tính của Template

### Bắt buộc:
- `name`: Tên template (string)
- `description`: Mô tả template (string)
- `sections`: Mảng các sections sẽ hiển thị (array)
- `style`: Phong cách template (string)
- `color`: Màu chủ đạo (hex color)
- `industryCode`: Mã ngành nghề (string)

### Tùy chọn:
- `preview`: Object chứa thông tin preview
  - `image`: Đường dẫn ảnh preview lớn
  - `thumbnail`: Đường dẫn ảnh thumbnail
  - `description`: Mô tả preview
- `options`: Các tùy chọn
  - `languages`: Mảng ngôn ngữ hỗ trợ ['vi', 'en']
  - `supportsIcons`: Có hỗ trợ icons không (boolean)
- `customization`: Các tùy chọn tùy chỉnh
  - `colors`: Object màu sắc (primary, secondary, accent)
  - `fonts`: Object fonts (heading, body)
  - `layout`: Layout type ('two-column' hoặc 'single-column')

## 📋 Danh sách Sections có sẵn

Các sections bạn có thể sử dụng trong `sections` array:

- `personalInfo` - Thông tin cá nhân
- `careerObjective` - Mục tiêu nghề nghiệp
- `objective` - Mục tiêu (alias của careerObjective)
- `summary` - Tóm tắt
- `experience` - Kinh nghiệm làm việc
- `education` - Học vấn
- `skills` - Kỹ năng
- `projects` - Dự án
- `certifications` - Chứng chỉ
- `awards` - Giải thưởng
- `activities` - Hoạt động
- `languages` - Ngôn ngữ
- `hobbies` - Sở thích
- `references` - Người tham khảo
- `portfolio` - Portfolio (cho design)
- `clinical` - Lâm sàng (cho healthcare)
- `achievements` - Thành tựu

## 🏷️ Industry Codes

Các industry codes bạn có thể sử dụng:

- `general` - Tổng quát
- `technology` - Công nghệ thông tin
- `business` - Kinh doanh
- `design` - Thiết kế
- `executive` - Quản lý cấp cao
- `traditional` - Truyền thống
- `healthcare` - Y tế
- `education` - Giáo dục
- `marketing` - Marketing

## 🎭 Styles

Các style bạn có thể sử dụng:

- `modern` - Hiện đại
- `classic` - Cổ điển
- `creative` - Sáng tạo
- `minimal` - Tối giản
- `executive` - Quản lý
- `professional` - Chuyên nghiệp

## 🔄 Cách Frontend lấy Templates

Frontend sẽ tự động lấy templates từ API:

**Endpoint:** `GET /api/candidates/me/cv-builder/templates`

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "modern",
        "name": "Modern",
        "description": "Template hiện đại...",
        "preview": {
          "thumbnail": "/templates/previews/modern-thumb.jpg"
        },
        "industryCode": "general",
        "style": "modern",
        "color": "#2563eb",
        "sections": [...],
        "customization": {...}
      }
    ],
    "total": 10
  }
}
```

## ✅ Checklist khi thêm Template mới

- [ ] Thêm template vào `cvTemplates.js`
- [ ] Đảm bảo `templateId` là unique (không trùng với template khác)
- [ ] Thêm preview images vào `backend/public/templates/previews/`
- [ ] Test API endpoint: `GET /api/candidates/me/cv-builder/templates`
- [ ] Test tạo CV từ template: `POST /api/candidates/me/cv-builder/create-from-template`
- [ ] Kiểm tra template hiển thị đúng trong frontend

## 🚀 Best Practices

1. **Template ID**: Sử dụng kebab-case, mô tả rõ ràng (ví dụ: `student-tech`, `business-professional`)

2. **Sections**: Chọn sections phù hợp với ngành nghề và style

3. **Colors**: Sử dụng màu sắc phù hợp với industryCode
   - Technology: Xanh dương (#2563eb)
   - Business: Xanh lá (#059669)
   - Design: Đỏ/Cam (#dc2626, #ff6b6b)
   - Healthcare: Xanh lá (#059669)
   - Executive: Xanh đậm (#1a365d)

4. **Fonts**: Chọn fonts phù hợp với style
   - Modern: Inter, Montserrat
   - Classic: Times New Roman, Arial
   - Creative: Montserrat, Open Sans

5. **Layout**: 
   - `two-column`: Phù hợp với nhiều thông tin
   - `single-column`: Phù hợp với minimal, classic

## 📚 Ví dụ Template hoàn chỉnh

```javascript
'example-template': {
  name: 'Example Template',
  description: 'Template ví dụ với đầy đủ các thuộc tính',
  sections: [
    'personalInfo',
    'careerObjective',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications'
  ],
  style: 'modern',
  color: '#2563eb',
  industryCode: 'general',
  preview: {
    image: '/templates/previews/example-preview.jpg',
    thumbnail: '/templates/previews/example-thumb.jpg',
    description: 'Template ví dụ với layout 2 cột hiện đại'
  },
  options: {
    languages: ['vi', 'en'],
    supportsIcons: false
  },
  customization: {
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#10b981'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    layout: 'two-column'
  }
}
```


