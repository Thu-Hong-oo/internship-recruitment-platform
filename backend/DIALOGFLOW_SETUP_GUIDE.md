# 🤖 Hướng Dẫn Setup Dialogflow CX - Chi Tiết Từng Bước

## 📋 Tổng Quan

**Service hiện tại sử dụng Dialogflow:**

- ✅ **Navigation Intent Recognition** (`dialogflowIntentService.js`)
  - Nhận diện intent từ user input tiếng Việt
  - Extract parameters (location, keyword, salary, etc.)
  - Fallback về rule-based nếu Dialogflow không config

**Trạng thái hiện tại:**

- ✅ Package đã cài: `@google-cloud/dialogflow-cx@^5.5.0`
- ✅ Code đã tích hợp sẵn
- ❌ Chưa có config → Đang dùng rule-based fallback

---

## 🚀 Bước 1: Tạo Google Cloud Project

### 1.1. Truy cập Google Cloud Console

1. Vào https://console.cloud.google.com/
2. Đăng nhập với Google account
3. Nếu chưa có project, click **"Select a project"** → **"New Project"**

### 1.2. Tạo Project mới (hoặc dùng project có sẵn)

1. Click **"New Project"**
2. Điền thông tin:
   - **Project Name**: `internship-platform` (hoặc tên bạn muốn)
   - **Organization**: (để trống nếu không có)
   - **Location**: (để trống)
3. Click **"Create"**
4. Chờ vài giây để project được tạo

### 1.3. Lưu Project ID

1. Sau khi tạo, project sẽ được chọn tự động
2. Lưu lại **Project ID** (ví dụ: `internship-platform-123456`)
   - Tìm ở góc trên bên trái, bên cạnh tên project
   - Hoặc vào **IAM & Admin** → **Settings**

---

## 🎯 Bước 2: Tạo Dialogflow Agent

### 2.1. Truy cập Dialogflow Console

1. Vào https://dialogflow.cloud.google.com/
2. Đăng nhập với cùng Google account
3. Chọn project vừa tạo ở bước 1

### 2.2. Enable Dialogflow API (nếu chưa enable)

1. Nếu thấy thông báo "Enable API", click **"Enable"**
2. Hoặc vào https://console.cloud.google.com/apis/library/dialogflow.googleapis.com
3. Click **"Enable"**

### 2.3. Tạo Agent mới

1. Trong Dialogflow Console, click **"Create Agent"** (hoặc **"Create"**)
2. Điền thông tin:
   - **Agent Name**: `internship-platform-navigation`
   - **Default Language**: Chọn **Vietnamese (vi)**
   - **Location**: Chọn **global** (hoặc `asia-southeast1` cho Việt Nam)
   - **Time Zone**: Chọn **Asia/Ho_Chi_Minh**
3. Click **"Create"**

### 2.4. Lưu Agent ID

1. Sau khi tạo agent, vào **Settings** (icon ⚙️ ở sidebar)
2. Vào tab **General**
3. Tìm **Agent ID** (ví dụ: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
4. **Lưu lại Agent ID này** (sẽ cần cho config)

---

## 🗺️ Bước 3: Tạo Custom Entities

### 3.1. Tạo Entity: `Location`

1. Vào **Entities** trong sidebar
2. Click **"Create Entity"**
3. Điền:
   - **Entity Name**: `Location`
   - **Entity Type**: `@Location`
4. Thêm các values và synonyms:

| Value (Canonical) | Synonyms (mỗi synonym một dòng)                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Ho Chi Minh       | sài gòn<br>sai gon<br>saigon<br>tphcm<br>tp.hcm<br>tp hcm<br>hcm<br>thành phố hồ chí minh<br>tp. hồ chí minh<br>tp hồ chí minh |
| Ha Noi            | hà nội<br>hanoi<br>hn<br>thủ đô<br>thu do<br>thành phố hà nội<br>tp hà nội                                                     |
| Da Nang           | đà nẵng<br>danang<br>dn<br>thành phố đà nẵng                                                                                   |
| Can Tho           | cần thơ<br>cantho<br>ct                                                                                                        |
| Hai Phong         | hải phòng<br>haiphong<br>hp                                                                                                    |

5. Click **"Save"**

---

## 🎯 Bước 4: Tạo Intents

### 4.1. Intent: `navigate.home`

1. Vào **Intents** → **Create Intent**
2. **Intent Name**: `navigate.home`
3. **Training Phrases** (thêm 15-20 câu):

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
về trang đầu
quay về trang chủ
đi home
về lại home
trang chủ
home
```

4. **Parameters**: Không cần thêm
5. Click **"Save"**

### 4.2. Intent: `cv.create`

1. **Create Intent**
2. **Intent Name**: `cv.create`
3. **Training Phrases**:

```
tạo CV
tạo CV online
làm CV
tạo hồ sơ xin việc
viết CV đẹp
tạo resume
làm hồ sơ
tạo CV mới
tạo CV của tôi
làm CV online
tạo hồ sơ cá nhân
viết CV
tạo CV xin việc
```

4. Click **"Save"**

### 4.3. Intent: `job.search`

1. **Create Intent**
2. **Intent Name**: `job.search`
3. **Training Phrases**:

```
tìm việc
tìm việc làm
tìm công việc
tìm kiếm việc làm
việc làm
tuyển dụng
tìm job
tìm kiếm job
xem việc làm
danh sách việc làm
```

4. Click **"Save"**

### 4.4. Intent: `job.search.location` (QUAN TRỌNG)

1. **Create Intent**
2. **Intent Name**: `job.search.location`
3. **Training Phrases** (thêm nhiều biến thể):

```
tìm việc ở Sài Gòn
tìm việc tại Hồ Chí Minh
tìm job ở Hà Nội
việc làm tại Đà Nẵng
tuyển dụng ở Cần Thơ
tìm việc ở TPHCM
việc làm ở HCM
tìm việc ở thành phố Hồ Chí Minh
tìm việc tại Hà Nội
tìm job ở HCM
việc làm tại Sài Gòn
tuyển dụng ở Hà Nội
tìm việc làm ở Đà Nẵng
cho tôi xem việc làm ở Sài Gòn
hiển thị việc làm tại Hồ Chí Minh
muốn tìm việc ở Hà Nội
```

4. **Parameters**:

   - Click **"Add Parameter"**
   - **Parameter Name**: `location`
   - **Entity**: Chọn `@Location` (entity vừa tạo)
   - **Required**: ✅ Check
   - **Value**: `$Location` (tự động fill khi có entity)

5. Click **"Save"**

### 4.5. Intent: `job.search.location.keyword` (Nâng cao)

1. **Create Intent**
2. **Intent Name**: `job.search.location.keyword`
3. **Training Phrases**:

```
tìm việc IT ở Sài Gòn
tìm việc lập trình viên tại Hà Nội
tìm job developer ở Đà Nẵng
việc làm marketing tại Hồ Chí Minh
tuyển dụng sales ở Cần Thơ
tìm việc React ở Sài Gòn
tìm việc Node.js tại Hà Nội
cho tôi xem việc làm IT ở Sài Gòn
muốn tìm việc lập trình tại HCM
```

4. **Parameters**:

   - `location` (Entity: `@Location`, Required)
   - `keyword` (Entity: `@sys.any`, Optional) - hoặc tạo custom entity `JobTitle`

5. Click **"Save"**

### 4.6. Intent: `profile.view`

1. **Create Intent**
2. **Intent Name**: `profile.view`
3. **Training Phrases**:

```
xem hồ sơ của tôi
xem profile
thông tin cá nhân
tài khoản của tôi
xem thông tin tài khoản
profile của tôi
hồ sơ cá nhân
thông tin tôi
```

4. Click **"Save"**

---

## 🔑 Bước 5: Tạo Service Account

### 5.1. Tạo Service Account

1. Vào https://console.cloud.google.com/iam-admin/serviceaccounts
2. Chọn project của bạn
3. Click **"Create Service Account"**
4. Điền:
   - **Service account name**: `dialogflow-service`
   - **Service account ID**: (tự động fill)
   - **Description**: `Service account for Dialogflow integration`
5. Click **"Create and Continue"**

### 5.2. Grant Permissions

1. Ở bước **"Grant this service account access to project"**:
   - **Role**: Chọn **Dialogflow API Client**
   - (Nếu không thấy, search "Dialogflow")
2. Click **"Continue"**
3. Click **"Done"**

### 5.3. Tạo Key File

1. Click vào service account vừa tạo (`dialogflow-service`)
2. Vào tab **Keys**
3. Click **"Add Key"** → **"Create new key"**
4. Chọn **JSON**
5. Click **"Create"**
6. File JSON sẽ tự động download về máy

### 5.4. Lưu Key File

1. Đổi tên file thành `dialogflow-key.json` (hoặc giữ nguyên)
2. Di chuyển file vào thư mục `backend/`
3. **QUAN TRỌNG**: Thêm vào `.gitignore` để không commit lên Git:
   ```
   backend/dialogflow-key.json
   ```

---

## ⚙️ Bước 6: Cấu Hình Backend

### 6.1. Kiểm tra Package đã cài

```bash
cd backend
npm list @google-cloud/dialogflow-cx
```

Nếu chưa có, cài đặt:

```bash
npm install @google-cloud/dialogflow-cx
```

### 6.2. Thêm Environment Variables

Mở file `backend/.env` (hoặc tạo mới nếu chưa có):

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=your-project-id-here
DIALOGFLOW_LOCATION=global
DIALOGFLOW_AGENT_ID=your-agent-id-here
DIALOGFLOW_LANGUAGE_CODE=vi
GOOGLE_APPLICATION_CREDENTIALS=./dialogflow-key.json
```

**Thay thế:**

- `your-project-id-here` → Project ID từ bước 1.3
- `your-agent-id-here` → Agent ID từ bước 2.4
- `./dialogflow-key.json` → Đường dẫn đến key file (relative từ thư mục backend)

### 6.3. Kiểm tra File Structure

```
backend/
├── .env                    ← Thêm config ở đây
├── dialogflow-key.json     ← Key file từ bước 5.4
├── package.json
└── src/
    └── services/
        └── ai/
            ├── dialogflowService.js
            └── dialogflowIntentService.js
```

---

## 🧪 Bước 7: Test Setup

### 7.1. Restart Backend Server

```bash
cd backend
npm run dev
```

### 7.2. Kiểm tra Logs

Khi server start, bạn sẽ thấy log:

```
✅ Dialogflow CX client initialized
   Project: your-project-id, Location: global, Agent: your-agent-id
```

Nếu thấy:

```
⚠️ Dialogflow not configured: DIALOGFLOW_PROJECT_ID or DIALOGFLOW_AGENT_ID missing
```

→ Kiểm tra lại `.env` file

### 7.3. Test API

**Option 1: Dùng curl**

```bash
curl -X POST http://localhost:3000/api/ai/navigate-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "input": "tôi muốn tìm các job ở sài gòn",
    "frontend": "fe"
  }'
```

**Option 2: Dùng Postman/Thunder Client**

- Method: `POST`
- URL: `http://localhost:3000/api/ai/navigate-intent`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN`
- Body:

```json
{
  "input": "tìm việc IT ở Sài Gòn",
  "frontend": "fe"
}
```

### 7.4. Kiểm tra Response

Response thành công sẽ có:

```json
{
  "success": true,
  "intent": "job.search.location",
  "route": "/search",
  "url": "/search?location=Thành phố Hồ Chí Minh&q=IT",
  "params": {
    "location": "Thành phố Hồ Chí Minh",
    "q": "IT"
  },
  "confidence": 0.95,
  "method": "dialogflow"
}
```

Nếu `method: "rule-based"` → Dialogflow chưa hoạt động, đang dùng fallback

---

## 🔧 Troubleshooting

### Lỗi: "Dialogflow client not initialized"

**Nguyên nhân:**

- Thiếu environment variables
- Key file không đúng path
- Service account không có quyền

**Giải pháp:**

1. Kiểm tra `.env` file có đầy đủ variables
2. Kiểm tra `GOOGLE_APPLICATION_CREDENTIALS` path đúng
3. Kiểm tra key file có trong thư mục `backend/`
4. Kiểm tra service account có role **Dialogflow API Client**

### Lỗi: "Intent not recognized"

**Nguyên nhân:**

- Training phrases chưa đủ
- Intent name không đúng format
- Entity chưa được map đúng

**Giải pháp:**

1. Thêm nhiều training phrases hơn (15-20 câu)
2. Kiểm tra intent name đúng: `navigate.home`, `job.search.location`, etc.
3. Kiểm tra entity `@Location` đã có synonyms

### Lỗi: "Location not normalized"

**Nguyên nhân:**

- Entity Location chưa có synonyms
- Location value không match với locationMap

**Giải pháp:**

1. Thêm synonyms vào Entity Location
2. Kiểm tra `locationMap` trong `dialogflowIntentService.js`

### Lỗi: "Permission denied"

**Nguyên nhân:**

- Service account không có quyền
- Key file sai

**Giải pháp:**

1. Vào Google Cloud Console → IAM & Admin → Service Accounts
2. Click vào service account → **Permissions**
3. Đảm bảo có role **Dialogflow API Client**
4. Tạo lại key file nếu cần

---

## 📊 So Sánh: Dialogflow vs Rule-based

| Tiêu chí         | Dialogflow                  | Rule-based (hiện tại)              |
| ---------------- | --------------------------- | ---------------------------------- |
| **Setup**        | Cần config                  | ✅ Đã sẵn sàng                     |
| **Chi phí**      | ~$0.002/request             | ✅ Miễn phí                        |
| **Độ chính xác** | ✅ Cao (ML)                 | ⚠️ Trung bình                      |
| **Linh hoạt**    | ✅ Hiểu nhiều cách diễn đạt | ⚠️ Chỉ hiểu patterns đã định nghĩa |
| **Mở rộng**      | ✅ Dễ (thêm intent qua UI)  | ⚠️ Phải code                       |
| **Offline**      | ❌ Cần internet             | ✅ Hoạt động offline               |

---

## 💰 Chi Phí Ước Tính

**Dialogflow CX:**

- $0.002 per text request
- 1,000 requests/tháng = $2
- 10,000 requests/tháng = $20

**Free Tier:**

- Dialogflow ES: Miễn phí 180 phút session/tháng
- Dialogflow CX: Không có free tier (nhưng rất rẻ)

---

## ✅ Checklist Setup

- [ ] Tạo Google Cloud Project
- [ ] Lưu Project ID
- [ ] Enable Dialogflow API
- [ ] Tạo Dialogflow Agent
- [ ] Lưu Agent ID
- [ ] Tạo Entity `Location` với synonyms
- [ ] Tạo các Intents cần thiết
- [ ] Tạo Service Account
- [ ] Grant role Dialogflow API Client
- [ ] Download key file JSON
- [ ] Lưu key file vào `backend/dialogflow-key.json`
- [ ] Thêm vào `.gitignore`
- [ ] Cấu hình `.env` file
- [ ] Restart server
- [ ] Test API
- [ ] Kiểm tra logs

---

## 🚀 Sau Khi Setup

Sau khi setup thành công, hệ thống sẽ:

1. ✅ Tự động dùng Dialogflow khi có config
2. ✅ Fallback về rule-based nếu Dialogflow lỗi
3. ✅ Hiểu nhiều cách diễn đạt khác nhau
4. ✅ Extract parameters chính xác hơn

**Test ngay:**

- "cho tôi xem việc làm lập trình viên tại thành phố Hồ Chí Minh"
- "muốn tìm job developer ở Sài Gòn"
- "hiển thị danh sách việc làm IT"

---

## 📚 Tài Liệu Tham Khảo

- [Dialogflow CX Documentation](https://cloud.google.com/dialogflow/cx/docs)
- [Dialogflow CX Node.js Client](https://googleapis.dev/nodejs/dialogflow-cx/latest/)
- [Dialogflow Pricing](https://cloud.google.com/dialogflow/cx/pricing)

---

## ❓ Cần Hỗ Trợ?

Nếu gặp vấn đề, kiểm tra:

1. Logs của backend server
2. Google Cloud Console → Logs
3. Dialogflow Console → Training → Check intents
