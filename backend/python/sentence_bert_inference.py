"""
Sentence-BERT Inference Service
Self-sufficient semantic similarity and embedding generation

Model: sentence-transformers/paraphrase-multilingual-mpnet-base-v2
Supports: Vietnamese, English, and 50+ languages

Usage:
    python sentence_bert_inference.py --check
    python sentence_bert_inference.py --encode "text to encode"
    python sentence_bert_inference.py --similarity "text1" "text2"
    python sentence_bert_inference.py --encode-batch '["text1", "text2"]'
    python sentence_bert_inference.py --similarity-batch "query" '["doc1", "doc2"]'
    python sentence_bert_inference.py --similarity-matrix '["text1", "text2", "text3"]'
"""

import sys
import json
import argparse
from typing import List, Union
import numpy as np

try:
    from sentence_transformers import SentenceTransformer, util
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

# Model name
# Lighter VN model to reduce RAM/timeouts
# Alternatives: 'keepitreal/vietnamese-sbert', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
MODEL_NAME = "bkai-foundation-models/vietnamese-bi-encoder"

# CẢI TIẾN: Cache directory để tránh download model mỗi lần
import os
CACHE_DIR = os.path.join(os.path.dirname(__file__), '../models/sentence_bert_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

model = None


def load_model():
    """Load Sentence-BERT model (cached after first load)"""
    global model
    
    if model is None:
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers not installed. "
                "Install with: pip install sentence-transformers"
            )
        
        try:
            # CẢI TIẾN: Tăng timeout cho HuggingFace API và sử dụng cache local
            import os
            os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '120'  # 2 minutes timeout
            
            # Load từ cache directory, tránh download lại
            model = SentenceTransformer(
                MODEL_NAME, 
                cache_folder=CACHE_DIR,
                device='cpu'  # Force CPU để tránh CUDA overhead
            )
            print(f"Model {MODEL_NAME} loaded successfully from cache", file=sys.stderr)
        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")
    
    return model


def encode_text(text: str) -> List[float]:
    """
    Encode single text into 768-dimensional vector
    
    Args:
        text: Input text (any language)
    
    Returns:
        768-dimensional embedding vector
    """
    model = load_model()
    embedding = model.encode(text, convert_to_tensor=False)
    return embedding.tolist()


def encode_batch(texts: List[str]) -> List[List[float]]:
    """
    Encode multiple texts into embeddings (batch processing)
    
    Args:
        texts: List of input texts
    
    Returns:
        List of 768-dimensional embeddings
    """
    model = load_model()
    embeddings = model.encode(texts, convert_to_tensor=False, batch_size=32)
    return [emb.tolist() for emb in embeddings]


def calculate_similarity(text1: str, text2: str) -> float:
    """
    Calculate cosine similarity between two texts
    
    Args:
        text1: First text
        text2: Second text
    
    Returns:
        Similarity score (0.0 to 1.0)
    """
    model = load_model()
    
    # Encode both texts
    embeddings = model.encode([text1, text2], convert_to_tensor=True)
    
    # Calculate cosine similarity
    similarity = util.cos_sim(embeddings[0], embeddings[1])
    
    # Convert to float (0-1 range)
    return float(similarity[0][0])


def calculate_similarity_batch(query: str, documents: List[str]) -> List[float]:
    """
    Calculate similarity between query and multiple documents
    
    Args:
        query: Query text
        documents: List of document texts
    
    Returns:
        List of similarity scores (0.0 to 1.0)
    """
    model = load_model()
    
    # Encode query
    query_embedding = model.encode(query, convert_to_tensor=True)
    
    # Encode documents (batch)
    doc_embeddings = model.encode(documents, convert_to_tensor=True, batch_size=32)
    
    # Calculate cosine similarities
    similarities = util.cos_sim(query_embedding, doc_embeddings)[0]
    
    return [float(sim) for sim in similarities]


def calculate_similarity_matrix(texts: List[str]) -> List[List[float]]:
    """
    Calculate pairwise similarity matrix for all texts
    
    Args:
        texts: List of texts
    
    Returns:
        NxN similarity matrix
    """
    model = load_model()
    
    # Encode all texts
    embeddings = model.encode(texts, convert_to_tensor=True, batch_size=32)
    
    # Calculate cosine similarity matrix
    similarity_matrix = util.cos_sim(embeddings, embeddings)
    
    # Convert to list of lists
    return [[float(sim) for sim in row] for row in similarity_matrix]


def check_availability():
    """Check if model is available"""
    try:
        load_model()
        return {
            "success": True,
            "available": True,
            "model": MODEL_NAME,
            "embedding_dim": 768
        }
    except Exception as e:
        return {
            "success": False,
            "available": False,
            "error": str(e)
        }


def main():
    parser = argparse.ArgumentParser(description="Sentence-BERT Inference Service")
    parser.add_argument('--check', action='store_true', help='Check model availability')
    parser.add_argument('--encode', type=str, help='Encode single text')
    parser.add_argument('--encode-batch', nargs='+', help='Encode multiple texts (JSON array or tokens)')
    parser.add_argument('--similarity', nargs=2, metavar=('TEXT1', 'TEXT2'), 
                        help='Calculate similarity between two texts')
    parser.add_argument('--similarity-batch', nargs='+', metavar=('QUERY', 'DOCS'), 
                        help='Calculate similarity between query and documents (JSON array or tokens)')
    parser.add_argument('--similarity-matrix', type=str, 
                        help='Calculate similarity matrix (JSON array of texts)')
    
    # Use parse_known_args to avoid hard failures with extra tokens from PowerShell
    args, unknown = parser.parse_known_args()
    if args.encode_batch and unknown:
        args.encode_batch = list(args.encode_batch) + unknown
        unknown = []
    if args.similarity_batch and unknown:
        args.similarity_batch = list(args.similarity_batch) + unknown
        unknown = []
    
    try:
        result = {}
        
        if args.check:
            result = check_availability()
        
        elif args.encode:
            embedding = encode_text(args.encode)
            result = {
                "success": True,
                "embedding": embedding,
                "dimension": len(embedding)
            }
        
        elif args.encode_batch:
            # PowerShell có thể tách đối số, ghép lại rồi parse JSON.
            raw_parts = args.encode_batch
            batch_json = raw_parts[0] if len(raw_parts) == 1 else ' '.join(raw_parts)
            try:
                texts = json.loads(batch_json)
            except Exception:
                texts = raw_parts

            if not isinstance(texts, list):
                texts = [str(texts)]

            embeddings = encode_batch(texts)
            result = {
                "success": True,
                "embeddings": embeddings,
                "count": len(embeddings),
                "dimension": len(embeddings[0]) if embeddings else 0
            }
        
        elif args.similarity:
            text1, text2 = args.similarity
            similarity = calculate_similarity(text1, text2)
            result = {
                "success": True,
                "similarity": similarity
            }
        
        elif args.similarity_batch:
            query = args.similarity_batch[0]
            # Ghép các token docs lại (đã set nargs='+')
            docs_raw = args.similarity_batch[1:]
            docs_json = docs_raw[0] if len(docs_raw) == 1 else ' '.join(docs_raw)

            try:
                documents = json.loads(docs_json)
            except Exception:
                # Fallback: coi các token còn lại là danh sách document thô
                documents = docs_raw

            if not isinstance(documents, list):
                raise ValueError("Documents must be a JSON array of strings")

            similarities = calculate_similarity_batch(query, documents)
            result = {
                "success": True,
                "similarities": similarities,
                "count": len(similarities)
            }
        
        elif args.similarity_matrix:
            texts = json.loads(args.similarity_matrix)
            if not isinstance(texts, list):
                raise ValueError("Input must be a JSON array of strings")
            
            matrix = calculate_similarity_matrix(texts)
            result = {
                "success": True,
                "matrix": matrix,
                "size": f"{len(matrix)}x{len(matrix[0])}" if matrix else "0x0"
            }
        
        else:
            parser.print_help()
            sys.exit(1)
        
        # Output JSON
        print(json.dumps(result, ensure_ascii=False))
    
    except Exception as e:
        error_result = {
            "success": False,
            "available": False,
            "error": str(e),
            "type": type(e).__name__,
            "traceback": None
        }
        # Print error to stderr for debugging
        import traceback
        error_result["traceback"] = traceback.format_exc()
        print(f"Error: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
