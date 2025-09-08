# Sample Data Guide

Hướng dẫn sử dụng sample data cho hệ thống tuyển dụng thực tập.

## Tổng quan

Hệ thống bao gồm các file sample data sau:

- `sampleData.js` - Skills, Users, Companies
- `sampleJobs.js` - Jobs với thông tin chi tiết
- `sampleApplications.js` - Applications với quá trình tuyển dụng
- `seedCompleteData.js` - Script để import tất cả data

## Cấu trúc dữ liệu

### 1. Skills (15 skills)
- **Programming**: JavaScript, Python, Java
- **Web**: React, Node.js
- **Data**: SQL, Data Analysis
- **DevOps**: Git, Docker
- **Design**: Figma
- **Soft Skills**: Communication, Problem Solving, Teamwork
- **Business**: Business Analysis
- **Marketing**: Digital Marketing

### 2. Users (7 users)
- **Students (3)**: Sinh viên các ngành khác nhau
- **Employers (3)**: HR từ các công ty lớn
- **Admin (1)**: Quản trị viên hệ thống

### 3. Companies (5 companies)
- **FPT Software**: Công ty phần mềm hàng đầu
- **Tiki**: E-commerce platform
- **VNG Corporation**: Tập đoàn công nghệ
- **Grab Vietnam**: Công ty đa nền tảng
- **Shopee Vietnam**: E-commerce platform

### 4. Jobs (6 jobs)
- **Frontend Developer Intern** (FPT)
- **Backend Developer Intern** (FPT)
- **Data Analyst Intern** (Tiki)
- **UI/UX Design Intern** (VNG)
- **Mobile Developer Intern** (Grab)
- **Marketing Intern** (Shopee)

### 5. Applications (5 applications)
- **Shortlisted**: Frontend Developer Intern
- **Pending**: Data Analyst Intern
- **Interview**: UI/UX Design Intern
- **Rejected**: Mobile Developer Intern
- **Offered**: Marketing Intern

## Cách sử dụng

### 1. Chạy script seed data

```bash
cd backend/src/scripts
node seedCompleteData.js
```

### 2. Kiểm tra data đã được import

```bash
# Kết nối MongoDB và kiểm tra
mongo
use your_database_name
db.skills.count()
db.users.count()
db.companies.count()
db.jobs.count()
db.applications.count()
```

### 3. Test API endpoints

Sau khi seed data, bạn có thể test các API:

```bash
# Lấy danh sách skills
GET /api/skills

# Lấy danh sách jobs
GET /api/jobs

# Lấy danh sách companies
GET /api/companies

# Lấy danh sách applications
GET /api/applications
```

## Thông tin đăng nhập

### Students
- Email: `nguyen.van.a@student.hcmut.edu.vn`
- Password: `password123`

- Email: `tran.thi.b@student.hcmut.edu.vn`
- Password: `password123`

- Email: `le.van.c@student.hcmut.edu.vn`
- Password: `password123`

### Employers
- Email: `hr@fpt.com.vn`
- Password: `password123`

- Email: `tuyendung@tiki.vn`
- Password: `password123`

- Email: `careers@vng.com.vn`
- Password: `password123`

### Admin
- Email: `admin@internship-platform.com`
- Password: `admin123`

## Tính năng đặc biệt

### 1. AI Analysis
Tất cả applications đều có AI analysis với:
- Skills matching score
- Experience matching
- Education matching
- Strengths & weaknesses
- Resume quality assessment
- Cultural & technical fit scores

### 2. Interview Process
Applications bao gồm:
- Interview scheduling
- Interview feedback
- Multiple interview rounds
- Technical & cultural assessments

### 3. Communication History
- Email communications
- Timeline tracking
- Status updates
- Important notifications

### 4. Offer Management
- Salary negotiation
- Benefits package
- Response tracking
- Counter offers

## Cấu trúc thực tế

Sample data được thiết kế dựa trên các website tuyển dụng thực tế:

- **LinkedIn**: Skills, experience levels, company profiles
- **Indeed**: Job descriptions, requirements, benefits
- **Glassdoor**: Company ratings, reviews, salary ranges
- **Internshala**: Internship-specific features
- **TopCV**: Resume analysis, skill matching

## Mở rộng

Để thêm data mới:

1. **Thêm skills**: Cập nhật `sampleSkills` trong `sampleData.js`
2. **Thêm companies**: Cập nhật `sampleCompanies` trong `sampleData.js`
3. **Thêm jobs**: Cập nhật `sampleJobs` trong `sampleJobs.js`
4. **Thêm applications**: Cập nhật `sampleApplications` trong `sampleApplications.js`

## Lưu ý

- Tất cả passwords đều là `password123` cho mục đích testing
- Email verification đã được set là `true` cho tất cả users
- Companies đã được verify
- Jobs đều ở trạng thái `active`
- Applications có các trạng thái khác nhau để test workflow

## Troubleshooting

### Lỗi thường gặp

1. **MongoDB connection error**
   - Kiểm tra `MONGODB_URI` trong `.env`
   - Đảm bảo MongoDB đang chạy

2. **Duplicate key error**
   - Chạy `clearData()` trước khi seed
   - Kiểm tra unique constraints

3. **Validation error**
   - Kiểm tra required fields trong models
   - Đảm bảo data format đúng

### Debug

```bash
# Xem logs chi tiết
DEBUG=* node seedCompleteData.js

# Kiểm tra từng bước
node -e "require('./seedCompleteData.js').seedData()"
```
