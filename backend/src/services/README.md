# Services Directory

Thư mục này chứa các service layer của ứng dụng.

## Active Services:

### Core Services:

- **`otpService.js`** - Quản lý OTP (One-Time Password) với Redis
- **`otpCooldownService.js`** - Quản lý cooldown cho OTP requests
- **`emailService.js`** - Gửi email (verification, password reset, etc.)

### Authentication Services:

- **`googleAuth.js`** - Xử lý Google OAuth authentication

### File & Media Services:

- **`cloudinaryService.js`** - Upload và quản lý file với Cloudinary
- **`imageUploadService.js`** - Xử lý upload hình ảnh

### AI Services:

- **`aiService.js`** - Các tính năng AI (CV analysis, job matching, etc.)

### Notification Services:

- **`notificationService.js`** - Gửi và quản lý notifications (real-time + database)

## Đã xóa:

- ~~`chatbot.js`~~ - Không được sử dụng
- ~~`aiFilter.js`~~ - Không được sử dụng
- ~~`jobRecommendation.js`~~ - Không được sử dụng
- ~~`notificationServide.js`~~ - Lỗi chính tả, đã đổi tên thành `notificationService.js`

## Usage Pattern:

```javascript
// Import service
const EmailService = require('../services/emailService');
const OTPService = require('../services/otpService');

// Use service
await EmailService.sendVerificationEmail(user, token);
```
