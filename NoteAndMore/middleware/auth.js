// ===== middleware/auth.js =====
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied',
        details: 'No token provided' 
      });
    }

    // Check if token starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied',
        details: 'Invalid token format' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied',
        details: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Access denied',
        details: 'Account is deactivated' 
      });
    }

    // Add user to request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied',
        details: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied',
        details: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      details: 'Authentication failed' 
    });
  }
};

// Optional middleware for routes that work with or without auth
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// Admin middleware
const adminRequired = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied',
        details: 'Authentication required' 
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'Admin privileges required' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error',
      details: 'Authorization failed' 
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminRequired
};