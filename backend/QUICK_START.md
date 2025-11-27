# 🚀 Quick Start - Learning Resources APIs

## ⚡ BẮT ĐẦU NHANH (5 phút)

### Bước 1: Dev.to API (Không cần setup!)

**Dev.to API hoạt động ngay lập tức, không cần API key!**

```bash
# Không cần làm gì cả!
# Service tự động hoạt động
```

✅ **Done!** Dev.to API đã sẵn sàng.

---

### Bước 2: YouTube API (2 phút)

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới
3. Enable "YouTube Data API v3"
4. Tạo API Key
5. Thêm vào `.env`:
   ```bash
   YOUTUBE_API_KEY=AIzaSy...your_key
   ```

✅ **Done!** YouTube API sẵn sàng.

---

### Bước 3: GitHub API (1 phút - Optional)

1. Truy cập: https://github.com/settings/tokens
2. Generate new token (classic)
3. **Không cần chọn permissions**
4. Copy token
5. Thêm vào `.env`:
   ```bash
   GITHUB_TOKEN=ghp_...your_token
   ```

✅ **Done!** GitHub API sẵn sàng.

---

### Bước 4: Stack Overflow API (30 giây - Optional)

**Không cần API key!** Service hoạt động ngay.

Nếu muốn tăng reliability:
1. Truy cập: https://stackoverflow.com/oauth/apps
2. Register application
3. Thêm vào `.env` (optional):
   ```bash
   STACKOVERFLOW_API_KEY=your_client_id
   ```

✅ **Done!** Stack Overflow API sẵn sàng.

---

## 🎉 KẾT QUẢ

Sau 5 phút, bạn có:

- ✅ **Dev.to API** - Unlimited articles (no setup!)
- ✅ **YouTube API** - 10K videos/day
- ✅ **GitHub API** - 5K requests/hour
- ✅ **Stack Overflow API** - 10K requests/day
- ✅ **Google Search API** - 100 queries/day (optional)

**Total: 5 nguồn, $0/month!**

---

## 🧪 TEST

```bash
# Start server
npm start

# Test endpoint
curl http://localhost:3000/api/nlp/learning-roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "skillGaps": ["React"],
    "currentLevel": "beginner",
    "targetLevel": "intermediate"
  }'
```

---

## 📚 CHI TIẾT

Xem `API_SETUP_GUIDE.md` để biết chi tiết cách setup từng API.

Xem `ALL_API_SOURCES_GUIDE.md` để biết tất cả nguồn có thể dùng.

---

## ❓ FAQ

**Q: Cần setup tất cả APIs không?**  
A: Không! Dev.to và Stack Overflow hoạt động ngay. YouTube và GitHub là recommended.

**Q: Có tốn phí không?**  
A: Không! Tất cả đều free.

**Q: Nếu không setup YouTube API thì sao?**  
A: Hệ thống vẫn hoạt động, chỉ không có videos từ YouTube. Vẫn có articles từ Dev.to và Stack Overflow.

**Q: Có thể thêm nguồn khác không?**  
A: Có! Xem `ALL_API_SOURCES_GUIDE.md` để biết thêm nguồn (Udemy, Coursera, etc.)

