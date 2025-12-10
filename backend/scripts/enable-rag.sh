#!/bin/bash

# 🚀 Enable RAG Recommendations Script
# 
# This script enables RAG-enhanced recommendations globally
# by updating .env file with required environment variables

set -e

ENV_FILE=".env"
ENV_LOCAL_FILE=".env.local"

# Function to set or update env variable
set_env_var() {
  local key=$1
  local value=$2
  local file=$3
  
  if [ -f "$file" ]; then
    if grep -q "^${key}=" "$file"; then
      # Update existing variable
      if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
      else
        # Linux
        sed -i "s|^${key}=.*|${key}=${value}|" "$file"
      fi
    else
      # Add new variable
      echo "" >> "$file"
      echo "${key}=${value}" >> "$file"
    fi
  else
    # Create new file
    echo "${key}=${value}" > "$file"
  fi
}

echo "🚀 Enabling RAG Recommendations..."
echo ""

# Check which env file to use
if [ -f "$ENV_LOCAL_FILE" ]; then
  TARGET_FILE="$ENV_LOCAL_FILE"
  echo "📝 Using .env.local file"
elif [ -f "$ENV_FILE" ]; then
  TARGET_FILE="$ENV_FILE"
  echo "📝 Using .env file"
else
  TARGET_FILE="$ENV_FILE"
  echo "📝 Creating new .env file"
fi

echo ""

# Enable RAG recommendations
set_env_var "ENABLE_RAG_RECOMMENDATIONS" "true" "$TARGET_FILE"
echo "✅ ENABLE_RAG_RECOMMENDATIONS=true"

# Optional: Enable ChromaDB for faster queries (if ChromaDB is available)
read -p "Enable ChromaDB indexing for faster queries? (y/n) [n]: " enable_chromadb
if [[ "$enable_chromadb" == "y" || "$enable_chromadb" == "Y" ]]; then
  set_env_var "USE_CHROMADB_FOR_RECOMMENDATIONS" "true" "$TARGET_FILE"
  echo "✅ USE_CHROMADB_FOR_RECOMMENDATIONS=true"
  
  # Set ChromaDB URL if not already set
  if ! grep -q "^CHROMADB_URL=" "$TARGET_FILE"; then
    read -p "Enter ChromaDB URL [http://localhost:8000]: " chromadb_url
    chromadb_url=${chromadb_url:-http://localhost:8000}
    set_env_var "CHROMADB_URL" "$chromadb_url" "$TARGET_FILE"
    echo "✅ CHROMADB_URL=$chromadb_url"
  fi
else
  set_env_var "USE_CHROMADB_FOR_RECOMMENDATIONS" "false" "$TARGET_FILE"
  echo "ℹ️  USE_CHROMADB_FOR_RECOMMENDATIONS=false (using realtime embedding)"
fi

echo ""
echo "✨ RAG Recommendations enabled!"
echo ""
echo "📋 Next steps:"
echo "  1. Restart your backend server"
echo "  2. Run initial sync: POST /api/rag/sync/jobs"
echo "  3. Monitor metrics: GET /api/rag/metrics"
echo ""
echo "📊 To view metrics dashboard, visit: /api/rag/metrics"
echo ""

