# Setup ChromaDB on EC2 for production (PowerShell version)

param(
    [Parameter(Mandatory=$true)]
    [string]$EC2IP,
    
    [Parameter(Mandatory=$true)]
    [string]$SSHKeyPath
)

if (-not (Test-Path $SSHKeyPath)) {
    Write-Host "❌ SSH key not found: $SSHKeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Setting up ChromaDB on EC2: $EC2IP" -ForegroundColor Green

# SSH command to run on EC2
$sshCommand = @"
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
  echo "   Attempt \$i/10: Waiting..."
  sleep 3
done

echo "❌ ChromaDB failed to start. Check logs:"
docker logs chromadb
exit 1
"@

# Execute SSH command
Write-Host "📡 Connecting to EC2 and running setup..." -ForegroundColor Yellow

# Use ssh.exe (from Git Bash or WSL) or OpenSSH (Windows 10+)
if (Get-Command ssh -ErrorAction SilentlyContinue) {
    $sshCommand | ssh -i $SSHKeyPath -o StrictHostKeyChecking=no ec2-user@$EC2IP
} else {
    Write-Host "❌ SSH not found. Please install:" -ForegroundColor Red
    Write-Host "   1. Git for Windows (includes SSH)" -ForegroundColor Yellow
    Write-Host "   2. Or use WSL (Windows Subsystem for Linux)" -ForegroundColor Yellow
    Write-Host "   3. Or use AWS Systems Manager Session Manager" -ForegroundColor Yellow
    exit 1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ChromaDB setup complete!" -ForegroundColor Green
    Write-Host "📍 ChromaDB URL: http://$EC2IP:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Update CHROMA_URL in App Runner/EB: http://$EC2IP:8000" -ForegroundColor White
    Write-Host "   2. Update Security Group to allow port 8000 from App Runner" -ForegroundColor White
    Write-Host "   3. Test connection: curl http://$EC2IP:8000/api/v1/heartbeat" -ForegroundColor White
} else {
    Write-Host "❌ Setup failed. Check errors above." -ForegroundColor Red
    exit 1
}

