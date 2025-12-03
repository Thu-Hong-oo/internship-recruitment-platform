# AI & NLP Features - Frontend Implementation

## Overview

This directory contains the frontend implementation of AI-powered features including CV analysis, job recommendations, skill gap analysis, and personalized learning roadmaps.

## Features Implemented

### 1. ✅ API Services (`lib/api/services/`)

#### AI Service (`ai.service.ts`)
- **CV Analysis**
  - `analyzeCVFromFile(file)` - Upload and analyze CV file (PDF/DOC/DOCX)
  - `analyzeCVFromText(text)` - Analyze CV from raw text
- **Job Matching**
  - `getJobRecommendations()` - Get personalized job recommendations
  - `getCandidateRecommendations(jobId)` - Get matching candidates (Employer)
- **Analysis Tools**
  - `analyzeJobDescription()` - Extract info from job descriptions
  - `analyzeSkillGaps()` - Identify missing skills
  - `getSuggestions()` - Get AI suggestions for CV sections
  - `getCandidateInsights()` - Get profile insights

#### NLP Service (`nlp.service.ts`)
- **Matching Score**
  - `calculateMatchingScore()` - Calculate CV-Job match score
  - `getMatchingScore(jobId, candidateId)` - Get existing score
  - `getTopCandidates(jobId)` - Get top matching candidates (Employer)
  - `getBestMatches()` - Get best matching jobs (Candidate)
  - `recalculateScores(jobId)` - Recalculate all scores
- **Learning Roadmap**
  - `generateLearningRoadmap()` - Generate personalized roadmap
  - `getLearningRoadmap(id)` - Get specific roadmap
  - `getMyRoadmaps()` - Get user's roadmaps
  - `updateRoadmapProgress()` - Mark week/resource complete
  - `submitRoadmapFeedback()` - Submit rating and feedback
  - `getRecommendedResources()` - Get resources for phase/week
  - `getPopularRoadmaps()` - Get public popular roadmaps

### 2. ✅ Shared Components (`components/ai/`)

#### MatchScoreCard
Displays matching score with tier system (A/B/C/D):
- Overall score with progress bar
- Score breakdown (skills, experience, education)
- Strengths and concerns
- Color-coded tier badges

**Props:**
```typescript
{
  score: number;
  tier: "A" | "B" | "C" | "D";
  breakdown?: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    projectsScore?: number;
  };
  strengths?: string[];
  concerns?: string[];
}
```

#### SkillGapChart
Visualizes skill gaps by category:
- Current vs Required skills overview
- Categorized gaps (Critical/Important/Optional)
- Expandable sections
- Recommendations
- CTA button to generate roadmap

**Props:**
```typescript
{
  currentSkills: string[];
  requiredSkills: string[];
  skillGaps: {
    critical: string[];
    important: string[];
    optional: string[];
  };
  matchScore?: number;
  recommendations?: string[];
}
```

#### ProgressTracker
Tracks learning roadmap progress:
- Overall progress (weeks completed)
- Resource completion tracking
- Phase-by-phase progress visualization
- Stats summary

**Props:**
```typescript
{
  totalWeeks: number;
  completedWeeks: number;
  totalResources: number;
  completedResources: number;
  currentPhase: number;
  phases: Array<{
    phaseNumber: number;
    title: string;
    duration: string;
    completed?: boolean;
  }>;
}
```

### 3. ✅ Pages Implemented

#### `/cv-analysis` - CV Analysis Page
**Features:**
- Upload CV file (PDF/DOC/DOCX) or paste text
- AI-powered skill extraction
- Experience and education parsing
- AI suggestions for improvement
- Quick actions (Job Recommendations, Skill Gap Analysis)

**User Flow:**
1. Upload CV or paste text
2. Click "Analyze"
3. View extracted skills, experience, education
4. Review AI suggestions
5. Navigate to next steps

#### `/job-recommendations` - Job Recommendations Page
**Features:**
- Personalized job matches with scores
- Filter by tier (A/B/C/D) and min score
- Search jobs/companies
- Match score details (strengths, concerns)
- Quick view job details
- Generate learning roadmap for specific job

**User Flow:**
1. View recommended jobs sorted by score
2. Filter by tier or search
3. View match details
4. Click "View Details" to see full job
5. Click "Generate Roadmap" to create learning path

## TODO: Remaining Pages

### 4. ⏳ Skill Gap Analysis Page (`/skill-gap-analysis`)
**Features to implement:**
- Select target job or enter job description
- Display skill gap chart
- Show critical/important/optional gaps
- Provide learning recommendations
- Link to generate roadmap

### 5. ⏳ Learning Roadmaps Page (`/roadmaps`)
**Features to implement:**
- List all user's roadmaps
- Filter by status (active/completed/paused)
- Show progress for each roadmap
- Create new roadmap
- View popular public roadmaps

### 6. ⏳ Roadmap Detail Page (`/roadmaps/[id]`)
**Features to implement:**
- Display roadmap phases and weeks
- Show resources (courses, articles, videos)
- Track progress (mark weeks/resources complete)
- Display milestones
- Submit feedback and rating
- View recommended resources

### 7. ⏳ Employer Candidate Recommendations (`/employer/job/[id]/candidates`)
**Features to implement:**
- List top matching candidates for job
- Display match scores and tiers
- Show skill gaps per candidate
- Provide interview question suggestions
- Sort/filter candidates

## Usage Examples

### Analyze CV
```typescript
import { aiService } from "@/lib/api";

// From file
const file = event.target.files[0];
const result = await aiService.analyzeCVFromFile(file);

// From text
const text = "CURRICULUM VITAE...";
const result = await aiService.analyzeCVFromText(text);
```

### Get Job Recommendations
```typescript
import { nlpService } from "@/lib/api";

const { data: jobs } = await nlpService.getBestMatches({
  limit: 10,
  minScore: 60
});
```

### Generate Learning Roadmap
```typescript
import { nlpService } from "@/lib/api";

const { data: roadmap } = await nlpService.generateLearningRoadmap({
  targetJobId: "job123",
  timeframe: 12, // weeks
});
```

### Track Progress
```typescript
import { nlpService } from "@/lib/api";

await nlpService.updateRoadmapProgress("roadmap123", {
  weekNumber: 1,
  resourceId: "resource456"
});
```

## API Endpoints Reference

### AI Endpoints
- `POST /api/ai/analyze-cv` - Analyze CV file
- `POST /api/ai/analyze-cv-text` - Analyze CV text
- `POST /api/ai/job-recommendations` - Get job recommendations
- `POST /api/ai/candidate-recommendations` - Get candidate recommendations (Employer)
- `POST /api/ai/analyze-job-description` - Analyze job description
- `POST /api/ai/skill-gap-analysis` - Analyze skill gaps
- `POST /api/ai/suggestions` - Get AI suggestions
- `GET /api/ai/insights` - Get candidate insights

### NLP Endpoints
- `POST /api/nlp/matching-score` - Calculate matching score
- `GET /api/nlp/matching-score/:jobId/:candidateId` - Get matching score
- `GET /api/nlp/top-candidates/:jobId` - Get top candidates (Employer)
- `GET /api/nlp/best-matches` - Get best job matches (Candidate)
- `POST /api/nlp/recalculate-scores/:jobId` - Recalculate scores
- `POST /api/nlp/learning-roadmap` - Generate roadmap
- `GET /api/nlp/learning-roadmap/:id` - Get roadmap
- `GET /api/nlp/my-roadmaps` - Get user's roadmaps
- `PUT /api/nlp/learning-roadmap/:id/progress` - Update progress
- `PUT /api/nlp/learning-roadmap/:id/feedback` - Submit feedback
- `GET /api/nlp/roadmap/recommended-resources/:id` - Get resources
- `GET /api/nlp/popular-roadmaps` - Get popular roadmaps

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **State:** React hooks
- **API:** Custom API client with TypeScript
- **Icons:** Lucide React

## Best Practices

1. **Error Handling:** Always wrap API calls in try-catch with user-friendly toast messages
2. **Loading States:** Show skeleton loaders during data fetching
3. **Responsive Design:** All components work on mobile, tablet, desktop
4. **Accessibility:** Use semantic HTML and ARIA labels
5. **Performance:** Lazy load heavy components, use React.memo where needed

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Notes

- All API services automatically include authentication tokens from the auth context
- The backend uses PhoBERT NER and Sentence-BERT for matching (no Gemini required)
- Matching scores use tier system: A (90-100%), B (75-89%), C (60-74%), D (<60%)
- Roadmaps are personalized based on user's current skills and target role
