# 🔧 RAG Troubleshooting Guide

## Vấn đề: RAG trả về 0 candidates

### Nguyên nhân có thể:

1. **RAG chưa được enable**
   - Check `.env` có `ENABLE_RAG_RECOMMENDATIONS=true`
   - Restart server sau khi thêm

2. **Endpoint không truyền `useRAG` option**
   - ✅ Đã sửa: `aiController.getCandidateRecommendations()` giờ truyền `useRAG`
   - ✅ Đã sửa: `aiService.getCandidateRecommendations()` giờ truyền `useRAG` xuống service

3. **Sentence-BERT không available**
   - Check: `python python/sentence_bert_inference.py --check`
   - ✅ Đã verify: Model loaded successfully

4. **Freshness filter quá strict**
   - RAG filter candidates <= 90 days old
   - Có thể candidates quá cũ

5. **Semantic threshold quá cao**
   - Default: 0.70
   - Có thể không có candidates nào đạt threshold

---

## ✅ Đã Sửa

### 1. Controller truyền useRAG option

**File:** `backend/src/controllers/aiController.js`

```javascript
const useRAG = req.body.useRAG === true || process.env.ENABLE_RAG_RECOMMENDATIONS === 'true';
const recommendations = await aiService.getCandidateRecommendations(
  job,
  candidates,
  {
    limit: parseInt(limit),
    minScore: parseInt(minScore),
    useRAG: useRAG // ✅ Now passed
  }
);
```

### 2. AIService truyền useRAG xuống service

**File:** `backend/src/services/ai/aiService.js`

```javascript
const { useRAG = process.env.ENABLE_RAG_RECOMMENDATIONS === 'true' } = options;
const result = await candidateRecommendationService.getRecommendations(
  job,
  {
    limit,
    minScore,
    includeSkillGap: true,
    tierFilter: ['A', 'B', 'C'],
    useRAG: useRAG // ✅ Now passed
  }
);
```

---

## 🧪 Test Sau Khi Sửa

### Bước 1: Enable RAG trong .env

```bash
ENABLE_RAG_RECOMMENDATIONS=true
```

### Bước 2: Restart Server

```bash
npm run dev
```

### Bước 3: Test lại

```bash
npm run test:rag-comparison 693178f33b9cc6488d1dac0c
```

### Bước 4: Check Logs

```bash
# Check RAG logs
tail -f logs/app.log | grep -i "RAG"

# Expected logs:
# 🔍 RAG: Finding candidates for job...
# 📊 RAG: Found X active candidates
# ✅ RAG: Filtered X candidates for re-ranking
```

---

## 🔍 Debug Steps

### 1. Check RAG có được gọi không

```bash
# Check logs khi gọi API
grep "RAG:" logs/app.log
```

Nếu không thấy logs "RAG:", có nghĩa RAG không được gọi.

### 2. Check Freshness Filter

RAG filter candidates <= 90 days old. Nếu candidates quá cũ:

```javascript
// Tạm thời disable freshness filter trong code
filterByFreshness: false
```

### 3. Check Semantic Threshold

Nếu semantic similarity quá thấp, có thể không có candidates nào pass:

```javascript
// Check trong ragRecommendationService.js
semanticThreshold: 0.70 // Có thể giảm xuống 0.60
```

### 4. Test với minScore thấp hơn

```bash
# Test với minScore = 30 thay vì 40
npm run test:rag-comparison <jobId>
# Sửa trong test script: minScore: 30
```

---

## 📊 Expected Behavior

Sau khi sửa, RAG sẽ:

1. ✅ Nhận `useRAG: true` từ request
2. ✅ Gọi `ragRecommendationService.getCandidateRecommendations()`
3. ✅ Filter candidates với weighted scoring
4. ✅ Re-rank với semantic similarity
5. ✅ Return hybrid scores

---

## 🎯 Kết Luận

**Đã sửa:** Controller và AIService giờ truyền `useRAG` option đúng cách.

**Cần làm:**
1. Enable RAG trong `.env`: `ENABLE_RAG_RECOMMENDATIONS=true`
2. Restart server
3. Test lại

**Nếu vẫn 0 candidates:**
- Check freshness filter (candidates có quá cũ không?)
- Check semantic threshold (có thể giảm xuống 0.60)
- Check logs để debug chi tiết

