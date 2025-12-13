# Check ECR Images Script
# Kiem tra xem images co ton tai trong ECR khong

# Set AWS profile if needed
if ($env:AWS_PROFILE) {
    Write-Host "Using AWS Profile: $env:AWS_PROFILE" -ForegroundColor Gray
} else {
    Write-Host "Note: Set AWS_PROFILE environment variable if needed" -ForegroundColor Yellow
    Write-Host "Example: `$env:AWS_PROFILE='InternBridge'" -ForegroundColor Yellow
}

$Region = "ap-southeast-1"
$RepositoryName = "intern_bridge"
$ImageTag = "latest"

Write-Host "Checking ECR images..." -ForegroundColor Cyan
Write-Host "Repository: $RepositoryName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

# Check if repository exists
Write-Host "1. Checking if repository exists..." -ForegroundColor Cyan
try {
    $repo = aws ecr describe-repositories `
        --repository-names $RepositoryName `
        --region $Region `
        --output json | ConvertFrom-Json
    
    Write-Host "Repository exists" -ForegroundColor Green
    Write-Host "   URI: $($repo.repositories[0].repositoryUri)" -ForegroundColor Gray
} catch {
    Write-Host "Repository not found!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# List all images
Write-Host ""
Write-Host "2. Listing all images in repository..." -ForegroundColor Cyan
try {
    $images = aws ecr describe-images `
        --repository-name $RepositoryName `
        --region $Region `
        --output json | ConvertFrom-Json
    
    if ($images.imageDetails.Count -eq 0) {
        Write-Host "No images found in repository!" -ForegroundColor Yellow
        Write-Host "   You need to push an image first." -ForegroundColor Yellow
    } else {
        Write-Host "Found $($images.imageDetails.Count) image(s)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Recent images:" -ForegroundColor Cyan
        $images.imageDetails | 
            Sort-Object -Property imagePushedAt -Descending | 
            Select-Object -First 5 | 
            ForEach-Object {
                $tags = if ($_.imageTags) { $_.imageTags -join ", " } else { "(untagged)" }
                $date = [DateTimeOffset]::FromUnixTimeSeconds([long]$_.imagePushedAt).ToString("yyyy-MM-dd HH:mm:ss")
                Write-Host "   - Tags: $tags" -ForegroundColor Gray
                Write-Host "     Pushed: $date" -ForegroundColor Gray
                Write-Host "     Size: $([math]::Round($_.imageSizeInBytes / 1MB, 2)) MB" -ForegroundColor Gray
                Write-Host ""
            }
    }
} catch {
    Write-Host "Error listing images: $_" -ForegroundColor Red
    exit 1
}

# Check specific tag
Write-Host "3. Checking for tag '$ImageTag'..." -ForegroundColor Cyan
try {
    $tagImage = aws ecr describe-images `
        --repository-name $RepositoryName `
        --region $Region `
        --image-ids imageTag=$ImageTag `
        --output json | ConvertFrom-Json
    
    if ($tagImage.imageDetails) {
        Write-Host "Tag '$ImageTag' exists!" -ForegroundColor Green
        $img = $tagImage.imageDetails[0]
        $date = [DateTimeOffset]::FromUnixTimeSeconds([long]$img.imagePushedAt).ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host "   Pushed: $date" -ForegroundColor Gray
        Write-Host "   Size: $([math]::Round($img.imageSizeInBytes / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "   Digest: $($img.imageDigest)" -ForegroundColor Gray
    } else {
        Write-Host "Tag '$ImageTag' not found!" -ForegroundColor Red
        Write-Host "   App Runner needs this tag to deploy." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Tag '$ImageTag' not found!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Check complete!" -ForegroundColor Green
