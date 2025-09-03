# Hướng dẫn Test Hệ thống Dashboard

## 🚀 Cách chạy và test

### 1. Khởi động project
```bash
npm run dev
```

### 2. Truy cập ứng dụng
Mở trình duyệt và truy cập: `http://localhost:5173`

## 🔑 Thông tin đăng nhập

### Admin User
- **Số điện thoại**: `0123456789`
- **Mật khẩu**: `123456`
- **Vai trò**: Quản lý toàn bộ hệ thống

### Company User  
- **Số điện thoại**: `0987654321`
- **Mật khẩu**: `123456`
- **Vai trò**: Quản lý tuyển dụng công ty

### Candidate User
- **Số điện thoại**: `0369852147`
- **Mật khẩu**: `123456`
- **Vai trò**: Tìm việc và ứng tuyển

## 📋 Quy trình test

### Bước 1: Đăng nhập
1. Mở trang đăng nhập
2. Nhập số điện thoại và mật khẩu của một trong 3 vai trò
3. Chọn "Nhớ đăng nhập" (tùy chọn)
4. Click "Đăng nhập"

### Bước 2: Kiểm tra Dashboard
- Sau khi đăng nhập sẽ tự động chuyển đến `/dashboard`
- Dashboard sẽ hiển thị theo vai trò đã đăng nhập
- Menu bên trái sẽ thay đổi theo vai trò

### Bước 3: Test chuyển đổi vai trò
- Trong Dashboard, sử dụng các button để chuyển đổi giữa Admin/Company/Candidate
- Mỗi vai trò sẽ có menu và dashboard khác nhau

### Bước 4: Test các chức năng
- **Admin**: Test quản lý tài khoản, công ty, bài đăng, ứng viên, bài thi
- **Company**: Test quản lý tuyển dụng, ứng viên, hồ sơ công ty
- **Candidate**: Test tìm việc, đơn ứng tuyển, hồ sơ cá nhân

## 🎯 Các tính năng cần test

### ✅ Dashboard
- [ ] Hiển thị thống kê theo vai trò
- [ ] Biểu đồ và bảng dữ liệu
- [ ] Hành động nhanh

### ✅ Menu Navigation
- [ ] Menu thay đổi theo vai trò
- [ ] Submenu hoạt động đúng
- [ ] Active state cho menu items

### ✅ Role Switching
- [ ] Chuyển đổi giữa các vai trò
- [ ] Menu tự động cập nhật
- [ ] Dashboard thay đổi theo role

### ✅ Responsive Design
- [ ] Hoạt động tốt trên mobile
- [ ] Sidebar collapse/expand
- [ ] Layout responsive

## 🐛 Xử lý lỗi thường gặp

### Lỗi "Cannot find module"
- Chạy `npm install` để cài đặt dependencies
- Kiểm tra import paths trong code

### Lỗi routing
- Kiểm tra console để xem lỗi
- Đảm bảo tất cả components được export đúng

### Lỗi authentication
- Xóa localStorage và sessionStorage
- Đăng nhập lại với thông tin đúng

## 📱 Test trên các thiết bị

### Desktop
- Chrome, Firefox, Safari, Edge
- Các kích thước màn hình khác nhau

### Mobile
- Chrome Mobile
- Safari Mobile
- Test responsive breakpoints

### Tablet
- Test layout trung gian
- Kiểm tra navigation

## 🔍 Debug và Troubleshooting

### Console Logs
- Mở Developer Tools (F12)
- Kiểm tra Console tab
- Xem Network tab cho API calls

### Local Storage
- Mở Developer Tools > Application > Local Storage
- Kiểm tra các key: `userRole`, `userInfo`, `accessToken`

### React DevTools
- Cài đặt React Developer Tools extension
- Kiểm tra component state và props

## 📝 Ghi chú test

### Test Cases
- [ ] Đăng nhập với từng vai trò
- [ ] Chuyển đổi giữa các vai trò
- [ ] Test tất cả menu items
- [ ] Test responsive design
- [ ] Test logout và clear data

### Bug Reports
Ghi lại các lỗi gặp phải:
- Mô tả lỗi
- Các bước để reproduce
- Screenshot (nếu có)
- Console errors
- Browser và version

## 🎉 Kết quả mong đợi

Sau khi test thành công:
- ✅ Đăng nhập được với 3 vai trò
- ✅ Dashboard hiển thị đúng theo vai trò
- ✅ Menu thay đổi theo vai trò
- ✅ Có thể chuyển đổi giữa các vai trò
- ✅ Responsive design hoạt động tốt
- ✅ Không có lỗi console
- ✅ Logout hoạt động đúng

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console errors
2. Xem file README.md trong từng thư mục
3. Kiểm tra cấu trúc project
4. Đảm bảo tất cả dependencies đã cài đặt
