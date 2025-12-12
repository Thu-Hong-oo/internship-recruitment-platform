# AWS App Runner Deployment Guide

## Vấn đề hiện tại

App Runner đang fail với lỗi:
- ✅ Image đã được pull thành công từ ECR
- ❌ **Database connection error** - `MONGO_URI` không được set
- ❌ Health check failed trên port 3000

## Giải pháp: Set Environment Variables

App Runner cần các environment variables sau để chạy:

### Required (Bắt buộc)
1. **MONGO_URI** - MongoDB connection string
   - Ví dụ: `mongodb+srv://user:password@cluster.mongodb.net/internbridge`
   - Hoặc: `mongodb://host:27017/internbridge`

2. **JWT_SECRET** - Secret key cho JWT tokens
   - Ví dụ: `your-super-secret-jwt-key-here`

### Optional (Tùy chọn)
3. **PORT** - Server port (default: 3000)
4. **NODE_ENV** - Environment (default: production)
5. **REDIS_URL** - Redis connection (optional)
6. **CHROMA_URL** - ChromaDB URL (optional)
7. **GEMINI_API_KEY** - Google Gemini API (optional)

## Cách 1: Set qua AWS Console (Khuyến nghị)

1. Vào AWS App Runner Console:
   ```
   https://console.aws.amazon.com/apprunner/home?region=ap-southeast-1#/services/internship-backend
   ```

2. Click vào service `internship-backend`

3. Vào tab **"Configuration"**

4. Click **"Edit"** trong phần **"Source and deployment"**

5. Scroll xuống phần **"Runtime environment variables"**

6. Thêm các biến:
   ```
   MONGO_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-secret-key
   PORT=3000
   NODE_ENV=production
   ```

7. Click **"Save changes"** và đợi deployment mới

## Cách 2: Set qua AWS CLI

### Bước 1: Get service ARN
```powershell
$env:AWS_PROFILE="InternBridge"
aws apprunner list-services --region ap-southeast-1 --query "ServiceSummaryList[?ServiceName=='internship-backend'].ServiceArn" --output text
```

### Bước 2: Get current configuration
```powershell
$serviceArn = "arn:aws:apprunner:ap-southeast-1:919833106421:service/internship-backend/..."
aws apprunner describe-service --service-arn $serviceArn --region ap-southeast-1 > current-config.json
```

### Bước 3: Update với environment variables
```powershell
aws apprunner update-service `
  --service-arn $serviceArn `
  --region ap-southeast-1 `
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "919833106421.dkr.ecr.ap-southeast-1.amazonaws.com/intern_bridge:latest",
      "ImageConfiguration": {
        "RuntimeEnvironmentVariables": {
          "MONGO_URI": "mongodb+srv://user:pass@cluster.mongodb.net/internbridge",
          "JWT_SECRET": "your-secret-key",
          "PORT": "3000",
          "NODE_ENV": "production"
        },
        "Port": "3000"
      }
    },
    "AutoDeploymentsEnabled": true
  }'
```

## Cách 3: Dùng script tự động

Chạy script interactive:
```powershell
$env:AWS_PROFILE="InternBridge"
powershell -ExecutionPolicy Bypass -File scripts\configure-app-runner-env.ps1
```

Script sẽ hỏi từng environment variable và update service tự động.

## Kiểm tra sau khi update

1. Xem logs trong App Runner Console
2. Kiểm tra deployment status:
   ```powershell
   aws apprunner describe-service --service-arn $serviceArn --region ap-southeast-1
   ```
3. Test health endpoint:
   ```powershell
   curl https://bsfrbngas3.ap-southeast-1.awsapprunner.com/health
   ```

## Lưu ý quan trọng

- ⚠️ **MONGO_URI phải accessible từ App Runner** (public MongoDB Atlas hoặc VPC connection)
- ⚠️ **JWT_SECRET** phải đủ mạnh và giữ bí mật
- ⚠️ Sau khi update, App Runner sẽ tự động trigger deployment mới
- ⚠️ Deployment mất khoảng 5-10 phút

## Troubleshooting

### Nếu vẫn fail sau khi set environment variables:

1. Kiểm tra MongoDB connection string có đúng không
2. Kiểm tra MongoDB có allow connection từ App Runner IP không (nếu dùng MongoDB Atlas)
3. Xem logs chi tiết trong App Runner Console > Logs tab
4. Kiểm tra health check endpoint `/health` có hoạt động không

### Common errors:

- **"MONGO_URI environment variable is not defined"** → Chưa set MONGO_URI
- **"Database connection error"** → MongoDB không accessible hoặc connection string sai
- **"Health check failed"** → App không start được hoặc không listen trên port 3000

