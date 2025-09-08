# 📋 Job API Documentation

## 🏗️ Job Model Structure

### 📊 Database Schema

```javascript
{
  _id: ObjectId,
  title: String,                    // Tiêu đề công việc
  slug: String,                     // URL-friendly title
  description: String,              // Mô tả chi tiết công việc
  companyId: ObjectId,              // Reference to Company
  category: String,                 // Danh mục công việc
  jobType: String,                  // Loại công việc (full-time, part-time, contract)

  // Thông tin thực tập
  internship: {
    type: String,                   // Loại thực tập (summer, winter, semester)
    duration: Number,               // Thời gian thực tập (tuần)
    startDate: Date,                // Ngày bắt đầu
    endDate: Date,                  // Ngày kết thúc
    stipend: {
      min: Number,                  // Lương tối thiểu
      max: Number,                  // Lương tối đa
      currency: String              // Đơn vị tiền tệ
    }
  },

  // Địa điểm làm việc
  location: {
    city: String,                   // Thành phố
    district: String,               // Quận/Huyện
    address: String,                // Địa chỉ cụ thể
    remote: Boolean,                // Có thể làm từ xa
    type: String                    // Loại địa điểm (office, remote, hybrid)
  },

  // Yêu cầu công việc
  requirements: {
    skills: [{
      skillId: ObjectId,            // Reference to Skill
      importance: Number,           // Mức độ quan trọng (1-10)
      level: String,                // Cấp độ yêu cầu (beginner, intermediate, advanced)
      yearsOfExperience: Number     // Số năm kinh nghiệm
    }],
    experience: {
      experienceLevel: String,      // Cấp độ kinh nghiệm
      minYears: Number,             // Số năm tối thiểu
      maxYears: Number              // Số năm tối đa
    },
    education: {
      level: String,                // Trình độ học vấn
      fieldOfStudy: [String],       // Chuyên ngành
      required: Boolean             // Bắt buộc hay không
    }
  },

  // Cài đặt ứng tuyển
  applicationSettings: {
    deadline: Date,                 // Hạn nộp hồ sơ
    maxApplications: Number,        // Số lượng ứng viên tối đa
    requireCoverLetter: Boolean,    // Yêu cầu thư xin việc
    requirePortfolio: Boolean,       // Yêu cầu portfolio
    requireReferences: Boolean      // Yêu cầu thư giới thiệu
  },

  // Phân tích AI
  aiAnalysis: {
    category: String,               // Danh mục được AI phân tích
    difficulty: String,            // Độ khó (easy, medium, hard)
    skillsExtracted: [String],      // Kỹ năng được trích xuất
    keywords: [String],             // Từ khóa quan trọng
    sentiment: String,              // Cảm xúc của mô tả
    confidence: Number              // Độ tin cậy của phân tích
  },

  // Thống kê
  stats: {
    views: Number,                  // Lượt xem
    applications: Number,           // Số đơn ứng tuyển
    saves: Number,                  // Số lượt lưu
    shares: Number,                 // Số lượt chia sẻ
    clicks: Number                  // Số lượt click
  },

  // Trạng thái và metadata
  status: String,                   // active, inactive, closed, draft
  isUrgent: Boolean,                // Công việc khẩn cấp
  isFeatured: Boolean,              // Công việc nổi bật
  priority: Number,                 // Độ ưu tiên (1-10)

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date
}
```

---

## 🚀 API Endpoints

### 1. 📋 Get All Jobs (with Advanced Filtering)

**Endpoint:** `GET /api/jobs`

**Query Parameters:**

```javascript
{
  // Pagination
  page: Number,                    // Trang hiện tại (default: 1)
  limit: Number,                   // Số job mỗi trang (default: 10)

  // Basic Filters
  category: String,                // Danh mục công việc
  location: String,                // Địa điểm (tìm kiếm theo city)
  type: String,                    // Loại thực tập
  remote: Boolean,                 // Làm việc từ xa
  skills: String,                  // Kỹ năng (comma-separated skill IDs)
  difficulty: String,              // Độ khó
  company: String,                 // Company ID

  // Advanced Filters
  salaryMin: Number,               // Lương tối thiểu
  salaryMax: Number,               // Lương tối đa
  experienceLevel: String,         // Cấp độ kinh nghiệm
  educationLevel: String,          // Trình độ học vấn
  jobType: String,                 // Loại công việc
  isUrgent: Boolean,               // Công việc khẩn cấp
  isFeatured: Boolean,             // Công việc nổi bật
  status: String,                  // Trạng thái (default: 'active')

  // Sorting
  sortBy: String,                  // Sắp xếp theo (createdAt, salary, views, applications)
  sortOrder: String                 // Thứ tự (asc, desc)
}
```

**Response:**

```javascript
{
  "success": true,
  "data": [
    {
      "_id": "job_id",
      "title": "Frontend Developer Intern",
      "slug": "frontend-developer-intern",
      "description": "Mô tả công việc...",
      "companyId": {
        "_id": "company_id",
        "name": "Tech Company",
        "logo": "logo_url",
        "industry": "Technology"
      },
      "category": "Technology",
      "internship": {
        "type": "summer",
        "duration": 12,
        "startDate": "2024-06-01",
        "endDate": "2024-08-31",
        "stipend": {
          "min": 5000000,
          "max": 8000000,
          "currency": "VND"
        }
      },
      "location": {
        "city": "Ho Chi Minh",
        "district": "District 1",
        "address": "123 Main Street",
        "remote": false,
        "type": "office"
      },
      "requirements": {
        "skills": [
          {
            "skillId": {
              "_id": "skill_id",
              "name": "JavaScript",
              "category": "programming"
            },
            "importance": 9,
            "level": "intermediate",
            "yearsOfExperience": 1
          }
        ],
        "experience": {
          "experienceLevel": "entry",
          "minYears": 0,
          "maxYears": 2
        },
        "education": {
          "level": "bachelor",
          "fieldOfStudy": ["Computer Science"],
          "required": true
        }
      },
      "applicationSettings": {
        "deadline": "2024-05-30",
        "maxApplications": 50,
        "requireCoverLetter": true,
        "requirePortfolio": false,
        "requireReferences": false
      },
      "aiAnalysis": {
        "category": "Technology",
        "difficulty": "medium",
        "skillsExtracted": ["JavaScript", "React", "CSS"],
        "keywords": ["frontend", "developer", "intern"],
        "sentiment": "positive",
        "confidence": 0.85
      },
      "stats": {
        "views": 150,
        "applications": 25,
        "saves": 10,
        "shares": 5,
        "clicks": 30
      },
      "status": "active",
      "isUrgent": false,
      "isFeatured": true,
      "priority": 8,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  },
  "filters": {
    "appliedFilters": 3,
    "availableFilters": {
      "category": true,
      "location": true,
      "salaryRange": true,
      "skills": false,
      "difficulty": false,
      "company": false,
      "experienceLevel": false,
      "educationLevel": false,
      "jobType": false,
      "isUrgent": false,
      "isFeatured": false
    }
  }
}
```

### 2. 🔍 Search Jobs (Semantic Search)

**Endpoint:** `GET /api/jobs/search`

**Query Parameters:**

```javascript
{
  q: String,                        // Từ khóa tìm kiếm
  skills: String,                   // Kỹ năng (comma-separated)
  location: String,                 // Địa điểm
  locationType: String,             // Loại địa điểm
  category: String,                 // Danh mục
  jobType: String,                  // Loại công việc
  salaryMin: Number,                // Lương tối thiểu
  salaryMax: Number,                // Lương tối đa
  experienceLevel: String,          // Cấp độ kinh nghiệm
  educationLevel: String,           // Trình độ học vấn
  isRemote: Boolean,                // Làm việc từ xa
  isUrgent: Boolean,                // Công việc khẩn cấp
  isFeatured: Boolean,              // Công việc nổi bật
  limit: Number                     // Số lượng kết quả
}
```

### 3. 📄 Get Single Job

**Endpoint:** `GET /api/jobs/:id`

**Response:** Trả về thông tin chi tiết của 1 job (tương tự structure trên)

### 4. 💡 Get Job Recommendations

**Endpoint:** `GET /api/jobs/:id/recommendations`

**Query Parameters:**

```javascript
{
  userId: String; // ID của user để tính toán gợi ý
}
```

### 5. 🎯 Get Job Match Score

**Endpoint:** `GET /api/jobs/:id/match-score`

**Query Parameters:**

```javascript
{
  userId: String; // ID của user để tính điểm phù hợp
}
```

**Response:**

```javascript
{
  "success": true,
  "data": {
    "overallScore": 85,
    "breakdown": {
      "skills": 90,
      "experience": 80,
      "education": 85,
      "location": 90
    },
    "recommendations": [
      "Cải thiện kỹ năng React",
      "Thêm kinh nghiệm với TypeScript"
    ]
  }
}
```

### 6. 🛠️ Create Job (Employer Only)

**Endpoint:** `POST /api/jobs`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```javascript
{
  "title": "Frontend Developer Intern",
  "description": "Mô tả công việc chi tiết...",
  "category": "Technology",
  "jobType": "internship",
  "internship": {
    "type": "summer",
    "duration": 12,
    "startDate": "2024-06-01",
    "endDate": "2024-08-31",
    "stipend": {
      "min": 5000000,
      "max": 8000000,
      "currency": "VND"
    }
  },
  "location": {
    "city": "Ho Chi Minh",
    "district": "District 1",
    "address": "123 Main Street",
    "remote": false,
    "type": "office"
  },
  "requirements": {
    "skills": [
      {
        "skillId": "skill_id",
        "importance": 9,
        "level": "intermediate",
        "yearsOfExperience": 1
      }
    ],
    "experience": {
      "experienceLevel": "entry",
      "minYears": 0,
      "maxYears": 2
    },
    "education": {
      "level": "bachelor",
      "fieldOfStudy": ["Computer Science"],
      "required": true
    }
  },
  "applicationSettings": {
    "deadline": "2024-05-30",
    "maxApplications": 50,
    "requireCoverLetter": true,
    "requirePortfolio": false,
    "requireReferences": false
  },
  "isUrgent": false,
  "isFeatured": true,
  "priority": 8
}
```

### 7. ✏️ Update Job (Employer Only)

**Endpoint:** `PUT /api/jobs/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Tương tự như Create Job

### 8. 🗑️ Delete Job (Employer Only)

**Endpoint:** `DELETE /api/jobs/:id`

**Headers:** `Authorization: Bearer <token>`

### 9. 📝 Apply for Job (Candidate Only)

**Endpoint:** `POST /api/jobs/:id/apply`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```javascript
{
  "coverLetter": "Thư xin việc...",
  "resumeUrl": "https://...",
  "portfolioUrl": "https://..."
}
```

### 10. 📊 Get Job Applications (Employer Only)

**Endpoint:** `GET /api/jobs/:id/applications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

```javascript
{
  status: String,                   // pending, reviewing, accepted, rejected
  page: Number,                     // Trang hiện tại
  limit: Number                     // Số ứng viên mỗi trang
}
```

### 11. 🏷️ Special Job Lists

#### Featured Jobs

**Endpoint:** `GET /api/jobs/featured`

#### Urgent Jobs

**Endpoint:** `GET /api/jobs/urgent`

#### Hot Jobs (Most Viewed)

**Endpoint:** `GET /api/jobs/hot`

#### Jobs by Category

**Endpoint:** `GET /api/jobs/category/:category`

#### Jobs by Location

**Endpoint:** `GET /api/jobs/location/:location`

#### Jobs by Company

**Endpoint:** `GET /api/jobs/company/:companyId`

#### Jobs by Skills

**Endpoint:** `GET /api/jobs/skills?skillIds=id1,id2,id3`

#### Recent Jobs

**Endpoint:** `GET /api/jobs/recent`

#### Popular Jobs

**Endpoint:** `GET /api/jobs/popular?period=week`

---

## 🎨 Frontend Usage Examples

### 1. 📋 Job Listing Page

```javascript
// Get jobs with filters
const getJobs = async (filters = {}) => {
  const params = new URLSearchParams();

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/jobs?${params}`);
  return response.json();
};

// Usage
const jobs = await getJobs({
  category: 'Technology',
  location: 'Ho Chi Minh',
  salaryMin: 5000000,
  salaryMax: 10000000,
  skills: 'skill1,skill2,skill3',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});
```

### 2. 🔍 Search Implementation

```javascript
const searchJobs = async (query, filters = {}) => {
  const params = new URLSearchParams();
  params.append('q', query);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/jobs/search?${params}`);
  return response.json();
};
```

### 3. 📄 Job Detail Page

```javascript
const getJobDetail = async jobId => {
  const response = await fetch(`/api/jobs/${jobId}`);
  return response.json();
};

const getJobMatchScore = async (jobId, userId) => {
  const response = await fetch(
    `/api/jobs/${jobId}/match-score?userId=${userId}`
  );
  return response.json();
};
```

### 4. 📝 Job Application

```javascript
const applyForJob = async (jobId, applicationData) => {
  const response = await fetch(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(applicationData),
  });
  return response.json();
};
```

---

## 🔧 Error Handling

### Common Error Responses

```javascript
// 400 Bad Request
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ"
}

// 401 Unauthorized
{
  "success": false,
  "message": "Không có quyền truy cập"
}

// 403 Forbidden
{
  "success": false,
  "message": "Không có quyền thực hiện hành động này"
}

// 404 Not Found
{
  "success": false,
  "message": "Không tìm thấy công việc"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "Lỗi server"
}
```

---

## 📱 Frontend State Management

### Redux/Zustand Example

```javascript
// Job Store
const useJobStore = create((set, get) => ({
  jobs: [],
  currentJob: null,
  filters: {},
  pagination: {},
  loading: false,
  error: null,

  // Actions
  fetchJobs: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await getJobs(filters);
      set({
        jobs: response.data,
        pagination: response.pagination,
        filters: response.filters,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  setFilters: filters => set({ filters }),
  clearFilters: () => set({ filters: {} }),

  fetchJobDetail: async jobId => {
    set({ loading: true });
    try {
      const response = await getJobDetail(jobId);
      set({ currentJob: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

---

## 🎯 Best Practices

### 1. 📊 Performance Optimization

- Sử dụng pagination để tránh load quá nhiều data
- Implement caching cho các API calls thường xuyên
- Sử dụng debounce cho search input
- Lazy load images và content

### 2. 🔍 Search Optimization

- Implement search suggestions
- Sử dụng semantic search cho kết quả tốt hơn
- Cache search results
- Implement search history

### 3. 📱 UX Considerations

- Loading states cho tất cả API calls
- Error boundaries và fallback UI
- Responsive design cho mobile
- Accessibility compliance

### 4. 🔒 Security

- Validate tất cả input từ user
- Sanitize data trước khi hiển thị
- Implement rate limiting
- Secure file uploads

---

## 📚 Additional Resources

- [MongoDB Query Documentation](https://docs.mongodb.com/manual/reference/operator/query/)
- [Express.js Routing](https://expressjs.com/en/guide/routing.html)
- [JWT Authentication](https://jwt.io/)
- [Mongoose Schema Types](https://mongoosejs.com/docs/schematypes.html)
