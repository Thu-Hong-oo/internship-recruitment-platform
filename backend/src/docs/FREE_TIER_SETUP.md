# Free Tier Setup Script - Internship Platform

## 🚀 Quick Setup Free Tier

### Prerequisites

```bash
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login to Azure (Free account)
az login

# Install Vercel CLI (optional)
npm install -g vercel
```

### Option 1: Azure Free Tier (Recommended)

#### Step 1: Setup Azure Free Resources

```bash
# Run this script
./setup-free-azure.sh
```

#### setup-free-azure.sh

```bash
#!/bin/bash

# Azure Free Tier Setup for Internship Platform
echo "🚀 Setting up Azure Free Tier..."

# Variables
RESOURCE_GROUP="internship-free-rg"
LOCATION="eastasia"
BACKEND_NAME="internship-free-api"
CANDIDATE_APP="candidate-free-app"
ADMIN_APP="admin-free-app"
EMPLOYER_APP="employer-free-app"

# Create resource group
echo "📁 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create free App Service plan
echo "🖥️ Creating free App Service plan..."
az appservice plan create \
  --name free-plan \
  --resource-group $RESOURCE_GROUP \
  --sku FREE \
  --is-linux

# Create backend web app
echo "🌐 Creating backend API..."
az webapp create \
  --name $BACKEND_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan free-plan \
  --runtime "NODE|18-lts"

# Configure environment variables
echo "⚙️ Configuring environment..."
az webapp config appsettings set \
  --name $BACKEND_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting NODE_ENV=production \
  --setting MONGODB_URI=$MONGODB_FREE_URI \
  --setting JWT_SECRET=$JWT_SECRET

# Create free Static Web Apps
echo "📱 Creating candidate app..."
az staticwebapp create \
  --name $CANDIDATE_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku FREE \
  --source https://github.com/your-org/candidate-frontend \
  --branch main \
  --app-location "/" \
  --output-location "build" \
  --login-with-github

echo "📱 Creating admin app..."
az staticwebapp create \
  --name $ADMIN_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku FREE \
  --source https://github.com/your-org/admin-frontend \
  --branch main \
  --app-location "/" \
  --output-location "build" \
  --login-with-github

echo "📱 Creating employer app..."
az staticwebapp create \
  --name $EMPLOYER_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku FREE \
  --source https://github.com/your-org/employer-frontend \
  --branch main \
  --app-location "/" \
  --output-location "build" \
  --login-with-github

echo "✅ Azure Free Tier setup complete!"
echo "Backend URL: https://$BACKEND_NAME.azurewebsites.net"
echo "Candidate App: Check Azure portal for URLs"
echo "Admin App: Check Azure portal for URLs"
echo "Employer App: Check Azure portal for URLs"
```

#### Step 2: Setup Free Database

```bash
# MongoDB Atlas Free Cluster
# 1. Go to https://cloud.mongodb.com
# 2. Create free cluster (512MB)
# 3. Get connection string
# 4. Set MONGODB_URI in Azure App Settings

# Redis Cloud Free (optional)
# 1. Go to https://redis.com/try-free/
# 2. Create free database (30MB)
```

#### Step 3: Deploy Applications

```bash
# Deploy backend
az webapp deployment source config \
  --name internship-free-api \
  --resource-group internship-free-rg \
  --repo-url https://github.com/your-org/internship-backend \
  --branch main \
  --git-token your-github-token

# Frontend apps auto-deploy from GitHub
```

### Option 2: Vercel + Render Free

#### Step 1: Setup Vercel Frontend

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy candidate app
cd candidate-frontend
vercel --prod
# Follow prompts, set project name: candidate-app

# Deploy admin app
cd ../admin-frontend
vercel --prod
# Set project name: admin-app

# Deploy employer app
cd ../employer-frontend
vercel --prod
# Set project name: employer-app
```

#### Step 2: Setup Render Backend

```yaml
# render.yaml
services:
  - type: web
    name: internship-backend
    env: node
    region: singapore
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        value: mongodb+srv://...
      - key: JWT_SECRET
        value: your-secret
      - key: CORS_ORIGIN
        value: https://candidate-app.vercel.app,https://admin-app.vercel.app,https://employer-app.vercel.app

  - type: pserv
    name: internship-db
    env: mongo
    region: singapore
    plan: free
```

#### Step 3: Deploy to Render

```bash
# Connect GitHub repo to Render
# Render will auto-deploy from render.yaml
```

### Option 3: Render Full Stack Free

#### render.yaml (Complete Setup)

```yaml
services:
  # Backend API
  - type: web
    name: internship-backend
    env: node
    region: singapore
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromService:
          type: pserv
          name: internship-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: https://candidate-app.onrender.com,https://admin-app.onrender.com,https://employer-app.onrender.com

  # Database
  - type: pserv
    name: internship-db
    env: mongo
    region: singapore
    plan: free

  # Candidate Frontend
  - type: web
    name: candidate-app
    env: static-site
    region: singapore
    plan: free
    buildCommand: npm install && npm run build
    staticSiteOptions:
      publishDir: build

  # Admin Frontend
  - type: web
    name: admin-app
    env: static-site
    region: singapore
    plan: free
    buildCommand: npm install && npm run build
    staticSiteOptions:
      publishDir: build

  # Employer Frontend
  - type: web
    name: employer-app
    env: static-site
    region: singapore
    plan: free
    buildCommand: npm install && npm run build
    staticSiteOptions:
      publishDir: build
```

### Environment Variables Setup

#### For Azure Free

```bash
# Set in Azure App Service Configuration
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.free.mongodb.net/internship_free
JWT_SECRET=your-super-secret-jwt-key-free-tier
CORS_ORIGIN=https://candidate-free-app.azurestaticapps.net,https://admin-free-app.azurestaticapps.net,https://employer-free-app.azurestaticapps.net
```

#### For Vercel + Render

```bash
# Render environment variables
NODE_ENV=production
JWT_SECRET=your-secret
CORS_ORIGIN=https://candidate-app.vercel.app,https://admin-app.vercel.app,https://employer-app.vercel.app
```

### Custom Domains (Free)

#### Azure Static Web Apps

```bash
# Custom domains are free
az staticwebapp hostname set \
  --name candidate-free-app \
  --domain candidate.yourdomain.com
```

#### Vercel

```bash
# Custom domains free for personal accounts
vercel domains add candidate.yourdomain.com
```

### Monitoring Free

#### Azure

```bash
# Basic monitoring free
az monitor app-insights component create \
  --app free-insights \
  --location eastasia \
  --resource-group internship-free-rg \
  --application-type web
```

#### Render

- Built-in logs and monitoring free

### CI/CD Free

#### GitHub Actions (Free)

```yaml
# .github/workflows/free-deploy.yml
name: Free Deploy
on: push
jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: internship-free-api
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

### Cost Summary Free

| Service               | Cost   | Notes                   |
| --------------------- | ------ | ----------------------- |
| Azure App Service F1  | $0     | 60 CPU min/day          |
| Azure Static Web Apps | $0     | 3 apps unlimited        |
| MongoDB Atlas         | $0     | 512MB free              |
| Redis Cloud           | $0     | 30MB free               |
| Vercel                | $0     | Unlimited personal      |
| Render                | $0     | 750 hours/month         |
| **Total**             | **$0** | Perfect for development |

### Migration to Paid

When you need more resources:

```bash
# Upgrade Azure App Service
az appservice plan update --name free-plan --sku B1

# Upgrade MongoDB Atlas to M10 (~$60/month)
# Upgrade Redis to paid tier (~$15/month)
```

---

**Ready to deploy free? Chọn option nào: Azure, Vercel+Render, hay Render Full Stack?**
