#!/bin/bash

echo "🚀 Starting Video Downloader Backend..."

# Check if required dependencies are installed
echo "📋 Checking system dependencies..."

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
else
    echo "❌ Python3 not found"
fi

# Check FFmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg: $(ffmpeg -version 2>&1 | head -n1)"
else
    echo "⚠️  FFmpeg not found - some features may not work"
fi

# Check yt-dlp
if command -v yt-dlp &> /dev/null; then
    echo "✅ yt-dlp: $(yt-dlp --version)"
else
    echo "⚠️  yt-dlp not found - installing..."
    pip3 install yt-dlp --user
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p temp/downloads temp/processing temp/uploads logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🎉 Setup complete!"
echo ""
echo "🚀 Starting server..."
echo "📚 API Documentation: http://localhost:3000/api/docs"
echo "❤️  Health Check: http://localhost:3000/health"
echo ""

# Start the server
npm start