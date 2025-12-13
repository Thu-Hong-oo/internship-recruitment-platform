# Environment Variables Guide

## ChromaDB Embedded Server

### Không bắt buộc (Tự động detect)

Khi deploy lên App Runner **KHÔNG cần set** các env vars sau, hệ thống sẽ tự động:
- Detect production environment
- Start embedded server trên port 8001
- Sử dụng `/tmp/chroma_db` để lưu data

### Tùy chọn (Nếu muốn customize)

```bash
# ChromaDB Embedded Server (Python)
CHROMA_DB_PATH=/tmp/chroma_db          # Path để lưu ChromaDB data (default: /tmp/chroma_db)
CHROMADB_EMBEDDED_PORT=8001            # Port cho embedded server (default: 8001)

# ChromaDB Client (Node.js)
CHROMA_URL=http://localhost:8001      # Nếu set → dùng URL này (override auto-detect)
CHROMADB_URL=http://localhost:8001     # Alias của CHROMA_URL
CHROMA_COLLECTION_JOBS=jobs            # Collection name cho jobs (default: jobs)
CHROMA_COLLECTION_NAME=learning-resources  # Collection name cho learning resources
```

### Khi nào cần set CHROMA_URL?

**Không cần set** nếu:
- ✅ Deploy lên App Runner (embedded server tự động chạy)
- ✅ Localhost với docker-compose (dùng `http://chromadb:8000`)

**Cần set** nếu:
- 🌐 Dùng external ChromaDB server (EC2, ECS, Cloud)
- 🌐 Muốn override auto-detect behavior

---

## Required Environment Variables (App Runner)

### Bắt buộc

```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/internbridge
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3000
NODE_ENV=production
```

### Tùy chọn (nhưng khuyến nghị)

```bash
# Redis (nếu dùng)
REDIS_URL=redis://host:6379

# Google Gemini (nếu dùng AI features)
GEMINI_API_KEY=your-gemini-api-key

# Dialogflow (nếu dùng)
DIALOGFLOW_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
DIALOGFLOW_PROJECT_ID=your-project-id
```

---

## Environment Variables Logic

### ChromaDB Connection Logic

```javascript
// 1. Nếu CHROMA_URL được set → dùng URL đó
if (process.env.CHROMA_URL) {
  chromaUrl = process.env.CHROMA_URL;
}
// 2. Nếu production/App Runner → dùng embedded server (port 8001)
else if (process.env.NODE_ENV === 'production' || process.env.AWS_EXECUTION_ENV) {
  chromaUrl = 'http://localhost:8001';
}
// 3. Localhost → dùng docker-compose ChromaDB (port 8000)
else {
  chromaUrl = 'http://localhost:8000';
}
```

### ChromaDB Embedded Server Logic

```python
# Python embedded server tự động:
CHROMA_DB_PATH = os.getenv('CHROMA_DB_PATH', '/tmp/chroma_db')
PORT = int(os.getenv('CHROMADB_EMBEDDED_PORT', '8001'))
```

---

## App Runner Configuration

### Cách 1: Qua AWS Console

1. Vào App Runner Console → Service → Configuration
2. Edit → Runtime environment variables
3. Thêm các biến cần thiết (chỉ cần MONGO_URI, JWT_SECRET, PORT, NODE_ENV)
4. **KHÔNG cần set CHROMA_URL** (tự động dùng embedded server)

### Cách 2: Qua AWS CLI

```powershell
aws apprunner update-service \
  --service-arn <SERVICE_ARN> \
  --region ap-southeast-1 \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "919833106421.dkr.ecr.ap-southeast-1.amazonaws.com/intern_bridge:latest",
      "ImageConfiguration": {
        "RuntimeEnvironmentVariables": {
          "MONGO_URI": "mongodb+srv://...",
          "JWT_SECRET": "...",
          "PORT": "3000",
          "NODE_ENV": "production"
        },
        "Port": "3000"
      }
    }
  }'
```

---

## Summary

### ✅ App Runner (Production)

**Không cần set:**
- `CHROMA_URL` → Tự động dùng embedded server
- `CHROMADB_EMBEDDED_PORT` → Default 8001
- `CHROMA_DB_PATH` → Default `/tmp/chroma_db`

**Cần set:**
- `MONGO_URI` ✅
- `JWT_SECRET` ✅
- `PORT=3000` ✅
- `NODE_ENV=production` ✅

### ✅ Localhost (Development)

**Docker Compose:**
- `CHROMA_URL=http://chromadb:8000` (tự động set trong docker-compose.yml)

**Standalone:**
- `CHROMA_URL=http://localhost:8000` (nếu chạy ChromaDB server riêng)

### ✅ External ChromaDB Server

**Cần set:**
- `CHROMA_URL=http://your-ec2-ip:8000` (hoặc URL của ChromaDB server)

---

## Troubleshooting

### Lỗi: "Failed to connect to chromadb"

**Trên App Runner:**
- ✅ Embedded server tự động start (không cần config)
- ❌ Nếu vẫn lỗi → check logs xem Python server có start không

**Trên Localhost:**
- ✅ Chạy `docker-compose up chromadb -d`
- ✅ Hoặc set `CHROMA_URL=http://localhost:8000`

### Lỗi: "ChromaDB import failed"

- ✅ ChromaDB đã được install trong Dockerfile
- ❌ Nếu vẫn lỗi → check Python dependencies

