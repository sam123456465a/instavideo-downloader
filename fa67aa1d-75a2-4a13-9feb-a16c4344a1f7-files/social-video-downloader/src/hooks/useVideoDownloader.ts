import { useState, useCallback } from 'react';

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  quality: Array<{
    label: string;
    url: string;
    fileSize: string;
  }>;
  platform: string;
  author: {
    name: string;
    avatar: string;
  };
}

export interface DownloadProgress {
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
}

export const useVideoDownloader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const detectPlatform = useCallback((url: string): string => {
    const platformPatterns = [
      { pattern: /tiktok\.com/, name: 'TikTok' },
      { pattern: /instagram\.com/, name: 'Instagram' },
      { pattern: /(youtube\.com|youtu\.be)/, name: 'YouTube' },
      { pattern: /(twitter\.com|x\.com)/, name: 'Twitter/X' },
      { pattern: /facebook\.com/, name: 'Facebook' },
      { pattern: /snapchat\.com/, name: 'Snapchat' },
    ];

    for (const { pattern, name } of platformPatterns) {
      if (pattern.test(url)) return name;
    }
    return 'Unknown';
  }, []);

  const validateUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return detectPlatform(url) !== 'Unknown';
    } catch {
      return false;
    }
  }, [detectPlatform]);

  const fetchVideoInfo = useCallback(async (url: string): Promise<void> => {
    if (!validateUrl(url)) {
      throw new Error('Invalid URL or unsupported platform');
    }

    setIsLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      // Simulate API call - in real implementation, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      const platform = detectPlatform(url);
      
      // Mock response - replace with actual API call
      const mockVideoInfo: VideoInfo = {
        id: Math.random().toString(36).substr(2, 9),
        title: `Amazing ${platform} Video - ${new Date().getFullYear()}`,
        description: 'This is a sample video description that would come from the actual video metadata. In a real implementation, this would be extracted from the social media platform.',
        thumbnail: `https://picsum.photos/400/225?random=${Math.floor(Math.random() * 1000)}`,
        duration: `${Math.floor(Math.random() * 3) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        quality: [
          { label: '360p', url: 'sample-360p', fileSize: '3.2 MB' },
          { label: '720p', url: 'sample-720p', fileSize: '12.8 MB' },
          { label: '1080p', url: 'sample-1080p', fileSize: '25.4 MB' },
          { label: 'Original', url: 'sample-original', fileSize: '45.7 MB' },
        ],
        platform,
        author: {
          name: `@${platform.toLowerCase()}_creator`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${platform}`,
        },
      };

      setVideoInfo(mockVideoInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video information');
    } finally {
      setIsLoading(false);
    }
  }, [validateUrl, detectPlatform]);

  const downloadVideo = useCallback(async (qualityUrl: string, filename: string): Promise<void> => {
    setDownloadProgress({ percentage: 0, downloadedBytes: 0, totalBytes: 25, speed: '0 KB/s' });

    try {
      // Simulate realistic download progress
      const totalSteps = 20;
      const stepDelay = 150;
      
      for (let i = 0; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDelay));
        const percentage = Math.round((i / totalSteps) * 100);
        const downloadedMB = Math.round((percentage / 100) * 25);
        
        setDownloadProgress({
          percentage,
          downloadedBytes: downloadedMB,
          totalBytes: 25,
          speed: `${Math.floor(Math.random() * 800 + 200)} KB/s`,
        });
      }

      setDownloadProgress(null);
      
      // Show demo completion dialog
      const userChoice = window.confirm(
        `🎬 DEMO COMPLETE!\n\n` +
        `✅ Video "${filename}" processed successfully!\n\n` +
        `In a real implementation:\n` +
        `📱 The ${videoInfo?.platform} video would be downloaded\n` +
        `🎯 Watermarks would be removed\n` +
        `💾 File would be saved to your Downloads folder\n\n` +
        `Want to see what the backend code would look like?\n\n` +
        `Click OK to view implementation guide, or Cancel to continue.`
      );
      
      if (userChoice) {
        // Open implementation guide in new tab
        const implementationGuide = `
<!DOCTYPE html>
<html>
<head>
    <title>Video Downloader - Backend Implementation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; }
        pre { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 8px; overflow-x: auto; }
        .tech-stack { background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Social Media Video Downloader - Backend Implementation</h1>
        
        <div class="warning">
            <strong>⚠️ Legal Notice:</strong> This implementation is for educational purposes. Always respect platform terms of service and copyright laws.
        </div>

        <h2>🛠️ Technology Stack</h2>
        <div class="tech-stack">
            <strong>Backend:</strong> Node.js + Express.js or Python + FastAPI<br>
            <strong>Video Processing:</strong> yt-dlp, FFmpeg<br>
            <strong>Storage:</strong> AWS S3, Redis for caching<br>
            <strong>Security:</strong> Rate limiting, JWT authentication
        </div>

        <h2>📋 API Endpoint Example</h2>
        <pre><code>// Node.js + Express example
app.post('/api/download', async (req, res) => {
  const { url, quality } = req.body;
  
  try {
    // 1. Validate URL and detect platform
    const platform = detectPlatform(url);
    
    // 2. Extract video metadata
    const metadata = await extractMetadata(url);
    
    // 3. Download video with yt-dlp
    const videoPath = await downloadVideo(url, quality);
    
    // 4. Process video (remove watermarks)
    const processedPath = await processVideo(videoPath);
    
    // 5. Upload to temporary storage
    const downloadUrl = await uploadToS3(processedPath);
    
    res.json({
      success: true,
      downloadUrl,
      metadata
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});</code></pre>

        <h2>🎬 Video Processing Pipeline</h2>
        <ol>
            <li><strong>URL Validation:</strong> Check if URL is from supported platform</li>
            <li><strong>Metadata Extraction:</strong> Get video title, duration, quality options</li>
            <li><strong>Video Download:</strong> Use yt-dlp to download original video</li>
            <li><strong>Watermark Removal:</strong> FFmpeg processing to remove platform watermarks</li>
            <li><strong>Quality Conversion:</strong> Generate multiple quality options</li>
            <li><strong>Temporary Storage:</strong> Upload processed video to CDN</li>
            <li><strong>Cleanup:</strong> Delete files after download or timeout</li>
        </ol>

        <h2>🔒 Security Considerations</h2>
        <ul>
            <li>Rate limiting to prevent abuse</li>
            <li>File size limits</li>
            <li>Automatic cleanup of temporary files</li>
            <li>User session management</li>
            <li>CORS and CSRF protection</li>
        </ul>

        <h2>⚡ Performance Optimization</h2>
        <ul>
            <li>Queue system for video processing</li>
            <li>Redis caching for metadata</li>
            <li>CDN for fast video delivery</li>
            <li>Docker containers for scalability</li>
        </ul>

        <div class="warning">
            <strong>💡 Next Steps:</strong> To build this for production, you'd need to handle platform-specific APIs, implement robust error handling, and ensure compliance with copyright laws.
        </div>
    </div>
</body>
</html>`;

        const blob = new Blob([implementationGuide], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setDownloadProgress(null);
    }
  }, [videoInfo]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setVideoInfo(null);
    setDownloadProgress(null);
  }, []);

  return {
    isLoading,
    error,
    videoInfo,
    downloadProgress,
    fetchVideoInfo,
    downloadVideo,
    detectPlatform,
    validateUrl,
    reset,
  };
};