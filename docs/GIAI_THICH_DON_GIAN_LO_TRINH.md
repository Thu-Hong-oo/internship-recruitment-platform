# 📚 Giải Thích Đơn Giản: Chức Năng Tạo Lộ Trình Học Tập

## 🎯 Mục Đích

Hệ thống tự động tạo lộ trình học tập cá nhân hóa cho ứng viên dựa trên:
- Kỹ năng hiện có của ứng viên (từ CV/profile)
- Kỹ năng yêu cầu của công việc
- Khoảng trống kỹ năng (skill gaps)

---

## 🔄 Quy Trình Hoạt Động (7 Bước)

### Bước 1: Trích Xuất Kỹ Năng Từ Công Việc
- **Dùng gì**: PhoBERT NER (mô hình AI nhận diện kỹ năng trong văn bản tiếng Việt)
- **Làm gì**: Đọc mô tả công việc, tự động tìm các kỹ năng như "React", "JavaScript", "Python"
- **Ví dụ**: "Cần có kinh nghiệm React và Node.js" → Tìm được: React, Node.js

### Bước 2: Trích Xuất Kỹ Năng Từ CV Ứng Viên
- **Dùng gì**: PhoBERT NER (giống bước 1)
- **Làm gì**: Đọc CV và profile của ứng viên, tìm kỹ năng họ đã có
- **Ví dụ**: CV có "Đã làm dự án với React" → Tìm được: React (beginner level)

### Bước 3: Phân Tích Khoảng Trống Kỹ Năng
- **Làm gì**: So sánh kỹ năng công việc cần vs kỹ năng ứng viên có
- **Phân loại**:
  - **Critical**: Kỹ năng bắt buộc nhưng ứng viên chưa có
  - **Important**: Kỹ năng quan trọng nhưng ứng viên chưa có
  - **Optional**: Kỹ năng tùy chọn
- **Ví dụ**: 
  - Job cần: React (intermediate), TypeScript (intermediate)
  - Ứng viên có: React (beginner)
  - Gap: React (cần nâng cấp), TypeScript (chưa có)

### Bước 4: Ưu Tiên Kỹ Năng Cần Học
- **Làm gì**: Sắp xếp kỹ năng theo mức độ quan trọng
- **Thứ tự**: Critical → Important → Optional
- **Ước tính thời gian**: Mỗi kỹ năng cần bao nhiêu tuần để học
  - Beginner: 2 tuần
  - Intermediate: 3 tuần
  - Advanced: 4 tuần
  - Expert: 6 tuần

### Bước 5: Tìm Tài Liệu Học Tập ⭐ (Phần Quan Trọng)

**Hệ thống tìm tài liệu theo 4 mức độ ưu tiên:**

#### 1️⃣ Thư Viện Sẵn Có (Curated Database) - Ưu tiên cao nhất
- **Là gì**: Có sẵn **500+ tài liệu** đã được kiểm tra kỹ, lưu trực tiếp trong code
- **Giống như**: Một tủ sách đã được chọn lọc sẵn, chỉ cần lấy ra dùng
- **Ví dụ**: 
  - Link trực tiếp đến khóa học "React - The Complete Guide" trên Udemy
  - Link đến tài liệu chính thức của React
- **Ưu điểm**: 
  - ✅ Chắc chắn có
  - ✅ Link đúng, không bị lỗi
  - ✅ Chất lượng cao, đã được verify

#### 2️⃣ Kho Lưu Trữ Thông Minh (ChromaDB) - Ưu tiên thứ 2
- **Là gì**: Một **cơ sở dữ liệu vector** lưu trữ thông tin về tài liệu học tập
- **Cách hoạt động**:
  - Dữ liệu trong đây đã được **chuẩn bị sẵn trước** (từ curated DB hoặc đã crawl trước đó)
  - Tìm kiếm bằng cách so sánh **ngữ nghĩa** (semantic similarity)
  - Ví dụ: Tìm "React tutorial" → hệ thống hiểu và tìm các tài liệu liên quan đến React
- **Lưu ý quan trọng**: 
  - ⚠️ ChromaDB **KHÔNG tự động** vào YouTube/GitHub để lấy dữ liệu mới
  - ⚠️ Dữ liệu phải được **nạp vào trước** (thủ công hoặc lên lịch tự động)
  - ⚠️ Giống như một thư viện đã có sách sẵn, không tự động đi mua sách mới

#### 3️⃣ Gọi API Bên Ngoài (YouTube/GitHub/Coursera) - Dự phòng
- **Khi nào dùng**: 
  - Thư viện sẵn có không có tài liệu cho skill đó
  - Kho lưu trữ ChromaDB không có đủ dữ liệu
  - Cần thêm tài liệu để bổ sung
- **Các API**:
  - **YouTube API**: Tìm video hướng dẫn (nếu có quota)
  - **GitHub API**: Tìm repositories, awesome lists
  - **Coursera API**: Tìm khóa học
- **Hạn chế**: 
  - ⚠️ Có thể hết quota (giới hạn số lần gọi API)
  - ⚠️ Tốn thời gian (phải chờ API trả về)
  - ⚠️ Không chắc chắn có kết quả

#### 4️⃣ Gợi Ý Chung (Generic Fallback) - Cuối cùng
- **Khi nào dùng**: Tất cả các nguồn trên đều không có
- **Làm gì**: Tạo link tìm kiếm chung
- **Ví dụ**: Link đến trang tìm kiếm trên Coursera, Udemy
- **Chất lượng**: Thấp nhất - User phải tự tìm trong trang đó

**Tóm lại**: Hệ thống **chủ yếu dùng dữ liệu có sẵn** (Curated DB + ChromaDB), **KHÔNG tự động** vào YouTube/GitHub mỗi lần tạo roadmap. API chỉ dùng khi cần fallback.

### Bước 6: Tạo Lộ Trình Theo Tuần
- **Làm gì**: Phân bổ kỹ năng vào các tuần học
- **Ví dụ**: 
  - Tuần 1-3: Học React
  - Tuần 4-5: Nâng cấp JavaScript
  - Tuần 6-8: Học TypeScript
- **Mỗi tuần có**:
  - Mục tiêu học tập
  - Tài liệu cụ thể (từ bước 5)
  - Nhiệm vụ cần làm
  - Số giờ ước tính

### Bước 7: Tính Toán Metrics
- **Tổng thời gian**: Bao nhiêu giờ để hoàn thành
- **Độ khó**: Beginner/Intermediate/Advanced/Expert
- **Lưu vào database**: Lưu roadmap vào MongoDB

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
1. **PhoBERT NER**: Trích xuất kỹ năng từ văn bản (tiếng Việt)
2. **Sentence-BERT**: So sánh ngữ nghĩa giữa các kỹ năng
3. **ChromaDB**: Lưu trữ và tìm kiếm tài liệu bằng vector similarity
4. **MongoDB**: Lưu trữ roadmap đã tạo
5. **Node.js/Express**: API server

### Frontend
1. **Next.js**: Framework React
2. **TypeScript**: Type safety
3. **shadcn/ui**: UI components

---

## 💡 Điểm Nổi Bật

✅ **Tự động hóa 100%**: Từ phân tích đến tạo lộ trình
✅ **Cá nhân hóa cao**: Dựa trên profile thực tế của ứng viên
✅ **Không phụ thuộc LLM**: Self-sufficient, không cần Gemini API
✅ **Có thể tùy chỉnh**: User có thể thêm/sửa/xóa resources, weeks, phases

---

## ⚠️ Lưu Ý Quan Trọng

1. **ChromaDB không tự động crawl**: 
   - Dữ liệu trong ChromaDB phải được nạp vào trước
   - Không tự động vào YouTube/GitHub mỗi lần tạo roadmap

2. **API calls là optional**:
   - Chỉ dùng khi cần fallback
   - Có thể hết quota

3. **Curated Database là nguồn đáng tin cậy nhất**:
   - 500+ resources đã được verify
   - Chất lượng cao, link đúng

---

## 📝 Ví Dụ Cụ Thể

**Tình huống**: Ứng viên muốn học để ứng tuyển vị trí "Frontend Developer"

**Input**:
- Job cần: React (intermediate), JavaScript (intermediate), TypeScript (intermediate)
- Ứng viên có: JavaScript (beginner), HTML/CSS (intermediate)

**Quy trình**:
1. Extract skills từ job → React, JavaScript, TypeScript
2. Extract skills từ CV → JavaScript, HTML/CSS
3. Phân tích gaps → Thiếu: React, TypeScript; Cần nâng cấp: JavaScript
4. Ưu tiên → React (3 tuần), JavaScript (2 tuần), TypeScript (3 tuần)
5. Tìm tài liệu:
   - React: "React - The Complete Guide" (Udemy) - từ Curated DB
   - JavaScript: "MDN JavaScript Guide" (free) - từ Curated DB
   - TypeScript: "Understanding TypeScript" (Udemy) - từ Curated DB
6. Tạo roadmap 8 tuần với tài liệu cụ thể
7. Lưu vào database

**Kết quả**: Lộ trình học tập 8 tuần với tài liệu cụ thể, nhiệm vụ từng tuần, và ước tính 96 giờ học.

