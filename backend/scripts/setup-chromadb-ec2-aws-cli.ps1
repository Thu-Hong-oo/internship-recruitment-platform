# Setup ChromaDB on EC2 using AWS CLI (PowerShell version)
# This script creates EC2 instance and sets up ChromaDB automatically

param(
    [Parameter(Mandatory=$false)]
    [string]$InstanceType = "t3.small",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyName = "default-key",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1",
    
    [Parameter(Mandatory=$false)]
    [string]$SecurityGroupId = ""
)

Write-Host "Creating EC2 instance for ChromaDB..." -ForegroundColor Green

# Get default VPC
$vpcId = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $Region
if (-not $vpcId) {
    Write-Host "No default VPC found. Please specify VPC manually." -ForegroundColor Red
    exit 1
}

# Get default subnet
$subnetId = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" --query "Subnets[0].SubnetId" --output text --region $Region

# Create security group if not provided
if (-not $SecurityGroupId) {
    Write-Host "Creating security group..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $sgName = "chromadb-sg-$timestamp"
    
    $sgOutput = aws ec2 create-security-group --group-name $sgName --description "Security group for ChromaDB" --vpc-id $vpcId --region $Region --query "GroupId" --output text
    $SecurityGroupId = $sgOutput
    
    # Allow port 8000 from anywhere
    aws ec2 authorize-security-group-ingress --group-id $SecurityGroupId --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region $Region | Out-Null
    
    # Allow SSH
    aws ec2 authorize-security-group-ingress --group-id $SecurityGroupId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $Region | Out-Null
    
    Write-Host "Security group created: $SecurityGroupId" -ForegroundColor Green
}

# Get latest Amazon Linux 2023 AMI
Write-Host "Getting latest Amazon Linux 2023 AMI..." -ForegroundColor Yellow
$amiId = aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023*" "Name=architecture,Values=x86_64" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --output text --region $Region

if (-not $amiId) {
    Write-Host "Could not find Amazon Linux 2023 AMI" -ForegroundColor Red
    exit 1
}

Write-Host "Using AMI: $amiId" -ForegroundColor Green

# User data script to setup ChromaDB
$userDataScript = @"
#!/bin/bash
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
sleep 10
docker run -d --name chromadb -p 8000:8000 -v chroma-data:/chroma/chroma -e IS_PERSISTENT=TRUE -e PERSIST_DIRECTORY=/chroma/chroma -e ANONYMIZED_TELEMETRY=FALSE --restart unless-stopped chromadb/chroma:latest
sleep 20
curl http://localhost:8000/api/v1/heartbeat
"@

# Base64 encode user data
$bytes = [System.Text.Encoding]::UTF8.GetBytes($userDataScript)
$userDataBase64 = [Convert]::ToBase64String($bytes)

# Create EC2 instance
Write-Host "Launching EC2 instance..." -ForegroundColor Yellow
$tagSpec = "ResourceType=instance,Tags=[{Key=Name,Value=chromadb-server}]"
$instanceId = aws ec2 run-instances --image-id $amiId --instance-type $InstanceType --key-name $KeyName --security-group-ids $SecurityGroupId --subnet-id $subnetId --user-data $userDataBase64 --tag-specifications $tagSpec --region $Region --query "Instances[0].InstanceId" --output text

if (-not $instanceId) {
    Write-Host "Failed to create EC2 instance" -ForegroundColor Red
    exit 1
}

Write-Host "EC2 instance created: $instanceId" -ForegroundColor Green
Write-Host "Waiting for instance to be running..." -ForegroundColor Yellow

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $instanceId --region $Region

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --region $Region --query "Reservations[0].Instances[0].PublicIpAddress" --output text

Write-Host ""
Write-Host "ChromaDB setup complete!" -ForegroundColor Green
Write-Host "Instance ID: $instanceId" -ForegroundColor Cyan
Write-Host "Public IP: $publicIp" -ForegroundColor Cyan
Write-Host "ChromaDB URL: http://$publicIp:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 2-3 minutes for ChromaDB to fully start" -ForegroundColor White
Write-Host "  2. Test connection: curl http://$publicIp:8000/api/v1/heartbeat" -ForegroundColor White
Write-Host "  3. Update CHROMA_URL in App Runner: http://$publicIp:8000" -ForegroundColor White
Write-Host "  4. Update Security Group if needed (already allows port 8000)" -ForegroundColor White
Write-Host ""
Write-Host "To SSH into instance:" -ForegroundColor Yellow
Write-Host "  ssh -i $KeyName.pem ec2-user@$publicIp" -ForegroundColor White
