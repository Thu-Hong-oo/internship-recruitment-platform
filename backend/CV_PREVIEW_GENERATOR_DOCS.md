# CV Template Preview Generator

## 📖 Tổng quan

Hệ thống tự động tạo preview images cho CV templates sử dụng Puppeteer. Cho phép users xem trước templates trước khi chọn sử dụng.

## 🚀 Tính năng

- ✅ **Tự động generate preview** cho tất cả CV templates
- ✅ **High-quality images** (A4 format + thumbnails)
- ✅ **Vietnamese sample data** phù hợp với thực tập sinh
- ✅ **Admin management** interface
- ✅ **Caching system** với file existence checking
- ✅ **Error handling** và logging chi tiết

## 📁 Cấu trúc Files

```
backend/
├── src/
│   ├── services/
│   │   └── cvPreviewGenerator.js      # Main preview generator service
│   ├── routes/admin/
│   │   └── templatesAdmin.js          # Admin routes cho template management
│   ├── config/
│   │   └── cvTemplates.js             # Templates với preview URLs
│   └── controllers/candidate/
│       └── CVBuilderController.js     # Updated getTemplates endpoint
├── public/
│   └── templates/
│       └── previews/                  # Generated preview images
│           ├── modern-preview.jpg
│           ├── modern-thumb.jpg
│           ├── student-tech-preview.jpg
│           └── student-tech-thumb.jpg
└── server.js                         # Static file serving setup
```

## 🔧 API Endpoints

### 👥 User Endpoints

#### GET /api/candidates/me/cv-builder/templates

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "modern",
        "name": "Modern",
        "description": "Template hiện đại, phù hợp với mọi ngành nghề",
        "preview": {
          "image": "/templates/previews/modern-preview.jpg",
          "thumbnail": "/templates/previews/modern-thumb.jpg",
          "description": "Template hiện đại với layout 2 cột"
        },
        "color": "#2563eb",
        "style": "modern",
        "isPopular": true
      }
    ]
  }
}
```

### 🔐 Admin Endpoints

#### POST /api/admin/templates/generate-previews

**Generate tất cả preview images**

```bash
curl -X POST http://localhost:5000/api/admin/templates/generate-previews \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"regenerate": false}'
```

#### POST /api/admin/templates/:templateId/generate-preview

**Generate preview cho 1 template cụ thể**

```bash
curl -X POST http://localhost:5000/api/admin/templates/modern/generate-preview \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cvData": {
      "name": "Nguyễn Văn A",
      "title": "Frontend Developer"
    }
  }'
```

#### GET /api/admin/templates/preview-status

**Kiểm tra status của preview generation**

```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 18,
      "completed": 15,
      "missing": 3
    },
    "templates": {
      "modern": {
        "preview": {
          "exists": true,
          "url": "/templates/previews/modern-preview.jpg"
        },
        "thumbnail": {
          "exists": true,
          "url": "/templates/previews/modern-thumb.jpg"
        },
        "complete": true
      }
    }
  }
}
```

#### DELETE /api/admin/templates/:templateId/preview

**Xóa preview files**

## 🎨 Supported Templates

| Template ID             | Tên                   | Mô tả                       | Phù hợp cho           |
| ----------------------- | --------------------- | --------------------------- | --------------------- |
| `modern`                | Modern                | Template hiện đại 2 cột     | Tất cả ngành nghề     |
| `student-tech`          | Student Tech          | Focus vào projects & skills | Sinh viên IT          |
| `business-professional` | Business Professional | Corporate style             | Kinh doanh, Marketing |
| `minimal`               | Minimal               | Đơn giản, sạch sẽ           | Fresher, người mới    |
| `creative`              | Creative              | Sáng tạo với gradient       | Thiết kế, Sáng tạo    |

## 🛠️ Setup & Usage

### 1. Install Dependencies

```bash
npm install puppeteer
```

### 2. Tạo Preview Directory

```bash
mkdir -p public/templates/previews
```

### 3. Generate Initial Previews

```bash
# Bằng API call (cần admin token)
curl -X POST http://localhost:5000/api/admin/templates/generate-previews \
  -H "Authorization: Bearer <admin_token>"

# Hoặc programmatically
const CVPreviewGenerator = require('./src/services/cvPreviewGenerator');
const generator = new CVPreviewGenerator();
await generator.generateAllPreviews();
await generator.close();
```

### 4. Serve Static Files

```javascript
// Đã setup trong server.js
app.use('/templates', express.static(path.join(__dirname, 'public/templates')));
```

## 📋 Sample Data Format

```javascript
const sampleData = {
  name: 'Nguyễn Văn An',
  title: 'Thực tập sinh Phát triển Phần mềm',
  email: 'nguyenvanan@email.com',
  phone: '0123 456 789',
  address: 'TP. Hồ Chí Minh',
  objective: 'Sinh viên năm cuối ngành Công nghệ Thông tin...',
};
```

## 🎯 Frontend Integration

### React Example

```jsx
import React, { useState, useEffect } from 'react';

const TemplateSelector = () => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetch('/api/candidates/me/cv-builder/templates')
      .then(res => res.json())
      .then(data => setTemplates(data.data.templates));
  }, []);

  return (
    <div className="template-grid">
      {templates.map(template => (
        <div key={template.id} className="template-card">
          <img
            src={template.preview.thumbnail}
            alt={template.name}
            className="template-thumbnail"
          />
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <button onClick={() => selectTemplate(template.id)}>
            Chọn Template
          </button>
        </div>
      ))}
    </div>
  );
};
```

### Vue.js Example

```vue
<template>
  <div class="template-gallery">
    <div
      v-for="template in templates"
      :key="template.id"
      class="template-preview"
      @click="selectTemplate(template.id)"
    >
      <img
        :src="template.preview.thumbnail"
        :alt="template.name"
        class="preview-image"
      />
      <div class="template-info">
        <h4>{{ template.name }}</h4>
        <p>{{ template.preview.description }}</p>
        <span class="template-style">{{ template.style }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      templates: [],
    };
  },
  async mounted() {
    const response = await fetch('/api/candidates/me/cv-builder/templates');
    const data = await response.json();
    this.templates = data.data.templates;
  },
  methods: {
    selectTemplate(templateId) {
      this.$emit('template-selected', templateId);
    },
  },
};
</script>
```

## 🔧 Configuration

### Puppeteer Settings

```javascript
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
```

### Image Quality Settings

- **Preview**: 794x1123px (A4 format), JPEG 85% quality
- **Thumbnail**: 300x425px, JPEG 80% quality
- **Device Scale Factor**: 2x for high-resolution displays

## ⚡ Performance Tips

1. **Lazy Generation**: Chỉ generate khi cần thiết
2. **Caching**: Check file existence trước khi generate lại
3. **Background Processing**: Generate trong background job
4. **Memory Management**: Đóng browser sau mỗi batch
5. **CDN Integration**: Serve images từ CDN cho production

## 🚨 Error Handling

- **Browser Launch Failed**: Fallback to default previews
- **Template Not Found**: Return placeholder image
- **File Write Failed**: Log error và retry
- **Memory Issues**: Process templates in batches

## 📝 Logs & Monitoring

```javascript
// Log format example
{
  "level": "info",
  "message": "Generated preview for template: modern",
  "templateId": "modern",
  "duration": "2.3s",
  "fileSize": "234KB",
  "timestamp": "2024-10-07T10:30:00Z"
}
```

## 🔄 Future Enhancements

- [ ] **Real-time Preview**: Generate preview với user data
- [ ] **Multiple Formats**: PDF, PNG, WebP exports
- [ ] **Template Customization**: Color/font previews
- [ ] **Batch Processing**: Queue system for large batches
- [ ] **Image Optimization**: WebP format, compression
- [ ] **Template Variants**: Multiple color schemes per template
