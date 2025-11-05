// src/domain/recruitment/services/RecruitmentService.js
const CompanyInvitation = require('../CompanyInvitation');
const JobApplication = require('../JobApplication');
const ApplicationStatus = require('../ApplicationStatus');
const CompanyRole = require('../CompanyRole');

class RecruitmentService {
  constructor(
    companyRepository,
    jobPostingRepository,
    jobApplicationRepository,
    companyInvitationRepository,
    employerRepository
  ) {
    this.companyRepository = companyRepository;
    this.jobPostingRepository = jobPostingRepository;
    this.jobApplicationRepository = jobApplicationRepository;
    this.companyInvitationRepository = companyInvitationRepository;
    this.employerRepository = employerRepository;
  }

  async createJobPosting(companyId, details) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const jobPosting = new JobPosting(
      details.jobId,
      details.title,
      details.description,
      details.location,
      details.jobType,
      details.status,
      new Date(),
      details.benefits,
      details.applicationDeadline,
      details.experienceYears
    );

    return await this.jobPostingRepository.save(jobPosting);
  }

  async submitApplication(jobId, candidateId, applicationData) {
    const job = await this.jobPostingRepository.findById(jobId);
    if (!job) {
      throw new Error('Job posting not found');
    }

    const application = new JobApplication(
      applicationData.applicationId,
      ApplicationStatus.SUBMITTED,
      new Date(),
      applicationData.coverLetter,
      applicationData.attachments
    );

    // Associate with candidate and job
    application.candidateId = candidateId;
    application.jobId = jobId;

    return await this.jobApplicationRepository.save(application);
  }

  async inviteEmployer(companyId, email, role) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const invitation = new CompanyInvitation(
      null, // ID will be generated
      email,
      role,
      company.ownerId,
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      'PENDING',
      null // token will be generated
    );

    return await this.companyInvitationRepository.save(invitation);
  }

  async getJobApplications(jobId) {
    return await this.jobApplicationRepository.findByJobId(jobId);
  }

  async updateApplicationStatus(applicationId, status) {
    const application = await this.jobApplicationRepository.findById(
      applicationId
    );
    if (!application) {
      throw new Error('Application not found');
    }

    application.status = status;
    return await this.jobApplicationRepository.save(application);
  }
}

module.exports = RecruitmentService;
