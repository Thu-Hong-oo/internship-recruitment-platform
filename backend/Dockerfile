FROM node:20-alpine

ARG APP_PATH=backend

WORKDIR /app

# Install build dependencies for native modules (canvas, sharp, etc.)
# These are needed for node-gyp to compile native code
# Also install runtime dependencies for canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    cairo \
    jpeg-dev \
    jpeg \
    pango-dev \
    pango \
    giflib-dev \
    giflib \
    pixman-dev \
    pixman \
    && ln -sf python3 /usr/bin/python

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

# Remove build dependencies to reduce image size (keep runtime dependencies for canvas)
# Note: Keep cairo, jpeg, pango, giflib, pixman as they are runtime dependencies for canvas
RUN apk del make g++

# Copy application files
# Copy application files
COPY ${APP_PATH}/. .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]

