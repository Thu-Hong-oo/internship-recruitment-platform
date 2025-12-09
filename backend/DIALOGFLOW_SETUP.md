# 🤖 Dialogflow Setup Guide

Hướng dẫn thiết lập Dialogflow CX cho tính năng Natural Language Navigation.

## 📋 Tổng quan

Tính năng này cho phép người dùng nhập câu tự nhiên bằng tiếng Việt và hệ thống tự động hiểu và điều hướng đến trang phù hợp.

**Ví dụ:**
- "tìm việc IT ở Sài Gòn" → `/search?city=Ho+Chi+Minh&q=IT`
- "tạo CV online" → `/my-cv/templates`
- "về trang chủ" → `/`

## 🚀 Bước 1: Tạo Dialogflow Agent

### 1.1. Truy cập Dialogflow Console

1. Vào https://dialogflow.cloud.google.com/
2. Đăng nhập với Google Cloud account
3. Chọn hoặc tạo Google Cloud Project

### 1.2. Tạo Agent mới

1. Click **"Create Agent"**
2. Điền thông tin:
   - **Agent Name**: `internship-platform-navigation`
   - **Default Language**: `Vietnamese (vi)`
   - **Location**: `global` (hoặc `asia-southeast1` cho Việt Nam)
   - **Time Zone**: `Asia/Ho_Chi_Minh`
3. Click **"Create"**

### 1.3. Lưu thông tin Agent

Sau khi tạo, lưu lại các thông tin sau:

- **Project ID**: Tìm trong URL hoặc Settings
- **Agent ID**: Tìm trong Agent Settings → General → Agent ID
- **Location**: `global` hoặc region bạn chọn

## 🎯 Bước 2: Tạo Intents

### 2.1. Intent: `navigate.home`

**Training Phrases (15-20 câu):**
```
về trang chủ
đi đến trang chủ
quay lại trang chủ
về home
trang chính
home page
về lại trang chủ
đi tới trang chủ
mở trang chủ
```

**Parameters:** Không có

### 2.2. Intent: `cv.create`

**Training Phrases:**
```
tạo CV
tạo CV online
làm CV
tạo hồ sơ xin việc
viết CV đẹp
tạo resume
làm hồ sơ
tạo CV mới
```

**Parameters:** Không có

### 2.3. Intent: `job.search`

**Training Phrases:**
```
tìm việc
tìm việc làm
tìm công việc
tìm kiếm việc làm
việc làm IT
tuyển dụng
tìm job
```

**Parameters:** Không có (general search)

### 2.4. Intent: `job.search.location`

**Training Phrases:**
```
tìm việc ở Sài Gòn
tìm việc tại Hồ Chí Minh
tìm job ở Hà Nội
việc làm tại Đà Nẵng
tuyển dụng ở Cần Thơ
tìm việc ở TPHCM
việc làm ở HCM
```

**Parameters:**
- `location` (Entity: `@Location`) - Required

### 2.5. Intent: `job.search.skills`

**Training Phrases:**
```
tìm việc React
việc làm Node.js
tuyển dụng Python
tìm job JavaScript
việc IT
```

**Parameters:**
- `job_title` hoặc `skills` (Entity: `@sys.any`) - Optional

### 2.6. Intent: `profile.view`

**Training Phrases:**
```
xem hồ sơ của tôi
xem profile
thông tin cá nhân
tài khoản của tôi
xem thông tin tài khoản
```

**Parameters:** Không có

### 2.7. Intent: `applied-jobs.view`

**Training Phrases:**
```
xem việc đã ứng tuyển
việc tôi đã apply
danh sách ứng tuyển
```

**Parameters:** Không có

## 🗺️ Bước 3: Tạo Custom Entities

### 3.1. Entity: `Location`

**Values và Synonyms:**

| Value (Canonical) | Synonyms |
|-------------------|----------|
| Ho Chi Minh | sài gòn, sai gon, saigon, tphcm, tp.hcm, tp hcm, hcm, thành phố hồ chí minh, tp. hồ chí minh |
| Ha Noi | hà nội, hanoi, hn, thủ đô, thu do, thành phố hà nội, tp hà nội |
| Da Nang | đà nẵng, danang, dn, thành phố đà nẵng |
| Can Tho | cần thơ, cantho, ct |
| Hai Phong | hải phòng, haiphong, hp |

**Cách tạo:**
1. Vào **Entities** → **Create Entity**
2. Tên: `Location`
3. Add từng value và synonyms
4. Save

### 3.2. Entity: `JobTitle` (Optional)

Các job title phổ biến:
- Developer, Lập trình viên
- Designer, Thiết kế
- Manager, Quản lý
- etc.

## 🔑 Bước 4: Cấu hình Backend

### 4.1. Cài đặt Package

```bash
cd backend
npm install @google-cloud/dialogflow-cx
```

### 4.2. Tạo Service Account

1. Vào Google Cloud Console → IAM & Admin → Service Accounts
2. Click **Create Service Account**
3. Điền:
   - **Name**: `dialogflow-service`
   - **Description**: `Service account for Dialogflow integration`
4. Click **Create and Continue**
5. Grant role: **Dialogflow API Client**
6. Click **Done**

### 4.3. Tạo Key File

1. Click vào service account vừa tạo
2. Vào tab **Keys**
3. Click **Add Key** → **Create new key**
4. Chọn **JSON**
5. Download file và lưu vào `backend/dialogflow-key.json` (thêm vào `.gitignore`)

### 4.4. Cấu hình Environment Variables

Thêm vào `backend/.env`:

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=your-project-id
DIALOGFLOW_LOCATION=global
DIALOGFLOW_AGENT_ID=your-agent-id
DIALOGFLOW_LANGUAGE_CODE=vi
GOOGLE_APPLICATION_CREDENTIALS=./dialogflow-key.json
```

### 4.5. Thêm vào .gitignore

```
backend/dialogflow-key.json
```

## 🧪 Bước 5: Test

### 5.1. Test Backend API

```bash
# Start server
npm run dev

# Test với curl
curl -X POST http://localhost:3000/api/ai/navigate-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "input": "tôi muốn tìm các job ở sài gòn",
    "frontend": "fe"
  }'
```

### 5.2. Test Frontend

1. Thêm component vào header hoặc dashboard
2. Nhập: "tìm việc IT ở Sài Gòn"
3. Kiểm tra navigation

## 📊 Kết quả mong đợi

| Input | Intent | URL |
|-------|--------|-----|
| "về trang chủ" | `navigate.home` | `/` |
| "tạo CV online" | `cv.create` | `/my-cv/templates` |
| "tìm việc ở Sài Gòn" | `job.search.location` | `/search?city=Ho+Chi+Minh` |
| "tìm việc IT ở Hà Nội lương 20 triệu" | `job.search.location` | `/search?city=Ha+Noi&q=IT&salaryMin=20000000` |

## 🔧 Troubleshooting

### Lỗi: "Dialogflow client not initialized"

- Kiểm tra `GOOGLE_APPLICATION_CREDENTIALS` path
- Kiểm tra service account có quyền Dialogflow API Client
- Kiểm tra Project ID và Agent ID đúng

### Lỗi: "Intent not recognized"

- Kiểm tra training phrases đã đủ (15-20 câu)
- Kiểm tra entity mapping
- Thử với fallback rule-based

### Lỗi: "Location not normalized"

- Kiểm tra Location entity đã có synonyms
- Kiểm tra `locationMap` trong `dialogflowIntentService.js`

## 💰 Chi phí

- **Dialogflow ES**: Miễn phí đến 180 phút session/tháng
- **Dialogflow CX**: $0.002/lần request text (rất rẻ)

Với 1000 requests/tháng ≈ $2

## 🚀 Mở rộng

1. Thêm voice input (Web Speech API)
2. Thêm context/session management
3. Thêm multi-turn conversations
4. Tích hợp với chatbot

## 📚 Tài liệu tham khảo

- [Dialogflow CX Documentation](https://cloud.google.com/dialogflow/cx/docs)
- [Dialogflow CX Node.js Client](https://googleapis.dev/nodejs/dialogflow-cx/latest/)


