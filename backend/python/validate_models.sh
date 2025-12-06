#!/bin/bash
# Script để validate các mô hình Python hoạt động chính xác

echo "🚀 Validating Python ML Models..."
echo ""

# Check Python version
echo "📋 Checking Python version..."
python --version || python3 --version

# Check dependencies
echo ""
echo "📦 Checking dependencies..."
python -c "import torch; import transformers; import sentence_transformers; print('✅ All dependencies installed')" 2>/dev/null || {
    echo "❌ Missing dependencies. Install with: pip install -r requirements.txt"
    exit 1
}

# Test PhoBERT
echo ""
echo "🧪 Testing PhoBERT NER..."
python test_models.py --model phobert

# Test Sentence-BERT
echo ""
echo "🧪 Testing Sentence-BERT..."
python test_models.py --model sentencebert

echo ""
echo "✅ Validation complete!"

