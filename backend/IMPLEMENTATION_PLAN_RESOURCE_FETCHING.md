# 🚀 Implementation Plan: Nâng Cấp Hệ Thống Lấy Tài Liệu

## 📋 TỔNG QUAN

Triển khai quy trình lấy tài liệu thực tế từ APIs và web scraping, kết hợp với hệ thống hiện tại.

---

## 🎯 PHASE 1: FREE APIs (Week 1-2)

### 1.1 YouTube Data API v3

**Mục tiêu:** Lấy real video data với metadata đầy đủ

**Setup:**
```bash
# Get API key from Google Cloud Console
# https://console.cloud.google.com/apis/credentials
```

**Implementation:**
```javascript
// src/services/youtubeApiService.js
const { google } = require('googleapis');

class YouTubeApiService {
  constructor() {
    this.youtube = google.youtube('v3');
    this.apiKey = process.env.YOUTUBE_API_KEY;
  }

  async searchVideos(skill, difficulty = 'beginner', maxResults = 10) {
    const query = `${skill} ${difficulty} tutorial full course`;
    
    const response = await this.youtube.search.list({
      key: this.apiKey,
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults,
      order: 'relevance',
      videoDuration: 'long', // > 20 minutes
    });

    return response.data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      channel: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.default.url,
      // Get additional stats
      viewCount: await this.getVideoStats(item.id.videoId),
      likeCount: await this.getVideoStats(item.id.videoId, 'likeCount'),
    }));
  }

  async getVideoStats(videoId) {
    const response = await this.youtube.videos.list({
      key: this.apiKey,
      part: 'statistics,contentDetails',
      id: videoId,
    });

    const video = response.data.items[0];
    return {
      viewCount: parseInt(video.statistics.viewCount || 0),
      likeCount: parseInt(video.statistics.likeCount || 0),
      duration: this.parseDuration(video.contentDetails.duration),
    };
  }
}
```

**Quota:** 10,000 units/day (free)
- Search: 100 units
- Video details: 1 unit

**Caching:** Cache results for 24 hours (Redis)

---

### 1.2 GitHub API

**Mục tiêu:** Lấy curated resources từ GitHub Awesome Lists

**Implementation:**
```javascript
// src/services/githubApiService.js
const axios = require('axios');

class GitHubApiService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN; // Optional, increases rate limit
  }

  async getAwesomeList(skill) {
    // Search for awesome-{skill} repositories
    const query = `awesome-${skill.toLowerCase()} in:name topic:awesome-list`;
    
    const response = await axios.get(`${this.baseUrl}/search/repositories`, {
      params: { q: query, sort: 'stars', order: 'desc' },
      headers: this.token ? { Authorization: `token ${this.token}` } : {},
    });

    const repos = response.data.items.slice(0, 3); // Top 3
    
    // Get README content
    const resources = [];
    for (const repo of repos) {
      const readme = await this.getReadmeContent(repo.full_name);
      const parsed = this.parseAwesomeList(readme);
      resources.push(...parsed);
    }

    return resources;
  }

  async getReadmeContent(repoFullName) {
    const response = await axios.get(
      `${this.baseUrl}/repos/${repoFullName}/readme`,
      {
        headers: this.token ? { Authorization: `token ${this.token}` } : {},
      }
    );

    return Buffer.from(response.data.content, 'base64').toString('utf-8');
  }

  parseAwesomeList(markdown) {
    // Parse markdown links
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const resources = [];
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const [, title, url] = match;
      if (url.startsWith('http')) {
        resources.push({ title, url, source: 'GitHub Awesome List' });
      }
    }

    return resources;
  }
}
```

**Quota:** 
- Without token: 60 requests/hour
- With token: 5,000 requests/hour

---

### 1.3 Google Custom Search API

**Mục tiêu:** Tìm resources từ Google Search (backup)

**Setup:**
```bash
# Get API key and Search Engine ID
# https://developers.google.com/custom-search/v1/overview
```

**Implementation:**
```javascript
// src/services/googleSearchService.js
const axios = require('axios');

class GoogleSearchService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  }

  async searchResources(skill, site = null) {
    let query = `learn ${skill} tutorial course`;
    if (site) {
      query += ` site:${site}`;
    }

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query,
        num: 10,
      },
    });

    return response.data.items.map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    }));
  }
}
```

**Quota:** 100 queries/day (free)

---

## 🎯 PHASE 2: ENHANCED FILTERING (Week 3)

### 2.1 Recency Check

```javascript
// src/services/resourceFilterService.js

class ResourceFilterService {
  getRecencyScore(publishedDate, updatedDate) {
    const lastUpdate = updatedDate || publishedDate;
    const monthsOld = (Date.now() - new Date(lastUpdate)) / (30 * 24 * 60 * 60 * 1000);

    // Fast-decay for tech (React, Node.js change quickly)
    if (monthsOld <= 12) return 1.0;  // < 1 year: excellent
    if (monthsOld <= 24) return 0.7;  // 1-2 years: OK
    if (monthsOld <= 36) return 0.5;  // 2-3 years: outdated
    return 0.3;                        // > 3 years: very outdated
  }

  getSourceTier(url) {
    if (url.includes('reactjs.org') || 
        url.includes('developer.mozilla.org') ||
        url.includes('coursera.org')) {
      return { tier: 'tier1', score: 1.0 };
    }
    
    if (url.includes('udemy.com') || 
        url.includes('pluralsight.com')) {
      return { tier: 'tier2', score: 0.85 };
    }
    
    if (url.includes('medium.com') || 
        url.includes('dev.to')) {
      return { tier: 'tier3', score: 0.70 };
    }
    
    return { tier: 'tier4', score: 0.50 };
  }

  getAccuracyScore(rating, reviewCount) {
    // Rating score (50% weight)
    const ratingScore = rating / 5.0;
    
    // Review count score (50% weight)
    let countScore = 0;
    if (reviewCount >= 10000) countScore = 1.0;
    else if (reviewCount >= 5000) countScore = 0.9;
    else if (reviewCount >= 1000) countScore = 0.8;
    else if (reviewCount >= 500) countScore = 0.7;
    else if (reviewCount >= 100) countScore = 0.6;
    else countScore = 0.5;
    
    return (ratingScore * 0.5) + (countScore * 0.5);
  }
}
```

---

### 2.2 Personalization Filters

```javascript
// src/services/personalizationService.js

class PersonalizationService {
  filterByBudget(resources, budget) {
    if (budget === 'free') {
      return resources.filter(r => r.isFree === true);
    }
    if (budget === '< 50') {
      return resources.filter(r => !r.isFree && r.estimatedCost < 50);
    }
    return resources; // No budget constraint
  }

  filterByTime(resources, maxHours) {
    return resources.filter(r => {
      const duration = this.parseDuration(r.duration);
      return duration <= maxHours;
    });
  }

  filterByLearningStyle(resources, learningStyle) {
    // Visual: prefer videos
    // Reading: prefer documentation, articles
    // Hands-on: prefer courses with projects
    
    const styleWeights = {
      visual: { video: 1.0, course: 0.8, documentation: 0.5 },
      reading: { documentation: 1.0, article: 0.9, course: 0.7, video: 0.4 },
      handsOn: { course: 1.0, project: 1.0, video: 0.7, documentation: 0.6 },
    };

    const weights = styleWeights[learningStyle] || {};
    
    return resources.map(r => ({
      ...r,
      styleScore: weights[r.type] || 0.5,
    })).sort((a, b) => b.styleScore - a.styleScore);
  }

  parseDuration(duration) {
    // "40 hours" -> 40
    // "3 months" -> 180 (approx)
    const match = duration.match(/(\d+)\s*(hour|hours|month|months)/i);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.includes('hour')) return value;
    if (unit.includes('month')) return value * 30 * 8; // 8 hours/day
    return 0;
  }
}
```

---

## 🎯 PHASE 3: INTEGRATION (Week 4)

### 3.1 Update ResourceRecommendationService

```javascript
// src/services/resourceRecommendationService.js

async recommendResources({
  skill,
  currentLevel = 'none',
  targetLevel = 'intermediate',
  phaseNumber = 1,
  learningObjectives = [],
  weekNumber = 1,
  totalWeeks = 12,
  // NEW: User preferences
  budget = 'free',
  maxHours = 50,
  learningStyle = 'visual',
}) {
  // 1. Try curated database first (fast, reliable)
  let resources = [];
  if (curatedResourcesDatabase.hasResources(skill)) {
    resources = curatedResourcesDatabase.getResources(skill, ...);
  }

  // 2. Fetch from APIs (if not enough)
  if (resources.length < 5) {
    const apiResources = await this.fetchFromAPIs(skill, currentLevel);
    resources = [...resources, ...apiResources];
  }

  // 3. Apply filters
  resources = personalizationService.filterByBudget(resources, budget);
  resources = personalizationService.filterByTime(resources, maxHours);
  resources = personalizationService.filterByLearningStyle(resources, learningStyle);

  // 4. Calculate credibility scores (with real data)
  resources = resources.map(r => ({
    ...r,
    credibility: this.calculateCredibilityWithRealData(r),
    recencyScore: resourceFilterService.getRecencyScore(r.publishedAt, r.updatedAt),
  }));

  // 5. Final ranking
  resources = resources.sort((a, b) => {
    const scoreA = this.calculateFinalScore(a, { currentLevel, targetLevel, phaseNumber });
    const scoreB = this.calculateFinalScore(b, { currentLevel, targetLevel, phaseNumber });
    return scoreB - scoreA;
  });

  return resources.slice(0, 5);
}

async fetchFromAPIs(skill, level) {
  const resources = [];

  // YouTube API
  try {
    const videos = await youtubeApiService.searchVideos(skill, level, 5);
    resources.push(...videos.map(v => ({
      type: 'video',
      ...v,
      isFree: true,
    })));
  } catch (error) {
    logger.warn('YouTube API failed', error);
  }

  // GitHub Awesome Lists
  try {
    const awesomeResources = await githubApiService.getAwesomeList(skill);
    resources.push(...awesomeResources.map(r => ({
      type: 'article',
      ...r,
      isFree: true,
    })));
  } catch (error) {
    logger.warn('GitHub API failed', error);
  }

  return resources;
}

calculateCredibilityWithRealData(resource) {
  // Use real ratings, review counts, etc.
  const providerScore = this._getProviderReputationScore(resource.provider);
  const ratingScore = resource.rating ? resource.rating / 5.0 : 0.5;
  const recencyScore = resourceFilterService.getRecencyScore(
    resource.publishedAt,
    resource.updatedAt
  );
  const accuracyScore = resource.reviewCount 
    ? resourceFilterService.getAccuracyScore(resource.rating, resource.reviewCount)
    : 0.5;

  return (
    providerScore * 0.30 +
    ratingScore * 0.25 +
    recencyScore * 0.25 +
    accuracyScore * 0.20
  );
}
```

---

## 🎯 PHASE 4: CACHING & OPTIMIZATION (Week 5)

### 4.1 Redis Caching

```javascript
// src/services/resourceCacheService.js

class ResourceCacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async getCachedResources(skill, level) {
    const key = `resources:${skill}:${level}`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  async cacheResources(skill, level, resources, ttl = 86400) {
    // Cache for 24 hours
    const key = `resources:${skill}:${level}`;
    await this.redis.setex(key, ttl, JSON.stringify(resources));
  }

  async invalidateCache(skill) {
    const pattern = `resources:${skill}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 📊 MONITORING & METRICS

### 4.2 Track API Usage

```javascript
// src/services/apiUsageTracker.js

class ApiUsageTracker {
  async trackApiCall(service, endpoint) {
    const key = `api:usage:${service}:${new Date().toISOString().split('T')[0]}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400 * 7); // Keep for 7 days
  }

  async getDailyUsage(service) {
    const key = `api:usage:${service}:${new Date().toISOString().split('T')[0]}`;
    return parseInt(await this.redis.get(key) || '0');
  }

  async checkQuota(service) {
    const usage = await this.getDailyUsage(service);
    const limits = {
      youtube: 10000,
      github: 5000,
      google: 100,
    };
    
    return {
      used: usage,
      limit: limits[service] || 1000,
      remaining: (limits[service] || 1000) - usage,
    };
  }
}
```

---

## 🧪 TESTING

### Test Cases

```javascript
// tests/services/resourceRecommendationService.test.js

describe('ResourceRecommendationService', () => {
  it('should fetch resources from YouTube API', async () => {
    const resources = await service.recommendResources({
      skill: 'React',
      currentLevel: 'beginner',
      budget: 'free',
      learningStyle: 'visual',
    });

    expect(resources).toHaveLength(5);
    expect(resources[0].type).toBe('video');
    expect(resources[0].url).toContain('youtube.com');
  });

  it('should filter by budget', async () => {
    const resources = await service.recommendResources({
      skill: 'React',
      budget: 'free',
    });

    resources.forEach(r => {
      expect(r.isFree).toBe(true);
    });
  });

  it('should prioritize learning style', async () => {
    const resources = await service.recommendResources({
      skill: 'React',
      learningStyle: 'reading',
    });

    // Reading style should prefer documentation/articles
    expect(resources[0].type).toMatch(/documentation|article/);
  });
});
```

---

## 📝 ENVIRONMENT VARIABLES

```bash
# .env

# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key

# GitHub API (optional, increases rate limit)
GITHUB_TOKEN=your_github_token

# Google Custom Search API
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Redis (for caching)
REDIS_URL=redis://localhost:6379
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Get API keys (YouTube, Google)
- [ ] Set up Redis for caching
- [ ] Implement YouTube API service
- [ ] Implement GitHub API service
- [ ] Add recency checking
- [ ] Add personalization filters
- [ ] Update ResourceRecommendationService
- [ ] Add caching layer
- [ ] Add monitoring & metrics
- [ ] Write tests
- [ ] Update documentation

---

## 📊 EXPECTED RESULTS

### Before (Current):
- ❌ Limited to ~20 curated skills
- ❌ Simulated metadata (ratings, prices)
- ❌ No real-time updates
- ❌ No personalization

### After (With APIs):
- ✅ Unlimited skills support
- ✅ Real metadata from APIs
- ✅ Real-time updates
- ✅ Full personalization (budget, time, style)
- ✅ Better credibility assessment

---

## 💰 COST ESTIMATE

### Free Tier (Recommended Start):
- YouTube API: **Free** (10K/day)
- GitHub API: **Free** (5K/hour with token)
- Google Search API: **Free** (100/day)
- Redis: **Free** (local) or $5/month (cloud)

**Total: ~$0-5/month**

### Paid Tier (If Needed):
- Udemy API: $50-200/month
- Coursera API: Varies
- Redis Cloud: $5-20/month

**Total: ~$55-220/month**

---

## 🎯 SUCCESS METRICS

1. **Coverage**: Support 100+ skills (vs 20 currently)
2. **Quality**: Average credibility score > 0.8
3. **Performance**: API response time < 2s (with cache)
4. **User Satisfaction**: Click-through rate > 30%

