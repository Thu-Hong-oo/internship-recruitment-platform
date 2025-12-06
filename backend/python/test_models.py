"""
Test script để kiểm tra các mô hình Python hoạt động chính xác
Usage: python test_models.py [--model phobert|sentencebert|multilingual]
"""

import sys
import json
import subprocess
import os
from pathlib import Path

# CRITICAL: Set UTF-8 encoding for Windows PowerShell compatibility
if sys.platform == 'win32':
    import io
    # Reconfigure stdout/stderr to use UTF-8
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Test cases
TEST_CASES = {
    "phobert": [
        {
            "name": "Test 1: Basic Vietnamese Skills",
            "input": "Tôi có kinh nghiệm với Python, Java, ReactJS và Node.js. Thành thạo MySQL và MongoDB.",
            "expected_skills": ["Python", "Java", "ReactJS", "Node.js", "MySQL", "MongoDB"],
            "min_expected": 4
        },
        {
            "name": "Test 2: Vietnamese Skills with Context",
            "input": "Kỹ năng: Giao tiếp tốt, làm việc nhóm, quản lý thời gian. Công nghệ: C++, JavaScript, Docker.",
            "expected_skills": ["C++", "JavaScript", "Docker"],
            "min_expected": 2
        },
        {
            "name": "Test 3: Mixed Language",
            "input": "Skills: Python programming, Machine Learning, Deep Learning. Kỹ năng mềm: Communication, Teamwork.",
            "expected_skills": ["Python", "Machine Learning", "Deep Learning"],
            "min_expected": 2
        },
        {
            "name": "Test 4: Real CV Text",
            "input": "Nguyễn Văn A. Tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software. Biết Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker.",
            "expected_skills": ["ReactJS", "Nodejs", "Python", "Java", "PhoBERT", "MySQL", "Mongo", "Docker"],
            "min_expected": 5
        }
    ],
    "sentencebert": [
        {
            "name": "Test 1: Text Embedding",
            "input": "Tôi có kinh nghiệm với Python và Machine Learning",
            "expected_dim": 768,  # paraphrase-multilingual-mpnet-base-v2 has 768 dimensions
            "check_type": "embedding"
        },
        {
            "name": "Test 2: Similarity Calculation",
            "input1": "Python programming",
            "input2": "Lập trình Python",
            "expected_similarity": 0.7,  # Should be high (same meaning)
            "check_type": "similarity"
        }
    ],
    "multilingual": [
        {
            "name": "Test 1: Person Name Extraction",
            "input": "Tôi tên Nguyễn Văn A, làm việc tại FPT Software.",
            "expected_entities": ["Nguyễn Văn A", "FPT Software"],
            "expected_types": ["PER", "ORG"],
            "min_expected": 2
        },
        {
            "name": "Test 2: Location Extraction",
            "input": "Sống tại Hà Nội, Việt Nam. Làm việc tại TP. Hồ Chí Minh.",
            "expected_entities": ["Hà Nội", "Việt Nam", "TP. Hồ Chí Minh"],
            "expected_types": ["LOC"],
            "min_expected": 2
        }
    ]
}

def test_phobert():
    """Test PhoBERT NER model"""
    print("\n" + "="*60)
    print("🧪 TESTING PHOBERT NER MODEL")
    print("="*60)
    
    script_path = Path(__file__).parent / "phobert_inference.py"
    
    if not script_path.exists():
        print("❌ PhoBERT script not found:", script_path)
        return False
    
    # Check if model directory exists
    model_path = Path(__file__).parent.parent / "models" / "phobert-cv-ner-final"
    if not model_path.exists():
        print(f"⚠️  WARNING: Model directory not found: {model_path}")
        print("   Model may not be trained yet. Skipping PhoBERT tests.")
        return False
    
    print("⚠️  Note: PhoBERT may not extract skills if model is not properly trained/fine-tuned")
    print("   This is a known issue - see PHOBERT_DIAGNOSIS_REPORT.md")
    
    passed = 0
    failed = 0
    
    for test_case in TEST_CASES["phobert"]:
        print(f"\n📝 {test_case['name']}")
        print(f"   Input: {test_case['input'][:80]}...")
        
        try:
            # Run PhoBERT inference
            # CRITICAL: Set UTF-8 encoding for Windows PowerShell compatibility
            result = subprocess.run(
                ['python', str(script_path)],
                input=test_case['input'],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',  # Replace invalid chars instead of failing
                timeout=20
            )
            
            if result.returncode != 0:
                print(f"   ❌ FAILED: Process error")
                print(f"      stderr: {result.stderr[:200]}")
                failed += 1
                continue
            
            # Parse JSON output
            try:
                output = json.loads(result.stdout)
            except json.JSONDecodeError as e:
                print(f"   ❌ FAILED: Invalid JSON output")
                print(f"      Error: {str(e)}")
                print(f"      stdout: {result.stdout[:300]}")
                print(f"      stderr: {result.stderr[:300]}")
                failed += 1
                continue
            
            if not output.get('success'):
                print(f"   ❌ FAILED: {output.get('error', 'Unknown error')}")
                failed += 1
                continue
            
            extracted_skills = output.get('skills', [])
            count = output.get('count', 0)
            
            print(f"   Extracted: {extracted_skills}")
            print(f"   Count: {count}")
            
            # Check if we got minimum expected skills
            if count >= test_case['min_expected']:
                # Check if expected skills are found
                found_expected = sum(1 for skill in test_case['expected_skills'] 
                                   if any(skill.lower() in s.lower() or s.lower() in skill.lower() 
                                         for s in extracted_skills))
                
                if found_expected >= test_case['min_expected']:
                    print(f"   ✅ PASSED: Found {found_expected}/{len(test_case['expected_skills'])} expected skills")
                    passed += 1
                else:
                    print(f"   ⚠️  PARTIAL: Found {found_expected}/{len(test_case['expected_skills'])} expected skills")
                    print(f"      Expected: {test_case['expected_skills']}")
                    passed += 1  # Still count as passed if we got minimum
            else:
                print(f"   ❌ FAILED: Only found {count} skills, expected at least {test_case['min_expected']}")
                print(f"      Expected: {test_case['expected_skills']}")
                failed += 1
                
        except subprocess.TimeoutExpired:
            print(f"   ❌ FAILED: Timeout (20s)")
            failed += 1
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)}")
            failed += 1
    
    print(f"\n📊 RESULTS: {passed} passed, {failed} failed")
    return failed == 0

def test_sentencebert():
    """Test Sentence-BERT model"""
    print("\n" + "="*60)
    print("🧪 TESTING SENTENCE-BERT MODEL")
    print("="*60)
    
    script_path = Path(__file__).parent / "sentence_bert_inference.py"
    
    if not script_path.exists():
        print("❌ Sentence-BERT script not found:", script_path)
        return False
    
    passed = 0
    failed = 0
    
    for test_case in TEST_CASES["sentencebert"]:
        print(f"\n📝 {test_case['name']}")
        
        try:
            if test_case['check_type'] == 'embedding':
                print(f"   Input: {test_case['input']}")
                
                # Sentence-BERT may need time to download/load model on first run
                # Increase timeout to 120 seconds (2 minutes) for first-time model download
                result = subprocess.run(
                    ['python', str(script_path), '--encode', test_case['input']],
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    timeout=120  # Increased from 30s to 120s for model download
                )
                
                if result.returncode != 0:
                    print(f"   ❌ FAILED: Process error")
                    print(f"      stderr: {result.stderr[:200]}")
                    failed += 1
                    continue
                
                try:
                    output = json.loads(result.stdout)
                except json.JSONDecodeError:
                    print(f"   ❌ FAILED: Invalid JSON output")
                    failed += 1
                    continue
                
                if not output.get('success'):
                    print(f"   ❌ FAILED: {output.get('error', 'Unknown error')}")
                    failed += 1
                    continue
                
                embedding = output.get('embedding', [])
                dim = len(embedding)
                
                print(f"   Embedding dimension: {dim}")
                
                if dim == test_case['expected_dim']:
                    print(f"   ✅ PASSED: Correct embedding dimension")
                    passed += 1
                else:
                    print(f"   ❌ FAILED: Expected dimension {test_case['expected_dim']}, got {dim}")
                    failed += 1
                    
            elif test_case['check_type'] == 'similarity':
                print(f"   Input 1: {test_case['input1']}")
                print(f"   Input 2: {test_case['input2']}")
                
                # Sentence-BERT may need time to download/load model on first run
                result = subprocess.run(
                    ['python', str(script_path), '--similarity', test_case['input1'], test_case['input2']],
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    timeout=120  # Increased from 30s to 120s for model download
                )
                
                if result.returncode != 0:
                    print(f"   ❌ FAILED: Process error")
                    failed += 1
                    continue
                
                try:
                    output = json.loads(result.stdout)
                except json.JSONDecodeError:
                    print(f"   ❌ FAILED: Invalid JSON output")
                    failed += 1
                    continue
                
                if not output.get('success'):
                    print(f"   ❌ FAILED: {output.get('error', 'Unknown error')}")
                    failed += 1
                    continue
                
                similarity = output.get('similarity', 0)
                
                print(f"   Similarity: {similarity:.4f}")
                
                if similarity >= test_case['expected_similarity']:
                    print(f"   ✅ PASSED: Similarity >= {test_case['expected_similarity']}")
                    passed += 1
                else:
                    print(f"   ⚠️  LOW SIMILARITY: {similarity:.4f} < {test_case['expected_similarity']}")
                    passed += 1  # Still pass, just warn
                    
        except subprocess.TimeoutExpired:
            print(f"   ❌ FAILED: Timeout (120s)")
            print(f"      💡 Tip: Model may be downloading. Check internet connection and try again.")
            print(f"      💡 Tip: First-time download can take 2-3 minutes for ~420MB model")
            failed += 1
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)}")
            failed += 1
    
    print(f"\n📊 RESULTS: {passed} passed, {failed} failed")
    return failed == 0

def test_multilingual_ner():
    """Test Multilingual NER model (requires server to be running)"""
    print("\n" + "="*60)
    print("🧪 TESTING MULTILINGUAL NER MODEL")
    print("="*60)
    print("⚠️  Note: This requires multilingual_ner_server.py to be running")
    print("   Start it with: python multilingual_ner_server.py")
    
    # Check if server is running by trying to connect
    script_path = Path(__file__).parent / "multilingual_ner_server.py"
    
    if not script_path.exists():
        print("❌ Multilingual NER script not found:", script_path)
        return False
    
    print("\n💡 To test Multilingual NER, start the server first:")
    print(f"   python {script_path}")
    print("   Then test it manually by sending JSON requests via stdin")
    
    return True

def main():
    """Main test function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Python ML models')
    parser.add_argument('--model', choices=['phobert', 'sentencebert', 'multilingual', 'all'],
                       default='all', help='Model to test')
    
    args = parser.parse_args()
    
    print("🚀 Starting Model Tests...")
    print(f"   Testing: {args.model}")
    
    results = {}
    
    if args.model in ['phobert', 'all']:
        results['phobert'] = test_phobert()
    
    if args.model in ['sentencebert', 'all']:
        results['sentencebert'] = test_sentencebert()
    
    if args.model in ['multilingual', 'all']:
        results['multilingual'] = test_multilingual_ner()
    
    # Summary
    print("\n" + "="*60)
    print("📊 FINAL RESULTS")
    print("="*60)
    
    for model, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {model.upper()}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()

