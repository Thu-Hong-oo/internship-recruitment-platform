# 📚 Documentation Index

Welcome to the Smart Recruitment Platform Backend Documentation!

---

## 📖 Available Documentation

### 🚀 **[Active API Endpoints](./ACTIVE_API_ENDPOINTS.md)**

Complete reference of all 34 active API endpoints currently running on the server.

- Authentication (6 endpoints)
- Candidates (4 endpoints)
- Employers (4 endpoints)
- Jobs (4 endpoints)
- Applications (3 endpoints)
- AI/NLP (4 endpoints)
- Skills & Roadmaps (3 endpoints)
- Notifications (2 endpoints)
- Chat (2 endpoints)
- Admin (2 endpoints)

### 🏗️ **[Architecture Guide](./ARCHITECTURE_GUIDE.md)**

Understanding the Clean Architecture implementation.

- Domain Layer
- Application Layer
- Infrastructure Layer
- Presentation Layer

### 📊 **[Database Schema](./DATABASE_SCHEMA.md)**

Complete database structure and relationships.

- Entity models
- Relationships
- Indexes
- Constraints

### 🔌 **[API Documentation](./API_DOCUMENTATION.md)**

Detailed API reference with request/response examples.

- Request formats
- Response formats
- Error handling
- Authentication

### 🚀 **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**

Step-by-step deployment instructions.

- Environment setup
- Production configuration
- Scaling strategies

### 🧪 **[Testing Guide](./TESTING_GUIDE.md)**

Testing strategies and examples.

- Unit tests
- Integration tests
- E2E tests

### 👨‍💻 **[Development Guide](./DEVELOPMENT_GUIDE.md)**

Guidelines for developers.

- Setup instructions
- Coding standards
- Best practices

### 🎯 **[Domain Models](./DOMAIN_MODELS.md)**

Domain entities and business logic.

- Entity descriptions
- Business rules
- Validation rules

---

## 🎯 Quick Start

### Server Information

- **Base URL**: `http://localhost:3000`
- **API Docs**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

### Authentication

All endpoints (except login/register) require JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

### Example Request

```bash
curl -X GET http://localhost:3000/api/jobs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔥 Most Used Endpoints

1. **Login**: `POST /api/auth/login`
2. **Get Jobs**: `GET /api/jobs`
3. **Apply for Job**: `POST /api/applications`
4. **AI Matching**: `POST /api/ai/match`
5. **Parse CV**: `POST /api/ai/parse-cv`

---

## 📊 System Status

**Last Updated**: November 5, 2025

| Service     | Status       | Description        |
| ----------- | ------------ | ------------------ |
| Server      | ✅ Running   | Port 3000          |
| Database    | ✅ Connected | MongoDB            |
| Redis       | ✅ Connected | Cache & Queue      |
| OTP Service | ✅ Active    | Email verification |
| AI Services | ✅ Active    | Matching & NLP     |

---

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│  (Controllers, Routes, Middlewares)         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Application Layer                 │
│         (Use Cases, Services)               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            Domain Layer                     │
│   (Entities, Business Rules, Value Objects) │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Infrastructure Layer                │
│    (Repositories, Database, External APIs)  │
└─────────────────────────────────────────────┘
```

---

## 🔧 Development Tools

- **Nodemon**: Auto-restart on file changes
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Swagger**: API documentation
- **Jest**: Testing framework

---

## 📝 Contributing

Please read the [Development Guide](./DEVELOPMENT_GUIDE.md) before contributing.

### Code Standards

- Follow Clean Architecture principles
- Write unit tests for all business logic
- Use meaningful commit messages
- Keep functions small and focused

---

## 🐛 Troubleshooting

### Common Issues

**1. Server won't start**

- Check MongoDB connection
- Verify Redis is running
- Check environment variables

**2. Authentication errors**

- Verify JWT token is valid
- Check token expiration
- Ensure proper Authorization header

**3. Database errors**

- Verify MongoDB is running
- Check database connection string
- Ensure proper indexes exist

---

## 📞 Support

For questions or issues:

1. Check the relevant documentation
2. Review API examples
3. Check server logs
4. Review error messages

---

## 📚 External Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/guide)
- [MongoDB Manual](https://docs.mongodb.com/manual)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Documentation Version**: 1.0.0  
**Last Updated**: November 5, 2025  
**Maintained By**: Development Team
