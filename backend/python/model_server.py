"""
Persistent Sentence-BERT model server (stdin/stdout).

Usage: Node.js spawns once, waits for line "MODEL_READY",
then sends JSON per line. Each request must include an "id"
and "action" field.

Supported actions:
- "encode": { "text": "..." }
- "encode_batch": { "texts": ["..."] }
- "similarity": { "text1": "...", "text2": "..." }
- "similarity_batch": { "query": "...", "docs": ["..."] }
- "similarity_matrix": { "texts": ["..."] }

Responses:
{ "id": <id>, "success": true, ... } or { "id": <id>, "success": false, "error": "..." }
"""

import sys
import json
from typing import List

try:
    from sentence_transformers import SentenceTransformer, util
except ImportError:
    print(json.dumps({"id": None, "success": False, "error": "sentence-transformers not installed"}))
    sys.exit(1)

MODEL_NAME = "bkai-foundation-models/vietnamese-bi-encoder"


def load_model():
    return SentenceTransformer(MODEL_NAME)


model = load_model()
print("MODEL_READY", flush=True)


def encode_texts(texts: List[str]):
    # Return list of list[float]
    return model.encode(texts, convert_to_tensor=False, show_progress_bar=False).tolist()


def handle_request(req: dict):
    action = req.get("action")
    req_id = req.get("id")

    try:
        if action == "encode":
            text = req.get("text", "")
            embeddings = encode_texts([text])
            return {"id": req_id, "success": True, "embedding": embeddings[0], "dimension": len(embeddings[0]) if embeddings else 0}

        if action == "encode_batch":
            texts = req.get("texts") or []
            embeddings = encode_texts(texts)
            return {"id": req_id, "success": True, "embeddings": embeddings, "count": len(embeddings), "dimension": len(embeddings[0]) if embeddings else 0}

        if action == "similarity":
            t1 = req.get("text1", "")
            t2 = req.get("text2", "")
            emb = model.encode([t1, t2], convert_to_tensor=True, show_progress_bar=False)
            sim = util.cos_sim(emb[0], emb[1]).item()
            return {"id": req_id, "success": True, "similarity": sim}

        if action == "similarity_batch":
            query = req.get("query", "")
            docs = req.get("docs") or []
            q_emb = model.encode([query], convert_to_tensor=True, show_progress_bar=False)
            d_emb = model.encode(docs, convert_to_tensor=True, show_progress_bar=False)
            scores = util.cos_sim(q_emb, d_emb).squeeze(0).tolist()
            return {"id": req_id, "success": True, "similarities": scores, "count": len(scores)}

        if action == "similarity_matrix":
            texts = req.get("texts") or []
            emb = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
            mat = util.cos_sim(emb, emb).tolist()
            return {"id": req_id, "success": True, "matrix": mat, "size": f"{len(mat)}x{len(mat[0])}" if mat else "0x0"}

        return {"id": req_id, "success": False, "error": f"Unknown action: {action}"}
    except Exception as e:
        return {"id": req_id, "success": False, "error": str(e), "type": type(e).__name__}


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            print(json.dumps({"id": None, "success": False, "error": "Invalid JSON"}))
            sys.stdout.flush()
            continue

        resp = handle_request(req)
        print(json.dumps(resp, ensure_ascii=False))
        sys.stdout.flush()


if __name__ == "__main__":
    main()

