# ⚡ AWS Quick Start Guide

## Bước 1: Cài đặt Tools (5 phút)

```bash
# Windows (PowerShell as Admin)
# 1. Cài Python (nếu chưa có)
# Download từ: https://www.python.org/downloads/

# 2. Cài AWS CLI
# Download từ: https://aws.amazon.com/cli/

# 3. Cài EB CLI
pip install awsebcli

# Verify
aws --version
eb --version
```

## Bước 2: Cấu hình AWS Credentials (2 phút)

```bash
aws configure
```

**Lấy credentials từ AWS Console:**
1. Vào IAM Console → Users → Your User → Security credentials
2. Create Access Key → Download CSV
3. Nhập vào `aws configure`:
   - Access Key ID
   - Secret Access Key
   - Region: `ap-southeast-2` (Sydney) hoặc `ap-southeast-1` (Singapore)
   - Output: `json`

## Bước 3: Khởi tạo Elastic Beanstalk (5 phút)

```bash
cd backend

# Khởi tạo
eb init

# Chọn:
# ✅ Select a platform: Docker
# ✅ Select a region: ap-southeast-2
# ✅ Application name: internship-backend
# ✅ Environment name: production
```

## Bước 4: Setup Environment Variables (3 phút)

**Cách 1: Qua AWS Console (Khuyến nghị)**
1. Vào Elastic Beanstalk Console
2. Chọn Environment → Configuration → Software
3. Scroll xuống "Environment properties"
4. Thêm các biến:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   REDIS_URL=redis://...
   CHROMA_URL=http://localhost:8000
   PORT=3000
   NODE_ENV=production
   ```

**Cách 2: Qua Script**
```bash
# Copy .env.example thành .env và điền thông tin
cp .env.example .env
# Edit .env với thông tin của bạn

# Set environment variables
chmod +x scripts/setup-aws-env.sh
./scripts/setup-aws-env.sh
```

## Bước 5: Deploy (10 phút)

```bash
# Deploy lần đầu
eb create production

# Hoặc dùng script
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh production
```

**Lần đầu sẽ mất ~10-15 phút** để:
- Tạo EC2 instance
- Setup load balancer
- Build và deploy Docker image
- Health checks

## Bước 6: Kiểm tra (2 phút)

```bash
# Xem status
eb status

# Xem logs
eb logs

# Mở trong browser
eb open
```

## Bước 7: Setup MongoDB Atlas (nếu chưa có)

1. Vào https://www.mongodb.com/cloud/atlas
2. Tạo cluster (Free tier OK)
3. Database Access → Add user
4. Network Access → Add IP: `0.0.0.0/0` (hoặc IP của EB)
5. Connect → Copy connection string
6. Set vào `MONGO_URI` trong EB Environment Properties

## Bước 8: Setup Redis (Optional)

**Option A: ElastiCache (AWS Managed)**
```bash
# Tạo Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id redis-backend \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1

# Lấy endpoint và set vào REDIS_URL
```

**Option B: Redis Cloud (Free tier)**
- Vào https://redis.com/try-free/
- Tạo database → Copy connection string → Set vào `REDIS_URL`

## Troubleshooting

### Lỗi: "EB CLI not found"
```bash
pip install --upgrade awsebcli
```

### Lỗi: "Access Denied"
- Kiểm tra IAM permissions: cần `ElasticBeanstalkFullAccess`
- Hoặc tạo IAM user với đủ quyền

### Lỗi: "Port 3000 already in use"
- EB tự động map port, không cần lo
- Nếu tự deploy EC2: đổi PORT trong .env

### Lỗi: "MongoDB connection timeout"
- Whitelist IP của EB trong MongoDB Atlas
- Hoặc dùng `0.0.0.0/0` cho dev (không khuyến nghị production)

## Next Steps

✅ **Domain Name**: Setup Route 53 → Point to EB CNAME  
✅ **SSL**: EB tự động setup SSL với ACM  
✅ **Monitoring**: CloudWatch logs tự động  
✅ **Auto-scaling**: Enable trong EB Console → Configuration → Capacity  

## Cost

- **Free Tier (12 tháng đầu)**: $0/tháng (t2.micro)
- **Sau free tier**: ~$30-50/tháng (t3.medium + load balancer)

## Commands Cheat Sheet

```bash
# Deploy
eb deploy

# View logs
eb logs

# SSH vào instance
eb ssh

# View status
eb status

# List environments
eb list

# Open in browser
eb open

# Set environment variable
eb setenv KEY=value

# View environment variables
eb printenv
```

## Support

- 📖 [Full Guide](./AWS_DEPLOYMENT_GUIDE.md)
- 🔗 [AWS EB Docs](https://docs.aws.amazon.com/elasticbeanstalk/)
- 💬 Issues: GitHub Issues

