# Setup AWS CLI credentials from AWS Toolkit
# This script helps configure AWS CLI to use credentials from AWS Toolkit extension

Write-Host "Setting up AWS CLI credentials..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use AWS Toolkit credentials (Recommended)" -ForegroundColor Cyan
Write-Host "  1. Open VS Code Command Palette (Ctrl+Shift+P)" -ForegroundColor White
Write-Host "  2. Type: AWS: Edit Credentials" -ForegroundColor White
Write-Host "  3. Or manually edit: ~/.aws/credentials" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Configure via AWS CLI" -ForegroundColor Cyan
Write-Host "  Run: aws configure" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Use AWS SSO (if using SSO)" -ForegroundColor Cyan
Write-Host "  Run: aws sso login" -ForegroundColor White
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Download: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check current credentials
Write-Host ""
Write-Host "Checking current AWS credentials..." -ForegroundColor Yellow
$currentIdentity = aws sts get-caller-identity 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AWS credentials configured!" -ForegroundColor Green
    Write-Host $currentIdentity -ForegroundColor Cyan
} else {
    Write-Host "❌ No AWS credentials found" -ForegroundColor Red
    Write-Host ""
    Write-Host "To configure credentials, run:" -ForegroundColor Yellow
    Write-Host "  aws configure" -ForegroundColor White
    Write-Host ""
    Write-Host "You'll need:" -ForegroundColor Yellow
    Write-Host "  - AWS Access Key ID" -ForegroundColor White
    Write-Host "  - AWS Secret Access Key" -ForegroundColor White
    Write-Host "  - Default region (e.g., ap-southeast-1)" -ForegroundColor White
    Write-Host "  - Default output format (json)" -ForegroundColor White
}

