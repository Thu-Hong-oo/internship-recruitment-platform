# PowerShell script to update AWS App Runner service after pushing new image
# Usage: .\scripts\update-app-runner.ps1 [-ServiceName "internship-backend"]

param(
    [string]$ServiceName = "internship-backend",
    [string]$Region = "ap-southeast-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Updating AWS App Runner Service..." -ForegroundColor Cyan

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
        Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ AWS credentials verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to verify AWS credentials: $_" -ForegroundColor Red
    exit 1
}

# Get current service configuration
Write-Host "`n📋 Getting App Runner service configuration..." -ForegroundColor Cyan
try {
    $service = aws apprunner describe-service --service-arn (aws apprunner list-services --region $Region --query "ServiceSummaryList[?ServiceName=='$ServiceName'].ServiceArn" --output text) --region $Region 2>&1 | ConvertFrom-Json
    
    if (-not $service) {
        Write-Host "❌ Service '$ServiceName' not found" -ForegroundColor Red
        Write-Host "Available services:" -ForegroundColor Yellow
        aws apprunner list-services --region $Region --query "ServiceSummaryList[].ServiceName" --output table
        exit 1
    }
    
    $serviceArn = $service.Service.ServiceArn
    Write-Host "✅ Found service: $ServiceName" -ForegroundColor Green
    Write-Host "   Service ARN: $serviceArn" -ForegroundColor Gray
    
    # Get current image URI
    $currentImageUri = $service.Service.SourceConfiguration.ImageRepository.ImageIdentifier
    Write-Host "   Current Image: $currentImageUri" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to get service information: $_" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: List all services and find by name
    $services = aws apprunner list-services --region $Region --output json | ConvertFrom-Json
    $service = $services.ServiceSummaryList | Where-Object { $_.ServiceName -eq $ServiceName }
    
    if (-not $service) {
        Write-Host "❌ Service '$ServiceName' not found" -ForegroundColor Red
        exit 1
    }
    
    $serviceArn = $service.ServiceArn
    Write-Host "✅ Found service: $ServiceName" -ForegroundColor Green
}

# Trigger service update (App Runner will detect new image automatically)
Write-Host "`n🔄 Triggering service update..." -ForegroundColor Cyan
Write-Host "App Runner will automatically detect the new image in ECR" -ForegroundColor Yellow

try {
    # Start a new deployment by updating the service
    # App Runner will pull the latest image with the same tag
    $updateResult = aws apprunner start-deployment --service-arn $serviceArn --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment started successfully!" -ForegroundColor Green
        Write-Host $updateResult
    } else {
        # If start-deployment doesn't work, try updating the service configuration
        Write-Host "⚠️  Direct deployment trigger not available, checking service status..." -ForegroundColor Yellow
        
        # App Runner should auto-detect new images, but we can check status
        $status = aws apprunner describe-service --service-arn $serviceArn --region $Region --output json | ConvertFrom-Json
        Write-Host "`n📊 Current Service Status:" -ForegroundColor Cyan
        Write-Host "   Status: $($status.Service.Status)" -ForegroundColor White
        Write-Host "   Health: $($status.Service.HealthCheckConfiguration.Protocol)" -ForegroundColor White
        
        Write-Host "`n💡 Note: App Runner should automatically detect the new image." -ForegroundColor Yellow
        Write-Host "   If it doesn't update automatically, you may need to:" -ForegroundColor Yellow
        Write-Host "   1. Wait a few minutes for auto-detection" -ForegroundColor White
        Write-Host "   2. Or manually update via AWS Console" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Could not trigger deployment directly: $_" -ForegroundColor Yellow
    Write-Host "App Runner should auto-detect the new image within a few minutes" -ForegroundColor Cyan
}

# Monitor deployment status
Write-Host "`n📊 Monitoring deployment status..." -ForegroundColor Cyan
Write-Host "Checking service status every 10 seconds (Ctrl+C to stop)..." -ForegroundColor Yellow

$maxAttempts = 12  # 2 minutes total
$attempt = 0

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 10
    $attempt++
    
    try {
        $status = aws apprunner describe-service --service-arn $serviceArn --region $Region --output json | ConvertFrom-Json
        $serviceStatus = $status.Service.Status
        $serviceUrl = $status.Service.ServiceUrl
        
        Write-Host "[$attempt/$maxAttempts] Status: $serviceStatus" -ForegroundColor $(if ($serviceStatus -eq "RUNNING") { "Green" } else { "Yellow" })
        
        if ($serviceStatus -eq "RUNNING") {
            Write-Host "`n✅ Service is running!" -ForegroundColor Green
            Write-Host "🌐 Service URL: $serviceUrl" -ForegroundColor Cyan
            break
        }
    } catch {
        Write-Host "[$attempt/$maxAttempts] Error checking status: $_" -ForegroundColor Red
    }
}

Write-Host "`n📋 To check status manually, run:" -ForegroundColor Cyan
Write-Host "aws apprunner describe-service --service-arn $serviceArn --region $Region" -ForegroundColor Green

Write-Host "`nView in AWS Console:" -ForegroundColor Cyan
$consoleUrl = 'https://console.aws.amazon.com/apprunner/home?region=' + $Region + '#/services/' + $ServiceName
Write-Host $consoleUrl -ForegroundColor Blue

