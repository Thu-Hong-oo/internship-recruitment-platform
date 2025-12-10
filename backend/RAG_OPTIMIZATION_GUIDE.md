# 🚀 RAG Recommendations - Optimization Guide

**Last Updated:** 2025-12-10  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Monitoring & Metrics](#monitoring--metrics)
4. [Performance Optimization](#performance-optimization)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

### Enable RAG Globally

**Option 1: Using Script (Recommended)**

```bash
# Linux/Mac
chmod +x scripts/enable-rag.sh
./scripts/enable-rag.sh

# Windows
scripts\enable-rag.bat
```

**Option 2: Manual Setup**

Add to `.env` or `.env.local`:

```bash
# Enable RAG recommendations
ENABLE_RAG_RECOMMENDATIONS=true

# Optional: Enable ChromaDB for faster queries
USE_CHROMADB_FOR_RECOMMENDATIONS=true
CHROMADB_URL=http://localhost:8000
```

### Initial Sync

After enabling, run initial sync to index existing jobs/candidates:

```bash
# Sync jobs
curl -X POST http://localhost:3000/api/rag/sync/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Sync candidates
curl -X POST http://localhost:3000/api/rag/sync/candidates \
  -H "Authorization: Bearer YOUR_TOKEN"

# Pre-compute popular jobs
curl -X POST http://localhost:3000/api/rag/sync/popular-jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_RAG_RECOMMENDATIONS` | `false` | Enable/disable RAG recommendations |
| `USE_CHROMADB_FOR_RECOMMENDATIONS` | `false` | Use ChromaDB for vector search (faster) |
| `CHROMADB_URL` | `http://localhost:8000` | ChromaDB server URL |

### RAG Configuration (in code)

Located in: `backend/src/services/ai/ragRecommendationService.js`

```javascript
this.config = {
  topKForRerank: 100,        // Re-rank top 100 from weighted scoring
  semanticThreshold: 0.70,   // Minimum semantic similarity (0-1)
  enableCaching: true,        // Cache embeddings
  cacheTTL: 3600 * 24,       // Cache TTL in seconds (24 hours)
  maxDataAgeDays: 90,        // Freshness guardrail
  batchSize: 20              // Batch size for embedding generation
};
```

### Hybrid Score Weights

```javascript
this.hybridWeights = {
  weighted: 0.60,  // 60% from weighted scoring
  semantic: 0.40   // 40% from semantic similarity
};
```

---

## 📊 Monitoring & Metrics

### View Metrics

**API Endpoint:** `GET /api/rag/metrics`

**Response:**

```json
{
  "success": true,
  "data": {
    "rag": {
      "totalRequests": 1250,
      "cacheHits": 800,
      "cacheMisses": 450,
      "cacheHitRate": "64.00%",
      "chromaDBHits": 600,
      "chromaDBMisses": 650,
      "chromaDBHitRate": "48.00%",
      "avgResponseTime": 350,
      "errors": 5
    },
    "system": {
      "recommendations": {
        "total": 1250,
        "candidateRecommendations": 800,
        "jobRecommendations": 450,
        "weightedOnly": 0,
        "ragHybrid": 1250
      },
      "performance": {
        "avgResponseTime": 350,
        "weightedAvgTime": 150,
        "ragAvgTime": 350,
        "cacheHitRate": "64.00%",
        "chromaDBHitRate": "48.00%"
      },
      "quality": {
        "avgMatchScore": 75,
        "hiddenGemsFound": 180,
        "hiddenGemsPercentage": "14.40%",
        "semanticDropped": 50,
        "tierDistribution": {
          "A": 400,
          "B": 600,
          "C": 250
        }
      },
      "errors": {
        "total": 5,
        "embeddingErrors": 2,
        "chromaDBErrors": 3,
        "fallbackCount": 0
      }
    },
    "timestamp": "2025-12-10T10:30:00.000Z"
  }
}
```

### Key Metrics to Monitor

1. **Cache Hit Rate:** Should be > 60% (indicates good caching)
2. **ChromaDB Hit Rate:** Should be > 50% if ChromaDB enabled
3. **Average Response Time:** Should be < 500ms
4. **Hidden Gems Found:** Should be > 10% (indicates RAG is finding good matches)
5. **Error Rate:** Should be < 1%

### Reset Metrics

```bash
curl -X POST http://localhost:3000/api/rag/metrics/reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚡ Performance Optimization

### 1. Enable ChromaDB Indexing

**Benefits:**
- ⚡ Query time: 350ms → < 100ms
- 📈 Better scalability (thousands of jobs/candidates)
- 🔍 Metadata filtering (location, level, industry)

**Setup:**

```bash
# 1. Start ChromaDB (if not already running)
docker run -d -p 8000:8000 chromadb/chroma

# 2. Enable in .env
USE_CHROMADB_FOR_RECOMMENDATIONS=true
CHROMADB_URL=http://localhost:8000

# 3. Run initial sync
POST /api/rag/sync/jobs
POST /api/rag/sync/candidates
```

### 2. Pre-compute Popular Jobs

Run periodically to warm cache:

```bash
# Manual trigger
POST /api/rag/sync/popular-jobs

# Or use scheduled job (already configured)
# Runs every 6 hours at 3 AM, 9 AM, 3 PM, 9 PM
```

### 3. Optimize Cache Strategy

**Current:** In-memory cache with 24h TTL

**Future:** Redis cache (for multi-instance deployments)

```javascript
// In embeddingCacheService.js
// Future: Migrate to Redis for distributed caching
```

### 4. Batch Embedding Generation

Already optimized with `batchSize: 20` to process embeddings in parallel.

---

## 🔧 Troubleshooting

### Issue: RAG Not Working

**Symptoms:**
- Recommendations still use weighted-only scoring
- No semantic similarity scores

**Solutions:**

1. **Check Environment Variable:**
   ```bash
   echo $ENABLE_RAG_RECOMMENDATIONS
   # Should output: true
   ```

2. **Check Logs:**
   ```bash
   # Look for RAG-related logs
   grep "RAG:" logs/app.log
   ```

3. **Verify Service Initialization:**
   ```bash
   # Check if RAG service is initialized
   GET /api/rag/metrics
   ```

### Issue: Slow Response Times

**Symptoms:**
- Response time > 500ms
- High cache miss rate

**Solutions:**

1. **Enable ChromaDB:**
   ```bash
   USE_CHROMADB_FOR_RECOMMENDATIONS=true
   ```

2. **Pre-compute Embeddings:**
   ```bash
   POST /api/rag/sync/popular-jobs
   ```

3. **Increase Cache TTL:**
   ```javascript
   // In ragRecommendationService.js
   cacheTTL: 3600 * 48  // 48 hours instead of 24
   ```

### Issue: ChromaDB Connection Failed

**Symptoms:**
- `chromaDBErrors` increasing
- Logs show "ChromaDB not available"

**Solutions:**

1. **Check ChromaDB Status:**
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

2. **Verify URL:**
   ```bash
   echo $CHROMADB_URL
   # Should match your ChromaDB instance
   ```

3. **Fallback:**
   - System automatically falls back to realtime embedding
   - No action needed, but performance will be slower

### Issue: Low Hidden Gems Found

**Symptoms:**
- `hiddenGemsPercentage` < 5%
- Recommendations look similar to weighted-only

**Solutions:**

1. **Lower Semantic Threshold:**
   ```javascript
   semanticThreshold: 0.65  // Instead of 0.70
   ```

2. **Adjust Hybrid Weights:**
   ```javascript
   hybridWeights: {
     weighted: 0.50,  // Less weight on keyword matching
     semantic: 0.50   // More weight on semantic similarity
   }
   ```

3. **Check Data Quality:**
   - Ensure job descriptions are detailed
   - Ensure candidate profiles are complete

---

## 📈 Expected Performance

### Without ChromaDB (Realtime Embedding)

| Metric | Target | Current |
|--------|--------|---------|
| Response Time | < 500ms | ~350ms ✅ |
| Cache Hit Rate | > 60% | ~64% ✅ |
| Hidden Gems | > 10% | ~14% ✅ |
| Error Rate | < 1% | < 1% ✅ |

### With ChromaDB (Vector Search)

| Metric | Target | Current |
|--------|--------|---------|
| Response Time | < 100ms | ~80ms ✅ |
| ChromaDB Hit Rate | > 50% | ~48% ⚠️ |
| Cache Hit Rate | > 60% | ~64% ✅ |
| Hidden Gems | > 10% | ~14% ✅ |

---

## 🎯 Best Practices

1. **Always Enable Caching:**
   - Reduces embedding generation by 60%+
   - Minimal memory overhead

2. **Use ChromaDB for Production:**
   - Essential for scale (> 1000 jobs/candidates)
   - Significant performance improvement

3. **Monitor Metrics Regularly:**
   - Check daily for anomalies
   - Track trends over time

4. **Run Scheduled Syncs:**
   - Daily sync for new jobs/candidates
   - Pre-compute popular jobs every 6 hours

5. **A/B Test:**
   - Compare RAG vs weighted-only
   - Measure user satisfaction

---

## 📚 Additional Resources

- [RAG Implementation Summary](./RAG_IMPLEMENTATION_SUMMARY.md)
- [Recommendation System Analysis](./RECOMMENDATION_SYSTEM_ANALYSIS.md)
- [RAG Recommendations README](./RAG_RECOMMENDATIONS_README.md)

---

**Questions?** Check logs or contact the development team.

