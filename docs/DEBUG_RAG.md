# 🔍 Debug RAG - Hướng Dẫn Chi Tiết

## ✅ Đã Sửa

1. **Thiếu import `getRAGMetricsService`** - ✅ Đã sửa
2. **Controller không truyền `useRAG`** - ✅ Đã sửa  
3. **AIService không truyền `useRAG`** - ✅ Đã sửa

## 🚨 Vấn Đề Hiện Tại

RAG vẫn trả về 0 candidates. Có thể do:

### 1. Server chưa restart sau khi thêm env var

**QUAN TRỌNG:** Sau khi thêm `ENABLE_RAG_RECOMMENDATIONS=true` vào `.env`, **PHẢI RESTART SERVER**!

```bash
# Stop server (Ctrl+C)
# Rồi start lại:
npm run dev
```

### 2. Freshness Filter quá strict

RAG chỉ lấy candidates <= 90 ngày. Nếu candidates quá cũ sẽ bị filter.

**Check:** Xem candidates có `updatedAt` > 90 ngày không?

### 3. Semantic Threshold quá cao

Default: 0.70. Có thể không có candidates nào đạt.

**Giải pháp:** Có thể giảm xuống 0.60 trong code.

---

## 🔍 Debug Steps

### Bước 1: Check RAG có được enable không

```bash
# Check env var trong server
node -e "require('dotenv').config(); console.log('RAG:', process.env.ENABLE_RAG_RECOMMENDATIONS)"
```

### Bước 2: Test với debug script

```bash
npm run test:rag-debug 693178f33b9cc6488d1dac0c
```

Script sẽ:
- ✅ Check server health
- ✅ Test RAG endpoint
- ✅ Show response details
- ✅ Analyze kết quả

### Bước 3: Check Backend Logs

```bash
# Xem logs khi gọi API
tail -f logs/app.log | grep -i "RAG"
```

**Expected logs nếu RAG hoạt động:**
```
🔍 RAG: Finding candidates for job...
📊 RAG: Found X active candidates
✅ RAG: Filtered X candidates for re-ranking
```

**Nếu không thấy logs "RAG:"** → RAG không được gọi (check env var và restart)

### Bước 4: Test trực tiếp với curl

```bash
# Login để lấy token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cavangtrongboibenuoc@gmail.com","password":"password123"}'

# Test RAG endpoint
curl -X POST http://localhost:3000/api/ai/candidate-recommendations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"693178f33b9cc6488d1dac0c","limit":20,"minScore":40,"useRAG":true}'
```

---

## 🐛 Common Issues

### Issue 1: RAG không được gọi

**Symptoms:**
- Response không có `method: "rag-hybrid"`
- Logs không có "RAG:"

**Fix:**
1. Check `.env` có `ENABLE_RAG_RECOMMENDATIONS=true`
2. **RESTART SERVER** (quan trọng!)
3. Check logs có error không

### Issue 2: RAG trả về 0 candidates

**Symptoms:**
- Response có `method: "rag-hybrid"` nhưng `recommendations: []`

**Possible causes:**
1. **Freshness filter**: Candidates quá cũ (>90 ngày)
2. **Semantic threshold**: 0.70 quá cao
3. **Weighted filter**: Không có candidates nào đạt minScore 40

**Fix:**
1. Disable freshness filter tạm thời (trong code)
2. Giảm semantic threshold xuống 0.60
3. Giảm minScore xuống 30

### Issue 3: RAG fallback về weighted

**Symptoms:**
- Logs có "⚠️ RAG recommendation failed, falling back"

**Fix:**
1. Check Sentence-BERT available: `python python/sentence_bert_inference.py --check`
2. Check logs có error chi tiết không

---

## 📋 Checklist

- [ ] `.env` có `ENABLE_RAG_RECOMMENDATIONS=true`
- [ ] Server đã restart sau khi thêm env var
- [ ] Sentence-BERT available (`python python/sentence_bert_inference.py --check`)
- [ ] Test với `npm run test:rag-debug <jobId>`
- [ ] Check logs có "RAG:" messages không
- [ ] Response có `method: "rag-hybrid"` không

---

## 🎯 Next Steps

1. **Restart server** (quan trọng nhất!)
2. **Test với debug script**: `npm run test:rag-debug 693178f33b9cc6488d1dac0c`
3. **Check logs** để xem RAG có được gọi không
4. **Nếu vẫn 0 candidates**: Check freshness filter và semantic threshold

