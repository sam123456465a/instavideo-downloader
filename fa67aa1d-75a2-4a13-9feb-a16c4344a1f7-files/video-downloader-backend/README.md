# Social Media Video Downloader - Backend API

A powerful Node.js backend API for downloading videos from social media platforms with watermark removal capabilities.

## 🚀 Features

- **Multi-Platform Support**: TikTok, Instagram, YouTube, Twitter/X, Facebook, Snapchat
- **Watermark Removal**: Advanced FFmpeg processing to remove platform watermarks
- **Multiple Quality Options**: 360p, 720p, 1080p, Original quality downloads
- **Rate Limiting**: Built-in protection against abuse
- **Job Queue System**: Async processing for better performance
- **Health Monitoring**: Comprehensive health checks and monitoring
- **Security**: API key authentication, CORS protection, input validation
- **Docker Support**: Ready for containerized deployment
- **Cleanup Service**: Automatic cleanup of temporary files

## 📋 Prerequisites

### System Dependencies
- **Node.js** 18+ 
- **Python** 3.7+ (for yt-dlp)
- **FFmpeg** 4.0+ (for video processing)
- **yt-dlp** (for video extraction)

### Installation Commands

#### Ubuntu/Debian
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip
sudo apt-get install -y python3 python3-pip

# Install FFmpeg
sudo apt-get install -y ffmpeg

# Install yt-dlp
pip3 install yt-dlp
```

#### macOS
```bash
# Install using Homebrew
brew install node python ffmpeg

# Install yt-dlp
pip3 install yt-dlp
```

#### Windows
```bash
# Install using Chocolatey
choco install nodejs python ffmpeg

# Install yt-dlp
pip install yt-dlp
```

## 🛠 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd video-downloader-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create required directories**
```bash
mkdir -p temp/downloads temp/processing temp/uploads logs
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 🐳 Docker Setup

### Quick Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build image
docker build -t video-downloader-backend .

# Run container
docker run -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/temp:/app/temp \
  video-downloader-backend
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
Include API key in requests:
```bash
# Header method (recommended)
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/video/extract

# Query parameter method
curl "http://localhost:3000/api/video/extract?apiKey=your-api-key"
```

### Endpoints

#### 🔍 Extract Video Metadata
```http
POST /api/video/extract
Content-Type: application/json
X-API-Key: your-api-key

{
  "url": "https://www.tiktok.com/@username/video/1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": "TikTok",
    "metadata": {
      "id": "1234567890",
      "title": "Amazing Video Title",
      "description": "Video description...",
      "duration": 30,
      "uploader": "@username",
      "thumbnail": "https://...",
      "availableQualities": ["360p", "720p", "1080p"]
    }
  }
}
```

#### ⬇️ Download Video
```http
POST /api/video/download
Content-Type: application/json
X-API-Key: your-api-key

{
  "url": "https://www.tiktok.com/@username/video/1234567890",
  "quality": "1080p",
  "removeWatermark": true,
  "format": "mp4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-job-id",
    "status": "queued",
    "statusUrl": "/api/video/status/uuid-job-id",
    "estimatedTime": "30-120 seconds"
  }
}
```

#### 📊 Check Download Status
```http
GET /api/video/status/:jobId
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-job-id",
    "status": "completed",
    "progress": 100,
    "downloadUrl": "/downloads/uuid-job-id.mp4",
    "metadata": { ... }
  }
}
```

#### 🏥 Health Check
```http
GET /health
```

#### 🔑 Generate API Key
```http
POST /api/auth/key
Content-Type: application/json

{
  "adminPassword": "your-admin-password",
  "description": "My API key"
}
```

### Supported Platforms

| Platform | Domain | Max Quality | Watermark Removal | Audio |
|----------|--------|-------------|-------------------|-------|
| TikTok | tiktok.com | 1080p | ✅ | ✅ |
| Instagram | instagram.com | 1080p | ✅ | ✅ |
| YouTube | youtube.com | 4K | ❌ | ✅ |
| Twitter/X | twitter.com, x.com | 1080p | ✅ | ✅ |
| Facebook | facebook.com | 1080p | ✅ | ✅ |
| Snapchat | snapchat.com | 720p | ✅ | ✅ |

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `JWT_SECRET` | - | JWT signing secret |
| `LOG_LEVEL` | info | Logging level |
| `SKIP_AUTH` | false | Skip API key validation |
| `MAX_FILE_SIZE` | 500MB | Maximum file size |
| `CLEANUP_INTERVAL` | 30min | Cleanup interval |

### Rate Limiting
- **Default**: 100 requests per 15 minutes
- **Configurable** via environment variables
- **IP-based** tracking
- **Exponential backoff** for repeated violations

## 🔧 Development

### Project Structure
```
src/
├── server.js              # Main server file
├── routes/
│   ├── video.js           # Video processing routes
│   ├── auth.js            # Authentication routes
│   └── health.js          # Health check routes
├── services/
│   ├── videoProcessor.js  # Video processing logic
│   ├── jobQueue.js        # Job queue management
│   └── cleanup.js         # File cleanup service
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── errorHandler.js    # Error handling
│   └── logger.js          # Request logging
└── utils/
    ├── logger.js          # Winston logger setup
    └── urlValidator.js    # URL validation utilities
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Development Commands
```bash
# Start with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `JWT_SECRET`
- [ ] Set up proper rate limiting
- [ ] Enable authentication (`SKIP_AUTH=false`)
- [ ] Configure log rotation
- [ ] Set up monitoring
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL/TLS certificates

### Docker Production Deployment
```bash
# Build production image
docker build --target production -t video-downloader-api:prod .

# Run with production settings
docker run -d \
  --name video-downloader \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  video-downloader-api:prod
```

## 📊 Monitoring

### Health Endpoints
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system information
- `GET /health/ready` - Readiness check for K8s
- `GET /health/live` - Liveness check for K8s

### Metrics
- Request count and response times
- Job queue statistics
- File system usage
- Error rates by endpoint

## 🔒 Security

### Features
- **API Key Authentication**: Secure access control
- **Rate Limiting**: DDoS protection
- **Input Validation**: Prevent injection attacks
- **CORS Protection**: Cross-origin request security
- **Security Headers**: Helmet.js integration
- **File Size Limits**: Prevent storage abuse

### Best Practices
- Regularly rotate API keys
- Monitor for unusual activity
- Keep dependencies updated
- Use HTTPS in production
- Implement proper logging

## 🐛 Troubleshooting

### Common Issues

#### yt-dlp not found
```bash
# Install yt-dlp
pip3 install yt-dlp

# Verify installation
yt-dlp --version
```

#### FFmpeg not found
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

#### Permission errors
```bash
# Fix directory permissions
chmod -R 755 temp/
chown -R $USER:$USER temp/
```

#### Memory issues
- Increase server memory allocation
- Reduce concurrent job limit
- Enable cleanup service

### Debug Mode
```bash
LOG_LEVEL=debug npm run dev
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Documentation**: Check the `/api/docs` endpoint
- **Health Status**: Monitor `/health/detailed`
- **Logs**: Check `logs/` directory
- **Issues**: Create GitHub issue with logs and reproduction steps

---

**⚠️ Legal Notice**: This software is for educational purposes. Users are responsible for complying with platform terms of service and copyright laws.