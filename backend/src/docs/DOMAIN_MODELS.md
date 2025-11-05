# Domain Models

## Tong quan

Domain Models mo ta cac business entities, value objects, enums va relationships trong he thong Internship Recruitment Platform.

## Core Entities

### User

Entity chinh dai dien cho tat ca nguoi dung trong he thong.

```javascript
class User {
  constructor(props) {
    this.id = props.id; // Unique identifier
    this.email = props.email; // Unique email
    this.password = props.password; // Hashed password
    this.fullName = props.fullName;
    this.role = props.role; // CANDIDATE | EMPLOYER | ADMIN
    this.status = props.status; // ACTIVE | INACTIVE | SUSPENDED
    this.emailVerified = props.emailVerified; // Boolean
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Business methods
  activate() {
    this.status = 'ACTIVE';
    this.updatedAt = new Date();
  }

  suspend() {
    this.status = 'SUSPENDED';
    this.updatedAt = new Date();
  }

  verifyEmail() {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }
}
```

**Relationships:**

- One-to-One: User -> CandidateProfile | EmployerProfile
- One-to-Many: User -> Applications, SavedJobs, Notifications

### Job

Entity dai dien cho job posting.

```javascript
class Job {
  constructor(props) {
    this.id = props.id;
    this.title = props.title; // Required, 5-100 chars
    this.description = props.description; // Required, max 5000 chars
    this.companyId = props.companyId; // Reference to Company
    this.location = props.location;
    this.type = props.type; // FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP
    this.experience = props.experience; // Entry | Junior | Senior | Expert
    this.salary = props.salary; // Salary range object
    this.requirements = props.requirements; // Array of skill strings
    this.benefits = props.benefits; // Array of benefit strings
    this.status = props.status; // ACTIVE | INACTIVE | EXPIRED | FILLED
    this.applicationDeadline = props.applicationDeadline;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Business methods
  isExpired() {
    return new Date() > this.applicationDeadline;
  }

  isActive() {
    return this.status === 'ACTIVE' && !this.isExpired();
  }

  close() {
    this.status = 'FILLED';
    this.updatedAt = new Date();
  }
}
```

**Relationships:**

- Many-to-One: Job -> Company
- One-to-Many: Job -> Applications, SavedJobs

### Company

Entity dai dien cho cong ty.

```javascript
class Company {
  constructor(props) {
    this.id = props.id;
    this.name = props.name; // Required, unique
    this.description = props.description;
    this.website = props.website;
    this.location = props.location;
    this.industry = props.industry;
    this.size = props.size; // Startup | Small | Medium | Large | Enterprise
    this.logo = props.logo; // File URL
    this.verified = props.verified; // Boolean
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Business methods
  verify() {
    this.verified = true;
    this.updatedAt = new Date();
  }
}
```

**Relationships:**

- One-to-Many: Company -> Jobs, Users (employers)

### Application

Entity dai dien cho job application.

```javascript
class Application {
  constructor(props) {
    this.id = props.id;
    this.jobId = props.jobId; // Reference to Job
    this.candidateId = props.candidateId; // Reference to User (candidate)
    this.status = props.status; // PENDING | REVIEWING | ACCEPTED | REJECTED | WITHDRAWN
    this.coverLetter = props.coverLetter;
    this.cv = props.cv; // File URL
    this.appliedAt = props.appliedAt;
    this.updatedAt = props.updatedAt;
  }

  // Business methods
  accept() {
    this.status = 'ACCEPTED';
    this.updatedAt = new Date();
  }

  reject() {
    this.status = 'REJECTED';
    this.updatedAt = new Date();
  }

  withdraw() {
    this.status = 'WITHDRAWN';
    this.updatedAt = new Date();
  }
}
```

**Relationships:**

- Many-to-One: Application -> Job, Application -> User (candidate)

## Profile Entities

### CandidateProfile

Extended profile cho candidates.

```javascript
class CandidateProfile {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId; // Reference to User
    this.phone = props.phone;
    this.location = props.location;
    this.bio = props.bio;
    this.experience = props.experience; // Years of experience
    this.skills = props.skills; // Array of skill strings
    this.education = props.education; // Array of education objects
    this.cv = props.cv; // File URL
    this.portfolio = props.portfolio; // Website URL
    this.linkedin = props.linkedin; // LinkedIn URL
    this.github = props.github; // GitHub URL
  }
}
```

### EmployerProfile

Extended profile cho employers.

```javascript
class EmployerProfile {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId; // Reference to User
    this.companyId = props.companyId; // Reference to Company
    this.position = props.position; // Job title in company
    this.department = props.department;
    this.phone = props.phone;
  }
}
```

## Value Objects

### Salary

Value object cho salary range.

```javascript
class Salary {
  constructor(props) {
    this.min = props.min; // Minimum salary
    this.max = props.max; // Maximum salary
    this.currency = props.currency; // USD | VND | EUR
  }

  // Value object methods
  equals(other) {
    return (
      this.min === other.min &&
      this.max === other.max &&
      this.currency === other.currency
    );
  }

  toString() {
    return `${this.currency} ${this.min} - ${this.max}`;
  }
}
```

### Email

Value object cho email validation.

```javascript
class Email {
  constructor(value) {
    this.value = value;
    this.validate();
  }

  validate() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new Error('Invalid email format');
    }
  }

  equals(other) {
    return this.value === other.value;
  }

  toString() {
    return this.value;
  }
}
```

### Skill

Value object cho skill.

```javascript
class Skill {
  constructor(props) {
    this.name = props.name; // Skill name
    this.category = props.category; // Technical | Soft | Language
    this.level = props.level; // Beginner | Intermediate | Advanced | Expert
  }

  equals(other) {
    return this.name === other.name;
  }
}
```

## Enums

### UserRole

```javascript
const UserRole = {
  CANDIDATE: 'CANDIDATE',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
};
```

### UserStatus

```javascript
const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
};
```

### JobType

```javascript
const JobType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERNSHIP: 'INTERNSHIP',
  FREELANCE: 'FREELANCE',
};
```

### JobStatus

```javascript
const JobStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
  FILLED: 'FILLED',
  DRAFT: 'DRAFT',
};
```

### ApplicationStatus

```javascript
const ApplicationStatus = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
};
```

### ExperienceLevel

```javascript
const ExperienceLevel = {
  ENTRY: 'ENTRY',
  JUNIOR: 'JUNIOR',
  MID: 'MID',
  SENIOR: 'SENIOR',
  EXPERT: 'EXPERT',
};
```

### CompanySize

```javascript
const CompanySize = {
  STARTUP: 'STARTUP', // 1-10 employees
  SMALL: 'SMALL', // 11-50 employees
  MEDIUM: 'MEDIUM', // 51-200 employees
  LARGE: 'LARGE', // 201-1000 employees
  ENTERPRISE: 'ENTERPRISE', // 1000+ employees
};
```

## Domain Services

### AIMatchingService

Service xu ly AI matching logic.

```javascript
class AIMatchingService {
  constructor(props) {
    this.nlpEngine = props.nlpEngine;
    this.skillRepository = props.skillRepository;
  }

  async matchCandidateToJob(candidate, job) {
    // Extract skills from job requirements
    const jobSkills = await this.nlpEngine.extractSkills(job.requirements);

    // Extract skills from candidate profile
    const candidateSkills = candidate.skills;

    // Calculate skill match score
    const skillScore = this.calculateSkillMatchScore(
      candidateSkills,
      jobSkills
    );

    // Calculate experience match score
    const experienceScore = this.calculateExperienceMatchScore(
      candidate.experience,
      job.experience
    );

    // Calculate overall match score
    const overallScore = skillScore * 0.7 + experienceScore * 0.3;

    return {
      score: overallScore,
      skillMatch: skillScore,
      experienceMatch: experienceScore,
      recommendations: this.generateRecommendations(candidate, job),
    };
  }
}
```

### NotificationService

Service xu ly thong bao.

```javascript
class NotificationService {
  constructor(props) {
    this.emailService = props.emailService;
    this.pushService = props.pushService;
    this.notificationRepository = props.notificationRepository;
  }

  async sendApplicationStatusUpdate(application, newStatus) {
    // Create in-app notification
    const notification = new Notification({
      userId: application.candidateId,
      type: 'APPLICATION_STATUS_UPDATE',
      title: 'Application Status Update',
      message: `Your application for ${application.job.title} has been ${newStatus}`,
      data: { applicationId: application.id },
    });

    await this.notificationRepository.save(notification);

    // Send email notification
    await this.emailService.send({
      to: application.candidate.email,
      subject: 'Application Status Update',
      template: 'application-status-update',
      data: { application, newStatus },
    });

    // Send push notification if user has device tokens
    if (application.candidate.deviceTokens) {
      await this.pushService.send({
        tokens: application.candidate.deviceTokens,
        title: 'Application Update',
        body: `Your application status has changed to ${newStatus}`,
      });
    }
  }
}
```

## Repository Interfaces

### IUserRepository

```javascript
class IUserRepository {
  async findById(id) {
    /* abstract */
  }
  async findByEmail(email) {
    /* abstract */
  }
  async save(user) {
    /* abstract */
  }
  async update(id, data) {
    /* abstract */
  }
  async delete(id) {
    /* abstract */
  }
}
```

### IJobRepository

```javascript
class IJobRepository {
  async findById(id) {
    /* abstract */
  }
  async findByCompany(companyId, options) {
    /* abstract */
  }
  async findActive(options) {
    /* abstract */
  }
  async search(query, options) {
    /* abstract */
  }
  async save(job) {
    /* abstract */
  }
  async update(id, data) {
    /* abstract */
  }
  async delete(id) {
    /* abstract */
  }
}
```

### IApplicationRepository

```javascript
class IApplicationRepository {
  async findById(id) {
    /* abstract */
  }
  async findByCandidate(candidateId, options) {
    /* abstract */
  }
  async findByJob(jobId, options) {
    /* abstract */
  }
  async findByCompany(companyId, options) {
    /* abstract */
  }
  async save(application) {
    /* abstract */
  }
  async updateStatus(id, status) {
    /* abstract */
  }
}
```

## Business Rules & Validation

### User Business Rules

- Email phai unique va co dinh dang hop le
- Password phai co it nhat 8 ky tu, bao gom chu hoa, chu thuong, so va ky tu dac biet
- Role phai la mot trong cac gia tri cho phep
- Email phai duoc verify truoc khi co the dang nhap

### Job Business Rules

- Title phai co 5-100 ky tu
- Description phai co it nhat 10 ky tu
- Salary min khong duoc lon hon max
- Application deadline phai sau ngay tao job
- Chi employer cua company moi co the tao job cho company do

### Application Business Rules

- Mot candidate chi co the apply mot lan cho cung mot job
- Khong the apply job da het han
- Chi candidate moi co the apply job
- Chi employer cua company moi co the xem va update application cho job cua company do

### Company Business Rules

- Company name phai unique
- Chi employer moi co the tao/cap nhat company
- Mot user chi co the la employer cua mot company

## Domain Events

### JobCreated

```javascript
class JobCreated {
  constructor(job) {
    this.jobId = job.id;
    this.companyId = job.companyId;
    this.occurredAt = new Date();
  }
}
```

### ApplicationSubmitted

```javascript
class ApplicationSubmitted {
  constructor(application) {
    this.applicationId = application.id;
    this.jobId = application.jobId;
    this.candidateId = application.candidateId;
    this.occurredAt = new Date();
  }
}
```

### ApplicationStatusChanged

```javascript
class ApplicationStatusChanged {
  constructor(application, oldStatus, newStatus) {
    this.applicationId = application.id;
    this.jobId = application.jobId;
    this.candidateId = application.candidateId;
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
    this.occurredAt = new Date();
  }
}
```

---

_Generated on: October 30, 2025_
