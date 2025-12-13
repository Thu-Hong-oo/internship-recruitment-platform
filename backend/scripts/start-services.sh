#!/bin/sh
# Startup script to start all services in correct order
# Force output to be unbuffered
# Don't exit on error - we want to see all errors
set +e

# Set LD_LIBRARY_PATH to use newer SQLite from /usr/local/lib
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH

echo "🚀 Starting services..." >&2
echo "📚 LD_LIBRARY_PATH: $LD_LIBRARY_PATH" >&2

# Start Python model server in background
echo "📦 Starting Sentence-BERT model server..." >&2
python3 python/model_server.py >&2 &
MODEL_PID=$!
echo "Model server PID: $MODEL_PID" >&2

# Start ChromaDB embedded server in background
echo "🗄️ Starting ChromaDB embedded server..." >&2

# Test SQLite version and pysqlite3
echo "Testing SQLite version..." >&2
python3 -c "
import sys
try:
    import pysqlite3 as sqlite3
    sys.modules['sqlite3'] = sqlite3
    print('✅ Using pysqlite3', file=sys.stderr)
except ImportError:
    import sqlite3
    print('⚠️ Using system sqlite3', file=sys.stderr)

conn = sqlite3.connect(':memory:')
version = conn.execute('SELECT sqlite_version()').fetchone()[0]
conn.close()
print(f'📊 SQLite version: {version}', file=sys.stderr)
if tuple(map(int, version.split('.'))) < (3, 35, 0):
    print(f'❌ ERROR: SQLite {version} < 3.35.0 required by ChromaDB', file=sys.stderr)
    sys.exit(1)
else:
    print(f'✅ SQLite version OK', file=sys.stderr)
" 2>&1 || {
  echo "❌ ERROR: SQLite version check failed" >&2
  # Continue anyway, but ChromaDB will fail
}

# Test if chromadb can be imported
echo "Testing ChromaDB import..." >&2
python3 -c "
import sys
try:
    import pysqlite3 as sqlite3
    sys.modules['sqlite3'] = sqlite3
except ImportError:
    pass
import chromadb
print('✅ ChromaDB import OK', file=sys.stderr)
" 2>&1 || {
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
echo "⏳ Waiting for ChromaDB embedded server to be ready..." >&2
MAX_WAIT=60
ELAPSED=0
CHROMA_READY=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Try both v1 and v2 heartbeat endpoints
  if curl -f -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1 || \
     curl -f -s http://localhost:8001/api/v2/heartbeat > /dev/null 2>&1; then
    echo "✅ ChromaDB embedded server is ready!" >&2
    CHROMA_READY=true
    break
  fi
  echo "   Waiting for ChromaDB... (${ELAPSED}s elapsed)" >&2
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

if [ "$CHROMA_READY" = "false" ]; then
  echo "⚠️ Warning: ChromaDB embedded server may not be ready after ${MAX_WAIT}s, but continuing..." >&2
  echo "   Node.js server will retry connection with exponential backoff" >&2
fi

# Start Node.js server
echo "🌐 Starting Node.js server..."
exec node server.js

