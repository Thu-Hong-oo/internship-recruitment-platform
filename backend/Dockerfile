FROM node:20-alpine

ARG APP_PATH=backend

WORKDIR /app

# Install build dependencies for native modules (sharp, etc.)
# Note: canvas has been removed from dependencies due to compilation issues
# These are needed for node-gyp to compile native code
# Also install Python and pip for Sentence-BERT service
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python \
    && ln -sf pip3 /usr/bin/pip

# Copy package files (default path backend, override by setting APP_PATH build-arg)
COPY ${APP_PATH}/package*.json ./

# Install dependencies
# Try npm ci first, fallback to npm install if lock file is out of sync
# Use --legacy-peer-deps to resolve peer dependency conflicts (e.g., dotenv version mismatch)
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --legacy-peer-deps || npm install --only=production --legacy-peer-deps; \
    else \
      npm install --only=production --legacy-peer-deps; \
    fi

# Install Python dependencies for Sentence-BERT
# sentence-transformers is required for RAG recommendations
# Note: This may take a few minutes to download the model on first build
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir \
    sentence-transformers \
    numpy \
    torch --index-url https://download.pytorch.org/whl/cpu \
    || (echo "⚠️ Python dependencies installation failed, Sentence-BERT may be unavailable" && exit 0)

# Remove build dependencies to reduce image size (keep python3 and pip)
RUN apk del make g++

# Copy application files
COPY ${APP_PATH}/. .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]

