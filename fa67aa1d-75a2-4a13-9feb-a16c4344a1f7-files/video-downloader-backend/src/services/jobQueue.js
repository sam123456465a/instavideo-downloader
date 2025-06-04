import { downloadAndProcessVideo } from './videoProcessor.js';
import { jobs } from '../routes/video.js';
import logger from '../utils/logger.js';

/**
 * Simple in-memory job queue implementation
 * In production, use Redis with Bull or similar
 */
class JobQueue {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.isProcessing = false;
  }

  /**
   * Add a job to the queue
   */
  add(queueName, data, options = {}) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }

    const job = {
      id: data.jobId || Date.now().toString(),
      data,
      options: {
        attempts: options.attempts || 1,
        delay: options.delay || 0,
        removeOnComplete: options.removeOnComplete || 5,
        removeOnFail: options.removeOnFail || 5,
        ...options
      },
      attempt: 0,
      createdAt: new Date(),
      status: 'waiting'
    };

    this.queues.get(queueName).push(job);
    
    logger.info(`Added job ${job.id} to queue ${queueName}`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue(queueName);
    }

    return job;
  }

  /**
   * Process jobs in a queue
   */
  async processQueue(queueName) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const queue = this.queues.get(queueName);
    
    if (!queue || queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    while (queue.length > 0) {
      const job = queue.shift();
      
      try {
        await this.processJob(job);
      } catch (error) {
        logger.error(`Failed to process job ${job.id}:`, error);
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Process a single job
   */
  async processJob(job) {
    const { jobId, url, platform, quality, removeWatermark, format } = job.data;
    
    try {
      job.attempt++;
      job.status = 'processing';
      
      // Update job status in the jobs Map
      if (jobs.has(jobId)) {
        const jobData = jobs.get(jobId);
        jobData.status = 'processing';
        jobData.progress = 5;
        jobData.updatedAt = new Date();
        jobs.set(jobId, jobData);
      }

      logger.info(`Processing job ${jobId} (attempt ${job.attempt})`);

      // Progress callback to update job status
      const onProgress = (progress, message) => {
        if (jobs.has(jobId)) {
          const jobData = jobs.get(jobId);
          jobData.progress = progress;
          jobData.message = message;
          jobData.updatedAt = new Date();
          jobs.set(jobId, jobData);
        }
      };

      // Download and process video
      const result = await downloadAndProcessVideo(jobId, url, {
        quality,
        removeWatermark,
        format,
        onProgress
      });

      // Update job with success
      if (jobs.has(jobId)) {
        const jobData = jobs.get(jobId);
        jobData.status = 'completed';
        jobData.progress = 100;
        jobData.downloadUrl = result.downloadUrl;
        jobData.fileSize = result.fileSize;
        jobData.completedAt = new Date();
        jobData.updatedAt = new Date();
        jobs.set(jobId, jobData);
      }

      logger.info(`Successfully completed job ${jobId}`);

    } catch (error) {
      logger.error(`Job ${jobId} failed (attempt ${job.attempt}):`, error.message);

      // Check if we should retry
      if (job.attempt < job.options.attempts) {
        // Retry with exponential backoff
        const delay = job.options.backoff?.delay || 5000;
        const backoffDelay = delay * Math.pow(2, job.attempt - 1);
        
        logger.info(`Retrying job ${jobId} in ${backoffDelay}ms`);
        
        setTimeout(() => {
          this.add('processVideo', job.data, job.options);
        }, backoffDelay);
      } else {
        // Mark as failed
        if (jobs.has(jobId)) {
          const jobData = jobs.get(jobId);
          jobData.status = 'failed';
          jobData.error = error.message;
          jobData.failedAt = new Date();
          jobData.updatedAt = new Date();
          jobs.set(jobId, jobData);
        }
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats(queueName) {
    const queue = this.queues.get(queueName) || [];
    
    return {
      waiting: queue.filter(job => job.status === 'waiting').length,
      processing: queue.filter(job => job.status === 'processing').length,
      total: queue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Clear completed jobs from memory
   */
  cleanup() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [jobId, job] of jobs.entries()) {
      const age = now - new Date(job.createdAt);
      
      if (age > maxAge && (job.status === 'completed' || job.status === 'failed')) {
        jobs.delete(jobId);
        logger.info(`Cleaned up old job ${jobId}`);
      }
    }
  }
}

// Create job queue instance
export const jobQueue = new JobQueue();

// Cleanup old jobs every hour
setInterval(() => {
  jobQueue.cleanup();
}, 60 * 60 * 1000);