// Recruitment Domain Exports
// Entities
const Job = require('./entities/Job');
const Application = require('./entities/Application');
const Company = require('./Company');
const CompanyMember = require('./CompanyMember');
const CompanyInvitation = require('./CompanyInvitation');
const JobPosting = require('./JobPosting');
const JobApplication = require('./JobApplication');
const Employer = require('./entities/Employer');
const JobFollowing = require('./entities/JobFollowing');
const JobSaving = require('./entities/JobSaving');

// Services
const RecruitmentService = require('./services/RecruitmentService');

// Enums
const JobStatus = require('./enums/JobStatus');
const ApplicationStatus = require('./enums/ApplicationStatus');
const EmploymentType = require('./enums/EmploymentType');
const CompanySize = require('./CompanySize');
const VerificationStatus = require('./VerificationStatus');
const CompanyRole = require('./CompanyRole');
const MemberStatus = require('./MemberStatus');
const InvitationStatus = require('./InvitationStatus');
const JobType = require('./JobType');
const FollowingTargetType = require('./enums/FollowingTargetType');

// Value Objects
const SalaryRange = require('./value-objects/SalaryRange');
const JobRequirements = require('./value-objects/JobRequirements');
const Address = require('./Address');
const JobRequirement = require('./value-objects/JobRequirement');

// Repository Interfaces
const IJobRepository = require('./repositories/IJobRepository');
const IApplicationRepository = require('./repositories/IApplicationRepository');

module.exports = {
  // Entities
  Job,
  Application,
  Company,
  CompanyMember,
  CompanyInvitation,
  JobPosting,
  JobApplication,
  Employer,
  JobFollowing,
  JobSaving,

  // Services
  RecruitmentService,

  // Enums
  JobStatus,
  ApplicationStatus,
  EmploymentType,
  CompanySize,
  VerificationStatus,
  CompanyRole,
  MemberStatus,
  InvitationStatus,
  JobType,
  FollowingTargetType,

  // Value Objects
  SalaryRange,
  JobRequirements,
  Address,
  JobRequirement,

  // Repository Interfaces
  IJobRepository,
  IApplicationRepository,
};
