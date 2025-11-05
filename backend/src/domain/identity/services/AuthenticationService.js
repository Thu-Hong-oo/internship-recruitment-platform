// src/domain/identity/services/AuthenticationService.js
const UserRole = require('../UserRole');
const UserStatus = require('../UserStatus');

class AuthenticationService {
  constructor(userRepository, employerRepository, candidateRepository) {
    this.userRepository = userRepository;
    this.employerRepository = employerRepository;
    this.candidateRepository = candidateRepository;
  }

  async authenticate(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.status !== 'ACTIVE') {
      throw new Error('Invalid credentials');
    }

    // In real implementation, verify password hash
    if (!user.validatePassword(password)) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async getUserRole(userId) {
    const user = await this.userRepository.findById(userId);
    return user ? user.role : null;
  }

  async getEmployerProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (user && user.role === UserRole.EMPLOYER) {
      return await this.employerRepository.findByUserId(userId);
    }
    return null;
  }

  async getCandidateProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (user && user.role === UserRole.CANDIDATE) {
      return await this.candidateRepository.findByUserId(userId);
    }
    return null;
  }
}

module.exports = AuthenticationService;
