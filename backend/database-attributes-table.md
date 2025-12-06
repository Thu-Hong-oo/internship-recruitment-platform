# Internship Recruitment Platform - Database Attributes Table

## Tổng quan
Bảng phân tích chi tiết các thuộc tính và kiểu dữ liệu của tất cả các entities trong sơ đồ cơ sở dữ liệu MongoDB.

## Bảng Thuộc tính Chi tiết

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **users** | _id | ObjectId | Primary key |
| | email | string | Email address (unique) |
| | passwordHash | string | Hashed password |
| | fullName | string | Full name |
| | phone | string | Phone number |
| | userStatus | enum | User status |
| | userRole | enum | User role |
| | lastLogin | datetime | Last login timestamp |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **candidates** | _id | ObjectId | Primary key |
| | userId | ObjectId | Reference to users |
| | bio | string | Biography |
| | jobSeekingStatus | enum | Job seeking status |
| | profileCompleteness | int | Profile completeness percentage |
| | address | object | Address information |
| | skills | ObjectId[] | Array of skill references |
| | targetJob | object | Target job preferences |
| | preferences | object | User preferences |
| | resume | object | Resume information |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **employers** | _id | ObjectId | Primary key |
| | userId | ObjectId | Reference to users |
| | companyId | ObjectId | Reference to companies |
| | memberStatus | enum | Member status |
| | position | object | Position information |
| | legalRepresentative | object | Legal representative info |
| | contact | object | Contact information |
| | members | array | Team members |
| | verification | object | Verification status |
| | joinedAt | datetime | Join timestamp |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **companies** | _id | ObjectId | Primary key |
| | name | string | Company name |
| | description | string | Company description |
| | companySize | enum | Company size category |
| | taxCode | string | Tax code (unique) |
| | verificationStatus | enum | Verification status |
| | website | string | Company website |
| | businessEmail | string | Business email |
| | businessPhone | string | Business phone |
| | businessLogoUrl | string | Logo URL |
| | registrationDate | date | Registration date |
| | address | object | Company address |
| | employeesCount | number | Number of employees |
| | foundedYear | number | Founded year |
| | logo | object | Logo information |
| | coverImage | object | Cover image |
| | media | object | Media assets |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **job_postings** | _id | ObjectId | Primary key |
| | companyId | ObjectId | Reference to companies |
| | postedBy | ObjectId | Reference to users |
| | title | string | Job title |
| | description | string | Job description |
| | requirements | string | Job requirements |
| | benefits | string | Job benefits |
| | jobType | enum | Job type |
| | jobStatus | enum | Job status |
| | level | enum | Job level |
| | workingMode | enum | Working mode |
| | address | object | Job location |
| | salaryRange | object | Salary range |
| | skillIds | ObjectId[] | Required skills |
| | industryCodes | string[] | Industry codes |
| | jobRequirements | object | Detailed requirements |
| | postedAt | datetime | Posted timestamp |
| | expiresAt | datetime | Expiration timestamp |
| | deadline | datetime | Application deadline |
| | positions | int | Number of positions |
| | applicationCount | int | Application count |
| | views | int | View count |
| | aiTags | array | AI-generated tags |
| | ai | object | AI analysis data |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **job_applications** | _id | ObjectId | Primary key |
| | candidateId | ObjectId | Reference to candidates |
| | jobId | ObjectId | Reference to job_postings |
| | cvId | ObjectId | Reference to cvs |
| | coverLetter | string | Cover letter |
| | status | enum | Application status |
| | matchResult | object | Matching result |
| | matchingScore | object | Matching score |
| | interviews | array | Interview schedule |
| | timeline | array | Application timeline |
| | feedback | object | Feedback |
| | aiAnalysis | object | AI analysis |
| | submittedAt | datetime | Submission timestamp |
| | reviewedAt | datetime | Review timestamp |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **job_savings** | _id | ObjectId | Primary key |
| | candidateId | ObjectId | Reference to candidates |
| | jobId | ObjectId | Reference to job_postings |
| | savedAt | datetime | Saved timestamp |
| | createdAt | datetime | Creation timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **job_followings** | _id | ObjectId | Primary key |
| | userId | ObjectId | Reference to users |
| | targetType | enum | Target type |
| | targetId | ObjectId | Target ID |
| | followedAt | datetime | Follow timestamp |
| | createdAt | datetime | Creation timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **skills** | _id | ObjectId | Primary key |
| | code | string | Skill code (unique) |
| | name | string | Skill name |
| | description | string | Skill description |
| | aliases | string[] | Skill aliases |
| | category | enum | Skill category |
| | popularity | int | Popularity score |
| | demandLevel | enum | Demand level |
| | trend | enum | Trend status |
| | isActive | boolean | Active status |
| | embedding | array | Vector embedding |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **industries** | _id | ObjectId | Primary key |
| | code | string | Industry code (unique) |
| | name | string | Industry name |
| | description | string | Industry description |
| | parentCode | string | Parent industry code |
| | color | string | Display color |
| | icon | string | Icon identifier |
| | keywords | array | Search keywords |
| | suggestions | object | Suggestions |
| | visible | boolean | Visibility status |
| | sortOrder | number | Sort order |
| | stats | object | Statistics |
| | isActive | boolean | Active status |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **cvs** | _id | ObjectId | Primary key |
| | candidateId | ObjectId | Reference to candidates |
| | content | string | CV content |
| | fileName | string | File name |
| | fileUrl | string | File URL |
| | uploadDate | datetime | Upload timestamp |
| | isDefault | boolean | Default CV flag |
| | aiAnalysis | object | AI analysis |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **educations** | _id | ObjectId | Primary key |
| | candidateId | ObjectId | Reference to candidates |
| | degree | string | Degree |
| | major | string | Major |
| | school | string | School name |
| | startDate | date | Start date |
| | endDate | date | End date |
| | gpa | float | GPA |
| | courses | array | Courses |
| | achievements | array | Achievements |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **notifications** | _id | ObjectId | Primary key |
| | userId | ObjectId | Reference to users |
| | sender | ObjectId | Sender ID |
| | type | enum | Notification type |
| | title | string | Notification title |
| | message | string | Notification message |
| | data | object | Additional data |
| | isRead | boolean | Read status |
| | isSent | boolean | Sent status |
| | priority | enum | Priority level |
| | channel | enum | Delivery channel |
| | sentAt | datetime | Sent timestamp |
| | deliveredAt | datetime | Delivered timestamp |
| | readAt | datetime | Read timestamp |
| | archivedAt | datetime | Archived timestamp |
| | dedupeKey | string | Deduplication key |
| | templateKey | string | Template key |
| | locale | string | Locale |
| | createdAt | datetime | Creation timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **skill_graph_analyses** | _id | ObjectId | Primary key |
| | candidateId | ObjectId | Reference to candidates |
| | jobId | ObjectId | Reference to job_postings |
| | skillGaps | array | Skill gaps |
| | recommendedCourses | string[] | Recommended courses |
| | analysisLevel | enum | Analysis level |
| | generatedAt | datetime | Generation timestamp |
| | nextUpdate | datetime | Next update timestamp |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **skill_maps** | _id | ObjectId | Primary key |
| | candidateId | ObjectId | Reference to candidates |
| | targetSkillTitle | string | Target skill title |
| | currentSkillLevel | enum | Current skill level |
| | estimatedMonths | int | Estimated months |
| | status | enum | Status |
| | completionDate | date | Completion date |
| | steps | array | Development steps |
| | progress | object | Progress information |
| | preferences | object | User preferences |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **skill_gaps** | _id | ObjectId | Primary key |
| | analysisId | ObjectId | Reference to skill_graph_analyses |
| | skill | string | Skill name |
| | currentLevel | enum | Current level |
| | targetLevel | enum | Target level |
| | priority | enum | Priority |
| | importance | number | Importance score |
| | createdAt | datetime | Creation timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **development_steps** | _id | ObjectId | Primary key |
| | skillMapId | ObjectId | Reference to skill_maps |
| | title | string | Step title |
| | description | string | Step description |
| | difficulty | enum | Difficulty level |
| | technologies | array | Required technologies |
| | repository | string | Repository URL |
| | estimatedTime | string | Estimated time |
| | status | enum | Step status |
| | completedAt | datetime | Completion timestamp |
| | createdAt | datetime | Creation timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **learning_roadmaps** | _id | ObjectId | Primary key |
| | candidateId | ObjectId | Reference to candidates |
| | targetJobId | ObjectId | Reference to job_postings |
| | targetRole | string | Target role |
| | currentLevel | enum | Current level |
| | skillGaps | array | Skill gaps |
| | phases | array | Learning phases |
| | milestones | array | Milestones |
| | successMetrics | array | Success metrics |
| | totalDuration | string | Total duration |
| | estimatedTotalHours | number | Estimated hours |
| | difficulty | enum | Difficulty level |
| | progress | object | Progress tracking |
| | generatedBy | enum | Generation method |
| | aiModelVersion | string | AI model version |
| | credibilityMetrics | object | Credibility metrics |
| | metadata | object | Metadata |
| | feedback | object | User feedback |
| | status | enum | Roadmap status |
| | isPersonalized | boolean | Personalized flag |
| | isPublic | boolean | Public flag |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **resources** | _id | ObjectId | Primary key |
| | roadmapId | ObjectId | Reference to learning_roadmaps |
| | type | enum | Resource type |
| | title | string | Resource title |
| | url | string | Resource URL |
| | provider | string | Provider name |
| | duration | string | Duration |
| | difficulty | enum | Difficulty level |
| | isFree | boolean | Free flag |
| | rating | number | Rating |
| | credibility | number | Credibility score |
| | language | string | Language |
| | estimatedCost | number | Estimated cost |
| | certificateOffered | boolean | Certificate offered |
| | source | enum | Source type |
| | popularity | number | Popularity score |
| | similarity | number | Similarity score |
| | metadata | object | Metadata |
| | createdAt | datetime | Creation timestamp |

| Entity | Attribute | Type | Description |
|--------|-----------|------|-------------|
| **skill_learning_paths** | _id | ObjectId | Primary key |
| | skillId | ObjectId | Reference to skills |
| | levels | array | Skill levels |
| | prerequisites | array | Prerequisites |
| | resources | array | Learning resources |
| | milestones | array | Milestones |
| | careerPaths | array | Career paths |
| | relatedSkills | array | Related skills |
| | createdAt | datetime | Creation timestamp |
| | updatedAt | datetime | Update timestamp |

## Chú thích
- **ObjectId**: MongoDB ObjectId type
- **datetime**: Date and time
- **date**: Date only
- **enum**: Enumeration type
- **array**: Array of values
- **object**: Nested object
- **string[]**: Array of strings
- **ObjectId[]**: Array of ObjectIds