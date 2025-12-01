# PhoBERT Training Scripts

## 📋 Overview

Fine-tune **PhoBERT** (Vietnamese BERT) for CV skill extraction using Named Entity Recognition (NER).

---

## 🚀 Quick Start

### Option 1: Local Training (Requires GPU)

```bash
# Install dependencies
pip install -r requirements.txt

# Train
python finetune_phobert.py \
    --data_dir ../thesis/datasets/processed \
    --output_dir ./models/phobert-cv-ner \
    --batch_size 16 \
    --epochs 10
```

### Option 2: Google Colab (Recommended - Free GPU)

1. Open `notebooks/PhoBERT_Training_Colab.ipynb` in Google Colab
2. Change runtime to GPU (Runtime → Change runtime type → GPU)
3. Upload `train.jsonl`, `val.jsonl`, `test.jsonl`
4. Run all cells (⏱️ ~2 hours on T4 GPU)

---

## 📊 Dataset Format

### Input (JSONL)

```json
{
  "id": 1,
  "cv": {
    "skills": ["Python", "JavaScript", "React"],
    "education": [...],
    "experience": [...]
  },
  "rawText": "THÔNG TIN CÁ NHÂN\nHọ và tên: Nguyễn Văn A...",
  "dataSource": "synthetic"
}
```

### Labels (NER Tags)

- `O` - Outside any entity
- `B-SKILL`, `I-SKILL` - Skill entities
- `B-EDU`, `I-EDU` - Education entities
- `B-EXP`, `I-EXP` - Experience entities
- `B-CERT`, `I-CERT` - Certification entities

---

## 🎯 Training Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Model | vinai/phobert-base | Pre-trained Vietnamese BERT |
| Task | Token Classification (NER) | Named Entity Recognition |
| Optimizer | AdamW | Weight decay 0.01 |
| Learning Rate | 2e-5 | Standard for BERT fine-tuning |
| Batch Size | 16 | Per device |
| Epochs | 10 | With early stopping |
| Max Length | 512 tokens | Truncate long CVs |
| Mixed Precision | FP16 | If GPU available |

---

## 📈 Expected Results

| Metric | Target | Description |
|--------|--------|-------------|
| Precision | > 0.85 | Correct positive predictions |
| Recall | > 0.80 | Find all entities |
| F1 Score | > 0.82 | Harmonic mean |
| Accuracy | > 0.90 | Overall correctness |

---

## 🔧 Advanced Usage

### Push to Hugging Face Hub

```bash
python finetune_phobert.py \
    --data_dir ../thesis/datasets/processed \
    --output_dir ./models/phobert-cv-ner \
    --push_to_hub \
    --hub_model_id your-username/phobert-cv-ner
```

### Custom Hyperparameters

```bash
python finetune_phobert.py \
    --batch_size 32 \
    --epochs 15 \
    --learning_rate 3e-5
```

---

## 📁 Output Files

After training:

```
models/phobert-cv-ner/
├── config.json                 # Model configuration
├── pytorch_model.bin           # Model weights
├── tokenizer_config.json       # Tokenizer config
├── vocab.txt                   # Vocabulary
├── label_mapping.json          # Label mappings
└── training_args.bin           # Training arguments
```

---

## 🐛 Troubleshooting

### Out of Memory

```bash
# Reduce batch size
python finetune_phobert.py --batch_size 8
```

### Slow Training

```bash
# Use gradient accumulation
python finetune_phobert.py --batch_size 8 --gradient_accumulation_steps 2
```

### CUDA Not Available

- Use Google Colab (free GPU)
- Or train on CPU (very slow):

```bash
python finetune_phobert.py --no_cuda
```

---

## 📚 References

- **PhoBERT Paper**: [PhoBERT: Pre-trained language models for Vietnamese](https://arxiv.org/abs/2003.00744)
- **Hugging Face**: [vinai/phobert-base](https://huggingface.co/vinai/phobert-base)
- **Dataset**: 2,900 CVs (500 synthetic + 2,400 real Kaggle)

---

## ✅ Next Steps

1. ✅ Train PhoBERT model
2. ⏳ Integrate into backend API
3. ⏳ Create evaluation framework
4. ⏳ Compare with baselines (Rule-based, Gemini)
5. ⏳ Write thesis Chapter 5
