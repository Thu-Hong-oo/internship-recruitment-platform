#!/bin/bash
# Setup ChromaDB on EC2 for production

set -e

EC2_IP=${1:-""}
SSH_KEY=${2:-""}

if [ -z "$EC2_IP" ] || [ -z "$SSH_KEY" ]; then
  echo "Usage: ./setup-chromadb-ec2.sh <EC2_IP> <SSH_KEY_PATH>"
  echo "Example: ./setup-chromadb-ec2.sh 54.123.45.67 ~/.ssh/my-key.pem"
  exit 1
fi

echo "🚀 Setting up ChromaDB on EC2: $EC2_IP"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$EC2_IP << 'EOF'
  echo "📦 Installing Docker..."
  
  # Install Docker (Amazon Linux 2023)
  if ! command -v docker &> /dev/null; then
    sudo yum update -y
    sudo yum install docker -y
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker ec2-user
    echo "✅ Docker installed"
  else
    echo "✅ Docker already installed"
  fi

  # Stop existing ChromaDB if running
  echo "🛑 Stopping existing ChromaDB..."
  docker stop chromadb 2>/dev/null || true
  docker rm chromadb 2>/dev/null || true

  # Pull latest ChromaDB image
  echo "📥 Pulling ChromaDB image..."
  docker pull chromadb/chroma:latest

  # Run ChromaDB container
  echo "🚀 Starting ChromaDB..."
  docker run -d \
    --name chromadb \
    -p 8000:8000 \
    -v chroma-data:/chroma/chroma \
    -e IS_PERSISTENT=TRUE \
    -e PERSIST_DIRECTORY=/chroma/chroma \
    -e ANONYMIZED_TELEMETRY=FALSE \
    --restart unless-stopped \
    chromadb/chroma:latest

  # Wait for ChromaDB to start
  echo "⏳ Waiting for ChromaDB to start..."
  sleep 15

  # Test connection
  echo "🧪 Testing ChromaDB connection..."
  for i in {1..10}; do
    if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
      echo "✅ ChromaDB is running!"
      exit 0
    fi
    echo "   Attempt $i/10: Waiting..."
    sleep 3
  done

  echo "❌ ChromaDB failed to start. Check logs:"
  docker logs chromadb
  exit 1
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ ChromaDB setup complete!"
  echo "📍 ChromaDB URL: http://$EC2_IP:8000"
  echo ""
  echo "📝 Next steps:"
  echo "   1. Update CHROMA_URL in App Runner/EB: http://$EC2_IP:8000"
  echo "   2. Update Security Group to allow port 8000 from App Runner"
  echo "   3. Test connection: curl http://$EC2_IP:8000/api/v1/heartbeat"
else
  echo "❌ Setup failed. Check errors above."
  exit 1
fi

