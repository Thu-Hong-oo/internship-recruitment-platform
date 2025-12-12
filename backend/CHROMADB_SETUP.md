# 🗄️ ChromaDB Setup cho Production

## Vấn đề

ChromaDB **KHÔNG thể chạy trong cùng container** với Node.js backend. Cần setup riêng.

## Giải pháp

### Option 1: ChromaDB trên EC2 riêng (Khuyến nghị cho production)

#### Bước 1: Tạo EC2 Instance

```bash
# Tạo EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --region ap-southeast-1
```

**Security Group cần mở:**
- Port 8000 (ChromaDB HTTP)
- Port 22 (SSH)

#### Bước 2: Install Docker trên EC2

```bash
# SSH vào EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Logout và login lại
exit
# SSH lại
```

#### Bước 3: Run ChromaDB Container

```bash
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

# Verify
curl http://localhost:8000/api/v1/heartbeat
```

#### Bước 4: Update Environment Variables

Trong App Runner / Elastic Beanstalk, set:
```
CHROMA_URL=http://YOUR_EC2_IP:8000
CHROMA_COLLECTION_JOBS=jobs
```

---

### Option 2: ChromaDB trong ECS/Fargate (Scalable)

#### Tạo ECS Task Definition

```json
{
  "family": "chromadb",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "chromadb",
      "image": "chromadb/chroma:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "IS_PERSISTENT",
          "value": "TRUE"
        },
        {
          "name": "PERSIST_DIRECTORY",
          "value": "/chroma/chroma"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "chroma-data",
          "containerPath": "/chroma/chroma"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/chromadb",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "chroma-data"
    }
  ]
}
```

#### Tạo ECS Service

```bash
aws ecs create-service \
  --cluster chromadb-cluster \
  --service-name chromadb \
  --task-definition chromadb \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

### Option 3: ChromaDB Cloud (Managed Service - Easiest)

1. Vào https://www.trychroma.com/
2. Tạo account
3. Tạo database
4. Copy connection string
5. Set vào `CHROMA_URL` trong environment variables

**Lưu ý:** ChromaDB Cloud có free tier nhưng giới hạn.

---

### Option 4: ChromaDB trong Docker Compose (Chỉ cho local/dev)

File `docker-compose.prod.yml` đã có ChromaDB service, nhưng chỉ dùng cho local development.

---

## Update Workflow để Auto-Setup ChromaDB

Có thể thêm step vào GitHub Actions để tự động setup ChromaDB trên EC2:

```yaml
- name: Setup ChromaDB on EC2
  run: |
    ssh -i ${{ secrets.EC2_SSH_KEY }} ec2-user@${{ secrets.CHROMADB_EC2_IP }} << 'EOF'
      docker pull chromadb/chroma:latest
      docker stop chromadb || true
      docker rm chromadb || true
      docker run -d \
        --name chromadb \
        -p 8000:8000 \
        -v chroma-data:/chroma/chroma \
        -e IS_PERSISTENT=TRUE \
        --restart unless-stopped \
        chromadb/chroma:latest
    EOF
```

---

## Kiểm tra ChromaDB Connection

```bash
# Test từ backend container
curl http://CHROMA_URL/api/v1/heartbeat

# Hoặc từ local
curl http://YOUR_EC2_IP:8000/api/v1/heartbeat
```

---

## Troubleshooting

### Lỗi: "Failed to connect to chromadb"

1. Kiểm tra ChromaDB đang chạy:
   ```bash
   docker ps | grep chroma
   ```

2. Kiểm tra port 8000 mở:
   ```bash
   netstat -tuln | grep 8000
   ```

3. Kiểm tra Security Group:
   - Port 8000 phải mở cho App Runner IP hoặc 0.0.0.0/0

4. Kiểm tra CHROMA_URL environment variable:
   ```bash
   echo $CHROMA_URL
   ```

### Lỗi: "Not enough free disk space"

1. Tăng disk size cho EC2 instance
2. Hoặc cleanup old Docker images:
   ```bash
   docker system prune -a
   ```

### Lỗi: Model download timeout

- Model đã được pre-download trong Dockerfile
- Nếu vẫn lỗi, tăng timeout trong code:
  ```python
  os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '300'
  ```

---

## Recommended Setup cho Production

**Best Practice:**
1. ✅ ChromaDB trên EC2 riêng (t3.small minimum)
2. ✅ EBS volume để persist data
3. ✅ Auto-restart với systemd hoặc Docker restart policy
4. ✅ Backup định kỳ volume
5. ✅ Monitoring với CloudWatch

**Cost:**
- EC2 t3.small: ~$15/tháng
- EBS 20GB: ~$2/tháng
- **Total: ~$17/tháng**

---

## Quick Start Script

Tạo file `scripts/setup-chromadb-ec2.sh`:

```bash
#!/bin/bash
# Setup ChromaDB on EC2

EC2_IP=$1
SSH_KEY=$2

if [ -z "$EC2_IP" ] || [ -z "$SSH_KEY" ]; then
  echo "Usage: ./setup-chromadb-ec2.sh <EC2_IP> <SSH_KEY_PATH>"
  exit 1
fi

ssh -i $SSH_KEY ec2-user@$EC2_IP << 'EOF'
  # Install Docker
  sudo yum update -y
  sudo yum install docker -y
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -a -G docker ec2-user

  # Run ChromaDB
  docker run -d \
    --name chromadb \
    -p 8000:8000 \
    -v chroma-data:/chroma/chroma \
    -e IS_PERSISTENT=TRUE \
    -e PERSIST_DIRECTORY=/chroma/chroma \
    --restart unless-stopped \
    chromadb/chroma:latest

  # Wait for ChromaDB to start
  sleep 10
  curl http://localhost:8000/api/v1/heartbeat
EOF

echo "✅ ChromaDB setup complete!"
```

