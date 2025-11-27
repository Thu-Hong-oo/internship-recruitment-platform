# 🧪 Hướng Dẫn Test Backend Trước Khi Deploy

## 📋 Checklist Trước Khi Deploy

- [ ] Backend chạy được local
- [ ] MongoDB connection thành công
- [ ] Redis connection thành công (optional)
- [ ] API endpoints hoạt động
- [ ] Health check endpoint OK
- [ ] Docker build thành công
- [ ] Docker container chạy được
- [ ] Environment variables đầy đủ

---

## 🚀 Bước 1: Test Local (Không Docker)

### **1.1. Kiểm Tra Dependencies**

```bash
cd backend
npm install
```

### **1.2. Setup Environment Variables**

Tạo file `.env` với đầy đủ biến:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/internbridge
# Hoặc MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/internbridge

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### **1.3. Start MongoDB (Nếu chạy local)**

```bash
# Windows (nếu đã cài MongoDB)
mongod

# Hoặc dùng MongoDB Atlas (không cần cài local)
```

### **1.4. Start Redis (Optional)**

```bash
# Windows (nếu đã cài Redis)
redis-server

# Hoặc bỏ qua nếu không dùng Redis
```

### **1.5. Start Backend**

```bash
cd backend
npm run dev
```

**Kiểm tra:**
- Server chạy trên port 3000
- Log hiển thị: "Database Connected Successfully"
- Log hiển thị: "Redis connected" (nếu có Redis)

### **1.6. Test Health Check**

Mở browser hoặc dùng curl:

```bash
# Browser
http://localhost:3000/health

# Curl
curl http://localhost:3000/health
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T..."
}
```

### **1.7. Test API Endpoints**

```bash
# Test API docs
http://localhost:3000/api-docs

# Test một endpoint (ví dụ: get jobs)
curl http://localhost:3000/api/jobs

# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🐳 Bước 2: Test Với Docker

### **2.1. Build Docker Image**

```bash
cd backend
docker build -t internship-backend .
```

**Kiểm tra:**
- Build thành công, không có lỗi
- Image được tạo: `internship-backend`

### **2.2. Test Docker Image Locally**

```bash
# Run với env file
docker run -p 3000:3000 --env-file .env internship-backend

# Hoặc run với env variables
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://host.docker.internal:27017/internbridge \
  -e JWT_SECRET=test-secret \
  internship-backend
```

**Lưu ý:** 
- Nếu MongoDB chạy trên host, dùng `host.docker.internal` thay vì `localhost`
- Hoặc dùng MongoDB Atlas (không cần thay đổi)

### **2.3. Test Health Check**

```bash
curl http://localhost:3000/health
```

### **2.4. Test Với Docker Compose (Có MongoDB + Redis)**

```bash
cd backend
docker-compose up -d
```

**Kiểm tra:**
- Tất cả containers đang chạy: `docker-compose ps`
- Backend logs: `docker-compose logs backend`
- MongoDB logs: `docker-compose logs mongo`
- Redis logs: `docker-compose logs redis`

**Test:**
```bash
# Health check
curl http://localhost:3000/health

# API endpoint
curl http://localhost:3000/api/jobs
```

**Stop:**
```bash
docker-compose down
```

---

## 🔍 Bước 3: Test Chi Tiết Các Chức Năng

### **3.1. Test Authentication**

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Lưu token từ response
TOKEN="your-token-here"

# Test protected endpoint
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### **3.2. Test Jobs API**

```bash
# Get all jobs
curl http://localhost:3000/api/jobs

# Get job by ID
curl http://localhost:3000/api/jobs/JOB_ID

# Create job (cần auth)
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "Test description",
    "location": "Ho Chi Minh City"
  }'
```

### **3.3. Test File Upload (Cloudinary)**

```bash
# Upload resume (cần auth)
curl -X POST http://localhost:3000/api/candidates/resume \
  -H "Authorization: Bearer $TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

### **3.4. Test AI Features (Gemini)**

```bash
# Test AI analysis (cần auth + resume)
curl -X POST http://localhost:3000/api/ai/analyze-resume \
  -H "Authorization: Bearer $TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

---

## 🐳 Bước 4: Test Docker Image Giống Production

### **4.1. Build Production Image**

```bash
cd backend
docker build -t internship-backend:test .
```

### **4.2. Run Với Production Environment**

```bash
docker run -d \
  --name backend-test \
  -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e MONGO_URI=your-mongodb-atlas-uri \
  -e JWT_SECRET=your-jwt-secret \
  -e GEMINI_API_KEY=your-gemini-key \
  -e CLOUDINARY_CLOUD_NAME=your-cloud-name \
  -e CLOUDINARY_API_KEY=your-api-key \
  -e CLOUDINARY_API_SECRET=your-api-secret \
  internship-backend:test
```

### **4.3. Kiểm Tra Logs**

```bash
docker logs backend-test
```

**Kiểm tra:**
- ✅ "Database Connected Successfully"
- ✅ "Server running on port 3000"
- ❌ Không có lỗi connection

### **4.4. Test Health Check**

```bash
curl http://localhost:3000/health
```

### **4.5. Test API**

```bash
curl http://localhost:3000/api/jobs
```

### **4.6. Cleanup**

```bash
docker stop backend-test
docker rm backend-test
```

---

## 📝 Bước 5: Tạo Test Script

Tạo file `backend/scripts/test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing Backend API..."
echo ""

# Test Health Check
echo "1. Testing Health Check..."
HEALTH=$(curl -s $BASE_URL/health)
if [[ $HEALTH == *"ok"* ]]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi

# Test API Docs
echo "2. Testing API Docs..."
DOCS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api-docs)
if [ $DOCS -eq 200 ]; then
  echo "✅ API docs accessible"
else
  echo "❌ API docs not accessible"
fi

# Test Jobs API
echo "3. Testing Jobs API..."
JOBS=$(curl -s $BASE_URL/api/jobs)
if [[ $JOBS == *"success"* ]] || [[ $JOBS == *"data"* ]]; then
  echo "✅ Jobs API working"
else
  echo "⚠️ Jobs API may have issues"
fi

echo ""
echo "✅ All tests completed!"
```

**Chạy test:**
```bash
chmod +x backend/scripts/test-api.sh
./backend/scripts/test-api.sh
```

---

## 🔧 Bước 6: Kiểm Tra Environment Variables

Tạo script kiểm tra env vars:

```bash
# backend/scripts/check-env.js
const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const optional = [
  'REDIS_URL',
  'GEMINI_API_KEY',
  'EMAIL_HOST'
];

console.log('🔍 Checking Environment Variables...\n');

let hasErrors = false;

required.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required: ${key}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: ${process.env[key].substring(0, 10)}...`);
  }
});

console.log('\n📋 Optional variables:');
optional.forEach(key => {
  if (process.env[key]) {
    console.log(`✅ ${key}: Set`);
  } else {
    console.log(`⚠️ ${key}: Not set (optional)`);
  }
});

if (hasErrors) {
  console.error('\n❌ Missing required environment variables!');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
}
```

**Chạy:**
```bash
cd backend
node scripts/check-env.js
```

---

## ✅ Checklist Trước Khi Deploy Lên Koyeb

- [ ] Backend chạy được local (`npm run dev`)
- [ ] Health check endpoint hoạt động (`/health`)
- [ ] MongoDB connection thành công
- [ ] Redis connection thành công (nếu dùng)
- [ ] API endpoints test thành công
- [ ] Docker build thành công (`docker build`)
- [ ] Docker container chạy được (`docker run`)
- [ ] Environment variables đầy đủ
- [ ] Test script chạy thành công
- [ ] Logs không có lỗi nghiêm trọng

---

## 🚀 Sau Khi Test Xong

Khi tất cả test đều pass, bạn có thể deploy lên Koyeb:

1. **Push code lên GitHub**
2. **Deploy trên Koyeb** (theo hướng dẫn trong `DEPLOY_BACKEND_GUIDE.md`)
3. **Test lại trên production URL**

---

## 🆘 Troubleshooting

### **Lỗi: "Cannot connect to MongoDB"**
- Kiểm tra MongoDB URI đúng
- Kiểm tra MongoDB đang chạy (nếu local)
- Kiểm tra IP whitelist (nếu MongoDB Atlas)

### **Lỗi: "Redis connection failed"**
- Redis là optional, backend vẫn chạy được
- Có thể bỏ qua nếu không cần Redis

### **Lỗi: "Port already in use"**
- Đổi PORT trong `.env`
- Hoặc kill process đang dùng port 3000

### **Lỗi: "Docker build failed"**
- Kiểm tra Dockerfile syntax
- Kiểm tra `.dockerignore` không loại bỏ file cần thiết
- Kiểm tra `package.json` có đúng không

---

## 📚 Tài Liệu Tham Khảo

- MongoDB Connection: https://www.mongodb.com/docs/manual/reference/connection-string/
- Docker Docs: https://docs.docker.com
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

