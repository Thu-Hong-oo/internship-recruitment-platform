# 🐳 Hướng Dẫn Deploy Backend Bằng Docker

## 📊 Các Platform Hỗ Trợ Docker

| Platform | Free Tier | Docker Support | Tốt Nhất Cho |
|----------|-----------|----------------|--------------|
| **Railway** | $5 credit/tháng | ✅ Native | ⭐⭐⭐⭐⭐ |
| **Render** | Free | ✅ Native | ⭐⭐⭐⭐ |
| **Fly.io** | Free | ✅ Native | ⭐⭐⭐⭐ |
| **DigitalOcean App Platform** | Free trial | ✅ Native | ⭐⭐⭐ |
| **Google Cloud Run** | Free tier | ✅ Native | ⭐⭐⭐⭐ |
| **AWS ECS/Fargate** | Free tier | ✅ Native | ⭐⭐⭐ |
| **Docker Hub + VPS** | Tùy VPS | ✅ Manual | ⭐⭐⭐ |

---

## 🏆 Khuyến Nghị: **Railway với Docker**

### ✅ Ưu Điểm:
- **Hỗ trợ Docker native** - Chỉ cần Dockerfile
- **Auto-deploy từ GitHub** - Tự động build và deploy
- **Không sleep** - Server chạy 24/7
- **Tích hợp MongoDB/Redis** - Dễ setup

---

## 🚀 Hướng Dẫn Deploy Docker Lên Railway

### **Bước 1: Kiểm Tra Dockerfile**

File `backend/Dockerfile` đã có sẵn và đúng cấu hình:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "server.js"]
```

### **Bước 2: Deploy Lên Railway**

1. **Truy cập Railway:**
   - https://railway.app
   - Đăng nhập bằng GitHub

2. **Tạo Project:**
   - Click **"New Project"**
   - Chọn **"Deploy from GitHub repo"**
   - Chọn repo `internship-recruitment-platform`

3. **Cấu Hình:**
   - Railway tự động detect Dockerfile trong thư mục `backend`
   - Hoặc chọn **"Deploy from Dockerfile"** và set root directory: `backend`

4. **Environment Variables:**
   - Vào **Variables** tab
   - Thêm tất cả biến từ `.env`

5. **Deploy:**
   - Railway tự động build Docker image và deploy
   - Đợi vài phút để build xong

---

## 🥈 Lựa Chọn 2: **Render với Docker**

### **Bước 1: Tạo Web Service**
1. Truy cập: https://render.com
2. **New +** → **Web Service**
3. Connect GitHub repo

### **Bước 2: Cấu Hình**
```
Name: internship-backend
Environment: Docker
Dockerfile Path: backend/Dockerfile
Docker Context: backend
Plan: Free
```

### **Bước 3: Environment Variables**
Thêm tất cả biến từ `.env`

### **Bước 4: Deploy**
Render sẽ tự động build và deploy Docker container

---

## 🥉 Lựa Chọn 3: **Fly.io với Docker**

### **Bước 1: Cài Fly CLI**
```bash
# Windows
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

### **Bước 2: Đăng Nhập**
```bash
fly auth login
```

### **Bước 3: Tạo App**
```bash
cd backend
fly launch
```

Fly.io sẽ tự động detect Dockerfile và tạo `fly.toml`

### **Bước 4: Set Secrets**
```bash
fly secrets set MONGODB_URI=...
fly secrets set JWT_SECRET=...
# ... thêm tất cả secrets
```

### **Bước 5: Deploy**
```bash
fly deploy
```

---

## 🔧 Tối Ưu Dockerfile

### **Cải Thiện Dockerfile (Multi-stage Build):**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

### **Tạo `.dockerignore`:**

```dockerignore
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
.vscode
.idea
*.log
.DS_Store
coverage
.nyc_output
```

---

## 🐳 Deploy Docker Lên VPS (Manual)

### **Bước 1: Build Docker Image**
```bash
cd backend
docker build -t internship-backend .
```

### **Bước 2: Test Locally**
```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e MONGODB_URI=... \
  -e JWT_SECRET=... \
  internship-backend
```

### **Bước 3: Push Lên Docker Hub**
```bash
# Login
docker login

# Tag image
docker tag internship-backend yourusername/internship-backend:latest

# Push
docker push yourusername/internship-backend:latest
```

### **Bước 4: Deploy Lên VPS**
```bash
# SSH vào VPS
ssh user@your-vps-ip

# Pull image
docker pull yourusername/internship-backend:latest

# Run container
docker run -d \
  --name internship-backend \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  yourusername/internship-backend:latest
```

---

## 🐙 Docker Compose (Cho Local Development)

Tạo file `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/internbridge
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

### **Chạy Local:**
```bash
docker-compose up -d
```

---

## 📋 Checklist Trước Khi Deploy Docker

- [ ] Dockerfile đã có và đúng cấu hình
- [ ] `.dockerignore` đã tạo (optional nhưng nên có)
- [ ] Health check endpoint `/health` hoạt động
- [ ] Environment variables đã được set trên platform
- [ ] MongoDB connection string đúng
- [ ] Redis connection string đúng (nếu dùng)
- [ ] PORT được set từ `process.env.PORT`

---

## 🔍 Test Docker Image Locally

```bash
# Build
cd backend
docker build -t internship-backend .

# Run với env file
docker run -p 3000:3000 --env-file .env internship-backend

# Hoặc run với env variables
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://... \
  internship-backend
```

---

## 🎯 So Sánh: Docker vs Native Deploy

| Aspect | Docker | Native |
|--------|--------|--------|
| **Consistency** | ✅ Giống nhau mọi môi trường | ⚠️ Có thể khác nhau |
| **Isolation** | ✅ Hoàn toàn isolated | ❌ Phụ thuộc host |
| **Portability** | ✅ Chạy được mọi nơi | ⚠️ Phụ thuộc platform |
| **Build Time** | ⚠️ Lâu hơn (build image) | ✅ Nhanh hơn |
| **Size** | ⚠️ Image lớn hơn | ✅ Nhẹ hơn |

---

## 🆘 Troubleshooting

### **Lỗi: "Cannot find module"**
- Kiểm tra `package.json` có trong Dockerfile
- Đảm bảo `npm ci` chạy đúng

### **Lỗi: "Port already in use"**
- Đảm bảo dùng `process.env.PORT`
- Không hardcode port trong code

### **Lỗi: "MongoDB connection failed"**
- Kiểm tra MongoDB URI đúng
- Đảm bảo MongoDB accessible từ container

### **Lỗi: "Build failed"**
- Kiểm tra Dockerfile syntax
- Kiểm tra `.dockerignore` không loại bỏ file cần thiết

---

## 📚 Tài Liệu Tham Khảo

- Railway Docker: https://docs.railway.app/deploy/dockerfiles
- Render Docker: https://render.com/docs/docker
- Fly.io Docker: https://fly.io/docs/getting-started/dockerfile
- Docker Docs: https://docs.docker.com

---

## ✅ Kết Luận

**Docker là lựa chọn tốt** vì:
- ✅ Consistency - Chạy giống nhau mọi nơi
- ✅ Isolation - Không ảnh hưởng host system
- ✅ Portability - Deploy được nhiều platform
- ✅ Reproducibility - Dễ reproduce issues

**Khuyến nghị:**
- **Railway** - Dễ nhất, hỗ trợ Docker native
- **Render** - Free tier, hỗ trợ Docker
- **Fly.io** - Tốt cho production, có CLI mạnh

