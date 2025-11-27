# 🚀 Hướng Dẫn Deploy Backend Miễn Phí - Không Bị Ngắt Kết Nối

## 📊 So Sánh Các Nền Tảng

| Platform | Free Tier | Sleep? | Database | Redis | Tốt Nhất Cho |
|----------|-----------|--------|----------|-------|--------------|
| **Railway** | $5 credit/tháng | ❌ Không | ✅ Có | ✅ Có | ⭐⭐⭐⭐⭐ |
| **Render** | Free | ⚠️ Sleep sau 15 phút | ✅ Có | ✅ Có | ⭐⭐⭐⭐ |
| **Fly.io** | Free | ❌ Không | ⚠️ Tách riêng | ⚠️ Tách riêng | ⭐⭐⭐⭐ |
| **Koyeb** | Free | ❌ Không | ⚠️ Tách riêng | ⚠️ Tách riêng | ⭐⭐⭐⭐⭐ |
| **Cyclic** | Free | ❌ Không | ✅ Cột MongoDB | ❌ Không | ⭐⭐⭐ |

---

## 🏆 Khuyến Nghị: **Railway** (Tốt Nhất)

### ✅ Ưu Điểm:
- **Không sleep** - Server chạy 24/7
- **$5 credit/tháng** - Đủ cho backend nhỏ
- **Tích hợp MongoDB** - Dễ setup
- **Tích hợp Redis** - Có sẵn
- **Auto-deploy từ GitHub** - Tự động cập nhật
- **Environment variables** - Dễ quản lý
- **Logs real-time** - Dễ debug

### 📝 Hướng Dẫn Setup Railway:

#### **Bước 1: Đăng Ký Railway**
1. Truy cập: https://railway.app
2. Đăng nhập bằng GitHub
3. Click **"New Project"**

#### **Bước 2: Deploy Backend**
1. Chọn **"Deploy from GitHub repo"**
2. Chọn repo `internship-recruitment-platform`
3. Chọn thư mục `backend`
4. Railway tự động detect Node.js

#### **Bước 3: Cấu Hình**
1. **Environment Variables:**
   - Vào **Variables** tab
   - Thêm tất cả biến từ `.env`:
     ```
     PORT=3000
     NODE_ENV=production
     MONGODB_URI=...
     JWT_SECRET=...
     GEMINI_API_KEY=...
     CLOUDINARY_CLOUD_NAME=...
     CLOUDINARY_API_KEY=...
     CLOUDINARY_API_SECRET=...
     REDIS_URL=...
     ```

2. **Build Command:**
   - Railway tự detect, nhưng có thể set:
     ```
     npm install
     ```

3. **Start Command:**
   ```
   npm run prod
   ```

#### **Bước 4: Setup MongoDB (Railway)**
1. Vào **New** → **Database** → **MongoDB**
2. Railway tự tạo MongoDB instance
3. Copy connection string → thêm vào `MONGODB_URI`

#### **Bước 5: Setup Redis (Railway)**
1. Vào **New** → **Database** → **Redis**
2. Railway tự tạo Redis instance
3. Copy connection string → thêm vào `REDIS_URL`

#### **Bước 6: Custom Domain (Optional)**
1. Vào **Settings** → **Domains**
2. Click **"Generate Domain"** → Railway tự tạo domain
3. Hoặc thêm custom domain

---

## 🥈 Lựa Chọn 2: **Render** (Free Tier)

### ⚠️ Lưu Ý:
- **Sleep sau 15 phút** không có traffic
- **Wake-up time:** ~30 giây khi có request mới
- **Free tier:** 750 giờ/tháng

### 📝 Hướng Dẫn Setup Render:

#### **Bước 1: Đăng Ký**
1. Truy cập: https://render.com
2. Đăng nhập bằng GitHub

#### **Bước 2: Tạo Web Service**
1. Click **"New +"** → **"Web Service"**
2. Connect GitHub repo
3. Chọn branch và thư mục `backend`

#### **Bước 3: Cấu Hình**
```
Name: internship-backend
Environment: Node
Build Command: npm install
Start Command: npm run prod
Plan: Free
```

#### **Bước 4: Environment Variables**
Thêm tất cả biến từ `.env`

#### **Bước 5: Setup MongoDB (Render)**
1. **New +** → **MongoDB**
2. Chọn **Free** plan
3. Copy connection string

#### **Bước 6: Setup Redis (Render)**
1. **New +** → **Redis**
2. Chọn **Free** plan
3. Copy connection string

---

## 🥉 Lựa Chọn 3: **Koyeb** (Free Tier) ⭐ Khuyến Nghị

### ✅ Ưu Điểm:
- **Không sleep** - Server chạy 24/7
- **Free tier** - Đủ cho backend nhỏ
- **Auto-deploy từ GitHub** - Tự động cập nhật
- **Global edge network** - Tốc độ nhanh
- **Dễ setup** - UI đơn giản, không cần CLI
- **HTTPS tự động** - SSL certificate tự động
- **Custom domain** - Hỗ trợ domain riêng

### ⚠️ Lưu ý:
- MongoDB và Redis cần setup riêng (MongoDB Atlas, Redis Cloud)
- Free tier có giới hạn resources

### 📝 Hướng Dẫn Setup Koyeb:

#### **Bước 1: Đăng Ký Koyeb**
1. Truy cập: https://www.koyeb.com
2. Đăng ký bằng GitHub (miễn phí)
3. Xác thực email

#### **Bước 2: Tạo App Mới**
1. Vào **Dashboard** → Click **"Create App"**
2. Chọn **"GitHub"** → Connect GitHub account
3. Chọn repo: `internship-recruitment-platform`
4. Chọn branch: `main` hoặc `develop`

#### **Bước 3: Cấu Hình Build**
1. **Name:** `internship-backend`
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Run Command:** `npm run prod` hoặc `node server.js`
5. **Port:** `3000` (hoặc để trống, Koyeb tự detect)

#### **Bước 4: Environment Variables**
1. Vào tab **"Environment Variables"**
2. Thêm tất cả biến từ `.env`:
   ```
   PORT=3000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   GEMINI_API_KEY=your-api-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   REDIS_URL=redis://...
   ```

#### **Bước 5: Setup MongoDB (MongoDB Atlas)**
1. Truy cập: https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí (M0 - Free tier)
3. Tạo database user
4. Whitelist IP: `0.0.0.0/0` (cho phép mọi IP)
5. Copy connection string → thêm vào `MONGODB_URI`

#### **Bước 6: Setup Redis (Redis Cloud)**
1. Truy cập: https://redis.com/try-free/
2. Tạo account miễn phí
3. Tạo database (30MB free)
4. Copy connection string → thêm vào `REDIS_URL`
5. **Lưu ý:** Redis là optional, backend vẫn chạy được nếu không có

#### **Bước 7: Deploy**
1. Click **"Deploy"**
2. Koyeb sẽ tự động:
   - Clone code từ GitHub
   - Install dependencies
   - Build và start server
3. Đợi vài phút để deploy xong

#### **Bước 8: Custom Domain (Optional)**
1. Vào **Settings** → **Domains**
2. Click **"Add Domain"**
3. Thêm domain của bạn
4. Koyeb sẽ cung cấp DNS records để config

#### **Bước 9: Kiểm Tra**
1. Vào **Logs** tab để xem logs real-time
2. Test API: `https://your-app.koyeb.app/health`
3. Kiểm tra MongoDB connection trong logs

#### **Bước 10: Bật CI/CD GitHub Actions (Optional nhưng khuyến nghị)**
1. Thêm secrets vào GitHub repo:
   - `KOYEB_API_TOKEN`: Token tạo tại https://app.koyeb.com/account/api
   - `KOYEB_SERVICE_ID`: ID của service (vào Service → Settings → Copy Service ID)
2. Workflow `.github/workflows/deploy-backend-koyeb.yml` sẽ:
   - Chạy `npm install` + `npm run lint` cho `backend/`
   - Gọi API của Koyeb để tạo deployment mới
3. Trigger: push vào `develop` (có thay đổi trong `backend/**`) hoặc chạy tay `workflow_dispatch`
4. Kiểm tra kết quả ở tab **Actions** và trên Koyeb (Activity/Logs)

### 🔧 Cấu Hình Nâng Cao

#### **Health Check:**
Koyeb tự động check endpoint `/health`. Đảm bảo endpoint này tồn tại:
```javascript
// backend/server.js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

#### **Auto-Deploy:**
- Koyeb tự động deploy khi push code lên GitHub
- Có thể tắt auto-deploy trong Settings nếu muốn

#### **Scaling:**
- Free tier: 1 instance
- Có thể scale lên nếu cần (paid plan)

---

## 🥉 Lựa Chọn 4: **Fly.io** (Free Tier)

### ✅ Ưu Điểm:
- **Không sleep**
- **Global edge network**
- **Free tier:** 3 shared-cpu VMs

### 📝 Hướng Dẫn Setup Fly.io:

#### **Bước 1: Cài Fly CLI**
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

#### **Bước 2: Đăng Nhập**
```bash
fly auth login
```

#### **Bước 3: Tạo App**
```bash
cd backend
fly launch
```

#### **Bước 4: Tạo `fly.toml`**
```toml
app = "internship-backend"
primary_region = "sin"  # Singapore

[build]

[env]
  PORT = "3000"
  NODE_ENV = "production"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

#### **Bước 5: Set Secrets**
```bash
fly secrets set MONGODB_URI=...
fly secrets set JWT_SECRET=...
fly secrets set GEMINI_API_KEY=...
# ... thêm tất cả secrets
```

#### **Bước 6: Deploy**
```bash
fly deploy
```

---

## 🔧 Chuẩn Bị Backend Cho Production

### **1. Sửa `package.json`**
```json
{
  "scripts": {
    "start": "node server.js",  // Thay vì nodemon
    "prod": "node server.js"
  }
}
```

### **2. Tạo `Procfile` (cho Render)**
```
web: npm run prod
```

### **3. Tạo `.dockerfile` (cho Railway/Fly.io)**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### **4. Cập Nhật `server.js`**
```javascript
// Đảm bảo server listen đúng PORT từ env
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});
```

---

## 📋 Checklist Trước Khi Deploy

- [ ] Sửa `package.json` - `start` script dùng `node` không phải `nodemon`
- [ ] Kiểm tra `PORT` từ `process.env.PORT`
- [ ] Tất cả environment variables đã được set
- [ ] MongoDB connection string đúng
- [ ] Redis connection string đúng (nếu dùng)
- [ ] CORS đã config đúng domain frontend
- [ ] Health check endpoint hoạt động (`/health`)

---

## 🔗 Cập Nhật Frontend API URL

Sau khi deploy backend, cập nhật API URL trong frontend:

### **FE:**
```env
# fe/.env.local
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

### **FE-Employer:**
```env
# fe-employer/.env.local
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

### **Admin:**
```env
# admin/.env
VITE_API_URL=https://your-backend-url.railway.app/api
```

---

## 🎯 Khuyến Nghị Cuối Cùng

### **Cho Production:**
1. **Railway** - Tốt nhất, không sleep, dễ setup, có MongoDB/Redis tích hợp
2. **Koyeb** - Rất tốt, không sleep, dễ setup, cần MongoDB/Redis riêng
3. **Render** - Free nhưng có sleep (OK nếu traffic ít)
4. **Fly.io** - Tốt nhưng setup phức tạp hơn

### **Cho Development:**
- Dùng **ngrok** hoặc **localtunnel** để expose local server

---

## 🆘 Troubleshooting

### **Lỗi: "Cannot connect to MongoDB"**
- Kiểm tra MongoDB connection string
- Đảm bảo MongoDB instance đã được tạo
- Kiểm tra IP whitelist (nếu dùng MongoDB Atlas)

### **Lỗi: "Port already in use"**
- Đảm bảo dùng `process.env.PORT` (platform tự set)
- Không hardcode port

### **Lỗi: "Redis connection failed"**
- Redis là optional, backend vẫn chạy được
- Có thể bỏ qua nếu không cần Redis

### **Lỗi: "Build failed"**
- Kiểm tra `package.json` có đúng không
- Kiểm tra Node.js version (cần 18+)

---

## 📚 Tài Liệu Tham Khảo

- Railway Docs: https://docs.railway.app
- Koyeb Docs: https://www.koyeb.com/docs
- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs

