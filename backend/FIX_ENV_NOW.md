# ⚠️ URGENT: File .env Vẫn Có gemini-2.0-flash-exp

## 🔴 Vấn Đề Đã Xác Định

**Script check đã xác nhận:**
```
✅ Found GEMINI_MODEL: gemini-2.0-flash-exp
```

**File `.env` vẫn chưa được cập nhật!**

---

## ✅ Cách Fix NGAY LẬP TỨC

### **Bước 1: Mở File .env**

**Windows PowerShell:**
```powershell
cd backend
notepad .env
```

**Hoặc dùng VS Code:**
```powershell
cd backend
code .env
```

### **Bước 2: Tìm Dòng Này**

Tìm dòng:
```env
GEMINI_MODEL=gemini-2.0-flash-exp
```

### **Bước 3: Đổi Thành**

```env
GEMINI_MODEL=gemini-1.5-flash
```

### **Bước 4: Lưu File**

- **Notepad:** `Ctrl+S`
- **VS Code:** `Ctrl+S`

### **Bước 5: Kiểm Tra**

```powershell
cd backend
Get-Content .env | Select-String -Pattern "GEMINI_MODEL"
```

**Kết quả phải là:**
```
GEMINI_MODEL=gemini-1.5-flash
```

---

## 🎯 Sau Khi Fix

1. ✅ **KHÔNG CẦN RESTART SERVER** (code đã hỗ trợ hot-reload)
2. ✅ Upload CV lại
3. ✅ Kiểm tra log:

**Log mong đợi:**
```
🔍 [DEBUG] Raw GEMINI_MODEL from process.env: "gemini-1.5-flash"
🔍 [DEBUG] Processed model name: "gemini-1.5-flash"
🔄 Creating new Gemini model: gemini-1.5-flash
✅ Gemini model initialized successfully: gemini-1.5-flash
```

---

## 🔍 Nếu Vẫn Không Được

### **Kiểm Tra Lại:**

1. **File có được lưu không?**
   ```powershell
   Get-Content backend\.env | Select-String "GEMINI_MODEL"
   ```

2. **Có khoảng trắng thừa không?**
   ```env
   # ❌ SAI
   GEMINI_MODEL = gemini-1.5-flash
   GEMINI_MODEL= gemini-1.5-flash
   GEMINI_MODEL =gemini-1.5-flash
   
   # ✅ ĐÚNG
   GEMINI_MODEL=gemini-1.5-flash
   ```

3. **Có dấu ngoặc kép không?**
   ```env
   # ❌ SAI
   GEMINI_MODEL="gemini-1.5-flash"
   GEMINI_MODEL='gemini-1.5-flash'
   
   # ✅ ĐÚNG
   GEMINI_MODEL=gemini-1.5-flash
   ```

4. **Có comment trên cùng dòng không?**
   ```env
   # ❌ SAI
   GEMINI_MODEL=gemini-1.5-flash # This is the model
   
   # ✅ ĐÚNG
   GEMINI_MODEL=gemini-1.5-flash
   ```

---

## 🚀 Quick Fix Command (PowerShell)

Nếu bạn muốn fix nhanh bằng command:

```powershell
cd backend
(Get-Content .env) -replace 'GEMINI_MODEL=gemini-2.0-flash-exp', 'GEMINI_MODEL=gemini-1.5-flash' | Set-Content .env
```

Sau đó kiểm tra:
```powershell
Get-Content .env | Select-String "GEMINI_MODEL"
```

---

## ✅ Checklist

- [ ] ✅ Đã mở file `backend/.env`
- [ ] ✅ Đã tìm thấy `GEMINI_MODEL=gemini-2.0-flash-exp`
- [ ] ✅ Đã đổi thành `GEMINI_MODEL=gemini-1.5-flash`
- [ ] ✅ Đã lưu file (Ctrl+S)
- [ ] ✅ Đã kiểm tra bằng command
- [ ] ✅ Upload CV và kiểm tra log

