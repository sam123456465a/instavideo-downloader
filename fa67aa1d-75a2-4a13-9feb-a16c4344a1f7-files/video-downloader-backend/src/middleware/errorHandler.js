import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong on our end'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details
    };
    res.status(400);
  } else if (err.name === 'UnauthorizedError') {
    error = {
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key or authentication required'
    };
    res.status(401);
  } else if (err.name === 'ForbiddenError') {
    error = {
      success: false,
      error: 'Forbidden',
      message: 'Access denied'
    };
    res.status(403);
  } else if (err.name === 'NotFoundError') {
    error = {
      success: false,
      error: 'Not Found',
      message: err.message || 'Resource not found'
    };
    res.status(404);
  } else if (err.name === 'RateLimitError') {
    error = {
      success: false,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: err.retryAfter
    };
    res.status(429);
  } else if (err.code === 'ENOENT') {
    error = {
      success: false,
      error: 'File Not Found',
      message: 'The requested file could not be found'
    };
    res.status(404);
  } else if (err.code === 'ENOSPC') {
    error = {
      success: false,
      error: 'Storage Full',
      message: 'Server storage is full. Please try again later.'
    };
    res.status(507);
  } else if (err.message && err.message.includes('timeout')) {
    error = {
      success: false,
      error: 'Timeout',
      message: 'Request timed out. The video might be too large or the source is slow.'
    };
    res.status(408);
  } else if (err.message && err.message.includes('private')) {
    error = {
      success: false,
      error: 'Access Denied',
      message: 'This video is private or requires authentication'
    };
    res.status(403);
  } else if (err.message && err.message.includes('unavailable')) {
    error = {
      success: false,
      error: 'Content Unavailable',
      message: 'This video is not available for download'
    };
    res.status(410);
  }

  // Set status if not already set
  if (!res.statusCode || res.statusCode === 200) {
    res.status(500);
  }

  // Add request ID for tracking
  error.requestId = req.id || 'unknown';
  error.timestamp = new Date().toISOString();

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.json(error);
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req, res) {
  const error = {
    success: false,
    error: 'Not Found',
    message: `${req.method} ${req.originalUrl} not found`,
    suggestions: [
      'Check the URL for typos',
      'Ensure you\'re using the correct HTTP method',
      'Refer to the API documentation at /api/docs'
    ],
    timestamp: new Date().toISOString()
  };

  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json(error);
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}