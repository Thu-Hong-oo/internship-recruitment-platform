# Company Validation Guide

## 🚨 **Lỗi Validation thường gặp**

### **Industry Secondary Values**
Khi tạo/cập nhật Company, `industry.secondary` chỉ chấp nhận các giá trị enum sau:

#### ✅ **Giá trị hợp lệ:**
```javascript
"tech", "business", "marketing", "design", "data", "finance", 
"hr", "sales", "education", "healthcare", "manufacturing", 
"retail", "consulting", "telecommunications", "transportation", 
"logistics", "ecommerce", "entertainment", "other"
```

#### ❌ **Giá trị KHÔNG hợp lệ:**
```javascript
"software", "ai", "artificial-intelligence", "machine-learning",
"web-development", "mobile-app", "blockchain", "crypto"
```

## 📋 **Request Body mẫu (ĐÚNG)**

```json
{
  "name": "Tech Solutions Inc",
  "shortDescription": "Leading technology solutions provider",
  "description": "We are a technology company focused on innovative solutions",
  "industry": {
    "primary": "tech",
    "secondary": ["tech", "data"],  // ✅ Sử dụng giá trị hợp lệ
    "tags": ["startup", "innovation"]
  },
  "size": "startup",
  "employeeCount": {
    "min": 10,
    "max": 50
  },
  "companyType": "private",
  "foundedYear": 2020,
  "website": "https://techsolutions.com",
  "location": {
    "type": "onsite",
    "headquarters": {
      "address": "123 Tech Street",
      "city": "Ho Chi Minh",
      "district": "District 1",
      "country": "VN"
    }
  },
  "contact": {
    "email": "contact@techsolutions.com",
    "phone": "0123456789"
  }
}
```

## 🔧 **Cách sửa lỗi**

### **1. Thay thế giá trị không hợp lệ:**
```javascript
// ❌ SAI
"secondary": ["software", "ai"]

// ✅ ĐÚNG  
"secondary": ["tech", "data"]
```

### **2. Mapping các giá trị phổ biến:**
| Giá trị muốn sử dụng | Giá trị enum hợp lệ |
|---------------------|-------------------|
| `"software"` | `"tech"` |
| `"ai"` | `"data"` |
| `"artificial-intelligence"` | `"data"` |
| `"machine-learning"` | `"data"` |
| `"web-development"` | `"tech"` |
| `"mobile-app"` | `"tech"` |
| `"blockchain"` | `"tech"` |
| `"crypto"` | `"finance"` |

## 📝 **Tất cả các enum values**

### **Industry Primary:**
```javascript
"tech", "business", "marketing", "design", "data", "finance", 
"hr", "sales", "education", "healthcare", "manufacturing", 
"retail", "consulting", "other"
```

### **Industry Secondary:**
```javascript
"tech", "business", "marketing", "design", "data", "finance", 
"hr", "sales", "education", "healthcare", "manufacturing", 
"retail", "consulting", "telecommunications", "transportation", 
"logistics", "ecommerce", "entertainment", "other"
```

### **Company Size:**
```javascript
"startup", "small", "medium", "large", "enterprise"
```

### **Company Type:**
```javascript
"private", "public", "nonprofit", "government"
```

## 🎯 **Test với Postman**

Sử dụng request body mẫu ở trên để test tạo company thành công!

## 💡 **Lưu ý**

- `industry.primary` là **bắt buộc**
- `industry.secondary` là **tùy chọn** (array)
- `industry.tags` là **tùy chọn** (array of strings)
- Tất cả giá trị phải nằm trong danh sách enum được định nghĩa
