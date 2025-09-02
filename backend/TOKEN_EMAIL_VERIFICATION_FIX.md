# Token và Email Verification Fix

## Vấn đề đã được khắc phục

### Vấn đề cũ:
1. **Khi đăng ký**: User nhận được token ngay lập tức dù chưa xác thực email
2. **Token có thể sử dụng**: Token từ đăng ký có thể truy cập các route được bảo vệ
3. **Không xóa token cũ**: Khi xác thực email xong, token cũ vẫn còn hiệu lực

### Giải pháp đã áp dụng:

#### 1. Sửa đổi trong `authController.js`:

**Đăng ký (`register`):**
- ❌ **Trước**: Tạo token ngay khi đăng ký
- ✅ **Sau**: Không tạo token, chỉ trả về thông tin user

**Xác thực email (`verifyEmail`):**
- ❌ **Trước**: Chỉ cập nhật trạng thái `isEmailVerified`
- ✅ **Sau**: Tạo token mới sau khi xác thực thành công

#### 2. Thêm middleware mới:

**`requireEmailVerification`** trong `middleware/auth.js`:
- Kiểm tra `isEmailVerified` trước khi cho phép truy cập
- Trả về lỗi 403 nếu email chưa xác thực

#### 3. Áp dụng middleware cho các route quan trọng:

**Users routes:**
- `/api/users/upload-avatar` - Upload avatar
- `/api/users/profile` - Cập nhật profile
- `/api/users/password` - Đổi mật khẩu
- `/api/users/link-google` - Liên kết Google
- `/api/users/unlink-google` - Hủy liên kết Google

**Upload routes:**
- `/api/upload/single` - Upload ảnh đơn
- `/api/upload/multiple` - Upload nhiều ảnh
- `/api/upload/avatar` - Upload avatar
- `/api/upload/logo` - Upload logo công ty
- `/api/upload/:publicId` - Xóa ảnh
- `/api/upload/:publicId/info` - Thông tin ảnh

## Luồng hoạt động mới:

### 1. Đăng ký:
```
POST /api/auth/register
↓
Tạo user với isEmailVerified = false
↓
Gửi email xác thực
↓
Trả về user info (KHÔNG có token)
```

### 2. Xác thực email:
```
POST /api/auth/verify-email
↓
Kiểm tra OTP
↓
Cập nhật isEmailVerified = true
↓
Tạo token mới
↓
Trả về token + user info
```

### 3. Đăng nhập:
```
POST /api/auth/login
↓
Kiểm tra email đã xác thực chưa
↓
Nếu chưa: Trả về lỗi EMAIL_NOT_VERIFIED
↓
Nếu đã: Tạo token và cho phép đăng nhập
```

### 4. Truy cập route được bảo vệ:
```
Request với token
↓
Middleware protect: Kiểm tra token hợp lệ
↓
Middleware requireEmailVerification: Kiểm tra email đã xác thực
↓
Nếu chưa: Trả về lỗi 403
↓
Nếu đã: Cho phép truy cập
```

## Lợi ích:

1. **Bảo mật tốt hơn**: User không thể sử dụng token trước khi xác thực email
2. **Luồng logic rõ ràng**: Token chỉ được tạo sau khi email đã xác thực
3. **Kiểm soát truy cập**: Các tính năng quan trọng yêu cầu email xác thực
4. **Trải nghiệm người dùng**: Hướng dẫn user xác thực email trước khi sử dụng

## Testing:

### Test case 1: Đăng ký mới
```bash
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "123456",
  "firstName": "Test",
  "lastName": "User"
}
```
**Expected**: Response không có token, chỉ có user info

### Test case 2: Truy cập route được bảo vệ với token từ đăng ký
```bash
GET /api/users/me
Authorization: Bearer <token_from_register>
```
**Expected**: 403 error - Email chưa xác thực

### Test case 3: Xác thực email
```bash
POST /api/auth/verify-email
{
  "email": "test@example.com",
  "otp": "123456"
}
```
**Expected**: Response có token mới + user info

### Test case 4: Truy cập route với token mới
```bash
GET /api/users/me
Authorization: Bearer <token_from_verification>
```
**Expected**: 200 OK - Truy cập thành công
