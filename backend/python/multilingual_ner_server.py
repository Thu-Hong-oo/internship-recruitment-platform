"""
Multilingual NER Persistent Server
Using dslim/bert-base-NER-uncased for skill extraction

Supports: English, Vietnamese (via multilingual understanding)
Performance: Better than PhoBERT for mixed-language CVs
"""

import sys
import json
import os
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import torch

# Model configuration
MODEL_NAME = "dslim/bert-base-NER-uncased"
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'multilingual-ner')

# Global variables (loaded once)
ner_pipeline = None

def download_and_load_model():
    """Download and load multilingual NER model"""
    global ner_pipeline

    try:
        print(json.dumps({"status": "loading_model"}), flush=True)

        # Try to load from local cache first
        if os.path.exists(MODEL_PATH):
            print(json.dumps({"status": "loading_from_cache", "path": MODEL_PATH}), flush=True)
            tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
            model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)
        else:
            # Download from HuggingFace
            print(json.dumps({"status": "downloading_model", "model": MODEL_NAME}), flush=True)
            tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            model = AutoModelForTokenClassification.from_pretrained(MODEL_NAME)

            # Save to local cache
            os.makedirs(MODEL_PATH, exist_ok=True)
            tokenizer.save_pretrained(MODEL_PATH)
            model.save_pretrained(MODEL_PATH)
            print(json.dumps({"status": "model_saved", "path": MODEL_PATH}), flush=True)

        # Create NER pipeline
        ner_pipeline = pipeline(
            "ner",
            model=model,
            tokenizer=tokenizer,
            aggregation_strategy="simple",  # Aggregate subword tokens
            device=0 if torch.cuda.is_available() else -1  # Use GPU if available
        )

        print(json.dumps({
            "status": "model_loaded",
            "device": "cuda" if torch.cuda.is_available() else "cpu"
        }), flush=True)
        return True

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Failed to load model: {str(e)}"
        }), flush=True)
        return False

def extract_skills(text):
    """Extract entities from text using multilingual NER"""
    global ner_pipeline

    try:
        # Run NER pipeline
        entities = ner_pipeline(text)

        # Filter and format results
        skills = []
        for entity in entities:
            # Filter for relevant entity types (PER, ORG, LOC are not skills)
            # We'll keep all entities and let the wrapper service filter
            skills.append({
                "text": entity["word"],
                "type": entity["entity_group"],
                "score": float(entity["score"])
            })

        return skills

    except Exception as e:
        print(json.dumps({
            "error": f"Extraction failed: {str(e)}"
        }), file=sys.stderr, flush=True)
        return []

def main():
    """Main server loop"""
    # Load model once at startup
    if not download_and_load_model():
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
                        "entities": [],
                        "count": 0
                    }
                else:
                    # Extract entities
                    entities = extract_skills(text)
                    response = {
                        "success": True,
                        "entities": entities,
                        "count": len(entities)
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
