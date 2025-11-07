# 🚀 INTERNBRIDGE - AI-Powered Internship Platform

> Website ứng dụng AI hỗ trợ tìm việc intern, hỗ trợ kết nối doanh nghiệp và nguồn nhân lực mới lâu dài bằng phân tích nhu cầu tuyển dụng, CV tìm việc làm.

## 📚 Tài liệu hướng dẫn

### 🔥 Quick Links

- 📖 **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Chỉ mục tài liệu đầy đủ
- 🇻🇳 **[HUONG_DAN_EMPLOYER.md](./HUONG_DAN_EMPLOYER.md)** - Hướng dẫn Nhà tuyển dụng (Tiếng Việt)
- 🇬🇧 **[EMPLOYER_GUIDE.md](./EMPLOYER_GUIDE.md)** - Employer Guide (English)
- 🔌 **[ACTIVE_API_ENDPOINTS.md](./ACTIVE_API_ENDPOINTS.md)** - 152 Active Endpoints

---

## ⭐ Clean Architecture - 56% Complete!

**Status**: ✅ Core domains migrated to Clean Architecture  
**Progress**: 11/20 repositories refactored (56%)  
**Documentation**: See `CLEAN_ARCHITECTURE_*.md` files

### Architecture Highlights

- ✅ **11 Domain Entities** with rich business logic
- ✅ **11 Pure Mappers** for data transformation
- ✅ **11 Repositories** following repository pattern
- ✅ **Zero Infrastructure Dependencies** in domain layer
- ✅ **100% Testable** domain logic without database

[📚 Read Migration Guide](./CLEAN_ARCHITECTURE_MIGRATION_PLAN.md) | [📊 View Progress Report](./CLEAN_ARCHITECTURE_COMPLETION_REPORT.md)

---

## 📋 TỔNG QUAN

InternBridge là nền tảng kết nối thực tập sinh thông minh với các tính năng:

- **Web Crawler**: Thu thập tin tuyển dụng realtime từ các trang web khác
- **AI Filtering**: Phân tích và lọc công việc intern bằng Computer Vision
- **Smart Matching**: Gợi ý job thông minh với Explainable AI
- **Chatbot**: Hỗ trợ tự động giải đáp câu hỏi người dùng
- **Role-based Access**: Phân quyền cho nhà tuyển dụng và ứng viên

## 🎯 TÍNH NĂNG CHÍNH

### 👥 Cho Nhà Tuyển Dụng

- ✅ Đăng tin tuyển dụng intern
- ✅ Xem thông tin ứng viên ứng tuyển
- ✅ Liên hệ với ứng viên trực tiếp
- ✅ Quản lý quy trình tuyển dụng
- ✅ Analytics và báo cáo

### 👤 Cho Ứng Viên

- ✅ Tìm kiếm công việc theo địa điểm, mức lương, ngành nghề
- ✅ Xem thông tin chi tiết và lưu trữ công việc yêu thích
- ✅ Ứng tuyển trực tiếp với cover letter và resume
- ✅ Theo dõi trạng thái ứng tuyển
- ✅ Nhận thông báo và phản hồi từ nhà tuyển dụng

- ✅ Xác thực email để bảo mật tài khoản

### 🤖 AI Features

- ✅ **Smart Job Filtering**: Tự động lọc công việc intern
- ✅ **Intelligent Matching**: Gợi ý công việc phù hợp
- ✅ **Chatbot Support**: Hỗ trợ 24/7
- ✅ **CV Analysis**: Phân tích và đánh giá CV

### 🔬 NLP Research Contributions

- ✅ **Advanced NLP Engine**: TF-IDF, semantic similarity, domain-specific algorithms
- ✅ **Vietnamese Language Support**: Specialized processing for Vietnamese CVs
- ✅ **Skill Taxonomy Classification**: Hierarchical skill categorization
- ✅ **Hybrid AI-NLP Architecture**: Combining traditional and AI approaches
- ✅ **Research Evaluation Framework**: Performance benchmarking and accuracy metrics

## 🛠️ TECHNOLOGY STACK

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB với Mongoose

- **Authentication**: JWT + bcrypt + Google OAuth
- **Email Service**: Nodemailer với SMTP

- **File Upload**: Multer
- **Web Crawling**: Puppeteer, Cheerio
- **AI/ML**: Natural.js, TensorFlow.js
- **Real-time**: Socket.io

### Frontend

- **Framework**: React.js
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client

### DevOps

- **Version Control**: Git
- **Deployment**: Vercel (Frontend), Railway (Backend)
- **Database**: MongoDB Atlas
- **Monitoring**: Sentry

## 📁 CẤU TRÚC DỰ ÁN

```
internbridge/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── controllers/    # API controllers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── crawler/        # Web crawler system
│   │   ├── utils/          # Utility functions
│   │   └── socket.js       # Real-time communication
│   ├── package.json
│   └── server.js
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   └── utils/          # Utility functions
│   └── package.json
├── docs/                   # Documentation
├── KE_HOACH_15_TUAN.md     # 15-week plan
└── DATABASE_DESIGN.md      # Database design
```

## 🗄️ DATABASE SCHEMA

Hệ thống sử dụng 8 collections chính:

1. **Users** - Quản lý người dùng (employer/jobseeker)
2. **Companies** - Thông tin công ty
3. **Jobs** - Công việc từ crawler và employer
4. **Applications** - Đơn ứng tuyển
5. **Notifications** - Hệ thống thông báo
6. **SavedJobs** - Công việc được lưu
7. **Chatbot** - Lịch sử chat
8. **CrawlerLog** - Log hoạt động crawler

Xem chi tiết tại [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)

## 🚀 CÀI ĐẶT VÀ CHẠY

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Git

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Cấu hình MongoDB và các biến môi trường
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Cấu hình API URL
npm run dev
```

### Environment Variables

```env
# Backend
MONGODB_URI=mongodb://localhost:27017/internbridge
JWT_SECRET=your_jwt_secret
PORT=5000

# Frontend
VITE_API_URL=http://localhost:5000/api
```

## 📅 KẾ HOẠCH 15 TUẦN

### Tuần 1-2: Phân tích và thiết kế

- Phân tích yêu cầu
- Thiết kế kiến trúc hệ thống
- Thiết kế database schema

### Tuần 3-4: Backend Core

- Authentication system
- Job management APIs
- User management

### Tuần 5-6: Crawler & AI

- Web crawler system
- AI filtering cho intern jobs
- Data processing pipeline

### Tuần 7-8: Frontend Core

- React setup
- Authentication UI
- Job listing và search

### Tuần 9-10: User Features

- Employer dashboard
- Jobseeker features
- Application system

### Tuần 11-12: AI Features

- Recommendation system
- Chatbot integration
- Personalization

### Tuần 13-15: Testing & Deployment

- Testing và optimization
- Security audit
- Production deployment

Xem chi tiết tại [KE_HOACH_15_TUAN.md](./KE_HOACH_15_TUAN.md)

## 🔧 API ENDPOINTS

### Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Lấy thông tin profile

### Jobs

- `GET /api/jobs` - Lấy danh sách công việc
- `GET /api/jobs/:id` - Lấy chi tiết công việc
- `POST /api/jobs` - Đăng tin tuyển dụng (employer)
- `PUT /api/jobs/:id` - Cập nhật công việc
- `DELETE /api/jobs/:id` - Xóa công việc

### Applications

- `POST /api/applications` - Nộp đơn ứng tuyển
- `GET /api/applications` - Lấy danh sách đơn ứng tuyển
- `PUT /api/applications/:id/status` - Cập nhật trạng thái
- `POST /api/applications/:id/messages` - Gửi tin nhắn

### Companies

- `GET /api/companies` - Lấy danh sách công ty
- `GET /api/companies/:id` - Lấy chi tiết công ty
- `POST /api/companies` - Tạo công ty mới

## 🤖 AI FEATURES

### Job Filtering

- Keyword analysis cho intern jobs
- Text classification với confidence scoring
- Automatic tagging và categorization

### Recommendation System

- Collaborative filtering
- Content-based filtering
- User preference learning

### Chatbot

- Intent recognition
- Context-aware responses
- Integration với job search

## 📊 METRICS & KPIs

### Technical Metrics

- Crawler success rate: >90%
- AI filtering accuracy: >85%
- API response time: <500ms
- System uptime: >99%

### Business Metrics

- User registration: 100+ users
- Job postings: 500+ jobs
- Applications: 1000+ applications
- User engagement: >60% return rate

## 🔒 SECURITY

- JWT authentication
- Password hashing với bcrypt
- Input validation và sanitization
- Rate limiting
- CORS configuration
- Environment variables protection

## 🧪 TESTING

- Unit testing với Jest
- Integration testing
- API testing với Supertest
- Frontend testing với React Testing Library
- E2E testing với Cypress

## 📈 DEPLOYMENT

### Production

- Frontend: Vercel
- Backend: Railway
- Database: MongoDB Atlas
- File Storage: AWS S3

### Development

- Local development với Docker
- Hot reload cho development
- Environment-specific configs

## 🔬 NLP RESEARCH EVALUATION

### Running Research Evaluation

```bash
# Run comprehensive NLP research evaluation
npm run evaluate:nlp

# Run research-specific tests
npm run test:research
```

### Research Metrics

- **Performance**: Processing speed and scalability benchmarks
- **Accuracy**: Precision, recall, F1-score against baseline
- **Contributions**: Vietnamese support, taxonomy coverage, hybrid approach

### Research Documentation

- 📄 [NLP Research Documentation](NLP_RESEARCH_DOCUMENTATION.md)
- 📊 [Research Evaluation Summary](NLP_RESEARCH_SUMMARY_REPORT.md)
- 📈 [Evaluation Results](research-evaluation-results.json)

### Key Research Features

1. **TF-IDF Vectorization** for semantic similarity
2. **Vietnamese Text Processing** with language-specific optimizations
3. **Skill Taxonomy Classification** with hierarchical categories
4. **Hybrid AI-NLP Architecture** for optimal performance

## 🤝 CONTRIBUTING

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 LICENSE

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � DOCUMENTATION

### 🏗️ Kiến trúc & Cấu trúc

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Cấu trúc thư mục tổng quan
- **[API_ENDPOINTS_STRUCTURE.md](./API_ENDPOINTS_STRUCTURE.md)** - Chi tiết API endpoints hiện tại
- **[API_ENDPOINTS_COMPLETE.md](./API_ENDPOINTS_COMPLETE.md)** - Danh sách đầy đủ endpoints
- **[ACTIVE_API_ENDPOINTS.md](./ACTIVE_API_ENDPOINTS.md)** - 📍 Danh sách endpoints đang hoạt động (152 endpoints)
- **[src/application/README.md](./src/application/README.md)** - Hướng dẫn Use Case pattern

### 📋 Hướng dẫn phát triển

- **[docs/ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)** - Hướng dẫn kiến trúc hệ thống
- **[docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)** - Hướng dẫn phát triển
- **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Hướng dẫn testing
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - Tài liệu API chi tiết

### 👥 Hướng dẫn người dùng

- **[HUONG_DAN_EMPLOYER.md](./HUONG_DAN_EMPLOYER.md)** - 🇻🇳 Hướng dẫn cho Nhà tuyển dụng (Tiếng Việt)
- **[EMPLOYER_GUIDE.md](./EMPLOYER_GUIDE.md)** - 🇬🇧 Employer Guide (English)
  - Đăng ký & Đăng nhập
  - Quản lý hồ sơ công ty
  - Xác minh giấy tờ (Business License, Tax Certificate)
  - Quản lý tin tuyển dụng
  - Xử lý đơn ứng tuyển
  - Quản lý thành viên công ty

### 🚀 Triển khai & DevOps

- **[docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** - Hướng dẫn triển khai
- **[docs/FREE_TIER_SETUP.md](./docs/FREE_TIER_SETUP.md)** - Setup miễn phí
- **[docs/DEPLOYMENT_RECOMMENDATIONS.md](./docs/DEPLOYMENT_RECOMMENDATIONS.md)** - Khuyến nghị triển khai

### 💾 Cơ sở dữ liệu

- **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Schema cơ sở dữ liệu
- **[docs/DOMAIN_MODELS.md](./docs/DOMAIN_MODELS.md)** - Mô hình domain

## 🧪 Testing & Examples

### 📁 Testing Structure

```
tests/
├── unit/              # Unit tests cho Use Cases & Entities
├── integration/       # Integration tests cho Controllers
├── e2e/              # End-to-end tests
├── fixtures/         # Test data fixtures
└── helpers/          # Test utilities
```

### 💡 Code Examples

```
examples/
├── domain-model-usage.js  # Ví dụ sử dụng domain models
└── README.md             # Hướng dẫn examples
```

## 🛠️ Development Tools

### 🔗 API Testing

```
postman/
├── *.postman_collection.json    # Postman collections
├── postman_environment.json     # Environment variables
└── README.md                    # Postman guide
```

### 📊 Architecture Diagrams

```
diagram/
├── *.puml           # PlantUML source files
├── *.png            # Generated diagrams
└── README.md        # Diagram guide
```

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment

```bash
cp .env.example .env
# Chỉnh sửa .env với cấu hình của bạn
```

### 3. Khởi động database services

```bash
# MongoDB và Redis phải đang chạy
```

### 4. Chạy ứng dụng

```bash
# Production mode
npm start

# Development mode (with nodemon)
npm run dev
```

### 5. Test API

- **Health Check:** `GET /api/health`
- **API Documentation:** `GET /api-docs` (Swagger UI)
- **Postman Collections:** Import từ thư mục `postman/`

## 📈 Project Status

### ✅ Hoàn thành

- [x] Clean Architecture implementation
- [x] Use Case pattern standardization
- [x] CQRS pattern removal
- [x] Dependency injection container
- [x] JWT authentication system
- [x] MongoDB integration
- [x] Redis queue system
- [x] Comprehensive testing setup

### 🚧 Đang phát triển

- [ ] AI matching services (temporarily disabled)
- [ ] Advanced job search features
- [ ] Real-time chat enhancements
- [ ] Admin dashboard improvements

### 🔄 Cần implement

- [ ] Complete job management features (publish/close jobs)
- [ ] Advanced notification system
- [ ] Learning roadmap generation
- [ ] Performance optimization

## 🏗️ Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────┐
│         Presentation Layer          │  ← HTTP API, Controllers, DTOs
├─────────────────────────────────────┤
│         Application Layer           │  ← Use Cases, Business Logic
├─────────────────────────────────────┤
│           Domain Layer              │  ← Entities, Business Rules
├─────────────────────────────────────┤
│       Infrastructure Layer          │  ← Database, External Services
└─────────────────────────────────────┘
```

### Key Patterns Used

- **Use Case Pattern** - Business logic organization
- **Repository Pattern** - Data access abstraction
- **Dependency Injection** - Loose coupling
- **CQRS** - ❌ Removed (simplified to Use Cases only)
- **Domain-Driven Design** - Domain modeling

## �👥 TEAM

- **Developer 1**: Backend development, AI integration
- **Developer 2**: Frontend development, UI/UX design

## 📞 CONTACT

- Email: internbridge@example.com
- Website: https://internbridge.com
- GitHub: https://github.com/internbridge

---

**InternBridge** - Kết nối tương lai thực tập sinh Việt Nam! 🚀
