# 🚀 Hướng dẫn Deploy Backend lên AWS

## Tổng quan

Có 2 phương án chính để deploy backend lên AWS:

1. **AWS Elastic Beanstalk** (Khuyến nghị) - Dễ nhất, tự động scale
2. **EC2 + Docker** - Tự quản lý hoàn toàn

---

## Phương án 1: AWS Elastic Beanstalk (Khuyến nghị)

### Ưu điểm:
- ✅ Setup đơn giản, tự động scale
- ✅ Tự động load balancing, health checks
- ✅ Tích hợp với CloudWatch, S3
- ✅ Hỗ trợ Docker và Node.js native

### Bước 1: Cài đặt AWS CLI và EB CLI

```bash
# Cài AWS CLI (nếu chưa có)
# Windows: Download từ https://aws.amazon.com/cli/
# Mac: brew install awscli
# Linux: sudo apt-get install awscli

# Cài EB CLI
pip install awsebcli

# Verify
aws --version
eb --version
```

### Bước 2: Cấu hình AWS Credentials

```bash
aws configure
# Nhập:
# - AWS Access Key ID: [lấy từ IAM Console]
# - AWS Secret Access Key: [lấy từ IAM Console]
# - Default region: ap-southeast-2 (Sydney) hoặc ap-southeast-1 (Singapore)
# - Default output format: json
```

### Bước 3: Khởi tạo Elastic Beanstalk Application

```bash
cd backend

# Khởi tạo EB app
eb init

# Chọn:
# - Platform: Docker (hoặc Node.js nếu không dùng Docker)
# - Region: ap-southeast-2
# - Application name: internship-ai-platform-backend
# - Environment name: production (hoặc staging)
```

### Bước 4: Tạo Environment Variables

Tạo file `.ebextensions/environment.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    MONGO_URI: "mongodb+srv://..."
    JWT_SECRET: "your-secret"
    REDIS_URL: "redis://..."
    CHROMA_URL: "http://localhost:8000"
    # ... các env vars khác
```

**Hoặc set qua AWS Console:**
1. Vào Elastic Beanstalk Console
2. Chọn Environment → Configuration → Software
3. Thêm Environment Properties

### Bước 5: Deploy

```bash
# Deploy lần đầu
eb create production

# Hoặc deploy update
eb deploy

# Xem logs
eb logs

# Mở trong browser
eb open
```

### Bước 6: Setup MongoDB Atlas (nếu chưa có)

1. Vào https://www.mongodb.com/cloud/atlas
2. Tạo cluster (Free tier OK)
3. Whitelist IP của Elastic Beanstalk (hoặc 0.0.0.0/0 cho dev)
4. Copy connection string → set vào `MONGO_URI`

### Bước 7: Setup Redis (ElastiCache)

```bash
# Tạo ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id redis-backend \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1

# Lấy endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id redis-backend \
  --show-cache-node-info
```

Set `REDIS_URL` trong environment variables.

### Bước 8: Setup ChromaDB (tùy chọn)

Có 2 cách:

**Option A: Chạy ChromaDB trên EC2 riêng**
```bash
# Tạo EC2 instance
# Install Docker
sudo yum install docker -y
sudo systemctl start docker

# Run ChromaDB
docker run -d -p 8000:8000 chromadb/chroma:latest
```

**Option B: Dùng ChromaDB Cloud (nếu có)**

---

## Phương án 2: EC2 + Docker (Tự quản lý)

### Bước 1: Tạo EC2 Instance

1. Vào EC2 Console → Launch Instance
2. Chọn:
   - **AMI**: Amazon Linux 2023 (hoặc Ubuntu 22.04)
   - **Instance Type**: t3.medium (tối thiểu, có thể scale lên)
   - **Key Pair**: Tạo mới hoặc dùng existing
   - **Security Group**: Mở port 22 (SSH), 3000 (HTTP), 80, 443

### Bước 2: Connect vào EC2

```bash
# Windows PowerShell
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Hoặc dùng AWS Systems Manager Session Manager (không cần SSH key)
```

### Bước 3: Cài đặt Docker trên EC2

```bash
# Amazon Linux 2023
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Logout và login lại
exit
# SSH lại vào

# Verify
docker --version
```

### Bước 4: Cài đặt Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### Bước 5: Clone Repository

```bash
# Cài Git
sudo yum install git -y

# Clone repo (hoặc upload code)
git clone YOUR_REPO_URL
cd internship-recruitment-platform/backend
```

### Bước 6: Build và Run Docker Container

```bash
# Build image
docker build -t backend-app .

# Run container
docker run -d \
  --name backend \
  -p 3000:3000 \
  --env-file .env \
  backend-app

# Hoặc dùng docker-compose
docker-compose up -d
```

### Bước 7: Setup Nginx Reverse Proxy (Optional)

```bash
# Cài Nginx
sudo yum install nginx -y

# Config
sudo nano /etc/nginx/conf.d/backend.conf
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Bước 8: Setup SSL với Let's Encrypt

```bash
# Cài Certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Bước 9: Setup Auto-restart với PM2 (nếu không dùng Docker)

```bash
npm install -g pm2
pm2 start server.js --name backend
pm2 save
pm2 startup
```

---

## Setup Environment Variables

Tạo file `.env` trên server:

```bash
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your-super-secret-key

# Redis
REDIS_URL=redis://your-redis-endpoint:6379

# ChromaDB
CHROMA_URL=http://localhost:8000

# Cloudinary (nếu dùng)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Port
PORT=3000
NODE_ENV=production
```

---

## Monitoring & Logs

### CloudWatch Logs (Elastic Beanstalk)

```bash
eb logs --all
```

### EC2 Logs

```bash
# Docker logs
docker logs backend

# PM2 logs
pm2 logs backend
```

---

## Auto-scaling (Elastic Beanstalk)

1. Vào Elastic Beanstalk Console
2. Configuration → Capacity
3. Enable Auto Scaling:
   - Min instances: 1
   - Max instances: 5
   - Trigger: CPU > 70% → scale up

---

## Backup & Recovery

### MongoDB Backup

```bash
# Setup automated backup với MongoDB Atlas
# Hoặc dùng mongodump
mongodump --uri="mongodb+srv://..." --out=/backup
```

### Application Backup

```bash
# Backup code
tar -czf backup-$(date +%Y%m%d).tar.gz /var/app/current
```

---

## Troubleshooting

### Lỗi: Port 3000 đã được sử dụng

```bash
# Tìm process
sudo lsof -i :3000
# Kill process
sudo kill -9 PID
```

### Lỗi: Docker không start

```bash
sudo systemctl status docker
sudo systemctl restart docker
```

### Lỗi: MongoDB connection timeout

- Kiểm tra Security Group: mở port 27017
- Whitelist IP của EC2 trong MongoDB Atlas

---

## Cost Estimation

### Elastic Beanstalk:
- EC2 t3.medium: ~$30/tháng
- Load Balancer: ~$16/tháng
- **Tổng: ~$46/tháng**

### EC2 Direct:
- EC2 t3.medium: ~$30/tháng
- **Tổng: ~$30/tháng**

### Free Tier (12 tháng đầu):
- t2.micro: FREE
- **Tổng: $0/tháng** (giới hạn 750h/tháng)

---

## Next Steps

1. ✅ Setup domain name (Route 53)
2. ✅ Setup CDN (CloudFront)
3. ✅ Setup CI/CD (CodePipeline)
4. ✅ Setup monitoring (CloudWatch Alarms)
5. ✅ Setup backup automation

---

## Liên kết hữu ích

- [AWS Elastic Beanstalk Docs](https://docs.aws.amazon.com/elasticbeanstalk/)
- [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com/)

