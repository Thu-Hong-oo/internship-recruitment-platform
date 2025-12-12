#!/bin/sh
# Startup script to start all services in correct order

echo "🚀 Starting services..."

# Start Python model server in background
echo "📦 Starting Sentence-BERT model server..."
python3 python/model_server.py &
MODEL_PID=$!

# Start ChromaDB embedded server in background
echo "🗄️ Starting ChromaDB embedded server..."
python3 python/chromadb_embedded_server.py &
CHROMA_PID=$!

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

