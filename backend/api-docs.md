# AI Internship Platform API Documentation

## Authentication Routes

### Auth Routes (`/api/auth`)

- `POST /register` - Đăng ký tài khoản mới (intern/employer)
- `POST /login` - Đăng nhập bằng email và mật khẩu
- `POST /login/google` - Đăng nhập/Đăng ký bằng Google
- `POST /request-otp` - Yêu cầu mã OTP để đăng nhập
- `POST /verify-otp` - Đăng nhập bằng mã OTP
- `POST /forgot-password` - Yêu cầu đặt lại mật khẩu
- `POST /reset-password` - Đặt lại mật khẩu với OTP
- `POST /verify-email` - Xác thực email bằng OTP
- `GET /verify-email/:token` - Xác thực email bằng link
- `POST /resend-verification` - Gửi lại mã xác thực email
- `POST /refresh-token` - Làm mới access token
- `POST /logout` - Đăng xuất
- `GET /me` - Lấy thông tin người dùng hiện tại //Thường dùng để kiểm tra trạng thái đăng nhập
  Data: id, email, role, auth status, etc.

## User Management

### User Routes (`/api/users`)

- `GET /profile` - Lấy thông tin profile
- `PUT /profile` - Cập nhật profile
- `PUT /password` - Đổi mật khẩu
- `POST /avatar` - Upload avatar
- `PUT /preferences` - Cập nhật tùy chọn người dùng

### Intern Routes (`/api/interns`)

- `POST /cv` - Upload CV
- `GET /cv/:id` - Xem CV
- `PUT /cv/:id` - Cập nhật CV
- `GET /applications` - Danh sách đơn ứng tuyển
- `GET /saved-jobs` - Danh sách việc làm đã lưu
- `GET /recommendations` - Gợi ý việc làm phù hợp
- `GET /skill-roadmap` - Xem lộ trình phát triển kỹ năng
- `PUT /skill-roadmap/:id/progress` - Cập nhật tiến độ học tập

### Employer Routes (`/api/employers`)

#### Profile Management

- `GET /profile` - Xem thông tin công ty
- `PUT /profile` - Cập nhật thông tin công ty
- `POST /verification` - Gửi yêu cầu xác thực
- `GET /verification/status` - Kiểm tra trạng thái xác thực

#### Job Management

- `GET /jobs` - Danh sách tin tuyển dụng đã đăng
- `POST /jobs` - Đăng tin tuyển dụng mới
- `PUT /jobs/:id` - Cập nhật tin tuyển dụng
- `DELETE /jobs/:id` - Xóa tin tuyển dụng
- `PUT /jobs/:id/status` - Cập nhật trạng thái tin
- `GET /jobs/:id/stats` - Thống kê tin tuyển dụng

#### Application Management

- `GET /applications` - Xem danh sách ứng viên
- `PUT /applications/:id/status` - Cập nhật trạng thái ứng viên
- `GET /applications/:id/cv` - Xem CV ứng viên
- `GET /applications/stats` - Thống kê ứng tuyển

#### Analytics & Reports

- `GET /analytics/overview` - Tổng quan hoạt động
- `GET /analytics/recruitment` - Thống kê tuyển dụng
- `GET /analytics/candidates` - Phân tích ứng viên
- `GET /reports/monthly` - Báo cáo tháng
- `GET /reports/export` - Xuất báo cáo

#### Team Management

- `GET /team` - Danh sách thành viên
- `POST /team/invite` - Mời thành viên mới
- `PUT /team/:id/role` - Cập nhật vai trò
- `DELETE /team/:id` - Xóa thành viên

## Job Management

### Job Routes (`/api/jobs`)

- `GET /` - Tìm kiếm việc làm
- `GET /:id` - Xem chi tiết việc làm
- `POST /:id/apply` - Ứng tuyển việc làm
- `POST /:id/save` - Lưu việc làm
- `GET /:id/similar` - Các việc làm tương tự
- `GET /categories` - Danh mục việc làm
- `GET /trending` - Việc làm thịnh hành

## Application Process

### Application Routes (`/api/applications`)

- `GET /:id` - Xem chi tiết đơn ứng tuyển
- `PUT /:id/status` - Cập nhật trạng thái
- `POST /:id/withdraw` - Rút đơn ứng tuyển
- `GET /:id/timeline` - Xem timeline ứng tuyển
- `POST /:id/attachments` - Thêm tài liệu đính kèm

#### Interview Management (`/api/applications/:id/interview`)

- `POST /schedule` - Đặt lịch phỏng vấn
- `PUT /reschedule` - Đổi lịch phỏng vấn
- `POST /cancel` - Hủy lịch phỏng vấn
- `GET /slots` - Xem các khung giờ phỏng vấn
- `POST /confirm` - Xác nhận lịch phỏng vấn
- `POST /reminder` - Gửi nhắc nhở phỏng vấn

#### Feedback System (`/api/applications/:id/feedback`)

- `POST /employer` - Nhà tuyển dụng gửi đánh giá
- `POST /intern` - Ứng viên gửi đánh giá
- `GET /summary` - Xem tổng hợp đánh giá
- `PUT /update` - Cập nhật đánh giá
- `POST /response` - Phản hồi đánh giá

## AI & NLP Analysis

### CV Analysis (`/api/ai/cv`)

- `POST /analyze` - Phân tích CV toàn diện
- `GET /skills` - Trích xuất kỹ năng từ CV
- `GET /experience` - Phân tích kinh nghiệm
- `GET /education` - Phân tích học vấn
- `GET /recommendations` - Gợi ý cải thiện CV

### Job Description Analysis (`/api/ai/jobs`)

- `POST /analyze` - Phân tích yêu cầu công việc
- `GET /required-skills` - Trích xuất kỹ năng yêu cầu
- `GET /preferred-skills` - Trích xuất kỹ năng ưu tiên
- `GET /recommendations` - Gợi ý tối ưu JD
- `GET /similar-positions` - Tìm vị trí tương tự

### Matching Engine (`/api/ai/matching`)

- `POST /score` - Tính điểm phù hợp CV-JD
- `GET /skill-gaps` - Phân tích khoảng trống kỹ năng
- `GET /improvement-plan` - Đề xuất kế hoạch phát triển
- `GET /career-path` - Gợi ý lộ trình nghề nghiệp
- `GET /market-insights` - Phân tích xu hướng thị trường

## Internship Development

### Skill Roadmap (`/api/roadmaps`)

- `POST /generate` - Tạo lộ trình phát triển cá nhân hóa
- `GET /:id` - Xem chi tiết lộ trình
- `GET /:id/progress` - Theo dõi tiến độ phát triển
- `GET /:id/milestones` - Các cột mốc quan trọng
- `POST /:id/feedback` - Ghi nhận phản hồi về lộ trình

### Learning Resources (`/api/resources`)

- `GET /by-skill/:skillId` - Tài liệu theo kỹ năng
- `GET /recommended` - Tài liệu được gợi ý
- `GET /trending` - Tài liệu thịnh hành
- `POST /:id/completed` - Đánh dấu hoàn thành
- `POST /:id/feedback` - Đánh giá tài liệu

### Progress Tracking (`/api/progress`)

- `GET /overview` - Tổng quan tiến độ
- `GET /skills` - Tiến độ theo kỹ năng
- `GET /certificates` - Chứng chỉ đạt được
- `GET /achievements` - Thành tích đạt được
- `GET /recommendations` - Gợi ý cải thiện

### Mentorship (`/api/mentorship`)

- `GET /mentors` - Danh sách mentor
- `POST /sessions` - Đặt lịch mentoring
- `GET /sessions/:id` - Chi tiết phiên mentoring
- `POST /sessions/:id/feedback` - Đánh giá phiên mentoring
- `GET /recommendations` - Gợi ý mentor phù hợp

## Analytics Dashboard

### Intern Analytics (`/api/analytics/interns`)

- `GET /skill-progress` - Tiến độ phát triển kỹ năng
- `GET /application-stats` - Thống kê ứng tuyển
- `GET /interview-performance` - Hiệu suất phỏng vấn
- `GET /learning-patterns` - Mẫu hình học tập
- `GET /career-insights` - Góc nhìn nghề nghiệp

### Employer Analytics (`/api/analytics/employers`)

- `GET /intern-performance` - Hiệu suất thực tập sinh
- `GET /skill-gaps` - Phân tích thiếu hụt kỹ năng
- `GET /recruitment-funnel` - Phễu tuyển dụng
- `GET /retention-rate` - Tỷ lệ giữ chân
- `GET /program-effectiveness` - Hiệu quả chương trình

## Notifications

### Notification Routes (`/api/notifications`)

- `GET /` - Danh sách thông báo
- `PUT /:id/read` - Đánh dấu đã đọc
- `DELETE /:id` - Xóa thông báo
- `PUT /settings` - Cài đặt thông báo

## Admin Management

### Admin Routes (`/api/admin`)

- `GET /users` - Quản lý người dùng
- `GET /jobs` - Quản lý tin tuyển dụng
- `GET /applications` - Quản lý đơn ứng tuyển
- `GET /skills` - Quản lý kỹ năng
- `GET /analytics` - Báo cáo tổng quan
- `GET /settings` - Cài đặt hệ thống

## Communication

### Messaging Routes (`/api/messages`)

- `GET /conversations` - Danh sách cuộc trò chuyện
- `GET /conversations/:id` - Chi tiết cuộc trò chuyện
- `POST /conversations/:id/messages` - Gửi tin nhắn
- `PUT /messages/:id/read` - Đánh dấu tin nhắn đã đọc
- `DELETE /messages/:id` - Xóa tin nhắn
- `GET /unread` - Đếm tin nhắn chưa đọc

## Assessment Management

### Test Routes (`/api/tests`)

- `POST /` - Tạo bài test mới
- `GET /` - Danh sách bài test
- `GET /:id` - Chi tiết bài test
- `PUT /:id` - Cập nhật bài test
- `DELETE /:id` - Xóa bài test
- `POST /:id/assign` - Gán bài test cho ứng viên
- `GET /:id/results` - Xem kết quả bài test
- `POST /:id/submit` - Nộp bài test
- `GET /templates` - Mẫu bài test

## Company Reviews

### Review Routes (`/api/companies/:id/reviews`)

- `GET /` - Xem đánh giá công ty
- `POST /` - Thêm đánh giá mới
- `PUT /:reviewId` - Sửa đánh giá
- `DELETE /:reviewId` - Xóa đánh giá
- `POST /:reviewId/helpful` - Đánh dấu đánh giá hữu ích
- `POST /:reviewId/report` - Báo cáo đánh giá không phù hợp

## Recruitment Events

### Event Routes (`/api/events`)

- `GET /` - Danh sách sự kiện
- `POST /` - Tạo sự kiện mới
- `GET /:id` - Chi tiết sự kiện
- `PUT /:id` - Cập nhật sự kiện
- `DELETE /:id` - Xóa sự kiện
- `POST /:id/register` - Đăng ký tham gia
- `GET /:id/attendees` - Danh sách người tham gia
- `POST /:id/feedback` - Gửi phản hồi về sự kiện

### Location Routes (`/api/locations`)

- `GET /provinces` - Danh sách tỉnh/thành phố
- `GET /provinces/:id/districts` - Danh sách quận/huyện
- `GET /districts/:id/wards` - Danh sách phường/xã

### Industry Routes (`/api/industries`)

- `GET /` - Danh sách ngành nghề
- `GET /:id/jobs` - Việc làm theo ngành
- `GET /:id/companies` - Công ty theo ngành
- `GET /trending` - Ngành nghề thịnh hành

## Internship-Specific Features

### Program Management (`/api/programs`)

- `GET /` - Danh sách chương trình thực tập
- `GET /:id` - Chi tiết chương trình
- `POST /:id/apply` - Đăng ký chương trình
- `GET /upcoming` - Chương trình sắp mở
- `GET /recommended` - Chương trình phù hợp

### Skill Assessment (`/api/assessments`)

- `POST /technical` - Đánh giá kỹ năng chuyên môn
- `POST /soft-skills` - Đánh giá kỹ năng mềm
- `GET /history` - Lịch sử đánh giá
- `GET /improvement` - Đề xuất cải thiện
- `GET /certificates` - Chứng chỉ đạt được

### Career Guidance (`/api/career`)

- `GET /paths` - Lộ trình nghề nghiệp
- `GET /market-trends` - Xu hướng thị trường
- `GET /skill-demand` - Nhu cầu kỹ năng
- `GET /salary-insights` - Thông tin lương
- `GET /success-stories` - Câu chuyện thành công

### Internship Reports (`/api/reports`)

- `POST /weekly` - Báo cáo tuần
- `POST /monthly` - Báo cáo tháng
- `POST /final` - Báo cáo tổng kết
- `GET /templates` - Mẫu báo cáo
- `GET /feedback` - Phản hồi từ mentor

### Learning Paths (`/api/learning`)

- `GET /paths` - Lộ trình học tập
- `GET /courses` - Khóa học theo kỹ năng
- `GET /workshops` - Workshop/Training
- `POST /complete` - Hoàn thành bài học
- `GET /progress` - Theo dõi tiến độ
