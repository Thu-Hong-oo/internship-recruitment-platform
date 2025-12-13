# 🎯 Giải Thích Chi Tiết Các Tính Năng AI - Cho Ứng Viên

## 📋 Mục Lục
1. [Gợi ý Công Việc Cho Ứng Viên](#1-gợi-ý-công-việc-cho-ứng-viên)
2. [Gợi ý Ứng Viên Cho Nhà Tuyển Dụng](#2-gợi-ý-ứng-viên-cho-nhà-tuyển-dụng)
3. [Lộ Trình Học Tập Cá Nhân Hóa](#3-lộ-trình-học-tập-cá-nhân-hóa)

---

## 1. Gợi ý Công Việc Cho Ứng Viên

### 🎯 Mục đích
Hệ thống tự động tìm và gợi ý những công việc phù hợp nhất với hồ sơ của bạn, dựa trên kỹ năng, kinh nghiệm, học vấn và sở thích của bạn.

### 🔧 Công nghệ sử dụng

#### **1. ChromaDB - Vector Database (Cơ sở dữ liệu vector)**
- **Là gì?** ChromaDB là một cơ sở dữ liệu đặc biệt lưu trữ dữ liệu dưới dạng "vector" (mảng số).
- **Tại sao dùng?** Giúp tìm kiếm nhanh chóng (milliseconds) thay vì phải so sánh từng công việc một.
- **Cách hoạt động:**
  - Mỗi công việc được chuyển thành một vector số (embedding) bằng AI
  - Hồ sơ của bạn cũng được chuyển thành vector
  - Hệ thống tìm những vector gần giống nhau nhất → đó là công việc phù hợp

#### **2. Sentence-BERT - Mô hình AI hiểu ngữ nghĩa**
- **Là gì?** Mô hình AI được huấn luyện để hiểu ý nghĩa của câu văn, không chỉ từ khóa.
- **Ví dụ:** 
  - "Lập trình viên Python" và "Developer Python" → AI hiểu là giống nhau
  - "Quản lý dự án" và "Project Manager" → AI hiểu là cùng nghĩa
- **Lợi ích:** Tìm được công việc phù hợp ngay cả khi dùng từ khác

#### **3. RAG (Retrieval-Augmented Generation) - Tìm kiếm nâng cao**
- **Là gì?** Kết hợp tìm kiếm thông minh với AI để hiểu sâu hơn về mô tả công việc.
- **Cách hoạt động:**
  1. **Bước 1:** Lọc nhanh 100 công việc có điểm số cao nhất (dựa trên kỹ năng, kinh nghiệm)
  2. **Bước 2:** Dùng AI phân tích sâu hơn về mô tả công việc
  3. **Bước 3:** Kết hợp 60% điểm số truyền thống + 40% điểm số ngữ nghĩa AI

### 📊 Thuật toán tính điểm

Hệ thống tính điểm phù hợp từ 0-100% dựa trên 4 yếu tố:

```
Điểm tổng = (Kỹ năng × 40%) + (Kinh nghiệm × 30%) + (Học vấn × 15%) + (Dự án × 15%)
```

#### **1. Kỹ năng (40% - Quan trọng nhất)**
- **Cách tính:**
  - So sánh kỹ năng bạn có với kỹ năng công việc yêu cầu
  - Dùng TF-IDF (thuật toán tìm từ quan trọng) + Cosine Similarity (đo độ tương đồng)
  - AI hiểu ngữ nghĩa: "React" = "ReactJS" = "React.js"
- **Ví dụ:**
  - Bạn có: JavaScript, React, Node.js
  - Job cần: JavaScript, React, Express
  - Điểm: 85% (3/4 kỹ năng khớp)

#### **2. Kinh nghiệm (30%)**
- **Cách tính:**
  - So sánh số năm kinh nghiệm của bạn với yêu cầu
  - Phân loại level: Intern (0-1 năm), Junior (1-2 năm), Mid (2-4 năm), Senior (4+ năm)
- **Ví dụ:**
  - Bạn: 2 năm kinh nghiệm
  - Job yêu cầu: 1-3 năm
  - Điểm: 100% (phù hợp hoàn hảo)

#### **3. Học vấn (15%)**
- **Cách tính:**
  - So sánh bằng cấp: Trung học < Cao đẳng < Đại học < Thạc sĩ < Tiến sĩ
  - Kiểm tra ngành học có liên quan không
- **Ví dụ:**
  - Bạn: Đại học Công nghệ Thông tin
  - Job: Yêu cầu Đại học, ngành IT
  - Điểm: 100%

#### **4. Dự án (15%)**
- **Cách tính:**
  - Xem các dự án bạn đã làm có liên quan đến công việc không
  - Phân tích công nghệ, domain (lĩnh vực) sử dụng
- **Ví dụ:**
  - Bạn có dự án: Website bán hàng (React, Node.js)
  - Job: Frontend Developer (React)
  - Điểm: 90%

### 🎯 Phân loại Tier (Hạng)

Sau khi tính điểm, hệ thống phân loại:

- **Tier A (85-100%):** Phù hợp xuất sắc - Nên ứng tuyển ngay!
- **Tier B (70-84%):** Phù hợp tốt - Có cơ hội cao
- **Tier C (50-69%):** Phù hợp trung bình - Cần bổ sung một số kỹ năng
- **Tier D (<50%):** Chưa phù hợp - Cần học thêm nhiều

### 🚀 Quy trình hoạt động

```
1. Bạn vào trang "Gợi ý công việc"
   ↓
2. Hệ thống lấy hồ sơ của bạn (kỹ năng, kinh nghiệm, học vấn)
   ↓
3. Chuyển hồ sơ thành vector bằng Sentence-BERT
   ↓
4. Tìm trong ChromaDB những công việc có vector gần giống nhất
   ↓
5. Tính điểm chi tiết cho từng công việc (4 yếu tố)
   ↓
6. Sắp xếp theo điểm số từ cao xuống thấp
   ↓
7. Hiển thị danh sách công việc gợi ý với điểm số và giải thích
```

### 💡 Điểm đặc biệt

1. **Tìm kiếm nhanh:** Thay vì so sánh với hàng nghìn công việc, chỉ cần vài milliseconds
2. **Hiểu ngữ nghĩa:** Tìm được công việc phù hợp dù dùng từ khác
3. **Cá nhân hóa:** Học từ hành vi của bạn (công việc đã lưu, đã ứng tuyển, tìm kiếm)
4. **Cập nhật real-time:** Khi có công việc mới, tự động tính điểm và gợi ý

---

## 2. Gợi ý Ứng Viên Cho Nhà Tuyển Dụng

### 🎯 Mục đích
Hệ thống tự động tìm và gợi ý những ứng viên phù hợp nhất cho công việc của nhà tuyển dụng, giúp tiết kiệm thời gian và tìm được người phù hợp.

### 🔧 Công nghệ sử dụng

**Hoàn toàn giống với gợi ý công việc, nhưng đảo ngược:**
- Thay vì tìm công việc cho ứng viên → Tìm ứng viên cho công việc
- Dùng cùng công nghệ: ChromaDB, Sentence-BERT, RAG
- Cùng thuật toán tính điểm

### 📊 Thuật toán tính điểm (Giống hệt phần 1)

```
Điểm tổng = (Kỹ năng × 50%) + (Kinh nghiệm × 18%) + (Học vấn × 12%) + (Địa điểm/Lương × 15%) + (Base × 10%)
```

**Khác biệt nhỏ:**
- Kỹ năng chiếm 50% (quan trọng hơn)
- Có thêm điểm cho địa điểm và mức lương mong muốn
- Không có "behavior score" (điểm hành vi) vì nhà tuyển dụng không có lịch sử tương tác

### 🚀 Quy trình hoạt động

```
1. Nhà tuyển dụng đăng công việc
   ↓
2. Hệ thống lấy thông tin công việc (yêu cầu kỹ năng, kinh nghiệm, học vấn)
   ↓
3. Chuyển công việc thành vector bằng Sentence-BERT
   ↓
4. Tìm trong ChromaDB những ứng viên có vector gần giống nhất
   ↓
5. Tính điểm chi tiết cho từng ứng viên (4 yếu tố)
   ↓
6. Sắp xếp theo điểm số từ cao xuống thấp
   ↓
7. Hiển thị danh sách ứng viên gợi ý với điểm số và phân tích chi tiết
```

### 💡 Điểm đặc biệt

1. **Tự động hóa:** Không cần nhà tuyển dụng phải tìm kiếm thủ công
2. **Chính xác cao:** Dùng AI để hiểu sâu về hồ sơ ứng viên
3. **Tiết kiệm thời gian:** Từ hàng giờ xuống vài giây
4. **Phân tích chi tiết:** Hiển thị điểm số từng phần, kỹ năng khớp/thiếu

---

## 3. Lộ Trình Học Tập Cá Nhân Hóa

### 🎯 Mục đích
Tạo ra một lộ trình học tập được thiết kế riêng cho bạn, giúp bạn bổ sung những kỹ năng còn thiếu để đạt được công việc mong muốn.

### 🔧 Công nghệ sử dụng

#### **1. Skill Gap Analysis (Phân tích khoảng cách kỹ năng)**
- **Là gì?** So sánh kỹ năng bạn có với kỹ năng công việc yêu cầu
- **Cách hoạt động:**
  1. Lấy danh sách kỹ năng từ công việc mục tiêu
  2. Lấy danh sách kỹ năng từ hồ sơ của bạn
  3. Tìm những kỹ năng còn thiếu
  4. Phân loại: Critical (quan trọng), Important (quan trọng vừa), Optional (tùy chọn)

#### **2. PhoBERT - Mô hình AI tiếng Việt**
- **Là gì?** Mô hình AI được huấn luyện đặc biệt cho tiếng Việt
- **Dùng để:** Trích xuất kỹ năng từ mô tả công việc, CV, dự án
- **Lợi ích:** Hiểu được cả tiếng Việt và tiếng Anh

#### **3. Skill Normalization (Chuẩn hóa kỹ năng)**
- **Là gì?** Chuyển các cách viết khác nhau về một dạng chuẩn
- **Ví dụ:**
  - "React", "ReactJS", "React.js" → "React"
  - "JavaScript", "JS", "Javascript" → "JavaScript"
- **Lợi ích:** Tránh trùng lặp, so sánh chính xác hơn

#### **4. Rule-Based Roadmap Generator (Tạo lộ trình theo quy tắc)**
- **Là gì?** Thuật toán tự động tạo lộ trình học tập dựa trên quy tắc logic
- **Không cần AI:** Hoạt động ổn định, nhanh, không tốn chi phí
- **Cách hoạt động:**
  1. Phân tích skill gaps
  2. Ưu tiên kỹ năng quan trọng trước
  3. Sắp xếp theo độ khó (dễ → khó)
  4. Phân bổ thời gian hợp lý

### 📊 Quy trình tạo lộ trình

#### **Bước 1: Phân tích Skill Gaps**
```
Kỹ năng công việc cần: [React, Node.js, MongoDB, TypeScript, Docker]
Kỹ năng bạn có:        [React, JavaScript]
Kỹ năng còn thiếu:     [Node.js, MongoDB, TypeScript, Docker]
```

#### **Bước 2: Ưu tiên kỹ năng**
- **Critical (Quan trọng):** Node.js, MongoDB (bắt buộc phải có)
- **Important (Quan trọng vừa):** TypeScript (nên có)
- **Optional (Tùy chọn):** Docker (có thì tốt)

#### **Bước 3: Sắp xếp theo độ khó**
```
Tuần 1-2: Node.js (dễ, nền tảng)
Tuần 3-4: MongoDB (trung bình, cần Node.js)
Tuần 5-6: TypeScript (trung bình, cần JavaScript)
Tuần 7-8: Docker (khó, cần hiểu về deployment)
```

#### **Bước 4: Tìm tài liệu học tập**
- Tự động tìm: Video, bài viết, khóa học, tài liệu chính thức
- Phân loại: Beginner, Intermediate, Advanced
- Ưu tiên: Tài liệu miễn phí, có tiếng Việt

#### **Bước 5: Tạo lộ trình tuần**
```
Tuần 1: Học Node.js cơ bản
  - Mục tiêu: Hiểu về Node.js, cài đặt, chạy server đơn giản
  - Tài liệu:
    * Video: "Node.js cho người mới bắt đầu" (2 giờ)
    * Bài viết: "Node.js Documentation" (1 giờ)
    * Thực hành: Tạo server Hello World (1 giờ)
  - Tổng thời gian: 4 giờ
```

### 🎯 Cấu trúc lộ trình

```
Lộ trình học tập
├── Phase 1: Foundation (Tuần 1-4)
│   ├── Tuần 1: Node.js Basics
│   ├── Tuần 2: Node.js Advanced
│   ├── Tuần 3: MongoDB Basics
│   └── Tuần 4: MongoDB Advanced
│
├── Phase 2: Intermediate (Tuần 5-8)
│   ├── Tuần 5: TypeScript Basics
│   ├── Tuần 6: TypeScript Advanced
│   ├── Tuần 7: Docker Basics
│   └── Tuần 8: Docker Advanced
│
└── Phase 3: Advanced (Tuần 9-12)
    ├── Tuần 9-10: Project thực tế
    ├── Tuần 11: Review và cải thiện
    └── Tuần 12: Chuẩn bị ứng tuyển
```

### 💡 Điểm đặc biệt

1. **Cá nhân hóa 100%:** Mỗi người có lộ trình riêng dựa trên hồ sơ của mình
2. **Thực tế:** Dựa trên công việc thật, không phải lý thuyết chung chung
3. **Có mục tiêu rõ ràng:** Biết học gì, học bao lâu, để làm gì
4. **Tự động cập nhật:** Khi bạn hoàn thành một tuần, tự động cập nhật tiến độ
5. **Đồng bộ kỹ năng:** Khi hoàn thành tuần, kỹ năng tự động được thêm vào hồ sơ

### 🎓 Ví dụ thực tế

**Tình huống:**
- Bạn: Sinh viên năm 3, biết HTML/CSS/JavaScript cơ bản
- Mục tiêu: Ứng tuyển vị trí Frontend Developer (React)

**Lộ trình được tạo:**
```
Tuần 1-2: Học React cơ bản
  - Components, Props, State
  - JSX, Event Handling
  - Tài liệu: React Official Tutorial

Tuần 3-4: React nâng cao
  - Hooks (useState, useEffect)
  - Routing với React Router
  - State Management

Tuần 5-6: Dự án thực tế
  - Xây dựng Todo App
  - Xây dựng Weather App
  - Deploy lên Vercel

Tuần 7-8: Chuẩn bị ứng tuyển
  - Tối ưu hóa CV
  - Chuẩn bị portfolio
  - Luyện phỏng vấn
```

**Kết quả:**
- Sau 8 tuần, bạn có đủ kỹ năng để ứng tuyển
- Hồ sơ tự động được cập nhật với kỹ năng React
- Có portfolio để show cho nhà tuyển dụng

---

## 🔄 So sánh 3 tính năng

| Tính năng | Input | Output | Công nghệ chính | Thời gian |
|-----------|-------|--------|-----------------|-----------|
| **Gợi ý công việc** | Hồ sơ ứng viên | Danh sách công việc phù hợp | ChromaDB + Sentence-BERT + RAG | < 1 giây |
| **Gợi ý ứng viên** | Công việc | Danh sách ứng viên phù hợp | ChromaDB + Sentence-BERT + RAG | < 1 giây |
| **Lộ trình học tập** | Hồ sơ + Công việc mục tiêu | Lộ trình học tập 12 tuần | Skill Gap Analysis + Rule-Based | < 5 giây |

---

## 🎓 Tóm tắt cho ứng viên

### **Gợi ý công việc:**
> "Hệ thống dùng AI để hiểu hồ sơ của bạn, sau đó tìm trong hàng nghìn công việc những công việc phù hợp nhất. Nó không chỉ tìm từ khóa, mà còn hiểu ý nghĩa, nên tìm được cả những công việc dùng từ khác nhưng cùng nghĩa."

### **Gợi ý ứng viên (cho nhà tuyển dụng):**
> "Tương tự như gợi ý công việc, nhưng đảo ngược. Nhà tuyển dụng đăng công việc, hệ thống tự động tìm những ứng viên phù hợp nhất. Dùng cùng công nghệ AI, nên độ chính xác rất cao."

### **Lộ trình học tập:**
> "Hệ thống so sánh kỹ năng bạn có với kỹ năng công việc cần, tìm ra những gì còn thiếu, sau đó tự động tạo một lộ trình học tập từng tuần. Bạn chỉ cần làm theo, hoàn thành từng tuần, và kỹ năng sẽ tự động được cập nhật vào hồ sơ."

---

## 📚 Thuật ngữ kỹ thuật (Giải thích đơn giản)

- **Vector/Embedding:** Cách chuyển đổi văn bản thành dãy số để máy tính hiểu và so sánh
- **ChromaDB:** Cơ sở dữ liệu đặc biệt để lưu và tìm kiếm vector nhanh chóng
- **Sentence-BERT:** Mô hình AI hiểu ý nghĩa của câu văn, không chỉ từ khóa
- **RAG:** Kỹ thuật kết hợp tìm kiếm thông minh với AI để hiểu sâu hơn
- **TF-IDF:** Thuật toán tìm từ quan trọng trong văn bản
- **Cosine Similarity:** Cách đo độ giống nhau giữa 2 vector
- **Skill Gap Analysis:** Phân tích xem bạn còn thiếu kỹ năng gì
- **PhoBERT:** Mô hình AI tiếng Việt để trích xuất thông tin

---

**Tài liệu này được tạo để giúp ứng viên hiểu rõ cách hệ thống AI hoạt động, không cần kiến thức kỹ thuật sâu.**

---

## 4. Hệ Thống Đăng Nhập

### 🎯 Mục đích
Hệ thống đăng nhập bảo mật, hỗ trợ nhiều phương thức để người dùng có thể truy cập vào tài khoản của mình một cách an toàn và tiện lợi.

### 🔐 Các phương thức đăng nhập

Hệ thống hỗ trợ **3 phương thức đăng nhập**:

1. **Đăng nhập bằng Email/Password (Local Auth)**
2. **Đăng nhập bằng Google OAuth**
3. **Đăng nhập bằng OTP qua Email**

### 🔧 Công nghệ sử dụng

#### **1. JWT (JSON Web Token) - Token xác thực**
- **Là gì?** JWT là một chuỗi mã hóa chứa thông tin người dùng (ID, role)
- **Cách hoạt động:**
  1. Khi đăng nhập thành công, server tạo một JWT token
  2. Token được gửi về client và lưu trong localStorage/cookie
  3. Mỗi request sau đó, client gửi token trong header `Authorization: Bearer <token>`
  4. Server verify token để xác định người dùng
- **Lợi ích:**
  - Không cần lưu session trên server (stateless)
  - Có thể set thời gian hết hạn
  - Bảo mật cao với chữ ký số

#### **2. bcrypt - Mã hóa mật khẩu**
- **Là gì?** Thuật toán mã hóa một chiều (hash) cho mật khẩu
- **Cách hoạt động:**
  1. Khi đăng ký, mật khẩu được hash bằng bcrypt với salt (muối ngẫu nhiên)
  2. Chỉ lưu hash vào database, không lưu mật khẩu gốc
  3. Khi đăng nhập, hash mật khẩu nhập vào và so sánh với hash trong database
- **Lợi ích:**
  - Mật khẩu không bao giờ được lưu dạng plain text
  - Ngay cả admin cũng không thể xem mật khẩu gốc
  - Chống brute force attack

#### **3. Google OAuth 2.0 - Đăng nhập bằng Google**
- **Là gì?** Cho phép đăng nhập bằng tài khoản Google
- **Cách hoạt động:**
  1. User click "Đăng nhập bằng Google"
  2. Redirect đến Google để xác thực
  3. Google trả về ID token
  4. Server verify token với Google
  5. Tạo hoặc cập nhật user trong database
- **Lợi ích:**
  - Không cần nhớ mật khẩu
  - Email tự động được verify
  - Lấy được avatar, tên từ Google

#### **4. OTP (One-Time Password) - Mã xác thực một lần**
- **Là gì?** Mã số 6 chữ số gửi qua email, chỉ dùng được 1 lần trong thời gian ngắn
- **Cách hoạt động:**
  1. User nhập email và yêu cầu OTP
  2. Server tạo mã OTP ngẫu nhiên, lưu vào Redis/database
  3. Gửi OTP qua email
  4. User nhập OTP để đăng nhập
  5. Server verify OTP và tạo JWT token
- **Lợi ích:**
   - Không cần mật khẩu
   - Bảo mật cao (mã chỉ dùng 1 lần, hết hạn sau vài phút)
   - Tiện lợi cho người quên mật khẩu

### 📊 Quy trình đăng nhập

#### **Phương thức 1: Email/Password**

```
1. User nhập email và password
   ↓
2. Server tìm user trong database theo email
   ↓
3. Kiểm tra user có tồn tại không
   ↓
4. Hash password nhập vào bằng bcrypt
   ↓
5. So sánh với hash trong database
   ↓
6. Kiểm tra email đã verify chưa
   ↓
7. Kiểm tra tài khoản có active không
   ↓
8. Tạo JWT token (chứa user ID và role)
   ↓
9. Trả về token và thông tin user
   ↓
10. Client lưu token và dùng cho các request sau
```

#### **Phương thức 2: Google OAuth**

```
1. User click "Đăng nhập bằng Google"
   ↓
2. Redirect đến Google OAuth consent screen
   ↓
3. User cho phép truy cập thông tin
   ↓
4. Google redirect về với ID token
   ↓
5. Server verify ID token với Google
   ↓
6. Lấy thông tin: email, tên, avatar, googleId
   ↓
7. Kiểm tra user đã tồn tại chưa:
   - Nếu có googleId → Login
   - Nếu có email nhưng chưa có googleId → Link account
   - Nếu chưa có → Tạo user mới
   ↓
8. Tạo JWT token
   ↓
9. Trả về token và thông tin user
```

#### **Phương thức 3: OTP qua Email**

```
1. User nhập email và click "Gửi mã OTP"
   ↓
2. Server tạo mã OTP 6 chữ số ngẫu nhiên
   ↓
3. Lưu OTP vào Redis (TTL: 5 phút)
   ↓
4. Gửi email chứa OTP
   ↓
5. User nhập OTP
   ↓
6. Server verify OTP từ Redis
   ↓
7. Xóa OTP sau khi verify (chỉ dùng 1 lần)
   ↓
8. Tạo JWT token
   ↓
9. Trả về token và thông tin user
```

### 🔒 Bảo mật

#### **1. Password Hashing**
- Mật khẩu được hash với bcrypt (10 rounds)
- Salt ngẫu nhiên cho mỗi password
- Không thể reverse từ hash về password gốc

#### **2. JWT Token**
- Chứa user ID và role
- Có thời gian hết hạn (expiresIn)
- Được ký bằng secret key (JWT_SECRET)
- Không thể giả mạo nếu không có secret key

#### **3. Token trong Request**
- Gửi trong header: `Authorization: Bearer <token>`
- Middleware `protect` verify token trước mỗi request
- Nếu token invalid/expired → Trả về 401 Unauthorized

#### **4. Email Verification**
- User phải verify email trước khi đăng nhập
- OTP email tự động verify email
- Google OAuth tự động verify (Google đã verify)

#### **5. Account Status**
- Kiểm tra `isActive` và `status` trước khi cho phép đăng nhập
- Có thể suspend/ban tài khoản

### 🎯 Auth Methods (Phương thức xác thực)

User có thể có 3 loại auth method:

1. **`local`**: Chỉ đăng nhập bằng email/password
2. **`google`**: Chỉ đăng nhập bằng Google OAuth
3. **`hybrid`**: Có thể đăng nhập bằng cả 2 cách

**Logic:**
- Nếu user đăng ký bằng email/password → `authMethod: 'local'`
- Nếu user đăng ký bằng Google → `authMethod: 'google'`
- Nếu user đăng ký bằng email, sau đó link Google → `authMethod: 'hybrid'`

### 📝 Middleware Auth

#### **1. `protect` - Bảo vệ route**
```javascript
// Chỉ user đã đăng nhập mới truy cập được
router.get('/profile', protect, getProfile);
```

#### **2. `optionalProtect` - Tùy chọn**
```javascript
// Route public, nhưng nếu có token thì lấy thông tin user
router.get('/jobs', optionalProtect, getJobs);
```

#### **3. `authorize` - Phân quyền**
```javascript
// Chỉ admin mới truy cập được
router.delete('/user/:id', protect, authorize('admin'), deleteUser);
```

### 💡 Điểm đặc biệt

1. **Nhiều phương thức:** User có thể chọn cách đăng nhập phù hợp
2. **Bảo mật cao:** Password hash, JWT signed, email verification
3. **Tiện lợi:** Google OAuth không cần nhớ mật khẩu
4. **Linh hoạt:** Có thể link nhiều phương thức (hybrid)
5. **Stateless:** JWT không cần session storage
6. **Auto-verify:** Google OAuth và OTP tự động verify email

### 🔄 Flow đăng nhập hoàn chỉnh

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       │
       ▼
┌─────────────┐
│   Server    │
│  (Backend)  │
└──────┬──────┘
       │
       │ 2. Tìm user trong database
       │ 3. Verify password với bcrypt
       │ 4. Kiểm tra email verified
       │ 5. Kiểm tra account active
       │
       ▼
┌─────────────┐
│  JWT Token  │
│  Generator  │
└──────┬──────┘
       │
       │ 6. Tạo JWT token
       │    { id, role, expiresIn }
       │
       ▼
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 7. Lưu token vào localStorage
       │
       ▼
┌─────────────┐
│  Protected  │
│   Routes    │
└──────┬──────┘
       │
       │ 8. Mỗi request gửi token:
       │    Authorization: Bearer <token>
       │
       ▼
┌─────────────┐
│ Middleware  │
│   protect   │
└──────┬──────┘
       │
       │ 9. Verify token
       │ 10. Attach user vào req.user
       │
       ▼
┌─────────────┐
│  Controller │
│  (Handler)  │
└─────────────┘
```

### 📚 Thuật ngữ kỹ thuật

- **JWT (JSON Web Token):** Token chứa thông tin user, được ký số để chống giả mạo
- **bcrypt:** Thuật toán hash mật khẩu một chiều, không thể reverse
- **OAuth 2.0:** Chuẩn xác thực cho phép đăng nhập bằng bên thứ 3 (Google)
- **OTP (One-Time Password):** Mã xác thực chỉ dùng 1 lần, hết hạn sau vài phút
- **Salt:** Giá trị ngẫu nhiên thêm vào password trước khi hash để tăng bảo mật
- **Middleware:** Code chạy trước khi đến controller, dùng để verify token
- **Stateless:** Không cần lưu session trên server, mọi thông tin trong token
- **Bearer Token:** Cách gửi token trong HTTP header: `Authorization: Bearer <token>`

---

**Tài liệu này giải thích chi tiết về hệ thống đăng nhập, giúp hiểu rõ cách bảo mật và xác thực người dùng.**

