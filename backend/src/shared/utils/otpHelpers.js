const crypto = require('crypto');
const { logger } = require('./logger');

/**
 * Helper function to verify OTP from Redis or database with fallback
 * @param {Object} otpService - OTP service instance
 * @param {string} type - OTP type (password_reset, login, email_verification)
 * @param {string} email - User email
 * @param {string} otp - OTP code to verify
 * @param {Object} user - User model instance (for database fallback)
 * @param {string} otpField - Database field name for OTP
 * @param {string} expireField - Database field name for expiry
 * @returns {boolean} - True if OTP is valid
 */
const verifyOTP = async (
  otpService,
  type,
  email,
  otp,
  user,
  otpField,
  expireField
) => {
  let otpValid = false;

  if (otpService) {
    try {
      otpValid = await otpService.verifyAndDeleteOTP(type, email, otp);
    } catch (error) {
      logger.error(
        `Failed to verify OTP from Redis for ${type}, falling back to database`,
        {
          error: error.message,
          email,
          userId: user?._id,
        }
      );
      // Fallback to database verification
      if (user && user[otpField] && user[otpField] === otp.toUpperCase()) {
        if (user[expireField] && user[expireField] < Date.now()) {
          logger.warn(`Verify ${type} OTP attempt with expired OTP`, { email });
          throw new Error('OTP_EXPIRED');
        }
        otpValid = true;
      }
    }
  } else {
    // Database-only verification
    if (user && user[otpField] && user[otpField] === otp.toUpperCase()) {
      if (user[expireField] && user[expireField] < Date.now()) {
        logger.warn(`Verify ${type} OTP attempt with expired OTP (fallback)`, {
          email,
        });
        throw new Error('OTP_EXPIRED');
      }
      otpValid = true;
    }
  }

  return otpValid;
};

/**
 * Helper function to generate and store OTP
 * @param {Object} otpService - OTP service instance
 * @param {string} type - OTP type
 * @param {string} email - User email
 * @param {Object} user - User model instance (optional)
 * @param {string} tokenField - Database field for hashed token
 * @param {string} otpField - Database field for OTP
 * @param {string} expireField - Database field for expiry
 * @param {number} expiryTime - Expiry time in milliseconds
 * @returns {string} - Generated OTP
 */
const generateAndStoreOTP = async (
  otpService,
  type,
  email,
  user,
  tokenField,
  otpField,
  expireField,
  expiryTime
) => {
  const token = crypto.randomBytes(20).toString('hex');
  const otp = token
    .substring(0, 6)
    .toString('hex')
    .substring(0, 6)
    .toUpperCase();

  if (otpService) {
    try {
      await otpService.storeOTP(type, email, otp);
      if (user) {
        user[tokenField] = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');
        user[otpField] = undefined;
        user[expireField] = undefined;
      }
    } catch (error) {
      logger.error(
        `Failed to store OTP in Redis for ${type}, falling back to database`,
        {
          error: error.message,
          email,
          userId: user?._id,
        }
      );
      if (user) {
        user[tokenField] = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');
        user[otpField] = otp;
        user[expireField] = Date.now() + expiryTime;
      }
    }
  } else if (user) {
    user[tokenField] = crypto.createHash('sha256').update(token).digest('hex');
    user[otpField] = otp;
    user[expireField] = Date.now() + expiryTime;
  }

  if (user) {
    await user.save({ validateBeforeSave: false });
  }

  return otp;
};

module.exports = {
  verifyOTP,
  generateAndStoreOTP,
};
