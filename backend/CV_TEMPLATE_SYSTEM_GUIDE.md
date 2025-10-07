# CV Template System Guide

## Tổng quan

Hệ thống CV Template đã được cải thiện để cung cấp nhiều lựa chọn template chuyên biệt cho các ngành nghề khác nhau, với khả năng tùy chỉnh màu sắc, font chữ và layout.

## Các Template có sẵn

### 1. Modern (Phổ biến nhất)

- **ID**: `modern`
- **Mô tả**: Template hiện đại, phù hợp với mọi ngành nghề
- **Màu chủ đạo**: #2563eb (Xanh dương)
- **Font**: Inter
- **Layout**: Two-column
- **Sections**: personalInfo, careerObjective, experience, education, skills, projects

### 2. Student Tech

- **ID**: `student-tech`
- **Mô tả**: Dành cho sinh viên IT, tập trung vào projects và skills
- **Màu chủ đạo**: #2563eb (Xanh dương)
- **Font**: JetBrains Mono (heading), Inter (body)
- **Layout**: Two-column
- **Sections**: personalInfo, objective, education, projects, skills, certifications

### 3. Business Professional

- **ID**: `business-professional`
- **Mô tả**: Dành cho thực tập sinh kinh doanh, marketing
- **Màu chủ đạo**: #059669 (Xanh lá)
- **Font**: Playfair Display (heading), Source Sans Pro (body)
- **Layout**: Two-column
- **Sections**: personalInfo, objective, education, experience, activities, skills

### 4. Minimal

- **ID**: `minimal`
- **Mô tả**: Template đơn giản, sạch sẽ cho người mới bắt đầu
- **Màu chủ đạo**: #7c3aed (Tím)
- **Font**: Helvetica
- **Layout**: Single-column
- **Sections**: personalInfo, objective, education, skills, projects

### 5. Creative

- **ID**: `creative`
- **Mô tả**: Dành cho sinh viên thiết kế, sáng tạo
- **Màu chủ đạo**: #dc2626 (Đỏ)
- **Font**: Montserrat (heading), Open Sans (body)
- **Layout**: Two-column
- **Sections**: personalInfo, portfolio, education, projects, skills, awards

### 6. Executive

- **ID**: `executive`
- **Mô tả**: Template chuyên nghiệp cho vị trí cấp cao
- **Màu chủ đạo**: #1a365d (Xanh đậm)
- **Font**: Times New Roman
- **Layout**: Two-column
- **Sections**: personalInfo, summary, experience, education, skills, achievements

### 7. Classic

- **ID**: `classic`
- **Mô tả**: Template truyền thống, phù hợp với các ngành bảo thủ
- **Màu chủ đạo**: #2c3e50 (Xám đậm)
- **Font**: Times New Roman
- **Layout**: Single-column
- **Sections**: personalInfo, objective, experience, education, skills

### 8. Healthcare

- **ID**: `healthcare`
- **Mô tả**: Dành cho sinh viên y khoa, điều dưỡng
- **Màu chủ đạo**: #059669 (Xanh lá)
- **Font**: Arial
- **Layout**: Two-column
- **Sections**: personalInfo, objective, education, clinical, skills, certifications

### 9. Education

- **ID**: `education`
- **Mô tả**: Dành cho sinh viên sư phạm, giáo dục
- **Màu chủ đạo**: #7c3aed (Tím)
- **Font**: Georgia
- **Layout**: Two-column
- **Sections**: personalInfo, objective, education, teaching, skills, certifications

### 10. Marketing

- **ID**: `marketing`
- **Mô tả**: Dành cho sinh viên marketing, truyền thông
- **Màu chủ đạo**: #dc2626 (Đỏ)
- **Font**: Montserrat (heading), Open Sans (body)
- **Layout**: Two-column
- **Sections**: personalInfo, objective, education, campaigns, skills, achievements

## API Endpoints

### 1. Lấy danh sách template

```http
GET /api/candidates/me/cv-builder/templates
```

**Query Parameters:**

- `category`: Lọc theo danh mục (general, technology, business, design, executive, traditional, healthcare, education, marketing)
- `style`: Lọc theo style (modern, classic, creative, minimal, executive, professional)

**Response:**

```json
{
  "success": true,
  "data": {
    "templates": [...],
    "groupedTemplates": {
      "general": [...],
      "technology": [...],
      "business": [...]
    },
    "categories": ["general", "technology", "business", ...],
    "total": 10
  }
}
```

### 2. Generate CV với template

```http
POST /api/candidates/me/cv-builder/generate
```

**Body:**

```json
{
  "template": "student-tech",
  "customization": {
    "colors": {
      "primary": "#2563eb",
      "secondary": "#64748b",
      "accent": "#10b981"
    },
    "fonts": {
      "heading": "JetBrains Mono",
      "body": "Inter"
    },
    "layout": "two-column",
    "personalBranding": {
      "tagline": "Passionate Full Stack Developer",
      "summary": "Building innovative solutions with modern tech"
    }
  },
  "sections": [
    "personalInfo",
    "careerObjective",
    "experience",
    "education",
    "skills"
  ],
  "targetJob": "Senior Full Stack Developer",
  "format": "html",
  "setAsCurrent": true
}
```

### 3. Preview CV

```http
POST /api/candidates/me/cv-builder/preview
```

**Body:**

```json
{
  "template": "modern",
  "customization": {
    "colors": {
      "primary": "#2563eb",
      "secondary": "#64748b",
      "accent": "#10b981"
    }
  },
  "sections": [
    "personalInfo",
    "careerObjective",
    "experience",
    "education",
    "skills"
  ]
}
```

## Customization Options

### Colors

Mỗi template có thể tùy chỉnh 3 màu chính:

- `primary`: Màu chủ đạo (tiêu đề, header)
- `secondary`: Màu phụ (text, border)
- `accent`: Màu nhấn (highlight, button)

### Fonts

- `heading`: Font cho tiêu đề
- `body`: Font cho nội dung

### Layout

- `single-column`: Layout 1 cột
- `two-column`: Layout 2 cột

### Personal Branding

- `tagline`: Câu slogan cá nhân
- `summary`: Tóm tắt ngắn gọn

## Cách sử dụng

### 1. Lấy danh sách template

```javascript
const response = await fetch('/api/candidates/me/cv-builder/templates');
const data = await response.json();
console.log(data.data.templates);
```

### 2. Phân tích Job Description (MỚI)

```javascript
const response = await fetch('/api/candidates/me/cv-builder/analyze-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jobDescription: `
      We are looking for a Senior Full Stack Developer with 3+ years of experience.
      Requirements:
      - React, Node.js, MongoDB
      - Experience with AWS
      - Strong problem-solving skills
      - Team leadership experience
    `,
    targetJob: 'Senior Full Stack Developer',
    companyInfo: {
      name: 'Tech Company',
      industry: 'Technology',
      size: '50-200 employees',
    },
  }),
});

const analysis = await response.json();
console.log(analysis.data.recommendations);
```

### 3. Generate CV với AI Enhancement

```javascript
const response = await fetch('/api/candidates/me/cv-builder/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    template: 'student-tech',
    customization: {
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#45b7d1',
      },
      fonts: {
        heading: 'Montserrat',
        body: 'Open Sans',
      },
    },
    targetJob: 'Frontend Developer Intern',
    jobDescription: 'Job description for better AI optimization',
    companyInfo: {
      name: 'Company Name',
      industry: 'Technology',
    },
    format: 'html',
  }),
});
```

### 4. Preview trước khi generate

```javascript
const response = await fetch('/api/candidates/me/cv-builder/preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    template: 'modern',
    customization: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#10b981',
      },
    },
  }),
});
```

## AI Enhancement Features (MỚI)

### 🧠 **Enhanced AI CV Writing**

- **Professional Prompt**: Sử dụng prompt chuyên nghiệp với 15+ năm kinh nghiệm
- **Industry Context**: Phân tích ngành nghề và đưa ra gợi ý phù hợp
- **Action Verbs**: Sử dụng action verbs mạnh (Led, Developed, Implemented, Optimized)
- **Quantification**: Quantify mọi thành tích có thể (by 25%, from X to Y, over X months)
- **ATS Optimization**: Tối ưu cho Applicant Tracking System

### 📊 **Job Description Analysis**

- **Requirements Extraction**: Trích xuất skills, technologies, experience requirements
- **Match Analysis**: Đánh giá độ phù hợp với profile hiện tại
- **Gap Analysis**: Phân tích điểm yếu và cách cải thiện
- **Action Plan**: Đưa ra kế hoạch hành động cụ thể

### 🎯 **Smart Recommendations**

- **Template Suggestion**: Gợi ý template phù hợp với job
- **Keyword Optimization**: Thêm keywords từ job description
- **Content Strategy**: Chiến lược nội dung tổng thể
- **Skill Development**: Kế hoạch phát triển kỹ năng

## Lưu ý

1. **Template validation**: Hệ thống sẽ kiểm tra template có tồn tại không trước khi generate
2. **Fallback**: Nếu template không tồn tại, sẽ fallback về template `modern`
3. **Customization merge**: Customization từ user sẽ merge với default của template
4. **Sections**: Mỗi template có sections mặc định, có thể override bằng parameter `sections`
5. **Responsive**: Tất cả template đều responsive trên mobile
6. **AI Enhancement**: Sử dụng AI để cải thiện nội dung CV chuyên nghiệp hơn
7. **Job Analysis**: Phân tích job description để tối ưu CV tốt hơn

## Troubleshooting

### Lỗi "Template not found"

- Kiểm tra template ID có đúng không
- Sử dụng endpoint `/templates` để lấy danh sách template hợp lệ

### CV không hiển thị đúng

- Kiểm tra dữ liệu profile có đầy đủ không
- Kiểm tra customization format có đúng không

### Performance

- Sử dụng `/preview` để test trước khi generate
- Template `minimal` có tốc độ generate nhanh nhất
