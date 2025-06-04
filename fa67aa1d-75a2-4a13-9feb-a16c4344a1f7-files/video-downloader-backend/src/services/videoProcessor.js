import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { detectPlatform } from '../utils/urlValidator.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMP_DIR = join(__dirname, '../../temp');
const PROCESSING_DIR = join(TEMP_DIR, 'processing');
const DOWNLOADS_DIR = join(TEMP_DIR, 'downloads');

/**
 * Extract video metadata using yt-dlp
 */
export async function extractVideoMetadata(url) {
  const tempId = uuidv4();
  
  try {
    logger.info(`Extracting metadata for URL: ${url}`);
    
    // Use yt-dlp to extract video information
    const command = `yt-dlp --dump-json --no-download "${url}"`;
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (stderr && !stderr.includes('WARNING')) {
      logger.warn(`yt-dlp warnings: ${stderr}`);
    }

    const metadata = JSON.parse(stdout);
    
    // Extract relevant information
    const result = {
      id: metadata.id,
      title: metadata.title || 'Unknown Title',
      description: metadata.description || '',
      duration: metadata.duration || 0,
      uploader: metadata.uploader || metadata.channel || 'Unknown',
      uploadDate: metadata.upload_date,
      viewCount: metadata.view_count || 0,
      thumbnail: metadata.thumbnail,
      platform: detectPlatform(url),
      originalUrl: url,
      availableQualities: extractAvailableQualities(metadata.formats || []),
      fileSize: estimateFileSize(metadata.formats || []),
      hasAudio: hasAudioTrack(metadata.formats || [])
    };

    logger.info(`Successfully extracted metadata for: ${result.title}`);
    return result;

  } catch (error) {
    logger.error(`Failed to extract metadata: ${error.message}`);
    
    // Fallback: try to get basic info
    if (error.message.includes('timeout')) {
      throw new Error('Video extraction timed out. The video might be too large or the platform is slow to respond.');
    }
    
    if (error.message.includes('Private video') || error.message.includes('not available')) {
      throw new Error('This video is private or not available for download.');
    }
    
    throw new Error(`Failed to extract video information: ${error.message}`);
  }
}

/**
 * Download and process video
 */
export async function downloadAndProcessVideo(jobId, url, options = {}) {
  const {
    quality = 'best',
    removeWatermark = true,
    format = 'mp4',
    onProgress = () => {}
  } = options;

  const processingPath = join(PROCESSING_DIR, jobId);
  const outputPath = join(DOWNLOADS_DIR, `${jobId}.${format}`);
  
  try {
    // Create processing directory
    await fs.mkdir(processingPath, { recursive: true });
    
    logger.info(`Starting download for job ${jobId}: ${url}`);
    onProgress(10, 'Initializing download...');

    // Step 1: Download video with yt-dlp
    const rawVideoPath = await downloadWithYtDlp(url, processingPath, quality, onProgress);
    
    // Step 2: Process video (remove watermarks, convert format)
    if (removeWatermark || format !== 'mp4') {
      onProgress(60, 'Processing video...');
      await processVideoWithFFmpeg(rawVideoPath, outputPath, { removeWatermark, format }, onProgress);
    } else {
      // Just move the file
      await fs.rename(rawVideoPath, outputPath);
    }

    onProgress(100, 'Download complete!');
    
    // Get file stats
    const stats = await fs.stat(outputPath);
    
    logger.info(`Successfully processed video for job ${jobId}`);
    
    return {
      success: true,
      filePath: outputPath,
      fileSize: stats.size,
      downloadUrl: `/downloads/${jobId}.${format}`
    };

  } catch (error) {
    logger.error(`Failed to process video for job ${jobId}: ${error.message}`);
    throw error;
  } finally {
    // Cleanup processing directory
    try {
      await fs.rm(processingPath, { recursive: true, force: true });
    } catch (cleanupError) {
      logger.warn(`Failed to cleanup processing directory: ${cleanupError.message}`);
    }
  }
}

/**
 * Download video using yt-dlp
 */
async function downloadWithYtDlp(url, outputDir, quality, onProgress) {
  return new Promise((resolve, reject) => {
    const qualityFormat = getYtDlpQualityFormat(quality);
    const outputTemplate = join(outputDir, 'video.%(ext)s');
    
    const args = [
      '--format', qualityFormat,
      '--output', outputTemplate,
      '--no-playlist',
      '--extract-flat', 'false',
      url
    ];

    logger.info(`Running yt-dlp with args: ${args.join(' ')}`);
    
    const ytDlp = spawn('yt-dlp', args);
    let outputPath = '';
    
    ytDlp.stdout.on('data', (data) => {
      const output = data.toString();
      logger.debug(`yt-dlp stdout: ${output}`);
      
      // Parse download progress
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      if (progressMatch) {
        const progress = Math.min(50, parseInt(progressMatch[1]) * 0.5); // 0-50% for download
        onProgress(progress, 'Downloading video...');
      }
      
      // Extract output filename
      const filenameMatch = output.match(/\[download\] Destination: (.+)/);
      if (filenameMatch) {
        outputPath = filenameMatch[1];
      }
    });

    ytDlp.stderr.on('data', (data) => {
      const error = data.toString();
      logger.warn(`yt-dlp stderr: ${error}`);
      
      // Check for common errors
      if (error.includes('Private video') || error.includes('Video unavailable')) {
        reject(new Error('This video is private or unavailable'));
        return;
      }
      
      if (error.includes('Unsupported URL')) {
        reject(new Error('This URL is not supported'));
        return;
      }
    });

    ytDlp.on('close', (code) => {
      if (code === 0) {
        if (outputPath && outputPath.includes('video.')) {
          resolve(outputPath);
        } else {
          // Try to find the downloaded file
          fs.readdir(outputDir)
            .then(files => {
              const videoFile = files.find(f => f.startsWith('video.'));
              if (videoFile) {
                resolve(join(outputDir, videoFile));
              } else {
                reject(new Error('Downloaded video file not found'));
              }
            })
            .catch(reject);
        }
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });

    ytDlp.on('error', (error) => {
      reject(new Error(`Failed to start yt-dlp: ${error.message}`));
    });
  });
}

/**
 * Process video with FFmpeg
 */
async function processVideoWithFFmpeg(inputPath, outputPath, options, onProgress) {
  const { removeWatermark, format } = options;
  
  return new Promise((resolve, reject) => {
    const args = ['-i', inputPath];
    
    // Video codec settings
    args.push('-c:v', 'libx264');
    args.push('-preset', 'medium');
    args.push('-crf', '23');
    
    // Audio codec settings
    args.push('-c:a', 'aac');
    args.push('-b:a', '128k');
    
    // Remove watermarks using video filters
    if (removeWatermark) {
      // This is a basic watermark removal - in production you'd need more sophisticated detection
      const filters = [
        'delogo=x=10:y=10:w=100:h=50', // Remove logo from top-left corner
        'delogo=x=10:y=h-60:w=100:h=50' // Remove logo from bottom-left corner
      ];
      args.push('-vf', filters.join(','));
    }
    
    // Output format
    if (format === 'webm') {
      args.splice(args.indexOf('-c:v'), 2, '-c:v', 'libvpx-vp9');
      args.splice(args.indexOf('-c:a'), 2, '-c:a', 'libvorbis');
    }
    
    // Overwrite output file
    args.push('-y');
    args.push(outputPath);
    
    logger.info(`Running FFmpeg with args: ${args.join(' ')}`);
    
    const ffmpeg = spawn('ffmpeg', args);
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      
      // Parse FFmpeg progress
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
      
      if (timeMatch && durationMatch) {
        const currentTime = parseTime(timeMatch[1], timeMatch[2], timeMatch[3]);
        const totalTime = parseTime(durationMatch[1], durationMatch[2], durationMatch[3]);
        
        if (totalTime > 0) {
          const progress = Math.min(95, 50 + (currentTime / totalTime) * 45); // 50-95% for processing
          onProgress(progress, 'Processing video...');
        }
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}`));
    });
  });
}

/**
 * Helper functions
 */
function extractAvailableQualities(formats) {
  const qualities = new Set();
  
  formats.forEach(format => {
    if (format.height) {
      if (format.height <= 360) qualities.add('360p');
      if (format.height <= 720) qualities.add('720p');
      if (format.height <= 1080) qualities.add('1080p');
      if (format.height > 1080) qualities.add('4K');
    }
  });
  
  return Array.from(qualities).sort((a, b) => {
    const order = { '360p': 1, '720p': 2, '1080p': 3, '4K': 4 };
    return order[a] - order[b];
  });
}

function estimateFileSize(formats) {
  const sizes = {};
  
  formats.forEach(format => {
    if (format.filesize && format.height) {
      const quality = format.height <= 360 ? '360p' :
                     format.height <= 720 ? '720p' :
                     format.height <= 1080 ? '1080p' : '4K';
      
      if (!sizes[quality] || format.filesize > sizes[quality]) {
        sizes[quality] = format.filesize;
      }
    }
  });
  
  return sizes;
}

function hasAudioTrack(formats) {
  return formats.some(format => format.acodec && format.acodec !== 'none');
}

function getYtDlpQualityFormat(quality) {
  switch (quality) {
    case '360p':
      return 'best[height<=360]';
    case '720p':
      return 'best[height<=720]';
    case '1080p':
      return 'best[height<=1080]';
    case 'original':
      return 'best';
    default:
      return 'best';
  }
}

function parseTime(hours, minutes, seconds) {
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}