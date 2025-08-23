# Email Verification System Guide

## Tổng quan
Hệ thống xác thực email hỗ trợ 2 phương thức:
1. **Click vào link trong email** (Khuyến nghị)
2. **Nhập mã OTP thủ công**

## Các URL Endpoints

### 1. Đăng ký tài khoản
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "fullName": "John Doe",
    "isEmailVerified": false
  }
}
```

### 2. Xác thực email bằng OTP
```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 3. Xác thực email bằng URL (Khuyến nghị)
```http
GET /api/auth/verify-email/{token}
```

**Ví dụ:**
```
GET /api/auth/verify-email/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cách hoạt động:**
1. User click vào link trong email
2. Server xác thực token
3. Redirect về frontend với status

### 4. Gửi lại OTP
```http
POST /api/auth/resend-otp
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

## Quy trình xác thực email

### Bước 1: Đăng ký
1. User gửi request đăng ký
2. Server tạo user với `isEmailVerified: false`
3. Server tạo OTP và verification token
4. Server gửi email với link xác thực

### Bước 2: Xác thực email
**Phương thức 1: Click link (Khuyến nghị)**
1. User click vào "Verify Email Address" trong email
2. Browser mở URL: `GET /api/auth/verify-email/{token}`
3. Server xác thực token và OTP
4. Server redirect về frontend: `{frontend_url}/email-verified?success=true&token={login_token}`

**Phương thức 2: Nhập OTP**
1. User nhập mã OTP từ email
2. User gửi request: `POST /api/auth/verify-email`
3. Server xác thực OTP
4. Server trả về login token

### Bước 3: Đăng nhập
Sau khi xác thực thành công, user có thể đăng nhập:
```http
POST /api/auth/login
```

## Email Template

Email xác thực bao gồm:
- **Header** với logo và tên platform
- **Nút "Verify Email Address"** (link chính)
- **Mã OTP** (phương thức dự phòng)
- **Hướng dẫn bảo mật**
- **Footer** với thông tin liên hệ

### Ví dụ email:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 28px;">Email Verification</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Internship Recruitment Platform</p>
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to our platform!</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
      Thank you for registering with us. To complete your registration, please verify your email address by clicking the button below:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/api/auth/verify-email/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold; 
                display: inline-block;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      <strong>Alternative method:</strong> If the button doesn't work, you can also verify using this code:
    </p>
    
    <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333; letter-spacing: 3px;">
        123456
      </p>
    </div>
  </div>
</div>
```

## Cấu hình Frontend

### 1. Tạo trang Email Verified
Tạo route `/email-verified` trong frontend để xử lý redirect:

```javascript
// React Router example
<Route path="/email-verified" component={EmailVerifiedPage} />
```

### 2. Xử lý URL Parameters
```javascript
// React example
import { useSearchParams } from 'react-router-dom';

function EmailVerifiedPage() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (success === 'true' && token) {
      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      // Redirect đến dashboard
      navigate('/dashboard');
    } else if (success === 'false') {
      // Hiển thị thông báo lỗi
      setError(error || 'Verification failed');
    }
  }, [success, token, error]);

  return (
    <div>
      {success === 'true' ? (
        <div>
          <h1>Email Verified Successfully!</h1>
          <p>You will be redirected to dashboard...</p>
        </div>
      ) : (
        <div>
          <h1>Verification Failed</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}
```

## Bảo mật

### 1. Token Security
- Verification token có thời hạn 10 phút
- Token chứa email và OTP được mã hóa
- Sử dụng JWT_SECRET để ký token

### 2. OTP Security
- OTP 6 chữ số ngẫu nhiên
- Thời hạn 10 phút
- Xóa OTP sau khi xác thực thành công

### 3. Rate Limiting
- Giới hạn số lần gửi OTP
- Giới hạn số lần thử xác thực

## Error Handling

### 1. Token Expired
```json
{
  "success": false,
  "error": "OTP has expired"
}
```

### 2. Invalid Token
```json
{
  "success": false,
  "error": "Invalid OTP"
}
```

### 3. Email Already Verified
```json
{
  "success": false,
  "error": "Email is already verified"
}
```

## Testing

### 1. Test đăng ký
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

### 2. Test xác thực bằng OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### 3. Test gửi lại OTP
```bash
curl -X POST http://localhost:3000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

## Troubleshooting

### 1. Email không nhận được
- Kiểm tra cấu hình SMTP
- Kiểm tra spam folder
- Kiểm tra email address

### 2. Link không hoạt động
- Kiểm tra FRONTEND_URL trong .env
- Kiểm tra token có hợp lệ không
- Kiểm tra token có hết hạn không

### 3. OTP không đúng
- Kiểm tra OTP trong database
- Kiểm tra thời gian hết hạn
- Thử gửi lại OTP
