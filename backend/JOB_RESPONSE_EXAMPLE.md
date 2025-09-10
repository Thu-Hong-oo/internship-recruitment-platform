# Job API Response Examples

## ✅ **CÓ - Logo công ty được hiển thị trong tất cả Job APIs**

### **1. GET /api/jobs (Get All Jobs)**

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "Frontend Developer Intern",
      "description": "We are looking for a talented Frontend Developer Intern...",
      "category": "tech",
      "subCategories": ["web-development", "frontend"],
      "status": "active",
      "companyId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Tech Solutions Inc",
        "logo": {
          "url": "https://example.com/logos/tech-solutions-logo.png",
          "filename": "tech-solutions-logo.png",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        },
        "industry": {
          "primary": "tech",
          "secondary": ["tech", "data"],
          "tags": ["startup", "innovation"]
        },
        "description": "Leading technology solutions provider"
      },
      "internship": {
        "type": "summer",
        "duration": 3,
        "startDate": "2024-06-01T00:00:00.000Z",
        "endDate": "2024-09-01T00:00:00.000Z",
        "isPaid": true,
        "stipend": {
          "amount": 8000000,
          "currency": "VND",
          "period": "month"
        }
      },
      "requirements": {
        "yearOfStudy": ["2nd-year", "3rd-year", "4th-year"],
        "majors": ["Computer Science"],
        "skills": ["JavaScript", "React", "HTML", "CSS"],
        "experienceRequired": false,
        "level": "intern"
      },
      "location": {
        "type": "hybrid",
        "city": "Ho Chi Minh",
        "district": "District 1",
        "country": "VN"
      },
      "stats": {
        "views": 150,
        "applications": 25
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### **2. GET /api/jobs/:id (Get Single Job)**

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Frontend Developer Intern",
    "description": "We are looking for a talented Frontend Developer Intern...",
    "companyId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "Tech Solutions Inc",
      "logo": {
        "url": "https://example.com/logos/tech-solutions-logo.png",
        "filename": "tech-solutions-logo.png",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      },
      "industry": {
        "primary": "tech",
        "secondary": ["tech", "data"],
        "tags": ["startup", "innovation"]
      },
      "description": "Leading technology solutions provider"
    },
    "postedBy": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "name": "Nguyễn Văn A",
      "email": "employer@techsolutions.com"
    }
  }
}
```

### **3. GET /api/jobs/company/:companyId (Get Jobs by Company)**

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "Frontend Developer Intern",
      "companyId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Tech Solutions Inc",
        "logo": {
          "url": "https://example.com/logos/tech-solutions-logo.png",
          "filename": "tech-solutions-logo.png",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        },
        "industry": {
          "primary": "tech"
        },
        "description": "Leading technology solutions provider"
      }
    }
  ]
}
```

## 📋 **Các API endpoints có populate logo:**

### **✅ Có populate company logo:**
1. `GET /api/jobs` - Get all jobs
2. `GET /api/jobs/:id` - Get single job
3. `GET /api/jobs/company/:companyId` - Get jobs by company
4. `GET /api/jobs/category/:category` - Get jobs by category
5. `GET /api/jobs/recent` - Get recent jobs
6. `GET /api/jobs/subcategory/:subCategory` - Get jobs by subcategory
7. `GET /api/jobs/skills` - Get jobs by skills
8. `POST /api/jobs` - Create job (response)
9. `PUT /api/jobs/:id` - Update job (response)

### **📝 Thông tin company được populate:**
```javascript
.populate('companyId', 'name logo industry description')
```

**Bao gồm:**
- `name` - Tên công ty
- `logo` - Logo công ty (url, filename, uploadedAt)
- `industry` - Thông tin ngành nghề
- `description` - Mô tả công ty

## 🎯 **Cách sử dụng logo trong Frontend:**

```javascript
// Lấy logo URL
const logoUrl = job.companyId.logo.url;

// Hiển thị logo với fallback
<img 
  src={job.companyId.logo?.url || '/default-logo.png'} 
  alt={job.companyId.name}
  className="company-logo"
/>

// Kiểm tra có logo không
if (job.companyId.logo?.url) {
  // Hiển thị logo
} else {
  // Hiển thị logo mặc định hoặc tên công ty
}
```

## 💡 **Lưu ý:**

1. **Logo luôn được populate** trong tất cả job APIs
2. **Logo có thể null** nếu công ty chưa upload logo
3. **Logo structure:**
   ```javascript
   logo: {
     url: String,        // URL của logo
     filename: String,   // Tên file gốc
     uploadedAt: Date    // Thời gian upload
   }
   ```
4. **Frontend nên có fallback** cho trường hợp không có logo
