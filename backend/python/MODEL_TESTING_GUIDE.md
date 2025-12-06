# Hướng Dẫn Test Các Mô Hình Python

## 📋 Tổng Quan Các Mô Hình

### 1. **PhoBERT NER Model** (`phobert_inference.py`)
**Chức năng:**
- Trích xuất kỹ năng (skills) từ CV text tiếng Việt
- Sử dụng Named Entity Recognition (NER) với model PhoBERT đã fine-tune
- Input: Text CV (tiếng Việt)
- Output: Danh sách kỹ năng được trích xuất

**Cách hoạt động:**
- Load model từ `models/phobert-cv-ner-final/`
- Tokenize text input
- Predict labels (B-SKILL, I-SKILL, O)
- Extract và clean skills từ predictions

**Metrics đánh giá:**
- Precision: 0.94
- Recall: 0.90
- F1 Score: 0.92
- Accuracy: 0.95

### 2. **Sentence-BERT Model** (`sentence_bert_inference.py`)
**Chức năng:**
- Tạo embeddings (vector biểu diễn) cho text
- Tính similarity (độ tương đồng) giữa 2 câu
- Hỗ trợ đa ngôn ngữ (tiếng Việt + tiếng Anh)

**Cách hoạt động:**
- Load model `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- Encode text thành vector 384 chiều
- Tính cosine similarity giữa 2 vectors

**Sử dụng cho:**
- Job matching (so khớp CV với job)
- Skill similarity (tìm kỹ năng tương tự)
- Semantic search

### 3. **Multilingual NER Model** (`multilingual_ner_server.py`)
**Chức năng:**
- Trích xuất entities (PER, ORG, LOC, MISC) từ text
- Hỗ trợ tiếng Anh và tiếng Việt
- Chạy dưới dạng persistent server

**Cách hoạt động:**
- Load model `dslim/bert-base-NER-uncased`
- Chạy persistent process để tránh load model nhiều lần
- Nhận requests qua stdin, trả về JSON qua stdout

## 🧪 Cách Test Các Mô Hình

### Option 1: Sử dụng Script Test Tự Động

```bash
# Test tất cả models
python test_models.py --model all

# Test chỉ PhoBERT
python test_models.py --model phobert

# Test chỉ Sentence-BERT
python test_models.py --model sentencebert
```

### Option 2: Test Thủ Công

#### Test PhoBERT:
```bash
# Test với text mẫu
echo "Tôi có kinh nghiệm với Python, Java, ReactJS" | python phobert_inference.py

# Expected output:
# {"success": true, "skills": ["Python", "Java", "ReactJS"], "count": 3}
```

#### Test Sentence-BERT:
```bash
# Encode text
python sentence_bert_inference.py encode "Tôi có kinh nghiệm với Python"

# Tính similarity
python sentence_bert_inference.py similarity "Python programming" "Lập trình Python"
```

#### Test Multilingual NER:
```bash
# Start server (trong terminal riêng)
python multilingual_ner_server.py

# Gửi request (trong terminal khác)
echo '{"text": "Tôi tên Nguyễn Văn A, làm việc tại FPT Software"}' | python -c "import sys, json; print(json.dumps(json.load(sys.stdin)))"
```

### Option 3: Test Từ Node.js Backend

```javascript
// Test PhoBERT
const phobertService = require('./services/phobertService');
const skills = await phobertService.extractSkills("Tôi có kinh nghiệm với Python, Java");
console.log("Extracted skills:", skills);

// Test Sentence-BERT
const sentenceBertService = require('./services/ai/sentenceBertService');
const embedding = await sentenceBertService.encode("Tôi có kinh nghiệm với Python");
console.log("Embedding dimension:", embedding.length);
```

## ✅ Checklist Validation

### PhoBERT Model:
- [ ] Model file tồn tại: `models/phobert-cv-ner-final/`
- [ ] Có thể load model thành công
- [ ] Extract được ít nhất 3/5 skills từ test case
- [ ] Không crash khi input rỗng
- [ ] Không crash khi input quá dài (>300 chars)

### Sentence-BERT Model:
- [ ] Model có thể download/load thành công
- [ ] Embedding dimension = 384
- [ ] Similarity giữa "Python" và "Lập trình Python" >= 0.7
- [ ] Không crash khi input rỗng

### Multilingual NER Model:
- [ ] Server có thể start thành công
- [ ] Model load thành công (check logs)
- [ ] Extract được PER, ORG, LOC từ test cases
- [ ] Server không crash sau nhiều requests

## 📊 Metrics Đánh Giá

### PhoBERT Performance (từ thesis):
- **Precision**: 0.94 (94% skills extracted là đúng)
- **Recall**: 0.90 (90% skills thực tế được tìm thấy)
- **F1 Score**: 0.92 (tổng hợp)
- **Accuracy**: 0.95

### So sánh với các phương pháp khác:
- **PhoBERT**: F1 = 0.92 ✅ (tốt nhất)
- **Gemini API**: F1 = 0.79
- **Rule-Based**: F1 = 0.68

## 🔍 Debugging

### Nếu PhoBERT không extract được skills:
1. Check model path: `models/phobert-cv-ner-final/`
2. Check model files: `config.json`, `label_mapping.json`, `model.safetensors`
3. Check logs trong `phobertService.js`
4. Test trực tiếp: `echo "Python Java" | python phobert_inference.py`

### Nếu Sentence-BERT timeout:
1. Check internet connection (model download)
2. Check disk space
3. Increase timeout trong `sentenceBertService.js`

### Nếu Multilingual NER không start:
1. Check Python dependencies: `pip install -r requirements.txt`
2. Check port conflicts
3. Check logs trong `multilingualNERService.js`

## 📝 Test Cases Mẫu

### PhoBERT Test Cases:
```python
test_cases = [
    {
        "input": "Tôi có kinh nghiệm với Python, Java, ReactJS",
        "expected": ["Python", "Java", "ReactJS"],
        "min_expected": 2
    },
    {
        "input": "Kỹ năng: Giao tiếp, làm việc nhóm. Công nghệ: C++, Docker",
        "expected": ["C++", "Docker"],
        "min_expected": 1
    }
]
```

### Sentence-BERT Test Cases:
```python
test_cases = [
    {
        "input1": "Python programming",
        "input2": "Lập trình Python",
        "expected_similarity": 0.7
    }
]
```

## 🚀 Quick Start Testing

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run automated tests
python test_models.py --model all

# 3. Check results
# ✅ All tests passed = Models hoạt động chính xác
# ❌ Some tests failed = Cần debug
```

## 📚 Tài Liệu Tham Khảo

- PhoBERT Paper: https://arxiv.org/abs/2003.00744
- Sentence-BERT: https://www.sbert.net/
- Hugging Face Transformers: https://huggingface.co/docs/transformers

