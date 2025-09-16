const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token
 * @param {string} idToken - Google ID token
 * @returns {Object} Google user information
 */
const verifyIdToken = async idToken => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid token payload');
    }

    logger.info('Google ID token verified successfully', {
      email: payload.email,
      googleId: payload.sub,
    });

    return {
      googleId: payload.sub,
      email: payload.email || '',
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      fullName: payload.name || '',
      avatar: payload.picture || '',
      locale: payload.locale || '',
      emailVerified: payload.email_verified || false,
    };
  } catch (error) {
    logger.error('Failed to verify Google ID token', { error: error.message });
    throw new Error('Invalid Google ID token');
  }
};

/**
 * Process Google authentication (login or register)
 * @param {string} idToken - Google ID token
 * @returns {Object} Authentication result
 */
const processGoogleAuth = async idToken => {
  try {
    // Verify the Google ID token
    const googleUser = await verifyIdToken(idToken);

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId: googleUser.googleId });

    if (user) {
      // User exists with Google OAuth
      logger.info('Google OAuth login successful', {
        userId: user._id,
        email: user.email,
      });

      return {
        user,
        isNew: false,
        message: 'Google OAuth login successful',
      };
    }

    // Check if user exists with this email but different auth method
    user = await User.findOne({ email: googleUser.email });

    if (user) {
      // User exists with local auth, link Google account
      if (user.authMethod === 'local') {
        user.googleId = googleUser.googleId;
        user.googleEmail = googleUser.email;
        user.googleProfile = {
          picture: googleUser.avatar,
          locale: googleUser.locale,
          verified_email: googleUser.emailVerified,
        };
        user.authMethod = 'hybrid';
        user.isEmailVerified = true;

        await user.save();

        logger.info('Google account linked to existing user', {
          userId: user._id,
          email: user.email,
        });

        return {
          user,
          isNew: false,
          message: 'Google account linked successfully',
        };
      } else if (user.authMethod === 'google') {
        // This shouldn't happen if googleId check above passed
        throw new Error('Account conflict detected');
      }
    }

    // Create new user with Google OAuth
    const newUser = await User.create({
      email: googleUser.email,
      profile: {
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        avatar: googleUser.avatar,
      },
      googleId: googleUser.googleId,
      googleEmail: googleUser.email,
      googleProfile: {
        picture: googleUser.avatar,
        locale: googleUser.locale,
        verified_email: googleUser.emailVerified,
      },
      role: 'student',
      authMethod: 'google',
      isEmailVerified: true,
    });

    logger.info('New user created with Google OAuth', {
      userId: newUser._id,
      email: newUser.email,
    });

    return {
      user: newUser,
      isNew: true,
      message: 'New user created with Google OAuth',
    };
  } catch (error) {
    logger.error('Google OAuth processing failed', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  verifyIdToken,
  processGoogleAuth,
};
