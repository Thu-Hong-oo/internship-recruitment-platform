# Job Validation Guide

## 🚨 **Lỗi Validation thường gặp khi tạo Job**

### **1. `requirements.skills` - Sai format**
#### ❌ **SAI:**
```json
"requirements": {
  "skills": [
    { "skillId": "{{skill_id}}", "level": "required" },
    { "skillId": "{{skill_id_2}}", "level": "preferred" }
  ]
}
```

#### ✅ **ĐÚNG:**
```json
"requirements": {
  "skills": ["JavaScript", "React", "Communication"]
}
```

### **2. `benefits` - Sai kiểu dữ liệu**
#### ❌ **SAI:**
```json
"benefits": ["Flexible working hours", "Remote options"]
```

#### ✅ **ĐÚNG:**
```json
"benefits": "Flexible working hours, Remote options, Health insurance"
```

### **3. `subCategories` - Đã được sửa**
#### ✅ **ĐÚNG:**
```json
"subCategories": ["web-development", "frontend"]  // Tối đa 50 ký tự
```

## 📋 **Request Body mẫu (ĐÚNG)**

```json
{
  "title": "Frontend Developer Intern",
  "jobType": "internship",
  "category": "tech",
  "subCategories": ["web-development", "frontend"],
  "internship": {
    "type": "summer",
    "duration": 3,
    "startDate": "2024-06-01",
    "endDate": "2024-09-01",
    "isPaid": true,
    "stipend": {
      "amount": 8000000,
      "currency": "VND",
      "period": "month"
    }
  },
  "requirements": {
    "yearOfStudy": ["2nd-year", "3rd-year", "4th-year"],
    "majors": ["Computer Science", "Information Technology"],
    "skills": ["JavaScript", "React", "HTML", "CSS"],
    "experienceRequired": false,
    "level": "intern"
  },
  "description": "We are looking for a talented Frontend Developer Intern to join our team...",
  "responsibilities": [
    "Develop UI using React",
    "Collaborate with design team",
    "Write clean and maintainable code"
  ],
  "benefits": "Flexible working hours, Remote options, Health insurance, Learning opportunities",
  "location": {
    "type": "hybrid",
    "city": "Ho Chi Minh",
    "district": "District 1",
    "country": "VN"
  },
  "status": "active"
}
```

## 🔧 **Cách sửa từng lỗi**

### **1. Sửa `requirements.skills`:**
```javascript
// ❌ SAI - Objects với skillId và level
"skills": [
  { "skillId": "skill123", "level": "required" },
  { "skillId": "skill456", "level": "preferred" }
]

// ✅ ĐÚNG - Array of strings
"skills": ["JavaScript", "React", "HTML", "CSS"]
```

### **2. Sửa `benefits`:**
```javascript
// ❌ SAI - Array of strings
"benefits": ["Flexible working hours", "Remote options"]

// ✅ ĐÚNG - Single string
"benefits": "Flexible working hours, Remote options, Health insurance"
```

### **3. `subCategories` - Đã được sửa:**
```javascript
// ✅ ĐÚNG - Tối đa 50 ký tự
"subCategories": ["web-development", "frontend"]
```

## 📝 **Tất cả các enum values**

### **Job Category:**
```javascript
"tech", "business", "marketing", "design", "data", "finance", 
"hr", "sales", "education", "healthcare", "manufacturing", 
"retail", "consulting", "other"
```

### **Job Type:**
```javascript
"internship", "part-time", "full-time", "contract", "freelance"
```

### **Internship Type:**
```javascript
"summer", "winter", "semester", "year-round"
```

### **Year of Study:**
```javascript
"1st-year", "2nd-year", "3rd-year", "4th-year", "graduate", "any"
```

### **Experience Level:**
```javascript
"intern", "junior", "mid-level", "senior", "lead", "manager", "any"
```

### **Location Type:**
```javascript
"onsite", "remote", "hybrid"
```

### **Job Status:**
```javascript
"draft", "active", "closed", "filled"
```

## 🎯 **Ví dụ subCategories phổ biến**

| Mô tả | subCategory (≤50 ký tự) |
|-------|----------------------|
| Web Development | `"web-development"` |
| Frontend | `"frontend"` |
| Backend | `"backend"` |
| Mobile | `"mobile"` |
| Data Science | `"data-science"` |
| AI/ML | `"artificial-intelligence"` |
| DevOps | `"devops"` |
| UI/UX | `"ui-ux"` |
| Marketing | `"marketing"` |
| Sales | `"sales"` |

## 💡 **Lưu ý quan trọng**

1. **`requirements.skills`** phải là array of strings, không phải objects
2. **`benefits`** phải là string, không phải array
3. **`subCategories`** mỗi item tối đa 50 ký tự
4. **`category`** phải nằm trong enum values
5. **`jobType`** phải nằm trong enum values
6. **`status`** mặc định là `"draft"`, cần set `"active"` để hiển thị

## 🚀 **Test với Postman**

Sử dụng request body mẫu ở trên để test tạo job thành công!
