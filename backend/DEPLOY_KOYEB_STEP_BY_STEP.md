# 🚀 Hướng Dẫn Chi Tiết Deploy Backend Lên Koyeb

## 📋 Tổng Quan

Koyeb là platform miễn phí, không sleep, dễ deploy. Hướng dẫn này sẽ đi từng bước chi tiết.

**Thời gian:** ~15 phút  
**Yêu cầu:** GitHub account, MongoDB Atlas, Redis Cloud (optional)

---

## ✅ Bước 1: Chuẩn Bị

### **1.1. Kiểm Tra Backend Đã Sẵn Sàng**

```bash
cd backend

# Kiểm tra env variables
npm run check-env

# Test local (optional)
npm run dev
# Ctrl+C để dừng
```

**Kết quả mong đợi:**
- ✅ Tất cả required env variables đã set
- ✅ Backend chạy được local

### **1.2. Đảm Bảo Code Đã Push Lên GitHub**

```bash
# Kiểm tra git status
git status

# Nếu có thay đổi, commit và push
git add .
git commit -m "Prepare for Koyeb deployment"
git push origin main
```

---

## 🔐 Bước 2: Setup MongoDB Atlas (Nếu Chưa Có)

### **2.1. Tạo MongoDB Atlas Account**

1. Truy cập: https://www.mongodb.com/cloud/atlas
2. Đăng ký/Đăng nhập
3. Click **"Build a Database"**

### **2.2. Tạo Free Cluster**

1. Chọn **"M0 FREE"** (Free tier)
2. Chọn **Provider:** AWS
3. Chọn **Region:** Gần nhất (ví dụ: Singapore)
4. Click **"Create"**
5. Đợi 3-5 phút để cluster được tạo

### **2.3. Tạo Database User**

1. Vào **"Database Access"** (menu bên trái)
2. Click **"Add New Database User"**
3. Chọn **"Password"** authentication
4. Nhập:
   - **Username:** `admin` (hoặc tên bạn muốn)
   - **Password:** Tạo password mạnh (lưu lại!)
5. Click **"Add User"**

### **2.4. Whitelist IP Address**

1. Vào **"Network Access"** (menu bên trái)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ **Lưu ý:** Chỉ dùng cho development. Production nên whitelist IP cụ thể
4. Click **"Confirm"**

### **2.5. Lấy Connection String**

1. Vào **"Database"** → Click **"Connect"** trên cluster
2. Chọn **"Connect your application"**
3. Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Thay `<username>` và `<password>` bằng user vừa tạo
5. Thêm database name vào cuối:
   ```
   mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/internbridge?retryWrites=true&w=majority
   ```
6. **Lưu lại** connection string này → sẽ dùng cho `MONGO_URI`

---

## 🔴 Bước 3: Setup Redis Cloud (Optional - Nếu Cần)

### **3.1. Tạo Redis Cloud Account**

1. Truy cập: https://redis.com/try-free/
2. Đăng ký/Đăng nhập
3. Click **"Create Subscription"**

### **3.2. Tạo Free Database**

1. Chọn **"Fixed"** plan
2. Chọn **"30MB"** (Free tier)
3. Chọn **Region:** Gần nhất
4. Click **"Activate"**

### **3.3. Lấy Connection String**

1. Vào database vừa tạo
2. Copy **"Public endpoint"** hoặc **"Default user password"**
3. Format: `redis://default:password@host:port`
4. **Lưu lại** → sẽ dùng cho `REDIS_URL`

**Lưu ý:** Redis là optional. Backend vẫn chạy được nếu không có Redis.

---

## 🌐 Bước 4: Đăng Ký Koyeb

### **4.1. Tạo Account**

1. Truy cập: https://www.koyeb.com
2. Click **"Get Started"** hoặc **"Sign Up"**
3. Chọn **"Sign up with GitHub"** (khuyến nghị)
4. Authorize Koyeb truy cập GitHub

### **4.2. Xác Thực Email**

1. Kiểm tra email
2. Click link xác thực
3. Quay lại Koyeb dashboard

---

## 🚀 Bước 5: Deploy Backend Lên Koyeb

### **5.1. Tạo App Mới**

1. Vào **Dashboard** → Click **"Create App"** (nút lớn màu xanh)
2. Chọn **"GitHub"** tab
3. Nếu chưa connect GitHub:
   - Click **"Connect GitHub"**
   - Authorize Koyeb truy cập repos
   - Chọn repos cần truy cập (hoặc **"All repositories"**)

### **5.2. Chọn Repository**

1. Tìm và chọn repo: `internship-recruitment-platform`
2. Click vào repo

### **5.3. Cấu Hình Build**

Koyeb sẽ tự động detect, nhưng bạn cần chỉnh:

1. **Name:** `internship-backend` (hoặc tên bạn muốn)
2. **Branch:** `main` hoặc `develop` (tùy branch bạn dùng)
3. **Type:** Chọn **"Docker"** (nếu có Dockerfile) hoặc **"Web Service"** (Node.js trực tiếp)

   **Option A: Dùng Docker (Khuyến nghị nếu có Dockerfile)**
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** `backend`
   - Koyeb sẽ tự động build Docker image từ Dockerfile
   - ✅ **Ưu điểm:** Consistent, giống môi trường local
   
   **Option B: Dùng Node.js trực tiếp**
   - **Build Command:** `npm install`
   - **Run Command:** `npm run prod` hoặc `node server.js`
   - **Root Directory:** `backend` ⚠️ **QUAN TRỌNG:** Phải set root directory là `backend`
   - ✅ **Ưu điểm:** Nhanh hơn, không cần build Docker image

### **5.4. Environment Variables**

1. Scroll xuống phần **"Environment Variables"**
2. Click **"Add Variable"** cho mỗi biến:

   **Required Variables:**
   ```
   PORT = 3000
   NODE_ENV = production
   MONGO_URI = mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/internbridge?retryWrites=true&w=majority
   JWT_SECRET = your-super-secret-jwt-key-here
   CLOUDINARY_CLOUD_NAME = your-cloud-name
   CLOUDINARY_API_KEY = your-api-key
   CLOUDINARY_API_SECRET = your-api-secret
   ```

   **Optional Variables:**
   ```
   REDIS_URL = redis://default:password@host:port
   GEMINI_API_KEY = your-gemini-api-key
   GEMINI_MODEL = gemini-1.5-flash
   GOOGLE_CLIENT_ID = your-google-client-id
   GOOGLE_CLIENT_SECRET = your-google-client-secret
   GOOGLE_CALLBACK_URL = https://your-app.koyeb.app/api/auth/google/callback
   ```

3. **Lưu ý:**
   - Copy chính xác từ file `.env` của bạn
   - Không có khoảng trắng trước/sau dấu `=`
   - `GOOGLE_CALLBACK_URL` sẽ thay đổi sau khi deploy (cập nhật lại sau)

### **5.5. Instance Settings (Optional)**

1. **Instance Type:** Giữ mặc định (Starter - Free)
2. **Scaling:** 
   - **Min instances:** 1
   - **Max instances:** 1 (free tier)
3. **Region:** Chọn gần nhất (ví dụ: Singapore)

### **5.6. Deploy**

1. Review lại tất cả settings
2. Click **"Deploy"** (nút xanh lớn)
3. Đợi 2-5 phút để Koyeb:
   - Clone code từ GitHub
   - Install dependencies
   - Build và start server

---

## ✅ Bước 6: Kiểm Tra Deploy

### **6.1. Xem Logs**

1. Vào **App Dashboard**
2. Click tab **"Logs"**
3. Kiểm tra logs:

   **Thành công:**
   ```
   ✅ Database Connected Successfully
   ✅ Server running on port 3000
   ✅ Redis connected (nếu có)
   ```

   **Lỗi:**
   ```
   ❌ Database connection error
   ❌ Cannot find module
   ❌ Port already in use
   ```

### **6.2. Test Health Check**

1. Vào tab **"Overview"**
2. Copy **"Public URL"** (ví dụ: `https://internship-backend-xxxxx.koyeb.app`)
3. Test trong browser:
   ```
   https://your-app.koyeb.app/health
   ```

   **Kết quả mong đợi:**
   ```json
   {
     "status": "ok",
     "timestamp": "..."
   }
   ```

### **6.3. Test API Endpoints**

```bash
# Test Jobs API
curl https://your-app.koyeb.app/api/jobs

# Test API Docs
https://your-app.koyeb.app/api-docs
```

---

## 🔧 Bước 7: Cập Nhật Settings Sau Deploy

### **7.1. Cập Nhật Google OAuth Callback URL**

1. Vào **Google Cloud Console**
2. Vào **APIs & Services** → **Credentials**
3. Chọn OAuth 2.0 Client
4. Thêm **Authorized redirect URIs:**
   ```
   https://your-app.koyeb.app/api/auth/google/callback
   ```
5. **Save**

### **7.2. Cập Nhật Environment Variable**

1. Vào Koyeb App → **Settings** → **Environment Variables**
2. Cập nhật `GOOGLE_CALLBACK_URL`:
   ```
   GOOGLE_CALLBACK_URL = https://your-app.koyeb.app/api/auth/google/callback
   ```
3. Click **"Redeploy"** để áp dụng thay đổi

### **7.3. Cập Nhật Frontend API URL**

Cập nhật API URL trong frontend:

**FE:**
```env
# fe/.env.local
NEXT_PUBLIC_API_URL=https://your-app.koyeb.app/api
```

**FE-Employer:**
```env
# fe-employer/.env.local
NEXT_PUBLIC_API_URL=https://your-app.koyeb.app/api
```

**Admin:**
```env
# admin/.env
VITE_API_URL=https://your-app.koyeb.app/api
```

---

## 🔄 Bước 8: Auto-Deploy từ GitHub

Koyeb tự động deploy khi bạn push code lên GitHub!

### **8.1. Test Auto-Deploy**

```bash
# Tạo thay đổi nhỏ
echo "# Test" >> backend/README.md

# Commit và push
git add .
git commit -m "Test auto-deploy"
git push origin main
```

### **8.2. Kiểm Tra**

1. Vào Koyeb App Dashboard
2. Tab **"Activity"** sẽ hiển thị deployment mới
3. Đợi vài phút để deploy xong

### **8.3. Tắt Auto-Deploy (Nếu Cần)**

1. Vào **Settings** → **Git**
2. Toggle **"Auto-deploy"** OFF

---

## 🎯 Bước 9: Custom Domain (Optional)

### **9.1. Thêm Domain**

1. Vào **Settings** → **Domains**
2. Click **"Add Domain"**
3. Nhập domain của bạn (ví dụ: `api.yourdomain.com`)
4. Click **"Add"**

### **9.2. Cấu Hình DNS**

Koyeb sẽ cung cấp DNS records:

1. Copy **CNAME record** từ Koyeb
2. Vào DNS provider (ví dụ: Cloudflare, Namecheap)
3. Thêm CNAME record:
   - **Name:** `api` (hoặc subdomain bạn muốn)
   - **Value:** `your-app.koyeb.app`
   - **TTL:** 3600

4. Đợi 5-10 phút để DNS propagate
5. Test: `https://api.yourdomain.com/health`

---

## 📊 Bước 10: Monitoring & Logs

### **10.1. Xem Logs Real-time**

1. Vào App Dashboard → **Logs** tab
2. Logs hiển thị real-time
3. Có thể filter, search logs

### **10.2. Metrics**

1. Tab **"Metrics"** hiển thị:
   - CPU usage
   - Memory usage
   - Request count
   - Response time

### **10.3. Alerts (Paid Feature)**

- Free tier không có alerts
- Có thể upgrade để nhận email/Slack alerts

---

## 🆘 Troubleshooting

### **Lỗi: "Build failed"**

**Nguyên nhân:**
- Root directory sai
- Build command sai
- Dependencies lỗi

**Giải pháp:**
1. Kiểm tra **Root Directory:** phải là `backend`
2. Kiểm tra **Build Command:** `npm install`
3. Xem logs để biết lỗi cụ thể

### **Lỗi: "Cannot connect to MongoDB"**

**Nguyên nhân:**
- MongoDB URI sai
- IP chưa được whitelist
- Database user chưa được tạo

**Giải pháp:**
1. Kiểm tra MongoDB URI đúng format
2. Vào MongoDB Atlas → Network Access → Whitelist IP: `0.0.0.0/0`
3. Kiểm tra database user đã được tạo

### **Lỗi: "Port already in use"**

**Nguyên nhân:**
- Hardcode port trong code

**Giải pháp:**
- Đảm bảo dùng `process.env.PORT` trong code
- Koyeb tự động set PORT, không cần hardcode

### **Lỗi: "Module not found"**

**Nguyên nhân:**
- Dependencies chưa được install
- Package.json sai

**Giải pháp:**
1. Kiểm tra `package.json` có đúng không
2. Kiểm tra Build Command: `npm install`
3. Xem logs để biết module nào thiếu

### **Lỗi: "Application crashed"**

**Nguyên nhân:**
- Environment variables thiếu
- Code lỗi runtime

**Giải pháp:**
1. Kiểm tra logs để xem lỗi cụ thể
2. Kiểm tra tất cả required env variables đã được set
3. Test local trước khi deploy

---

## 📋 Checklist Cuối Cùng

Trước khi coi như hoàn thành:

- [ ] App đã deploy thành công trên Koyeb
- [ ] Health check endpoint hoạt động (`/health`)
- [ ] API endpoints test thành công
- [ ] MongoDB connection OK (xem logs)
- [ ] Redis connection OK (nếu dùng, xem logs)
- [ ] Google OAuth callback URL đã cập nhật
- [ ] Frontend API URL đã cập nhật
- [ ] Custom domain đã setup (nếu có)
- [ ] Auto-deploy hoạt động (test bằng push code)

---

## 🎉 Hoàn Thành!

Sau khi hoàn thành tất cả bước:

**Backend URL:** `https://your-app.koyeb.app`  
**API Base URL:** `https://your-app.koyeb.app/api`  
**Health Check:** `https://your-app.koyeb.app/health`  
**API Docs:** `https://your-app.koyeb.app/api-docs`

**Lưu ý:**
- Koyeb free tier không sleep → Server chạy 24/7
- Auto-deploy từ GitHub → Tự động cập nhật khi push code
- HTTPS tự động → Không cần config SSL

---

## 📚 Tài Liệu Tham Khảo

- Koyeb Docs: https://www.koyeb.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas
- Redis Cloud: https://redis.com/docs

---

## 💡 Tips

1. **Backup Environment Variables:**
   - Export tất cả env vars ra file để backup
   - Dùng password manager để lưu secrets

2. **Monitor Logs:**
   - Thường xuyên check logs để phát hiện lỗi sớm
   - Logs giữ được 7 ngày (free tier)

3. **Test Trước Khi Deploy:**
   - Luôn test local và Docker trước
   - Sử dụng `TEST_BEFORE_DEPLOY.md` để test

4. **Version Control:**
   - Không commit `.env` file
   - Dùng `.env.example` để document env vars

---

Chúc bạn deploy thành công! 🚀

