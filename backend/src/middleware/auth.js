const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes,  Middleware bảo vệ route
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Kiểm tra token từ Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];

    // 2. Kiểm tra token từ cookie (fallback)
  } else if (req.cookies && req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  }

  // Make sure token exists

  // 3. Kiểm tra token tồn tại
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // 4. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Tìm user từ database
    req.user = await User.findById(decoded.id);

    // 6. Kiểm tra user tồn tại
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // 7. Kiểm tra user có active không
    if (!req.user.isActive) {
      return res
        .status(401)
        .json({ success: false, error: 'User account is deactivated' });
    }

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: 'Not authorized to access this route' });
  }
});

// Grant access to specific roles

// Middleware phân quyền theo role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token

// // Route có thể truy cập không cần đăng nhập, nhưng có thêm thông tin nếu đã đăng nhập
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      // Token is invalid, but we don't fail the request
      req.user = null;
    }
  }

  next();
});

// Require email verification for protected routes

// Error type để frontend xử lý
const requireEmailVerification = asyncHandler(async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res
      .status(403)
      .json({
        success: false,
        error:
          'Email chưa được xác thực. Vui lòng xác thực email trước khi truy cập tính năng này.',
        errorType: 'EMAIL_NOT_VERIFIED',
        requiresEmailVerification: true,
      });
  }
  next();
});

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireEmailVerification,
};
