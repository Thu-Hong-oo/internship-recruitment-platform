# 🚀 Hướng Dẫn Enable RAG Recommendations

## ⚡ Quick Start

### Bước 1: Enable RAG trong .env

Thêm vào file `.env`:

```bash
ENABLE_RAG_RECOMMENDATIONS=true
```

### Bước 2: Restart Server

```bash
npm run dev
```

### Bước 3: Test

```bash
# Test so sánh RAG vs Weighted
npm run test:rag-comparison <jobId>

# Hoặc test thông thường
npm run test:recommendations <jobId>
```

---

## 📊 So Sánh Nhanh

### Weighted Scoring (Không RAG)
- ⚡ Nhanh: ~150ms
- ✅ Đơn giản
- ❌ Chỉ match keywords
- ❌ Bỏ sót "hidden gems"

### RAG-Enhanced (Có RAG)
- 🧠 Thông minh: Hiểu ngữ nghĩa
- ✅ Chính xác hơn: +15-25% recall
- ✅ Tìm hidden gems
- ⚠️ Chậm hơn: ~350ms (vẫn acceptable)

---

## 🎯 Khi Nào Nên Dùng RAG?

### ✅ Nên dùng khi:
- Production environment
- Dataset lớn (>100 candidates/jobs)
- Skills có nhiều biến thể ("JS" vs "JavaScript")
- Cần độ chính xác cao

### ❌ Không cần khi:
- Development/testing
- Dataset nhỏ (<50)
- Cần tốc độ tối đa (<200ms)
- Sentence-BERT chưa available

---

## 🔍 Verify RAG Đã Enable

### Check 1: Environment Variable

```bash
# Windows PowerShell
$env:ENABLE_RAG_RECOMMENDATIONS

# Linux/Mac
echo $ENABLE_RAG_RECOMMENDATIONS
```

### Check 2: Backend Logs

Khi gọi API, check logs:

```
✅ RAG: Finding candidates for job...
✅ RAG: Filtered X candidates for re-ranking
✅ RAG: Generated X recommendations
```

### Check 3: API Response

Response sẽ có:
```json
{
  "method": "rag-hybrid",
  "metadata": {
    "semanticReranked": 45,
    "avgSemanticScore": "0.847"
  }
}
```

---

## 🧪 Test So Sánh

Chạy script so sánh:

```bash
node test-rag-comparison.js <jobId>
```

Script sẽ:
1. Test Weighted Scoring
2. Test RAG-Enhanced
3. So sánh kết quả
4. Đưa ra kết luận

---

## 📈 Expected Results

Sau khi enable RAG, bạn sẽ thấy:

1. **Nhiều candidates hơn** (+15-25%)
2. **Hidden gems được phát hiện** (candidates tốt nhưng keyword khác)
3. **Semantic scores** trong response
4. **Better explanations** (tại sao match tốt)

---

## ⚙️ Advanced Configuration

### Optional: ChromaDB (Faster)

Nếu có ChromaDB:

```bash
USE_CHROMADB_FOR_RECOMMENDATIONS=true
CHROMADB_URL=http://localhost:8000
```

### Custom Weights

Edit `ragRecommendationService.js`:

```javascript
this.hybridWeights = {
  weighted: 0.60,  // 60% weighted
  semantic: 0.40   // 40% semantic
};
```

---

## 🐛 Troubleshooting

### RAG không hoạt động?

1. Check `.env` có `ENABLE_RAG_RECOMMENDATIONS=true`
2. Restart server
3. Check Sentence-BERT available:
   ```bash
   python3 backend/python/sentence_bert_inference.py --check
   ```
4. Check logs có error không

### Performance chậm?

1. Enable ChromaDB caching
2. Giảm `topKForRerank` (default: 100)
3. Tăng `batchSize` (default: 20)

---

**Happy Testing! 🎉**

