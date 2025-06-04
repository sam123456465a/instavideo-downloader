#!/bin/bash

# Simple API test script
API_BASE="http://localhost:3000"

echo "🧪 Testing Video Downloader API..."
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$API_BASE/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test API documentation
echo "2. Testing API documentation..."
curl -s "$API_BASE/api/docs" | jq '.name' || echo "❌ API docs failed"
echo ""

# Test platform list
echo "3. Testing platform list..."
curl -s "$API_BASE/api/video/platforms" | jq '.data.platforms | keys' || echo "❌ Platform list failed"
echo ""

# Test video extraction (with demo key)
echo "4. Testing video extraction..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key-12345" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  "$API_BASE/api/video/extract" | jq '.success' || echo "❌ Video extraction failed"
echo ""

# Test authentication
echo "5. Testing API key validation..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"demo-key-12345"}' \
  "$API_BASE/api/auth/validate" | jq '.data.valid' || echo "❌ Auth validation failed"
echo ""

echo "✅ API tests completed!"