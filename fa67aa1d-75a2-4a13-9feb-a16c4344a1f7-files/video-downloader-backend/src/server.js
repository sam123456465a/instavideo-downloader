import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Import routes and middleware
import videoRoutes from './routes/video.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { validateApiKey } from './middleware/auth.js';
import logger from './utils/logger.js';
import { cleanupService } from './services/cleanup.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Allow for video streaming
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests per 15 minutes in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Speed limiting for video downloads
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000 // Maximum delay of 5 seconds
});

app.use('/api/', limiter);
app.use('/api/video/', speedLimiter);

// API key validation for protected routes
app.use('/api/video/', validateApiKey);

// Health check (no rate limiting)
app.use('/health', healthRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/video', videoRoutes);

// Serve static files for downloaded videos (temporary)
app.use('/downloads', express.static(join(__dirname, '../temp/downloads'), {
  maxAge: '1h', // Cache for 1 hour
  setHeaders: (res, path) => {
    // Set appropriate headers for video files
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    }
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Social Media Video Downloader API',
    version: '1.0.0',
    description: 'API for downloading videos from social media platforms with watermark removal',
    endpoints: {
      'POST /api/video/extract': 'Extract video metadata from URL',
      'POST /api/video/download': 'Download and process video',
      'GET /api/video/status/:jobId': 'Check download status',
      'GET /health': 'Health check endpoint',
      'POST /api/auth/key': 'Generate API key'
    },
    supportedPlatforms: [
      'TikTok',
      'Instagram',
      'YouTube',
      'Twitter/X',
      'Facebook',
      'Snapchat'
    ],
    rateLimit: '100 requests per 15 minutes',
    maxFileSize: '500MB'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Social Media Video Downloader API',
    status: 'running',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    availableEndpoints: [
      'GET /',
      'GET /api/docs',
      'GET /health',
      'POST /api/video/extract',
      'POST /api/video/download'
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Cleanup temporary files
    cleanupService.cleanup().then(() => {
      logger.info('Cleanup completed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API documentation: http://localhost:${PORT}/api/docs`);
  logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
  
  // Ensure temp directories exist
  ensureTempDirectories();
  
  // Start cleanup service
  cleanupService.start();
});

async function ensureTempDirectories() {
  const dirs = ['temp/downloads', 'temp/processing', 'temp/uploads'];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(join(__dirname, '../', dir), { recursive: true });
      logger.info(`✅ Created directory: ${dir}`);
    } catch (error) {
      logger.error(`❌ Failed to create directory ${dir}:`, error.message);
    }
  }
}

export default app;