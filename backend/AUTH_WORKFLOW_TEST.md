# 🔐 Test Quy trình Authentication Mới

## 📋 Quy trình đúng (đã sửa)

### 1. Đăng ký tài khoản
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Tên",
  "lastName": "Họ",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Tên",
    "lastName": "Họ",
    "role": "student",
    "fullName": "Tên Họ",
    "authMethod": "local",
    "isEmailVerified": false
  },
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
}
```

**Lưu ý:** KHÔNG có token trong response!

### 2. Thử đăng nhập (sẽ thất bại)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": false,
  "error": "Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập.",
  "errorType": "EMAIL_NOT_VERIFIED",
  "requiresEmailVerification": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Tên",
    "lastName": "Họ",
    "role": "student",
    "fullName": "Tên Họ",
    "isEmailVerified": false,
    "authMethod": "local"
  }
}
```

### 3. Gửi lại OTP (không cần token)
```bash
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email xác thực đã được gửi thành công"
}
```

### 4. Xác thực email với OTP
```bash
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác thực email thành công",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Tên",
    "lastName": "Họ",
    "role": "student",
    "fullName": "Tên Họ",
    "isEmailVerified": true
  }
}
```

### 5. Đăng nhập thành công (sau khi verify)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Tên",
    "lastName": "Họ",
    "role": "student",
    "fullName": "Tên Họ",
    "avatar": "",
    "isEmailVerified": true,
    "authMethod": "local"
  }
}
```

## ✅ Lợi ích của quy trình mới

1. **Bảo mật cao:** Token chỉ có sau khi đăng nhập thành công
2. **Logic đúng:** Verify email không cần token
3. **User friendly:** Có thể resend OTP bất cứ lúc nào
4. **Chuẩn industry:** Giống Gmail, Facebook
5. **Không bị locked out:** User luôn có thể tiếp tục quá trình

## 🔄 So sánh trước và sau

| Trước (sai) | Sau (đúng) |
|-------------|------------|
| ❌ Register trả token | ✅ Register KHÔNG trả token |
| ❌ Resend cần token | ✅ Resend không cần token |
| ❌ Logic ngược đời | ✅ Logic đúng chuẩn |
| ❌ User có thể bị locked out | ✅ User không bao giờ bị locked out |

## 🧪 Test Cases

### Test Case 1: OTP hết hạn
1. Đăng ký → nhận OTP
2. Đợi 10 phút (OTP hết hạn)
3. Gọi resend-verification → nhận OTP mới
4. Verify với OTP mới → thành công

### Test Case 2: Nhập sai OTP nhiều lần
1. Đăng ký → nhận OTP
2. Nhập sai OTP → lỗi
3. Gọi resend-verification → nhận OTP mới
4. Verify với OTP mới → thành công

### Test Case 3: Email đã verify
1. Đăng ký → verify email → thành công
2. Gọi resend-verification → lỗi "Email đã được xác thực"

### Test Case 4: Rate limiting
1. Gọi resend-verification liên tục
2. Nhận lỗi rate limit sau 5 lần trong 15 phút
3. Đợi cooldown → gọi lại → thành công
