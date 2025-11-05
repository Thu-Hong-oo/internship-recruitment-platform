// Dependency Injection Container
const CandidateRepository = require('../repositories/CandidateRepository');
const EmployerRepository = require('../repositories/EmployerRepository');
const UserRepository = require('../repositories/UserRepository');
const JobRepository = require('../repositories/JobRepository');
const CompanyRepository = require('../repositories/CompanyRepository');
const ApplicationRepository = require('../repositories/ApplicationRepository');
const AdminRepository = require('../repositories/AdminRepository');

// Application Layer - Profile
const CreateCandidateProfileUseCase = require('../../application/profile/use-cases/CreateCandidateProfileUseCase');
const GetCandidateProfileUseCase = require('../../application/profile/use-cases/GetCandidateProfileUseCase');
const UpdateCandidateProfileUseCase = require('../../application/profile/use-cases/UpdateCandidateProfileUseCase');

const CreateEmployerProfileUseCase = require('../../application/profile/use-cases/CreateEmployerProfileUseCase');
const GetEmployerProfileUseCase = require('../../application/profile/use-cases/GetEmployerProfileUseCase');
const UpdateEmployerProfileUseCase = require('../../application/profile/use-cases/UpdateEmployerProfileUseCase');

// Application Layer - Identity
const RegisterUserUseCase = require('../../application/identity/use-cases/RegisterUserUseCase');
const LoginUserUseCase = require('../../application/identity/use-cases/LoginUserUseCase');
const VerifyEmailUseCase = require('../../application/identity/use-cases/VerifyEmailUseCase');
const ForgotPasswordUseCase = require('../../application/identity/use-cases/ForgotPasswordUseCase');
const ResetPasswordUseCase = require('../../application/identity/use-cases/ResetPasswordUseCase');
const LoginWithGoogleUseCase = require('../../application/identity/use-cases/LoginWithGoogleUseCase');
const ResendEmailVerificationUseCase = require('../../application/identity/use-cases/ResendEmailVerificationUseCase');
const GetMeUseCase = require('../../application/identity/use-cases/GetMeUseCase');
const GetUnverifiedAccountUseCase = require('../../application/identity/use-cases/GetUnverifiedAccountUseCase');
const RefreshTokenUseCase = require('../../application/identity/use-cases/RefreshTokenUseCase');
const LogoutUseCase = require('../../application/identity/use-cases/LogoutUseCase');
const RequestLoginOTPUseCase = require('../../application/identity/use-cases/RequestLoginOTPUseCase');
const VerifyLoginOTPUseCase = require('../../application/identity/use-cases/VerifyLoginOTPUseCase');

// Use Cases - Identity (initialized after services are ready)
let _registerUserUseCase;
let _loginUserUseCase;
let _verifyEmailUseCase;
let _forgotPasswordUseCase;
let _resetPasswordUseCase;
let _loginWithGoogleUseCase;
let _resendEmailVerificationUseCase;
let _getMeUseCase;
let _getUnverifiedAccountUseCase;
let _refreshTokenUseCase;
let _logoutUseCase;
let _requestLoginOTPUseCase;
let _verifyLoginOTPUseCase;

// Application Layer - Recruitment
const CreateJobUseCase = require('../../application/recruitment/use-cases/CreateJobUseCase');
const GetJobUseCase = require('../../application/recruitment/use-cases/GetJobUseCase');
const GetAllJobsUseCase = require('../../application/recruitment/use-cases/GetAllJobsUseCase');
const UpdateJobUseCase = require('../../application/recruitment/use-cases/UpdateJobUseCase');
const DeleteJobUseCase = require('../../application/recruitment/use-cases/DeleteJobUseCase');
const ApplyForJobUseCase = require('../../application/recruitment/use-cases/ApplyForJobUseCase');
const GetCandidateApplicationsUseCase = require('../../application/recruitment/use-cases/GetCandidateApplicationsUseCase');

// Application Layer - Admin
const GetSystemDashboardUseCase = require('../../application/admin/use-cases/GetSystemDashboardUseCase');
const GetAllUsersUseCase = require('../../application/admin/use-cases/GetAllUsersUseCase');
const GetUserByIdUseCase = require('../../application/admin/use-cases/GetUserByIdUseCase');
const UpdateUserStatusUseCase = require('../../application/admin/use-cases/UpdateUserStatusUseCase');
const DeleteUserUseCase = require('../../application/admin/use-cases/DeleteUserUseCase');
const GetSystemStatsUseCase = require('../../application/admin/use-cases/GetSystemStatsUseCase');
const GetSystemLogsUseCase = require('../../application/admin/use-cases/GetSystemLogsUseCase');
const GetSystemHealthUseCase = require('../../application/admin/use-cases/GetSystemHealthUseCase');
const GetQueueStatusUseCase = require('../../application/admin/use-cases/GetQueueStatusUseCase');
const ClearQueueUseCase = require('../../application/admin/use-cases/ClearQueueUseCase');
const GetSystemSettingsUseCase = require('../../application/admin/use-cases/GetSystemSettingsUseCase');
const UpdateSystemSettingsUseCase = require('../../application/admin/use-cases/UpdateSystemSettingsUseCase');
const SendSystemNotificationUseCase = require('../../application/admin/use-cases/SendSystemNotificationUseCase');
const GetSystemReportsUseCase = require('../../application/admin/use-cases/GetSystemReportsUseCase');

// Services
const ValidationService = require('../services/internal/ValidationService');
const {
  getOTPService,
  getOTPCooldownService,
} = require('./initializeServices');

// Repositories
const candidateRepository = new CandidateRepository();
const employerRepository = new EmployerRepository();
const userRepository = new UserRepository();
const jobRepository = new JobRepository();
const companyRepository = new CompanyRepository();
const applicationRepository = new ApplicationRepository();
const adminRepository = new AdminRepository();

// Services
const validationService = new ValidationService();

// Use Cases - Profile
const createCandidateProfileUseCase = new CreateCandidateProfileUseCase(
  candidateRepository,
  userRepository
);

const getCandidateProfileUseCase = new GetCandidateProfileUseCase(
  candidateRepository
);

const updateCandidateProfileUseCase = new UpdateCandidateProfileUseCase(
  candidateRepository
);

const createEmployerProfileUseCase = new CreateEmployerProfileUseCase(
  employerRepository,
  userRepository
);

const getEmployerProfileUseCase = new GetEmployerProfileUseCase(
  employerRepository
);

const updateEmployerProfileUseCase = new UpdateEmployerProfileUseCase(
  employerRepository
);

// Function to initialize identity use cases after OTP services are ready
function initializeIdentityUseCases() {
  const otpService = getOTPService();
  const otpCooldown = getOTPCooldownService();

  _registerUserUseCase = new RegisterUserUseCase(otpService);
  _loginUserUseCase = new LoginUserUseCase();
  _verifyEmailUseCase = new VerifyEmailUseCase(otpService);
  _forgotPasswordUseCase = new ForgotPasswordUseCase(otpService, otpCooldown);
  _resetPasswordUseCase = new ResetPasswordUseCase(otpService);
  _loginWithGoogleUseCase = new LoginWithGoogleUseCase();
  _resendEmailVerificationUseCase = new ResendEmailVerificationUseCase(
    otpService,
    otpCooldown
  );
  _getMeUseCase = new GetMeUseCase();
  _getUnverifiedAccountUseCase = new GetUnverifiedAccountUseCase();
  _refreshTokenUseCase = new RefreshTokenUseCase();
  _logoutUseCase = new LogoutUseCase();
  _requestLoginOTPUseCase = new RequestLoginOTPUseCase(otpService, otpCooldown);
  _verifyLoginOTPUseCase = new VerifyLoginOTPUseCase(otpService);

  console.log('RegisterUserUseCase initialized:', !!_registerUserUseCase);
  console.log(
    'RegisterUserUseCase has execute method:',
    !!(_registerUserUseCase && _registerUserUseCase.execute)
  );
}

// Use Cases - Recruitment
const createJobUseCase = new CreateJobUseCase(
  jobRepository,
  employerRepository,
  companyRepository,
  validationService
);

const getJobUseCase = new GetJobUseCase(jobRepository);

const getAllJobsUseCase = new GetAllJobsUseCase(jobRepository);

const updateJobUseCase = new UpdateJobUseCase(jobRepository, validationService);

const deleteJobUseCase = new DeleteJobUseCase(jobRepository);

const applyForJobUseCase = new ApplyForJobUseCase(
  applicationRepository,
  candidateRepository,
  jobRepository
);

const getCandidateApplicationsUseCase = new GetCandidateApplicationsUseCase(
  applicationRepository
);

// Use Cases - Admin
const getSystemDashboardUseCase = new GetSystemDashboardUseCase(
  adminRepository
);
const getAllUsersUseCase = new GetAllUsersUseCase(adminRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(adminRepository);
const updateUserStatusUseCase = new UpdateUserStatusUseCase(adminRepository);
const deleteUserUseCase = new DeleteUserUseCase(adminRepository);
const getSystemStatsUseCase = new GetSystemStatsUseCase(adminRepository);
const getSystemLogsUseCase = new GetSystemLogsUseCase(adminRepository);
const getSystemHealthUseCase = new GetSystemHealthUseCase(adminRepository);
const getQueueStatusUseCase = new GetQueueStatusUseCase(adminRepository);
const clearQueueUseCase = new ClearQueueUseCase(adminRepository);
const getSystemSettingsUseCase = new GetSystemSettingsUseCase(adminRepository);
const updateSystemSettingsUseCase = new UpdateSystemSettingsUseCase(
  adminRepository
);
const sendSystemNotificationUseCase = new SendSystemNotificationUseCase(
  adminRepository
);
const getSystemReportsUseCase = new GetSystemReportsUseCase(adminRepository);

module.exports = {
  // Function to initialize identity use cases
  initializeIdentityUseCases,

  // Use Cases - Identity (lazy initialized)
  get registerUserUseCase() {
    return _registerUserUseCase;
  },
  get loginUserUseCase() {
    return _loginUserUseCase;
  },
  get verifyEmailUseCase() {
    return _verifyEmailUseCase;
  },
  get forgotPasswordUseCase() {
    return _forgotPasswordUseCase;
  },
  get resetPasswordUseCase() {
    return _resetPasswordUseCase;
  },
  get loginWithGoogleUseCase() {
    return _loginWithGoogleUseCase;
  },
  get resendEmailVerificationUseCase() {
    return _resendEmailVerificationUseCase;
  },
  get getMeUseCase() {
    return _getMeUseCase;
  },
  get getUnverifiedAccountUseCase() {
    return _getUnverifiedAccountUseCase;
  },
  get refreshTokenUseCase() {
    return _refreshTokenUseCase;
  },
  get logoutUseCase() {
    return _logoutUseCase;
  },
  get requestLoginOTPUseCase() {
    return _requestLoginOTPUseCase;
  },
  get verifyLoginOTPUseCase() {
    return _verifyLoginOTPUseCase;
  },

  // Use Cases - Profile
  createCandidateProfileUseCase,
  getCandidateProfileUseCase,
  updateCandidateProfileUseCase,
  createEmployerProfileUseCase,
  getEmployerProfileUseCase,
  updateEmployerProfileUseCase,

  // Use Cases - Recruitment
  createJobUseCase,
  getJobUseCase,
  getAllJobsUseCase,
  updateJobUseCase,
  deleteJobUseCase,
  applyForJobUseCase,
  getCandidateApplicationsUseCase,

  // Use Cases - Admin
  getSystemDashboardUseCase,
  getAllUsersUseCase,
  getUserByIdUseCase,
  updateUserStatusUseCase,
  deleteUserUseCase,
  getSystemStatsUseCase,
  getSystemLogsUseCase,
  getSystemHealthUseCase,
  getQueueStatusUseCase,
  clearQueueUseCase,
  getSystemSettingsUseCase,
  updateSystemSettingsUseCase,
  sendSystemNotificationUseCase,
  getSystemReportsUseCase,

  // Repositories
  candidateRepository,
  employerRepository,
  userRepository,
  jobRepository,
  companyRepository,
  applicationRepository,
  adminRepository,

  // Services
  validationService,
};
