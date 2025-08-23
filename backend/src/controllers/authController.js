const User = require('../models/User');
const Company = require('../models/Company');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// @desc    Register user (student, company, admin)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  // Check if email configuration is set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return res.status(500).json({
      success: false,
      error: 'Email configuration is not set up properly'
    });
  }

  const { email, password, firstName, lastName, role, companyName, companyInfo } = req.body;

  // Validate role
  const allowedRoles = ['student', 'company', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Must be student, company, or admin'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with this email'
    });
  }

  // For company registration, validate company info
  if (role === 'company') {
    if (!companyName || !companyInfo) {
      return res.status(400).json({
        success: false,
        error: 'Company name and company info are required for company registration'
      });
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        error: 'Company already exists with this email'
      });
    }
  }

  // For admin registration, check if admin already exists
  if (role === 'admin') {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin already exists. Only one admin is allowed.'
      });
    }
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Create user with pending verification
  const userData = {
    email,
    password,
    firstName,
    lastName,
    role,
    isEmailVerified: false,
    otp,
    otpExpiry
  };

  const user = await User.create(userData);

  // If company registration, create company record
  let company = null;
  if (role === 'company') {
    company = await Company.create({
      email,
      name: companyName,
      info: companyInfo,
      owner: user._id,
      isVerified: false
    });
  }

  // Create verification token
  const verificationToken = jwt.sign(
    { email, otp },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  // Create verification URL
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

  // Send OTP email with verification link
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Internship Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Email Verification</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Internship Recruitment Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to our platform!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for registering with us. To complete your registration, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>Alternative method:</strong> If the button doesn't work, you can also verify using this code:
          </p>
          
          <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333; letter-spacing: 3px;">
              ${otp}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            <li>This verification link will expire in 10 minutes</li>
            <li>If you didn't create an account, please ignore this email</li>
            <li>For security reasons, never share this verification code with anyone</li>
          </ul>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you're having trouble with the button above, copy and paste this URL into your web browser:<br>
              <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
            </p>
          </div>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center; color: #999;">
          <p style="margin: 0; font-size: 12px;">
            © 2024 Internship Recruitment Platform. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP sent to: ${email}`, { userId: user._id, role: user.role });
  } catch (error) {
    logger.error(`Failed to send OTP email: ${error.message}`, { userId: user._id });
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for verification code.',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified
    },
    company: company ? {
      id: company._id,
      name: company.name
    } : null
  });
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Email and OTP are required'
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Email is already verified'
    });
  }

  if (!user.otp || !user.otpExpiry) {
    return res.status(400).json({
      success: false,
      error: 'No OTP found or OTP expired'
    });
  }

  if (Date.now() > user.otpExpiry) {
    return res.status(400).json({
      success: false,
      error: 'OTP has expired'
    });
  }

  if (user.otp !== otp) {
    return res.status(400).json({
      success: false,
      error: 'Invalid OTP'
    });
  }

  // Verify email
  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  // If company user, verify company
  if (user.role === 'company') {
    await Company.findOneAndUpdate(
      { email: user.email },
      { isVerified: true }
    );
  }

  // Create token
  const token = user.getSignedJwtToken();

  logger.info(`Email verified for: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified
    }
  });
});

// @desc    Verify email with URL token
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmailWithToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Verification token is required'
    });
  }

  try {
    // Decode the token to get email and OTP
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, otp } = decoded;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found or OTP expired'
      });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired'
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // If company user, verify company
    if (user.role === 'company') {
      await Company.findOneAndUpdate(
        { email: user.email },
        { isVerified: true }
      );
    }

    // Create new token for login
    const loginToken = user.getSignedJwtToken();

    logger.info(`Email verified via URL for: ${user.email}`, { userId: user._id });

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/email-verified?success=true&token=${loginToken}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    logger.error(`Email verification token error: ${error.message}`);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/email-verified?success=false&error=Invalid verification link`;
    
    res.redirect(redirectUrl);
  }
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Email is already verified'
    });
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  // Create verification token
  const verificationToken = jwt.sign(
    { email, otp },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  // Create verification URL
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

  // Send new OTP email with verification link
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Internship Platform (Resent)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Email Verification</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Internship Recruitment Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Verification Link Resent</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            We've sent you a new verification link. Please click the button below to verify your email address:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>Alternative method:</strong> If the button doesn't work, you can also verify using this code:
          </p>
          
          <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333; letter-spacing: 3px;">
              ${otp}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            <li>This verification link will expire in 10 minutes</li>
            <li>If you didn't request this, please ignore this email</li>
            <li>For security reasons, never share this verification code with anyone</li>
          </ul>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you're having trouble with the button above, copy and paste this URL into your web browser:<br>
              <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
            </p>
          </div>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center; color: #999;">
          <p style="margin: 0; font-size: 12px;">
            © 2024 Internship Recruitment Platform. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP resent to: ${email}`, { userId: user._id });
  } catch (error) {
    logger.error(`Failed to resend OTP email: ${error.message}`, { userId: user._id });
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }

  res.status(200).json({
    success: true,
    message: 'OTP resent successfully. Please check your email.'
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(401).json({
      success: false,
      error: 'Please verify your email before logging in',
      needsVerification: true
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Account is deactivated'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Create token
  const token = user.getSignedJwtToken();

  logger.info(`User logged in: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: user.fullName,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`, { userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    dateOfBirth: req.body.dateOfBirth,
    gender: req.body.gender,
    address: req.body.address,
    education: req.body.education
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  logger.info(`User details updated: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      error: 'Password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  logger.info(`Password updated for user: ${user.email}`, { userId: user._id });

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'There is no user with that email'
    });
  }

  // Get reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  logger.info(`Password reset requested for: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Email sent',
    resetUrl
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`Password reset completed for: ${user.email}`, { userId: user._id });

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token
  });
});

module.exports = {
  register,
  verifyEmail,
  verifyEmailWithToken,
  resendOTP,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword
};
