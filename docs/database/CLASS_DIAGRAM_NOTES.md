`# Class Diagram - Chú thích chi tiết

## Tổng quan hệ thống

Hệ thống nền tảng tuyển dụng thực tập tập trung vào việc kết nối ứng viên (`Candidates`) với nhà tuyển dụng (`Employers`) thông qua các bài đăng tuyển dụng (`JobPosting`). Hệ thống cũng cung cấp các tính năng phân tích kỹ năng (`SkillGapAnalysis`), lộ trình phát triển (`SkillMap`), và khớp ứng viên với công việc (`MatchResult`).

---

## 1. Lớp User (Người dùng cơ sở)

**Mục đích:** Lớp cơ sở đại diện cho tất cả người dùng trong hệ thống, sử dụng inheritance pattern.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `email`: String - Email đăng nhập (unique, required)
- `password`: String - Mật khẩu đã hash (bcrypt)
- `fullName`: String - Họ và tên đầy đủ
- `avatar`: String - URL ảnh đại diện
- `status`: UserStatus (enum) - Trạng thái tài khoản (`ACTIVE`, `INACTIVE`)
- `lastLogin`: Date - Lần đăng nhập cuối cùng
- `createdAt`: Date - Ngày tạo tài khoản
- `updatedAt`: Date - Ngày cập nhật
- `authCredentials`: List<AuthCredential> - Danh sách thông tin xác thực (OAuth, etc.)
- `isFollowing`: Boolean - Có đang theo dõi ai không

**Phương thức:**
- `updateProfile()`: Cập nhật thông tin cá nhân
- `changePassword()`: Đổi mật khẩu
- `getAuthCredentials()`: Lấy danh sách phương thức xác thực
- `follow()`: Theo dõi một đối tượng (job hoặc company)
- `unfollow()`: Bỏ theo dõi

**Quan hệ:**
- **Inheritance:** Là lớp cha của `Candidate` và `Employer` (generalization)
- **Composition:** Có nhiều `AuthCredential` (0..*)
- **Association:** Nhận nhiều `Notification` (0..*)
- **Association:** Theo dõi nhiều `JobFollowing` (0..*)

---

## 2. Lớp AuthCredential (Thông tin xác thực)

**Mục đích:** Lưu trữ thông tin đăng nhập qua các phương thức OAuth (Google, Facebook, GitHub, etc.)

**Thuộc tính:**
- `provider`: String - Nhà cung cấp (google, facebook, github, etc.)
- `providerId`: String - ID từ nhà cung cấp
- `accessToken`: String - Token truy cập
- `refreshToken`: String - Token làm mới
- `expiresIn`: Number - Thời gian hết hạn (seconds)

**Quan hệ:**
- **Composition:** Thuộc về một `User` (1)

---

## 3. Lớp Company (Công ty)

**Mục đích:** Đại diện cho các công ty tuyển dụng trên nền tảng.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `name`: String - Tên công ty
- `description`: String - Mô tả về công ty
- `website`: String - Website công ty
- `logo`: String - URL logo
- `companySize`: CompanySize (enum) - Quy mô công ty:
  - `STARTUP` - Khởi nghiệp
  - `SMALL_1_10` - Nhỏ (1-10 nhân viên)
  - `MEDIUM_11_200` - Vừa (11-200 nhân viên)
  - `LARGE_201_1000` - Lớn (201-1000 nhân viên)
  - `ENTERPRISE_1000_PLUS` - Doanh nghiệp lớn (1000+ nhân viên)
- `verificationStatus`: VerificationStatus (enum) - Trạng thái xác thực:
  - `PENDING` - Đang chờ
  - `UNDER_REVIEW` - Đang xem xét
  - `VERIFIED` - Đã xác thực
- `industryCode`: String - Mã ngành nghề (liên kết đến `Industry`)
- `businessLicenseNumber`: String - Số giấy phép kinh doanh
- `businessLicenseImage`: String - URL ảnh giấy phép
- `businessLicenseDate`: Date - Ngày cấp giấy phép
- `address`: Address (value object) - Địa chỉ công ty
- `phone`: String - Số điện thoại
- `email`: String - Email liên hệ
- `taxId`: String - Mã số thuế
- `rating`: Double - Đánh giá trung bình (1-5 sao)
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `mapToBusinessInfo()`: Chuyển đổi sang thông tin doanh nghiệp
- `modify()`: Chỉnh sửa thông tin công ty
- `getOwner()`: Lấy chủ sở hữu công ty
- `getMembers()`: Lấy danh sách thành viên
- `addMember()`: Thêm thành viên mới
- `removeMember()`: Xóa thành viên
- `uploadImage()`: Tải lên hình ảnh

**Quan hệ:**
- **Composition:** Có một `Address` (1)
- **Association:** Có nhiều `Employer` (0..*)
- **Association:** Đăng nhiều `JobPosting` (0..*)
- **Association:** Được theo dõi trong `JobFollowing` (0..*)

---

## 4. Lớp Employer (Nhà tuyển dụng)

**Mục đích:** Đại diện cho nhà tuyển dụng, kế thừa từ `User`.

**Thuộc tính:**
- `companyId`: ObjectId - Liên kết đến công ty (FK → Company)
- `role`: String - Vai trò trong công ty (HR Manager, Recruiter, etc.)
- `memberStatus`: String - Trạng thái thành viên (active, inactive, pending)
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- **Inheritance:** Kế thừa từ `User` (generalization)
- **Association:** Thuộc về một `Company` (1)

**Lưu ý:** Employer kế thừa tất cả thuộc tính và phương thức từ `User`, đồng thời có thêm thông tin liên quan đến công ty.

---

## 5. Lớp Candidate (Ứng viên)

**Mục đích:** Đại diện cho ứng viên tìm việc, kế thừa từ `User`.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `firstName`: String - Tên
- `lastName`: String - Họ
- `email`: String - Email (kế thừa từ User)
- `phone`: String - Số điện thoại
- `address`: Address (value object) - Địa chỉ
- `profileCompleteness`: Number - Mức độ hoàn thiện hồ sơ (0-100%)
- `jobSeekingStatus`: JobSeekingStatus (enum) - Trạng thái tìm việc:
  - `ACTIVE` - Đang tích cực tìm việc
  - `INACTIVE` - Không tìm việc
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `updateProfile()`: Cập nhật hồ sơ cá nhân
- `uploadCV()`: Tải lên CV
- `getSkills()`: Lấy danh sách kỹ năng
- `getEducation()`: Lấy thông tin học vấn
- `getApplications()`: Lấy danh sách đơn ứng tuyển
- `getSkillGapAnalysis()`: Lấy phân tích khoảng cách kỹ năng
- `getDevelopmentSteps()`: Lấy các bước phát triển
- `getMatchResults()`: Lấy kết quả khớp với công việc

**Quan hệ:**
- **Inheritance:** Kế thừa từ `User` (generalization)
- **Composition:** Có một `Address` (1)
- **Association:** Có nhiều `CV` (0..*)
- **Association:** Có nhiều `Education` (0..*)
- **Association:** Có nhiều `Skill` (0..*)
- **Association:** Có nhiều `JobApplication` (0..*)
- **Association:** Có nhiều `SkillGapAnalysis` (0..*)
- **Association:** Có nhiều `DevelopmentStep` (0..*)
- **Association:** Có nhiều `MatchResult` (0..*)

---

## 6. Lớp JobPosting (Bài đăng tuyển dụng)

**Mục đích:** Đại diện cho các bài đăng tuyển dụng từ công ty.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `title`: String - Tiêu đề công việc
- `description`: String - Mô tả chi tiết công việc
- `jobType`: JobType (enum) - Loại công việc:
  - `FULL_TIME` - Toàn thời gian
  - `PART_TIME` - Bán thời gian
  - `CONTRACT` - Hợp đồng
  - `INTERNSHIP` - Thực tập
- `salaryRange`: SalaryRange (value object) - Phạm vi lương
- `location`: String - Địa điểm làm việc
- `postedDate`: Date - Ngày đăng bài
- `deadline`: Date - Hạn nộp hồ sơ
- `applicationCount`: Number - Số lượng đơn ứng tuyển
- `status`: JobStatus (enum) - Trạng thái bài đăng:
  - `PUBLISHED` - Đã xuất bản
  - `CLOSED` - Đã đóng
  - `EXPIRED` - Đã hết hạn
  - `ARCHIVED` - Đã lưu trữ
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `publish()`: Xuất bản bài đăng
- `expire()`: Đánh dấu hết hạn
- `archive()`: Lưu trữ bài đăng
- `updateDeadline()`: Cập nhật hạn nộp hồ sơ

**Quan hệ:**
- **Association:** Được đăng bởi một `Company` (1)
- **Composition:** Có nhiều `JobRequirement` (1..*)
- **Association:** Nhận nhiều `JobApplication` (0..*)
- **Association:** Có nhiều `MatchResult` (0..*)

---

## 7. Lớp JobRequirement (Yêu cầu công việc)

**Mục đích:** Mô tả các yêu cầu cụ thể cho một công việc.

**Thuộc tính:**
- `requiredSkills`: List<String> - Danh sách kỹ năng bắt buộc
- `niceToHaveSkills`: List<String> - Danh sách kỹ năng mong muốn
- `minExperience`: Number - Kinh nghiệm tối thiểu (năm)
- `maxExperience`: Number - Kinh nghiệm tối đa (năm)
- `requiredCertifications`: List<String> - Danh sách chứng chỉ yêu cầu

**Quan hệ:**
- **Composition:** Thuộc về một `JobPosting` (1..*)

---

## 8. Lớp JobApplication (Đơn ứng tuyển)

**Mục đích:** Đại diện cho đơn ứng tuyển của ứng viên cho một công việc.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `applicationDate`: Date - Ngày nộp đơn
- `status`: ApplicationStatus (enum) - Trạng thái đơn:
  - `SUBMITTED` - Đã nộp
  - `REVIEWED` - Đã xem xét
  - `ACCEPTED` - Đã chấp nhận
  - `REJECTED` - Đã từ chối
  - `WITHDRAWN` - Đã rút lại
- `attachments`: List<String> - Danh sách file đính kèm (URLs)
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `withdraw()`: Rút lại đơn ứng tuyển

**Quan hệ:**
- **Association:** Được tạo bởi một `Candidate` (1)
- **Association:** Dành cho một `JobPosting` (1)

---

## 9. Lớp Skill (Kỹ năng)

**Mục đích:** Đại diện cho các kỹ năng trong hệ thống.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `name`: String - Tên kỹ năng
- `description`: String - Mô tả kỹ năng
- `category`: String - Danh mục (technical, soft, language, etc.)
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `addSkill()`: Thêm kỹ năng vào danh sách
- `removeSkill()`: Xóa kỹ năng khỏi danh sách

**Quan hệ:**
- **Association:** Được sở hữu bởi nhiều `Candidate` (0..*)
- **Association:** Được sử dụng trong `SkillGapAnalysis` (0..*)

---

## 10. Lớp Education (Học vấn)

**Mục đích:** Lưu trữ thông tin học vấn của ứng viên.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `degree`: String - Bằng cấp (Cử nhân, Thạc sĩ, Tiến sĩ, etc.)
- `major`: String - Chuyên ngành
- `institution`: String - Tên trường/viện
- `graduationYear`: Number - Năm tốt nghiệp
- `gpa`: Double - Điểm trung bình
- `description`: String - Mô tả thêm
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- **Association:** Thuộc về một `Candidate` (0..*)

---

## 11. Lớp CV (Hồ sơ xin việc)

**Mục đích:** Quản lý các CV của ứng viên.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `content`: String - Nội dung CV (JSON hoặc text)
- `fileName`: String - Tên file CV
- `uploadDate`: Date - Ngày tải lên
- `isDefault`: Boolean - CV mặc định
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- **Association:** Thuộc về một `Candidate` (0..*)

---

## 12. Lớp Notification (Thông báo)

**Mục đích:** Quản lý các thông báo cho người dùng.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `type`: NotificationType (enum) - Loại thông báo:
  - `JOB_APPLICATION_STATUS_UPDATE` - Cập nhật trạng thái đơn ứng tuyển
  - `NEW_JOB_MATCH` - Công việc mới phù hợp
  - `COMPANY_UPDATE` - Cập nhật từ công ty
  - `SKILL_RECOMMENDATION` - Gợi ý kỹ năng
  - `PROFILE_VIEW` - Ai đó xem hồ sơ
- `message`: String - Nội dung thông báo
- `isRead`: Boolean - Đã đọc chưa
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật
- `data`: Object - Dữ liệu bổ sung (JSON)

**Phương thức:**
- `getFormattedMessage()`: Lấy thông báo đã định dạng

**Quan hệ:**
- **Association:** Được gửi đến một `User` (0..*)

---

## 13. Lớp SkillGapAnalysis (Phân tích khoảng cách kỹ năng)

**Mục đích:** Phân tích sự thiếu hụt kỹ năng của ứng viên so với yêu cầu công việc.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `analysis`: String - Kết quả phân tích chi tiết
- `recommendedSkills`: List<Skill> - Danh sách kỹ năng được khuyến nghị
- `recommendedCourses`: List<String> - Danh sách khóa học được khuyến nghị
- `skillGapLevel`: PriorityLevel (enum) - Mức độ thiếu hụt:
  - `HIGH` - Cao
  - `MEDIUM` - Trung bình
  - `LOW` - Thấp
- `timeToClose`: Number - Thời gian ước tính để đóng khoảng cách (giờ)
- `isCritical`: Boolean - Có phải kỹ năng quan trọng không
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `getImprovementPlan()`: Lấy kế hoạch cải thiện

**Quan hệ:**
- **Association:** Được thực hiện cho một `Candidate` (0..*)
- **Association:** Liên quan đến nhiều `Skill` (0..*)
- **Association:** Dẫn đến nhiều `SkillMap` (0..*)

---

## 14. Lớp SkillMap (Bản đồ kỹ năng)

**Mục đích:** Lộ trình phát triển một kỹ năng cụ thể cho ứng viên.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `targetSkill`: String - Kỹ năng mục tiêu
- `currentLevel`: SkillLevel (enum) - Mức độ hiện tại:
  - `BEGINNER` - Người mới bắt đầu
  - `INTERMEDIATE` - Trung cấp
  - `ADVANCED` - Nâng cao
- `targetLevel`: SkillLevel (enum) - Mức độ mục tiêu
- `progress`: Number - Tiến độ (0-100%)
- `status`: MatchStatus (enum) - Trạng thái:
  - `ACTIVE` - Đang hoạt động
  - `COMPLETED` - Đã hoàn thành
  - `PAUSED` - Tạm dừng
  - `CANCELED` - Đã hủy
- `completionDate`: Date - Ngày hoàn thành
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `calculateCompletion()`: Tính toán phần trăm hoàn thành
- `updateProgress()`: Cập nhật tiến độ
- `pause()`: Tạm dừng lộ trình
- `resume()`: Tiếp tục lộ trình
- `complete()`: Đánh dấu hoàn thành
- `incomplete()`: Đánh dấu chưa hoàn thành
- `getDevelopmentSteps()`: Lấy danh sách các bước phát triển

**Quan hệ:**
- **Association:** Thuộc về một `SkillGapAnalysis` (0..*)
- **Composition:** Có nhiều `DevelopmentStep` (0..*)

---

## 15. Lớp DevelopmentStep (Bước phát triển)

**Mục đích:** Các bước cụ thể trong lộ trình phát triển kỹ năng.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `stepOrder`: Number - Thứ tự bước
- `title`: String - Tiêu đề bước
- `description`: String - Mô tả chi tiết
- `resources`: List<Resource> - Danh sách tài nguyên học tập
- `estimatedHours`: Number - Số giờ ước tính
- `status`: MatchStatus (enum) - Trạng thái:
  - `ACTIVE` - Đang hoạt động
  - `COMPLETED` - Đã hoàn thành
  - `PAUSED` - Tạm dừng
  - `CANCELED` - Đã hủy
- `startDate`: Date - Ngày bắt đầu
- `endDate`: Date - Ngày kết thúc
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Quan hệ:**
- **Composition:** Thuộc về một `SkillMap` (0..*)
- **Association:** Bao gồm nhiều `Resource` (0..*)

---

## 16. Lớp Resource (Tài nguyên học tập)

**Mục đích:** Đại diện cho các tài nguyên học tập (khóa học, bài viết, video, etc.)

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `title`: String - Tiêu đề tài nguyên
- `description`: String - Mô tả
- `type`: ResourceType (enum) - Loại tài nguyên:
  - `COURSE` - Khóa học
  - `ARTICLE` - Bài viết
  - `VIDEO` - Video
  - `BOOK` - Sách
  - `PRACTICE_PROJECT` - Dự án thực hành
  - `TUTORIAL` - Hướng dẫn
- `provider`: String - Nhà cung cấp (Coursera, Udemy, YouTube, etc.)
- `estimatedDuration`: Number - Thời lượng ước tính (giờ)
- `url`: String - URL tài nguyên
- `skillLevel`: SkillLevel (enum) - Mức độ kỹ năng:
  - `BEGINNER` - Người mới bắt đầu
  - `INTERMEDIATE` - Trung cấp
  - `ADVANCED` - Nâng cao
- `isAccessible`: Boolean - Có thể truy cập được không
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `getFormat()`: Lấy định dạng tài nguyên

**Quan hệ:**
- **Association:** Được sử dụng trong nhiều `DevelopmentStep` (0..*)

---

## 17. Lớp MatchResult (Kết quả khớp)

**Mục đích:** Lưu trữ kết quả khớp giữa ứng viên và công việc dựa trên AI/ML.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `score`: Number - Điểm khớp (0-100)
- `matchLevel`: MatchLevel (enum) - Mức độ khớp:
  - `EXCELLENT` - Xuất sắc (80-100)
  - `GOOD` - Tốt (60-79)
  - `FAIR` - Khá (40-59)
  - `POOR` - Yếu (<40)
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `getMatchLevel()`: Lấy mức độ khớp dựa trên điểm số

**Quan hệ:**
- **Association:** Liên kết nhiều `JobPosting` (0..*)
- **Association:** Liên kết nhiều `Candidate` (0..*)

**Lưu ý:** MatchResult sử dụng thuật toán AI/ML để tính điểm khớp dựa trên:
- Kỹ năng (skills matching)
- Kinh nghiệm (experience matching)
- Học vấn (education matching)
- Từ khóa (keyword matching)
- Soft skills (soft skills matching)

---

## 18. Lớp Industry (Ngành nghề)

**Mục đích:** Quản lý danh mục các ngành nghề trong hệ thống.

**Thuộc tính:**
- `_id`: ObjectId - Định danh duy nhất
- `name`: String - Tên ngành nghề
- `description`: String - Mô tả ngành nghề
- `isActive`: Boolean - Trạng thái hoạt động
- `createdAt`: Date - Ngày tạo
- `updatedAt`: Date - Ngày cập nhật

**Phương thức:**
- `deactivate()`: Vô hiệu hóa ngành nghề

**Quan hệ:**
- **Association:** Được sử dụng trong `Company.industryCode` (lookup)

---

## Value Objects (Đối tượng giá trị)

### Address (Địa chỉ)
**Thuộc tính:**
- `street`: String - Đường/phố
- `ward`: String - Phường/xã
- `district`: String - Quận/huyện
- `city`: String - Thành phố/tỉnh
- `country`: String - Quốc gia (mặc định: "Vietnam")

**Lưu ý:** Value object không có identity riêng, được nhúng trong các entity khác.

### SalaryRange (Phạm vi lương)
**Thuộc tính:**
- `min`: Double - Mức lương tối thiểu
- `max`: Double - Mức lương tối đa
- `currency`: String - Đơn vị tiền tệ (VND, USD, EUR)

---

## Enumerations (Liệt kê)

### CompanySize
- `STARTUP` - Khởi nghiệp
- `SMALL_1_10` - Nhỏ (1-10 nhân viên)
- `MEDIUM_11_200` - Vừa (11-200 nhân viên)
- `LARGE_201_1000` - Lớn (201-1000 nhân viên)
- `ENTERPRISE_1000_PLUS` - Doanh nghiệp lớn (1000+ nhân viên)

### JobType
- `FULL_TIME` - Toàn thời gian
- `PART_TIME` - Bán thời gian
- `CONTRACT` - Hợp đồng
- `INTERNSHIP` - Thực tập

### JobStatus
- `PUBLISHED` - Đã xuất bản
- `CLOSED` - Đã đóng
- `EXPIRED` - Đã hết hạn
- `ARCHIVED` - Đã lưu trữ

### ApplicationStatus
- `SUBMITTED` - Đã nộp
- `REVIEWED` - Đã xem xét
- `ACCEPTED` - Đã chấp nhận
- `REJECTED` - Đã từ chối
- `WITHDRAWN` - Đã rút lại

### VerificationStatus
- `PENDING` - Đang chờ
- `UNDER_REVIEW` - Đang xem xét
- `VERIFIED` - Đã xác thực

### UserStatus
- `ACTIVE` - Hoạt động
- `INACTIVE` - Không hoạt động

### NotificationType
- `JOB_APPLICATION_STATUS_UPDATE` - Cập nhật trạng thái đơn ứng tuyển
- `NEW_JOB_MATCH` - Công việc mới phù hợp
- `COMPANY_UPDATE` - Cập nhật từ công ty
- `SKILL_RECOMMENDATION` - Gợi ý kỹ năng
- `PROFILE_VIEW` - Ai đó xem hồ sơ

### PriorityLevel
- `HIGH` - Cao
- `MEDIUM` - Trung bình
- `LOW` - Thấp

### MatchLevel
- `EXCELLENT` - Xuất sắc (80-100 điểm)
- `GOOD` - Tốt (60-79 điểm)
- `FAIR` - Khá (40-59 điểm)
- `POOR` - Yếu (<40 điểm)

### SkillLevel
- `BEGINNER` - Người mới bắt đầu
- `INTERMEDIATE` - Trung cấp
- `ADVANCED` - Nâng cao

### MatchStatus
- `ACTIVE` - Đang hoạt động
- `COMPLETED` - Đã hoàn thành
- `PAUSED` - Tạm dừng
- `CANCELED` - Đã hủy

### JobSeekingStatus
- `ACTIVE` - Đang tích cực tìm việc
- `INACTIVE` - Không tìm việc

### ResourceType
- `COURSE` - Khóa học
- `ARTICLE` - Bài viết
- `VIDEO` - Video
- `BOOK` - Sách
- `PRACTICE_PROJECT` - Dự án thực hành
- `TUTORIAL` - Hướng dẫn

---

## Tóm tắt các quan hệ chính

### Inheritance (Kế thừa)
- `User` ← `Candidate` (generalization)
- `User` ← `Employer` (generalization)

### Composition (Tổng hợp)
- `User` → `AuthCredential` (0..*)
- `Company` → `Address` (1)
- `Candidate` → `Address` (1)
- `JobPosting` → `JobRequirement` (1..*)
- `SkillMap` → `DevelopmentStep` (0..*)
- `DevelopmentStep` → `Resource` (0..*)

### Association (Liên kết)
- `Company` ↔ `Employer` (1:N)
- `Company` ↔ `JobPosting` (1:N)
- `Candidate` ↔ `JobApplication` (1:N)
- `JobPosting` ↔ `JobApplication` (1:N)
- `Candidate` ↔ `Skill` (N:M)
- `Candidate` ↔ `Education` (1:N)
- `Candidate` ↔ `CV` (1:N)
- `Candidate` ↔ `SkillGapAnalysis` (1:N)
- `SkillGapAnalysis` ↔ `SkillMap` (1:N)
- `JobPosting` ↔ `MatchResult` (N:M)
- `Candidate` ↔ `MatchResult` (N:M)
- `User` ↔ `Notification` (1:N)

---

## Design Patterns được sử dụng

1. **Inheritance Pattern:** `User` là lớp cơ sở cho `Candidate` và `Employer`
2. **Composition Pattern:** Các value objects như `Address`, `SalaryRange` được nhúng trong entities
3. **Strategy Pattern:** Các enum types cho phép mở rộng mà không cần sửa code
4. **Factory Pattern:** Các phương thức như `publish()`, `expire()` tạo các trạng thái khác nhau

