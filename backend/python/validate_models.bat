@echo off
REM Script để validate các mô hình Python hoạt động chính xác (Windows)

echo 🚀 Validating Python ML Models...
echo.

REM Check Python version
echo 📋 Checking Python version...
python --version
if errorlevel 1 (
    echo ❌ Python not found!
    exit /b 1
)

REM Check dependencies
echo.
echo 📦 Checking dependencies...
python -c "import torch; import transformers; import sentence_transformers; print('✅ All dependencies installed')" 2>nul
if errorlevel 1 (
    echo ❌ Missing dependencies. Install with: pip install -r requirements.txt
    exit /b 1
)

REM Test PhoBERT
echo.
echo 🧪 Testing PhoBERT NER...
python test_models.py --model phobert

REM Test Sentence-BERT
echo.
echo 🧪 Testing Sentence-BERT...
python test_models.py --model sentencebert

echo.
echo ✅ Validation complete!

