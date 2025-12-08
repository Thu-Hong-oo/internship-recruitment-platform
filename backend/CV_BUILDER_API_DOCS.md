# 🚀 CV Builder API Documentation

## Tổng quan

CV Builder API cung cấp các tính năng tạo và chỉnh sửa CV trực tuyến với template đẹp, tương tự như TopCV nhưng có thêm các tính năng AI-powered và trải nghiệm người dùng vượt trội.

## ✨ Tính năng chính

### 🎨 **Template System**
- **20+ professional templates**: Modern, Creative, Technical, Executive
- **Customizable colors & fonts**: Primary, secondary, accent colors
- **Responsive layouts**: Single column, two-column, custom positioning
- **Industry-specific**: IT, Marketing, Finance, Design, etc.

### 🤖 **AI-Powered Features**
- **Smart content suggestions**: AI đề xuất nội dung phù hợp cho từng section
- **Job optimization**: Tự động optimize CV cho từng job application
- **Keyword analysis**: Phát hiện missing keywords từ job description
- **Content enhancement**: Cải thiện writing quality và impact

### 🎯 **Advanced Editor**
- **Drag & drop sections**: Di chuyển sections tự do trên canvas
- **Real-time preview**: Xem thay đổi ngay lập tức
- **Version control**: Lưu nhiều phiên bản CV
- **Collaborative editing**: Chia sẻ CV để nhận feedback

### 📤 **Multi-format Export**
- **PDF**: High-quality với custom fonts và layouts
- **DOCX**: Editable Word document
- **HTML**: Web-ready version
- **JSON**: Structured data cho integrations

---

## 🛠️ API Endpoints

### Base URL
```
http://localhost:3000/api/cv-builder
```

### Authentication
Tất cả endpoints đều yêu cầu JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📋 API Reference

### 1. Quản lý CV

#### `GET /api/cv-builder`
Lấy danh sách CV của user

**Query Parameters:**
- `page` (number, default: 1): Trang hiện tại
- `limit` (number, default: 10): Số CV per page

**Response:**
```json
{
  "success": true,
  "data": {
    "cvs": [
      {
        "_id": "cv_id",
        "title": "My Professional CV",
        "templateId": "modern",
        "status": "draft",
        "updatedAt": "2025-01-08T10:00:00Z",
        "customization": {
          "colors": { "primary": "#2563eb" },
          "fonts": { "heading": "Inter" },
          "layout": "two-column"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### `POST /api/cv-builder/create`
Tạo CV mới

**Request Body:**
```json
{
  "templateId": "modern",
  "title": "My Professional CV"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "cv_id",
    "templateId": "modern",
    "status": "draft",
    "content": {
      "personalInfo": {},
      "sections": [...]
    },
    "customization": { /* template defaults */ }
  }
}
```

#### `GET /api/cv-builder/:id`
Lấy thông tin chi tiết CV

#### `PUT /api/cv-builder/:id`
Cập nhật nội dung CV

**Request Body:**
```json
{
  "content": {
    "personalInfo": {
      "fullName": "Nguyễn Văn A",
      "email": "nguyenvana@email.com",
      "phone": "0123456789"
    },
    "sections": [...]
  },
  "customization": {
    "colors": { "primary": "#10b981" },
    "fonts": { "heading": "Roboto" },
    "layout": "single-column"
  }
}
```

#### `POST /api/cv-builder/:id/duplicate`
Tạo bản sao của CV

---

### 2. Quản lý Sections

#### `POST /api/cv-builder/:id/sections`
Thêm section mới

**Request Body:**
```json
{
  "type": "experience",
  "title": "Work Experience",
  "content": {
    "items": []
  },
  "position": { "x": 0, "y": 200 }
}
```

#### `PUT /api/cv-builder/:id/sections/:sectionId`
Cập nhật section

**Request Body:**
```json
{
  "content": {
    "text": "Updated career objective..."
  },
  "position": { "x": 10, "y": 210 },
  "size": { "width": 380, "height": 180 }
}
```

#### `DELETE /api/cv-builder/:id/sections/:sectionId`
Xóa section

---

### 3. AI Features

#### `POST /api/cv-builder/:id/ai-suggestions`
Lấy gợi ý AI cho section

**Request Body:**
```json
{
  "sectionType": "experience",
  "currentContent": {
    "items": [
      {
        "title": "Software Developer",
        "company": "ABC Corp",
        "description": "Developed web applications"
      }
    ]
  },
  "targetJob": "Frontend Developer at XYZ Company"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "improvement",
      "title": "Add quantifiable achievements",
      "description": "Include specific metrics and outcomes",
      "example": "Instead of 'Developed web applications', say 'Developed 5+ React applications serving 10k+ users'"
    },
    {
      "type": "enhancement",
      "title": "Use action verbs",
      "description": "Start with strong action words",
      "example": "Use: 'Architected', 'Optimized', 'Implemented', 'Led'"
    }
  ]
}
```

#### `POST /api/cv-builder/:id/optimize`
Optimize CV cho job cụ thể

**Request Body:**
```json
{
  "jobDescription": "We are looking for a React developer with 3+ years experience...",
  "jobTitle": "Senior Frontend Developer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "keywords",
        "title": "Add missing keywords",
        "description": "Consider adding: React, TypeScript, Redux",
        "keywords": ["React", "TypeScript", "Redux"]
      }
    ],
    "missingKeywords": ["React", "TypeScript", "Redux"],
    "relevanceScore": 0.65
  }
}
```

---

### 4. Preview & Export

#### `GET /api/cv-builder/:id/preview`
Tạo preview CV

**Query Parameters:**
- `format` (string, default: 'html'): 'html' hoặc 'json'

**Response:**
```json
{
  "success": true,
  "data": {
    "html": "<div class='cv-preview'>...</div>",
    "metadata": {
      "stats": {
        "sectionsCount": 5,
        "wordsCount": 450,
        "completenessScore": 85
      }
    }
  }
}
```

#### `POST /api/cv-builder/:id/export`
Export CV sang định dạng khác nhau

**Request Body:**
```json
{
  "format": "pdf",
  "options": {
    "includePhoto": true,
    "paperSize": "A4",
    "margin": "0.5in"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.cvbuilder.com/exports/cv_123.pdf",
    "format": "pdf",
    "size": "245KB",
    "generatedAt": "2025-01-08T10:30:00Z"
  }
}
```

---

## 🎨 Template System

### Available Templates

| Template ID | Name | Description | Best For |
|-------------|------|-------------|----------|
| `modern` | Modern | Template hiện đại, clean | General use |
| `creative` | Creative | Template sáng tạo, màu sắc | Design, Marketing |
| `technical` | Technical | Template kỹ thuật, code-focused | IT, Engineering |
| `executive` | Executive | Template lãnh đạo, professional | Management |
| `minimal` | Minimal | Template tối giản, elegant | Any field |
| `academic` | Academic | Template học thuật | Education, Research |

### Customization Options

```json
{
  "colors": {
    "primary": "#2563eb",    // Main brand color
    "secondary": "#64748b",  // Supporting color
    "accent": "#10b981"      // Highlight color
  },
  "fonts": {
    "heading": "Inter",      // Headings font
    "body": "Inter"          // Body text font
  },
  "layout": "two-column",    // 'single-column' or 'two-column'
  "spacing": "normal"        // 'compact', 'normal', 'relaxed'
}
```

---

## 🔧 Frontend Integration

### React/Next.js Example

```typescript
// CVEditor.tsx
import { useState, useEffect } from 'react';

export default function CVEditor({ cvId }) {
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCV();
  }, [cvId]);

  const loadCV = async () => {
    const response = await fetch(`/api/cv-builder/${cvId}`);
    const data = await response.json();
    setCvData(data.data);
    setLoading(false);
  };

  const updateSection = async (sectionId, content) => {
    const response = await fetch(`/api/cv-builder/${cvId}/sections/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (response.ok) {
      // Update local state
      setCvData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          sections: prev.content.sections.map(section =>
            section.id === sectionId
              ? { ...section, content }
              : section
          )
        }
      }));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="cv-editor">
      <CVPreview cvData={cvData} />
      <SectionEditor
        sections={cvData.content.sections}
        onUpdate={updateSection}
      />
    </div>
  );
}
```

### Drag & Drop Implementation

```typescript
// DraggableSection.tsx
import { useDrag, useDrop } from 'react-dnd';

export function DraggableSection({ section, index, onReorder }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'SECTION',
    item: { id: section.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'SECTION',
    hover: (item) => {
      if (item.index !== index) {
        onReorder(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`section ${isDragging ? 'opacity-50' : ''}`}
      style={{
        position: 'absolute',
        left: section.position.x,
        top: section.position.y,
        width: section.size.width,
        height: section.size.height
      }}
    >
      <SectionContent section={section} />
    </div>
  );
}
```

---

## 📊 Analytics & Metrics

### CV Performance Tracking

```javascript
// Track CV views/downloads
app.post('/api/cv-builder/:id/track', async (req, res) => {
  const { action } = req.body; // 'view', 'download', 'share'

  await CVAnalytics.findOneAndUpdate(
    { cvId: req.params.id },
    { $inc: { [action]: 1 } },
    { upsert: true }
  );

  res.json({ success: true });
});

// Get CV analytics
app.get('/api/cv-builder/:id/analytics', async (req, res) => {
  const analytics = await CVAnalytics.findOne({ cvId: req.params.id });
  res.json(analytics || { views: 0, downloads: 0, shares: 0 });
});
```

### CV Quality Metrics

```javascript
// Calculate CV completeness and quality
const metrics = {
  completenessScore: calculateCompleteness(cvData), // 0-100
  contentQuality: analyzeContentQuality(cvData),    // 0-100
  keywordOptimization: checkKeywordDensity(cvData), // 0-100
  readabilityScore: calculateReadability(cvData),   // 0-100
  atsCompatibility: checkATSCompatibility(cvData)   // 0-100
};
```

---

## 🚀 Advanced Features

### 1. **Real-time Collaboration**
```javascript
// WebSocket integration
io.on('connection', (socket) => {
  socket.on('join-cv', (cvId) => {
    socket.join(`cv-${cvId}`);
  });

  socket.on('cv-update', (data) => {
    // Broadcast to all users editing this CV
    socket.to(`cv-${data.cvId}`).emit('cv-updated', data);
  });
});
```

### 2. **Version Control**
```javascript
// Save version on every change
const saveVersion = async (cvId, content, note = 'Auto-saved') => {
  await ResumeBuilder.findByIdAndUpdate(cvId, {
    $push: {
      versions: {
        content,
        createdAt: new Date(),
        note
      }
    }
  });
};
```

### 3. **A/B Testing**
```javascript
// Test different CV versions
const createVariant = async (originalCvId, changes) => {
  const original = await ResumeBuilder.findById(originalCvId);
  const variant = new ResumeBuilder({
    ...original.toObject(),
    title: `${original.title} (Variant)`,
    content: applyChanges(original.content, changes),
    isVariant: true,
    originalCvId
  });

  return await variant.save();
};
```

---

## 🔒 Security & Performance

### Rate Limiting
```javascript
// Apply rate limits to CV builder endpoints
const cvBuilderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many CV builder requests, please try again later'
});

app.use('/api/cv-builder', cvBuilderLimiter);
```

### Data Validation
```javascript
// Validate CV structure
const validateCV = (cvData) => {
  const schema = Joi.object({
    templateId: Joi.string().required(),
    content: Joi.object({
      personalInfo: Joi.object().required(),
      sections: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          type: Joi.string().valid('experience', 'education', 'skills', 'projects').required(),
          content: Joi.object().required()
        })
      ).required()
    }).required()
  });

  return schema.validate(cvData);
};
```

---

## 🎯 Next Steps

### Phase 1: Core Features ✅
- [x] CV creation and editing
- [x] Template system
- [x] Basic export (PDF)
- [x] Section management

### Phase 2: AI Enhancement 🚧
- [ ] AI content suggestions
- [ ] Job optimization
- [ ] Smart keyword analysis
- [ ] Content improvement

### Phase 3: Advanced UX 🚧
- [ ] Drag & drop editor
- [ ] Real-time preview
- [ ] Collaborative editing
- [ ] Version control

### Phase 4: Enterprise Features 🔮
- [ ] Analytics dashboard
- [ ] A/B testing
- [ ] Team management
- [ ] White-label options

---

## 📞 Support

Nếu bạn cần hỗ trợ hoặc có câu hỏi về CV Builder API:

1. **Documentation**: Xem chi tiết tại `/api/docs` (Swagger UI)
2. **Examples**: Tham khảo code samples trong `/examples/cv-builder/`
3. **Issues**: Báo lỗi tại GitHub repository
4. **Feature Requests**: Gửi yêu cầu tính năng mới

---

*CV Builder API - Tạo CV chuyên nghiệp với AI và trải nghiệm vượt trội*</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\backend\CV_BUILDER_API_DOCS.md