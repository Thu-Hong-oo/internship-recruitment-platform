# Deployment Guide

## Tong quan

He thong duoc deploy len Azure su dung Azure App Service, Azure Database for MongoDB va Azure Cache for Redis.

## Prerequisites

### Azure Resources Required

- Azure Subscription
- Azure App Service Plan
- Azure Web App
- Azure Database for MongoDB
- Azure Cache for Redis
- Azure Storage Account (optional, for file uploads)
- Azure Application Insights (optional, for monitoring)

### Local Development Setup

```bash
# Install Azure CLI
npm install -g azure-cli

# Login to Azure
az login

# Install Azure Functions Core Tools (if using)
npm install -g azure-functions-core-tools@4
```

## Environment Configuration

### Environment Variables

```bash
# Application
NODE_ENV=production
PORT=8080

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/internship_platform?retryWrites=true&w=majority
MONGODB_TEST_URI=mongodb+srv://username:password@cluster-test.mongodb.net/internship_platform_test?retryWrites=true&w=majority

# Redis
REDIS_URL=rediss://username:password@hostname:6380

# JWT
JWT_SECRET=your-production-jwt-secret-key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Azure Application Insights
APPLICATION_INSIGHTS_KEY=your-app-insights-key

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# AI Services
OPENAI_API_KEY=your-openai-api-key
COMPROMISE_NLP_ENABLED=true
```

### Azure App Service Configuration

```json
// Azure App Service Application Settings
{
  "NODE_ENV": "production",
  "PORT": "8080",
  "MONGODB_URI": "mongodb+srv://...",
  "REDIS_URL": "rediss://...",
  "JWT_SECRET": "your-production-jwt-secret-key",
  "JWT_EXPIRE": "24h",
  "JWT_REFRESH_EXPIRE": "7d",
  "SENDGRID_API_KEY": "your-sendgrid-api-key",
  "EMAIL_FROM": "noreply@yourdomain.com",
  "CLOUDINARY_CLOUD_NAME": "your-cloud-name",
  "CLOUDINARY_API_KEY": "your-api-key",
  "CLOUDINARY_API_SECRET": "your-api-secret",
  "APPLICATION_INSIGHTS_KEY": "your-app-insights-key",
  "CORS_ORIGIN": "https://your-frontend-domain.com",
  "RATE_LIMIT_WINDOW": "15",
  "RATE_LIMIT_MAX_REQUESTS": "100",
  "OPENAI_API_KEY": "your-openai-api-key",
  "COMPROMISE_NLP_ENABLED": "true"
}
```

## Deployment Strategies for Multiple Frontend Apps

### Overview

Với 3 frontend riêng biệt (Ứng viên, Quản trị viên, Nhà tuyển dụng), bạn có 3 chiến lược deploy chính:

### Strategy 1: Single API Gateway + Multiple Frontend Apps (Khuyến nghị)

#### Architecture

```
Internet
    │
    ├── Frontend Apps (Static Hosting)
    │   ├── candidate.yourdomain.com (Ứng viên)
    │   ├── admin.yourdomain.com (Quản trị viên)
    │   └── employer.yourdomain.com (Nhà tuyển dụng)
    │
    └── API Gateway (Backend)
        └── api.yourdomain.com
```

#### Azure Implementation

```bash
# 1. Create Resource Group
az group create --name internship-platform-rg --location eastasia

# 2. Create App Service Plan
az appservice plan create \
  --name internship-platform-plan \
  --resource-group internship-platform-rg \
  --sku B1 \
  --is-linux

# 3. Deploy Backend API
az webapp create \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --plan internship-platform-plan \
  --runtime "NODE|18-lts"

# 4. Deploy Frontend Apps (Static Web Apps)
az staticwebapp create \
  --name internship-candidate \
  --resource-group internship-platform-rg \
  --location eastasia \
  --source https://github.com/your-org/candidate-frontend \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github

az staticwebapp create \
  --name internship-admin \
  --resource-group internship-platform-rg \
  --location eastasia \
  --source https://github.com/your-org/admin-frontend \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github

az staticwebapp create \
  --name internship-employer \
  --resource-group internship-platform-rg \
  --location eastasia \
  --source https://github.com/your-org/employer-frontend \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

#### Custom Domain Setup

```bash
# Configure custom domains
az staticwebapp hostname set \
  --name internship-candidate \
  --resource-group internship-platform-rg \
  --domain candidate.yourdomain.com

az staticwebapp hostname set \
  --name internship-admin \
  --resource-group internship-platform-rg \
  --domain admin.yourdomain.com

az staticwebapp hostname set \
  --name internship-employer \
  --resource-group internship-platform-rg \
  --domain employer.yourdomain.com

az webapp config hostname set \
  --webapp-name internship-platform-api \
  --resource-group internship-platform-rg \
  --hostname api.yourdomain.com
```

### Strategy 2: Containerized Deployment with Docker

#### Dockerfile cho Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080

USER node

CMD ["npm", "run", "prod"]
```

#### Docker Compose cho Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - '8080:8080'
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/internship_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:6.0
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  mongodb_data:
```

#### Azure Container Instances

```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group internship-platform-rg \
  --name internship-backend \
  --image your-registry.azurecr.io/internship-backend:latest \
  --cpu 1 \
  --memory 1.5 \
  --registry-login-server your-registry.azurecr.io \
  --registry-username your-username \
  --registry-password your-password \
  --dns-name-label internship-backend \
  --ports 8080 \
  --environment-variables \
    NODE_ENV=production \
    MONGODB_URI=$MONGODB_URI \
    REDIS_URL=$REDIS_URL
```

### Strategy 3: Microservices Architecture

#### Separate Backend Services

```
├── backend/
│   ├── identity-service/     # Authentication & User management
│   ├── recruitment-service/  # Jobs & Applications
│   ├── ai-service/          # AI matching & NLP
│   └── notification-service/ # Notifications
│
├── frontend/
│   ├── candidate-app/
│   ├── admin-app/
│   └── employer-app/
```

#### Azure Kubernetes Service (AKS)

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: internship-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: internship-backend
  template:
    metadata:
      labels:
        app: internship-backend
    spec:
      containers:
        - name: backend
          image: your-registry.azurecr.io/internship-backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: 'production'
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: mongodb-uri
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: internship-backend
  ports:
    - port: 80
      targetPort: 8080
  type: LoadBalancer
```

## Frontend Deployment Options

### Option 1: Azure Static Web Apps (Free & Easy)

```bash
# For each frontend app
az staticwebapp create \
  --name internship-candidate \
  --resource-group internship-platform-rg \
  --location eastasia \
  --source https://github.com/your-org/candidate-frontend \
  --branch main \
  --app-location "/" \
  --output-location "build" \
  --login-with-github \
  --sku Free
```

### Option 2: Azure Storage + CDN

```bash
# Create Storage Account
az storage account create \
  --name internshipfrontend \
  --resource-group internship-platform-rg \
  --location eastasia \
  --sku Standard_LRS \
  --kind StorageV2

# Enable Static Website
az storage blob service-properties update \
  --account-name internshipfrontend \
  --static-website \
  --index-document index.html \
  --error-document-404-path index.html

# Create CDN Profile
az cdn profile create \
  --name internship-cdn \
  --resource-group internship-platform-rg \
  --sku Standard_Microsoft

# Create CDN Endpoint
az cdn endpoint create \
  --name candidate-endpoint \
  --profile-name internship-cdn \
  --resource-group internship-platform-rg \
  --origin internshipfrontend.z13.web.core.windows.net \
  --origin-host-header internshipfrontend.z13.web.core.windows.net
```

### Option 3: Vercel/Netlify (Modern Choice)

```yaml
# vercel.json for each frontend
{
  'version': 2,
  'builds':
    [
      {
        'src': 'package.json',
        'use': '@vercel/static-build',
        'config': { 'distDir': 'build' },
      },
    ],
  'routes':
    [
      { 'src': '/api/(.*)', 'dest': 'https://api.yourdomain.com/api/$1' },
      { 'src': '/(.*)', 'dest': '/index.html' },
    ],
}
```

## Environment Configuration

### Single Environment File

```javascript
// frontend/config.js
const config = {
  development: {
    apiUrl: 'http://localhost:8080/api',
    websocketUrl: 'ws://localhost:8080',
  },
  staging: {
    apiUrl: 'https://api-staging.yourdomain.com/api',
    websocketUrl: 'wss://api-staging.yourdomain.com',
  },
  production: {
    apiUrl: 'https://api.yourdomain.com/api',
    websocketUrl: 'wss://api.yourdomain.com',
  },
};

export default config[process.env.REACT_APP_ENV || 'development'];
```

### Build-time Configuration

```bash
# Build commands for each frontend
# Candidate App
npm run build -- --env API_URL=https://api.yourdomain.com/api

# Admin App
npm run build -- --env API_URL=https://api.yourdomain.com/api

# Employer App
npm run build -- --env API_URL=https://api.yourdomain.com/api
```

## CI/CD Pipeline

### GitHub Actions for Multi-App Deployment

```yaml
# .github/workflows/deploy-all.yml
name: Deploy All Apps

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Backend
        uses: azure/webapps-deploy@v2
        with:
          app-name: internship-platform-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .

  deploy-candidate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          repository: your-org/candidate-frontend
      - name: Deploy Candidate App
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_CANDIDATE }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '/'
          output_location: 'build'

  deploy-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          repository: your-org/admin-frontend
      - name: Deploy Admin App
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '/'
          output_location: 'build'

  deploy-employer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          repository: your-org/employer-frontend
      - name: Deploy Employer App
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_EMPLOYER }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '/'
          output_location: 'build'
```

## Cost Estimation

### Azure Pricing (Monthly)

| Service                  | Tier     | Cost            |
| ------------------------ | -------- | --------------- |
| App Service (Backend)    | B1       | ~$15            |
| Static Web Apps (3 apps) | Free     | $0              |
| MongoDB Atlas            | M10      | ~$60            |
| Redis Cache              | Basic C0 | ~$15            |
| CDN                      | Standard | ~$20            |
| **Total**                |          | **~$110/month** |

### Alternative: Vercel + Railway

| Service           | Cost            |
| ----------------- | --------------- |
| Vercel (3 apps)   | $0 (Hobby plan) |
| Railway (Backend) | ~$10            |
| MongoDB Atlas     | ~$60            |
| Redis Cloud       | ~$15            |
| **Total**         | **~$85/month**  |

## Recommendations

### For Startup/Small Team

1. **Azure Static Web Apps + App Service** (Dễ deploy, scale tốt)
2. **Vercel + Railway** (Developer-friendly, CI/CD tự động)

### For Enterprise

1. **Azure Kubernetes Service** (Scalable, reliable)
2. **AWS ECS + CloudFront** (Enterprise-grade)

### For Cost Optimization

1. **Single Page App với Role-based routing** (Chỉ 1 frontend app)
2. **Static hosting + API Gateway** (Giảm infrastructure cost)

### My Recommendation: Azure Static Web Apps + App Service

- ✅ Easy to deploy and manage
- ✅ Built-in CI/CD
- ✅ Custom domains support
- ✅ Free tier available
- ✅ Good performance
- ✅ Azure ecosystem integration

#### Step 1: Create Resource Group

```bash
# Create resource group
az group create --name internship-platform-rg --location eastasia
```

#### Step 2: Create App Service Plan

```bash
# Create App Service Plan
az appservice plan create \
  --name internship-platform-plan \
  --resource-group internship-platform-rg \
  --sku B1 \
  --is-linux
```

#### Step 3: Create Web App

```bash
# Create Web App
az webapp create \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --plan internship-platform-plan \
  --runtime "NODE|18-lts"
```

#### Step 4: Configure Application Settings

```bash
# Set environment variables
az webapp config appsettings set \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --setting NODE_ENV=production \
  --setting PORT=8080 \
  --setting MONGODB_URI="mongodb+srv://..." \
  --setting REDIS_URL="rediss://..." \
  --setting JWT_SECRET="your-production-jwt-secret-key"
```

#### Step 5: Deploy Application

```bash
# Deploy using ZIP file
az webapp deployment source config-zip \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --src deployment-package.zip

# Or deploy from GitHub
az webapp deployment source config \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --repo-url https://github.com/your-org/internship-platform \
  --branch main \
  --git-token your-github-token
```

### Method 2: Azure DevOps Pipeline

#### Azure DevOps Pipeline YAML

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: 'your-azure-subscription'
  appName: 'internship-platform-api'
  resourceGroup: 'internship-platform-rg'
  environment: 'production'

stages:
  - stage: Build
    jobs:
      - job: Build
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
            displayName: 'Install Node.js'

          - script: |
              npm ci
              npm run build
              npm run test:ci
            displayName: 'Install dependencies and build'

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: '.'
              includeRootFolder: false
              archiveType: 'zip'
              archiveFile: '$(Build.ArtifactStagingDirectory)/deployment-package.zip'
              replaceExistingArchive: true
            displayName: 'Archive files'

          - publish: $(Build.ArtifactStagingDirectory)/deployment-package.zip
            artifact: drop

  - stage: Deploy
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: Deploy
        environment: $(environment)
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: $(azureSubscription)
                    appType: webAppLinux
                    appName: $(appName)
                    resourceGroupName: $(resourceGroup)
                    package: $(Pipeline.Workspace)/drop/deployment-package.zip
                    runtimeStack: 'NODE|18-lts'
```

### Method 3: GitHub Actions

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: internship-platform-api
  AZURE_WEBAPP_PACKAGE_PATH: '.'
  NODE_VERSION: '18.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Build application
        run: npm run build

      - name: 'Deploy to Azure WebApp'
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}
```

## Database Setup

### Azure Database for MongoDB

#### Create MongoDB Atlas Cluster

```bash
# Using Azure CLI (if using Azure Cosmos DB with MongoDB API)
az cosmosdb create \
  --name internship-platform-db \
  --resource-group internship-platform-rg \
  --kind MongoDB \
  --server-version 4.0 \
  --default-consistency-level Session \
  --locations regionName=eastasia failoverPriority=0 isZoneRedundant=false
```

#### Database Connection String

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/internship_platform?retryWrites=true&w=majority
```

#### Database Initialization Script

```javascript
// scripts/initDatabase.js
const mongoose = require('mongoose');

const initDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create indexes
    const User = require('../src/infrastructure/models/User');
    const Job = require('../src/infrastructure/models/Job');

    await User.createIndexes();
    await Job.createIndexes();

    // Create admin user
    const adminUser = new User({
      email: 'admin@yourdomain.com',
      password: 'hashed-admin-password',
      fullName: 'System Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    });

    await adminUser.save();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

initDatabase();
```

## Redis Cache Setup

### Azure Cache for Redis

```bash
# Create Redis Cache
az redis create \
  --name internship-platform-cache \
  --resource-group internship-platform-rg \
  --location eastasia \
  --sku Basic \
  --vm-size c0
```

#### Redis Connection String

```
rediss://username:password@hostname:6380
```

## File Storage Setup

### Cloudinary Configuration

```javascript
// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

### Azure Storage (Alternative)

```bash
# Create Storage Account
az storage account create \
  --name internshipplatformstorage \
  --resource-group internship-platform-rg \
  --location eastasia \
  --sku Standard_LRS \
  --kind StorageV2
```

## Monitoring & Logging

### Azure Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app internship-platform-insights \
  --location eastasia \
  --resource-group internship-platform-rg \
  --application-type web
```

#### Application Insights Configuration

```javascript
// src/config/appInsights.js
const appInsights = require('applicationinsights');

if (process.env.APPLICATION_INSIGHTS_KEY) {
  appInsights
    .setup(process.env.APPLICATION_INSIGHTS_KEY)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .start();
}

module.exports = appInsights;
```

### Logging Configuration

```javascript
// src/config/logging.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'internship-platform-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

module.exports = logger;
```

## Security Configuration

### SSL/TLS Setup

```bash
# Enable HTTPS Only
az webapp update \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --https-only true
```

### CORS Configuration

```javascript
// src/middlewares/cors.js
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
```

### Rate Limiting

```javascript
// src/middlewares/rateLimit.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // Default 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
```

## Performance Optimization

### Azure App Service Scaling

```bash
# Scale up App Service Plan
az appservice plan update \
  --name internship-platform-plan \
  --resource-group internship-platform-rg \
  --sku P1V2

# Enable auto-scaling
az monitor autoscale create \
  --name internship-platform-autoscale \
  --resource /subscriptions/.../resourceGroups/internship-platform-rg/providers/Microsoft.Web/serverFarms/internship-platform-plan \
  --min-count 1 \
  --max-count 10 \
  --count 1
```

### Database Optimization

```javascript
// Database connection optimization
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

### Caching Strategy

```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cache = {
  get: async key => {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },

  set: async (key, value, expireInSeconds = 3600) => {
    await client.setex(key, expireInSeconds, JSON.stringify(value));
  },

  del: async key => {
    await client.del(key);
  },
};

module.exports = cache;
```

## Backup & Recovery

### Database Backup

```bash
# MongoDB Atlas automated backups are enabled by default
# For manual backup
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/internship_platform" --out=/path/to/backup
```

### Application Backup

```bash
# Backup application files
az webapp config backup create \
  --resource-group internship-platform-rg \
  --webapp-name internship-platform-api \
  --backup-name manual-backup-$(date +%Y%m%d%H%M%S) \
  --container-url "https://storageaccount.blob.core.windows.net/backups"
```

## Troubleshooting

### Common Issues

#### Application Startup Issues

```bash
# Check application logs
az webapp log download \
  --name internship-platform-api \
  --resource-group internship-platform-rg

# View live logs
az webapp log tail \
  --name internship-platform-api \
  --resource-group internship-platform-rg
```

#### Database Connection Issues

```javascript
// Test database connection
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

testConnection();
```

#### Memory Issues

```bash
# Check memory usage
az webapp show \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --query siteConfig

# Increase memory limit
az webapp config set \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --linux-fx-version "NODE|18-lts" \
  --always-on true
```

## Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous deployment
az webapp deployment slot swap \
  --name internship-platform-api \
  --resource-group internship-platform-rg \
  --slot staging \
  --target-slot production
```

### Database Rollback

```javascript
// Database migration rollback script
const mongoose = require('mongoose');

const rollbackMigration = async migrationName => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Implement rollback logic based on migration name
    switch (migrationName) {
      case 'add-user-status':
        await mongoose.connection
          .collection('users')
          .updateMany({}, { $unset: { status: 1 } });
        break;
      // Add more rollback cases
    }

    console.log(`Migration ${migrationName} rolled back successfully`);
  } catch (error) {
    console.error('Rollback failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};
```

## Cost Optimization

### Azure Cost Management

```bash
# View resource costs
az costmanagement query \
  --type ActualCost \
  --dataset-granularity Daily \
  --dataset-aggregation '{"totalCost":{"name":"Cost","function":"Sum"}}' \
  --timeframe MonthToDate \
  --scope /subscriptions/your-subscription-id/resourceGroups/internship-platform-rg
```

### Resource Scaling Recommendations

- **Development**: Use B1 App Service Plan
- **Staging**: Use S1 App Service Plan
- **Production**: Use P1V2 or higher based on load
- **Database**: Use M10 cluster for development, M30+ for production
- **Redis**: Use Basic C0 for development, Standard C1+ for production

---

_Generated on: October 30, 2025_
