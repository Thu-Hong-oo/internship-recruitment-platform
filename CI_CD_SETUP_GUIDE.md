# 🚀 CI/CD Setup Guide cho Backend

## Tổng quan

Có 2 phương án setup CI/CD:

1. **GitHub Actions** (Khuyến nghị) - Đơn giản, miễn phí cho public repos
2. **AWS CodePipeline** - Native AWS, tích hợp tốt với các AWS services

---

## Phương án 1: GitHub Actions (Khuyến nghị)

### Bước 1: Setup GitHub Secrets

Vào GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Thêm các secrets:
- `AWS_ACCESS_KEY_ID`: Access key từ IAM
- `AWS_SECRET_ACCESS_KEY`: Secret key từ IAM

**Lưu ý:** IAM user cần có permissions:
- `AmazonEC2ContainerRegistryFullAccess`
- `AppRunnerFullAccess` (nếu dùng App Runner)
- `ElasticBeanstalkFullAccess` (nếu dùng EB)

### Bước 2: Chọn Workflow

**Nếu dùng App Runner:**
- Workflow: `.github/workflows/deploy-backend.yml`
- Tự động deploy khi push code lên `main`/`master`

**Nếu dùng Elastic Beanstalk:**
- Workflow: `.github/workflows/deploy-backend-elastic-beanstalk.yml`
- Cần cài EB CLI trong workflow hoặc dùng action `einaregilsson/beanstalk-deploy`

### Bước 3: Test Workflow

```bash
# Push code lên main branch
git add .
git commit -m "Setup CI/CD"
git push origin main
```

Vào GitHub → Actions tab → Xem workflow chạy

### Bước 4: Verify Deployment

**App Runner:**
```bash
# Lấy service URL
aws apprunner list-services --region ap-southeast-1
aws apprunner describe-service --service-arn <ARN> --region ap-southeast-1
```

**Elastic Beanstalk:**
```bash
eb status
eb open
```

---

## Phương án 2: AWS CodePipeline

### Bước 1: Tạo CodeCommit Repository (hoặc dùng GitHub)

**Option A: CodeCommit**
```bash
aws codecommit create-repository --repository-name internship-backend --region ap-southeast-1
```

**Option B: GitHub (Khuyến nghị)**
- Dùng GitHub source trong CodePipeline

### Bước 2: Tạo CodeBuild Project

1. Vào CodeBuild Console → Create build project
2. Settings:
   - **Project name**: `internship-backend-build`
   - **Source**: GitHub (connect với repo)
   - **Environment**: 
     - Managed image: Ubuntu
     - Runtime: Standard
     - Image: `aws/codebuild/standard:7.0`
     - Privileged: ✅ (để build Docker)
   - **Buildspec**: `backend/buildspec.yml`
   - **Service role**: Tạo mới hoặc dùng existing

3. Environment variables:
   - `AWS_DEFAULT_REGION`: `ap-southeast-1`
   - `AWS_ACCOUNT_ID`: `919833106421`
   - `IMAGE_REPO_NAME`: `intern_bridge`

### Bước 3: Tạo CodePipeline

1. Vào CodePipeline Console → Create pipeline
2. Settings:
   - **Pipeline name**: `internship-backend-pipeline`
   - **Source**: 
     - Provider: GitHub (hoặc CodeCommit)
     - Repository: Your repo
     - Branch: `main`
   - **Build**: 
     - Provider: AWS CodeBuild
     - Project: `internship-backend-build`
   - **Deploy**:
     - **App Runner**: 
       - Service: `internship-backend`
       - Start deployment: ✅
     - **Hoặc Elastic Beanstalk**:
       - Application: `internship-backend`
       - Environment: `production`

### Bước 4: Test Pipeline

```bash
# Push code
git push origin main
```

Vào CodePipeline Console → Xem pipeline chạy

---

## Workflow Files

### GitHub Actions cho App Runner

File: `.github/workflows/deploy-backend.yml`

**Tính năng:**
- ✅ Tự động build Docker image khi push code
- ✅ Push lên ECR với tag `latest` và commit SHA
- ✅ Deploy lên App Runner
- ✅ Wait for deployment completion
- ✅ Check deployment status

### GitHub Actions cho Elastic Beanstalk

File: `.github/workflows/deploy-backend-elastic-beanstalk.yml`

**Tính năng:**
- ✅ Build và push Docker image
- ✅ Generate `Dockerrun.aws.json` động
- ✅ Deploy lên Elastic Beanstalk

### CodeBuild Buildspec

File: `backend/buildspec.yml`

**Tính năng:**
- ✅ Login ECR
- ✅ Build Docker image
- ✅ Tag và push lên ECR
- ✅ Generate `imagedefinitions.json` cho ECS (nếu cần)

---

## Environment Variables

### Cần set trong GitHub Secrets / CodeBuild:

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-1
ECR_REPOSITORY=intern_bridge
APP_RUNNER_SERVICE=internship-backend  # Nếu dùng App Runner
EB_APPLICATION_NAME=internship-backend  # Nếu dùng EB
EB_ENVIRONMENT_NAME=production  # Nếu dùng EB
```

---

## IAM Permissions

Tạo IAM user với policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "apprunner:StartDeployment",
        "apprunner:DescribeService",
        "apprunner:ListServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:*",
        "ec2:*",
        "s3:*",
        "cloudformation:*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Troubleshooting

### Lỗi: "Access Denied" khi push ECR

- Kiểm tra IAM permissions
- Verify AWS credentials trong secrets

### Lỗi: "Service not found" trong App Runner

- Tạo service trước trong App Runner Console
- Hoặc update workflow với service ARN thay vì name

### Lỗi: Build timeout

- Tăng timeout trong workflow: `timeout-minutes: 30`
- Hoặc optimize Dockerfile (multi-stage build)

### Lỗi: Docker build fails

- Kiểm tra `APP_PATH` build arg
- Verify `requirements.txt` tồn tại

---

## Best Practices

1. ✅ **Use specific image tags** (commit SHA) thay vì chỉ `latest`
2. ✅ **Tag cả `latest` và commit SHA** để dễ rollback
3. ✅ **Wait for deployment** trước khi mark success
4. ✅ **Check deployment status** trước khi complete
5. ✅ **Use secrets** cho sensitive data
6. ✅ **Enable notifications** (Slack, email) khi deploy fail

---

## Next Steps

1. ✅ Setup monitoring (CloudWatch Alarms)
2. ✅ Setup rollback strategy
3. ✅ Add staging environment
4. ✅ Setup automated testing trong CI
5. ✅ Add deployment notifications

---

## Commands Reference

```bash
# Manual deploy (nếu cần)
cd backend
docker build -t intern_bridge --build-arg APP_PATH=. .
docker tag intern_bridge:latest 919833106421.dkr.ecr.ap-southeast-1.amazonaws.com/intern_bridge:latest
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 919833106421.dkr.ecr.ap-southeast-1.amazonaws.com
docker push 919833106421.dkr.ecr.ap-southeast-1.amazonaws.com/intern_bridge:latest

# Trigger App Runner deployment
aws apprunner start-deployment --service-arn <ARN> --region ap-southeast-1
```

