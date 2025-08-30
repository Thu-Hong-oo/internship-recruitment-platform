# Hướng dẫn Test Google OAuth

## 🎯 Tổng quan
Hướng dẫn này sẽ giúp bạn test chức năng đăng ký/đăng nhập bằng Google OAuth trong hệ thống.

## 📋 Yêu cầu trước khi test

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env` từ `env_config.txt` và thêm:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### 3. Setup Google OAuth Credentials

#### Bước 1: Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable các API cần thiết:
   - Google+ API
   - Google OAuth2 API

#### Bước 2: Tạo OAuth 2.0 Credentials
1. Vào "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Chọn "Web application"
4. Cấu hình:
   - **Name**: Internship AI Platform
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `http://localhost:3001`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback`
     - `http://localhost:3001/auth/google/callback`

#### Bước 3: Lấy Credentials
- Copy **Client ID** và **Client Secret**
- Thêm vào file `.env`

## 🧪 Các cách test

### Cách 1: Sử dụng file HTML (Khuyến nghị)

#### Bước 1: Khởi động server
```bash
npm start
```

#### Bước 2: Mở file test
1. Mở file `test-google-oauth.html` trong trình duyệt
2. Nhập Google Client ID vào ô cấu hình
3. Click "Lưu cấu hình"

#### Bước 3: Test đăng nhập
1. Click nút "Sign in with Google"
2. Chọn tài khoản Google
3. Xem kết quả trong phần "Result"

#### Bước 4: Test các chức năng khác
- Click "Test Protected Endpoint" để test API `/api/auth/me`
- Thử đăng nhập lại với cùng tài khoản để test login
- Thử đăng nhập với tài khoản khác để test register

### Cách 2: Sử dụng Postman

#### Bước 1: Import collection
1. Mở Postman
2. Import file `postman_collection.json`
3. Import file `postman_environment.json`

#### Bước 2: Setup environment
1. Chọn environment "Internship AI Platform"
2. Cập nhật `base_url` và `api_url` nếu cần

#### Bước 3: Test endpoints
1. **Health Check**: `GET {{base_url}}/health`
2. **Google OAuth**: `POST {{api_url}}/auth/google`
   - Body: `{"idToken": "your-google-id-token"}`
3. **Get Current User**: `GET {{api_url}}/auth/me`
4. **Link Google**: `POST {{api_url}}/auth/link-google`
5. **Unlink Google**: `DELETE {{api_url}}/auth/unlink-google`

### Cách 3: Sử dụng script Node.js

#### Bước 1: Cài đặt axios
```bash
npm install axios
```

#### Bước 2: Lấy Google ID token
1. Sử dụng file `test-google-oauth.html` để lấy token
2. Copy token từ console hoặc response

#### Bước 3: Cập nhật script
1. Mở file `test-google-oauth.js`
2. Thay thế `TEST_GOOGLE_ID_TOKEN` bằng token thực

#### Bước 4: Chạy test
```bash
node test-google-oauth.js
```

## 🔍 Test Cases

### 1. Test đăng ký tài khoản mới
- **Mục đích**: Tạo tài khoản mới bằng Google OAuth
- **Bước thực hiện**:
  1. Sử dụng tài khoản Google chưa đăng ký
  2. Thực hiện đăng nhập Google
  3. Kiểm tra user được tạo với `authMethod: 'google'`
  4. Kiểm tra `isNew: true`

### 2. Test đăng nhập tài khoản có sẵn
- **Mục đích**: Đăng nhập với tài khoản đã tồn tại
- **Bước thực hiện**:
  1. Sử dụng tài khoản Google đã đăng ký
  2. Thực hiện đăng nhập Google
  3. Kiểm tra `isNew: false`
  4. Kiểm tra thông tin user trả về đúng

### 3. Test link Google account
- **Mục đích**: Liên kết tài khoản Google với tài khoản local
- **Bước thực hiện**:
  1. Tạo tài khoản local bằng email/password
  2. Đăng nhập với tài khoản local
  3. Sử dụng Google OAuth với cùng email
  4. Kiểm tra `authMethod` chuyển thành `'hybrid'`

### 4. Test unlink Google account
- **Mục đích**: Hủy liên kết tài khoản Google
- **Bước thực hiện**:
  1. Đăng nhập với tài khoản hybrid
  2. Gọi API unlink Google
  3. Kiểm tra `authMethod` chuyển thành `'local'`

### 5. Test error cases
- **Invalid token**: Sử dụng token không hợp lệ
- **Duplicate Google account**: Thử link Google account đã được sử dụng
- **Unlink only auth method**: Thử unlink khi Google là phương thức duy nhất

## 📊 Expected Results

### Response format cho Google OAuth
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "fullName": "John Doe",
    "avatar": "profile_picture_url",
    "isEmailVerified": true,
    "authMethod": "google"
  },
  "isNew": false
}
```

### Error responses
```json
{
  "success": false,
  "error": "Invalid Google ID token"
}
```

```json
{
  "success": false,
  "error": "This Google account is already linked to another user"
}
```

## 🐛 Troubleshooting

### Lỗi thường gặp

#### 1. "Invalid Google ID token"
- **Nguyên nhân**: Client ID không đúng hoặc token đã hết hạn
- **Giải pháp**: 
  - Kiểm tra GOOGLE_CLIENT_ID trong .env
  - Lấy token mới từ Google

#### 2. "Cannot find module '../services/googleAuth'"
- **Nguyên nhân**: File googleAuth.js chưa được tạo
- **Giải pháp**: Đảm bảo file `src/services/googleAuth.js` tồn tại

#### 3. "Google account already linked"
- **Nguyên nhân**: Tài khoản Google đã được sử dụng
- **Giải pháp**: Sử dụng tài khoản Google khác hoặc unlink trước

#### 4. CORS errors
- **Nguyên nhân**: Frontend domain không được authorize
- **Giải pháp**: Thêm domain vào Authorized JavaScript origins

### Debug mode
Để bật debug logging, thêm vào `.env`:
```env
LOG_LEVEL=debug
```

## 📝 Notes

1. **Token expiration**: Google ID tokens có thời hạn 1 giờ
2. **Rate limiting**: Google có giới hạn số request
3. **Production**: Cần HTTPS và domain verification
4. **Security**: Không bao giờ commit credentials vào git

## 🎉 Success Criteria

Test được coi là thành công khi:
- ✅ Có thể đăng ký tài khoản mới bằng Google
- ✅ Có thể đăng nhập với tài khoản có sẵn
- ✅ Có thể link/unlink Google account
- ✅ JWT token được tạo và hoạt động
- ✅ User data được lưu đúng trong database
- ✅ Error handling hoạt động đúng

