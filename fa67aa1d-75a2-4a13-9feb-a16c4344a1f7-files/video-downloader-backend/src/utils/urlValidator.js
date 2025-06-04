/**
 * URL validation and platform detection utilities
 */

const SUPPORTED_PLATFORMS = {
  tiktok: {
    domains: ['tiktok.com', 'vm.tiktok.com'],
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
      /(?:https?:\/\/)?vm\.tiktok\.com\/[\w]+/i
    ],
    name: 'TikTok'
  },
  instagram: {
    domains: ['instagram.com'],
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/stories\/[\w.-]+\/\d+/i
    ],
    name: 'Instagram'
  },
  youtube: {
    domains: ['youtube.com', 'youtu.be', 'm.youtube.com'],
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[\w-]+/i,
      /(?:https?:\/\/)?youtu\.be\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/[\w-]+/i
    ],
    name: 'YouTube'
  },
  twitter: {
    domains: ['twitter.com', 'x.com', 'mobile.twitter.com'],
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?twitter\.com\/\w+\/status\/\d+/i,
      /(?:https?:\/\/)?(?:www\.)?x\.com\/\w+\/status\/\d+/i,
      /(?:https?:\/\/)?mobile\.twitter\.com\/\w+\/status\/\d+/i
    ],
    name: 'Twitter/X'
  },
  facebook: {
    domains: ['facebook.com', 'fb.watch', 'm.facebook.com'],
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/.*\/videos\/\d+/i,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch\/\?v=\d+/i,
      /(?:https?:\/\/)?fb\.watch\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+\/posts\/\d+/i
    ],
    name: 'Facebook'
  },
  snapchat: {
    domains: ['snapchat.com'],
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/[\w.-]+/i,
      /(?:https?:\/\/)?story\.snapchat\.com\/p\/[\w-]+/i
    ],
    name: 'Snapchat'
  }
};

/**
 * Validate if a URL is from a supported platform
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is supported
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Basic URL format validation
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return false;
  }

  // Check against supported platforms
  for (const platform of Object.values(SUPPORTED_PLATFORMS)) {
    // Check domain
    const hasValidDomain = platform.domains.some(domain => 
      url.toLowerCase().includes(domain)
    );
    
    if (hasValidDomain) {
      // Check pattern
      const matchesPattern = platform.patterns.some(pattern => 
        pattern.test(url)
      );
      
      if (matchesPattern) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect which platform a URL belongs to
 * @param {string} url - The URL to analyze
 * @returns {string} - The platform name or 'unknown'
 */
export function detectPlatform(url) {
  if (!url || typeof url !== 'string') {
    return 'unknown';
  }

  for (const [platformKey, platform] of Object.entries(SUPPORTED_PLATFORMS)) {
    // Check domain
    const hasValidDomain = platform.domains.some(domain => 
      url.toLowerCase().includes(domain)
    );
    
    if (hasValidDomain) {
      // Check pattern
      const matchesPattern = platform.patterns.some(pattern => 
        pattern.test(url)
      );
      
      if (matchesPattern) {
        return platform.name;
      }
    }
  }

  return 'unknown';
}

/**
 * Get platform-specific information
 * @param {string} url - The URL to analyze
 * @returns {Object} - Platform information object
 */
export function getPlatformInfo(url) {
  const platformName = detectPlatform(url);
  
  if (platformName === 'unknown') {
    return null;
  }

  const platformData = Object.values(SUPPORTED_PLATFORMS).find(
    p => p.name === platformName
  );

  return {
    name: platformName,
    domains: platformData.domains,
    capabilities: getPlatformCapabilities(platformName)
  };
}

/**
 * Get capabilities for a specific platform
 * @param {string} platformName - Name of the platform
 * @returns {Object} - Platform capabilities
 */
function getPlatformCapabilities(platformName) {
  const capabilities = {
    'TikTok': {
      maxQuality: '1080p',
      watermarkRemoval: true,
      audioDownload: true,
      batchDownload: false,
      privateContent: false
    },
    'Instagram': {
      maxQuality: '1080p',
      watermarkRemoval: true,
      audioDownload: true,
      batchDownload: false,
      privateContent: false,
      stories: true,
      reels: true
    },
    'YouTube': {
      maxQuality: '4K',
      watermarkRemoval: false,
      audioDownload: true,
      batchDownload: false,
      privateContent: false,
      playlists: false // Disabled for API simplicity
    },
    'Twitter/X': {
      maxQuality: '1080p',
      watermarkRemoval: true,
      audioDownload: true,
      batchDownload: false,
      privateContent: false
    },
    'Facebook': {
      maxQuality: '1080p',
      watermarkRemoval: true,
      audioDownload: true,
      batchDownload: false,
      privateContent: false
    },
    'Snapchat': {
      maxQuality: '720p',
      watermarkRemoval: true,
      audioDownload: true,
      batchDownload: false,
      privateContent: false
    }
  };

  return capabilities[platformName] || {};
}

/**
 * Clean and normalize URL
 * @param {string} url - The URL to clean
 * @returns {string} - Cleaned URL
 */
export function cleanUrl(url) {
  if (!url) return '';

  // Remove tracking parameters and normalize
  let cleanedUrl = url.trim();
  
  // Add protocol if missing
  if (!cleanedUrl.startsWith('http')) {
    cleanedUrl = `https://${cleanedUrl}`;
  }

  try {
    const urlObj = new URL(cleanedUrl);
    
    // Remove common tracking parameters
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source', 'igshid'
    ];
    
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Extract video ID from URL (platform-specific)
 * @param {string} url - The URL to parse
 * @returns {string|null} - Video ID or null
 */
export function extractVideoId(url) {
  const platform = detectPlatform(url);
  
  switch (platform) {
    case 'TikTok':
      const tiktokMatch = url.match(/\/video\/(\d+)/);
      return tiktokMatch ? tiktokMatch[1] : null;
      
    case 'Instagram':
      const igMatch = url.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
      return igMatch ? igMatch[1] : null;
      
    case 'YouTube':
      const ytMatch = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]+)/);
      return ytMatch ? ytMatch[1] : null;
      
    case 'Twitter/X':
      const twitterMatch = url.match(/\/status\/(\d+)/);
      return twitterMatch ? twitterMatch[1] : null;
      
    case 'Facebook':
      const fbMatch = url.match(/\/videos\/(\d+)|v=(\d+)/);
      return fbMatch ? (fbMatch[1] || fbMatch[2]) : null;
      
    default:
      return null;
  }
}

/**
 * Get all supported platforms information
 * @returns {Object} - All platforms data
 */
export function getAllPlatforms() {
  return Object.entries(SUPPORTED_PLATFORMS).reduce((acc, [key, platform]) => {
    acc[key] = {
      name: platform.name,
      domains: platform.domains,
      capabilities: getPlatformCapabilities(platform.name)
    };
    return acc;
  }, {});
}