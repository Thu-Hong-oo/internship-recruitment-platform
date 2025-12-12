FROM node:20-bullseye-slim

ARG APP_PATH=backend

WORKDIR /app

# Install build dependencies for native modules (sharp, etc.)
# Also install Python and pip for Sentence-BERT service
# Install curl for health checks
# Install sqlite3 and libsqlite3-dev for ChromaDB
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    build-essential \
    curl \
    sqlite3 \
    libsqlite3-dev \
    && ln -sf python3 /usr/bin/python \
    && ln -sf pip3 /usr/bin/pip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files (default path backend, override by setting APP_PATH build-arg)
COPY ${APP_PATH}/package*.json ./

# Install dependencies
# Try npm ci first, fallback to npm install if lock file is out of sync
# Use --legacy-peer-deps to resolve peer dependency conflicts
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --legacy-peer-deps || npm install --only=production --legacy-peer-deps; \
    else \
      npm install --only=production --legacy-peer-deps; \
    fi

# Install Python dependencies for Sentence-BERT
# Copy requirements early so pip can install before app files are copied
COPY ${APP_PATH}/python/requirements.txt /tmp/python-requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    -r /tmp/python-requirements.txt

# Pre-download Sentence-BERT model to avoid runtime download/timeout
# Use cache folder to save disk space and set HF_HOME to /app/models
# Clean up pip cache after installation to save space
RUN mkdir -p /app/models/sentence_bert_cache && \
    python3 - <<'PY'
import os
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '300'
os.environ['HF_HOME'] = '/app/models'
os.environ['TRANSFORMERS_CACHE'] = '/app/models/transformers_cache'
os.environ['HF_DATASETS_CACHE'] = '/app/models/datasets_cache'
try:
    from sentence_transformers import SentenceTransformer
    print("📥 Downloading Vietnamese bi-encoder model...")
    SentenceTransformer("bkai-foundation-models/vietnamese-bi-encoder", cache_folder="/app/models/sentence_bert_cache")
    print("✅ Model downloaded successfully")
except Exception as e:
    print(f"⚠️ Model download warning (will download at runtime): {e}")
PY
# Clean up pip cache to save disk space
RUN pip cache purge || true && \
    rm -rf /root/.cache/pip/* || true

# Copy application files
COPY ${APP_PATH}/. .

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs /app/models/sentence_bert_cache /tmp/chroma_db

# Copy startup script
COPY ${APP_PATH}/scripts/start-services.sh /app/scripts/start-services.sh
RUN chmod +x /app/scripts/start-services.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application using startup script
CMD ["/app/scripts/start-services.sh"]