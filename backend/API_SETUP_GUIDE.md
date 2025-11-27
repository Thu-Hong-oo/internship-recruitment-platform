# 🔑 API Setup Guide - Learning Resources

Hướng dẫn setup các API keys để sử dụng tính năng lấy tài liệu học tập từ external APIs.

---

## 📋 TỔNG QUAN

Hệ thống sử dụng **6 APIs** để fetch learning resources:

1. **YouTube Data API v3** - Lấy video tutorials (FREE, 10K/day) - **Universal**
2. **Khan Academy API** - Lấy courses (FREE, UNLIMITED, NO API KEY!) - **Universal** 🌟
3. **GitHub API** - Lấy từ Awesome Lists (FREE, 5K/hour với token) - **IT-focused**
4. **Dev.to API** - Lấy articles (FREE, NO API KEY NEEDED!) - **IT-focused**
5. **Stack Overflow API** - Lấy Q&A và best practices (FREE, 10K/day) - **IT-focused**
6. **Google Custom Search API** - Backup search (FREE, 100/day) - **Universal**

**Tất cả đều có free tier!** Không cần trả phí để bắt đầu.

**🌟 Khan Academy hỗ trợ TẤT CẢ ngành nghề** (Technology, Healthcare, Business, Engineering, Arts, Science, etc.)

---

## 🎬 1. YouTube Data API v3

### Bước 1: Tạo Google Cloud Project

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project hiện có
3. Enable **YouTube Data API v3**:
   - Vào "APIs & Services" > "Library"
   - Tìm "YouTube Data API v3"
   - Click "Enable"

### Bước 2: Tạo API Key

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy API key
4. (Optional) Restrict API key để chỉ dùng cho YouTube Data API v3

### Bước 3: Thêm vào .env

```bash
YOUTUBE_API_KEY=AIzaSy...your_api_key_here
```

### Quota

- **Free tier**: 10,000 units/day
- **Search**: 100 units per request
- **Video details**: 1 unit per request
- **Estimated**: ~100 searches/day (đủ cho production nhỏ)

---

## 📝 2. Dev.to API (NEW! - NO API KEY NEEDED!)

**Status**: ✅ Đã implement  
**Cost**: **100% FREE, NO API KEY REQUIRED!**  
**Quota**: Unlimited

### Setup

**KHÔNG CẦN LÀM GÌ CẢ!** Service tự động hoạt động.

Dev.to API là public API, không cần authentication.

### Thêm vào .env (Optional)

```bash
# Không cần gì cả, nhưng có thể để comment để nhớ
# DEV_TO_API_KEY=not_needed
```

### Quota

- **Unlimited** - Không có rate limit!
- **Free forever** - 100% free

### Use Case

- Articles, tutorials, blog posts
- Community content
- Best practices

---

## 🎓 3. Khan Academy API (NEW! - Universal, NO API KEY!)

**Status**: ✅ Đã implement  
**Cost**: **100% FREE, NO API KEY REQUIRED!**  
**Quota**: **UNLIMITED**  
**Industries**: **ALL** (Technology, Healthcare, Business, Engineering, Arts, Science, etc.)

### Setup

**KHÔNG CẦN LÀM GÌ CẢ!** Service tự động hoạt động.

Khan Academy API là public API, không cần authentication.

### Thêm vào .env (Optional)

```bash
# Không cần gì cả, nhưng có thể để comment để nhớ
# KHAN_ACADEMY_API_KEY=not_needed
```

### Quota

- **Unlimited** - Không có rate limit!
- **Free forever** - 100% free
- **All industries** - Hỗ trợ TẤT CẢ ngành nghề

### Use Case

- Courses cho mọi ngành nghề
- Math, Science, Arts, Economics
- Healthcare, Business, Engineering
- Education, Legal, và nhiều ngành khác

### Industries Supported

- ✅ Technology & Computing
- ✅ Healthcare & Medicine
- ✅ Business & Finance
- ✅ Engineering
- ✅ Education
- ✅ Arts & Design
- ✅ Science (Biology, Chemistry, Physics)
- ✅ Mathematics & Statistics
- ✅ Economics
- ✅ Và nhiều ngành khác!

---

## 🐙 4. GitHub API

### Bước 1: Tạo Personal Access Token

1. Truy cập: https://github.com/settings/tokens
2. Click "Generate new token" > "Generate new token (classic)"
3. **Không cần chọn permissions nào** (public repo access là đủ)
4. Copy token

### Bước 2: Thêm vào .env

```bash
GITHUB_TOKEN=ghp_...your_token_here
```

### Quota

- **Without token**: 60 requests/hour
- **With token**: 5,000 requests/hour
- **Recommended**: Luôn dùng token để tăng quota

---

## 💬 5. Stack Overflow API (NEW!)

**Status**: ✅ Đã implement  
**Cost**: **FREE** (10,000 requests/day)  
**Quota**: 10,000 requests/day

### Setup

**API Key là OPTIONAL** (không bắt buộc, nhưng có key sẽ tăng quota)

#### Option 1: Không dùng API Key (Free)

**KHÔNG CẦN LÀM GÌ!** Service hoạt động ngay.

#### Option 2: Có API Key (Recommended)

1. **Truy cập**: https://stackoverflow.com/oauth/apps
2. **Register application**:
   - Application name: "Learning Resources"
   - Description: "Fetch learning resources from Stack Overflow"
   - OAuth Domain: (để trống hoặc `localhost:3000`)
   - Click "Register"

3. **Get credentials**:
   - **Client ID**: Copy từ application page
   - **Client Secret**: Copy từ application page

4. **Thêm vào .env** (optional):
   ```bash
   STACKOVERFLOW_API_KEY=your_client_id_here
   ```

**Lưu ý**: API key là optional, nhưng có key sẽ tăng quota và reliability.

### Quota

- **Without key**: 10,000 requests/day
- **With key**: 10,000 requests/day (same, but more reliable)

### Use Case

- Q&A, best practices
- Common problems and solutions
- Community knowledge

---

## 🔍 6. Google Custom Search API (Optional)

### Bước 1: Tạo Custom Search Engine

1. Truy cập: https://programmablesearchengine.google.com/controlpanel/create
2. Tạo search engine mới:
   - Sites to search: `*` (search entire web)
   - Name: "Learning Resources Search"
3. Click "Create"

### Bước 2: Get Search Engine ID

1. Vào "Control Panel" > Click vào search engine vừa tạo
2. Copy **Search Engine ID** (format: `012345678901234567890:abc123def456`)

### Bước 3: Get API Key

1. Truy cập: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" > "API Key"
3. Enable **Custom Search API**:
   - Vào "APIs & Services" > "Library"
   - Tìm "Custom Search API"
   - Click "Enable"

### Bước 4: Thêm vào .env

```bash
GOOGLE_SEARCH_API_KEY=AIzaSy...your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=012345678901234567890:abc123def456
```

### Quota

- **Free tier**: 100 queries/day
- **Paid**: $5 per 1,000 queries
- **Use case**: Backup khi YouTube/GitHub không đủ results

---

## ✅ 4. Verify Setup

### Test APIs

```bash
# Start server
npm start

# Check logs for API initialization
# Should see:
# ✅ YouTube API Service initialized
# ✅ GitHub API Service initialized
# ✅ Google Custom Search API Service initialized
```

### Test Endpoint

```bash
# Test resource recommendation
curl http://localhost:3000/api/nlp/learning-roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "skillGaps": ["React"],
    "currentLevel": "beginner",
    "targetLevel": "intermediate"
  }'
```

---

## 🚨 TROUBLESHOOTING

### YouTube API

**Error: "API key not valid"**
- Check API key format (should start with `AIzaSy`)
- Verify YouTube Data API v3 is enabled
- Check API key restrictions

**Error: "Quota exceeded"**
- Free tier: 10K units/day
- Wait 24 hours or upgrade to paid tier

### GitHub API

**Error: "Rate limit exceeded"**
- Without token: 60/hour
- With token: 5,000/hour
- Add `GITHUB_TOKEN` to .env

**Error: "Bad credentials"**
- Check token format (should start with `ghp_`)
- Verify token hasn't expired

### Google Search API

**Error: "Invalid API key"**
- Check API key format
- Verify Custom Search API is enabled
- Check Search Engine ID format

**Error: "Quota exceeded"**
- Free tier: 100 queries/day
- Wait 24 hours or upgrade to paid tier

---

## 💰 COST SUMMARY

| API | Free Tier | Paid Tier |
|-----|-----------|-----------|
| YouTube | 10K units/day | $0.01 per 1,000 units |
| GitHub | 5K requests/hour | Free (unlimited) |
| Google Search | 100 queries/day | $5 per 1,000 queries |

**Recommended**: Start with free tier, upgrade if needed.

---

## 📊 MONITORING

### Check API Usage

APIs tự động log usage. Check logs:

```bash
# YouTube API
grep "YouTube API" logs/app.log

# GitHub API
grep "GitHub API" logs/app.log

# Khan Academy API
grep "Khan Academy API" logs/app.log

# Dev.to API
grep "Dev.to API" logs/app.log

# Stack Overflow API
grep "Stack Overflow API" logs/app.log

# Google Search API
grep "Google Search API" logs/app.log
```

### Rate Limit Handling

Hệ thống tự động:
- ✅ Cache results (24 hours)
- ✅ Handle quota exceeded gracefully
- ✅ Fallback to other APIs
- ✅ Log warnings when APIs unavailable

---

## 🔒 SECURITY

### Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** (.env file)
3. **Restrict API keys** (if possible):
   - YouTube: Restrict to YouTube Data API v3 only
   - Google: Restrict to Custom Search API only
4. **Rotate keys** periodically
5. **Monitor usage** for suspicious activity

### .env File

```bash
# Add to .gitignore
.env

# Use .env.example for documentation
.env.example
```

---

## 📝 NEXT STEPS

Sau khi setup APIs:

1. ✅ Test với một skill (e.g., "React")
2. ✅ Verify resources được fetch từ APIs
3. ✅ Check logs để đảm bảo không có errors
4. ✅ Monitor quota usage
5. ✅ Adjust caching TTL nếu cần

---

## 🆘 SUPPORT

Nếu gặp vấn đề:

1. Check logs: `logs/app.log`
2. Verify API keys trong `.env`
3. Test APIs manually (curl/Postman)
4. Check API quotas trong Google Cloud Console

---

## 📚 REFERENCES

- [YouTube Data API v3 Docs](https://developers.google.com/youtube/v3)
- [Khan Academy API Docs](https://www.khanacademy.org/api/v1/)
- [GitHub API Docs](https://docs.github.com/en/rest)
- [Dev.to API Docs](https://developers.forem.com/api/v1)
- [Stack Overflow API Docs](https://api.stackexchange.com/docs)
- [Google Custom Search API Docs](https://developers.google.com/custom-search/v1/overview)

---

## 🎉 SUMMARY

### Required APIs (Must have)
- ✅ **Khan Academy API** - NO SETUP NEEDED! (100% free, unlimited, ALL industries) 🌟
- ✅ **Dev.to API** - NO SETUP NEEDED! (100% free, unlimited, IT-focused)

### Recommended APIs (Should have)
- ✅ **YouTube API** - Free, 10K/day (cần API key, universal)
- ✅ **GitHub API** - Free, 5K/hour (cần token để tăng quota, IT-focused)
- ✅ **Stack Overflow API** - Free, 10K/day (API key optional, IT-focused)

### Optional APIs (Nice to have)
- ⚠️ **Google Search API** - Free, 100/day (backup only, universal)

**Total Cost: $0/month** (tất cả đều free!)

**🌟 Khan Academy là nguồn tốt nhất cho multi-industry support!**

