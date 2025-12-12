# ⚡ ChromaDB Quick Start cho Windows

## Giải thích lệnh

### `chmod +x` là gì?

- **`chmod`**: Change mode (Linux/Mac command)
- **`+x`**: Add execute permission
- **Mục đích**: Cho phép file script chạy được

**Trên Windows:** Không cần `chmod`, file `.ps1` hoặc `.bat` có thể chạy trực tiếp.

---

## Cách 1: Dùng PowerShell Script (Khuyến nghị cho Windows)

### Bước 1: Tạo EC2 Instance trước

Vào AWS Console → EC2 → Launch Instance:
- **AMI**: Amazon Linux 2023
- **Instance Type**: t3.small (minimum)
- **Key Pair**: Tạo mới hoặc dùng existing
- **Security Group**: Mở port 22 (SSH) và 8000 (ChromaDB)

### Bước 2: Chạy PowerShell Script

```powershell
# Mở PowerShell trong thư mục backend/scripts
cd backend\scripts

# Chạy script (thay YOUR_EC2_IP và path đến SSH key)
.\setup-chromadb-ec2.ps1 -EC2IP "54.123.45.67" -SSHKeyPath "C:\Users\YourName\.ssh\your-key.pem"
```

**Lưu ý:** Cần có SSH client (Git Bash hoặc OpenSSH trên Windows 10+)

---

## Cách 2: Tự động tạo EC2 + Setup (Dễ nhất)

Script này sẽ tự động:
1. ✅ Tạo EC2 instance
2. ✅ Setup Security Group
3. ✅ Install Docker
4. ✅ Run ChromaDB

```powershell
# Chạy script tự động
cd backend\scripts

.\setup-chromadb-ec2-aws-cli.ps1 `
  -InstanceType "t3.small" `
  -KeyName "your-key-name" `
  -Region "ap-southeast-1"
```

**Yêu cầu:**
- AWS CLI đã cài và configured
- Có quyền tạo EC2 instances
- Có Key Pair trong AWS

---

## Cách 3: Dùng AWS Console (Manual - Không cần script)

### Bước 1: Tạo EC2 Instance

1. Vào EC2 Console → Launch Instance
2. Chọn:
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: t3.small
   - **Key Pair**: Your key
   - **Security Group**: 
     - Port 22 (SSH) từ 0.0.0.0/0
     - Port 8000 (ChromaDB) từ 0.0.0.0/0 (hoặc App Runner IP)

### Bước 2: Connect vào EC2

**Option A: Dùng AWS Systems Manager (Không cần SSH key)**
1. Vào EC2 Console → Instances → Chọn instance
2. Click "Connect" → "Session Manager" → "Connect"

**Option B: Dùng SSH (Cần SSH key)**
```powershell
# Windows PowerShell
ssh -i C:\path\to\your-key.pem ec2-user@YOUR_EC2_IP
```

### Bước 3: Chạy lệnh trên EC2

```bash
# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Logout và login lại
exit
# SSH lại vào

# Run ChromaDB
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v chroma-data:/chroma/chroma \
  -e IS_PERSISTENT=TRUE \
  -e PERSIST_DIRECTORY=/chroma/chroma \
  -e ANONYMIZED_TELEMETRY=FALSE \
  --restart unless-stopped \
  chromadb/chroma:latest

# Test
curl http://localhost:8000/api/v1/heartbeat
```

---

## Cách 4: Dùng Docker Compose trên EC2

### Bước 1: Tạo file `docker-compose.yml` trên EC2

```bash
# SSH vào EC2
ssh ec2-user@YOUR_EC2_IP

# Tạo file
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - PERSIST_DIRECTORY=/chroma/chroma
    restart: unless-stopped

volumes:
  chroma-data:
EOF
```

### Bước 2: Chạy với Docker Compose

```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Run
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## Sau khi setup xong

### 1. Test Connection

```powershell
# Từ local Windows
curl http://YOUR_EC2_IP:8000/api/v1/heartbeat

# Hoặc dùng browser
# Mở: http://YOUR_EC2_IP:8000/api/v1/heartbeat
```

### 2. Update App Runner Environment Variables

Vào AWS Console → App Runner → internship-backend → Configuration → Environment variables

Thêm:
```
CHROMA_URL=http://YOUR_EC2_IP:8000
CHROMA_COLLECTION_JOBS=jobs
```

### 3. Verify trong Backend Logs

Sau khi deploy, check logs:
```
✅ ChromaDB connected successfully
✅ Pre-computed X jobs into Chroma
```

---

## Troubleshooting

### Lỗi: "Permission denied" khi chạy script

**Windows:**
```powershell
# Unblock script
Unblock-File .\setup-chromadb-ec2.ps1

# Hoặc set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Lỗi: "SSH not found"

**Cài Git for Windows** (có kèm SSH):
- Download: https://git-scm.com/download/win
- Hoặc dùng WSL: `wsl --install`

### Lỗi: "Connection timeout" từ App Runner

1. Kiểm tra Security Group: Port 8000 phải mở
2. Kiểm tra EC2 Public IP đúng
3. Test từ local: `curl http://EC2_IP:8000/api/v1/heartbeat`

---

## Cost Estimate

- **EC2 t3.small**: ~$15/tháng
- **EBS 20GB**: ~$2/tháng
- **Data Transfer**: ~$1-5/tháng (tùy usage)
- **Total**: ~$18-22/tháng

**Free Tier:** Không có free tier cho t3.small, nhưng có thể dùng t2.micro (FREE 12 tháng đầu) - nhưng không khuyến nghị cho production.

---

## Next Steps

1. ✅ Setup ChromaDB trên EC2
2. ✅ Update CHROMA_URL trong App Runner
3. ✅ Test connection
4. ✅ Deploy backend và verify logs
5. ✅ Setup monitoring (CloudWatch)

