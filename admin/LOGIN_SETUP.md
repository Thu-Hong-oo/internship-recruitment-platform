# Hướng dẫn cấu hình đăng nhập

## Tổng quan

Chức năng đăng nhập đã được cập nhật để sử dụng API thực tế từ backend thay vì dữ liệu giả.

## API Endpoint

- **URL**: `http://localhost:3000/api/auth/login`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "email": "admin@internship.com",
    "password": "admin123"
  }
  ```

## Response

### Thành công:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68b96ffdfa143942876b35bc",
    "email": "admin@internship.com",
    "role": "admin",
    "fullName": "Chưa cập nhật",
    "isEmailVerified": true,
    "authMethod": "local",
    "profile": {
      "avatar": ""
    }
  }
}
```

### Thất bại:

```json
{
  "success": false,
  "error": "Mật khẩu không chính xác",
  "errorType": "INVALID_PASSWORD"
}
```

## Các thay đổi đã thực hiện

### 1. Tạo API Client (`admin/src/api/auth.js`)

- Hàm `login()` để gọi API đăng nhập
- Hàm `logout()` để xóa thông tin user
- Hàm `verifyToken()` để kiểm tra token

### 2. Cập nhật Form Login (`admin/src/pages/login/index.jsx`)

- Thay đổi từ `phone` sang `email`
- Thêm validation cho email và password
- Tích hợp API thực tế thay vì dữ liệu giả
- Xử lý response thành công và lỗi

### 3. Cập nhật Axios Client (`admin/src/api/axiosClient.js`)

- Cấu hình base URL: `http://localhost:3000/api`
- Thêm interceptor để tự động gửi token trong header
- Xử lý lỗi 401 để redirect về login

### 4. Tạo UserProfile Component (`admin/src/components/UserProfile.jsx`)

- Hiển thị thông tin user
- Dropdown menu với tùy chọn đăng xuất
- Tích hợp với authAPI.logout()

### 5. Cập nhật MainLayout (`admin/src/layouts/MainLayout.jsx`)

- Sử dụng UserProfile component
- Loại bỏ code cũ không cần thiết

## Cách sử dụng

1. **Đăng nhập**:

   - Nhập email: `admin@internship.com`
   - Nhập password: `admin123`
   - Chọn "Nhớ đăng nhập" nếu muốn lưu thông tin

2. **Sau khi đăng nhập thành công**:

   - Token và thông tin user được lưu vào localStorage/sessionStorage
   - Tự động chuyển hướng đến `/admin/dashboard`
   - Hiển thị thông tin user trong sidebar

3. **Đăng xuất**:
   - Click vào avatar user trong sidebar
   - Chọn "Đăng xuất" từ dropdown menu

## Bảo mật

- Token được tự động gửi trong header Authorization cho các API calls
- Token được xóa khi đăng xuất hoặc gặp lỗi 401
- ProtectedRoute kiểm tra token trước khi cho phép truy cập các trang admin

## Lưu ý

- Đảm bảo backend server đang chạy trên `http://localhost:3000`
- API endpoint `/api/auth/login` phải hoạt động đúng
- Token JWT được sử dụng để xác thực các request tiếp theo


