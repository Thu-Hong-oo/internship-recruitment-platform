const ProfileController = require('./ProfileController');
const ResumeController = require('./ResumeController');
const ApplicationController = require('./ApplicationController');
const JobController = require('./JobController');
const CompanyController = require('./CompanyController');

class CandidateController {
  constructor() {
    // Initialize sub-controllers
    this.profileController = new ProfileController();
    this.resumeController = new ResumeController();
    this.applicationController = new ApplicationController();
    this.jobController = new JobController();
    this.companyController = new CompanyController();

    // Bind methods to preserve context
    this.bindMethods();
  }

  /**
   * Bind all methods from sub-controllers to this controller
   */
  bindMethods() {
    // Profile management methods
    this.getProfile = this.profileController.getProfile;
    this.updateProfile = this.profileController.updateProfile;
    this.getSection = this.profileController.getSection;
    this.addToSection = this.profileController.addToSection;
    this.updateSectionEntry = this.profileController.updateSectionEntry;
    this.deleteSectionEntry = this.profileController.deleteSectionEntry;

    // Resume management methods
    this.handleResume = this.resumeController.handleResume;
    this.getResume = this.resumeController.getResume;
    this.deleteResume = this.resumeController.deleteResume;
    this.setCurrentResume = this.resumeController.setCurrentResume;
    this.renameResume = this.resumeController.renameResume;
    this.viewCurrentCV = this.resumeController.viewCurrentCV;
    this.generateSmartResume = this.resumeController.generateSmartResume;
    this.generateTargetedResume = this.resumeController.generateTargetedResume;
    this.exportResumeWithEdits = this.resumeController.exportResumeWithEdits;

    // Application management methods
    this.getApplications = this.applicationController.getApplications;
    this.applyForJob = this.applicationController.applyForJob;
    this.updateApplication = this.applicationController.updateApplication;

    // Job management methods
    this.getJobs = this.jobController.getJobs;
    this.handleJobAction = this.jobController.handleJobAction;

    // Company management methods
    this.getCompanies = this.companyController.getCompanies;
    this.handleCompanyAction = this.companyController.handleCompanyAction;
  }

  /**
   * Get controller instance for specific functionality
   * Useful for accessing specific controller methods if needed
   */
  getProfileController() {
    return this.profileController;
  }

  getResumeController() {
    return this.resumeController;
  }

  getApplicationController() {
    return this.applicationController;
  }

  getJobController() {
    return this.jobController;
  }

  getCompanyController() {
    return this.companyController;
  }

  /**
   * Health check method for the controller
   */
  healthCheck(req, res) {
    res.status(200).json({
      status: 'OK',
      message: 'Candidate Controller is working',
      controllers: {
        profile: 'ProfileController',
        resume: 'ResumeController',
        application: 'ApplicationController',
        job: 'JobController',
        company: 'CompanyController',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = CandidateController;
