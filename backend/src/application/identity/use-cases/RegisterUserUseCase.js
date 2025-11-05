const User = require('../../../infrastructure/models/User');
const CandidateProfile = require('../../../infrastructure/models/CandidateProfile');
const EmployerProfile = require('../../../infrastructure/models/EmployerProfile');
const { logger } = require('../../../shared/utils/logger');
const EmailService = require('../../../infrastructure/services/external/core/EmailService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * UseCase for user registration
 * Handles business logic for registering a new user
 */
class RegisterUserUseCase {
  constructor(otpService) {
    this.otpService = otpService;
  }

  async execute({ email, password, fullName, role }) {
    // Check if user already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // Check if email is already in registration process (Redis)
    const existingRegistration = await this.otpService.get(
      `user_registration:${email}`
    );
    if (existingRegistration) {
      throw new Error('REGISTRATION_IN_PROGRESS');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token and OTP
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationOtp = verificationToken.substring(0, 6).toUpperCase();

    // Store user data in Redis
    const userData = {
      email,
      password: hashedPassword,
      fullName,
      role,
      verificationToken: crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex'),
    };

    await this.otpService.setWithExpiry(
      `user_registration:${email}`,
      JSON.stringify(userData),
      24 * 60 * 60 // 24 hours expiry
    );

    // Store OTP
    await this.otpService.storeOTP(
      'email_verification',
      email,
      verificationOtp
    );

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(
        { email, fullName },
        verificationOtp
      );
      return { email, emailSent: true };
    } catch (emailError) {
      logger.error('Failed to send verification email during registration', {
        error: emailError.message,
        email,
      });

      // Cleanup stored data if email sending fails
      await this.otpService.delete(`user_registration:${email}`);
      await this.otpService.deleteOTP('email_verification', email);

      throw emailError;
    }
  }

  async createUserProfile(email, role) {
    const user = await User.findOne({ email });
    if (!user) return;

    if (role === 'candidate') {
      const candidateProfile = await CandidateProfile.create({
        userId: user._id,
        personalInfo: { fullName: user.fullName },
      });
      user.candidateProfile = candidateProfile._id;
      await user.save();
    } else if (role === 'employer') {
      const timestamp = Date.now().toString().slice(-6);
      const tempTaxId = `123456${timestamp}`;
      const companyEmail = `company_${user._id}@company.com`;

      const employerProfile = await EmployerProfile.create({
        owner: user._id,
        company: {
          name: 'Chưa cập nhật',
          industry: 'technology',
          size: 'small',
          email: companyEmail,
        },
        position: {
          title: 'Chưa cập nhật',
          level: 'junior',
          department: 'Chưa cập nhật',
        },
        contact: {
          name: user.fullName || 'Chưa cập nhật',
          phone: '0123456789',
          email: user.email,
        },
        legalRepresentative: {
          fullName: user.fullName || 'Chưa cập nhật',
          position: 'Chưa cập nhật',
          phone: '0123456789',
          email: user.email,
        },
        businessInfo: {
          registrationNumber: `temp_${user._id}`,
          taxId: tempTaxId,
          issueDate: new Date(),
          issuePlace: 'Chưa cập nhật',
          address: {
            street: 'Chưa cập nhật',
            ward: 'Chưa cập nhật',
            district: 'Chưa cập nhật',
            city: 'Chưa cập nhật',
            country: 'Vietnam',
          },
        },
        verification: {
          isVerified: false,
          steps: {
            businessInfo: false,
            documents: false,
          },
          documents: [],
        },
        status: 'pending',
      });
      user.employerProfile = employerProfile._id;
      await user.save();
    }
  }
}

module.exports = RegisterUserUseCase;
