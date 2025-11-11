# 🚀 Postman Collections - API Testing Suite

**Tổng cộng**: 13 collections | ~230 endpoints | 60 folders

## 📦 Danh sách Collections

| # | Collection | Endpoints | Mô tả |
|---|-----------|-----------|-------|
| 1 | **Authentication API** | 14 | Register, login, OAuth, OTP, password reset |
| 2 | **Jobs API** | 16 | Job postings management |
| 3 | **Candidates API** | 25+ | Candidate profiles, CV, resume |
| 4 | **Employer Profile API** | 20 | Employer profiles, verification |
| 5 | **Admin Complete API** | 35 | Full system administration |
| 6 | **Notifications API** | 10 | User notifications management |
| 7 | **Saved Jobs API** | 8 | Job bookmarking features |
| 8 | **Users API** | 17 | User account management |
| 9 | **Skills Public API** | 6 | Public skills browsing |
| 10 | **Industries Public API** | 4 | Public industries browsing |
| 11 | **Admin Skills Management** | 40+ | Admin skills CRUD & hierarchy |
| 12 | **Admin Industries Management** | 20+ | Admin industries CRUD |
| 13 | **AI CV Analysis** | 15+ | AI-powered CV analysis & roadmaps |

## 🎯 Quick Start

### 1. Import vào Postman
```
File → Import → Chọn tất cả .json files trong thư mục này
```

### 2. Setup Environment
Tạo environment với các biến:
```
base_url: http://localhost:5000/api
admin_token: <JWT token>
employer_token: <JWT token>
candidate_token: <JWT token>
```

### 3. Test Flow
1. **Authentication API** → Login và lấy token
2. **Users/Candidates/Employer API** → Test profile features
3. **Jobs API** → Test job management
4. **Admin API** → Test admin operations

## 📚 Tài liệu chi tiết

Xem file `POSTMAN_COLLECTIONS_SUMMARY.md` để biết:
- Chi tiết từng collection
- Cấu trúc folders
- Environment variables
- Request examples

## ✅ Status: HOÀN THÀNH

Tất cả 42 route files đã được phân tích và tạo Postman collections tương ứng.
