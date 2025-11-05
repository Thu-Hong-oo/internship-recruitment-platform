// examples/domain-model-usage.js
// Example usage of the Domain Model classes

const User = require('../src/domain/identity/User');
const UserRole = require('../src/domain/identity/UserRole');
const UserStatus = require('../src/domain/identity/UserStatus');
const Company = require('../src/domain/recruitment/Company');
const Address = require('../src/domain/recruitment/Address');
const CompanySize = require('../src/domain/recruitment/CompanySize');
const JobPosting = require('../src/domain/recruitment/JobPosting');
const JobType = require('../src/domain/recruitment/JobType');
const Candidate = require('../src/domain/profile/Candidate');
const JobSeekingStatus = require('../src/domain/profile/JobSeekingStatus');
const { Comment, CommentTargetType } = require('../src/domain/supporting');
const { SuggestionService } = require('../src/domain/ai-nlp');
const { Skill } = require('../src/domain/master-data');

// Example 1: Creating a User (Employer)
console.log('=== Example 1: Creating Users ===');
const employer = new User(
  'user-123',
  'employer@company.com',
  'John Doe',
  UserRole.EMPLOYER,
  UserStatus.ACTIVE
);
console.log('Employer created:', employer);

// Example 2: Creating a Company
console.log('\n=== Example 2: Creating a Company ===');
const companyAddress = new Address(
  '123 Business St',
  'New York',
  'NY',
  '10001',
  'USA'
);
const company = new Company(
  'company-456',
  'Tech Corp',
  'user-123',
  companyAddress
);
company.updateInfo('Tech Corporation', 'Leading tech company');
company.size = CompanySize.MEDIUM;
console.log('Company created:', company);

// Example 3: Creating a Job Posting
console.log('\n=== Example 3: Creating a Job Posting ===');
const jobPosting = new JobPosting(
  'job-789',
  'Senior Developer',
  'We are looking for...',
  'company-456'
);
jobPosting.salaryMin = 80000;
jobPosting.salaryMax = 120000;
jobPosting.location = 'New York, NY';
jobPosting.jobType = JobType.FULL_TIME;
jobPosting.publish();
console.log('Job posting created and published:', jobPosting);

// Example 4: Creating a Candidate Profile with Skill objects
console.log('\n=== Example 4: Creating a Candidate Profile with Skills ===');
const candidate = new Candidate('candidate-101', 'user-456');
candidate.updateProfile(
  'Full Stack Developer',
  'Experienced developer with 5+ years'
);

// Create skill objects
const jsSkill = new Skill({
  skillId: 'skill-1',
  slug: 'javascript',
  skillName: 'JavaScript',
  description: 'Programming language',
});
const nodeSkill = new Skill({
  skillId: 'skill-2',
  slug: 'nodejs',
  skillName: 'Node.js',
  description: 'JavaScript runtime',
});
const reactSkill = new Skill({
  skillId: 'skill-3',
  slug: 'react',
  skillName: 'React',
  description: 'Frontend library',
});

candidate.addSkill(jsSkill);
candidate.addSkill(nodeSkill);
candidate.addSkill(reactSkill);
candidate.updateExperience(5);
candidate.activateJobSeeking();
console.log('Candidate profile created:', candidate);
console.log('Skills:', candidate.getSkillNames());
console.log(
  'Profile completeness:',
  candidate.calculateProfileCompleteness() + '%'
);

// Example 8: Creating Comments
console.log('\n=== Example 8: Creating Comments ===');
const comment = new Comment(
  'comment-123',
  'user-456',
  CommentTargetType.JOB_POSTING,
  'job-789',
  'This is a great job opportunity!'
);
comment.create();
console.log('Comment created:', comment);

// Create a reply
const reply = comment.reply('comment-123', 'I agree, this looks perfect!');
reply.create();
console.log('Reply created:', reply);

// Example 9: Using Suggestion Service
console.log('\n=== Example 9: Using Suggestion Service ===');
// Mock repositories for demonstration
const mockSkillRepo = {
  findActive: async () => [
    jsSkill,
    nodeSkill,
    reactSkill,
    new Skill({
      skillId: 'skill-4',
      slug: 'python',
      skillName: 'Python',
      description: 'Programming language',
    }),
  ],
};

const mockJobPostingRepo = {
  findAll: async () => [jobPosting],
};

const mockCompanyRepo = {
  findAll: async () => [company],
};

const suggestionService = new SuggestionService(
  mockSkillRepo,
  mockJobPostingRepo,
  mockCompanyRepo
);

// Demonstrate suggestions
(async () => {
  const skillSuggestions = await suggestionService.suggestSkills('Java');
  console.log(
    'Skill suggestions for "Java":',
    skillSuggestions.map(s => s.name)
  );

  const titleSuggestions = await suggestionService.suggestJobTitles('Dev');
  console.log('Job title suggestions for "Dev":', titleSuggestions);

  const companySuggestions = await suggestionService.suggestCompanies('Tech');
  console.log('Company suggestions for "Tech":', companySuggestions);

  const locationSuggestions = await suggestionService.suggestLocations('New');
  console.log('Location suggestions for "New":', locationSuggestions);
})();

// Example 5: Business Logic Demonstration
console.log('\n=== Example 5: Business Logic ===');
console.log(
  'Employer can access employer features:',
  employer.canAccessEmployerFeatures()
);
console.log('Company is fully verified:', company.isFullyVerified());
console.log('Job is active:', jobPosting.isActive());
console.log('Candidate is job seeking:', candidate.isJobSeeking());

// Example 6: Domain Relationships
console.log('\n=== Example 6: Domain Relationships ===');
console.log(
  'Company owns job posting:',
  jobPosting.companyId === company.companyId
);
console.log('Job posting belongs to company:', company.companyId);

// Example 7: Value Object Immutability
console.log('\n=== Example 7: Value Object ===');
const address1 = new Address('456 Main St', 'Boston', 'MA', '02101', 'USA');
const address2 = new Address('456 Main St', 'Boston', 'MA', '02101', 'USA');
console.log('Addresses are equal:', address1.equals(address2));

module.exports = {
  employer,
  company,
  jobPosting,
  candidate,
  companyAddress,
  comment,
  reply,
  suggestionService,
  jsSkill,
  nodeSkill,
  reactSkill,
};
