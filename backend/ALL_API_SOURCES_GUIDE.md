# 📚 Tổng Hợp Tất Cả Nguồn API Cho Learning Resources

## 🎯 TỔNG QUAN

Hiện tại đã implement **3 nguồn FREE**, nhưng còn **nhiều nguồn khác** có thể sử dụng!

---

## ✅ ĐÃ IMPLEMENT (Free)

### 1. YouTube Data API v3 ✅

**Status**: ✅ Đã implement  
**Cost**: FREE (10,000 units/day)  
**Quota**: ~100 searches/day

**Cách lấy API Key:**

1. **Truy cập**: https://console.cloud.google.com/
2. **Tạo/C chọn Project**:
   - Click "Select a project" > "New Project"
   - Đặt tên: "Learning Resources API"
   - Click "Create"

3. **Enable YouTube Data API v3**:
   - Vào "APIs & Services" > "Library"
   - Search "YouTube Data API v3"
   - Click "Enable"

4. **Tạo API Key**:
   - Vào "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy API key (format: `AIzaSy...`)

5. **Restrict API Key** (khuyến nghị):
   - Click vào API key vừa tạo
   - "API restrictions" > "Restrict key"
   - Chọn "YouTube Data API v3"
   - Click "Save"

6. **Thêm vào .env**:
   ```bash
   YOUTUBE_API_KEY=AIzaSy...your_key_here
   ```

**Video hướng dẫn**: https://www.youtube.com/watch?v=Im69kzhpR3I

---

### 2. GitHub API ✅

**Status**: ✅ Đã implement  
**Cost**: FREE (5,000 requests/hour với token)  
**Quota**: 60 requests/hour (không token) hoặc 5,000/hour (có token)

**Cách lấy Token:**

1. **Truy cập**: https://github.com/settings/tokens
2. **Tạo token**:
   - Click "Generate new token" > "Generate new token (classic)"
   - **Note**: "Learning Resources API"
   - **Expiration**: 90 days (hoặc No expiration)
   - **Permissions**: KHÔNG CẦN chọn gì (public repo access là đủ)
   - Click "Generate token"

3. **Copy token** (format: `ghp_...`)

4. **Thêm vào .env**:
   ```bash
   GITHUB_TOKEN=ghp_...your_token_here
   ```

**Lưu ý**: Token chỉ hiện 1 lần, copy ngay!

---

### 3. Google Custom Search API ✅

**Status**: ✅ Đã implement  
**Cost**: FREE (100 queries/day)  
**Quota**: 100 queries/day

**Cách setup:**

#### Bước 1: Tạo Custom Search Engine

1. **Truy cập**: https://programmablesearchengine.google.com/controlpanel/create
2. **Tạo search engine**:
   - **Sites to search**: `*` (để search toàn bộ web)
   - **Name**: "Learning Resources Search"
   - Click "Create"

#### Bước 2: Get Search Engine ID

1. Vào "Control Panel" > Click vào search engine vừa tạo
2. Copy **Search Engine ID** (format: `012345678901234567890:abc123def456`)

#### Bước 3: Get API Key

1. **Truy cập**: https://console.cloud.google.com/apis/credentials
2. **Enable Custom Search API**:
   - Vào "APIs & Services" > "Library"
   - Search "Custom Search API"
   - Click "Enable"

3. **Tạo API Key**:
   - Vào "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy API key

4. **Thêm vào .env**:
   ```bash
   GOOGLE_SEARCH_API_KEY=AIzaSy...your_key_here
   GOOGLE_SEARCH_ENGINE_ID=012345678901234567890:abc123def456
   ```

---

## 🆕 CÁC NGUỒN KHÁC (Chưa implement)

### 4. Udemy API

**Status**: ❌ Chưa implement  
**Cost**: **PAID** ($50-200/month)  
**Quota**: 1,000 requests/day

**Cách lấy:**

1. **Truy cập**: https://www.udemy.com/user/account-api/
2. **Đăng ký Udemy Affiliate Program**:
   - Cần có Udemy account
   - Apply for affiliate program
   - Wait for approval (1-3 days)

3. **Get API credentials**:
   - Client ID
   - Client Secret

4. **Thêm vào .env**:
   ```bash
   UDEMY_CLIENT_ID=your_client_id
   UDEMY_CLIENT_SECRET=your_client_secret
   ```

**API Endpoint**: `https://www.udemy.com/api-2.0/courses/`

**Pros**:
- ✅ Full course catalog (~200K courses)
- ✅ Real metadata (ratings, reviews, prices, instructors)
- ✅ High quality data

**Cons**:
- ❌ Paid ($50-200/month)
- ❌ Cần approval

---

### 5. Coursera API

**Status**: ❌ Chưa implement  
**Cost**: **FREE** (limited) hoặc **PAID**  
**Quota**: Varies

**Cách lấy:**

1. **Truy cập**: https://www.coursera.org/developers
2. **Register for API access**:
   - Fill application form
   - Wait for approval

3. **Get API key**

**API Endpoint**: `https://api.coursera.org/api/courses.v1`

**Pros**:
- ✅ University courses
- ✅ High quality
- ✅ Certificates

**Cons**:
- ⚠️ Limited free tier
- ⚠️ Cần approval

**Alternative**: Web scraping (free nhưng phức tạp hơn)

---

### 6. freeCodeCamp (Web Scraping)

**Status**: ❌ Chưa implement  
**Cost**: **FREE**  
**Method**: Web Scraping (không có official API)

**Cách implement:**

```javascript
// src/services/freeCodeCampService.js
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeFreeCodeCamp(skill) {
  const url = 'https://www.freecodecamp.org/learn/';
  
  // Map skills to freeCodeCamp paths
  const skillMap = {
    'javascript': 'javascript-algorithms-and-data-structures',
    'react': 'front-end-development-libraries',
    'node.js': 'back-end-development-and-apis',
    'python': 'scientific-computing-with-python',
  };
  
  const path = skillMap[skill.toLowerCase()];
  if (!path) return [];
  
  const response = await axios.get(`${url}${path}/`);
  const $ = cheerio.load(response.data);
  
  // Parse curriculum
  // ...
}
```

**Pros**:
- ✅ 100% free
- ✅ Structured curriculum
- ✅ Certificates

**Cons**:
- ⚠️ Cần web scraping (phức tạp hơn)
- ⚠️ Có thể break nếu website thay đổi

---

### 7. Roadmap.sh (Web Scraping)

**Status**: ❌ Chưa implement  
**Cost**: **FREE**  
**Method**: Web Scraping

**Cách implement:**

```javascript
// src/services/roadmapService.js
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeRoadmap(skill) {
  const url = 'https://roadmap.sh/';
  
  // Roadmap.sh có structured paths
  // Ví dụ: /frontend, /backend, /devops
  
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  
  // Parse roadmap links
  // ...
}
```

**Pros**:
- ✅ Structured learning paths
- ✅ Community verified
- ✅ Free

**Cons**:
- ⚠️ Cần scraping
- ⚠️ Limited to roadmap structure

---

### 8. MDN Web Docs API

**Status**: ❌ Chưa implement  
**Cost**: **FREE**  
**Quota**: Unlimited

**Cách lấy:**

1. **Truy cập**: https://developer.mozilla.org/en-US/docs/MDN/Contribute/Structures/API_documentation
2. **MDN không có official API**, nhưng có:
   - RSS feeds
   - JSON exports
   - GitHub repository

**Alternative**: Scrape từ MDN website

**Pros**:
- ✅ Official documentation
- ✅ High quality
- ✅ Free

**Cons**:
- ⚠️ Không có official API
- ⚠️ Cần scraping

---

### 9. Stack Overflow API

**Status**: ❌ Chưa implement  
**Cost**: **FREE**  
**Quota**: 10,000 requests/day

**Cách lấy:**

1. **Truy cập**: https://stackoverflow.com/oauth
2. **Register application**:
   - Application name: "Learning Resources"
   - Description: "Fetch learning resources"
   - OAuth Domain: (optional)
   - Click "Register"

3. **Get Client ID và Client Secret**

4. **Thêm vào .env**:
   ```bash
   STACKOVERFLOW_CLIENT_ID=your_client_id
   STACKOVERFLOW_CLIENT_SECRET=your_client_secret
   ```

**API Endpoint**: `https://api.stackexchange.com/2.3/`

**Use case**: Tìm articles, tutorials, best practices

**Pros**:
- ✅ Free
- ✅ High quality Q&A
- ✅ Community verified

**Cons**:
- ⚠️ Không phải courses, chỉ Q&A

---

### 10. Reddit API

**Status**: ❌ Chưa implement  
**Cost**: **FREE**  
**Quota**: 60 requests/minute

**Cách lấy:**

1. **Truy cập**: https://www.reddit.com/prefs/apps
2. **Create application**:
   - Name: "Learning Resources"
   - Type: "script"
   - Description: "Fetch learning resources"
   - Redirect URI: `http://localhost:3000`
   - Click "create app"

3. **Get credentials**:
   - Client ID (under app name)
   - Client Secret (secret field)

4. **Thêm vào .env**:
   ```bash
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   ```

**Use case**: Tìm discussions, recommendations từ subreddits như r/learnprogramming, r/webdev

**Pros**:
- ✅ Free
- ✅ Community discussions
- ✅ Real user experiences

**Cons**:
- ⚠️ Không structured như courses
- ⚠️ Cần filter quality

---

### 11. Medium API

**Status**: ❌ Chưa implement  
**Cost**: **FREE** (limited)  
**Quota**: Varies

**Cách lấy:**

1. **Truy cập**: https://medium.com/me/applications
2. **Create integration token**
3. **Get token**

**API Endpoint**: `https://api.medium.com/v1/`

**Use case**: Tìm articles, tutorials

**Pros**:
- ✅ High quality articles
- ✅ Free (limited)

**Cons**:
- ⚠️ Limited free tier
- ⚠️ Không có full search API

**Alternative**: RSS feeds hoặc scraping

---

### 12. Dev.to API

**Status**: ❌ Chưa implement  
**Cost**: **FREE**  
**Quota**: Unlimited

**Cách dùng:**

1. **Không cần API key!**
2. **API Endpoint**: `https://dev.to/api/articles`

**Example**:
```javascript
const axios = require('axios');

async function getDevToArticles(skill) {
  const response = await axios.get('https://dev.to/api/articles', {
    params: {
      tag: skill.toLowerCase(),
      per_page: 10,
    },
  });
  
  return response.data;
}
```

**Pros**:
- ✅ 100% free, no API key needed
- ✅ High quality articles
- ✅ Easy to use

**Cons**:
- ⚠️ Chỉ có articles, không có courses

---

### 13. edX API

**Status**: ❌ Chưa implement  
**Cost**: **FREE** (limited)  
**Quota**: Varies

**Cách lấy:**

1. **Truy cập**: https://www.edx.org/api-docs
2. **Register for API access**
3. **Get API key**

**API Endpoint**: `https://api.edx.org/catalog/v1/`

**Pros**:
- ✅ University courses
- ✅ High quality

**Cons**:
- ⚠️ Limited free tier
- ⚠️ Cần approval

---

### 14. Pluralsight API

**Status**: ❌ Chưa implement  
**Cost**: **PAID**  
**Quota**: Varies

**Cách lấy:**

1. **Contact Pluralsight** for API access
2. **Get API credentials**

**Pros**:
- ✅ High quality courses
- ✅ Professional content

**Cons**:
- ❌ Paid
- ❌ Cần business account

---

### 15. LinkedIn Learning API

**Status**: ❌ Chưa implement  
**Cost**: **PAID**  
**Quota**: Varies

**Cách lấy:**

1. **Truy cập**: https://learn.microsoft.com/en-us/linkedin/learning/
2. **Apply for API access**
3. **Get credentials**

**Pros**:
- ✅ Professional courses
- ✅ High quality

**Cons**:
- ❌ Paid
- ❌ Cần business account

---

## 📊 SO SÁNH TẤT CẢ NGUỒN

| Nguồn | Cost | Quota | Status | Quality | Ease |
|-------|------|-------|--------|---------|------|
| **YouTube** | FREE | 10K/day | ✅ Done | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **GitHub** | FREE | 5K/hour | ✅ Done | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Google Search** | FREE | 100/day | ✅ Done | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Dev.to** | FREE | Unlimited | ❌ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Stack Overflow** | FREE | 10K/day | ❌ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Reddit** | FREE | 60/min | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **freeCodeCamp** | FREE | - | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Roadmap.sh** | FREE | - | ❌ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **MDN** | FREE | - | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Udemy** | $50-200 | 1K/day | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Coursera** | FREE/PAID | Varies | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **edX** | FREE/PAID | Varies | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Medium** | FREE | Limited | ❌ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Pluralsight** | PAID | - | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **LinkedIn Learning** | PAID | - | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 🎯 KHUYẾN NGHỊ

### Phase 1: Free APIs (Đã làm) ✅
- ✅ YouTube
- ✅ GitHub
- ✅ Google Search

### Phase 2: Easy Free APIs (Nên làm tiếp)
1. **Dev.to API** - Dễ nhất, không cần key!
2. **Stack Overflow API** - Free, high quality
3. **Reddit API** - Free, community discussions

### Phase 3: Web Scraping (Nếu cần)
1. **freeCodeCamp** - Structured curriculum
2. **Roadmap.sh** - Learning paths
3. **MDN** - Official docs

### Phase 4: Paid APIs (Nếu có budget)
1. **Udemy API** - Best value ($50-200/month)
2. **Coursera API** - University courses

---

## 🚀 NEXT STEPS

Bạn muốn tôi implement thêm nguồn nào?

**Dễ nhất**: Dev.to API (không cần key, chỉ cần call API)

**Tốt nhất**: Udemy API (nếu có budget)

**Free tốt**: Stack Overflow + Reddit APIs

Cho tôi biết bạn muốn thêm nguồn nào, tôi sẽ implement ngay! 🎉

