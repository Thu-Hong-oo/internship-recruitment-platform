# 🔧 Phân tích Tech Stack Backend - Internship Recruitment Platform

## 📋 Tổng quan

Backend được xây dựng với kiến trúc **self-sufficient AI/NLP**, tập trung vào khả năng hoạt động độc lập không phụ thuộc vào các API AI bên ngoài.

---

## 🎯 1. Runtime & Framework

### **Node.js 20.x**

- **Lý do**:
  - JavaScript/TypeScript ecosystem phong phú
  - Non-blocking I/O phù hợp với xử lý AI/NLP bất đồng bộ
  - Hỗ trợ tốt cho Python integration (qua child_process) cho các model AI
  - Cộng đồng lớn, nhiều thư viện AI/NLP

### **Express.js 4.x**

- **Lý do**:
  - Framework web phổ biến nhất cho Node.js
  - Middleware architecture linh hoạt (auth, rate limiting, error handling)
  - Dễ tích hợp với Socket.io cho real-time features
  - Lightweight, performance tốt

---

## 🗄️ 2. Database & Storage

### **MongoDB (Mongoose 8.x)**

- **Lý do**:
  - Schema linh hoạt phù hợp với dữ liệu recruitment (CVs, jobs, profiles)
  - Hỗ trợ tốt cho nested documents (skills arrays, experience objects)
  - Aggregation pipeline mạnh cho analytics
  - Tích hợp tốt với Node.js ecosystem

### **Redis (ioredis 5.x)**

- **Lý do**:
  - Caching kết quả AI/NLP (matching scores, skill extraction) để giảm latency
  - Session storage và OTP management
  - Rate limiting storage
  - Pub/sub cho real-time notifications

### **ChromaDB 3.x**

- **Lý do**:
  - Vector database nhẹ, embedded (không cần server riêng)
  - Lưu trữ embeddings cho learning resources (10k+ documents)
  - Similarity search cho RAG (Retrieval-Augmented Generation)
  - Tự chủ, không phụ thuộc cloud vector DB

---

## 🧠 3. AI/NLP Stack (Self-Sufficient)

### **PhoBERT (Fine-tuned Vietnamese BERT)**

- **Model**: `vinai/phobert-base-v2` fine-tuned
- **Lý do**:
  - **96% F1 score** trên Vietnamese recruitment dataset
  - Hiểu ngữ cảnh tiếng Việt (dấu thanh, từ ghép)
  - Extract entities: SKILL, EXPERIENCE, EDUCATION, CERTIFICATE
  - Tự chủ, không cần API bên ngoài
  - Fine-tuned trên domain recruitment → accuracy cao

### **Sentence-BERT (Multilingual)**

- **Model**: `paraphrase-multilingual-mpnet-base-v2` (768-dim)
- **Lý do**:
  - Semantic similarity cho job-candidate matching
  - Multilingual (hỗ trợ tiếng Việt + tiếng Anh)
  - Embeddings 768-dim → chất lượng tốt hơn TF-IDF
  - Chạy local qua Python script → không cần API

### **TF-IDF + Cosine Similarity**

- **Library**: `natural` (Natural.js)
- **Lý do**:
  - Fast matching (< 100ms) cho filtering ban đầu
  - Fallback khi semantic models không available
  - Keyword-based matching cho quick search
  - Không cần GPU, chạy trên CPU

### **Google Gemini API (Optional)**

- **Model**: `gemini-2.0-flash` (configurable)
- **Lý do**:
  - **OPTIONAL ONLY** - không bắt buộc cho core features
  - Enhancement cho CV parsing, interview questions
  - Graceful fallback nếu không có API key
  - Free tier: 15 RPM, 1M TPM

### **Multilingual NER**

- **Model**: `dslim/bert-base-NER` (HuggingFace)
- **Library**: `@xenova/transformers`
- **Lý do**:
  - Extract skills từ English CVs (90% recall)
  - Kết hợp với rule-based cho Vietnamese (100% recall)
  - Hybrid approach → coverage tốt nhất

### **LangChain Community**

- **Lý do**:
  - Orchestration cho RAG pipeline
  - Document loaders và text splitters
  - Chain các AI services lại với nhau

---

## 📄 4. Document Processing

### **PDF Parsing**

- **pdf-parse**: Extract text từ PDF CVs
- **pdfjs-dist**: Advanced PDF parsing với layout preservation
- **Lý do**:
  - CVs thường ở định dạng PDF
  - Cần extract chính xác text, không mất formatting
  - pdfjs-dist tốt hơn cho complex layouts

### **DOCX Processing**

- **mammoth**: Convert DOCX → HTML/text
- **Lý do**:
  - Hỗ trợ CVs định dạng Word
  - Preserve formatting (bold, lists)

### **Image Processing**

- **sharp**: Resize, optimize images
- **canvas (@napi-rs/canvas)**: Generate CV templates
- **Lý do**:
  - Optimize avatar uploads
  - Render CV templates với charts/graphics

### **Web Scraping**

- **puppeteer**: Headless browser
- **cheerio**: HTML parsing
- **Lý do**:
  - Crawl job postings từ external sites
  - Parse HTML content

---

## 🔐 5. Security & Authentication

### **Helmet.js**

- **Lý do**:
  - Set security HTTP headers
  - CSP (Content Security Policy) cho XSS protection
  - HSTS, X-Frame-Options, etc.

### **bcrypt/bcryptjs**

- **Lý do**:
  - Hash passwords (bcryptjs cho compatibility)
  - Salt rounds: 10 (default)

### **JWT (jsonwebtoken)**

- **Lý do**:
  - Stateless authentication
  - Token-based API access
  - Refresh token pattern

### **express-rate-limit**

- **Lý do**:
  - Prevent API abuse
  - Different limits cho search, upload, API endpoints
  - Store limits trong Redis

### **express-validator / Joi**

- **Lý do**:
  - Input validation và sanitization
  - Prevent injection attacks
  - Type checking

---

## 📡 6. Real-time & Communication

### **Socket.io**

- **Lý do**:
  - Real-time notifications
  - Live chat (nếu có)
  - WebSocket fallback cho browsers cũ

### **Nodemailer**

- **Lý do**:
  - Email notifications (application status, OTP)
  - SMTP integration

---

## ☁️ 7. Cloud Services

### **Cloudinary**

- **Lý do**:
  - Image/CDN storage cho avatars, CVs, company logos
  - Auto-optimization và transformation
  - Free tier đủ cho development

### **Google Cloud Services**

- **@google-cloud/dialogflow**: Chatbot (optional)
- **googleapis**: Google services integration
- **Lý do**:
  - Dialogflow cho customer support
  - Google OAuth (nếu cần)

---

## 📊 8. Monitoring & Logging

### **Winston**

- **Lý do**:
  - Structured logging
  - Multiple transports (console, file)
  - Log levels (error, warn, info, debug)

### **node-cron**

- **Lý do**:
  - Scheduled tasks (daily maintenance, data collection)
  - Timezone-aware (Asia/Ho_Chi_Minh)

---

## 📚 9. API Documentation

### **Swagger (swagger-jsdoc + swagger-ui-express)**

- **Lý do**:
  - Auto-generate API docs từ JSDoc comments
  - Interactive API testing
  - Standard OpenAPI 3.0 format

---

## 🛠️ 10. Utilities & Helpers

### **compression**

- **Lý do**:
  - Gzip compression cho responses
  - Giảm bandwidth

### **dotenv**

- **Lý do**:
  - Environment variables management
  - Separate config cho dev/prod

### **uuid**

- **Lý do**:
  - Generate unique IDs
  - Session tokens, file names

### **axios**

- **Lý do**:
  - HTTP client cho external APIs
  - Interceptors cho error handling

---

## 🐍 11. Python Integration

### **Python 3.x (via child_process)**

- **Lý do**:
  - Sentence-BERT inference (Python ecosystem tốt hơn)
  - PhoBERT fine-tuning scripts
  - Data processing và visualization

### **Dependencies**:

- `sentence-transformers`: Sentence-BERT models
- `torch`: PyTorch cho model inference
- `transformers`: HuggingFace transformers

---

## 🎨 12. Specialized Libraries

### **compromise**

- **Lý do**:
  - NLP cho English text
  - Part-of-speech tagging

### **node-nlp**

- **Lý do**:
  - Sentiment analysis
  - Language detection
  - Named Entity Recognition (fallback)

### **youtube-sr**

- **Lý do**:
  - Fetch YouTube video metadata
  - Learning resources từ YouTube

---

## 🏗️ 13. Architecture Patterns

### **Layered Architecture**

```
Routes → Controllers → Services → Models → Database
```

### **Service Layer Pattern**

- Tách business logic khỏi controllers
- Reusable services (AI, matching, recommendations)

### **Middleware Pattern**

- Auth, validation, error handling
- Rate limiting, CORS

---

## 📈 14. Performance Optimizations

1. **Caching**: Redis cache cho AI results
2. **Lazy Loading**: Models chỉ load khi cần
3. **Connection Pooling**: MongoDB connection pool
4. **Compression**: Gzip responses
5. **Rate Limiting**: Prevent abuse

---

## 🔄 15. Development Tools

### **nodemon**

- Auto-restart server khi code changes

### **ESLint + Prettier**

- Code quality và formatting

### **Jest + Supertest**

- Unit tests và API tests

---

## 🎯 Tóm tắt: Tại sao chọn stack này?

### ✅ **Self-Sufficient AI**

- Không phụ thuộc external AI APIs (trừ Gemini optional)
- PhoBERT fine-tuned → accuracy cao cho Vietnamese
- Sentence-BERT local → không tốn tiền API calls

### ✅ **Scalability**

- MongoDB horizontal scaling
- Redis caching layer
- Stateless API design

### ✅ **Vietnamese Language Support**

- PhoBERT cho Vietnamese text
- Multilingual NER cho mixed-language CVs
- Rule-based patterns cho Vietnamese skills

### ✅ **Cost-Effective**

- Self-hosted models → không tốn tiền per-request
- ChromaDB embedded → không cần cloud vector DB
- Open-source stack → không license fees

### ✅ **Developer Experience**

- TypeScript support (một số services)
- Swagger docs
- Comprehensive logging
- Error handling middleware

---

## 📝 Ghi chú

- **PhoBERT**: Đã disable do timeout issues, dùng hybrid system thay thế
- **Gemini API**: Optional, có graceful fallback
- **HuggingFace API**: Disabled (410 Gone), dùng TF-IDF fallback
- **Python**: Chạy qua child_process, không phải microservice riêng

---

**Tạo bởi**: AI Assistant  
**Ngày**: 2025-01-XX  
**Version**: 1.0.0
