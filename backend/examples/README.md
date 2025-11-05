# Domain Model Implementation

This directory contains examples of how to use the implemented domain model classes based on the PlantUML diagram.

## Running the Examples

```bash
# Install dependencies (if needed)
npm install

# Run the domain model usage example
node examples/domain-model-usage.js
```

## Implemented Domains

### 1. Identity Domain

- **User**: Aggregate Root representing system users
- **Credential**: Aggregate Root for user authentication
- **UserRole**: Enum for user roles (CANDIDATE, EMPLOYER, ADMIN)
- **UserStatus**: Enum for user status (ACTIVE, SUSPENDED)

### 2. Recruitment Domain

- **Company**: Aggregate Root for companies
- **Address**: Value Object for addresses
- **CompanyMember**: Entity for company members
- **CompanyInvitation**: Entity for company invitations
- **JobPosting**: Aggregate Root for job postings
- **JobApplication**: Aggregate Root for job applications
- Various enums: CompanySize, VerificationStatus, CompanyRole, etc.

### 3. Profile Domain

- **Candidate**: Aggregate Root for candidate profiles (now uses Skill objects instead of strings)
- **CV**: Aggregate Root for CV documents
- **JobSeekingStatus**: Enum for job seeking status

### 4. Supporting Domain

- **Comment**: Aggregate Root for threaded comments on various entities
- **CommentTargetType**: Enum for comment target types (JOB_POSTING, COMPANY, etc.)

### 5. AI/NLP Domain

- **SuggestionService**: Domain Service for intelligent field suggestions during form input
- Provides autocomplete for skills, job titles, companies, and locations

### 6. Master Data Domain

- **Skill**: Aggregate Root for skill definitions (used by Candidate profiles)

## Key Features

- **Domain-Driven Design (DDD)**: Proper aggregate roots, entities, value objects
- **Business Logic**: Encapsulated in domain objects
- **Validation**: Input validation in domain methods
- **Immutability**: Value objects are immutable
- **Relationships**: Proper domain relationships as defined in the diagram

## Architecture Notes

- Each domain is self-contained with its own business rules
- Value objects ensure immutability and proper equality
- Aggregate roots control access to their contained entities
- Domain services handle complex business logic across aggregates
- Repository interfaces define data access contracts
