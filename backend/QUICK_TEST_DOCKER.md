# 🐳 Quick Test Docker Container

## ✅ Backend Đã Test Thành Công!

Từ log của bạn:
- ✅ Environment variables: Đầy đủ
- ✅ Local server: Chạy thành công
- ✅ Database: Connected
- ✅ Redis: Connected
- ✅ Docker build: Thành công

---

## 🧪 Test Docker Container

### **Bước 1: Run Docker Container**

```powershell
cd backend

# Run với env file
docker run -d `
  --name backend-test `
  -p 3000:3000 `
  --env-file .env `
  internship-backend:test
```

**Hoặc run với env variables trực tiếp:**

```powershell
docker run -d `
  --name backend-test `
  -p 3000:3000 `
  -e PORT=3000 `
  -e NODE_ENV=production `
  -e MONGO_URI=your-mongodb-uri `
  -e JWT_SECRET=your-jwt-secret `
  -e GEMINI_API_KEY=your-gemini-key `
  -e CLOUDINARY_CLOUD_NAME=your-cloud-name `
  -e CLOUDINARY_API_KEY=your-api-key `
  -e CLOUDINARY_API_SECRET=your-api-secret `
  -e REDIS_URL=your-redis-url `
  internship-backend:test
```

### **Bước 2: Kiểm Tra Logs**

```powershell
docker logs backend-test
```

**Kiểm tra:**
- ✅ "Database Connected Successfully"
- ✅ "Server running on port 3000"
- ❌ Không có lỗi connection

### **Bước 3: Test Health Check**

```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing

# Hoặc dùng script
npm run test-api:ps1
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### **Bước 4: Test API Endpoints**

```powershell
# Test Jobs API
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" -UseBasicParsing

# Test API Docs
Start-Process "http://localhost:3000/api-docs"
```

### **Bước 5: Cleanup**

```powershell
docker stop backend-test
docker rm backend-test
```

---

## 🚀 Sẵn Sàng Deploy Lên Koyeb!

Sau khi test Docker container thành công, bạn có thể deploy lên Koyeb:

1. **Push code lên GitHub**
2. **Deploy trên Koyeb** (theo hướng dẫn trong `DEPLOY_BACKEND_GUIDE.md`)
3. **Test lại trên production URL**

---

## 📝 Lưu Ý

- **MongoDB URI:** Đảm bảo MongoDB Atlas cho phép kết nối từ mọi IP (0.0.0.0/0) hoặc whitelist IP của Koyeb
- **Redis URL:** Đảm bảo Redis Cloud cho phép kết nối từ mọi IP
- **Environment Variables:** Copy tất cả từ `.env` vào Koyeb

