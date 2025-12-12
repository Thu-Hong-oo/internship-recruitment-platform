# Internship Recruitment Platform - Database Schema Diagrams

## 📊 Database Schema Overview

Hệ thống Internship Recruitment Platform sử dụng **MongoDB** với kiến trúc database được thiết kế theo nguyên tắc **Document-based** và **Embedded relationships**.

**✅ Status**: Database schema diagrams completed and validated against actual MongoDB models.

## 🗂️ Các File Diagram

### 1. `database-schema-complete.puml` - Chi tiết đầy đủ
- **Mục đích**: Hiển thị toàn bộ cấu trúc database với chi tiết fields
- **Đối tượng**: Developers, DBAs, System Architects
- **Nội dung**: Tất cả entities với đầy đủ attributes và relationships

### 2. `database-schema-simplified.puml` - Đơn giản hóa
- **Mục đích**: Tổng quan high-level về relationships
- **Đối tượng**: Product Managers, Stakeholders, New team members
- **Nội dung**: Core entities và relationships chính

## 🏗️ Kiến trúc Database

### **Core Entities**
```
User (Central)
├── CandidateProfile (1-1)
├── EmployerProfile (1-1)
├── Notification (1-many)
└── Authentication data
```

### **Job Management**
```
EmployerProfile
└── Job (1-many)
    ├── Application (1-many)
    ├── SavedJob (1-many)
    └── CVMatchingScore (1-many)
```

### **Candidate Management**
```
CandidateProfile
├── Application (1-many)
├── ResumeBuilder (1-many)
├── SavedJob (1-many)
├── CompanyFollow (1-many)
├── LearningRoadmap (1-many)
└── CVMatchingScore (1-many)
```

### **Supporting Entities**
```
Skill - Core competency management
Industry - Hierarchical industry classification
ResumeBuilder - AI-powered CV building
Notification - Real-time communication
```

## 🔗 Key Relationships

### **One-to-One (1-1)**
- `User ↔ CandidateProfile`
- `User ↔ EmployerProfile`

### **One-to-Many (1-M)**
- `EmployerProfile → Job`
- `Job → Application`
- `CandidateProfile → ResumeBuilder`
- `User → Notification`

### **Many-to-Many (M-M)**
- `CandidateProfile ↔ Skill` (through embedded skills array)
- `Job ↔ Skill` (through skillIds array)

## 📋 Entity Details

### **User Model**
```javascript
{
  _id: ObjectId,
  email: String [unique],
  password: String,
  role: String [candidate/employer],
  fullName: String,
  candidateProfile: ObjectId,
  employerProfile: ObjectId,
  // ... authentication fields
}
```

### **Job Model**
```javascript
{
  _id: ObjectId,
  employer: ObjectId [FK->EmployerProfile],
  title: String,
  description: String,
  skills: [String],
  skillIds: [ObjectId] [FK->Skill],
  industryCode: String,
  address: Object,
  salary: Object,
  // ... metadata
}
```

### **Application Model**
```javascript
{
  _id: ObjectId,
  candidateId: ObjectId [FK->CandidateProfile],
  jobId: ObjectId [FK->Job],
  status: String,
  coverLetter: String,
  matchingScore: Object,
  // ... attachments
}
```

## 🎨 Cách sử dụng PlantUML

### **Cài đặt PlantUML**
```bash
# Sử dụng VS Code extension
# Tên: PlantUML
# Publisher: jebbs

# Hoặc command line
npm install -g @plantuml/plantuml
```

### **Render Diagram**
```bash
# Trong VS Code: Ctrl+Shift+P -> "PlantUML: Preview Current Diagram"

# Command line
plantuml database-schema-complete.puml
```

### **Export Formats**
- PNG: `plantuml -tpng database-schema-complete.puml`
- SVG: `plantuml -tsvg database-schema-complete.puml`
- PDF: `plantuml -tpdf database-schema-complete.puml`

## 🔍 Design Patterns Used

### **Embedded Documents**
- User preferences, notifications settings
- Job address, salary structures
- Application matching scores

### **Reference Relationships**
- User ↔ Profiles (1-1)
- Employer → Jobs (1-M)
- Candidate → Applications (1-M)

### **Polymorphic References**
- Notifications với sender/recipient
- Skills referenced từ multiple entities

### **Hierarchical Data**
- Industry với parent-child relationships
- Resume versions với content snapshots

## 📈 Scalability Considerations

### **Indexing Strategy**
```javascript
// Compound indexes
{ "candidateId": 1, "jobId": 1, "createdAt": -1 }
{ "employer": 1, "status": 1, "createdAt": -1 }
{ "skillIds": 1, "industryCode": 1 }

// Text indexes
{ "title": "text", "description": "text", "requirements": "text" }
```

### **Data Partitioning**
- Jobs partitioned by industry
- Applications partitioned by date
- Notifications partitioned by user

### **Caching Strategy**
- Redis cho user sessions
- In-memory cache cho skills/industries
- CDN cho static assets

## 🚀 Performance Optimizations

### **Read Optimization**
- Embedded documents cho frequently accessed data
- Denormalized counters (views, applicationsCount)
- Pre-computed matching scores

### **Write Optimization**
- Async processing cho heavy operations
- Batch updates cho statistics
- Optimistic locking cho concurrent edits

### **Query Optimization**
- Covered queries với compound indexes
- Aggregation pipelines cho analytics
- Text search với MongoDB Atlas Search

## 🔧 Development Guidelines

### **Schema Evolution**
- Backward compatibility cho existing data
- Migration scripts cho breaking changes
- Version control cho schema changes

### **Data Validation**
- Mongoose schema validation
- Custom validators cho business rules
- Input sanitization middleware

### **Error Handling**
- Graceful degradation khi services unavailable
- Comprehensive logging với Winston
- User-friendly error messages

## 📚 Related Documentation

- [API Documentation](./API_ENDPOINTS.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Database Attributes](./database-attributes-table.md)
- [Model Relationships](./database-diagram.md)

---

**Last Updated**: December 11, 2025 (Schema diagrams completed)
**Database**: MongoDB 4.4+
**ORM**: Mongoose 6.x