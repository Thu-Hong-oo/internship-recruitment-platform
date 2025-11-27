# PowerShell script to test backend API
# Usage: .\scripts\test-api.ps1

$BASE_URL = "http://localhost:3000"

Write-Host "🧪 Testing Backend API..." -ForegroundColor Cyan
Write-Host ""

# Test Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$BASE_URL/health" -UseBasicParsing -ErrorAction Stop
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Health check passed" -ForegroundColor Green
        Write-Host "   Status: $($healthResponse.StatusCode)"
        Write-Host "   Response: $($healthResponse.Content)"
    } else {
        Write-Host "❌ Health check returned status: $($healthResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host "   Make sure the server is running on port 3000"
    exit 1
}

Write-Host ""

# Test API Docs
Write-Host "2. Testing API Docs..." -ForegroundColor Yellow
try {
    $docsResponse = Invoke-WebRequest -Uri "$BASE_URL/api-docs" -UseBasicParsing -ErrorAction Stop
    if ($docsResponse.StatusCode -eq 200) {
        Write-Host "✅ API docs accessible (HTTP $($docsResponse.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️ API docs returned HTTP $($docsResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ API docs not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test Jobs API
Write-Host "3. Testing Jobs API..." -ForegroundColor Yellow
try {
    $jobsResponse = Invoke-WebRequest -Uri "$BASE_URL/api/jobs" -UseBasicParsing -ErrorAction Stop
    if ($jobsResponse.StatusCode -eq 200) {
        Write-Host "✅ Jobs API working (HTTP $($jobsResponse.StatusCode))" -ForegroundColor Green
        $content = $jobsResponse.Content
        if ($content.Length -gt 100) {
            Write-Host "   Response preview: $($content.Substring(0, 100))..."
        } else {
            Write-Host "   Response: $content"
        }
    } else {
        Write-Host "⚠️ Jobs API returned HTTP $($jobsResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Jobs API may have issues: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Green

