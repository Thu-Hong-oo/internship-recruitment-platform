# ROUTES SUMMARY - CV Builder & AI Controller

## ✅ **CVBuilderController Routes** - `/api/candidates/me/cv-builder/`

### 📝 Core CV Builder Features:

- `GET /` - Lấy dữ liệu CV builder hiện tại
- `PUT /` - Cập nhật dữ liệu CV builder
- `POST /generate` - Tạo CV thông minh với templates
- `GET /templates` - Lấy danh sách CV templates

### 📄 PDF Export:

- `POST /export-pdf` - Export CV thành PDF từ URL
- `POST /export-pdf-direct` - Export CV thành PDF từ HTML content

### 📚 CV History Management:

- `GET /history` - Lấy lịch sử CV đã tạo
- `DELETE /history/:cvId` - Xóa CV khỏi lịch sử
- `PUT /current/:cvId` - Set CV làm current

---

## ✅ **AIController Routes** - `/api/ai/`

### 🔍 CV Analysis:

- `POST /analyze-cv` - Phân tích CV từ file upload (PDF/DOC/DOCX)
- `POST /analyze-cv-text` - Phân tích CV từ raw text

### 💼 Job & Career AI:

- `POST /job-recommendations` - Gợi ý việc làm phù hợp
- `POST /analyze-job-posting` - Phân tích job posting
- `POST /analyze-job-description` - Phân tích job description chi tiết

### 🎯 Matching & Scoring:

- `POST /analyze-job-match` - Phân tích độ khớp CV-Job
- `POST /job-match-analysis` - Alias cho analyze-job-match
- `POST /match-score` - Tính điểm khớp giữa candidate và job
- `POST /analyze-candidate` - Phân tích candidate cho job (Employer view)

### 🎓 Skills & Learning:

- `POST /skill-gap-analysis` - Phân tích khoảng cách kỹ năng
- `POST /skill-roadmap` - Tạo lộ trình học tập/phát triển kỹ năng
- `POST /learning-roadmap` - Alias cho skill-roadmap
- `POST /suggestions` - Lấy gợi ý AI cho form fields
- `POST /cv-suggestions` - Alias cho suggestions

### 📊 Insights & Analytics:

- `GET /insights` - Lấy AI insights (auto-detect role: candidate/employer/admin)
- `GET /candidate-insights` - Insights cho candidate
- `GET /employer-insights` - Insights cho employer

### ⚡ Batch Operations:

- `POST /batch-analyze` - Phân tích hàng loạt applications cho một job

---

## 🔧 **Migration Notes:**

### ❌ **Removed from CVBuilderController:**

- `/generate-direct` - ➡️ Use `/api/ai/analyze-cv-text`
- `/analyze-job` - ➡️ Use `/api/ai/analyze-job-description`
- `/ai-suggestions` - ➡️ Use `/api/ai/suggestions`
- `/analyze-job-match` - ➡️ Use `/api/ai/analyze-job-match`
- `/skill-gap-analysis` - ➡️ Use `/api/ai/skill-gap-analysis`
- `/generate-roadmap` - ➡️ Use `/api/ai/skill-roadmap`

### ✅ **Clear Separation:**

- **CVBuilderController**: Core CV building, templates, PDF export, history
- **AIController**: All AI features (analysis, matching, suggestions, insights)

---

## 🚀 **Usage Examples:**

### Frontend CV Builder workflow:

1. `GET /api/candidates/me/cv-builder/` - Load current data
2. `PUT /api/candidates/me/cv-builder/` - Save changes
3. `POST /api/candidates/me/cv-builder/generate` - Generate CV
4. `POST /api/candidates/me/cv-builder/export-pdf` - Export to PDF

### AI Features workflow:

1. `POST /api/ai/analyze-cv-text` - Parse raw CV text
2. `POST /api/ai/suggestions` - Get AI suggestions for fields
3. `POST /api/ai/analyze-job-match` - Check job compatibility
4. `POST /api/ai/skill-gap-analysis` - Find skill gaps
5. `POST /api/ai/skill-roadmap` - Generate learning path

All routes require authentication and have rate limiting applied.
