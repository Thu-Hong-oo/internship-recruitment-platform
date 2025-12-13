#!/bin/sh
# Startup script to start all services in correct order
# Force output to be unbuffered
# Don't exit on error - we want to see all errors
set +e

echo "🚀 Starting services..." >&2

# Start Python model server in background
echo "📦 Starting Sentence-BERT model server..." >&2
python3 python/model_server.py >&2 &
MODEL_PID=$!
echo "Model server PID: $MODEL_PID" >&2

# Start ChromaDB embedded server in background
echo "🗄️ Starting ChromaDB embedded server..." >&2

# Test if chromadb can be imported
echo "Testing ChromaDB import..." >&2
python3 -c "import chromadb; print('ChromaDB import OK')" 2>&1 || {
  echo "❌ ERROR: ChromaDB cannot be imported. Check if it's installed." >&2
  echo "Run: pip install chromadb" >&2
  # Don't exit, continue anyway
}

# Start ChromaDB server and capture both stdout and stderr
echo "Starting ChromaDB embedded server process..." >&2
python3 -u python/chromadb_embedded_server.py 2>&1 &
CHROMA_PID=$!
echo "ChromaDB server PID: $CHROMA_PID" >&2

# Wait a moment and check if process is still running
sleep 3
if ! kill -0 $CHROMA_PID 2>/dev/null; then
  echo "❌ ERROR: ChromaDB server process died immediately after start" >&2
  echo "Check Python errors above" >&2
  # Try to see what happened
  wait $CHROMA_PID 2>&1 || true
else
  echo "✅ ChromaDB server process is running (PID: $CHROMA_PID)" >&2
fi

# Wait for ChromaDB to be ready
echo "⏳ Waiting for ChromaDB embedded server to be ready..."
MAX_WAIT=30
ELAPSED=0
CHROMA_READY=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
  if curl -f -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1; then
    echo "✅ ChromaDB embedded server is ready!"
    CHROMA_READY=true
    break
  fi
  echo "   Waiting for ChromaDB... (${ELAPSED}s elapsed)"
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

if [ "$CHROMA_READY" = "false" ]; then
  echo "⚠️ Warning: ChromaDB embedded server may not be ready, but continuing..."
fi

# Start Node.js server
echo "🌐 Starting Node.js server..."
exec node server.js

