# PowerShell script to push Docker image to AWS ECR
# Usage: .\scripts\push-to-ecr.ps1

param(
    [string]$Region = "ap-southeast-1",
    [string]$AccountId = "919833106421",
    [string]$RepositoryName = "intern_bridge",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting ECR Push Process..." -ForegroundColor Cyan

# Check if AWS CLI is installed
$awsCliInstalled = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsCliInstalled) {
    Write-Host "❌ AWS CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install AWS CLI: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host "Or use: winget install Amazon.AWSCLI" -ForegroundColor Yellow
    exit 1
}

# Set AWS Profile if available
$profiles = aws configure list-profiles 2>&1
if ($profiles -match "InternBridge") {
    $env:AWS_PROFILE = "InternBridge"
    Write-Host "✅ Using AWS Profile: InternBridge" -ForegroundColor Green
}

# Check AWS credentials
Write-Host "`n🔐 Checking AWS credentials..." -ForegroundColor Cyan
try {
    $callerIdentity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ AWS credentials not configured. Please run: aws configure" -ForegroundColor Red
        Write-Host "Or set AWS_PROFILE: `$env:AWS_PROFILE='InternBridge'" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ AWS credentials found" -ForegroundColor Green
    Write-Host $callerIdentity
} catch {
    Write-Host "❌ Failed to verify AWS credentials: $_" -ForegroundColor Red
    exit 1
}

# ECR repository URL
$ecrUrl = "${AccountId}.dkr.ecr.${Region}.amazonaws.com"
$fullImageName = "${ecrUrl}/${RepositoryName}:${ImageTag}"

Write-Host "`n📦 ECR Configuration:" -ForegroundColor Cyan
Write-Host "  Region: $Region"
Write-Host "  Account ID: $AccountId"
Write-Host "  Repository: $RepositoryName"
Write-Host "  Image: $fullImageName"

# Check if repository exists, create if not
Write-Host "`n🔍 Checking if ECR repository exists..." -ForegroundColor Cyan
$repoExists = aws ecr describe-repositories --repository-names $RepositoryName --region $Region 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Repository does not exist. Creating..." -ForegroundColor Yellow
    try {
        aws ecr create-repository --repository-name $RepositoryName --region $Region
        Write-Host "✅ Repository created successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create repository: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Repository exists" -ForegroundColor Green
}

# Login to ECR
Write-Host "`n🔐 Logging in to ECR..." -ForegroundColor Cyan
try {
    $loginCommand = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ecrUrl"
    Invoke-Expression $loginCommand
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to login to ECR" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Successfully logged in to ECR" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to login to ECR: $_" -ForegroundColor Red
    exit 1
}

# Check if local image exists
Write-Host "`n🔍 Checking local Docker image..." -ForegroundColor Cyan
$localImage = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "^intern_bridge:latest$"
if (-not $localImage) {
    Write-Host "❌ Local image 'intern_bridge:latest' not found" -ForegroundColor Red
    Write-Host "Please build the image first: docker build -t intern_bridge ." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Local image found" -ForegroundColor Green

# Tag image if not already tagged
Write-Host "`n🏷️  Tagging image..." -ForegroundColor Cyan
$taggedImage = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "^${ecrUrl}/${RepositoryName}:${ImageTag}$"
if (-not $taggedImage) {
    Write-Host "Tagging intern_bridge:latest as $fullImageName"
    docker tag intern_bridge:latest $fullImageName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to tag image" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Image tagged successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Image already tagged" -ForegroundColor Green
}

# Push image
Write-Host "`n📤 Pushing image to ECR..." -ForegroundColor Cyan
Write-Host "This may take several minutes depending on image size..." -ForegroundColor Yellow
try {
    docker push $fullImageName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to push image" -ForegroundColor Red
        exit 1
    }
    Write-Host "`n✅ Successfully pushed image to ECR!" -ForegroundColor Green
    Write-Host "Image URL: $fullImageName" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to push image: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green

