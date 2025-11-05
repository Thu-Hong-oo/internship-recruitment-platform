// Identity Domain - Entities
const User = require('./User');
const Candidate = require('./entities/Candidate');
const Employer = require('./entities/Employer');
const Admin = require('./entities/Admin');
const Credential = require('./entities/Credential');
const OAuthCredential = require('./entities/OAuthCredential');

// Identity Domain - Services
const AuthenticationService = require('./services/AuthenticationService');

// Identity Domain - Enums
const UserStatus = require('./UserStatus');
const UserRole = require('./UserRole');
const OAuthProvider = require('./enums/OAuthProvider');

// Identity Domain - Repositories (Interfaces)
const IUserRepository = require('./repositories/IUserRepository');
const ICredentialRepository = require('./repositories/ICredentialRepository');

// Export domain entities, enums, and repository interfaces
module.exports = {
  // Entities
  User,
  Candidate,
  Employer,
  Admin,
  Credential,
  OAuthCredential,

  // Services
  AuthenticationService,

  // Enums
  UserStatus,
  UserRole,
  OAuthProvider,

  // Repository Interfaces
  IUserRepository,
  ICredentialRepository,
};
