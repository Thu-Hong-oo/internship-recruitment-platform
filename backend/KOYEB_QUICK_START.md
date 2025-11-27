# ⚡ Koyeb Quick Start - Deploy Trong 5 Phút

## 🎯 Mục Tiêu

Deploy backend lên Koyeb nhanh nhất có thể.

---

## ✅ Checklist Nhanh

- [ ] MongoDB Atlas đã setup (có connection string)
- [ ] Redis Cloud đã setup (optional, có connection string)
- [ ] Code đã push lên GitHub
- [ ] Có file `.env` với đầy đủ biến

---

## 🚀 5 Bước Deploy

### **Bước 1: Đăng Ký Koyeb**
1. https://www.koyeb.com → **Sign up with GitHub**
2. Xác thực email

### **Bước 2: Tạo App**
1. Dashboard → **Create App**
2. Chọn **GitHub** → Chọn repo `internship-recruitment-platform`
3. **Root Directory:** `backend`
4. **Type:** Docker (nếu có Dockerfile) hoặc Web Service

### **Bước 3: Cấu Hình**

**Nếu dùng Docker:**
- **Dockerfile Path:** `backend/Dockerfile`
- **Docker Context:** `backend`

**Nếu dùng Node.js:**
- **Build Command:** `npm install`
- **Run Command:** `npm run prod`
- **Root Directory:** `backend`

### **Bước 4: Environment Variables**

Copy tất cả từ `.env` và paste vào Koyeb:

```
PORT=3000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
REDIS_URL=redis://... (optional)
GEMINI_API_KEY=... (optional)
```

### **Bước 5: Deploy**
1. Click **"Deploy"**
2. Đợi 2-5 phút
3. Test: `https://your-app.koyeb.app/health`

---

## 🔗 Links Quan Trọng

- **Koyeb Dashboard:** https://app.koyeb.com
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Redis Cloud:** https://redis.com/try-free/

---

## 📝 Lưu Ý

1. **Root Directory:** Phải là `backend` (không phải root repo)
2. **MongoDB URI:** Phải whitelist IP `0.0.0.0/0` trong MongoDB Atlas
3. **Port:** Koyeb tự động set, không cần hardcode
4. **HTTPS:** Tự động, không cần config

---

Xem hướng dẫn chi tiết trong `DEPLOY_KOYEB_STEP_BY_STEP.md` 📚

