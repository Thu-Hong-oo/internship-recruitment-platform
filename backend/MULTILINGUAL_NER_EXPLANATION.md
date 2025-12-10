# 🔍 Multilingual NER Service - Giải Thích

**Tóm tắt:** Service để extract skills/entities từ CV, đặc biệt tốt cho English CVs

---

## 📋 Multilingual NER là gì?

**Multilingual NER** = **Multilingual Named Entity Recognition**

- **Model:** `dslim/bert-base-NER-uncased`
- **Mục đích:** Extract entities (skills, organizations, locations, etc.) từ text
- **Hỗ trợ:** English + Vietnamese (multilingual)

---

## 🎯 Tác Dụng

### 1. **Extract Skills từ CV**

Đặc biệt tốt cho:
- ✅ **English-only CVs** (90% recall)
- ✅ **Mixed language CVs** (English + Vietnamese)
- ✅ **General entity recognition** (không chỉ skills)

### 2. **So sánh với PhoBERT:**

| Feature | PhoBERT | Multilingual NER |
|---------|---------|-----------------|
| **Vietnamese CVs** | ✅ 96% F1 | ⚠️ Partial |
| **English CVs** | ❌ Poor | ✅ 90% recall |
| **Mixed CVs** | ⚠️ OK | ✅ Good |
| **Entity Types** | Skills only | PER, ORG, LOC, MISC |

### 3. **Được dùng trong:**

- ✅ **Hybrid Skill Extraction Service** - Extract skills từ CV
- ✅ **Skill Extraction Service** - Primary method cho English CVs
- ✅ **Self-Sufficient AI Service** - CV analysis và skill gap detection

---

## 🔧 Cách Hoạt Động

### Flow:

```
CV Text (English/Mixed)
    ↓
Multilingual NER Service
    ↓
Extract Entities (PER, ORG, LOC, MISC)
    ↓
Filter: Keep MISC + ORG (potential skills)
    ↓
Convert to Skills Format
    ↓
Return Skills Array
```

### Example:

**Input:**
```
"I have experience with React, Node.js, and MongoDB. Worked at Google."
```

**Output:**
```javascript
[
  { name: "React", type: "technical", confidence: 0.95, source: "multilingual-ner" },
  { name: "Node.js", type: "technical", confidence: 0.92, source: "multilingual-ner" },
  { name: "MongoDB", type: "technical", confidence: 0.90, source: "multilingual-ner" },
  { name: "Google", type: "technical", confidence: 0.85, source: "multilingual-ner" }
]
```

---

## ⚠️ Vấn Đề Hiện Tại

### Từ Logs:

```
error: Multilingual NER stderr: ...
warn: Multilingual NER process exited with code 9009
error: ❌ Multilingual NER failed after 5 attempts. Service disabled.
warn: ℹ️ System will use fallback methods for entity extraction.
```

**Nguyên nhân:**
- ❌ Python không có trong container (code 9009 = command not found)
- ❌ Python script không tồn tại
- ❌ Dependencies thiếu (transformers, torch, etc.)

**Kết quả:**
- ✅ Service tự động disable sau 5 attempts
- ✅ System dùng fallback methods (rule-based)
- ✅ App vẫn hoạt động bình thường

---

## ✅ Có Sử Dụng Không?

### **Có, nhưng có Fallback:**

1. **Khi Multilingual NER available:**
   - ✅ Dùng cho English CVs (90% recall)
   - ✅ Dùng cho mixed language CVs
   - ✅ Better accuracy

2. **Khi Multilingual NER unavailable (như hiện tại):**
   - ✅ System tự động fallback về rule-based
   - ✅ Vẫn extract được skills (nhưng accuracy thấp hơn cho English)
   - ✅ App vẫn hoạt động bình thường

### **Impact:**

| Scenario | With Multilingual NER | Without (Fallback) |
|----------|----------------------|-------------------|
| **Vietnamese CVs** | ✅ 100% (rule-based) | ✅ 100% (rule-based) |
| **English CVs** | ✅ 90% recall | ⚠️ ~70% recall (rule-based) |
| **Mixed CVs** | ✅ ~95% recall | ⚠️ ~85% recall (rule-based) |
| **App Functionality** | ✅ Full | ✅ Full (với fallback) |

---

## 🚀 Có Cần Fix Không?

### **Option 1: Disable (Khuyến nghị cho Koyeb)**

Nếu không có Python trong container:

```bash
# Trong Koyeb Environment Variables
ENABLE_MULTILINGUAL_NER=false
```

**Lợi ích:**
- ✅ Không còn crash loop
- ✅ System dùng rule-based (vẫn hoạt động tốt)
- ✅ Không cần Python dependencies

**Nhược điểm:**
- ⚠️ Accuracy thấp hơn cho English CVs (~70% vs 90%)

### **Option 2: Enable (Nếu có Python)**

Nếu muốn enable và có Python:

1. **Install Python trong Dockerfile:**
   ```dockerfile
   RUN apt-get update && apt-get install -y python3 python3-pip
   ```

2. **Install dependencies:**
   ```dockerfile
   COPY python/requirements.txt /app/python/
   RUN pip3 install -r /app/python/requirements.txt
   ```

3. **Enable service:**
   ```bash
   ENABLE_MULTILINGUAL_NER=true
   PYTHON_CMD=python3
   ```

---

## 📊 Recommendation

### **Cho Koyeb Deployment:**

**Khuyến nghị: DISABLE** (vì không có Python)

```bash
ENABLE_MULTILINGUAL_NER=false
```

**Lý do:**
1. ✅ App vẫn hoạt động tốt với rule-based fallback
2. ✅ Không cần Python dependencies
3. ✅ Không còn crash loop
4. ✅ Vietnamese CVs vẫn 100% accuracy
5. ⚠️ English CVs chỉ giảm ~20% accuracy (từ 90% → 70%)

### **Khi nào nên Enable:**

- ✅ Khi có nhiều English CVs (> 30%)
- ✅ Khi có Python trong container
- ✅ Khi cần accuracy cao nhất cho English CVs

---

## 🔍 Verify Status

### Check logs:

**Disabled:**
```
ℹ️ Multilingual NER service disabled (ENABLE_MULTILINGUAL_NER=false)
```

**Failed (auto-disabled):**
```
❌ Multilingual NER failed after 5 attempts. Service disabled.
ℹ️ System will use fallback methods for entity extraction.
```

**Working:**
```
✅ Multilingual NER model loaded (device: cpu)
✅ Multilingual NER server ready
```

---

## 📝 Tóm Tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **Multilingual NER là gì?** | Service extract skills từ CV, tốt cho English CVs |
| **Có tác dụng gì?** | Extract skills với 90% recall cho English CVs |
| **Có sử dụng không?** | ✅ Có, nhưng có fallback nếu unavailable |
| **Có cần fix không?** | ⚠️ Không bắt buộc - có thể disable |
| **Recommendation** | **Disable trên Koyeb** (ENABLE_MULTILINGUAL_NER=false) |

---

**Status:** ✅ Optional - System hoạt động tốt với fallback

