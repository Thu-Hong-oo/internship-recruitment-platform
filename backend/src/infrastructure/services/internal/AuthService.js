const bcrypt = require('bcryptjs');

/**
 * AuthService - Handles authentication operations
 * Dependencies injected via constructor for proper DI
 */
class AuthService {
  constructor(userRepository, validationService, jwtService, emailService) {
    this.userRepository = userRepository;
    this.validationService = validationService;
    this.jwtService = jwtService;
    this.emailService = emailService;
  }

  async register(registerData) {
    try {
      // Validate input
      const validation = this.validationService.validateUser(registerData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(
        registerData.email
      );
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(registerData.password, saltRounds);

      // Create user
      const userData = {
        email: registerData.email,
        password,
        role: registerData.role,
        status: 'active',
        profile: registerData.profile || {},
        emailVerified: false,
      };

      const user = await this.userRepository.create(userData);

      // Generate email verification token
      const verificationToken = this.jwtService.generateEmailVerificationToken(
        user._id
      );

      // Send verification email
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken
      );

      // Generate tokens
      const tokens = this.jwtService.generateTokens(user);

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
        },
        tokens,
        message:
          'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await this.userRepository.findByEmailAndStatus(
        email,
        'active'
      );
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.userRepository.updateLastLogin(user._id);

      // Generate tokens
      const tokens = this.jwtService.generateTokens(user);

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin,
        },
        tokens,
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async verifyEmail(token) {
    try {
      const decoded = this.jwtService.verifyEmailVerificationToken(token);
      const userId = decoded.id || decoded.userId;
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerified) {
        throw new Error('Email already verified');
      }

      // Update user email verification status
      await this.userRepository.update(user._id, { emailVerified: true });

      return {
        success: true,
        message: 'Email đã được xác thực thành công',
      };
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  async forgotPassword(email) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate password reset token
      const resetToken = this.jwtService.generatePasswordResetToken(user._id);

      // Send password reset email
      await EmailService.sendPasswordResetEmail(user.email, resetToken);

      return {
        success: true,
        message: 'Email đặt lại mật khẩu đã được gửi thành công',
      };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const decoded = JWTService.verifyPasswordResetToken(token);
      const userId = decoded.id || decoded.userId;
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Validate new password
      const validation = this.validationService.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(
          `Password validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.userRepository.update(user._id, { password });

      return {
        success: true,
        message: 'Mật khẩu đã được đặt lại thành công',
      };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = JWTService.verifyRefreshToken(refreshToken);
      const userId = decoded.id || decoded.userId;
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'active') {
        throw new Error('User account is not active');
      }

      // Generate new tokens
      const tokens = JWTService.generateTokens(user);

      return {
        success: true,
        tokens,
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async logout(userId) {
    try {
      // In a production environment, you would blacklist the token
      // For now, we'll just return success
      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const validation = this.validationService.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(
          `Password validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.userRepository.update(userId, { password });

      return {
        success: true,
        message: 'Mật khẩu đã được thay đổi thành công',
      };
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async updateProfile(userId, profileData) {
    try {
      // Validate profile data
      const validation = this.validationService.validateProfile(profileData);
      if (!validation.isValid) {
        throw new Error(
          `Profile validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Update user profile
      const updatedUser = await this.userRepository.update(userId, {
        profile: profileData,
      });

      return {
        success: true,
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          profile: updatedUser.profile,
        },
        message: 'Hồ sơ đã được cập nhật thành công',
      };
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  async getProfile(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          profile: user.profile,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw new Error(`Profile retrieval failed: ${error.message}`);
    }
  }

  async verifyToken(token) {
    try {
      const decoded = JWTService.verifyAccessToken(token);
      const userId = decoded.id || decoded.userId;
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      };
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  async resendVerificationEmail(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerified) {
        throw new Error('Email already verified');
      }

      // Generate new verification token
      const verificationToken = JWTService.generateEmailVerificationToken(
        user._id
      );

      // Send verification email
      await EmailService.sendVerificationEmail(user.email, verificationToken);

      return {
        success: true,
        message: 'Email xác thực đã được gửi',
      };
    } catch (error) {
      throw new Error(`Resend verification failed: ${error.message}`);
    }
  }

  async deleteAccount(userId, password) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Password is incorrect');
      }

      // Soft delete user
      await this.userRepository.softDelete(userId);

      return {
        success: true,
        message: 'Tài khoản đã được xóa thành công',
      };
    } catch (error) {
      throw new Error(`Account deletion failed: ${error.message}`);
    }
  }
}

module.exports = AuthService;
