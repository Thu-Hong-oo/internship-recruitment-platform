# Dữ liệu đăng nhập - Login Data

File này chứa dữ liệu mẫu cho 3 vai trò khác nhau trong hệ thống.

## 🔑 Thông tin đăng nhập

### 1. Admin User
- **Số điện thoại**: `0123456789`
- **Mật khẩu**: `123456`
- **Vai trò**: `admin`
- **Quyền**: Quản lý toàn bộ hệ thống
- **Tên**: Admin User
- **Email**: admin@globalcare.vn

### 2. Company User
- **Số điện thoại**: `0987654321`
- **Mật khẩu**: `123456`
- **Vai trò**: `company`
- **Quyền**: Quản lý tuyển dụng cho công ty
- **Tên**: Company User
- **Email**: company@globalcare.vn
- **Tên công ty**: FPT Software

### 3. Candidate User
- **Số điện thoại**: `0369852147`
- **Mật khẩu**: `123456`
- **Vai trò**: `candidate`
- **Quyền**: Tìm việc và quản lý ứng tuyển
- **Tên**: Candidate User
- **Email**: candidate@globalcare.vn
- **Kỹ năng**: React, JavaScript, Node.js
- **Kinh nghiệm**: 1 năm

## 🚀 Cách sử dụng

### 1. Đăng nhập
1. Mở trang đăng nhập
2. Nhập số điện thoại và mật khẩu tương ứng với vai trò muốn test
3. Chọn "Nhớ đăng nhập" nếu muốn lưu thông tin
4. Click "Đăng nhập"

### 2. Chuyển đổi vai trò
- Sau khi đăng nhập, bạn có thể chuyển đổi giữa các vai trò trong Dashboard
- Mỗi vai trò sẽ có menu và dashboard khác nhau
- Thông tin user sẽ được lưu trong localStorage hoặc sessionStorage

### 3. Test các chức năng
- **Admin**: Test quản lý toàn bộ hệ thống
- **Company**: Test quản lý tuyển dụng
- **Candidate**: Test tìm việc và ứng tuyển

## 🔧 Cấu trúc dữ liệu

### User Object
```javascript
{
  id: number,
  phone: string,
  password: string,
  role: "admin" | "company" | "candidate",
  name: string,
  email: string,
  avatar: string,
  permissions: string[],
  // Các trường bổ sung theo role
  companyName?: string,    // Cho company
  skills?: string[],       // Cho candidate
  experience?: string      // Cho candidate
}
```

### Permissions theo Role
- **Admin**: `["all"]` - Tất cả quyền
- **Company**: `["jobs", "candidates", "company-profile", "media"]`
- **Candidate**: `["jobs", "applications", "profile", "learning"]`

## 📱 Lưu trữ thông tin

### localStorage (Nhớ đăng nhập)
- `accessToken`: Token xác thực
- `userRole`: Vai trò của user
- `userInfo`: Thông tin chi tiết user
- `saved_phone`: Số điện thoại đã lưu

### sessionStorage (Không nhớ đăng nhập)
- `accessToken`: Token xác thực
- `userRole`: Vai trò của user
- `userInfo`: Thông tin chi tiết user

## 🚨 Lưu ý bảo mật

⚠️ **Chỉ sử dụng cho mục đích development và testing**

- Mật khẩu được hardcode trong code
- Không có mã hóa
- Không sử dụng cho production

## 🔄 Tích hợp với API thật

Khi tích hợp với API thật, thay thế:

```javascript
// Thay vì sử dụng authenticateUser
const authResult = authenticateUser(phone, password);

// Sử dụng API call
const response = await apiLogin(phone, password);
if (response.success) {
  // Xử lý đăng nhập thành công
}
```

## 📝 Thêm user mới

Để thêm user mới, cập nhật array `users`:

```javascript
{
  id: 4,
  phone: "0123456780",
  password: "123456",
  role: "company",
  name: "New Company",
  email: "newcompany@example.com",
  avatar: "/icons/accounts/user-profile.svg",
  companyName: "New Company Ltd",
  permissions: ["jobs", "candidates", "company-profile", "media"]
}
```
