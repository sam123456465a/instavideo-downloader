import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { cleanupService } from '../services/cleanup.js';
import { jobQueue } from '../services/jobQueue.js';
import logger from '../utils/logger.js';

const router = express.Router();
const execAsync = promisify(exec);

/**
 * @route GET /health
 * @desc Basic health check
 * @access Public
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route GET /health/detailed
 * @desc Detailed health check with system information
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {
        jobQueue: await checkJobQueue(),
        ytDlp: await checkYtDlp(),
        ffmpeg: await checkFFmpeg(),
        cleanup: await checkCleanupService()
      },
      storage: await checkStorage()
    };

    // Determine overall health status
    const serviceStatuses = Object.values(health.services);
    const hasUnhealthyServices = serviceStatuses.some(service => service.status !== 'healthy');
    
    if (hasUnhealthyServices) {
      health.status = 'degraded';
      res.status(503);
    }

    res.json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route GET /health/ready
 * @desc Readiness check for container orchestration
 * @access Public
 */
router.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies
    const ytDlpStatus = await checkYtDlp();
    const ffmpegStatus = await checkFFmpeg();

    const isReady = ytDlpStatus.status === 'healthy' && ffmpegStatus.status === 'healthy';

    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        issues: {
          ytDlp: ytDlpStatus,
          ffmpeg: ffmpegStatus
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route GET /health/live
 * @desc Liveness check for container orchestration
 * @access Public
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

/**
 * Check job queue health
 */
async function checkJobQueue() {
  try {
    const stats = jobQueue.getStats('processVideo');
    return {
      status: 'healthy',
      stats: stats,
      message: 'Job queue is operational'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check yt-dlp availability
 */
async function checkYtDlp() {
  try {
    const { stdout } = await execAsync('yt-dlp --version', { timeout: 5000 });
    return {
      status: 'healthy',
      version: stdout.trim(),
      message: 'yt-dlp is available'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'yt-dlp not found or not working',
      details: error.message
    };
  }
}

/**
 * Check FFmpeg availability
 */
async function checkFFmpeg() {
  try {
    const { stderr } = await execAsync('ffmpeg -version', { timeout: 5000 });
    const versionMatch = stderr.match(/ffmpeg version ([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    return {
      status: 'healthy',
      version: version,
      message: 'FFmpeg is available'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'FFmpeg not found or not working',
      details: error.message
    };
  }
}

/**
 * Check cleanup service
 */
async function checkCleanupService() {
  try {
    const stats = await cleanupService.getStats();
    return {
      status: 'healthy',
      isRunning: cleanupService.isRunning,
      stats: stats,
      message: 'Cleanup service is operational'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check storage availability and usage
 */
async function checkStorage() {
  try {
    const { stdout } = await execAsync('df -h .', { timeout: 5000 });
    const lines = stdout.split('\n');
    const dataLine = lines[1];
    const parts = dataLine.split(/\s+/);
    
    return {
      status: 'healthy',
      filesystem: parts[0],
      size: parts[1],
      used: parts[2],
      available: parts[3],
      usePercentage: parts[4]
    };
  } catch (error) {
    return {
      status: 'unknown',
      error: 'Could not check storage usage',
      details: error.message
    };
  }
}

export default router;