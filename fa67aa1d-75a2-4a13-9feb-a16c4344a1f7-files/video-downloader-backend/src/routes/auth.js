import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { 
  generateApiKey, 
  generateJWT, 
  addApiKey, 
  removeApiKey, 
  listApiKeys 
} from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Simple admin credentials (use proper database in production)
const ADMIN_USERS = new Map([
  ['admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'] // 'password'
]);

/**
 * @route POST /api/auth/login
 * @desc Admin login to get JWT token
 * @access Public
 */
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Check if user exists
    const hashedPassword = ADMIN_USERS.get(username);
    if (!hashedPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      logger.warn(`Failed login attempt for user: ${username}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateJWT({
      username,
      role: 'admin'
    }, '24h');

    logger.info(`Successful login for user: ${username}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        token,
        expiresIn: '24h',
        user: {
          username,
          role: 'admin'
        }
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/key
 * @desc Generate new API key
 * @access Public (with admin credentials)
 */
router.post('/key', [
  body('adminPassword')
    .notEmpty()
    .withMessage('Admin password is required'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { adminPassword, description = 'Generated API key' } = req.body;

    // Verify admin password
    const adminHash = ADMIN_USERS.get('admin');
    const isValidPassword = await bcrypt.compare(adminPassword, adminHash);
    
    if (!isValidPassword) {
      logger.warn('Failed API key generation attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    addApiKey(apiKey);

    logger.info('New API key generated', {
      keyPrefix: apiKey.substring(0, 10) + '...',
      description,
      ip: req.ip
    });

    res.json({
      success: true,
      data: {
        apiKey,
        description,
        createdAt: new Date().toISOString(),
        usage: {
          rateLimit: '100 requests per 15 minutes',
          endpoints: ['POST /api/video/extract', 'POST /api/video/download']
        }
      }
    });

  } catch (error) {
    logger.error('API key generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/auth/keys
 * @desc List all API keys (masked)
 * @access Admin only
 */
router.get('/keys', [
  body('adminPassword').notEmpty().withMessage('Admin password is required')
], async (req, res) => {
  try {
    const { adminPassword } = req.query;

    if (!adminPassword) {
      return res.status(400).json({
        success: false,
        error: 'Admin password is required as query parameter'
      });
    }

    // Verify admin password
    const adminHash = ADMIN_USERS.get('admin');
    const isValidPassword = await bcrypt.compare(adminPassword, adminHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    const keys = listApiKeys();

    res.json({
      success: true,
      data: {
        keys,
        total: keys.length
      }
    });

  } catch (error) {
    logger.error('API key listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/auth/key
 * @desc Revoke API key
 * @access Admin only
 */
router.delete('/key', [
  body('adminPassword').notEmpty().withMessage('Admin password is required'),
  body('apiKey').notEmpty().withMessage('API key is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { adminPassword, apiKey } = req.body;

    // Verify admin password
    const adminHash = ADMIN_USERS.get('admin');
    const isValidPassword = await bcrypt.compare(adminPassword, adminHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    // Remove API key
    const removed = removeApiKey(apiKey);

    if (removed) {
      logger.info('API key revoked', {
        keyPrefix: apiKey.substring(0, 10) + '...',
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'API key revoked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

  } catch (error) {
    logger.error('API key revocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/validate
 * @desc Validate API key
 * @access Public
 */
router.post('/validate', [
  body('apiKey').notEmpty().withMessage('API key is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { apiKey } = req.body;

    // This would normally check against a database
    // For demo purposes, we'll just check the format
    const isValid = apiKey.startsWith('vd_') || 
                   apiKey === 'demo-key-12345' || 
                   apiKey === 'test-key-67890';

    res.json({
      success: true,
      data: {
        valid: isValid,
        keyType: isValid ? 'valid' : 'invalid',
        permissions: isValid ? ['video:extract', 'video:download'] : [],
        rateLimit: isValid ? '100 requests per 15 minutes' : null
      }
    });

  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;