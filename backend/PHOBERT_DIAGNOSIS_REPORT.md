# PhoBERT Model Diagnosis Report
**Date**: 2025-12-04
**Issue**: PhoBERT NER model không extract được skills từ CV text

---

## 🔍 Test Results

### Test 1: Basic Skill Extraction
**Input**: `"Tôi tên Nguyễn Văn A, tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT năm 2023. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software, làm cả backend và frontend. Biết thêm Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker. Tiếng Anh đọc viết tốt."`

**Expected Skills**: ReactJS, Node.js, Python, Java, NLP, PhoBERT, MySQL, MongoDB, Docker, Backend, Frontend, Tiếng Anh

**Actual Results**:
- ❌ Skills found: **0**
- ❌ Precision: 0%
- ❌ Recall: 0%

### Test 2: Simple Vietnamese Sentence
**Input**: `"Tôi có kinh nghiệm với Python và Java"`

**Expected**: Python, Java

**Actual Results**:
- ❌ Skills found: **0**

---

## ✅ What Works

1. **Model Loading**: Model loads successfully (~19s)
2. **Performance**: Inference speed is excellent
   - 1st extraction: 416ms
   - 2nd extraction: 118ms
3. **Persistent Server**: Works correctly, keeps model in memory
4. **Python-Node.js Communication**: Working perfectly

---

## ❌ What Doesn't Work

1. **Skill Extraction**: Model returns empty results for all inputs
2. **Model không nhận diện được bất kỳ skill nào** từ text

---

## 🔬 Model Information

**Path**: `models/phobert-cv-ner-final/`

**Files**:
- ✅ `config.json` - OK (RobertaForTokenClassification, 3 labels)
- ✅ `label_mapping.json` - OK (O, B-SKILL, I-SKILL)
- ✅ `model.safetensors` - 513 MB (model weights)
- ✅ `vocab.txt` - 875 KB (Vietnamese BPE vocab)
- ✅ `tokenizer_config.json` - OK

**Model Details**:
- Base model: `vinai/phobert-base`
- Architecture: `RobertaForTokenClassification`
- Labels: O (0), B-SKILL (1), I-SKILL (2)
- Hidden size: 768
- Layers: 12
- Vocab size: 64,001

---

## 🧪 Possible Causes

### Hypothesis 1: Model Not Actually Fine-tuned ⚠️ **MOST LIKELY**
**Evidence**:
- Model trả về tất cả tokens là label "O" (not a skill)
- Không nhận diện được ngay cả các skills rõ ràng như "Python", "Java"
- Có thể model.safetensors chỉ là base PhoBERT weights chưa được fine-tune

**Solution**:
```bash
# Check if model is actually fine-tuned
cd python
python -c "
from transformers import AutoModelForTokenClassification
model = AutoModelForTokenClassification.from_pretrained('../models/phobert-cv-ner-final')
print('Classifier weights:', model.classifier.weight.data[:3])
"
```

### Hypothesis 2: Training Data Issue
**Evidence**:
- Model có thể đã được train nhưng với dataset không tốt
- Hoặc training không converge

**Solution**:
- Cần re-train model với dataset chất lượng cao hơn
- Hoặc sử dụng dataset có sẵn từ research PhoBERT NER

### Hypothesis 3: Tokenization Issue
**Evidence**:
- PhoBERT tokenizer có thể cần Vietnamese word segmentation trước
- BPE encoding có thể không match với training data

**Solution**:
```python
# Try with word segmentation
from pyvi import ViTokenizer
text = "Tôi biết Python và Java"
segmented = ViTokenizer.tokenize(text)
# Then use PhoBERT
```

---

## 🛠️ Recommended Solutions

### Solution 1: Use Pre-trained PhoBERT NER Model ✅ **RECOMMENDED**

Thay vì tự train, sử dụng model đã được train sẵn:

```bash
# Option A: Use vinai/phobert-base-v2 và train lại với dataset tốt hơn
cd python
python finetune_phobert.py \
  --model_name vinai/phobert-base-v2 \
  --train_file ../thesis/datasets/processed/train.jsonl \
  --val_file ../thesis/datasets/processed/val.jsonl \
  --output_dir ../models/phobert-cv-ner-v2 \
  --num_epochs 5 \
  --batch_size 16 \
  --learning_rate 2e-5

# Option B: Sử dụng model đã được train từ research paper
# Download from: https://huggingface.co/NlpHUST/ner-vietnamese-electra-base
```

### Solution 2: Improve Current Model Training

Nếu muốn train lại model hiện tại:

**Steps**:
1. Check training data quality trong `thesis/datasets/`
2. Verify annotations có đúng format không
3. Re-train với hyperparameters tốt hơn:
   ```python
   # finetune_phobert.py
   training_args = TrainingArguments(
       output_dir='./models/phobert-cv-ner-improved',
       num_train_epochs=10,          # Tăng epochs
       per_device_train_batch_size=16,
       learning_rate=3e-5,            # Tăng learning rate
       warmup_steps=500,
       weight_decay=0.01,
       logging_steps=100,
       evaluation_strategy='epoch',
       save_strategy='epoch',
       load_best_model_at_end=True,
       metric_for_best_model='f1',
   )
   ```

### Solution 3: Use Rule-Based Fallback (TEMPORARY) ⚡

Trong khi chờ model được fix, sử dụng rule-based extraction:

**Current System Fallback**:
- System đã tự động fallback sang rule-based khi PhoBERT fail
- Rule-based tìm được: 5/12 skills (41.7% recall)
- Precision: 100% (tất cả skills tìm được đều đúng)

**Improve Rule-based**:
```javascript
// src/services/ai/ruleBasedCVParser.js
// Add more skill patterns
const SKILL_PATTERNS = {
  programming: /\b(ReactJS|React|Node\.?js|Python|Java|JavaScript|TypeScript|C\+\+|Go|Rust)\b/gi,
  frameworks: /\b(Express|Django|Flask|Spring|Laravel|Vue|Angular|Next\.?js)\b/gi,
  databases: /\b(MySQL|PostgreSQL|MongoDB|Redis|Cassandra|Oracle)\b/gi,
  tools: /\b(Docker|Kubernetes|Git|Jenkins|AWS|Azure|GCP)\b/gi,
  // Add more patterns...
};
```

---

## 📊 Comparison: PhoBERT vs Rule-Based

| Metric | PhoBERT (Current) | Rule-Based | Expected PhoBERT |
|--------|-------------------|------------|------------------|
| Precision | 0% | 100% | 94% |
| Recall | 0% | 41.7% | 90% |
| F1 Score | 0% | 58.8% | 92% |
| Speed | 416ms | <50ms | ~500ms |

**Conclusion**: Rule-based is currently MORE ACCURATE than PhoBERT model!

---

## ✅ Action Items

### Immediate (Do Now):
1. ✅ **Verify persistent PhoBERT service works** - DONE (416ms extraction time)
2. ⏰ **Use rule-based fallback** as primary method until PhoBERT is fixed
3. ⏰ **Document this issue** in CLAUDE.md

### Short-term (This Week):
1. 🔨 **Re-train PhoBERT model** with proper dataset and hyperparameters
2. 📊 **Evaluate trained model** on test dataset (target: F1 > 90%)
3. 🧪 **Test with real CVs** from `thesis/datasets/processed/test.jsonl`

### Long-term (Next Sprint):
1. 🚀 **Consider alternative models**:
   - viBERT (Vietnamese BERT)
   - XLM-RoBERTa (multilingual)
   - mBERT (multilingual BERT)
2. 📚 **Build better training dataset** with more examples
3. 🎯 **Fine-tune on domain-specific data** (recruitment CVs)

---

## 🧪 Testing Commands

```bash
# Test persistent PhoBERT (current implementation)
node test-persistent-phobert.js

# Test original PhoBERT (with timeout issues)
node test-skill-extraction.js

# Test rule-based fallback
node -e "
const service = require('./src/services/ai/ruleBasedCVParser');
const text = 'Tôi biết React, Node.js, và Python';
console.log(service.extractSkills(text));
"

# Evaluate PhoBERT on test dataset
node src/research/evaluation/quickEvaluate.js
```

---

## 📝 Summary

**Problem**: PhoBERT model không extract được skills (0% recall)

**Root Cause**: Model có thể chưa được fine-tune đúng cách, hoặc training data/process có vấn đề

**Current Workaround**: System tự động fallback sang rule-based extraction (41.7% recall, 100% precision)

**Performance Achievement**: Persistent server giảm latency từ 5000ms (timeout) xuống 416ms (1st) và 118ms (2nd+)

**Recommendation**:
1. **Immediate**: Sử dụng rule-based as primary (đang hoạt động tốt hơn PhoBERT)
2. **Short-term**: Re-train PhoBERT model với dataset và hyperparameters tốt hơn
3. **Long-term**: Xem xét sử dụng pre-trained NER models cho Vietnamese

---

**Next Steps**: Liên hệ với người train model để kiểm tra training process và dataset quality.
