# Cập nhật từ StudentProfile sang CandidateProfile

## Tổng quan

Đã cập nhật hệ thống để phù hợp với định nghĩa "thực tập sinh" rộng hơn, không chỉ giới hạn ở sinh viên mà bao gồm cả người đã tốt nghiệp, người chuyển ngành, và người tự học.

## Thay đổi chính

### 1. Model mới: `CandidateProfile`

- **File**: `src/models/CandidateProfile.js`
- **Thay thế**: `src/models/StudentProfile.js` (đã xóa)
- **Tính năng mới**:
  - Hỗ trợ nhiều loại ứng viên: `student`, `graduated`, `self-taught`, `career-changer`
  - Thông tin cá nhân chi tiết hơn
  - Hỗ trợ chuyển ngành với `careerTransition` và `isTransferSkill`
  - Thêm `personalInfo` với LinkedIn, GitHub, portfolio
  - Cập nhật `education` với `currentStatus` và các trường phù hợp

### 2. Cập nhật User Model

- **File**: `src/models/User.js`
- **Thay đổi**: `studentProfile` → `candidateProfile`
- **Reference**: `ref: 'CandidateProfile'`

### 3. Cập nhật Controllers

- **File**: `src/controllers/userController.js`
- **Thay đổi**: Tất cả hàm `*Student*` → `*Candidate*`
- **Routes mới**: `/api/users/candidate/*` thay vì `/api/users/student/*`

### 4. Cập nhật Routes

- **File**: `src/routes/users.js`
- **Thay đổi**: Tất cả routes từ `/student/` → `/candidate/`
- **Swagger**: Cập nhật documentation cho Candidate Profile

### 5. Cập nhật Admin Controller

- **File**: `src/controllers/adminController.js`
- **Thay đổi**: `populate('studentProfile')` → `populate('candidateProfile')`

### 6. Cập nhật API Documentation

- **File**: `API_STRUCTURE.md`
- **Thay đổi**: "Student Profile Management" → "Candidate Profile Management"
- **Endpoints**: `/student/*` → `/candidate/*`

## Tính năng mới trong CandidateProfile

### Education Status

```javascript
currentStatus: {
  type: String,
  enum: ['student', 'graduated', 'self-taught', 'career-changer'],
  required: true,
}
```

### Personal Information

```javascript
personalInfo: {
  dateOfBirth: Date,
  gender: String,
  phone: String,
  address: Object,
  linkedin: String,
  github: String,
  portfolio: String,
}
```

### Career Transition (cho người chuyển ngành)

```javascript
careerTransition: {
  fromIndustry: String,
  toIndustry: String,
  transitionReason: String,
  transferableSkills: [String],
}
```

### Enhanced Skills

```javascript
skills: [
  {
    skillId: ObjectId,
    level: String,
    experience: Number,
    isTransferSkill: Boolean, // Mới
  },
];
```

## API Endpoints mới

### Candidate Profile Management

- `GET /api/users/candidate/profile` - Lấy profile ứng viên
- `POST /api/users/candidate/profile` - Tạo profile ứng viên
- `PUT /api/users/candidate/profile` - Cập nhật profile ứng viên
- `POST /api/users/candidate/resume` - Upload CV/Resume
- `DELETE /api/users/candidate/resume` - Xóa CV/Resume
- `GET /api/users/candidate/skills` - Lấy skills
- `POST /api/users/candidate/skills` - Thêm skills
- `PUT /api/users/candidate/skills/:skillId` - Cập nhật skill
- `DELETE /api/users/candidate/skills/:skillId` - Xóa skill

## Lợi ích

1. **Bao quát hơn**: Hỗ trợ tất cả loại ứng viên thực tập
2. **Linh hoạt**: Có thể mở rộng cho các loại ứng viên khác
3. **AI-ready**: Tích hợp tốt hơn với AI phân tích kỹ năng
4. **Career transition**: Hỗ trợ người chuyển ngành
5. **Professional**: Thêm thông tin chuyên nghiệp (LinkedIn, GitHub)

## Migration Notes

- Cần migrate dữ liệu từ `StudentProfile` sang `CandidateProfile` nếu có
- Cập nhật frontend để sử dụng endpoints mới
- Cập nhật Postman collection nếu cần
- Kiểm tra tất cả integrations với AI services
