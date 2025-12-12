# Database Diagram - Chú thích chi tiết

## 1. Lớp Companies (Công ty)

**Mục đích:** Lưu trữ thông tin các công ty tuyển dụng trên nền tảng.

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính, định danh duy nhất cho mỗi công ty
- `name`: String - Tên công ty (VD: "Công ty Cổ phần ABC", "Tech Solutions Inc.")
- `email`: String - Email liên hệ chính của công ty
- `phone`: String - Số điện thoại liên hệ
- `address`: Object - Địa chỉ công ty (street, ward, district, city, country)
- `website`: String - Website công ty (optional)
- `logo`: String - URL logo công ty
- `description`: String - Mô tả về công ty, lĩnh vực hoạt động
- `industryCode`: String - Mã ngành nghề (liên kết đến bảng industries)
- `size`: String - Quy mô công ty (startup, small, medium, large, enterprise)
- `foundedYear`: Number - Năm thành lập
- `status`: String - Trạng thái (active, inactive, pending)
- `createdAt`: Date - Ngày tạo hồ sơ công ty
- `updatedAt`: Date - Ngày cập nhật gần nhất

**Quan hệ:**
- Một công ty có thể đăng nhiều job postings (1:N với jobs)
- Một công ty có thể có nhiều employer accounts (1:N với employers)
- Một công ty có thể nhận nhiều đánh giá từ ứng viên (1:N với company_reviews)

---

## 2. Lớp Employers (Nhà tuyển dụng)

**Mục đích:** Quản lý tài khoản và thông tin của nhà tuyển dụng.

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `userId`: ObjectId - Liên kết đến bảng users (FK)
- `companyId`: ObjectId - Liên kết đến công ty mà nhà tuyển dụng thuộc về (FK → companies)
- `position`: String - Chức vụ trong công ty (VD: "HR Manager", "Recruiter")
- `department`: String - Phòng ban
- `isCompanyAdmin`: Boolean - Quyền quản trị công ty
- `status`: String - Trạng thái tài khoản (active, inactive, suspended)
- `createdAt`: Date - Ngày tạo tài khoản
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một employer thuộc về một user (N:1 với users)
- Một employer thuộc về một công ty (N:1 với companies)
- Một employer có thể đăng nhiều jobs (1:N với jobs)
- Một employer có thể có nhiều conversations với ứng viên (1:N với conversations)

---

## 3. Lớp Users (Người dùng)

**Mục đích:** Lưu trữ thông tin chung của tất cả người dùng (ứng viên và nhà tuyển dụng).

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `email`: String - Email đăng nhập (unique, required)
- `password`: String - Mật khẩu đã hash (bcrypt)
- `role`: String - Vai trò (candidate, employer, admin)
- `fullName`: String - Họ và tên đầy đủ
- `avatar`: String - URL ảnh đại diện
- `phone`: String - Số điện thoại
- `isEmailVerified`: Boolean - Trạng thái xác thực email
- `isActive`: Boolean - Trạng thái hoạt động
- `lastLogin`: Date - Lần đăng nhập cuối
- `createdAt`: Date - Ngày đăng ký
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một user có thể là candidate (1:1 với candidates)
- Một user có thể là employer (1:1 với employers)
- Một user có thể có nhiều skills (N:M với skills qua user_skills)
- Một user có thể quan tâm nhiều majors (N:M với majors qua user_interested_majors)

---

## 4. Lớp Candidates (Ứng viên)

**Mục đích:** Lưu trữ thông tin chi tiết của ứng viên.

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `userId`: ObjectId - Liên kết đến users (FK, unique)
- `dateOfBirth`: Date - Ngày sinh
- `gender`: String - Giới tính (male, female, other)
- `address`: Object - Địa chỉ hiện tại (street, ward, district, city, country)
- `bio`: String - Tiểu sử ngắn, giới thiệu bản thân
- `resume`: Object - Thông tin CV (current, history)
  - `current`: ObjectId - CV hiện tại đang sử dụng
  - `history`: Array<ObjectId> - Lịch sử các CV đã tạo
- `jobSeekingStatus`: String - Trạng thái tìm việc (actively-looking, open-to-opportunities, not-looking)
- `profileVisibility`: Boolean - Cho phép nhà tuyển dụng tìm kiếm hồ sơ
- `expectedSalary`: Object - Mức lương mong muốn (min, max, currency)
- `preferredJobTypes`: Array<String> - Loại công việc ưa thích (full-time, part-time, contract, internship)
- `preferredLocations`: Array<String> - Địa điểm làm việc mong muốn
- `createdAt`: Date - Ngày tạo hồ sơ
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một candidate thuộc về một user (1:1 với users)
- Một candidate có thể ứng tuyển nhiều jobs (N:M với jobs qua applications)
- Một candidate có thể lưu nhiều jobs (N:M với jobs qua save_jobs)
- Một candidate có thể đánh giá nhiều công ty (1:N với company_reviews)
- Một candidate có thể có nhiều conversations (1:N với conversations)

---

## 5. Lớp Jobs (Công việc/Bài tuyển dụng)

**Mục đích:** Lưu trữ thông tin các bài đăng tuyển dụng.

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `title`: String - Tiêu đề công việc (VD: "Senior Full Stack Developer")
- `slug`: String - URL-friendly identifier (unique)
- `employerId`: ObjectId - Nhà tuyển dụng đăng bài (FK → employers)
- `companyId`: ObjectId - Công ty tuyển dụng (FK → companies)
- `description`: String - Mô tả chi tiết công việc
- `requirements`: String - Yêu cầu ứng viên
- `benefits`: String - Quyền lợi, phúc lợi
- `skills`: Array<String> - Danh sách kỹ năng yêu cầu
- `skillIds`: Array<ObjectId> - Liên kết đến bảng skills (FK)
- `level`: String - Cấp độ (intern, junior, middle, senior, lead)
- `jobType`: String - Loại công việc (full-time, part-time, contract, internship)
- `workingMode`: String - Chế độ làm việc (remote, hybrid, on-site)
- `location`: String - Địa điểm làm việc
- `address`: Object - Địa chỉ chi tiết
- `salaryMin`: Number - Mức lương tối thiểu
- `salaryMax`: Number - Mức lương tối đa
- `currency`: String - Đơn vị tiền tệ (VND, USD)
- `industryCode`: String - Mã ngành nghề
- `subIndustryCode`: String - Mã ngành phụ
- `positions`: Number - Số lượng vị trí cần tuyển
- `deadline`: Date - Hạn nộp hồ sơ
- `status`: String - Trạng thái (draft, pending, active, closed, expired)
- `moderationStatus`: String - Trạng thái kiểm duyệt (pending, approved, rejected)
- `views`: Number - Số lượt xem
- `applicationsCount`: Number - Số lượng đơn ứng tuyển
- `createdAt`: Date - Ngày đăng bài
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một job thuộc về một employer (N:1 với employers)
- Một job thuộc về một công ty (N:1 với companies)
- Một job có thể nhận nhiều applications (1:N với applications)
- Một job có thể được nhiều candidates lưu (N:M với candidates qua save_jobs)

---

## 6. Lớp Applications (Đơn ứng tuyển)

**Mục đích:** Quản lý các đơn ứng tuyển của ứng viên cho các công việc.

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `candidateId`: ObjectId - Ứng viên ứng tuyển (FK → candidates)
- `jobId`: ObjectId - Công việc ứng tuyển (FK → jobs)
- `resumeId`: ObjectId - CV sử dụng để ứng tuyển (FK → resumes)
- `coverLetter`: String - Thư xin việc (optional)
- `status`: String - Trạng thái (pending, reviewing, shortlisted, interview, offer, accepted, rejected)
- `appliedAt`: Date - Ngày nộp đơn
- `reviewedAt`: Date - Ngày được xem xét
- `notes`: String - Ghi chú của nhà tuyển dụng
- `matchingScore`: Number - Điểm khớp với yêu cầu (0-100)
- `scoreBreakdown`: Object - Chi tiết điểm khớp (skills, experience, education, etc.)
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một application thuộc về một candidate (N:1 với candidates)
- Một application thuộc về một job (N:1 với jobs)
- Một application sử dụng một resume (N:1 với resumes)
- Một application có thể có nhiều interviews (1:N với interviews)

---

## 7. Lớp Company_Reviews (Đánh giá công ty)

**Mục đích:** Lưu trữ đánh giá của ứng viên về các công ty.

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `candidateId`: ObjectId - Ứng viên đánh giá (FK → candidates)
- `companyId`: ObjectId - Công ty được đánh giá (FK → companies)
- `rating`: Number - Điểm đánh giá (1-5 sao)
- `title`: String - Tiêu đề đánh giá
- `content`: String - Nội dung đánh giá chi tiết
- `pros`: Array<String> - Điểm mạnh của công ty
- `cons`: Array<String> - Điểm yếu của công ty
- `recommendToFriend`: Boolean - Có khuyến nghị cho bạn bè không
- `isAnonymous`: Boolean - Đánh giá ẩn danh
- `isVerified`: Boolean - Đã xác thực (đã làm việc tại công ty)
- `helpfulCount`: Number - Số lượt hữu ích
- `status`: String - Trạng thái (pending, approved, rejected)
- `createdAt`: Date - Ngày đánh giá
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một review thuộc về một candidate (N:1 với candidates)
- Một review thuộc về một company (N:1 với companies)
- **Lưu ý:** Một ứng viên có thể đánh giá nhiều công ty, mỗi đánh giá liên kết đến một công ty cụ thể

---

## 8. Lớp Conversations và Messages (Hệ thống trò chuyện)

**Mục đích:** Quản lý hệ thống nhắn tin giữa nhà tuyển dụng và ứng viên.

### Conversations (Cuộc trò chuyện)

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `candidateId`: ObjectId - Ứng viên tham gia (FK → candidates)
- `recruiterId`: ObjectId - Nhà tuyển dụng tham gia (FK → employers)
- `jobId`: ObjectId - Công việc liên quan (FK → jobs, optional)
- `lastMessage`: Object - Tin nhắn cuối cùng (content, sentAt, senderId)
- `unreadCount`: Object - Số tin nhắn chưa đọc (candidate: Number, recruiter: Number)
- `status`: String - Trạng thái (active, archived, blocked)
- `createdAt`: Date - Ngày tạo cuộc trò chuyện
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một conversation có nhiều messages (1:N với messages)
- Một conversation liên kết một candidate và một recruiter (N:1 với candidates, N:1 với employers)

### Messages (Tin nhắn)

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `conversationId`: ObjectId - Cuộc trò chuyện chứa tin nhắn (FK → conversations)
- `senderId`: ObjectId - Người gửi (FK → users)
- `receiverId`: ObjectId - Người nhận (FK → users)
- `content`: String - Nội dung tin nhắn
- `messageType`: String - Loại tin nhắn (text, image, file, system)
- `attachments`: Array<Object> - File đính kèm (name, url, size, type)
- `isRead`: Boolean - Đã đọc chưa
- `readAt`: Date - Thời điểm đọc
- `isDeleted`: Boolean - Đã xóa chưa
- `createdAt`: Date - Thời gian gửi
- `updatedAt`: Date - Thời gian cập nhật

**Quan hệ:**
- Một message thuộc về một conversation (N:1 với conversations)
- Một message có một sender (N:1 với users qua senderId)
- Một message có một receiver (N:1 với users qua receiverId)

---

## 9. Lớp Save_Jobs (Lưu công việc)

**Mục đích:** Lưu trữ các công việc mà ứng viên đã lưu để xem sau.

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `candidateId`: ObjectId - Ứng viên lưu công việc (FK → candidates)
- `jobId`: ObjectId - Công việc được lưu (FK → jobs)
- `savedAt`: Date - Thời điểm lưu
- `notes`: String - Ghi chú của ứng viên về công việc này (optional)
- `tags`: Array<String> - Nhãn phân loại (VD: ["favorite", "apply-later"])
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một save_job thuộc về một candidate (N:1 với candidates)
- Một save_job thuộc về một job (N:1 với jobs)
- **Lưu ý:** Một ứng viên có thể lưu nhiều công việc, mỗi công việc có thể được nhiều ứng viên lưu (N:M relationship)

**Index:**
- Unique index trên `(candidateId, jobId)` để tránh lưu trùng

---

## 10. Lớp Majors và User_Interested_Majors (Ngành nghề quan tâm)

**Mục đích:** Quản lý các ngành nghề mà ứng viên quan tâm.

### Majors (Ngành nghề)

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `code`: String - Mã ngành (unique, VD: "IT", "MARKETING", "FINANCE")
- `name`: String - Tên ngành nghề (VD: "Công nghệ thông tin", "Marketing", "Tài chính")
- `description`: String - Mô tả về ngành nghề
- `category`: String - Danh mục cha (VD: "Technology", "Business")
- `isActive`: Boolean - Trạng thái hoạt động
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một major có thể được nhiều users quan tâm (N:M với users qua user_interested_majors)

### User_Interested_Majors (Quan tâm ngành nghề)

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `userId`: ObjectId - Người dùng quan tâm (FK → users)
- `majorId`: ObjectId - Ngành nghề được quan tâm (FK → majors)
- `interestLevel`: String - Mức độ quan tâm (high, medium, low)
- `createdAt`: Date - Ngày thêm vào danh sách quan tâm
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Liên kết giữa users và majors (N:M relationship)
- Một user có thể quan tâm nhiều majors
- Một major có thể được nhiều users quan tâm

**Index:**
- Unique index trên `(userId, majorId)` để tránh trùng lặp

---

## 11. Lớp Skills và User_Skills (Kỹ năng)

**Mục đích:** Quản lý kỹ năng của ứng viên và kỹ năng yêu cầu của công việc.

### Skills (Kỹ năng)

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `name`: String - Tên kỹ năng (VD: "JavaScript", "React", "Node.js", "Python")
- `description`: String - Mô tả về kỹ năng
- `category`: String - Danh mục (technical, soft, language, certification)
- `aliases`: Array<String> - Tên khác của kỹ năng (VD: ["JS", "ECMAScript"] cho JavaScript)
- `isVerified`: Boolean - Kỹ năng đã được xác thực
- `popularity`: Number - Độ phổ biến (số lượng người dùng có kỹ năng này)
- `isActive`: Boolean - Trạng thái hoạt động
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Một skill có thể được nhiều users sở hữu (N:M với users qua user_skills)
- Một skill có thể được yêu cầu bởi nhiều jobs (N:M với jobs qua skillIds)

### User_Skills (Kỹ năng của người dùng)

**Thuộc tính chính:**
- `_id`: ObjectId - Khóa chính
- `userId`: ObjectId - Người dùng sở hữu kỹ năng (FK → users)
- `skillId`: ObjectId - Kỹ năng (FK → skills)
- `proficiency`: String - Mức độ thành thạo (beginner, intermediate, advanced, expert)
- `yearsOfExperience`: Number - Số năm kinh nghiệm với kỹ năng này
- `isVerified`: Boolean - Kỹ năng đã được xác thực (qua test, certification)
- `certifications`: Array<Object> - Chứng chỉ liên quan (name, issuer, date, url)
- `endorsements`: Number - Số lượt xác nhận từ người khác
- `createdAt`: Date - Ngày thêm kỹ năng
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- Liên kết giữa users và skills (N:M relationship)
- Một user có thể có nhiều skills
- Một skill có thể được nhiều users sở hữu

**Index:**
- Unique index trên `(userId, skillId)` để tránh trùng lặp

---

## Tóm tắt các quan hệ chính

1. **Users ↔ Candidates/Employers**: 1:1 (một user là một candidate hoặc employer)
2. **Employers ↔ Companies**: N:1 (nhiều employers thuộc một công ty)
3. **Candidates ↔ Jobs**: N:M qua Applications (ứng viên ứng tuyển công việc)
4. **Candidates ↔ Jobs**: N:M qua Save_Jobs (ứng viên lưu công việc)
5. **Candidates ↔ Companies**: 1:N qua Company_Reviews (một ứng viên đánh giá nhiều công ty)
6. **Candidates ↔ Employers**: N:M qua Conversations (trò chuyện)
7. **Conversations ↔ Messages**: 1:N (một cuộc trò chuyện có nhiều tin nhắn)
8. **Users ↔ Majors**: N:M qua User_Interested_Majors (quan tâm ngành nghề)
9. **Users ↔ Skills**: N:M qua User_Skills (kỹ năng của người dùng)

