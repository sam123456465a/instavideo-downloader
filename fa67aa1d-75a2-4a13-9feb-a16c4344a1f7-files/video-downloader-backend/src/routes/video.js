import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { extractVideoMetadata, downloadAndProcessVideo } from '../services/videoProcessor.js';
import { validateUrl, detectPlatform } from '../utils/urlValidator.js';
import logger from '../utils/logger.js';
import { jobQueue } from '../services/jobQueue.js';

const router = express.Router();

// In-memory job storage (use Redis in production)
const jobs = new Map();

/**
 * @route POST /api/video/extract
 * @desc Extract video metadata from URL
 * @access Public (rate limited)
 */
router.post('/extract', [
  body('url')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Please provide a valid URL')
    .custom((value) => {
      if (!validateUrl(value)) {
        throw new Error('URL is not from a supported platform');
      }
      return true;
    })
], async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: errors.array()
      });
    }

    const { url } = req.body;
    const platform = detectPlatform(url);
    
    logger.info(`Extracting metadata for ${platform} URL: ${url}`);

    // Extract video metadata
    const metadata = await extractVideoMetadata(url);
    
    res.json({
      success: true,
      data: {
        platform,
        metadata,
        supportedQualities: metadata.availableQualities || ['360p', '720p', '1080p'],
        estimatedSizes: {
          '360p': '5-15 MB',
          '720p': '15-50 MB',
          '1080p': '50-150 MB',
          'original': '100-500 MB'
        }
      }
    });

  } catch (error) {
    logger.error('Error extracting video metadata:', error);
    next(error);
  }
});

/**
 * @route POST /api/video/download
 * @desc Download and process video
 * @access Public (rate limited)
 */
router.post('/download', [
  body('url')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Please provide a valid URL')
    .custom((value) => {
      if (!validateUrl(value)) {
        throw new Error('URL is not from a supported platform');
      }
      return true;
    }),
  body('quality')
    .optional()
    .isIn(['360p', '720p', '1080p', 'original', 'best'])
    .withMessage('Quality must be one of: 360p, 720p, 1080p, original, best'),
  body('removeWatermark')
    .optional()
    .isBoolean()
    .withMessage('removeWatermark must be a boolean'),
  body('format')
    .optional()
    .isIn(['mp4', 'webm', 'avi'])
    .withMessage('Format must be one of: mp4, webm, avi')
], async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: errors.array()
      });
    }

    const { 
      url, 
      quality = 'best', 
      removeWatermark = true, 
      format = 'mp4' 
    } = req.body;

    const jobId = uuidv4();
    const platform = detectPlatform(url);
    
    // Create job entry
    const job = {
      id: jobId,
      url,
      platform,
      quality,
      removeWatermark,
      format,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      clientIP: req.ip
    };

    jobs.set(jobId, job);
    
    logger.info(`Created download job ${jobId} for ${platform} URL: ${url}`);

    // Add to processing queue
    jobQueue.add('processVideo', {
      jobId,
      url,
      platform,
      quality,
      removeWatermark,
      format
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });

    res.json({
      success: true,
      data: {
        jobId,
        status: 'queued',
        message: 'Video processing started',
        statusUrl: `/api/video/status/${jobId}`,
        estimatedTime: '30-120 seconds'
      }
    });

  } catch (error) {
    logger.error('Error starting video download:', error);
    next(error);
  }
});

/**
 * @route GET /api/video/status/:jobId
 * @desc Check download job status
 * @access Public
 */
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  if (!jobs.has(jobId)) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
      message: 'The specified job ID does not exist or has expired'
    });
  }

  const job = jobs.get(jobId);
  
  res.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      platform: job.platform,
      quality: job.quality,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      ...(job.error && { error: job.error }),
      ...(job.downloadUrl && { downloadUrl: job.downloadUrl }),
      ...(job.metadata && { metadata: job.metadata })
    }
  });
});

/**
 * @route DELETE /api/video/job/:jobId
 * @desc Cancel or delete a job
 * @access Public
 */
router.delete('/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  if (!jobs.has(jobId)) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  const job = jobs.get(jobId);
  
  // Cancel job if it's still processing
  if (job.status === 'processing' || job.status === 'queued') {
    job.status = 'cancelled';
    job.updatedAt = new Date();
    jobs.set(jobId, job);
  } else {
    // Remove completed job
    jobs.delete(jobId);
  }
  
  logger.info(`Job ${jobId} cancelled/deleted`);
  
  res.json({
    success: true,
    message: 'Job cancelled/deleted successfully'
  });
});

/**
 * @route GET /api/video/platforms
 * @desc Get supported platforms and their capabilities
 * @access Public
 */
router.get('/platforms', (req, res) => {
  res.json({
    success: true,
    data: {
      platforms: {
        tiktok: {
          name: 'TikTok',
          domain: 'tiktok.com',
          watermarkRemoval: true,
          maxQuality: '1080p',
          audioDownload: true
        },
        instagram: {
          name: 'Instagram',
          domain: 'instagram.com',
          watermarkRemoval: true,
          maxQuality: '1080p',
          audioDownload: true,
          supportsStories: true,
          supportsReels: true
        },
        youtube: {
          name: 'YouTube',
          domain: 'youtube.com',
          watermarkRemoval: false,
          maxQuality: '4K',
          audioDownload: true,
          supportsPlaylists: false
        },
        twitter: {
          name: 'Twitter/X',
          domain: ['twitter.com', 'x.com'],
          watermarkRemoval: true,
          maxQuality: '1080p',
          audioDownload: true
        },
        facebook: {
          name: 'Facebook',
          domain: 'facebook.com',
          watermarkRemoval: true,
          maxQuality: '1080p',
          audioDownload: true
        },
        snapchat: {
          name: 'Snapchat',
          domain: 'snapchat.com',
          watermarkRemoval: true,
          maxQuality: '720p',
          audioDownload: true
        }
      },
      supportedFormats: ['mp4', 'webm', 'avi'],
      supportedQualities: ['360p', '720p', '1080p', 'original', 'best']
    }
  });
});

// Export jobs Map for use in job processing
export { jobs };
export default router;