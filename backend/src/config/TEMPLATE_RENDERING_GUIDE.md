# Hướng dẫn Render Template CV

## 📋 Tổng quan

Hệ thống hiện tại cho phép render CV templates với:
- **Vị trí khác nhau** cho mỗi section (x, y, width, height)
- **Màu sắc khác nhau** cho mỗi template (primary, secondary, accent)
- **Fonts khác nhau** cho mỗi template (heading, body)
- **Bố cục khác nhau** (two-column, single-column)

## 🏗️ Cấu trúc Template

### 1. Template Config (`backend/src/config/cvTemplates.js`)

Mỗi template cần có:

```javascript
'template-id': {
  name: 'Template Name',
  description: 'Mô tả',
  sections: ['personalInfo', 'experience', 'education', ...],
  style: 'modern',
  color: '#2563eb',
  industryCode: 'general',
  customization: {
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#10b981',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    layout: 'two-column', // hoặc 'single-column'
  },
  // OPTIONAL: renderLayout - nếu không có sẽ tự động generate
  renderLayout: {
    page: {
      width: 794,
      height: 1123,
      padding: 24,
      backgroundColor: '#ffffff',
    },
    sections: [
      {
        type: 'personalInfo',
        x: 48,
        y: 48,
        width: 520,
        height: 140,
        order: 1,
      },
      // ... các sections khác
    ],
  },
}
```

### 2. Auto-generate renderLayout

Nếu template không có `renderLayout`, hệ thống sẽ tự động generate dựa trên:
- `customization.layout` (two-column hoặc single-column)
- `sections` array

Helper function: `backend/src/config/templateLayoutHelper.js`

## 🔄 Luồng hoạt động

### Backend

1. **API Get Template**: `GET /api/candidates/me/cv-builder/template/:templateId`
   - Trả về template config đầy đủ, bao gồm `renderLayout`
   - Tự động generate `renderLayout` nếu chưa có

2. **API Get Templates**: `GET /api/candidates/me/cv-builder/templates`
   - Trả về danh sách templates với `renderLayout`

3. **API Get Builder Data**: `GET /api/candidates/me/cv-builder`
   - Trả về dữ liệu CV từ CandidateProfile (không cần ResumeBuilder)

### Frontend

1. **Page.tsx** (`fe/app/my-cv/new/page.tsx`):
   - Load template config từ API
   - Load CV data từ CandidateProfile
   - Convert data sang CVData format
   - Pass templateConfig xuống CVEditor

2. **CVEditor** (`fe/components/cv/CVEditor.tsx`):
   - Nhận `templateConfig` từ props
   - Convert `renderLayout` sang format cho LivePreview
   - Pass layout xuống LivePreview

3. **LivePreview** (`fe/components/cv/LivePreview.tsx`):
   - Nhận `layout` từ props
   - Render các sections theo vị trí (x, y, width, height) từ layout
   - Áp dụng màu sắc và fonts từ layout
   - Render động theo sections trong layout

## 🎨 Cách thêm Template mới

### Bước 1: Thêm template vào `cvTemplates.js`

```javascript
'my-template': {
  name: 'My Template',
  description: 'Mô tả template',
  sections: ['personalInfo', 'experience', 'education', 'skills'],
  style: 'modern',
  color: '#ff6b6b',
  industryCode: 'general',
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
    layout: 'two-column', // hoặc 'single-column'
  },
  // OPTIONAL: renderLayout - nếu không có sẽ auto-generate
}
```

### Bước 2: (Tùy chọn) Tùy chỉnh renderLayout

Nếu muốn layout đặc biệt, thêm `renderLayout`:

```javascript
renderLayout: {
  page: {
    width: 794,
    height: 1123,
    padding: 24,
    backgroundColor: '#f8f9fa', // Background color khác
  },
  sections: [
    {
      type: 'personalInfo',
      x: 100, // Vị trí X
      y: 50,  // Vị trí Y
      width: 600, // Chiều rộng
      height: 150, // Chiều cao
      order: 1, // Thứ tự render
    },
    // ... các sections khác với vị trí tùy chỉnh
  ],
}
```

### Bước 3: Test

1. Gọi API: `GET /api/candidates/me/cv-builder/template/my-template`
2. Kiểm tra `renderLayout` trong response
3. Test render trong frontend: `/my-cv/new?template=my-template`

## 📐 Section Types được hỗ trợ

Các section types có thể render:

- `personalInfo` / `personal` - Thông tin cá nhân
- `careerObjective` / `objective` / `summary` - Mục tiêu/Tóm tắt
- `experience` - Kinh nghiệm
- `education` - Học vấn
- `skills` - Kỹ năng
- `projects` - Dự án
- `certifications` - Chứng chỉ
- `languages` - Ngôn ngữ
- `activities` - Hoạt động
- `awards` - Giải thưởng
- `hobbies` - Sở thích
- `references` - Người tham khảo
- `social` - Mạng xã hội

## 🎨 Màu sắc và Fonts

Mỗi template có thể có:

- **Colors**: `primary`, `secondary`, `accent`
- **Fonts**: `heading`, `body`

Được áp dụng tự động trong LivePreview:
- Headings dùng `layout.colors.primary` và `layout.fonts.heading`
- Body text dùng `layout.colors.secondary` và `layout.fonts.body`
- Accent color dùng cho borders, highlights

## 📏 Layout Types

### Two-Column Layout
- Cột trái: personalInfo, experience, education, projects (width: 520px)
- Cột phải: skills, languages, certifications (width: 150px)
- Tự động generate bởi `createTwoColumnLayout()`

### Single-Column Layout
- Tất cả sections xếp dọc (width: 698px)
- Tự động generate bởi `createSingleColumnLayout()`

## ✅ Checklist khi thêm Template

- [ ] Thêm template vào `cvTemplates.js`
- [ ] Đảm bảo có `customization.layout` (two-column hoặc single-column)
- [ ] (Tùy chọn) Thêm `renderLayout` tùy chỉnh nếu cần
- [ ] Test API: `GET /api/candidates/me/cv-builder/template/:templateId`
- [ ] Test render trong frontend
- [ ] Kiểm tra màu sắc và fonts hiển thị đúng
- [ ] Kiểm tra vị trí các sections đúng

## 🚀 Best Practices

1. **Vị trí sections**: 
   - Đảm bảo không overlap (x + width < page.width)
   - Y + height < page.height
   - Có khoảng cách hợp lý giữa các sections

2. **Màu sắc**:
   - Primary: Màu chủ đạo, dùng cho headings
   - Secondary: Màu phụ, dùng cho body text
   - Accent: Màu nhấn, dùng cho borders, highlights

3. **Fonts**:
   - Heading: Font cho tiêu đề (thường bold, lớn hơn)
   - Body: Font cho nội dung (thường regular, nhỏ hơn)

4. **Sections order**:
   - Sắp xếp theo thứ tự logic (personalInfo → experience → education → skills)
   - Order field giúp sort sections nếu cần

## 📝 Ví dụ Template hoàn chỉnh

```javascript
'example-template': {
  name: 'Example Template',
  description: 'Template ví dụ',
  sections: [
    'personalInfo',
    'careerObjective',
    'experience',
    'education',
    'skills',
    'projects',
  ],
  style: 'modern',
  color: '#2563eb',
  industryCode: 'general',
  customization: {
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#10b981',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    layout: 'two-column',
  },
  // renderLayout sẽ được auto-generate dựa trên layout type
}
```

## 🔧 Troubleshooting

### Template không render đúng

1. Kiểm tra `renderLayout` có trong API response không
2. Kiểm tra sections có đúng type không
3. Kiểm tra layout có đủ thông tin (page, sections) không

### Sections không hiển thị

1. Kiểm tra section type có trong danh sách hỗ trợ không
2. Kiểm tra data có đúng format không
3. Kiểm tra vị trí (x, y) có trong phạm vi page không

### Màu sắc/Fonts không đúng

1. Kiểm tra `customization.colors` và `customization.fonts` trong template config
2. Kiểm tra `renderLayout` có được pass xuống LivePreview không


