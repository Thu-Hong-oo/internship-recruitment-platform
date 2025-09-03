# 📊 Hướng dẫn sử dụng dữ liệu mẫu

## 🎯 Tổng quan

Dữ liệu mẫu được thiết kế để mô phỏng một nền tảng tuyển dụng thực tập thực tế với các công ty và vị trí công việc đa dạng, dựa trên tham khảo từ TopCV và các công ty công nghệ hàng đầu Việt Nam.

## 🏢 Dữ liệu Company (16 công ty)

### Các công ty được tạo:

1. **FPT Software** - Công ty phần mềm hàng đầu Việt Nam
2. **Viettel** - Tập đoàn viễn thông quân đội
3. **VNG Corporation** - Công ty công nghệ (Zalo, Zing)
4. **Tiki** - Nền tảng e-commerce
5. **Grab Vietnam** - Nền tảng giao thông và giao hàng
6. **Shopee Vietnam** - Nền tảng e-commerce
7. **MoMo** - Ví điện tử và thanh toán số
8. **Vingroup** - Tập đoàn đa ngành
9. **Bkav** - Công ty bảo mật thông tin
10. **CMC Technology** - Công ty công nghệ thông tin
11. **Amanotes** - Công ty game mobile hàng đầu Việt Nam
12. **Axon Active** - Công ty phần mềm quốc tế (Thụy Sĩ)
13. **KMS Technology** - Công ty phần mềm quốc tế (Mỹ)
14. **Gear Inc.** - Công ty game quốc tế (Mỹ)
15. **NashTech** - Công ty phần mềm quốc tế (Anh)

### Thông tin chi tiết mỗi công ty:

- **Thông tin cơ bản**: Tên, mô tả, ngành nghề, quy mô
- **Địa chỉ**: Địa chỉ chi tiết, tọa độ GPS
- **Liên hệ**: Email, điện thoại, LinkedIn, Facebook
- **Phúc lợi**: 4 phúc lợi chính cho mỗi công ty
- **Đánh giá**: Rating trung bình và số lượng đánh giá
- **Thống kê**: Tổng số job, ứng viên, thực tập đang hoạt động

## 💼 Dữ liệu Job (15 vị trí đa dạng)

### Các vị trí được tạo:

1. **Frontend Developer Intern** - FPT Software
2. **Backend Developer Intern** - VNG Corporation
3. **Mobile Developer Intern (React Native)** - Grab Vietnam
4. **Data Science Intern** - Shopee Vietnam
5. **UI/UX Designer Intern** - MoMo
6. **DevOps Engineer Intern** - Viettel
7. **Product Manager Intern** - Tiki
8. **Cybersecurity Intern** - Bkav
9. **Full Stack Developer Intern** - CMC Technology
10. **Junior Frontend Developer** - FPT Software (Full-time)
11. **Mid-level Backend Developer** - VNG Corporation (Full-time)
12. **Senior Data Engineer** - Shopee Vietnam (Full-time)
13. **Part-time Content Writer** - Tiki (Part-time)
14. **Contract UI/UX Designer** - MoMo (Contract)

### Thông tin chi tiết mỗi job:

- **Thông tin cơ bản**: Tiêu đề, mô tả, loại hình việc làm
- **Lương thưởng**: 
  - Internship: 5-12 triệu VND/tháng
  - Full-time: 15-80 triệu VND/tháng
  - Part-time: 200-500k VND/giờ
  - Contract: 25-40 triệu VND/tháng
- **Yêu cầu**: 
  - Học vấn: Bachelor/Master degree
  - Kinh nghiệm: Entry (0 năm) đến Senior (5+ năm)
  - Kỹ năng: 4 kỹ năng bắt buộc + 5 kỹ năng ưu tiên
  - Ngôn ngữ: Tiếng Việt (fluent) + Tiếng Anh (conversational/fluent/native)
- **Phúc lợi**: 5 phúc lợi chính
- **Thời gian**: 
  - Internship: 6 tháng thực tập
  - Full-time: Dài hạn
  - Part-time: Linh hoạt theo giờ
  - Contract: 3-12 tháng
- **Phân tích AI**: Skills extracted, difficulty level, matching score

## 🚀 Cách sử dụng

### 1. Chạy script seed dữ liệu:

```bash
# Chạy seed dữ liệu mẫu
npm run seed

# Hoặc chạy trực tiếp
node src/scripts/seedData.js
```

### 2. Kiểm tra dữ liệu đã được tạo:

```bash
# Kết nối MongoDB và kiểm tra
mongo
use your_database_name
db.companies.find().count()  # Sẽ trả về 16
db.jobs.find().count()       # Sẽ trả về 15
```

### 3. Xem chi tiết dữ liệu:

```javascript
// Xem tất cả companies
db.companies.find().pretty()

// Xem tất cả jobs
db.jobs.find().pretty()

// Xem jobs của một công ty cụ thể
db.jobs.find({company: "FPT Software"}).pretty()

// Xem jobs theo location
db.jobs.find({"location.city": "Hanoi"}).pretty()

// Xem jobs theo employment type
db.jobs.find({employmentType: "internship"}).pretty()
```

## 📈 Thống kê dữ liệu

### Companies:
- **Tổng số**: 16 công ty
- **Ngành nghề**: Technology (12), E-commerce (2), Finance (1), Telecommunications (1), Security (1), Gaming (2), Entertainment (2)
- **Quy mô**: 1-10 (0), 11-50 (0), 51-200 (2), 201-500 (3), 501-1000 (2), 1000+ (9)
- **Địa điểm**: Hanoi (5), Ho Chi Minh City (11)
- **Quốc gia**: Vietnam (11), Switzerland (1), USA (2), UK (1), Singapore (1)
- **Verified**: 100% (16/16)

### Jobs:
- **Tổng số**: 15 vị trí đa dạng
- **Loại hình**: 
  - Internship: 9 (60%)
  - Full-time: 4 (27%)
  - Part-time: 1 (7%)
  - Contract: 1 (7%)
- **Địa điểm**: Hanoi (5), Ho Chi Minh City (10)
- **Lương trung bình**: 
  - Internship: 6.5 triệu VND/tháng
  - Full-time: 35 triệu VND/tháng
  - Part-time: 350k VND/giờ
  - Contract: 32.5 triệu VND/tháng
- **Kỹ năng phổ biến**: JavaScript (8), Python (6), React (4), Git (7)
- **Verified**: 100% (15/15)

## 🔧 Tùy chỉnh dữ liệu

### Thêm công ty mới:

1. Chỉnh sửa file `src/data/sampleCompanies.js`
2. Thêm object company mới vào array
3. Chạy lại script seed

### Thêm job mới:

1. Chỉnh sửa file `src/data/sampleJobs.js`
2. Thêm object job mới vào array
3. Đảm bảo company name khớp với company đã có
4. Chạy lại script seed

### Cấu trúc dữ liệu:

```javascript
// Company structure
{
  name: String,
  description: String,
  industry: [String],
  size: String,
  foundedYear: Number,
  website: String,
  location: {
    address: String,
    city: String,
    district: String,
    country: String,
    coordinates: {lat: Number, lng: Number}
  },
  contact: {
    email: String,
    phone: String,
    linkedin: String,
    facebook: String
  },
  benefits: [{
    name: String,
    description: String,
    icon: String
  }],
  rating: {average: Number, count: Number},
  stats: {totalJobs: Number, totalApplications: Number, activeInternships: Number}
}

// Job structure
{
  title: String,
  description: String,
  company: String,
  companyId: ObjectId,
  location: {city: String, state: String, country: String, remote: Boolean},
  employmentType: String,
  salaryRange: {min: Number, max: Number, currency: String, period: String},
  requirements: {
    education: {level: String, field: [String]},
    experience: {years: Number, level: String},
    skills: {
      required: [{name: String, level: String, priority: String}],
      preferred: [String]
    },
    languages: [{name: String, level: String}]
  },
  benefits: [String],
  applicationDeadline: Date,
  startDate: Date,
  duration: {months: Number, description: String},
  contactInfo: {email: String, phone: String, website: String},
  status: String,
  isVerified: Boolean,
  tags: [String],
  aiAnalysis: {
    skillsExtracted: [String],
    difficultyLevel: String,
    matchingScore: Number,
    keywords: [String],
    category: String,
    estimatedApplications: Number
  }
}
```

## 🎨 Tính năng đặc biệt

### 1. AI Analysis:
- Mỗi job có phân tích AI với skills extracted
- Difficulty level: entry, junior, mid, senior
- Matching score: 0-100
- Estimated applications dựa trên độ phổ biến

### 2. Realistic Data:
- Dữ liệu dựa trên thực tế thị trường Việt Nam
- Lương thưởng phù hợp với sinh viên thực tập
- Yêu cầu kỹ năng realistic cho entry level
- Deadline và thời gian thực tập hợp lý

### 3. SEO Optimized:
- Keywords cho mỗi company và job
- Slug tự động tạo từ tên
- Meta data cho search optimization

## 🔄 Reset dữ liệu

Để xóa và tạo lại dữ liệu mẫu:

```bash
npm run seed:reset
```

Hoặc chạy trực tiếp:

```bash
node -e "require('./src/scripts/seedData.js').seedData()"
```

## 📝 Lưu ý

1. **Admin User**: Script sẽ tạo một admin user với email `admin@internbridge.com` và password `admin123456`
2. **Company Stats**: Stats của company sẽ được tự động cập nhật sau khi tạo jobs
3. **Validation**: Tất cả dữ liệu đều pass validation của Mongoose schema
4. **Indexes**: Database indexes đã được tối ưu cho performance
5. **Relationships**: Jobs được liên kết với companies thông qua companyId

## 🎯 Sử dụng cho development

Dữ liệu mẫu này phù hợp cho:
- Testing API endpoints
- Demo frontend features
- Performance testing
- AI/ML model training
- User experience testing
