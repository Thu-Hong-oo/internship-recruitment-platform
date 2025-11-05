const jwt = require('jsonwebtoken');
const User = require('../../infrastructure/models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader);

    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id);
    console.log('User found:', !!user, user ? user.email : 'None');
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Allow users with these statuses to access protected routes
    const allowedStatuses = ['ACTIVE', 'active', 'PENDING_VERIFICATION'];
    if (!allowedStatuses.includes(user.status)) {
      console.log('User account disabled, status:', user.status);
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    console.log('Authentication successful for:', user.email);
    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

const authorizeSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const userId = req.params.userId || req.params.id;
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === userId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  next();
};

const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
    });
  }

  next();
};

const authorize = roles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = {
  protect: authenticateToken,
  authorize,
  authenticateToken,
  authorizeRoles,
  authorizeSelfOrAdmin,
  requireEmailVerification,
};
