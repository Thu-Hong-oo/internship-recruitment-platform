# Industry Data Seeding

## 📦 Files

1. **`data/industries-seed.json`** - JSON data chứa 36 ngành nghề
2. **`scripts/seed-industries.js`** - Script seed trực tiếp vào database
3. **`scripts/seed-industries-api.js`** - Script seed qua API endpoint

## 🎯 Ngành nghề có sẵn (36 industries)

### 💻 Công nghệ (6)

- `tech-software` - Công nghệ thông tin - Phần mềm
- `tech-hardware` - Công nghệ thông tin - Phần cứng
- `tech-networking` - Mạng máy tính - Viễn thông

### 🏦 Tài chính (3)

- `finance-banking` - Tài chính - Ngân hàng
- `finance-insurance` - Bảo hiểm
- `finance-accounting` - Kế toán - Kiểm toán

### 🎓 Giáo dục (2)

- `education-training` - Giáo dục - Đào tạo
- `education-elearning` - E-learning - Giáo dục trực tuyến

### 🏥 Y tế (2)

- `healthcare-medical` - Y tế - Chăm sóc sức khỏe
- `healthcare-pharma` - Dược phẩm - Y dược

### 🛒 Bán lẻ (2)

- `retail-ecommerce` - Bán lẻ - Thương mại điện tử
- `retail-fmcg` - Hàng tiêu dùng nhanh (FMCG)

### 🏭 Sản xuất (3)

- `manufacturing-auto` - Sản xuất - Ô tô
- `manufacturing-electronics` - Sản xuất - Điện tử
- `manufacturing-textile` - Sản xuất - Dệt may

### 🏗️ Xây dựng (2)

- `construction-architecture` - Xây dựng - Kiến trúc
- `construction-realestate` - Bất động sản

### 📢 Truyền thông (2)

- `media-marketing` - Truyền thông - Marketing
- `media-entertainment` - Giải trí - Truyền hình

### 🏨 Du lịch (2)

- `hospitality-tourism` - Du lịch - Khách sạn
- `hospitality-fb` - Ẩm thực - F&B

### 🚚 Logistics (2)

- `logistics-transport` - Logistics - Vận tải
- `logistics-delivery` - Giao hàng - Chuyển phát

### ⚡ Năng lượng (2)

- `energy-oil-gas` - Năng lượng - Dầu khí
- `energy-renewable` - Năng lượng tái tạo

### 🌾 Nông nghiệp (2)

- `agriculture-farming` - Nông nghiệp - Trồng trọt
- `agriculture-agritech` - Công nghệ nông nghiệp

### 💼 Tư vấn (2)

- `consulting-management` - Tư vấn - Quản lý
- `consulting-hr` - Tư vấn - Nhân sự

### ⚖️ Khác (6)

- `legal-law` - Luật - Pháp lý
- `government-public` - Chính phủ - Công quyền
- `ngo-nonprofit` - Phi lợi nhuận - NGO
- `sports-fitness` - Thể thao - Thể hình
- `beauty-wellness` - Làm đẹp - Spa
- `gaming-esports` - Game - Esports

## 🚀 Cách sử dụng

### Phương án 1: Seed trực tiếp vào database (Khuyến nghị)

```bash
# Chạy script
node scripts/seed-industries.js
```

**Ưu điểm:**

- ✅ Nhanh, không cần authentication
- ✅ Có thể clear dữ liệu cũ tự động
- ✅ Phù hợp cho development

### Phương án 2: Seed qua API

```bash
# Cần có JWT token của admin
ADMIN_TOKEN=your_jwt_token node scripts/seed-industries-api.js

# Hoặc set trong .env
echo "ADMIN_TOKEN=your_jwt_token" >> .env
node scripts/seed-industries-api.js
```

**Ưu điểm:**

- ✅ Trải qua validation của API
- ✅ Phù hợp cho production
- ✅ Test API endpoint cùng lúc

### Phương án 3: Import thủ công qua API

```bash
# POST request với một industry
curl -X POST http://localhost:3000/api/industries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "tech-software",
    "name": "Công nghệ thông tin - Phần mềm",
    "nameEn": "Information Technology - Software",
    "description": "Phát triển phần mềm, ứng dụng web, mobile",
    "descriptionEn": "Software development, web and mobile apps",
    "icon": "💻",
    "visible": true
  }'
```

### Phương án 4: Import trực tiếp vào MongoDB

```bash
# Sử dụng mongoimport
mongoimport --db internship-platform \
  --collection industries \
  --file data/industries-seed.json \
  --jsonArray
```

## 📋 JSON Data Structure

Mỗi industry có cấu trúc:

```json
{
  "code": "tech-software", // Unique code (slug)
  "name": "Công nghệ thông tin", // Vietnamese name
  "nameEn": "Information Technology", // English name
  "description": "Mô tả tiếng Việt", // Vietnamese description
  "descriptionEn": "English desc", // English description
  "icon": "💻", // Icon/Emoji
  "visible": true, // Show/hide in UI
  "parentIndustry": null // For nested industries (future)
}
```

## 🧪 Kiểm tra sau khi seed

```bash
# Kiểm tra số lượng
curl http://localhost:3000/api/industries

# Kiểm tra một industry cụ thể
curl http://localhost:3000/api/industries/tech-software

# Kiểm tra với multilingual
curl http://localhost:3000/api/industries/tech-software?lang=en

# Tìm kiếm
curl "http://localhost:3000/api/industries?search=công nghệ"
```

## 🔧 Troubleshooting

### Lỗi: Cannot find module

```bash
npm install axios
```

### Lỗi: ADMIN_TOKEN not provided

```bash
# Lấy token bằng cách login với admin account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Copy token từ response và dùng
ADMIN_TOKEN=eyJhbGc... node scripts/seed-industries-api.js
```

### Lỗi: Duplicate key error

```bash
# Xóa dữ liệu cũ trước
# Trong MongoDB Shell:
use internship-platform
db.industries.deleteMany({})

# Hoặc sửa script để không xóa dữ liệu cũ
```

## 📝 Tùy chỉnh dữ liệu

1. Mở file `data/industries-seed.json`
2. Thêm/sửa/xóa industries theo format có sẵn
3. Chạy lại script seed

## 🎨 Thêm icon

Có thể dùng:

- Emoji: `💻`, `🏦`, `🎓`, `🏥`...
- URL: `https://cdn.example.com/icon.png`
- Class: `fa-solid fa-laptop` (nếu dùng Font Awesome)

## 📊 Statistics

- Total industries: **36**
- Categories: **13** (Tech, Finance, Education, Healthcare, ...)
- Multilingual support: **Vietnamese + English**
- All visible by default: **Yes**
