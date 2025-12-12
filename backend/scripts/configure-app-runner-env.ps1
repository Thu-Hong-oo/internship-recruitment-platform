# PowerShell script to configure environment variables for AWS App Runner
# Usage: .\scripts\configure-app-runner-env.ps1 [-ServiceName "internship-backend"]

param(
    [string]$ServiceName = "internship-backend",
    [string]$Region = "ap-southeast-1"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Configure App Runner Environment Variables ===" -ForegroundColor Cyan
Write-Host ""

# Set AWS Profile if available
$profiles = aws configure list-profiles 2>&1
if ($profiles -match "InternBridge") {
    $env:AWS_PROFILE = "InternBridge"
    Write-Host "Using AWS Profile: InternBridge" -ForegroundColor Green
}

# Check AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Cyan
try {
    $callerIdentity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: AWS credentials not configured" -ForegroundColor Red
        exit 1
    }
    Write-Host "AWS credentials verified" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to verify AWS credentials: $_" -ForegroundColor Red
    exit 1
}

# Get service ARN
Write-Host "`nGetting App Runner service information..." -ForegroundColor Cyan
try {
    $services = aws apprunner list-services --region $Region --output json | ConvertFrom-Json
    $service = $services.ServiceSummaryList | Where-Object { $_.ServiceName -eq $ServiceName }
    
    if (-not $service) {
        Write-Host "ERROR: Service '$ServiceName' not found" -ForegroundColor Red
        Write-Host "Available services:" -ForegroundColor Yellow
        $services.ServiceSummaryList | ForEach-Object { Write-Host "  - $($_.ServiceName)" }
        exit 1
    }
    
    $serviceArn = $service.ServiceArn
    Write-Host "Found service: $ServiceName" -ForegroundColor Green
    Write-Host "Service ARN: $serviceArn" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to get service information: $_" -ForegroundColor Red
    exit 1
}

# Get current service configuration
Write-Host "`nGetting current service configuration..." -ForegroundColor Cyan
$currentConfig = aws apprunner describe-service --service-arn $serviceArn --region $Region --output json | ConvertFrom-Json
$currentEnvVars = $currentConfig.Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables

Write-Host "Current environment variables:" -ForegroundColor Yellow
if ($currentEnvVars) {
    $currentEnvVars.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name) = $($_.Value)" -ForegroundColor Gray
    }
} else {
    Write-Host "  (none)" -ForegroundColor Gray
}

# Prompt for environment variables
Write-Host "`n=== Required Environment Variables ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please provide the following environment variables:" -ForegroundColor Yellow
Write-Host ""

$envVars = @{}

# MONGO_URI (Required)
Write-Host "1. MONGO_URI (Required) - MongoDB connection string" -ForegroundColor White
Write-Host "   Example: mongodb+srv://user:pass@cluster.mongodb.net/internbridge" -ForegroundColor Gray
$mongoUri = Read-Host "   Enter MONGO_URI"
if ([string]::IsNullOrWhiteSpace($mongoUri)) {
    Write-Host "ERROR: MONGO_URI is required!" -ForegroundColor Red
    exit 1
}
$envVars["MONGO_URI"] = $mongoUri

# JWT_SECRET (Required)
Write-Host "`n2. JWT_SECRET (Required) - Secret key for JWT tokens" -ForegroundColor White
$jwtSecret = Read-Host "   Enter JWT_SECRET"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    Write-Host "ERROR: JWT_SECRET is required!" -ForegroundColor Red
    exit 1
}
$envVars["JWT_SECRET"] = $jwtSecret

# PORT (Optional, default 3000)
Write-Host "`n3. PORT (Optional, default: 3000)" -ForegroundColor White
$port = Read-Host "   Enter PORT [3000]"
if ([string]::IsNullOrWhiteSpace($port)) {
    $port = "3000"
}
$envVars["PORT"] = $port

# NODE_ENV (Optional, default production)
Write-Host "`n4. NODE_ENV (Optional, default: production)" -ForegroundColor White
$nodeEnv = Read-Host "   Enter NODE_ENV [production]"
if ([string]::IsNullOrWhiteSpace($nodeEnv)) {
    $nodeEnv = "production"
}
$envVars["NODE_ENV"] = $nodeEnv

# REDIS_URL (Optional)
Write-Host "`n5. REDIS_URL (Optional) - Redis connection string" -ForegroundColor White
Write-Host "   Example: redis://host:6379 or leave empty" -ForegroundColor Gray
$redisUrl = Read-Host "   Enter REDIS_URL []"
if (-not [string]::IsNullOrWhiteSpace($redisUrl)) {
    $envVars["REDIS_URL"] = $redisUrl
}

# CHROMA_URL (Optional)
Write-Host "`n6. CHROMA_URL (Optional) - ChromaDB URL" -ForegroundColor White
Write-Host "   Example: http://chromadb:8000 or leave empty" -ForegroundColor Gray
$chromaUrl = Read-Host "   Enter CHROMA_URL []"
if (-not [string]::IsNullOrWhiteSpace($chromaUrl)) {
    $envVars["CHROMA_URL"] = $chromaUrl
    $envVars["CHROMADB_URL"] = $chromaUrl
}

# GEMINI_API_KEY (Optional)
Write-Host "`n7. GEMINI_API_KEY (Optional) - Google Gemini API key" -ForegroundColor White
$geminiKey = Read-Host "   Enter GEMINI_API_KEY []"
if (-not [string]::IsNullOrWhiteSpace($geminiKey)) {
    $envVars["GEMINI_API_KEY"] = $geminiKey
}

# Merge with existing environment variables
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Environment variables to set:" -ForegroundColor Yellow
$allEnvVars = @{}
if ($currentEnvVars) {
    $currentEnvVars.PSObject.Properties | ForEach-Object {
        $allEnvVars[$_.Name] = $_.Value
    }
}
foreach ($key in $envVars.Keys) {
    $allEnvVars[$key] = $envVars[$key]
    Write-Host "  $key = $($envVars[$key])" -ForegroundColor Green
}

# Confirm
Write-Host "`nDo you want to update the App Runner service with these environment variables? (Y/N)" -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Update service
Write-Host "`nUpdating App Runner service..." -ForegroundColor Cyan

# Build environment variables JSON
$envVarsJson = @{}
foreach ($key in $allEnvVars.Keys) {
    $envVarsJson[$key] = $allEnvVars[$key]
}

# Get current service configuration
$serviceConfig = aws apprunner describe-service --service-arn $serviceArn --region $Region --output json | ConvertFrom-Json
$sourceConfig = $serviceConfig.Service.SourceConfiguration

# Create update configuration
$updateConfig = @{
    SourceConfiguration = @{
        ImageRepository = @{
            ImageIdentifier = $sourceConfig.ImageRepository.ImageIdentifier
            ImageConfiguration = @{
                RuntimeEnvironmentVariables = $envVarsJson
                Port = $port
                StartCommand = $sourceConfig.ImageRepository.ImageConfiguration.StartCommand
            }
        }
        AutoDeploymentsEnabled = $sourceConfig.AutoDeploymentsEnabled
    }
    InstanceConfiguration = $serviceConfig.Service.InstanceConfiguration
    HealthCheckConfiguration = $serviceConfig.Service.HealthCheckConfiguration
} | ConvertTo-Json -Depth 10

# Save to temp file
$tempFile = [System.IO.Path]::GetTempFileName()
$updateConfig | Out-File -FilePath $tempFile -Encoding utf8

try {
    # Update service
    Write-Host "Applying configuration..." -ForegroundColor Cyan
    $result = aws apprunner update-service --service-arn $serviceArn --source-configuration "file://$tempFile" --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS: Service updated successfully!" -ForegroundColor Green
        Write-Host "A new deployment will start automatically." -ForegroundColor Yellow
        Write-Host "`nMonitor deployment status:" -ForegroundColor Cyan
        Write-Host "aws apprunner describe-service --service-arn $serviceArn --region $Region" -ForegroundColor Green
    } else {
        Write-Host "`nERROR: Failed to update service" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "`nERROR: Failed to update service: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

Write-Host "`nDone!" -ForegroundColor Green

