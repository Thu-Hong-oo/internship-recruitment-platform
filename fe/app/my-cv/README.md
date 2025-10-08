# CV Management System - InternBridge

## Tổng quan

Hệ thống quản lý CV của InternBridge cung cấp hai tính năng chính:

1. **Quản lý CV truyền thống** - Upload, xem, và quản lý CV đã có
2. **CV Builder với AI** - Tạo CV mới từ templates chuyên nghiệp

## Cấu trúc trang

### `/my-cv` - Trang quản lý CV chính

- Hiển thị CV hiện tại và lịch sử CV
- Upload CV mới (PDF, DOC, DOCX)
- Xem trước CV trong modal
- Đổi tên và xóa CV
- **Nút "Tạo CV với InternBridge"** - Chuyển đến trang templates

### `/my-cv/templates` - Trang chọn template CV

- Hiển thị 10+ templates chuyên nghiệp
- Bộ lọc theo danh mục và phong cách
- Tìm kiếm template
- Preview template với color palette
- Tạo CV trực tiếp từ template

## API Integration

### CV Builder APIs

```typescript
// Lấy danh sách templates
api.candidateCV.getTemplates(category?, style?)

// Tạo CV với template
api.candidateCV.generateCV({
  template: string,
  customization?: object,
  targetJob?: string,
  format?: string,
  setAsCurrent?: boolean
})

// Phân tích job description
api.candidateCV.analyzeJob({
  jobDescription: string,
  targetJob: string,
  companyInfo?: object
})

// Export PDF
api.candidateCV.exportPDF({
  cvUrl: string,
  template: string,
  pdfOptions?: object,
  filename?: string
})
```

## Templates có sẵn

### 1. Modern (Phổ biến nhất)

- **ID**: `modern`
- **Danh mục**: general
- **Phong cách**: modern
- **Màu chủ đạo**: #2563eb (Xanh dương)
- **Sections**: personalInfo, careerObjective, experience, education, skills, projects

### 2. Student Tech

- **ID**: `student-tech`
- **Danh mục**: technology
- **Phong cách**: modern
- **Màu chủ đạo**: #2563eb (Xanh dương)
- **Sections**: personalInfo, objective, education, projects, skills, certifications

### 3. Business Professional

- **ID**: `business-professional`
- **Danh mục**: business
- **Phong cách**: professional
- **Màu chủ đạo**: #059669 (Xanh lá)
- **Sections**: personalInfo, objective, education, experience, activities, skills

### 4. Minimal

- **ID**: `minimal`
- **Danh mục**: general
- **Phong cách**: minimal
- **Màu chủ đạo**: #7c3aed (Tím)
- **Sections**: personalInfo, objective, education, skills, projects

### 5. Creative

- **ID**: `creative`
- **Danh mục**: design
- **Phong cách**: creative
- **Màu chủ đạo**: #dc2626 (Đỏ)
- **Sections**: personalInfo, portfolio, education, projects, skills, awards

### 6. Executive

- **ID**: `executive`
- **Danh mục**: executive
- **Phong cách**: executive
- **Màu chủ đạo**: #1a365d (Xanh đậm)
- **Sections**: personalInfo, summary, experience, education, skills, achievements

### 7. Classic

- **ID**: `classic`
- **Danh mục**: traditional
- **Phong cách**: classic
- **Màu chủ đạo**: #2c3e50 (Xám đậm)
- **Sections**: personalInfo, objective, experience, education, skills

### 8. Healthcare

- **ID**: `healthcare`
- **Danh mục**: healthcare
- **Phong cách**: professional
- **Màu chủ đạo**: #059669 (Xanh lá)
- **Sections**: personalInfo, objective, education, clinical, skills, certifications

### 9. Education

- **ID**: `education`
- **Danh mục**: education
- **Phong cách**: professional
- **Màu chủ đạo**: #7c3aed (Tím)
- **Sections**: personalInfo, objective, education, teaching, skills, certifications

### 10. Marketing

- **ID**: `marketing`
- **Danh mục**: marketing
- **Phong cách**: creative
- **Màu chủ đạo**: #dc2626 (Đỏ)
- **Sections**: personalInfo, objective, education, campaigns, skills, achievements

## Workflow sử dụng

### Tạo CV mới với AI

1. Truy cập `/my-cv`
2. Click "Tạo CV với InternBridge"
3. Chọn template phù hợp từ `/my-cv/templates`
4. Click "Tạo CV với template này"
5. CV được tạo và đặt làm CV hiện tại
6. Quay lại `/my-cv` để xem CV mới

### Upload CV truyền thống

1. Truy cập `/my-cv`
2. Click "Tải CV mới"
3. Chọn file PDF/DOC/DOCX
4. Nhập tên hiển thị (tùy chọn)
5. Click "Hoàn tất tải lên"

### Quản lý CV

- **Xem CV**: Click "Xem trong trang" hoặc "Mở tab mới"
- **Đổi tên**: Click "Đổi tên" và nhập tên mới
- **Xóa CV**: Click "Xóa" và xác nhận
- **Đặt làm CV hiện tại**: Click icon star trên CV trong lịch sử

## Tính năng nâng cao

### Bộ lọc Template

- **Tìm kiếm**: Theo tên hoặc mô tả template
- **Danh mục**: general, technology, business, design, executive, traditional, healthcare, education, marketing
- **Phong cách**: modern, classic, creative, minimal, executive, professional

### AI Enhancement

- Tự động tối ưu nội dung CV
- Phân tích job description
- Gợi ý template phù hợp
- Tối ưu keywords cho ATS

### PDF Export

- Export CV sang PDF chất lượng cao
- Tùy chỉnh margin và format
- Tự động upload lên cloud storage
- Metadata tracking

## Responsive Design

Giao diện được thiết kế responsive cho:

- **Desktop**: Grid 3 cột cho templates
- **Tablet**: Grid 2 cột cho templates
- **Mobile**: Grid 1 cột cho templates

## Error Handling

- Loading states với spinner
- Error messages với retry options
- Success notifications
- Form validation
- File size limits (10MB)

## Performance

- Lazy loading cho templates
- Optimized images và icons
- Efficient state management
- Minimal re-renders
- Cached API responses
