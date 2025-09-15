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
- `POST /resend-verification` - Gửi lại mã xác thực email
- `POST /refresh-token` - Làm mới access token
- `POST /logout` - Đăng xuất
- `GET /me` - Lấy thông tin người dùng hiện tại //Thường dùng để kiểm tra trạng thái đăng nhập
  Data: id, email, role, auth status, etc. -`GET /unverified-account`:

## User Management

### User Routes (`/api/users`)

- `GET /profile` - Lấy thông tin profile
- `PUT /profile` - Cập nhật profile
- `PUT /password` - Đổi mật khẩu
- `POST /avatar` - Upload avatar
- `PUT /preferences` - Cập nhật tùy chọn người dùng

## Public Profiles

- `GET /users/:id` - Lấy BaseUser (thông tin cơ bản) cho mọi role đã đăng nhập
- `GET /users/:id/public-profile` - Chỉ employer/admin. Trả về thông tin công khai của ứng viên; `resume.current.url` chỉ hiện khi công ty đã xác thực hoặc có quan hệ tuyển dụng hợp lệ

### Candidate Routes (`/api/candidate`)

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
  - Lưu ý quyền: recruiter/hr_manager cần `canPostJobs` để tạo/sửa/đổi trạng thái tin; interviewer không được đăng/sửa

#### Application Management

- `GET /applications` - Xem danh sách ứng viên
- `PUT /applications/:id/status` - Cập nhật trạng thái ứng viên
- `GET /applications/:id/cv` - Xem CV ứng viên
- `GET /applications/stats` - Thống kê ứng tuyển
  - Lưu ý quyền: recruiter đổi trạng thái cần `canChangeStatus`; interviewer đặt/đổi/hủy lịch cần `canScheduleInterview`

#### Analytics & Reports

- `GET /analytics/overview` - Tổng quan hoạt động
- `GET /analytics/recruitment` - Thống kê tuyển dụng
- `GET /analytics/candidates` - Phân tích ứng viên
- `GET /reports/monthly` - Báo cáo tháng
- `GET /reports/export` - Xuất báo cáo

#### Team Management

- `GET /team/members` - Danh sách thành viên (owner/admin)
- `POST /team/invite` - Mời thành viên mới (owner/admin)
- `POST /team/invite/accept` - Người được mời chấp nhận tham gia team
- `PUT /team/members/:id/role` - Cập nhật vai trò (owner/admin)
- `PUT /team/members/:id/permissions` - Cập nhật quyền granular (owner/admin)
- `DELETE /team/members/:id` - Xóa thành viên (owner/admin)
- `GET /team/roles` - Danh sách role và matrix quyền
- `GET /team/me/permissions` - Quyền thực tế của user trong team

> Quyền gợi ý: `canPostJobs`, `canViewApplications`, `canChangeStatus`, `canScheduleInterview`, `canExportReports`.

#### Company Verification

- `POST /verification` - Gửi hồ sơ xác thực công ty
- `GET /verification/status` - Trạng thái xác thực
  > Một số dữ liệu (VD: resume URL) chỉ hiển thị khi công ty đã xác thực hoặc có quan hệ tuyển dụng hợp lệ

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
- `GET /unread-count` - Đếm thông báo chưa đọc
- `PUT /:id/archive` - Lưu trữ/ẩn thông báo

## Admin Management

### Admin Routes (`/api/admin`)

- `GET /users` - Quản lý người dùng
- `GET /jobs` - Quản lý tin tuyển dụng
- `GET /applications` - Quản lý đơn ứng tuyển
- `GET /skills` - Quản lý kỹ năng
- `GET /analytics` - Báo cáo tổng quan
- `GET /settings` - Cài đặt hệ thống
- `PUT /users/:id/role` - Cập nhật vai trò người dùng
- `PUT /users/:id/status` - Kích hoạt/Vô hiệu hóa tài khoản
- `GET /employers/pending` - Danh sách công ty chờ xác thực
- `PUT /employers/:id/verify` - Duyệt xác thực công ty
- `GET /audit-logs` - Nhật ký hệ thống
- `GET /system-health` - Tình trạng hệ thống

## Moderation (moderator)

### Moderation Routes (`/api/moderation`)

- `GET /reports` - Danh sách báo cáo nội dung
- `PUT /reports/:id/resolve` - Xử lý báo cáo
- `PUT /reviews/:id/hide` - Ẩn/bật đánh giá
- `DELETE /reviews/:id` - Xóa đánh giá vi phạm
- `GET /logs` - Nhật ký xử lý
