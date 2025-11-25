# ⚠️ Cần Restart Server Sau Khi Fix Code

## 🔴 Vấn Đề Hiện Tại

**Log vẫn hiển thị:**
```
❌ Gemini parsing error: ... gemini-2.0-flash-exp ...
```

**Nguyên nhân:**
- ✅ Code đã được fix để đọc model name từ `.env` động
- ❌ **Server chưa restart** → Code cũ vẫn đang chạy
- ❌ Model cũ (`gemini-2.0-flash-exp`) vẫn được cache trong memory

---

## ✅ Giải Pháp: Restart Server

### **1. Dừng Server Hiện Tại**

**Nếu đang chạy với `npm start` hoặc `node`:**
```bash
# Nhấn Ctrl+C để dừng server
```

**Nếu đang chạy với PM2:**
```bash
pm2 stop all
# hoặc
pm2 restart all
```

**Nếu đang chạy với Docker:**
```bash
docker-compose restart
# hoặc
docker restart <container-name>
```

### **2. Khởi Động Lại Server**

```bash
# Vào thư mục backend
cd backend

# Khởi động lại
npm start
# hoặc
node server.js
# hoặc
npm run dev
```

### **3. Kiểm Tra Log**

Sau khi restart, upload CV lại và kiểm tra log:

**Log mong đợi:**
```
🔍 Reading GEMINI_MODEL from env: gemini-1.5-flash
🔄 Creating new Gemini model: gemini-1.5-flash
✅ Gemini model initialized successfully: gemini-1.5-flash
🎯 Using Gemini model: gemini-1.5-flash
🎯 GEMINI_MODEL from env: gemini-1.5-flash
```

**Nếu vẫn thấy `gemini-2.0-flash-exp`:**
- ❌ Server chưa restart đúng cách
- ❌ Code mới chưa được load
- ❌ Có thể có cache ở đâu đó

---

## 🔍 Debug Steps

### **1. Kiểm Tra Code Mới Đã Được Load**

**Tìm trong log:**
```
🔍 Reading GEMINI_MODEL from env: ...
```

**Nếu KHÔNG thấy log này:**
- ❌ Code mới chưa được load
- ✅ Cần restart server

### **2. Kiểm Tra .env File**

```bash
# Kiểm tra GEMINI_MODEL trong .env
cat backend/.env | grep GEMINI_MODEL

# Kết quả mong đợi:
GEMINI_MODEL=gemini-1.5-flash
```

### **3. Kiểm Tra Process**

**Windows:**
```powershell
# Kiểm tra process Node.js đang chạy
Get-Process node

# Kill tất cả process Node.js (nếu cần)
Stop-Process -Name node -Force
```

**Linux/Mac:**
```bash
# Kiểm tra process
ps aux | grep node

# Kill process (nếu cần)
pkill -f node
```

---

## 📝 Checklist

Trước khi test lại:

- [ ] ✅ Đã thay đổi `GEMINI_MODEL=gemini-1.5-flash` trong `.env`
- [ ] ✅ Đã **restart server** (không chỉ reload code)
- [ ] ✅ Log hiển thị `🔍 Reading GEMINI_MODEL from env: gemini-1.5-flash`
- [ ] ✅ Log hiển thị `✅ Gemini model initialized successfully: gemini-1.5-flash`
- [ ] ✅ Upload CV và kiểm tra log không còn `gemini-2.0-flash-exp`

---

## 🎯 Kết Quả Mong Đợi Sau Khi Restart

**Log khi upload CV:**
```
📝 Starting resume parsing with Gemini
🔍 Reading GEMINI_MODEL from env: gemini-1.5-flash
🔄 Creating new Gemini model: gemini-1.5-flash
✅ Gemini model initialized successfully: gemini-1.5-flash
🤖 Calling Gemini API...
🎯 Using Gemini model: gemini-1.5-flash
🎯 GEMINI_MODEL from env: gemini-1.5-flash
```

**KHÔNG còn thấy:**
- ❌ `gemini-2.0-flash-exp` trong error message
- ❌ Model cũ trong URL error

---

## ⚠️ Lưu Ý

1. **Hot Reload KHÔNG đủ**: Nếu dùng `nodemon` hoặc `npm run dev`, vẫn cần đảm bảo server đã restart hoàn toàn
2. **Cache có thể còn**: Nếu vẫn thấy model cũ, thử:
   - Clear cache của Node.js
   - Restart lại hoàn toàn
   - Kiểm tra xem có nhiều instance server đang chạy không
3. **.env phải được load**: Đảm bảo `require('dotenv').config()` được gọi trước khi đọc `process.env.GEMINI_MODEL`

