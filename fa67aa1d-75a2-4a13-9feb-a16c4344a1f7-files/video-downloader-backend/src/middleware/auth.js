import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Simple API key storage (use database in production)
const API_KEYS = new Set([
  'demo-key-12345',
  'test-key-67890'
]);

/**
 * Validate API key middleware
 */
export function validateApiKey(req, res, next) {
  // Skip API key validation in development
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key is required. Include X-API-Key header or apiKey query parameter.',
      documentation: '/api/docs'
    });
  }

  if (!API_KEYS.has(apiKey)) {
    logger.warn(`Invalid API key attempt: ${apiKey}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key',
      documentation: '/api/docs'
    });
  }

  // Add API key info to request
  req.apiKey = apiKey;
  
  next();
}

/**
 * JWT token validation middleware
 */
export function validateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Invalid JWT token: ${error.message}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Generate API key
 */
export function generateApiKey() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `vd_${timestamp}_${random}`;
}

/**
 * Generate JWT token
 */
export function generateJWT(payload, expiresIn = '24h') {
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn,
    issuer: 'video-downloader-api',
    audience: 'video-downloader-client'
  });
}

/**
 * Add API key to storage
 */
export function addApiKey(key) {
  API_KEYS.add(key);
  logger.info(`Added new API key: ${key.substring(0, 10)}...`);
}

/**
 * Remove API key from storage
 */
export function removeApiKey(key) {
  const removed = API_KEYS.delete(key);
  if (removed) {
    logger.info(`Removed API key: ${key.substring(0, 10)}...`);
  }
  return removed;
}

/**
 * List all API keys (masked for security)
 */
export function listApiKeys() {
  return Array.from(API_KEYS).map(key => ({
    key: key.substring(0, 10) + '...',
    length: key.length,
    created: 'unknown' // In production, store creation date
  }));
}