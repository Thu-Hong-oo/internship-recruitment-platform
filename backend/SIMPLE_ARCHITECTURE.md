# 📁 Cấu trúc Source Code Đơn Giản & Dễ Hiểu

## 🎯 Mục tiêu: Code dễ đọc, dễ hiểu, dễ maintain

### ❌ Vấn đề hiện tại:

- **Quá nhiều layers:** commands, queries, handlers, use-cases cùng tồn tại
- **Confusing naming:** CreateJobCommand + CreateJobUseCase làm gì?
- **Complex structure:** Khó tìm file cần thiết
- **Redundant code:** Commands chỉ là DTOs, Use Cases làm business logic

### ✅ Giải pháp: Đơn giản hóa

```
src/
├── features/           # Theo feature thay vì technical layers
│   ├── jobs/          # Tất cả logic liên quan jobs
│   │   ├── services/  # Business logic (thay vì use-cases)
│   │   ├── models/    # Data models (thay vì repositories)
│   │   └── routes.js  # API routes
│   ├── users/         # Tất cả logic users
│   └── ...
├── shared/            # Common utilities
├── config/            # Configuration
└── app.js             # Main application
```

## 🔄 Migration Plan

### Bước 1: Đơn giản hóa Application Layer

**TRƯỚC:**

```
application/
├── recruitment/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   ├── use-cases/
│   └── repositories/
```

**SAU:**

```
features/
├── jobs/
│   ├── services/     # Business logic
│   ├── models/       # Data access
│   └── index.js      # Feature exports
```

### Bước 2: Đổi tên files cho dễ hiểu

**TRƯỚC:**

- `CreateJobUseCase.js`
- `IJobRepository.js`
- `JobRepository.js`

**SAU:**

- `create-job.js` (service)
- `job-model.js` (data access)

### Bước 3: Đơn giản hóa Controllers

**TRƯỚC:**

```javascript
class JobController {
  constructor(createJobUseCase, getJobUseCase) {
    this.createJobUseCase = createJobUseCase;
  }
}
```

**SAU:**

```javascript
const jobService = require('../features/jobs');

const createJob = async (req, res) => {
  const result = await jobService.create(req.body);
  res.json(result);
};
```

## 📋 Cấu trúc cuối cùng đề xuất

```
src/
├── features/                    # Business Features
│   ├── jobs/
│   │   ├── services/           # Business Logic
│   │   │   ├── create-job.js
│   │   │   ├── get-job.js
│   │   │   └── update-job.js
│   │   ├── models/             # Data Access
│   │   │   └── job.js
│   │   └── index.js            # Feature API
│   ├── users/
│   ├── applications/
│   └── ...
├── presentation/               # HTTP Layer
│   ├── controllers/
│   ├── routes/
│   └── middlewares/
├── shared/                     # Common Code
│   ├── utils/
│   ├── database/
│   └── validation/
└── config/                     # Configuration
```

## 🎯 Lợi ích

1. **Dễ tìm:** Tất cả logic liên quan 1 feature ở 1 chỗ
2. **Ít files:** Không có redundant commands/queries
3. **Đơn giản:** Không cần DI container phức tạp
4. **Nhanh:** Ít imports, ít layers
5. **Hiểu quả:** Code flow rõ ràng từ controller -> service -> model

Bạn có muốn tôi refactor theo cấu trúc này không?
