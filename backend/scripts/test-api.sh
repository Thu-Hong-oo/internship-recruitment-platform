#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing Backend API..."
echo ""

# Test Health Check
echo "1. Testing Health Check..."
HEALTH=$(curl -s $BASE_URL/health)
if [[ $HEALTH == *"ok"* ]] || [[ $HEALTH == *"status"* ]]; then
  echo "✅ Health check passed"
  echo "   Response: $HEALTH"
else
  echo "❌ Health check failed"
  echo "   Response: $HEALTH"
  exit 1
fi

echo ""

# Test API Docs
echo "2. Testing API Docs..."
DOCS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api-docs)
if [ $DOCS -eq 200 ]; then
  echo "✅ API docs accessible (HTTP $DOCS)"
else
  echo "⚠️ API docs returned HTTP $DOCS"
fi

echo ""

# Test Jobs API
echo "3. Testing Jobs API..."
JOBS_RESPONSE=$(curl -s $BASE_URL/api/jobs)
if [[ $JOBS_RESPONSE == *"success"* ]] || [[ $JOBS_RESPONSE == *"data"* ]] || [[ $JOBS_RESPONSE == *"[]"* ]]; then
  echo "✅ Jobs API working"
else
  echo "⚠️ Jobs API may have issues"
  echo "   Response: ${JOBS_RESPONSE:0:100}..."
fi

echo ""
echo "✅ All tests completed!"

