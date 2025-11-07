/**
 * Dependency Injection Container
 * Infrastructure Layer - Configuration
 *
 * This is the Composition Root for the application following Clean Architecture.
 * All dependencies are registered here using Awilix container.
 */
const {
  createContainer,
  asClass,
  asValue,
  asFunction,
  Lifetime,
  InjectionMode,
} = require('awilix');

// Import configurations
const databaseConfig = require('../../config/database');

// Import repositories
const UserRepository = require('../repositories/UserRepository');
const CandidateRepository = require('../repositories/CandidateRepository');
const EmployerRepository = require('../repositories/EmployerRepository');
const CVRepository = require('../repositories/CVRepository');
const JobRepository = require('../repositories/JobRepository');
const ApplicationRepository = require('../repositories/ApplicationRepository');
const CompanyRepository = require('../repositories/CompanyRepository');
const CompanyInvitationRepository = require('../repositories/CompanyInvitationRepository');
const SkillRepository = require('../repositories/SkillRepository');
const NotificationRepository = require('../repositories/NotificationRepository');
const SavedJobRepository = require('../repositories/SavedJobRepository');
const ConversationRepository = require('../repositories/ConversationRepository');
const MessageRepository = require('../repositories/MessageRepository');
const IndustryRepository = require('../repositories/IndustryRepository');
const LearningRoadmapRepository = require('../repositories/LearningRoadmapRepository');
const RoadmapRepository = require('../repositories/RoadmapRepository');
const PlanRepository = require('../repositories/PlanRepository');
const SubscriptionRepository = require('../repositories/SubscriptionRepository');

// Import external services (already singleton instances) - organized by category
const UnifiedUploadService = require('../services/external/core/UnifiedUploadService');
const EmailService = require('../services/external/core/EmailService');
const JWTService = require('../services/external/core/JWTService');
const QueueService = require('../services/external/core/QueueService');
const SocketService = require('../services/external/core/SocketService');
const GeminiAIService = require('../services/external/ai/GeminiAIService');
const CVParserService = require('../services/external/cv-resume/CVParserService');
const NLPEngine = require('../../domain/ai-nlp/services/NLPEngine');

// Import internal services (classes - will be instantiated by container)
const ValidationService = require('../services/internal/ValidationService');
const AuthService = require('../services/internal/AuthService');
const NotificationService = require('../services/internal/NotificationService');
const CVAnalysisService = require('../services/internal/CVAnalysisService');
const ChatService = require('../services/internal/ChatService');
const SkillService = require('../services/internal/SkillService');
const AdminService = require('../services/internal/AdminService');
const ConversationService = require('../services/internal/ConversationService');
const MessageService = require('../services/internal/MessageService');
const SavedJobService = require('../services/internal/SavedJobService');
const IndustryService = require('../services/internal/IndustryService');
const LearningRoadmapService = require('../services/internal/LearningRoadmapService');
const RoadmapService = require('../services/internal/RoadmapService');
const PlanService = require('../services/internal/PlanService');
const SubscriptionService = require('../services/internal/SubscriptionService');

// Import OTP services getters (for lazy resolution)
const {
  getOTPService,
  getOTPCooldownService,
} = require('./initializeServices');

// Import Identity Use Cases
const RegisterUserUseCase = require('../../application/identity/use-cases/RegisterUserUseCase');
const LoginUserUseCase = require('../../application/identity/use-cases/LoginUserUseCase');
const LoginWithGoogleUseCase = require('../../application/identity/use-cases/LoginWithGoogleUseCase');
const LogoutUseCase = require('../../application/identity/use-cases/LogoutUseCase');
const ForgotPasswordUseCase = require('../../application/identity/use-cases/ForgotPasswordUseCase');
const ResetPasswordUseCase = require('../../application/identity/use-cases/ResetPasswordUseCase');
const VerifyEmailUseCase = require('../../application/identity/use-cases/VerifyEmailUseCase');
const ResendEmailVerificationUseCase = require('../../application/identity/use-cases/ResendEmailVerificationUseCase');
const RefreshTokenUseCase = require('../../application/identity/use-cases/RefreshTokenUseCase');
const RequestLoginOTPUseCase = require('../../application/identity/use-cases/RequestLoginOTPUseCase');
const VerifyLoginOTPUseCase = require('../../application/identity/use-cases/VerifyLoginOTPUseCase');
const GetMeUseCase = require('../../application/identity/use-cases/GetMeUseCase');
const GetUnverifiedAccountUseCase = require('../../application/identity/use-cases/GetUnverifiedAccountUseCase');

// Import Profile Use Cases
// NOTE: CreateCandidateProfileUseCase removed - profile auto-created on registration
const GetCandidateProfileUseCase = require('../../application/profile/use-cases/GetCandidateProfileUseCase');
const UpdateCandidateProfileUseCase = require('../../application/profile/use-cases/UpdateCandidateProfileUseCase');
const UploadCVUseCase = require('../../application/profile/use-cases/UploadCVUseCase');
const GetCandidateCVsUseCase = require('../../application/profile/use-cases/GetCandidateCVsUseCase');
const ViewCVUseCase = require('../../application/profile/use-cases/ViewCVUseCase');
const DeleteCVUseCase = require('../../application/profile/use-cases/DeleteCVUseCase');
const SetDefaultCVUseCase = require('../../application/profile/use-cases/SetDefaultCVUseCase');
const UploadAvatarUseCase = require('../../application/profile/use-cases/UploadAvatarUseCase');
const AnalyzeCVUseCase = require('../../application/profile/use-cases/AnalyzeCVUseCase');

// Import Employer Use Cases
// NOTE: CreateEmployerProfileUseCase removed - profile auto-created on registration
const GetEmployerProfileUseCase = require('../../application/profile/use-cases/GetEmployerProfileUseCase');
const UpdateEmployerProfileUseCase = require('../../application/profile/use-cases/UpdateEmployerProfileUseCase');
const CreateCompanyUseCase = require('../../application/profile/use-cases/CreateCompanyUseCase');
const InviteMemberUseCase = require('../../application/profile/use-cases/InviteMemberUseCase');
const AcceptInvitationUseCase = require('../../application/profile/use-cases/AcceptInvitationUseCase');
const GetCompanyMembersUseCase = require('../../application/profile/use-cases/GetCompanyMembersUseCase');
const UpdateMemberPermissionsUseCase = require('../../application/profile/use-cases/UpdateMemberPermissionsUseCase');
const UploadCompanyDocumentUseCase = require('../../application/profile/use-cases/UploadCompanyDocumentUseCase');
const GetCompanyDocumentsUseCase = require('../../application/profile/use-cases/GetCompanyDocumentsUseCase');
const DeleteCompanyDocumentUseCase = require('../../application/profile/use-cases/DeleteCompanyDocumentUseCase');

// Import Recruitment Use Cases
const ApplyForJobUseCase = require('../../application/recruitment/use-cases/ApplyForJobUseCase');
const GetCandidateApplicationsUseCase = require('../../application/recruitment/use-cases/GetCandidateApplicationsUseCase');

// Import Job Use Cases
const CreateJobUseCase = require('../../application/recruitment/use-cases/CreateJobUseCase');
const GetJobUseCase = require('../../application/recruitment/use-cases/GetJobUseCase');
const GetAllJobsUseCase = require('../../application/recruitment/use-cases/GetAllJobsUseCase');
const UpdateJobUseCase = require('../../application/recruitment/use-cases/UpdateJobUseCase');
const DeleteJobUseCase = require('../../application/recruitment/use-cases/DeleteJobUseCase');

// Import Admin Use Cases
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
const VerifyEmployerDocumentUseCase = require('../../application/admin/use-cases/VerifyEmployerDocumentUseCase');

// Create container
const container = createContainer();

// Register dependencies
container.register({
  // Repositories - Singleton lifetime
  userRepository: asClass(UserRepository, { lifetime: Lifetime.SINGLETON }),
  candidateRepository: asClass(CandidateRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  employerRepository: asClass(EmployerRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  cvRepository: asClass(CVRepository, { lifetime: Lifetime.SINGLETON }),
  jobRepository: asClass(JobRepository, { lifetime: Lifetime.SINGLETON }),
  applicationRepository: asClass(ApplicationRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  companyRepository: asClass(CompanyRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  companyInvitationRepository: asClass(CompanyInvitationRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  skillRepository: asClass(SkillRepository, { lifetime: Lifetime.SINGLETON }),
  notificationRepository: asClass(NotificationRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  savedJobRepository: asClass(SavedJobRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  conversationRepository: asClass(ConversationRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  messageRepository: asClass(MessageRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  industryRepository: asClass(IndustryRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  learningRoadmapRepository: asClass(LearningRoadmapRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  roadmapRepository: asClass(RoadmapRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  planRepository: asClass(PlanRepository, {
    lifetime: Lifetime.SINGLETON,
  }),
  subscriptionRepository: asClass(SubscriptionRepository, {
    lifetime: Lifetime.SINGLETON,
  }),

  // External Services - Already singleton instances (exported as instances)
  unifiedUploadService: asValue(UnifiedUploadService),
  uploadService: asValue(UnifiedUploadService), // Alias for uploadService
  emailService: asValue(EmailService),
  jwtService: asValue(JWTService),
  queueService: asValue(QueueService),
  socketService: asValue(SocketService),
  geminiAIService: asValue(GeminiAIService),

  // AI/NLP Services - Instantiated by container
  cvParserService: asClass(CVParserService, {
    lifetime: Lifetime.SINGLETON,
  }),

  // Internal Services - Will be instantiated by container with DI
  validationService: asClass(ValidationService, {
    lifetime: Lifetime.SINGLETON,
  }),
  authService: asClass(AuthService, {
    lifetime: Lifetime.SINGLETON,
  }),
  notificationService: asClass(NotificationService, {
    lifetime: Lifetime.SINGLETON,
  }),
  cvAnalysisService: asClass(CVAnalysisService, {
    lifetime: Lifetime.SINGLETON,
  }),
  chatService: asClass(ChatService, {
    lifetime: Lifetime.SINGLETON,
  }),
  skillService: asClass(SkillService, {
    lifetime: Lifetime.SINGLETON,
  }),
  adminService: asClass(AdminService, {
    lifetime: Lifetime.SINGLETON,
  }),
  conversationService: asClass(ConversationService, {
    lifetime: Lifetime.SINGLETON,
  }),
  messageService: asClass(MessageService, {
    lifetime: Lifetime.SINGLETON,
  }),
  savedJobService: asClass(SavedJobService, {
    lifetime: Lifetime.SINGLETON,
  }),
  industryService: asClass(IndustryService, {
    lifetime: Lifetime.SINGLETON,
  }),
  learningRoadmapService: asClass(LearningRoadmapService, {
    lifetime: Lifetime.SINGLETON,
  }),
  roadmapService: asClass(RoadmapService, {
    lifetime: Lifetime.SINGLETON,
  }),
  planService: asClass(PlanService, {
    lifetime: Lifetime.SINGLETON,
  }),
  subscriptionService: asClass(SubscriptionService, {
    lifetime: Lifetime.SINGLETON,
  }),

  // OTP Services - Lazy resolution (may be null initially)
  otpService: asFunction(() => getOTPService(), {
    lifetime: Lifetime.SINGLETON,
  }),
  otpCooldownService: asFunction(() => getOTPCooldownService(), {
    lifetime: Lifetime.SINGLETON,
  }),

  // Identity Use Cases - Some need OTP services injected
  registerUserUseCase: asFunction(
    ({ otpService }) => new RegisterUserUseCase(otpService),
    { lifetime: Lifetime.SCOPED }
  ),
  registerCandidateUseCase: asFunction(
    ({ otpService }) => new RegisterUserUseCase(otpService),
    { lifetime: Lifetime.SCOPED }
  ),
  loginUserUseCase: asClass(LoginUserUseCase),
  loginUseCase: asClass(LoginUserUseCase), // Alias for controller compatibility
  loginWithGoogleUseCase: asClass(LoginWithGoogleUseCase),
  logoutUseCase: asClass(LogoutUseCase),
  forgotPasswordUseCase: asFunction(
    ({ otpService, otpCooldownService }) =>
      new ForgotPasswordUseCase(otpService, otpCooldownService),
    { lifetime: Lifetime.SCOPED }
  ),
  requestPasswordResetUseCase: asFunction(
    ({ otpService, otpCooldownService }) =>
      new ForgotPasswordUseCase(otpService, otpCooldownService),
    { lifetime: Lifetime.SCOPED }
  ),
  resetPasswordUseCase: asFunction(
    ({ otpService }) => new ResetPasswordUseCase(otpService),
    { lifetime: Lifetime.SCOPED }
  ),
  verifyEmailUseCase: asFunction(
    ({ otpService }) => new VerifyEmailUseCase(otpService),
    { lifetime: Lifetime.SCOPED }
  ),
  resendEmailVerificationUseCase: asFunction(
    ({ otpService, otpCooldownService }) =>
      new ResendEmailVerificationUseCase(otpService, otpCooldownService),
    { lifetime: Lifetime.SCOPED }
  ),
  refreshTokenUseCase: asClass(RefreshTokenUseCase),
  requestLoginOTPUseCase: asFunction(
    ({ otpService, otpCooldownService }) =>
      new RequestLoginOTPUseCase(otpService, otpCooldownService),
    { lifetime: Lifetime.SCOPED }
  ),
  verifyLoginOTPUseCase: asFunction(
    ({ otpService }) => new VerifyLoginOTPUseCase(otpService),
    { lifetime: Lifetime.SCOPED }
  ),
  getMeUseCase: asClass(GetMeUseCase),
  getUnverifiedAccountUseCase: asClass(GetUnverifiedAccountUseCase),

  // Profile Use Cases - Per request scope
  // NOTE: createCandidateProfileUseCase removed - auto-created on registration
  getCandidateProfileUseCase: asClass(GetCandidateProfileUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  updateCandidateProfileUseCase: asClass(UpdateCandidateProfileUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  uploadCVUseCase: asClass(UploadCVUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  getCandidateCVsUseCase: asClass(GetCandidateCVsUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  viewCVUseCase: asClass(ViewCVUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  deleteCVUseCase: asClass(DeleteCVUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  setDefaultCVUseCase: asClass(SetDefaultCVUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  uploadAvatarUseCase: asClass(UploadAvatarUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  analyzeCVUseCase: asClass(AnalyzeCVUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),

  // Employer Use Cases
  // NOTE: createEmployerProfileUseCase removed - auto-created on registration
  getEmployerProfileUseCase: asClass(GetEmployerProfileUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  updateEmployerProfileUseCase: asClass(UpdateEmployerProfileUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),

  // Company Management Use Cases
  createCompanyUseCase: asClass(CreateCompanyUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  inviteMemberUseCase: asClass(InviteMemberUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  acceptInvitationUseCase: asClass(AcceptInvitationUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  getCompanyMembersUseCase: asClass(GetCompanyMembersUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  updateMemberPermissionsUseCase: asClass(UpdateMemberPermissionsUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),

  // Company Document Verification Use Cases
  uploadCompanyDocumentUseCase: asClass(UploadCompanyDocumentUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  getCompanyDocumentsUseCase: asClass(GetCompanyDocumentsUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),
  deleteCompanyDocumentUseCase: asClass(DeleteCompanyDocumentUseCase, {
    injectionMode: InjectionMode.CLASSIC,
  }),

  // Recruitment Use Cases
  applyForJobUseCase: asClass(ApplyForJobUseCase),
  getCandidateApplicationsUseCase: asClass(GetCandidateApplicationsUseCase),

  // Job Use Cases
  createJobUseCase: asClass(CreateJobUseCase).singleton(),
  getJobUseCase: asClass(GetJobUseCase),
  getAllJobsUseCase: asClass(GetAllJobsUseCase),
  updateJobUseCase: asClass(UpdateJobUseCase),
  deleteJobUseCase: asClass(DeleteJobUseCase),

  // Admin Use Cases
  getSystemDashboardUseCase: asClass(GetSystemDashboardUseCase),
  getAllUsersUseCase: asClass(GetAllUsersUseCase),
  getUserByIdUseCase: asClass(GetUserByIdUseCase),
  updateUserStatusUseCase: asClass(UpdateUserStatusUseCase),
  deleteUserUseCase: asClass(DeleteUserUseCase),
  getSystemStatsUseCase: asClass(GetSystemStatsUseCase),
  getSystemLogsUseCase: asClass(GetSystemLogsUseCase),
  getSystemHealthUseCase: asClass(GetSystemHealthUseCase),
  getQueueStatusUseCase: asClass(GetQueueStatusUseCase),
  clearQueueUseCase: asClass(ClearQueueUseCase),
  getSystemSettingsUseCase: asClass(GetSystemSettingsUseCase),
  updateSystemSettingsUseCase: asClass(UpdateSystemSettingsUseCase),
  sendSystemNotificationUseCase: asClass(SendSystemNotificationUseCase),
  getSystemReportsUseCase: asClass(GetSystemReportsUseCase),
  verifyEmployerDocumentUseCase: asClass(VerifyEmployerDocumentUseCase),

  // Configuration values
  databaseConfig: asValue(databaseConfig),
});

/**
 * Middleware to inject container into request
 * Creates a scoped container for each request
 */
function containerMiddleware(req, res, next) {
  req.container = container.createScope();
  next();
}

module.exports = {
  container,
  containerMiddleware,
};
