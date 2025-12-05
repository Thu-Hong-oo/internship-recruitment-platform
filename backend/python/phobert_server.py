"""
PhoBERT NER Persistent Server
Load model once and keep running to handle multiple requests
"""

import sys
import json
import os
from transformers import AutoTokenizer, AutoModelForTokenClassification
import torch

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'phobert-cv-ner-final')

# Global model variables (loaded once)
tokenizer = None
model = None
label_mapping = None

def load_model_once():
    """Load PhoBERT model and tokenizer once at startup"""
    global tokenizer, model, label_mapping

    try:
        print(json.dumps({"status": "loading_model"}), flush=True)

        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)
        model.eval()

        # Load label mapping
        with open(os.path.join(MODEL_PATH, 'label_mapping.json'), 'r') as f:
            label_mapping = json.load(f)

        print(json.dumps({"status": "model_loaded"}), flush=True)
        return True
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Failed to load model: {str(e)}"}), flush=True)
        return False

def extract_skills(text):
    """Extract skills from text using NER"""
    global tokenizer, model, label_mapping

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
        print(json.dumps({"error": f"Extraction failed: {str(e)}"}), file=sys.stderr, flush=True)
        return []

def main():
    """Main server loop"""
    # Load model once at startup
    if not load_model_once():
        sys.exit(1)

    print(json.dumps({"status": "ready"}), flush=True)

    # Process requests in a loop
    while True:
        try:
            # Read request line
            line = sys.stdin.readline()
            if not line:
                break  # EOF

            line = line.strip()
            if not line:
                continue

            # Parse request
            try:
                request = json.loads(line)
                text = request.get('text', '')

                if not text:
                    response = {
                        "success": True,
                        "skills": [],
                        "count": 0
                    }
                else:
                    # Extract skills
                    skills = extract_skills(text)
                    response = {
                        "success": True,
                        "skills": skills,
                        "count": len(skills)
                    }

                print(json.dumps(response, ensure_ascii=False), flush=True)

            except json.JSONDecodeError as e:
                error_response = {
                    "success": False,
                    "error": f"Invalid JSON: {str(e)}"
                }
                print(json.dumps(error_response, ensure_ascii=False), flush=True)

        except Exception as e:
            error_response = {
                "success": False,
                "error": f"Server error: {str(e)}"
            }
            print(json.dumps(error_response, ensure_ascii=False), file=sys.stderr, flush=True)

if __name__ == '__main__':
    main()
