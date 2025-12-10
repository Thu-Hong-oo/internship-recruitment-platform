# 🔍 So Sánh 3 Services: PhoBERT, Sentence-BERT, Multilingual NER

**Lưu ý quan trọng:** Sentence-BERT **KHÔNG phải NER**, mà là **Embedding Service**

---

## 📊 Tổng Quan

### Thực ra chỉ có **2 NER services**:

1. **PhoBERT NER** - Extract skills từ Vietnamese CVs
2. **Multilingual NER** - Extract skills từ English/Mixed CVs

### Và **1 Embedding Service**:

3. **Sentence-BERT** - Tạo embeddings cho semantic similarity (KHÔNG phải NER)

---

## 🎯 Chi Tiết Từng Service

### 1. 📝 PhoBERT NER

**Mục đích:** Extract skills từ **Vietnamese CVs**

**Model:** PhoBERT (Vietnamese BERT) - Fine-tuned cho NER

**Performance:**
- ✅ **Vietnamese CVs:** 96% F1 score
- ❌ **English CVs:** Poor performance
- ⚠️ **Mixed CVs:** OK

**Status:**
- ⚠️ **DISABLED** (timeout issues)
- ⚠️ **DEPRECATED** trong code (usePhoBERT=false)

**Files:**
- `backend/src/services/phobertService.js`
- `backend/src/services/phobertPersistentService.js`

**Khi nào dùng:**
- ✅ Vietnamese-only CVs
- ❌ Không dùng hiện tại (disabled)

---

### 2. 🌐 Multilingual NER

**Mục đích:** Extract skills từ **English/Mixed CVs**

**Model:** `dslim/bert-base-NER-uncased`

**Performance:**
- ✅ **English CVs:** 90% recall
- ✅ **Mixed CVs:** ~95% recall
- ⚠️ **Vietnamese CVs:** Partial (PhoBERT tốt hơn)

**Status:**
- ⚠️ **Optional** (có thể disable)
- ✅ **Active** trong Hybrid System

**Files:**
- `backend/src/services/multilingualNERService.js`

**Khi nào dùng:**
- ✅ English-only CVs
- ✅ Mixed language CVs
- ❌ Vietnamese-only CVs (dùng rule-based thay vì)

**Environment:**
```bash
ENABLE_MULTILINGUAL_NER=true  # Default
# hoặc
ENABLE_MULTILINGUAL_NER=false # Disable nếu không có Python
```

---

### 3. 🧠 Sentence-BERT (KHÔNG phải NER!)

**Mục đích:** Tạo **embeddings** (vectors) cho semantic similarity

**Model:** `paraphrase-multilingual-mpnet-base-v2` (768 dimensions)

**Performance:**
- ✅ **Semantic similarity:** Rất tốt
- ✅ **Multilingual:** Hỗ trợ nhiều ngôn ngữ
- ✅ **Fast:** Pre-warmed model

**Status:**
- ✅ **ACTIVE** và quan trọng
- ✅ **Required** cho RAG recommendations

**Files:**
- `backend/src/services/ai/sentenceBertService.js`

**Khi nào dùng:**
- ✅ **CV-Job matching** (semantic similarity)
- ✅ **RAG recommendations** (embedding generation)
- ✅ **Skill matching** (semantic similarity)
- ✅ **Vector search** (ChromaDB indexing)

**KHÔNG dùng để:**
- ❌ Extract skills (không phải NER)
- ❌ Named entity recognition

---

## 📋 So Sánh Chi Tiết

| Feature | PhoBERT NER | Multilingual NER | Sentence-BERT |
|---------|-------------|------------------|---------------|
| **Type** | NER (Skill Extraction) | NER (Skill Extraction) | Embedding Service |
| **Vietnamese CVs** | ✅ 96% F1 | ⚠️ Partial | ✅ Good (embeddings) |
| **English CVs** | ❌ Poor | ✅ 90% recall | ✅ Good (embeddings) |
| **Mixed CVs** | ⚠️ OK | ✅ ~95% recall | ✅ Good (embeddings) |
| **Status** | ⚠️ DISABLED | ✅ Optional | ✅ **REQUIRED** |
| **Dependencies** | Python + Model | Python + Model | Python + Model |
| **Use Case** | Extract skills (VN) | Extract skills (EN) | Semantic similarity |
| **Output** | Skills array | Skills array | 768-dim vector |

---

## 🎯 Recommendation: Nên Dùng Cái Nào?

### **Cho Vietnamese CVs:**

**Primary:** Rule-based (300+ patterns)
- ✅ 100% recall
- ✅ Fast (instant)
- ✅ No dependencies

**Fallback:** PhoBERT NER (nếu enable)
- ⚠️ Hiện tại disabled
- ✅ 96% F1 nếu hoạt động

### **Cho English CVs:**

**Primary:** Multilingual NER
- ✅ 90% recall
- ⚠️ Cần Python

**Fallback:** Rule-based
- ⚠️ ~70% recall
- ✅ No dependencies

### **Cho Semantic Similarity (Tất cả ngôn ngữ):**

**Required:** Sentence-BERT
- ✅ **BẮT BUỘC** cho RAG recommendations
- ✅ **BẮT BUỘC** cho CV-Job matching
- ✅ Multilingual support

---

## 🚀 Strategy Hiện Tại trong Code

### **Hybrid Skill Extraction Service:**

```javascript
// Strategy 1: Vietnamese CVs (>80% Vietnamese)
→ Rule-based (300+ patterns) // 100% recall

// Strategy 2: English CVs (<20% Vietnamese)
→ Multilingual NER // 90% recall
→ + Rule-based supplement

// Strategy 3: Mixed CVs (20-80% Vietnamese)
→ Multilingual NER + Rule-based // ~95% recall
```

### **Job Matching Service:**

```javascript
// Skill Matching (40%):
→ Sentence-BERT (semantic similarity) // REQUIRED
→ TF-IDF + Cosine Similarity

// Other matching:
→ Rule-based scoring
```

### **RAG Recommendations:**

```javascript
// Embedding generation:
→ Sentence-BERT (REQUIRED) // Tạo embeddings

// Re-ranking:
→ Semantic similarity (Sentence-BERT)
→ + Weighted scoring
```

---

## ✅ Kết Luận

### **NER Services (Extract Skills):**

1. **PhoBERT NER:**
   - ❌ **DISABLED** (không dùng)
   - ⚠️ Có thể enable sau khi fix timeout

2. **Multilingual NER:**
   - ✅ **OPTIONAL** (có thể disable)
   - ✅ Dùng cho English CVs
   - ⚠️ Cần Python

### **Embedding Service (Semantic Similarity):**

3. **Sentence-BERT:**
   - ✅ **REQUIRED** (bắt buộc)
   - ✅ Dùng cho RAG, matching, similarity
   - ✅ Không thể disable

---

## 🎯 Action Items

### **Cho Koyeb Deployment:**

1. **Sentence-BERT:** ✅ **KEEP** (required)
2. **Multilingual NER:** ⚠️ **DISABLE** (nếu không có Python)
   ```bash
   ENABLE_MULTILINGUAL_NER=false
   ```
3. **PhoBERT NER:** ❌ **ALREADY DISABLED** (không cần làm gì)

### **Cho Local Development:**

1. **Sentence-BERT:** ✅ **KEEP** (required)
2. **Multilingual NER:** ✅ **ENABLE** (nếu có Python)
3. **PhoBERT NER:** ⚠️ **OPTIONAL** (có thể enable nếu fix được)

---

## 📊 Summary Table

| Service | Type | Status | Required? | Use Case |
|---------|------|--------|-----------|----------|
| **PhoBERT NER** | NER | ❌ Disabled | ❌ No | Vietnamese skills (deprecated) |
| **Multilingual NER** | NER | ✅ Optional | ❌ No | English skills |
| **Sentence-BERT** | Embedding | ✅ Active | ✅ **YES** | Semantic similarity |

---

**Tóm lại:**
- **PhoBERT NER:** Disabled, không dùng
- **Multilingual NER:** Optional, dùng cho English CVs
- **Sentence-BERT:** **REQUIRED**, dùng cho semantic similarity (không phải NER)

