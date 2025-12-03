# Research Scripts - Quick Reference

## 📊 Dataset Generation

```bash
# Generate 500 synthetic Vietnamese CVs
node src/research/datasets/generateDataset.js 500

# Download Kaggle datasets
set KAGGLE_API_TOKEN=your_token
node src/research/datasets/downloadKaggle.js

# Parse Kaggle CSV to JSON
node src/research/datasets/parseKaggleData.js

# Merge and split datasets
node src/research/datasets/mergeDatasets.js
```

**Output**: `thesis/datasets/processed/train.jsonl`, `val.jsonl`, `test.jsonl` (2900 CVs total)

---

## 🏋️ Model Training

```bash
# Local training (requires GPU)
cd python
pip install -r requirements.txt
python finetune_phobert.py --data_dir ../thesis/datasets/processed --epochs 10

# Google Colab (recommended)
# 1. Open notebooks/PhoBERT_Training_Colab.ipynb in Colab
# 2. Upload train/val/test.jsonl
# 3. Run all cells (~2 hours on T4 GPU)
```

**Output**: `models/phobert-cv-ner/` (trained model)

---

## 📈 Evaluation

```bash
# Run evaluation on 100 test CVs
node src/research/evaluation/modelEvaluator.js --test-size 100

# Full test set (436 CVs)
node src/research/evaluation/modelEvaluator.js
```

**Output**: `thesis/results/evaluation-results.json`, `evaluation-report.txt`

---

## 📊 Generate Charts

```bash
cd python
python generate_charts.py
```

**Output**: 
- `thesis/figures/` - PNG/PDF charts
- `thesis/tables/` - LaTeX tables

---

## 📁 Project Structure

```
backend/
├── src/research/
│   ├── datasets/
│   │   ├── syntheticCVGenerator.js     # Generate synthetic CVs
│   │   ├── generateDataset.js          # Main dataset script
│   │   ├── downloadKaggle.js           # Download Kaggle data
│   │   ├── parseKaggleData.js          # Parse CSV to JSON
│   │   └── mergeDatasets.js            # Merge & split
│   ├── evaluation/
│   │   └── modelEvaluator.js           # Compare models
│   └── benchmark/
│       └── (future: SOTA comparison)
├── python/
│   ├── finetune_phobert.py             # PhoBERT training
│   ├── generate_charts.py              # Visualization
│   └── requirements.txt                # Python dependencies
├── notebooks/
│   └── PhoBERT_Training_Colab.ipynb    # Google Colab notebook
└── thesis/
    ├── datasets/
    │   ├── raw/                        # Kaggle downloads
    │   └── processed/                  # train/val/test splits
    ├── results/                        # Evaluation results
    ├── figures/                        # Charts for thesis
    └── tables/                         # LaTeX tables
```

---

## ✅ Progress Checklist

### Phase 1: Dataset Collection (Week 1-2) ✅
- [x] Generate 500 synthetic Vietnamese CVs
- [x] Download 23,478 Kaggle CVs
- [x] Parse and structure data
- [x] Merge and split (2900 CVs: 70/15/15)

### Phase 2: Training (Week 3) 🔄
- [x] Create training scripts
- [ ] Train PhoBERT on Google Colab (~2 hours)
- [ ] Save model to Hugging Face Hub

### Phase 3: Evaluation (Week 4-5) 🔄
- [x] Build evaluation framework
- [ ] Run experiments (Rule-based, Gemini, PhoBERT, Hybrid)
- [ ] Generate comparison charts
- [ ] Ablation studies

### Phase 4: Thesis Writing (Week 6-8) ⏳
- [ ] Write methodology (Chapter 3)
- [ ] Document experiments (Chapter 5)
- [ ] Write results & discussion (Chapter 6)
- [ ] Conclusion & future work (Chapter 7)

---

## 🎯 Key Metrics

| Model | Precision | Recall | F1 | Time |
|-------|-----------|--------|-----|------|
| Rule-based | 0.70 | 0.65 | 0.67 | ~5ms |
| Gemini API | 0.85 | 0.80 | 0.82 | ~200ms |
| PhoBERT | 0.92 | 0.88 | 0.90 | ~50ms |
| Hybrid | 0.95 | 0.92 | 0.93 | ~100ms |

*(Targets - actual results will vary)*

---

## 📝 Next Steps

1. **Train PhoBERT**:
   - Upload datasets to Google Colab
   - Run training notebook (~2 hours)
   - Download trained model

2. **Run Evaluation**:
   - Integrate trained model into evaluator
   - Compare all 4 approaches
   - Generate charts

3. **Write Thesis**:
   - Chapter 5: Experiments & Results
   - Include all charts and tables
   - Discuss findings

---

## 🐛 Troubleshooting

**Dataset errors**: Check file paths in `thesis/datasets/processed/`

**Training OOM**: Reduce batch size to 8 in training script

**Evaluation slow**: Use `--test-size 50` for quick testing

**Charts not generating**: Install matplotlib, seaborn: `pip install matplotlib seaborn`

---

## 📚 References

- PhoBERT: https://github.com/VinAIResearch/PhoBERT
- Kaggle Dataset: https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset
- Transformers: https://huggingface.co/docs/transformers
