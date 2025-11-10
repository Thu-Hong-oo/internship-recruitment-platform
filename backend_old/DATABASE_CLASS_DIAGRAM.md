# 📊 DATABASE MODELS CLASS DIAGRAM

## 🔹 **Core User Management**

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String email [unique]
        +String password [select:false]
        +String authMethod [local|google|hybrid]
        +String googleId (sparse)
        +String fullName
        +String avatar
        +String role
        +Object preferences
        +Boolean isEmailVerified
        +Boolean isActive
        +String status
        +ObjectId candidateProfile [ref: CandidateProfile]
        +ObjectId employerProfile [ref: EmployerProfile]
        +getSignedJwtToken()
        +matchPassword(enteredPassword)
        +canUsePassword()
        +isAccountActive()
        +isAccountLocked()
        +updateStatus(newStatus, reason, adminId)
    }

    class CandidateProfile {
        +ObjectId _id
        +ObjectId userId [unique, ref: User]
        +String status [active|inactive|paused]
        +Object settings(visibility, searchable)
        +Object personalInfo(fullName, email, phone, address, links)
        +Object targetJob(title, level, industry, updatedAt)
        +Object education(university, certifications[])
        +Object experience(internships[], projects[])
        +Object skills(technical[], soft[], languages[])
        +Object preferences(locations[], internshipTypes[], industries[])
        +Object resume{ current{ url, publicId, filename, displayName, uploadedAt, updatedAt, aiAnalysis }, history[] }
        +Object progress(profileCompletion, skillVerification, activeRoadmaps[])
        +Object analytics(viewCount, applicationStats, skillGrowth[], lastActive)
        +Array followedCompanies [ref: EmployerProfile]
        +updateProfileCompletion()
        +updateSkillVerification()
        +incrementViews()
    }

    class EmployerProfile {
        +ObjectId _id
        +ObjectId owner [unique, ref: User]
        +Object company(CompanyInfo)
        +Object businessInfo(BusinessInfo)
        +Object position(title, level, department)
        +Object legalRepresentative
        +Object contact
        +Array members{ user, role, permissions, status }
        +Object verification(Verification)
        +Object status
        +Object stats
        +Object ai
        +Object reputation
        +Object engagement
        +Object subscription(plan, features, billing, usage)
        +addMember(userId, role)
        +removeMember(userId)
        +userCan(userId, permission)
        +getActiveMembers()
        +canPostNewJob()
        +updateStats()
        +incrementView()
        +findVerified() [static]
        +findByIndustry(industry) [static]
        +findCanPostJobs() [static]
        +search(query) [static]
    }

    User ||--o| CandidateProfile : "1:1"
    User ||--o| EmployerProfile : "1:1"
```

## 🔹 **Job & Application Management**

```mermaid
classDiagram
    class Job {
        +ObjectId _id
        +ObjectId employer [ref: EmployerProfile]
        +ObjectId postedBy [ref: User]
        +String title
        +String slug [unique]
        +String description
        +String requirements
        +Array skills
        +Array skillIds [ref: Skill]
        +String category (deprecated)
        +String industry (deprecated)
        +String industryCode
        +String subIndustryCode
        +Array industryPath
        +String level
        +String jobType
        +String workingMode
        +String location
        +Number salaryMin/salaryMax
        +Date deadline
        +String status
        +Number views
        +Object stats(applications, interviews, offers)
        +Object ai(keywords, embedding, extractedSkills[], jobCategory, matchingPool[], suggestedCandidates[])
        +Date deletedAt
        +get isExpired
        +get daysUntilDeadline
        +get isUrgent
        +get applicationRate
        +get isHot
    }

    class Application {
        +ObjectId _id
        +ObjectId candidateId [ref: CandidateProfile]
        +ObjectId jobId [ref: Job]
        +String status
        +String coverLetter
        +Array attachments
        +Object resume(url, version, uploadedAt)
        +Object matchingScore(overall, skills[], experience, education)
        +Array interviews
        +Array timeline{ status, note, createdAt, createdBy }
        +Object feedback
        +Object aiAnalysis
        +updateStatus(status, note, userId)
        +scheduleInterview(interviewData)
        +addFeedback(feedbackData)
    }

    class SavedJob {
        +ObjectId _id
        +ObjectId candidateId [ref: CandidateProfile]
        +ObjectId jobId [ref: Job]
        +Date savedAt
        +String notes
    }

    EmployerProfile ||--o{ Job : "posts"
    CandidateProfile ||--o{ Application : "applies"
    Job ||--o{ Application : "receives"
    CandidateProfile ||--o{ SavedJob : "saves"
    Job ||--o{ SavedJob : "saved by"
```

## 🔹 **AI & Analysis System**

```mermaid
classDiagram
    class AIAnalysis {
        +ObjectId _id
        +String sourceType [cv/job/skill_assessment]
        +ObjectId sourceId
        +Object content
        +Object nlpResults
        +Object matchingAnalysis
        +Object metadata
        +findLatestAnalysis(sourceType, sourceId) [static]
        +findBestMatches(sourceId, minScore) [static]
    }

    class JobRecommendation {
        +ObjectId _id
        +ObjectId candidateId [ref: CandidateProfile]
        +Array recommendations{ jobId, score, reason, matchDetails }
        +Object filters
        +Date generatedAt
        +Date expiresAt (TTL)
        +Boolean isStale
        +getValidRecommendations(candidateId) [static]
    }

    class CandidateRecommendation {
        +ObjectId _id
        +ObjectId jobId [ref: Job]
        +Array recommendations{ candidateId, score, rank, matchDetails, strengths, concerns, interviewQuestions }
        +Date generatedAt
        +Date expiresAt (TTL)
        +Boolean isStale
        +getValidRecommendations(jobId) [static]
        +getTopCandidates(jobId, limit) [static]
    }

    AIAnalysis ||--o{ CandidateProfile : "analyzes CV"
    AIAnalysis ||--o{ Job : "analyzes job"
    JobRecommendation ||--o| CandidateProfile : "for candidate"
    JobRecommendation ||--o{ Job : "recommends"
    CandidateRecommendation ||--o| Job : "for job"
    CandidateRecommendation ||--o{ CandidateProfile : "recommends"
```

## 🔹 **Skills & Learning System**

```mermaid
classDiagram
    class Skill {
        +ObjectId _id
        +String name [unique]
        +String category
        +Array aliases
        +String description
        +Array embedding
        +Number popularity
        +String demandLevel
        +String trend
        +updatePopularity()
    }

    class SkillCategory {
        +ObjectId _id
        +String name [unique]
        +String slug [unique]
        +String description
        +String icon
        +String color
        +ObjectId parentCategory [ref: SkillCategory]
        +Boolean isActive
        +Number sortOrder
        +Object metadata
        +updateSkillCount()
        +updateJobCount()
        +getAllSubcategories()
        +getRootCategories() [static]
        +getCategoryTree() [static]
        +getPopularCategories(limit) [static]
        +searchCategories(query) [static]
    }

    class SkillRoadmap {
        +ObjectId _id
        +ObjectId internId [ref: CandidateProfile]
        +Object targetJob{ jobId, title, requiredSkills[] }
        +Object analysis{ currentSkills[], skillGaps[] }
        +Object roadmap{ milestones[], startDate, endDate }
        +Object progress(overallProgress, skillProgress[], completedMilestones, totalMilestones)
        +Object mentorship(mentorId, feedback[])
        +String status
    }

    class SkillLearningPath {
        +ObjectId _id
        +ObjectId skillId [ref: Skill]
        +Array levels{name, description, criteria, assessment, estimatedDuration}
        +Array prerequisites{ skillId, level, required }
        +Array resources{ type, title, url, provider, duration, difficulty, relevantLevel, cost, rating, tags }
        +Array milestones
        +Array careerPaths{ pathId, relevance, requiredLevel }
        +Array relatedSkills{ skillId, relationship, strength }
        +Object marketData(jobDemand, salaryImpact)
        +Object learningStats
        +Boolean isActive
    }

    SkillCategory ||--o{ Skill : "contains"
    SkillCategory ||--o{ SkillCategory : "parent-child"
    CandidateProfile ||--o{ SkillRoadmap : "has roadmaps"
    SkillLearningPath ||--o| Skill : "for skill"
```

## 🔹 **Communication & Notifications**

```mermaid
classDiagram
    class Notification {
        +ObjectId _id
        +ObjectId recipient [ref: User]
        +ObjectId sender [ref: User]
        +String type
        +String title
        +String message
        +Object data(jobId, applicationId, interviewTime, chatRoomId, url)
        +Boolean isRead
        +Boolean isSent
        +String priority
        +String channel
        +Dates sentAt/deliveredAt/readAt/archivedAt
        +String dedupeKey
        +String templateKey
        +String locale
        +Object error
    }

    class Message {
        +ObjectId _id
        +ObjectId conversationId [ref: Conversation]
        +ObjectId senderId [ref: User]
        +String content
        +Array attachments
        +Array readBy [ref: User]
        +Date deletedAt
    }

    class Conversation {
        +ObjectId _id
        +Array participants [ref: User]
        +ObjectId lastMessageId [ref: Message]
        +Date lastMessageAt
        +Map unreadCountByUser
        +Array archivedBy [ref: User]
    }

    User ||--o{ Notification : "receives"
    Conversation ||--o{ Message : "contains"
    User ||--o{ Conversation : "participates"
```

## 🔹 **Industry & Business Context**

```mermaid
classDiagram
    class Industry {
        +ObjectId _id
        +String code [unique]
        +String parentCode
        +Object name [vi/en]
        +Object description [vi/en]
        +String color
        +String icon
        +Array keywords
        +Array suggestedTemplates
        +Object suggestions
        +Boolean visible
        +Number sortOrder
        +Object stats
    }

    class CompanyFollow {
        +ObjectId _id
        +ObjectId candidateId [ref: CandidateProfile]
        +ObjectId employerId [ref: EmployerProfile]
        +Date createdAt
        +Date deletedAt
    }

    Industry ||--o{ Job : "categorizes"
    EmployerProfile ||--o{ CompanyFollow : "followed by"
    CandidateProfile ||--o{ CompanyFollow : "follows"
```

## 🔹 **Additional Models**

```mermaid
classDiagram
    class CareerPath {
        +ObjectId _id
        +String name
        +String slug [unique]
        +String description
        +Array targetRoles
        +Array industries
        +Array levels{ requiredSkills[], estimatedDuration, milestones[] }
        +Array learningResources
        +Array successStories{ candidateId, currentLevel, timeSpent, testimonial }
        +Number popularity
        +Boolean isActive
    }

    class Review {
        +ObjectId _id
        +ObjectId companyId [ref: EmployerProfile]
        +ObjectId userId [ref: User]
        +Number rating
        +String title
        +String pros
        +String cons
        +Boolean isAnonymous
        +Number helpfulCount
        +Boolean flagged
        +Date deletedAt
    }

    class SavedCandidate {
        +ObjectId _id
        +ObjectId employerId [ref: EmployerProfile]
        +ObjectId candidateId [ref: CandidateProfile]
        +String note
        +Date createdAt
    }

    class ResumeBuilder {
        +ObjectId _id
        +ObjectId candidateId [ref: CandidateProfile]
        +String templateId
        +Object content(personalInfo, summary, experience[], education[], skills[], projects[], certifications[])
        +Object customization(targetJobId, targetRole, tailoredFor, keywords[])
        +Object aiGenerated(summary, experienceBullets[], suggestions[])
        +Array versions{ content, createdAt, note }
        +Array exports{ format, url, generatedAt }
        +Boolean isDefault
        +String status [draft|completed|archived]
        +createVersion(note)
        +addExport(format, url)
        +tailorForJob(jobId, keywords)
        +getDefaultResume(candidateId) [static]
        +getResumesForCandidate(candidateId) [static]
        +get latestVersion
        +get completionPercentage
    }

    class Plan {
        +ObjectId _id
        +String code [unique]
        +String name
        +Number price
        +String currency
        +Object features
        +Boolean isActive
        +Number sortOrder
    }

    class Subscription {
        +ObjectId _id
        +ObjectId owner [unique, ref: EmployerProfile]
        +String planCode
        +String status [active|canceled|expired|paused]
        +Date startDate
        +Date endDate
        +Boolean autoRenew
        +Object usage
        +String paymentMethod
    }

    class Invoice {
        +ObjectId _id
        +ObjectId owner [ref: EmployerProfile]
        +Number amount
        +String currency
        +Array items
        +String status [pending|paid|failed|refunded]
        +String transactionId
        +Date dueDate
        +Date paidAt
        +Object metadata
    }

    class Webhook {
        +ObjectId _id
        +String name
        +String url
        +String secret
        +Boolean isActive
        +Array types
    }

    class WebhookEvent {
        +ObjectId _id
        +ObjectId webhookId [ref: Webhook]
        +String type
        +Object payload
        +String status [pending|sent|failed]
        +Number attempts
        +String lastError
    }

    EmployerProfile ||--o{ Subscription : "owns"
    EmployerProfile ||--o{ Invoice : "billed"
    Webhook ||--o{ WebhookEvent : "emits"
```

---

## 📋 **Key Relationships Summary:**

1. User 1:1 CandidateProfile and 1:1 EmployerProfile
2. EmployerProfile 1:N Job; Job N:1 EmployerProfile; Job N:M CandidateProfile via Application
3. AIAnalysis links to CVs/Jobs; Recommendations là tài liệu theo ứng viên/công việc có TTL
4. Skills: SkillCategory -> Skill; CandidateProfile -> SkillRoadmap; SkillLearningPath -> Skill
5. Communication: Conversation -> Message; Notification targets User
6. Follow: CandidateProfile <-> EmployerProfile via CompanyFollow
7. Saved: CandidateProfile -> SavedJob; EmployerProfile -> SavedCandidate
8. Billing: EmployerProfile -> Subscription, Invoice; Webhooks -> Events

---

## 🎯 **Database Design Principles:**

- **Normalization**: Related data in separate collections with references
- **Denormalization**: Stats and counters for performance
- **Indexing**: Compound indexes for query optimization
- **Soft Deletes**: Most models support soft deletion
- **Timestamps**: CreatedAt/UpdatedAt on all models
- **Validation**: Schema-level validation with custom validators
- **Virtuals**: Computed fields for derived data
- **Hooks**: Pre/post middleware for business logic

---

## 🧩 Important Model Methods & Statics

```text
User
- methods: getSignedJwtToken(), matchPassword(), canUsePassword(), isAccountActive(), isAccountLocked(), updateStatus(newStatus, reason, adminId)
- virtuals: displayFullName, statusDisplay

CandidateProfile
- methods: updateProfileCompletion(), updateSkillVerification(), incrementViews()
- virtuals: skillsCount, isProfileComplete, topSkills, experienceYears

EmployerProfile
- methods: addMember(userId, role), removeMember(userId), userCan(userId, permission), getActiveMembers(), canPostNewJob(), updateStats(), incrementView()
- statics: findVerified(), findByIndustry(industry), findCanPostJobs(), search(query)
- virtuals: isVerified, canPostJobs, subscriptionActive

Application
- methods: updateStatus(status, note, userId), scheduleInterview(interviewData), addFeedback(feedbackData)
- middleware: pre('save') push timeline khi tạo

Job
- virtuals: isExpired, daysUntilDeadline, isUrgent, applicationRate, isHot

ResumeBuilder
- methods: createVersion(note), addExport(format, url), tailorForJob(jobId, keywords)
- statics: getDefaultResume(candidateId), getResumesForCandidate(candidateId)
- virtuals: latestVersion, completionPercentage

CareerPath
- virtuals: totalLevels, totalDuration
- middleware: pre('save') tạo slug

SkillCategory
- methods: updateSkillCount(), updateJobCount(), getAllSubcategories()
- statics: getRootCategories(), getCategoryTree(), getPopularCategories(limit), searchCategories(query)
- middleware: pre('save') auto slug, validate parent
- virtuals: subcategories, skills

Skill
- methods: updatePopularity()
- virtuals: userCount, jobCount

AIAnalysis
- statics: findLatestAnalysis(sourceType, sourceId), findBestMatches(sourceId, minScore)

JobRecommendation
- statics: getValidRecommendations(candidateId)

CandidateRecommendation
- statics: getValidRecommendations(jobId), getTopCandidates(jobId, limit)

Conversation
- indexes: participants, lastMessageAt; fields hỗ trợ: lastMessageId

Notification
- indexes: recipient+isRead+createdAt, dedupeKey
```

## 🛠 Suggested Schema Adjustments

- CandidateProfile.skills.technical/soft: đã bổ sung `skillId` (ref `Skill`) và index liên quan.
- Job.skills: đã bổ sung `skillIds` (ref `Skill`), giữ `skills` (string[]) để tương thích.
- Job.industry/category (deprecated): complete migration to `industryCode`/`subIndustryCode`; remove deprecated fields once frontend is updated.
- CandidateProfile.resume.current.updatedAt/uploadedAt: đã thống nhất thêm `uploadedAt` cho current và dùng khi đẩy vào history.
- CompanyFollow: add unique compound index (already present) and optional soft delete if needed for audit.
- Message/Conversation: đã thêm `lastMessageId` vào `Conversation`; giữ `deletedAt` ở message.
- AI collections (JobRecommendation/CandidateRecommendation): keep TTL indexes; consider sharding keys if dataset grows large.
- EmployerProfile.verification: documents include Cloudinary ids; ensure size/type validation is enforced at upload service level.
