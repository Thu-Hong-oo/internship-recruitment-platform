# 🚀 Setup Guide - AI Internship Platform

## 📋 Cấu hình ban đầu

### 1. **Tạo file .env**
Copy nội dung từ `env_config.txt` và tạo file `.env` trong thư mục backend:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Database Configuration
MONGO_URI=mongodb://localhost:27017/internship-ai-platform

# Redis Cloud Configuration
REDIS_URL=redis://default:x7NLmjv0VitpZpHWXUshCZbWqq9qJy3G@redis-10473.c114.us-east-1-4.ec2.redns.redis-cloud.com:10473

# JWT Configuration
JWT_SECRET=internship-ai-platform-super-secret-jwt-key-2024-very-long-and-secure
JWT_EXPIRE=30d

# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key-here

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. **Cài đặt dependencies**
```bash
npm install
```

### 3. **Khởi động server**
```bash
npm run dev
```

## 🎯 Test API với Postman

### **Import Collection & Environment**
1. Import `postman_collection.json`
2. Import `postman_environment.json`
3. Set environment: `Internship AI Platform - Development`

### **Test Flow được khuyến nghị:**

#### **Bước 1: Health Check**
```
GET {{api_url}}/health
```

#### **Bước 2: Register User**
```
POST {{api_url}}/auth/register
Content-Type: application/json

{
  "email": "thuhong523@gmail.com",
  "password": "123456",
  "firstName": "Nguyen Van",
  "lastName": "A",
  "role": "student"
}
```

#### **Bước 3: Login**
```
POST {{api_url}}/auth/login
Content-Type: application/json

{
  "email": "thuhong523@gmail.com",
  "password": "123456"
}
```

#### **Bước 4: Get Profile**
```
GET {{api_url}}/auth/me
Authorization: Bearer {{token}}
```

#### **Bước 5: Analyze CV (sau khi có token)**
```
POST {{api_url}}/ai/analyze-cv
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

[Upload PDF/DOC file as 'cv']
```

## 📁 Cấu trúc project hoàn chỉnh

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js     ✅ Hoàn thành
│   │   └── aiController.js       ✅ Hoàn thành
│   ├── models/
│   │   ├── User.js              ✅ Hoàn thành
│   │   ├── Job.js               ✅ Hoàn thành
│   │   └── Application.js       ✅ Hoàn thành
│   ├── routes/
│   │   ├── auth.js              ✅ Hoàn thành + Swagger
│   │   ├── ai.js                ✅ Hoàn thành + Swagger
│   │   ├── jobs.js              📝 Cơ bản (TODO)
│   │   ├── applications.js      📝 Cơ bản (TODO)
│   │   ├── users.js             📝 Cơ bản (TODO)
│   │   ├── roadmaps.js          📝 Cơ bản (TODO)
│   │   └── analytics.js         📝 Cơ bản (TODO)
│   ├── services/
│   │   └── aiService.js         ✅ Hoàn thành
│   ├── middleware/
│   │   ├── auth.js              ✅ Hoàn thành
│   │   └── errorHandler.js      ✅ Hoàn thành
│   ├── utils/
│   │   └── logger.js            ✅ Hoàn thành
│   └── socket.js                ✅ Hoàn thành (Real-time)
├── uploads/
│   └── cv/                      ✅ Đã tạo
├── logs/                        ✅ Đã tạo
├── server.js                    ✅ Hoàn thành
├── package.json                 ✅ Hoàn thành
├── .env                         📝 Cần tạo
├── README.md                    ✅ Hoàn thành
├── postman_collection.json     ✅ Hoàn thành
├── postman_environment.json    ✅ Hoàn thành
├── POSTMAN_GUIDE.md            ✅ Hoàn thành
└── API_STRUCTURE.md            ✅ Hoàn thành
```

## 🔗 URLs quan trọng

- **Server**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 🚨 Lưu ý quan trọng

1. **MongoDB**: Đảm bảo MongoDB đang chạy hoặc sử dụng MongoDB Atlas
2. **Redis**: Đã cấu hình Redis Cloud, không cần cài local
3. **OpenAI API**: Cần API key để sử dụng AI features
4. **File uploads**: Chỉ chấp nhận PDF, DOC, DOCX (max 10MB)

## 🎉 Sẵn sàng phát triển!

Backend đã hoàn thiện với:
- ✅ Authentication & Authorization
- ✅ AI Services (CV Analysis, Job Recommendations, Skill Roadmap)  
- ✅ Real-time features (Socket.IO)
- ✅ File upload handling
- ✅ Comprehensive API documentation
- ✅ Error handling & logging
- ✅ Redis caching
- ✅ Rate limiting & security

**Bước tiếp theo**: Phát triển Frontend với Next.js hoặc mở rộng các API endpoints!
