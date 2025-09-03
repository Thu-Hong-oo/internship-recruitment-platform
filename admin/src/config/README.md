# Hệ thống Menu theo Role - Role-based Menu System

Hệ thống menu được thiết kế để hiển thị các chức năng khác nhau dựa trên role của người dùng.

## 🏗️ Cấu trúc Menu

### 1. Admin Menu (`adminMenuConfig.jsx`)
**Quyền**: Quản lý toàn bộ hệ thống
**Menu chính**:
- **Trang chủ**: Dashboard tổng quan
- **Quản lý tài khoản**: Quản lý tất cả tài khoản trong hệ thống
- **Quản lý công ty**: Quản lý thông tin và hoạt động của các công ty
- **Quản lý bài đăng**: Duyệt và quản lý tất cả bài đăng tuyển dụng
- **Quản lý ứng viên**: Quản lý thông tin ứng viên và đơn ứng tuyển
- **Quản lý bài thi**: Tạo và quản lý bài thi, câu hỏi, kết quả
- **Lịch sử giao dịch**: Theo dõi tất cả giao dịch trong hệ thống
- **Quản lý Media**: Quản lý kho tài liệu, hình ảnh, video

### 2. Company Menu (`companyMenuConfig.jsx`)
**Quyền**: Quản lý tuyển dụng cho công ty
**Menu chính**:
- **Trang chủ**: Dashboard công ty với thống kê tuyển dụng
- **Quản lý tuyển dụng**: Đăng bài, quản lý bài đăng, thống kê
- **Quản lý ứng viên**: Xem đơn ứng tuyển, lên lịch phỏng vấn
- **Hồ sơ công ty**: Thông tin công ty, cài đặt, gói dịch vụ
- **Kho Media**: Quản lý tài liệu tuyển dụng

### 3. Candidate Menu (`candidateMenuConfig.jsx`)
**Quyền**: Tìm việc và quản lý ứng tuyển
**Menu chính**:
- **Trang chủ**: Dashboard ứng viên với thống kê ứng tuyển
- **Tìm việc làm**: Tìm kiếm, lưu việc làm, gợi ý việc làm
- **Đơn ứng tuyển**: Theo dõi trạng thái, lịch phỏng vấn
- **Hồ sơ cá nhân**: CV, kỹ năng, kinh nghiệm, học vấn
- **Học tập & Phát triển**: Khóa học, chứng chỉ, bài đánh giá

## 🔄 Cách hoạt động

### 1. Chọn Role
- Người dùng có thể chọn role thông qua `DashboardSelector`
- Role được lưu vào `localStorage` với key `userRole`
- Các giá trị có thể: `admin`, `company`, `candidate`

### 2. Hiển thị Menu
- `SideMenu` component sẽ đọc role từ `localStorage`
- Chọn menu config tương ứng với role
- Render menu items theo config đã chọn

### 3. Routing
- `AppRouter` sẽ tạo routes cho tất cả menu config
- Mỗi route sẽ có element component tương ứng
- Bảo vệ route thông qua `ProtectedRoute`

## 🎯 Tính năng chính

### Role Switching
- Chuyển đổi giữa các role trong dashboard
- Menu tự động cập nhật theo role mới
- Lưu trữ role selection trong localStorage

### Dynamic Menu
- Menu items thay đổi theo role
- Icon và label phù hợp với từng role
- Nested menu với children items

### Responsive Design
- Menu hoạt động tốt trên mobile và desktop
- Collapsible sidebar với animation
- Active state cho menu items

## 🔧 Customization

### Thêm Menu Item mới
1. Tạo component mới trong thư mục pages
2. Import vào menu config tương ứng
3. Thêm item vào children array
4. Cập nhật routing nếu cần

### Thay đổi Icon
1. Thêm icon mới vào `Icons.jsx`
2. Import và sử dụng trong menu config
3. Icon sẽ tự động có active state

### Thay đổi Permission
1. Chỉnh sửa logic trong `SideMenu.jsx`
2. Thêm role check cho menu items
3. Có thể ẩn/hiện menu items theo permission

## 📱 Responsive Features

- **Mobile**: Menu collapse thành hamburger
- **Tablet**: Menu hiển thị với icon và label ngắn
- **Desktop**: Menu đầy đủ với icon, label và children

## 🚀 Future Enhancements

- **Permission-based Menu**: Kiểm soát chi tiết hơn về quyền truy cập
- **Dynamic Menu Loading**: Load menu từ API thay vì hardcode
- **Menu Caching**: Cache menu config để tăng performance
- **Multi-language Support**: Hỗ trợ đa ngôn ngữ cho menu
- **Menu Analytics**: Theo dõi usage của từng menu item
