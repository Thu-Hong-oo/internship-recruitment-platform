"""
PhoBERT NER Inference for CV Skill Extraction
Usage: python phobert_inference.py <text>
"""

import sys
import json
import os
from transformers import AutoTokenizer, AutoModelForTokenClassification
import torch

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'phobert-cv-ner-final')

def load_model():
    """Load PhoBERT model and tokenizer"""
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)
        model.eval()
        
        # Load label mapping
        with open(os.path.join(MODEL_PATH, 'label_mapping.json'), 'r') as f:
            label_mapping = json.load(f)
        
        return tokenizer, model, label_mapping
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to load model: {str(e)}", "skills": [], "count": 0}), file=sys.stderr, flush=True)
        sys.exit(1)

def extract_skills(text, tokenizer, model, label_mapping):
    """Extract skills from text using NER"""
    try:
        id2label = label_mapping['id2label']
        
        # Tokenize
        tokens = tokenizer(text, return_tensors='pt', truncation=True, max_length=256)
        
        # Get predictions
        with torch.no_grad():
            outputs = model(**tokens)
            predictions = torch.argmax(outputs.logits, dim=2)
        
        # Convert tokens back to words
        input_ids = tokens['input_ids'][0].tolist()
        token_predictions = predictions[0].tolist()
        
        # Decode tokens
        word_tokens = tokenizer.convert_ids_to_tokens(input_ids)
        
        # Extract skills
        skills = []
        current_skill = []
        
        for i, (token, pred_id) in enumerate(zip(word_tokens, token_predictions)):
            # Skip special tokens
            if token in ['<s>', '</s>', '<pad>']:
                continue
            
            label = id2label[str(pred_id)]
            
            if label == 'B-SKILL':
                # Start new skill
                if current_skill:
                    skills.append(''.join(current_skill).replace('_', ' ').strip())
                current_skill = [token]
            elif label == 'I-SKILL' and current_skill:
                # Continue current skill
                current_skill.append(token)
            else:
                # Not a skill
                if current_skill:
                    skills.append(''.join(current_skill).replace('_', ' ').strip())
                    current_skill = []
        
        # Add last skill if exists
        if current_skill:
            skills.append(''.join(current_skill).replace('_', ' ').strip())
        
        # Clean up skills (remove duplicates, clean formatting)
        cleaned_skills = []
        for skill in skills:
            # Remove underscore artifacts from BPE tokenization
            skill = skill.replace('@@', '')
            skill = ' '.join(skill.split())  # Normalize whitespace
            
            if skill and skill not in cleaned_skills:
                cleaned_skills.append(skill)
        
        return cleaned_skills
    
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Extraction failed: {str(e)}", "skills": [], "count": 0}), file=sys.stderr, flush=True)
        return []

def main():
    """Main function"""
    try:
        # Check if --check flag is provided
        if len(sys.argv) > 1 and sys.argv[1] == '--check':
            # Return success for health check
            result = {
                "success": True,
                "skills": [],
                "count": 0
            }
            print(json.dumps(result, ensure_ascii=False), flush=True)
            return
        
        # Read text from stdin (not command line argument)
        if sys.stdin.isatty():
            error_result = {
                "success": False,
                "error": "No text provided in stdin",
                "skills": [],
                "count": 0
            }
            print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr, flush=True)
            sys.exit(1)
        
        text = sys.stdin.read().strip()
        
        if not text:
            result = {
                "success": True,
                "skills": [],
                "count": 0
            }
            print(json.dumps(result, ensure_ascii=False), flush=True)
            return
        
        # Load model
        try:
            tokenizer, model, label_mapping = load_model()
        except Exception as e:
            error_result = {
                "success": False,
                "error": f"Failed to load model: {str(e)}",
                "skills": [],
                "count": 0
            }
            print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr, flush=True)
            sys.exit(1)
        
        # Extract skills
        try:
            skills = extract_skills(text, tokenizer, model, label_mapping)
        except Exception as e:
            error_result = {
                "success": False,
                "error": f"Extraction failed: {str(e)}",
                "skills": [],
                "count": 0
            }
            print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr, flush=True)
            sys.exit(1)
        
        # Output as JSON
        result = {
            "success": True,
            "skills": skills,
            "count": len(skills)
        }
        
        print(json.dumps(result, ensure_ascii=False), flush=True)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "skills": [],
            "count": 0
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr, flush=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
