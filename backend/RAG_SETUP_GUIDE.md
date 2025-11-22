# RAG Setup Guide - Hướng Dẫn Cài Đặt

## 📋 Tổng Quan

Hệ thống RAG (Retrieval-Augmented Generation) đã được tích hợp để gợi ý tài liệu học tập thực tế từ vector database.

## 🚀 Quick Start

### 1. Cài Đặt Dependencies

Dependencies đã được cài đặt trong `package.json`:
- ✅ `chromadb` - Vector database
- ✅ `openai` - Embedding generation

### 2. Cấu Hình Environment Variables

Thêm vào file `.env`:

```bash
# OpenAI API Key (for embeddings)
OPENAI_API_KEY=your_openai_api_key_here

# ChromaDB Configuration (optional)
# Nếu không set, sẽ dùng local instance (http://localhost:8000)
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=learning-resources
```

### 3. Khởi Động ChromaDB

#### Option A: Local ChromaDB (Recommended for development)

```bash
# Install ChromaDB server (nếu chưa có)
pip install chromadb

# Start ChromaDB server
chroma run --host localhost --port 8000
```

#### Option B: Remote ChromaDB (Production)

Set `CHROMA_URL` trong `.env` trỏ đến remote instance.

### 4. Index Sample Resources

```bash
# Index sample resources để test
node scripts/index-sample-resources.js
```

Output:
```
🚀 Starting resource indexing...

📚 Indexing sample resources...
✅ Indexing completed successfully!
   - Indexed: 5 resources
   - Failed: 0 resources

📊 Collection Statistics:
   - Collection: learning-resources
   - Total Resources: 5
   - Status: active

✨ Done!
```

## 📚 Cấu Trúc Services

### 1. EmbeddingService (`src/services/embeddingService.js`)

**Chức năng:**
- Generate embeddings từ OpenAI
- Model: `text-embedding-3-small` (1536 dimensions)
- Cost: ~$0.02 per 1M tokens

**Methods:**
- `generateEmbedding(text)` - Generate single embedding
- `generateEmbeddings(texts)` - Batch embeddings
- `embedResource(resource)` - Embed learning resource
- `embedSearchQuery(queryParams)` - Embed search query

### 2. VectorStoreService (`src/services/vectorStoreService.js`)

**Chức năng:**
- Quản lý ChromaDB connection
- Store và search resources
- Metadata filtering

**Methods:**
- `initializeCollection()` - Initialize/get collection
- `addResource(resource)` - Add single resource
- `addResources(resources)` - Batch add
- `searchResources(queryParams, filters, limit)` - Semantic search
- `deleteResource(resourceId)` - Delete resource
- `getCollectionStats()` - Get statistics

### 3. ResourceIndexingService (`src/services/resourceIndexingService.js`)

**Chức năng:**
- Index resources vào vector DB
- Batch indexing
- Sample data generation

**Methods:**
- `indexResource(resource)` - Index single resource
- `indexResources(resources)` - Batch index
- `indexSampleResources()` - Index sample data
- `getStatistics()` - Get indexing stats
- `deleteResource(resourceId)` - Delete from index

### 4. ResourceRecommendationService (Updated)

**Thay đổi:**
- ✅ Tích hợp RAG search
- ✅ Fallback to intelligent recommendations nếu RAG unavailable
- ✅ Automatic switching giữa RAG và generated resources

## 🔍 Cách Hoạt Động

### Flow Diagram:

```
User Request (Skill + Level + Timeline)
        ↓
[1] Query Generation
    - Skill gaps analysis
    - Learning objectives
    - Phase & week context
        ↓
[2] RAG Search (if available)
    - Generate query embedding
    - Search vector database
    - Filter by metadata
        ↓
[3] Fallback (if RAG unavailable/no results)
    - Intelligent recommendations
    - Generated resources
        ↓
[4] Resource Ranking
    - Credibility score
    - Relevance score (from similarity)
    - Fit score
        ↓
[5] Diversification
    - Multiple resource types
    - Different providers
    - Balanced difficulty
        ↓
[6] Return Top N Resources
```

## 📊 Resource Format

### Input Format (for indexing):

```javascript
{
  id: 'unique-resource-id',           // Required
  title: 'Resource Title',            // Required
  description: 'Resource description',
  skills: ['React', 'JavaScript'],    // Array of skills
  level: 'beginner',                  // beginner/intermediate/advanced/expert
  provider: 'Udemy',                  // Provider name
  type: 'course',                     // course/video/article/documentation
  url: 'https://...',                 // Resource URL
  rating: 4.7,                        // 0-5
  isFree: false,                      // boolean
  estimatedCost: 19.99,               // USD
  duration: '48 hours',               // Duration string
  certificateOffered: true            // boolean
}
```

### Output Format (from search):

```javascript
{
  id: 'unique-resource-id',
  title: 'Resource Title',
  description: 'Resource description',
  skills: ['React', 'JavaScript'],
  level: 'beginner',
  provider: 'Udemy',
  type: 'course',
  url: 'https://...',
  rating: 4.7,
  isFree: false,
  estimatedCost: 19.99,
  duration: '48 hours',
  certificateOffered: true,
  similarity: 0.85,                  // Semantic similarity (0-1)
  credibility: 0.82,                  // Calculated credibility
  recommendationScore: 0.88           // Final recommendation score
}
```

## 🧪 Testing

### Test RAG Search:

```javascript
// In your code
const vectorStoreService = require('./src/services/vectorStoreService');
const resourceIndexingService = require('./src/services/resourceIndexingService');

// 1. Index sample resources
await resourceIndexingService.indexSampleResources();

// 2. Search
const results = await vectorStoreService.searchResources(
  {
    skill: 'React',
    difficulty: 'beginner',
    learningStage: 'remember',
    objectives: ['JSX', 'Components'],
  },
  {
    level: 'beginner',
    minRating: 4.0,
  },
  5
);

console.log('Search results:', results);
```

### Test Recommendation Service:

```javascript
const resourceRecommendationService = require('./src/services/resourceRecommendationService');

const resources = await resourceRecommendationService.recommendResources({
  skill: 'React',
  currentLevel: 'beginner',
  targetLevel: 'intermediate',
  phaseNumber: 1,
  learningObjectives: ['JSX syntax', 'Components'],
  weekNumber: 1,
  totalWeeks: 12,
});

console.log('Recommended resources:', resources);
```

## 🔧 Troubleshooting

### Issue: "ChromaDB client not initialized"

**Solution:**
1. Check if ChromaDB server is running: `chroma run --host localhost --port 8000`
2. Check `CHROMA_URL` in `.env`
3. Check network connectivity

### Issue: "Failed to generate embedding"

**Solution:**
1. Check `OPENAI_API_KEY` in `.env`
2. Check OpenAI API quota
3. Check internet connection

### Issue: "No results from RAG search"

**Solution:**
1. Check if resources are indexed: `node scripts/index-sample-resources.js`
2. Check collection stats: `await vectorStoreService.getCollectionStats()`
3. System will automatically fallback to intelligent recommendations

### Issue: "Vector store not available"

**Solution:**
- System will automatically use intelligent recommendations
- This is expected behavior if ChromaDB is not set up
- No action needed - system works without RAG

## 📈 Production Deployment

### 1. Use Remote ChromaDB

```bash
# Set in .env
CHROMA_URL=https://your-chromadb-instance.com
```

### 2. Index Real Resources

Collect resources from:
- Udemy API
- Coursera API
- YouTube API
- GitHub repos
- Official documentation

### 3. Monitor Performance

- Track embedding costs (OpenAI)
- Monitor search latency
- Track resource quality metrics

## ✅ Checklist

- [x] EmbeddingService created
- [x] VectorStoreService created
- [x] ResourceIndexingService created
- [x] ResourceRecommendationService updated
- [x] Sample indexing script created
- [ ] ChromaDB server running
- [ ] OpenAI API key configured
- [ ] Sample resources indexed
- [ ] Test search working
- [ ] Production resources collected

## 🎯 Next Steps

1. **Collect Real Resources:**
   - Integrate với Udemy/Coursera APIs
   - Scrape YouTube educational content
   - Index official documentation

2. **Scale Up:**
   - Index 1000+ resources
   - Monitor performance
   - Optimize search queries

3. **Enhance Features:**
   - Health check service (dead link detection)
   - Resource update mechanism
   - User feedback integration

## 📝 Notes

- RAG is **optional** - system works without it
- Automatic fallback to intelligent recommendations
- No breaking changes to existing code
- Can be enabled/disabled via environment variables

