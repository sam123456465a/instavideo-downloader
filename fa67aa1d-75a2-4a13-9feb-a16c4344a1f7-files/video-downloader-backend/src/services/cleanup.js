import fs from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMP_DIR = join(__dirname, '../../temp');
const DOWNLOADS_DIR = join(TEMP_DIR, 'downloads');
const PROCESSING_DIR = join(TEMP_DIR, 'processing');

class CleanupService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the cleanup service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Cleanup service is already running');
      return;
    }

    this.isRunning = true;
    
    // Run cleanup every 30 minutes
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, 30 * 60 * 1000);

    // Run initial cleanup
    this.cleanup();
    
    logger.info('🧹 Cleanup service started');
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('🛑 Cleanup service stopped');
  }

  /**
   * Perform cleanup of temporary files
   */
  async cleanup() {
    try {
      logger.info('🧹 Starting cleanup process...');
      
      const stats = {
        downloadsDeleted: 0,
        processingDeleted: 0,
        bytesFreed: 0
      };

      // Cleanup downloads directory (files older than 1 hour)
      stats.downloadsDeleted = await this.cleanupDirectory(
        DOWNLOADS_DIR, 
        60 * 60 * 1000, // 1 hour
        stats
      );

      // Cleanup processing directory (files older than 30 minutes)
      stats.processingDeleted = await this.cleanupDirectory(
        PROCESSING_DIR, 
        30 * 60 * 1000, // 30 minutes
        stats
      );

      // Cleanup empty directories
      await this.cleanupEmptyDirectories(TEMP_DIR);

      logger.info(`✅ Cleanup completed:`, {
        downloadsDeleted: stats.downloadsDeleted,
        processingDeleted: stats.processingDeleted,
        bytesFreed: this.formatBytes(stats.bytesFreed)
      });

    } catch (error) {
      logger.error('❌ Cleanup failed:', error.message);
    }
  }

  /**
   * Clean up files in a directory older than specified age
   */
  async cleanupDirectory(dirPath, maxAge, stats) {
    let deletedCount = 0;

    try {
      const files = await fs.readdir(dirPath);
      const now = Date.now();

      for (const file of files) {
        const filePath = join(dirPath, file);
        
        try {
          const fileStat = await fs.stat(filePath);
          const age = now - fileStat.mtime.getTime();

          if (age > maxAge) {
            if (fileStat.isDirectory()) {
              // Recursively delete directory
              await fs.rm(filePath, { recursive: true, force: true });
              logger.debug(`Deleted directory: ${filePath}`);
            } else {
              // Delete file
              stats.bytesFreed += fileStat.size;
              await fs.unlink(filePath);
              logger.debug(`Deleted file: ${filePath}`);
            }
            deletedCount++;
          }
        } catch (fileError) {
          logger.warn(`Failed to process file ${filePath}:`, fileError.message);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn(`Failed to read directory ${dirPath}:`, error.message);
      }
    }

    return deletedCount;
  }

  /**
   * Remove empty directories
   */
  async cleanupEmptyDirectories(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDirPath = join(dirPath, entry.name);
          
          // Recursively clean subdirectories first
          await this.cleanupEmptyDirectories(subDirPath);
          
          // Check if directory is now empty
          try {
            const subEntries = await fs.readdir(subDirPath);
            if (subEntries.length === 0) {
              await fs.rmdir(subDirPath);
              logger.debug(`Removed empty directory: ${subDirPath}`);
            }
          } catch (error) {
            // Directory not empty or other error
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn(`Failed to cleanup empty directories in ${dirPath}:`, error.message);
      }
    }
  }

  /**
   * Get cleanup statistics
   */
  async getStats() {
    try {
      const stats = {
        directories: {},
        totalSize: 0,
        totalFiles: 0
      };

      // Check downloads directory
      stats.directories.downloads = await this.getDirectoryStats(DOWNLOADS_DIR);
      
      // Check processing directory
      stats.directories.processing = await this.getDirectoryStats(PROCESSING_DIR);

      // Calculate totals
      Object.values(stats.directories).forEach(dirStats => {
        stats.totalSize += dirStats.size;
        stats.totalFiles += dirStats.files;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get cleanup stats:', error.message);
      return null;
    }
  }

  /**
   * Get statistics for a specific directory
   */
  async getDirectoryStats(dirPath) {
    const stats = {
      path: dirPath,
      size: 0,
      files: 0,
      lastModified: null
    };

    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = join(dirPath, file);
        try {
          const fileStat = await fs.stat(filePath);
          
          if (fileStat.isFile()) {
            stats.size += fileStat.size;
            stats.files++;
            
            if (!stats.lastModified || fileStat.mtime > stats.lastModified) {
              stats.lastModified = fileStat.mtime;
            }
          }
        } catch (error) {
          // Skip inaccessible files
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn(`Failed to stat directory ${dirPath}:`, error.message);
      }
    }

    return stats;
  }

  /**
   * Force cleanup of specific file or directory
   */
  async forceCleanup(path) {
    try {
      await fs.rm(path, { recursive: true, force: true });
      logger.info(`Force cleaned: ${path}`);
      return true;
    } catch (error) {
      logger.error(`Failed to force cleanup ${path}:`, error.message);
      return false;
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const cleanupService = new CleanupService();