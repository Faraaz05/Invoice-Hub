const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and attach user to request
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

    // Get user from token
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Manager or higher middleware
const managerOrHigher = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'controller')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Manager privileges or higher required.'
    });
  }
};

// Controller or higher middleware
const controllerOrHigher = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'controller')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Controller privileges or higher required.'
    });
  }
};

module.exports = {
  protect,
  adminOnly,
  managerOrHigher,
  controllerOrHigher
};