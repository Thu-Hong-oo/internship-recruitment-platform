const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

class CandidateValidation {
  // ============================================
  // PROFILE VALIDATION
  // ============================================

  updateProfile = [
    body('personalInfo.fullName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),

    body('personalInfo.phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number format'),

    body('personalInfo.dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),

    body('personalInfo.gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Invalid gender option'),

    body('personalInfo.bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),

    body('education.university.name')
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage('University name must be between 2 and 200 characters'),

    body('education.university.major')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Major must be between 2 and 100 characters'),

    body('education.university.gpa')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('GPA must be between 0 and 10'),

    // Smart CV Builder Validations
    body('preferences.locations')
      .optional()
      .isArray()
      .withMessage('Locations must be an array'),

    body('preferences.internshipTypes')
      .optional()
      .isArray()
      .withMessage('Internship types must be an array'),

    body('preferences.industries')
      .optional()
      .isArray()
      .withMessage('Industries must be an array'),

    body('preferences.minSalary')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum salary must be a positive number'),

    body('preferences.duration.min')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration minimum must be a positive number'),

    body('preferences.duration.max')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration maximum must be a positive number'),

    body('preferences.duration.unit')
      .optional()
      .isIn(['days', 'weeks', 'months', 'years'])
      .withMessage('Duration unit must be one of: days, weeks, months, years'),
  ];

  // ============================================
  // EDUCATION VALIDATION
  // ============================================

  addEducation = [
    body('type')
      .isIn(['university', 'certification'])
      .withMessage('Education type must be university or certification'),

    body('institution')
      .notEmpty()
      .isLength({ min: 2, max: 200 })
      .withMessage(
        'Institution name is required and must be between 2 and 200 characters'
      ),

    body('degree')
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        'Degree is required and must be between 2 and 100 characters'
      ),

    body('field')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Field must be between 2 and 100 characters'),

    body('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),

    body('gpa')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('GPA must be between 0 and 10'),
  ];

  updateEducation = [
    param('id').isMongoId().withMessage('Invalid education ID'),

    body('institution')
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage('Institution name must be between 2 and 200 characters'),

    body('degree')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Degree must be between 2 and 100 characters'),

    body('gpa')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('GPA must be between 0 and 10'),
  ];

  // ============================================
  // EXPERIENCE VALIDATION
  // ============================================

  addExperience = [
    body('type')
      .isIn(['internship', 'project'])
      .withMessage('Experience type must be internship or project'),

    body('title')
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        'Title is required and must be between 2 and 100 characters'
      ),

    body('company')
      .if(body('type').equals('internship'))
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        'Company is required for internships and must be between 2 and 100 characters'
      ),

    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),

    body('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),

    body('technologies')
      .optional()
      .isArray()
      .withMessage('Technologies must be an array'),
  ];

  updateExperience = [
    param('id').isMongoId().withMessage('Invalid experience ID'),

    body('title')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Title must be between 2 and 100 characters'),

    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
  ];

  // ============================================
  // SKILLS VALIDATION
  // ============================================

  addSkill = [
    body('type')
      .isIn(['technical', 'soft', 'language'])
      .withMessage('Skill type must be technical, soft, or language'),

    body('name')
      .notEmpty()
      .isLength({ min: 1, max: 50 })
      .withMessage(
        'Skill name is required and must be between 1 and 50 characters'
      ),

    body('level')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Skill level must be beginner, intermediate, or advanced'),

    body('selfAssessment')
      .if(body('type').equals('soft'))
      .isInt({ min: 1, max: 10 })
      .withMessage('Self assessment must be between 1 and 10'),
  ];

  updateSkill = [
    param('id').isMongoId().withMessage('Invalid skill ID'),

    body('name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Skill name must be between 1 and 50 characters'),

    body('level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Skill level must be beginner, intermediate, or advanced'),
  ];

  // ============================================
  // PROJECTS VALIDATION
  // ============================================

  addProject = [
    body('name')
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        'Project name is required and must be between 2 and 100 characters'
      ),

    body('description')
      .notEmpty()
      .isLength({ min: 10, max: 1000 })
      .withMessage(
        'Project description is required and must be between 10 and 1000 characters'
      ),

    body('role')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Role must be between 2 and 50 characters'),

    body('technologies')
      .optional()
      .isArray()
      .withMessage('Technologies must be an array'),

    body('url').optional().isURL().withMessage('Invalid URL format'),

    body('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
  ];

  updateProject = [
    param('id').isMongoId().withMessage('Invalid project ID'),

    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Project name must be between 2 and 100 characters'),

    body('description')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage(
        'Project description must be between 10 and 1000 characters'
      ),
  ];

  // ============================================
  // CERTIFICATIONS VALIDATION
  // ============================================

  addCertification = [
    body('name')
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        'Certification name is required and must be between 2 and 100 characters'
      ),

    body('issuer')
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        'Issuer is required and must be between 2 and 100 characters'
      ),

    body('issueDate')
      .isISO8601()
      .withMessage('Issue date must be a valid date'),

    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),

    body('credentialUrl')
      .optional()
      .isURL()
      .withMessage('Invalid credential URL format'),
  ];

  updateCertification = [
    param('id').isMongoId().withMessage('Invalid certification ID'),

    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Certification name must be between 2 and 100 characters'),

    body('issuer')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Issuer must be between 2 and 100 characters'),
  ];

  // ============================================
  // RESUME VALIDATION
  // ============================================

  generateResume = [
    body('template')
      .optional()
      .isIn(['modern', 'classic', 'creative', 'minimal'])
      .withMessage('Template must be modern, classic, creative, or minimal'),

    body('targetJob')
      .optional()
      .isMongoId()
      .withMessage('Invalid target job ID'),
  ];

  // ============================================
  // CAREER GOALS VALIDATION
  // ============================================

  updateCareerGoals = [
    body('careerGoals')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Career goals cannot exceed 500 characters'),

    body('targetRoles')
      .optional()
      .isArray()
      .withMessage('Target roles must be an array'),

    body('desiredIndustries')
      .optional()
      .isArray()
      .withMessage('Desired industries must be an array'),

    body('salaryExpectations.min')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum salary must be a positive number'),

    body('salaryExpectations.max')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Maximum salary must be a positive number'),
  ];

  updatePreferences = [
    body('locations')
      .optional()
      .isArray()
      .withMessage('Locations must be an array'),

    body('internshipTypes')
      .optional()
      .isArray()
      .withMessage('Internship types must be an array'),

    body('industries')
      .optional()
      .isArray()
      .withMessage('Industries must be an array'),

    body('minSalary')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum salary must be a positive number'),

    body('availableFrom')
      .optional()
      .isISO8601()
      .withMessage('Available from date must be a valid date'),

    body('duration.min')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration minimum must be a positive number'),

    body('duration.max')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration maximum must be a positive number'),

    body('duration.unit')
      .optional()
      .isIn(['days', 'weeks', 'months', 'years'])
      .withMessage('Duration unit must be one of: days, weeks, months, years'),
  ];

  // ============================================
  // JOB SEARCH VALIDATION
  // ============================================

  searchJobs = [
    query('keyword')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search keyword must be between 1 and 100 characters'),

    query('location')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Location must be between 1 and 100 characters'),

    query('industry')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Industry must be between 1 and 50 characters'),

    query('skills')
      .optional()
      .custom(value => {
        const skills = value.split(',');
        return skills.length <= 10;
      })
      .withMessage('Maximum 10 skills allowed'),

    query('jobType')
      .optional()
      .isIn(['Fulltime', 'Parttime', 'Intern', 'Freelance', 'Remote', 'Hybrid'])
      .withMessage('Invalid job type'),

    query('salaryMin')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum salary must be a positive number'),

    query('salaryMax')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Maximum salary must be a positive number'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ];

  // ============================================
  // APPLICATION VALIDATION
  // ============================================

  applyForJob = [
    param('id').isMongoId().withMessage('Invalid job ID'),

    body('coverLetter')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Cover letter cannot exceed 1000 characters'),

    body('resumeVersion')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Resume version must be a positive integer'),
  ];

  getApplications = [
    query('status')
      .optional()
      .isIn([
        'pending',
        'reviewing',
        'interview',
        'offer',
        'hired',
        'rejected',
        'withdrawn',
      ])
      .withMessage('Invalid application status'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ];

  // ============================================
  // SAVED JOBS VALIDATION
  // ============================================

  getSavedJobs = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ];

  // ============================================
  // COMPANY FOLLOW VALIDATION
  // ============================================

  getFollowedCompanies = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ];

  // ============================================
  // SMART CV BUILDER VALIDATIONS
  // ============================================

  getCVSuggestions = [
    body('section')
      .notEmpty()
      .isIn(['objective', 'skills', 'projects', 'experience', 'education'])
      .withMessage(
        'Invalid section. Must be one of: objective, skills, projects, experience, education'
      ),

    body('template')
      .optional()
      .isIn([
        'student-tech',
        'internship-business',
        'fresher-simple',
        'creative-design',
      ])
      .withMessage('Invalid template'),

    body('targetRole')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Target role must be between 2 and 100 characters'),
  ];

  guidedCVBuild = [
    body('step')
      .notEmpty()
      .isInt({ min: 1, max: 7 })
      .withMessage('Step must be between 1 and 7'),

    body('template')
      .optional()
      .isIn([
        'student-tech',
        'internship-business',
        'fresher-simple',
        'creative-design',
      ])
      .withMessage('Invalid template'),

    body('targetRole')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Target role must be between 2 and 100 characters'),

    body('data').optional().isObject().withMessage('Data must be an object'),
  ];

  autoFillCV = [
    body('template')
      .notEmpty()
      .isIn([
        'student-tech',
        'internship-business',
        'fresher-simple',
        'creative-design',
      ])
      .withMessage('Template is required and must be valid'),

    body('targetRole')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Target role must be between 2 and 100 characters'),
  ];
}

module.exports = {
  candidateValidation: new CandidateValidation(),
};
