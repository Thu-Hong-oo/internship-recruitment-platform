FROM node:18-alpine

ARG APP_PATH=backend

WORKDIR /app

# Copy package files (default path backend, override by setting APP_PATH build-arg)
COPY ${APP_PATH}/package*.json ./

# Install dependencies
# Use npm install if package-lock.json doesn't exist
# Use --legacy-peer-deps to resolve peer dependency conflicts (e.g., dotenv version mismatch)
RUN if [ -f package-lock.json ]; then npm ci --only=production --legacy-peer-deps; else npm install --only=production --legacy-peer-deps; fi

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

