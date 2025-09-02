# Environment Variables Setup Guide

## 📋 Overview

This project uses environment variables for configuration. Follow this guide to set up your environment variables properly.

## 🚀 Quick Setup

### 1. Backend Setup

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Then edit the `.env` file with your actual values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/internship-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Frontend Setup

Create a `.env.local` file in the `fe/` directory:

```bash
cd fe
cp .env.example .env.local
```

Then edit the `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. AI Service Setup

Create a `.env` file in the `ai/` directory:

```bash
cd ai
cp .env.example .env
```

Then edit the `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# Service Configuration
PORT=5000
DEBUG=True
```

## 🔧 Required Services Setup

### 1. MongoDB

- Install MongoDB locally or use MongoDB Atlas
- Update `MONGODB_URI` in backend `.env`

### 2. Redis (for OTP and caching)

- Install Redis locally or use Redis Cloud
- Update `REDIS_URL` in backend `.env`

### 3. Gmail (for email verification)

- Enable 2-factor authentication
- Generate App Password
- Update email settings in backend `.env`

### 4. Google OAuth

- Create Google Cloud Project
- Enable Google+ API
- Create OAuth 2.0 credentials
- Update Google settings in both backend and frontend `.env`

### 5. Cloudinary (for file uploads)

- Create Cloudinary account
- Get cloud name, API key, and secret
- Update Cloudinary settings in backend `.env`

### 6. OpenAI (for AI features)

- Get OpenAI API key
- Update OpenAI settings in ai `.env`

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for JWT_SECRET
3. **Keep API keys secure** and rotate them regularly
4. **Use different keys** for development and production

## 📁 File Structure

```
project/
├── .gitignore              # Git ignore rules
├── ENVIRONMENT_SETUP.md    # This file
├── backend/
│   ├── .env               # Backend environment variables
│   └── .env.example       # Backend environment template
├── fe/
│   ├── .env.local         # Frontend environment variables
│   └── .env.example       # Frontend environment template
└── ai/
    ├── .env               # AI service environment variables
    └── .env.example       # AI service environment template
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Cannot find module" errors**

   - Make sure all dependencies are installed
   - Check if `.env` files are in correct locations

2. **Database connection errors**

   - Verify MongoDB is running
   - Check `MONGODB_URI` format

3. **Email not sending**

   - Verify Gmail app password is correct
   - Check if 2FA is enabled on Gmail

4. **Google OAuth not working**

   - Verify callback URLs match exactly
   - Check if Google+ API is enabled

5. **File uploads failing**
   - Verify Cloudinary credentials
   - Check file size limits

## 📞 Support

If you encounter issues:

1. Check the logs in `backend/logs/`
2. Verify all environment variables are set correctly
3. Ensure all required services are running
4. Check the documentation for each service
