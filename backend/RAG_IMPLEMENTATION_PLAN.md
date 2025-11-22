# 🔍 RAG Implementation Plan - Nâng cấp hệ thống NLP

## Tổng quan

**RAG (Retrieval-Augmented Generation)** sẽ giúp hệ thống:
- ✅ Đề xuất tài liệu học tập THẬT từ database lớn
- ✅ Job matching semantic search nhanh hơn
- ✅ Skill recommendations chính xác hơn
- ✅ Giảm hallucination của AI

---

## 🎯 Phase 1: RAG cho Learning Resources

### Architecture

```
User Request → Generate Query → Vector Search → Rank Results → Return Real Resources
                    ↓
                Embeddings
                    ↓
            Vector Database
         (Pinecone/ChromaDB)
                    ↓
        50K+ Real Courses/Videos
```

### Data Sources

#### 1. Udemy Courses (Free API)
```javascript
// Example data structure
{
  courseId: "12345",
  title: "Complete React Developer Course",
  instructor: "John Doe",
  rating: 4.7,
  students: 50000,
  price: 19.99,
  duration: "52 hours",
  level: "intermediate",
  skills: ["React", "JavaScript", "Redux"],
  url: "https://udemy.com/...",
  lastUpdated: "2024-01-15"
}

// ~50,000 courses
```

#### 2. Coursera Catalog (API)
```javascript
{
  courseId: "coursera-123",
  title: "Machine Learning Specialization",
  university: "Stanford University",
  rating: 4.9,
  duration: "3 months",
  certificate: true,
  price: 49,
  skills: ["Machine Learning", "Python", "TensorFlow"]
}

// ~10,000 courses
```

#### 3. YouTube Educational Content (Scraping)
```javascript
{
  playlistId: "PL123...",
  title: "Full Stack Web Development",
  channel: "Traversy Media",
  views: 1000000,
  videos: 25,
  duration: "15 hours",
  isFree: true,
  skills: ["HTML", "CSS", "JavaScript", "Node.js"]
}

// ~5,000 playlists
```

#### 4. GitHub Learning Repos
```javascript
{
  repoName: "awesome-react",
  stars: 50000,
  description: "Curated list of React resources",
  topics: ["React", "Learning"],
  lastUpdated: "2024-11-01"
}

// ~1,000 repos
```

### Implementation Steps

#### Step 1: Setup Vector Database

```bash
# Option 1: Pinecone (Cloud, easy)
npm install @pinecone-database/pinecone

# Option 2: ChromaDB (Local/Cloud, free)
npm install chromadb

# Option 3: Weaviate (Self-hosted)
npm install weaviate-ts-client
```

#### Step 2: Generate Embeddings

```javascript
// backend/src/services/embeddingService.js

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class EmbeddingService {
  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cheaper, faster
      input: text,
    });
    
    return response.data[0].embedding; // 1536 dimensions
  }

  /**
   * Generate embeddings for course
   */
  async embedCourse(course) {
    const text = `
      ${course.title}
      ${course.description}
      Skills: ${course.skills.join(', ')}
      Level: ${course.level}
      Provider: ${course.provider}
    `;
    
    return this.generateEmbedding(text);
  }
}
```

#### Step 3: Store in Vector DB

```javascript
// backend/src/services/vectorStoreService.js

const { Pinecone } = require('@pinecone-database/pinecone');

class VectorStoreService {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    this.index = this.pinecone.index('learning-resources');
  }

  /**
   * Upsert course to vector database
   */
  async storeCourse(course, embedding) {
    await this.index.upsert([
      {
        id: course.id,
        values: embedding,
        metadata: {
          title: course.title,
          provider: course.provider,
          rating: course.rating,
          price: course.price,
          duration: course.duration,
          url: course.url,
          skills: course.skills,
          level: course.level,
          credibility: this.calculateCredibility(course),
        },
      },
    ]);
  }

  /**
   * Search similar courses
   */
  async searchCourses(query, topK = 10, filters = {}) {
    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Search vector DB
    const results = await this.index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: filters, // { level: 'intermediate', price: { $lte: 50 } }
    });

    return results.matches.map(match => ({
      ...match.metadata,
      similarity: match.score,
    }));
  }

  /**
   * Calculate credibility score
   */
  calculateCredibility(course) {
    let credibility = 0.5;

    // Rating boost
    if (course.rating >= 4.5) credibility += 0.2;
    else if (course.rating >= 4.0) credibility += 0.1;

    // Provider boost
    if (['Coursera', 'edX', 'MIT OpenCourseWare'].includes(course.provider)) {
      credibility += 0.2;
    } else if (['Udemy', 'Pluralsight'].includes(course.provider)) {
      credibility += 0.1;
    }

    // Enrollment/views boost
    if (course.students > 100000 || course.views > 1000000) {
      credibility += 0.1;
    }

    return Math.min(credibility, 1.0);
  }
}

module.exports = new VectorStoreService();
```

#### Step 4: Update aiService.js

```javascript
// backend/src/services/aiService.js

const vectorStoreService = require('./vectorStoreService');

/**
 * Generate roadmap with REAL resources from RAG
 */
async _enhanceWithRealResources(phases) {
  for (const phase of phases) {
    for (const week of phase.weeks) {
      const skill = week.focus;
      
      // 🔍 RAG: Search real courses from vector DB
      const realCourses = await vectorStoreService.searchCourses(
        `Learn ${skill} for ${week.difficulty || 'intermediate'} level`,
        5, // Top 5
        {
          level: week.difficulty,
          rating: { $gte: 4.0 },
        }
      );

      // Replace AI-generated resources with REAL ones
      week.resources = realCourses.map(course => ({
        type: 'course',
        title: course.title,
        url: course.url,
        provider: course.provider,
        duration: course.duration,
        difficulty: course.level,
        isFree: course.price === 0,
        rating: course.rating,
        language: course.language || 'en',
        estimatedCost: course.price,
        credibility: course.credibility, // ✅ REAL credibility
        certificateOffered: course.certificate || false,
      }));
    }
  }

  return phases;
}
```

---

## 🎯 Phase 2: RAG cho Job Matching

### Architecture

```
CV Upload → Generate Embedding → Semantic Search → Top 100 Jobs → Detailed Scoring → Best Matches
                                        ↓
                                Vector Database
                                  (All Jobs)
```

### Implementation

```javascript
// backend/src/services/jobVectorService.js

class JobVectorService {
  /**
   * Index all jobs when created/updated
   */
  async indexJob(job) {
    const jobText = `
      ${job.title}
      ${job.description}
      ${job.requirements}
      Skills: ${job.skills.map(s => s.name).join(', ')}
      Location: ${job.location}
      Industry: ${job.industry}
    `;

    const embedding = await embeddingService.generateEmbedding(jobText);

    await vectorStoreService.storeJob(job._id, embedding, {
      title: job.title,
      company: job.company,
      skills: job.skills.map(s => s.name),
      location: job.location,
      salary: job.salary,
      experienceLevel: job.experience?.years,
    });
  }

  /**
   * Find matching jobs for CV using semantic search
   */
  async findMatchingJobs(cvData, limit = 100) {
    const cvText = `
      Skills: ${cvData.skills.map(s => s.name).join(', ')}
      Experience: ${cvData.experience.map(e => e.position).join(', ')}
      Education: ${cvData.education.map(e => e.degree).join(', ')}
    `;

    const cvEmbedding = await embeddingService.generateEmbedding(cvText);

    // 🔍 Semantic search - tìm 100 jobs gần nhất
    const similarJobs = await vectorStoreService.searchJobs(
      cvEmbedding,
      limit
    );

    // Re-rank with detailed NLP scoring
    const scoredJobs = await Promise.all(
      similarJobs.map(async job => {
        const detailedScore = await aiService.calculateAdvancedMatchScore(
          cvData,
          job,
          { saveToDatabase: false }
        );

        return {
          job,
          overallScore: detailedScore.overallScore,
          semanticSimilarity: job.similarity,
          scoreBreakdown: detailedScore.scoreBreakdown,
        };
      })
    );

    // Sort by overall score
    return scoredJobs.sort((a, b) => b.overallScore - a.overallScore);
  }
}
```

---

## 💰 Cost Estimate

### Embeddings Cost (OpenAI)
- **Model:** text-embedding-3-small
- **Cost:** $0.02 / 1M tokens

**For 50K courses:**
- Avg 200 words per course = ~10M words
- ~13M tokens
- **Cost:** ~$0.26 (one-time)

**For daily usage:**
- 1000 roadmap requests/day
- Each request: 10 course searches = 10 embedding queries
- 10K queries/day × 50 tokens = 500K tokens/day
- **Cost:** ~$0.01/day = **$3/month**

### Vector Database Cost

**Pinecone:**
- Free tier: 1 index, 100K vectors
- Paid: $70/month for 20M vectors

**ChromaDB:**
- Free (self-hosted)
- Cloud: $20/month starter

**Recommendation:** Start with **ChromaDB free** (self-hosted)

---

## 📊 Data Collection Strategy

### 1. Udemy (Official API - Paid)
```javascript
// Cost: $50-200/month
// Access: Full course catalog
// Rate limit: 1000 requests/day

const axios = require('axios');

async function fetchUdemyCourses() {
  const response = await axios.get('https://www.udemy.com/api-2.0/courses/', {
    auth: {
      username: process.env.UDEMY_CLIENT_ID,
      password: process.env.UDEMY_CLIENT_SECRET,
    },
    params: {
      page_size: 100,
      category: 'Development',
      ratings: 4.0,
    },
  });

  return response.data.results;
}
```

### 2. Coursera (Web Scraping + API)
```javascript
// Free scraping or Coursera API
// ~10K courses

const cheerio = require('cheerio');
const axios = require('axios');

async function scrapeCoursera() {
  // Scrape catalog page
  const html = await axios.get('https://www.coursera.org/browse');
  const $ = cheerio.load(html.data);
  
  // Extract courses
  const courses = [];
  $('.cds-ProductCard-base').each((i, el) => {
    courses.push({
      title: $(el).find('.cds-119').text(),
      url: $(el).find('a').attr('href'),
      // ...
    });
  });

  return courses;
}
```

### 3. YouTube (YouTube Data API v3)
```javascript
// Free: 10,000 quota/day
// Each search = 100 quota

const { google } = require('googleapis');
const youtube = google.youtube('v3');

async function searchYouTubePlaylists(skill) {
  const response = await youtube.search.list({
    key: process.env.YOUTUBE_API_KEY,
    part: 'snippet',
    q: `${skill} tutorial complete course`,
    type: 'playlist',
    maxResults: 50,
    order: 'relevance',
  });

  return response.data.items;
}
```

---

## 🚀 Implementation Timeline

### Week 1-2: Setup Infrastructure
- [ ] Setup Pinecone/ChromaDB
- [ ] Install dependencies
- [ ] Create embedding service
- [ ] Create vector store service

### Week 3-4: Data Collection
- [ ] Collect Udemy courses (API or scraping)
- [ ] Collect Coursera courses
- [ ] Collect YouTube playlists
- [ ] Collect GitHub repos

### Week 5-6: Data Processing
- [ ] Generate embeddings for all resources
- [ ] Store in vector database
- [ ] Create indexes
- [ ] Test search quality

### Week 7-8: Integration
- [ ] Update aiService.js
- [ ] Update roadmap generation
- [ ] Update job matching
- [ ] Test end-to-end

### Week 9-10: Optimization
- [ ] Improve ranking algorithm
- [ ] Add filtering
- [ ] Add caching
- [ ] Performance tuning

---

## ✅ Benefits of RAG

### With RAG:
✅ **Real resources** instead of AI-generated
✅ **Higher credibility** (actual ratings, reviews)
✅ **Better user trust** (real URLs, prices)
✅ **Faster job matching** (semantic search)
✅ **More accurate recommendations**
✅ **Scalable** (add more data sources)

### Without RAG (Current):
⚠️ AI generates fake resources
⚠️ No guarantee of accuracy
⚠️ Credibility scores are estimated
⚠️ Job matching is slower (scan all)
⚠️ Limited to what AI knows

---

## 🎯 Recommendation

### For MVP (Current State): ❌ DON'T need RAG yet
- Current NLP approach is good enough
- Focus on getting users first
- Validate product-market fit

### For Production (After 1000+ users): ✅ IMPLEMENT RAG
- Users will expect real resources
- Need better accuracy for trust
- Competitive advantage
- Worth the investment

### Immediate Action:
1. ✅ Keep current implementation
2. ✅ Collect feedback from users
3. ✅ Plan RAG for Phase 2 (3-6 months)
4. ✅ Start collecting course data gradually

---

## 📦 Quick Start (if implementing now)

```bash
# 1. Install dependencies
npm install @pinecone-database/pinecone openai chromadb

# 2. Setup environment
echo "OPENAI_API_KEY=your_key" >> .env
echo "PINECONE_API_KEY=your_key" >> .env
echo "PINECONE_ENVIRONMENT=us-west1-gcp" >> .env

# 3. Create services
# - embeddingService.js
# - vectorStoreService.js
# - jobVectorService.js

# 4. Collect initial data (sample)
# - 100 courses from free sources
# - Test the pipeline

# 5. Scale up gradually
# - Add more courses weekly
# - Monitor performance
# - Optimize based on usage
```

---

## 💡 Conclusion

**Current answer:**
- ❌ Không dùng RAG
- ❌ Không cần data lớn ngay

**Future recommendation:**
- ✅ Nên dùng RAG sau khi có users
- ✅ Cần ~50K courses (có thể collect từ free sources)
- ✅ Cost: ~$3-20/month (affordable)
- ✅ Implementation: 8-10 weeks

**Your choice:**
- Start simple ✅ (Current)
- Add RAG later ✅ (When needed)
