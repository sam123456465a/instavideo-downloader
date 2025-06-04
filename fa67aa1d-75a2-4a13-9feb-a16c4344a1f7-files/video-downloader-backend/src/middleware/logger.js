import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Start time for response time calculation
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    id: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer')
  });

  // Log request body for POST/PUT requests (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeRequestBody(req.body);
    logger.debug('Request body', {
      id: req.id,
      body: sanitizedBody
    });
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('Outgoing response', {
      id: req.id,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: JSON.stringify(data).length
    });

    // Log response body for errors or debug mode
    if (res.statusCode >= 400 || process.env.LOG_LEVEL === 'debug') {
      logger.debug('Response body', {
        id: req.id,
        body: sanitizeResponseBody(data)
      });
    }

    return originalJson.call(this, data);
  };

  // Add response time header
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set('X-Request-ID', req.id);
  });

  next();
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body) {
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 'token', 'apiKey', 'secret', 'key',
    'authorization', 'auth', 'credentials'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Truncate long URLs for readability
  if (sanitized.url && sanitized.url.length > 100) {
    sanitized.url = sanitized.url.substring(0, 100) + '...';
  }

  return sanitized;
}

/**
 * Sanitize response body for logging
 */
function sanitizeResponseBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  
  // Remove sensitive fields from response
  const sensitiveFields = [
    'apiKey', 'token', 'secret', 'key', 'password'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Truncate large data fields
  if (sanitized.data && typeof sanitized.data === 'object') {
    const dataStr = JSON.stringify(sanitized.data);
    if (dataStr.length > 1000) {
      sanitized.data = '[LARGE_DATA_TRUNCATED]';
    }
  }

  return sanitized;
}

/**
 * Error request logger for failed requests
 */
export function errorRequestLogger(err, req, res, next) {
  logger.error('Request error', {
    id: req.id,
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next(err);
}