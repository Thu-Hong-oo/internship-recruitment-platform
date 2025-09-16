# Cập nhật CCCD thành tùy chọn

## **Thay đổi trong documentTypes.js:**

### **Trước đây:**

```javascript
REQUIRED: [
  {
    id: 'business-license',
    name: 'Giấy phép đăng ký kinh doanh',
    required: true,
  },
  {
    id: 'tax-certificate',
    name: 'Giấy chứng nhận đăng ký thuế',
    required: true,
  },
  {
    id: 'legal-representative-id',
    name: 'CMND/CCCD người đại diện',
    required: true, // ❌ BẮT BUỘC
  },
];
```

### **Sau khi cập nhật:**

```javascript
REQUIRED: [
  {
    id: 'business-license',
    name: 'Giấy phép đăng ký kinh doanh',
    required: true,
  },
  {
    id: 'tax-certificate',
    name: 'Giấy chứng nhận đăng ký thuế',
    required: true,
  },
  // ✅ Chỉ còn 2 tài liệu bắt buộc
];

OPTIONAL: [
  {
    id: 'legal-representative-id',
    name: 'CMND/CCCD người đại diện',
    required: false, // ✅ TÙY CHỌN
    description: 'CMND/CCCD/Hộ chiếu của người đại diện pháp luật (tùy chọn)',
  },
  // ... other optional documents
];
```

## **Tác động của thay đổi:**

### **1. Verification Progress:**

- **Trước:** Cần 3 tài liệu bắt buộc (100% = 3/3)
- **Sau:** Chỉ cần 2 tài liệu bắt buộc (100% = 2/2)

### **2. API Response:**

```javascript
// GET /api/employers/document-types
{
  "required": [
    {
      "id": "business-license",
      "name": "Giấy phép đăng ký kinh doanh",
      "required": true
    },
    {
      "id": "tax-certificate",
      "name": "Giấy chứng nhận đăng ký thuế",
      "required": true
    }
  ],
  "optional": [
    {
      "id": "legal-representative-id",
      "name": "CMND/CCCD người đại diện",
      "required": false,
      "description": "CMND/CCCD/Hộ chiếu của người đại diện pháp luật (tùy chọn)"
    }
  ]
}
```

### **3. Progress Calculation:**

```javascript
// Trước: Cần 3 tài liệu bắt buộc
progress = (uploadedRequired / 3) * 100;

// Sau: Chỉ cần 2 tài liệu bắt buộc
progress = (uploadedRequired / 2) * 100;
```

## **Lợi ích:**

✅ **Dễ dàng hơn** - Ít tài liệu bắt buộc hơn  
✅ **Linh hoạt hơn** - CCCD có thể upload sau  
✅ **UX tốt hơn** - Không bắt buộc CCCD ngay từ đầu  
✅ **Compliance** - Vẫn giữ validation khi upload CCCD

## **Lưu ý:**

- CCCD vẫn có **validation đầy đủ** khi được upload
- Metadata vẫn **bắt buộc** nếu upload CCCD
- Chỉ thay đổi từ **required** sang **optional**
- Không ảnh hưởng đến logic verification khác

## **Kết luận:**

CCCD/CMND của người đại diện pháp luật giờ đây là **tùy chọn**, giúp quá trình verification **dễ dàng và linh hoạt** hơn! 🎉
