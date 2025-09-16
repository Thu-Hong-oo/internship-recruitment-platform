# Test Cases cho Đăng nhập

## Các trường hợp test đăng nhập

### 1. Đăng nhập thành công

- **Email**: `admin@internship.com`
- **Password**: `admin123`
- **Kết quả mong đợi**:
  - Hiển thị "Đăng nhập thành công!"
  - Redirect đến `/admin/dashboard`
  - Token và user info được lưu vào storage

### 2. Đăng nhập thất bại - Sai mật khẩu

- **Email**: `admin@internship.com`
- **Password**: `wrongpassword`
- **Kết quả mong đợi**:
  - Hiển thị ErrorMessage với lý do "Mật khẩu không chính xác"
  - Không redirect
  - Form vẫn hiển thị

### 3. Đăng nhập thất bại - Email không tồn tại

- **Email**: `nonexistent@internship.com`
- **Password**: `anypassword`
- **Kết quả mong đợi**:
  - Hiển thị ErrorMessage với lý do "Tài khoản không tồn tại"
  - Không redirect

### 4. Đăng nhập thất bại - Email không hợp lệ

- **Email**: `invalid-email`
- **Password**: `anypassword`
- **Kết quả mong đợi**:
  - Validation error "Email không hợp lệ"
  - Không gọi API

### 5. Đăng nhập thất bại - Mật khẩu quá ngắn

- **Email**: `admin@internship.com`
- **Password**: `123`
- **Kết quả mong đợi**:
  - Validation error "Mật khẩu phải có ít nhất 6 ký tự"
  - Không gọi API

### 6. Đăng nhập thất bại - Server không phản hồi

- **Kết quả mong đợi**:
  - Hiển thị ErrorMessage "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"

### 7. Đăng nhập thất bại - Server lỗi 500

- **Kết quả mong đợi**:
  - Hiển thị ErrorMessage "Lỗi server. Vui lòng thử lại sau!"

### 8. Truy cập trang bảo vệ khi chưa đăng nhập

- **Hành động**: Truy cập trực tiếp `/admin/dashboard` khi chưa đăng nhập
- **Kết quả mong đợi**:
  - Redirect về `/login`
  - Hiển thị loading "Đang kiểm tra quyền truy cập..."

### 9. Truy cập trang login khi đã đăng nhập

- **Hành động**: Truy cập `/login` khi đã đăng nhập
- **Kết quả mong đợi**:
  - Redirect về `/admin/dashboard`

### 10. Token hết hạn

- **Hành động**: Token JWT hết hạn
- **Kết quả mong đợi**:
  - Tự động xóa token
  - Redirect về `/login`

## Các tính năng bảo mật

### 1. ProtectedRoute

- ✅ Kiểm tra token tồn tại
- ✅ Kiểm tra token hợp lệ (JWT decode)
- ✅ Kiểm tra token chưa hết hạn
- ✅ Loading state khi kiểm tra
- ✅ Tự động xóa token hết hạn

### 2. AuthGuard

- ✅ Chặn truy cập trang login khi đã đăng nhập
- ✅ Redirect về dashboard

### 3. Error Handling

- ✅ Hiển thị lý do cụ thể khi đăng nhập thất bại
- ✅ Phân loại lỗi (mật khẩu, tài khoản, kết nối, server)
- ✅ Loading state khi đang đăng nhập
- ✅ Có thể đóng thông báo lỗi

### 4. Form Validation

- ✅ Email bắt buộc và phải hợp lệ
- ✅ Mật khẩu bắt buộc và tối thiểu 6 ký tự
- ✅ Button disabled khi thiếu thông tin hoặc đang loading

## Cách test

1. **Mở Developer Tools** (F12)
2. **Vào tab Network** để xem API calls
3. **Test từng trường hợp** theo danh sách trên
4. **Kiểm tra Console** để xem có lỗi JavaScript không
5. **Kiểm tra Local Storage** để xem token và user info


