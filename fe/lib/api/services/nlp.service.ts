import { apiClient } from "../client";
import type { CVData } from "./ai.service";

// ============================================
// Types
// ============================================

export interface MatchingScore {
  jobId: string;
  candidateId: string;
  overallScore: number;
  tier: "A" | "B" | "C" | "D";
  breakdown: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    projectsScore?: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningPhase {
  phaseNumber: number;
  title: string;
  duration: string;
  objectives: string[];
  weeks: Array<{
    weekNumber: number;
    topic: string;
    objectives: string[];
    resources: LearningResource[];
    completed?: boolean;
  }>;
}

export interface LearningResource {
  _id?: string;
  title: string;
  type: "course" | "article" | "video" | "documentation" | "book";
  url: string;
  provider?: string;
  duration?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  rating?: number;
  isFree?: boolean;
  completed?: boolean;
}

export interface LearningRoadmap {
  _id: string;
  candidateId: string;
  targetRole: string;
  targetJobId?: string;
  currentLevel: string;
  timeframe: number;
  status: "active" | "completed" | "paused";
  phases: LearningPhase[];
  milestones: Array<{
    title: string;
    description: string;
    targetWeek: number;
    completed: boolean;
  }>;
  progress: {
    completedWeeks: number;
    totalWeeks: number;
    completedResources: number;
    totalResources: number;
    currentPhase: number;
  };
  feedback?: {
    rating: number;
    comment: string;
    isHelpful: boolean;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// NLP Service
// ============================================

export const nlpService = {
  // ============================================
  // Matching Score APIs
  // ============================================

  /**
   * Calculate matching score between CV and Job
   */
  async calculateMatchingScore(params: {
    cvData: CVData;
    jobId: string;
    candidateId: string;
  }): Promise<{
    success: boolean;
    data: MatchingScore;
  }> {
    return apiClient.post("/nlp/matching-score", params);
  },

  /**
   * Get existing matching score
   */
  async getMatchingScore(
    jobId: string,
    candidateId: string
  ): Promise<{
    success: boolean;
    data: MatchingScore;
  }> {
    return apiClient.get(`/nlp/matching-score/${jobId}/${candidateId}`);
  },

  /**
   * Get top matching candidates for a job (Employer only)
   */
  async getTopCandidates(
    jobId: string,
    params?: {
      limit?: number;
      minScore?: number;
      tier?: "top" | "good" | "potential";
    }
  ): Promise<{
    success: boolean;
    data: Array<
      MatchingScore & {
        candidate: {
          _id: string;
          name: string;
          email: string;
          avatar?: string;
        };
      }
    >;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.minScore)
      queryParams.append("minScore", params.minScore.toString());
    if (params?.tier) queryParams.append("tier", params.tier);

    const query = queryParams.toString();
    return apiClient.get(
      `/nlp/top-candidates/${jobId}${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get best matching jobs for current candidate
   * Maps backend structure (CVMatchingScore + populated jobId) to UI-friendly format
   */
  async getBestMatches(params?: {
    limit?: number;
    minScore?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    data: Array<{
      overallScore: number;
      tier: "A" | "B" | "C" | "D";
      job: {
        _id: string;
        title: string;
        company: string;
        location: string;
        salary?: {
          min: number;
          max: number;
          currency: string;
        };
      };
      matchedSkills: string[];
      breakdown: {
        skillsScore: number;
        experienceScore: number;
        educationScore: number;
        projectsScore?: number;
      };
      strengths: string[];
      concerns: string[];
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.minScore)
      queryParams.append("minScore", params.minScore.toString());

    const query = queryParams.toString();

    const raw = await apiClient.get<{
      success: boolean;
      data: any[];
    }>(`/nlp/best-matches${query ? `?${query}` : ""}`);

    const mapped = (raw.data || [])
      .map((item) => {
        const job = item.job || item.jobId || {};
        if (!job || !job._id) return null; // skip invalid

        const scoreBreakdown = item.scoreBreakdown || {};
        const insights = item.insights || {};

        const overallScore: number = item.overallScore || 0;

        // Map company + logo
        const companyName =
          job.company ||
          job.companyName ||
          job.employer?.company?.name ||
          "Nhà tuyển dụng";
        const logoRaw = job.employer?.company?.logo as any;
        const companyLogo =
          (logoRaw && typeof logoRaw === "object" ? logoRaw.url : logoRaw) || "";

        // Salary
        const salary =
          job.salaryMin && job.salaryMax
            ? {
                min: job.salaryMin,
                max: job.salaryMax,
                currency: job.currency || "VND",
              }
            : undefined;

        // Location / city shorthand
        const location = job.location || job.address?.fullAddress || "";

        return {
          overallScore,
          job: {
            _id: job._id,
            title: job.title,
            company: companyName,
            companyLogo,
            location,
            salary,
          },
          matchedSkills:
            scoreBreakdown.skillsScore?.details?.matchedSkills?.map(
              (s: any) => s.skill
            ) || [],
          breakdown: {
            skillsScore: scoreBreakdown.skillsScore?.score || 0,
            experienceScore: scoreBreakdown.experienceScore?.score || 0,
            educationScore: scoreBreakdown.educationScore?.score || 0,
            projectsScore: scoreBreakdown.keywordScore?.score || 0,
          },
          strengths: insights.strengths || [],
          concerns: insights.weaknesses || [],
        };
      })
      .filter(Boolean) as Array<{
        overallScore: number;
        job: {
          _id: string;
          title: string;
          company: string;
          companyLogo?: string;
          location: string;
          salary?: { min: number; max: number; currency: string };
        };
        matchedSkills: string[];
        breakdown: {
          skillsScore: number;
          experienceScore: number;
          educationScore: number;
          projectsScore?: number;
        };
        strengths: string[];
        concerns: string[];
      }>;

    return {
      success: raw.success,
      data: mapped,
      ...(raw.message && { message: raw.message }), // Preserve message if present
    };
  },

  /**
   * Recalculate scores for a job (Employer only)
   */
  async recalculateScores(jobId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.post(`/nlp/recalculate-scores/${jobId}`);
  },

  // ============================================
  // Learning Roadmap APIs
  // ============================================

  /**
   * Generate personalized learning roadmap
   */
  async generateLearningRoadmap(params: {
    targetJobId?: string;
    targetRole?: string;
    timeframe?: number;
    cvData?: CVData;
  }): Promise<{
    success: boolean;
    data: LearningRoadmap;
  }> {
    return apiClient.post("/nlp/learning-roadmap", params);
  },

  /**
   * Generate RAG-powered learning roadmap (sử dụng dữ liệu thực tế)
   * API returns: { success: true, data: { roadmap: LearningRoadmap, credibilityMetrics: {...}, ... } }
   */
  async generateLearningRoadmapRag(params: {
    candidateId?: string;
    jobId: string;
    targetRole?: string;
    timeframe?: number;
    cvData?: CVData;
  }): Promise<{
    success: boolean;
    data: {
      roadmap: LearningRoadmap;
      credibilityMetrics?: any;
      totalResources?: number;
      sourceBreakdown?: any;
    } | LearningRoadmap; // Support both structures for backward compatibility
    message?: string;
  }> {
    return apiClient.post("/nlp/learning-roadmap-rag", params);
  },

  /**
   * Get specific learning roadmap by ID
   */
  async getLearningRoadmap(roadmapId: string): Promise<{
    success: boolean;
    data: LearningRoadmap;
  }> {
    return apiClient.get(`/nlp/learning-roadmap/${roadmapId}`);
  },

  /**
   * Get all roadmaps for current user
   */
  async getMyRoadmaps(params?: {
    status?: "active" | "completed" | "paused";
  }): Promise<{
    success: boolean;
    data: LearningRoadmap[];
  }> {
    const query = params?.status ? `?status=${params.status}` : "";
    return apiClient.get(`/nlp/my-roadmaps${query}`);
  },

  /**
   * Update roadmap progress
   */
  async updateRoadmapProgress(
    roadmapId: string,
    params: {
      weekNumber?: number;
      resourceId?: string;
      phaseNumber?: number;
    }
  ): Promise<{
    success: boolean;
    data: LearningRoadmap;
  }> {
    return apiClient.put(`/nlp/learning-roadmap/${roadmapId}/progress`, params);
  },

  /**
   * Submit roadmap feedback
   */
  async submitRoadmapFeedback(
    roadmapId: string,
    feedback: {
      rating: number;
      comment?: string;
      isHelpful: boolean;
    }
  ): Promise<{
    success: boolean;
    data: LearningRoadmap;
  }> {
    return apiClient.put(`/nlp/learning-roadmap/${roadmapId}/feedback`, feedback);
  },

  /**
   * Get recommended resources for specific phase/week
   */
  async getRecommendedResources(
    roadmapId: string,
    params?: {
      phase?: number;
      week?: number;
    }
  ): Promise<{
    success: boolean;
    data: LearningResource[];
  }> {
    const queryParams = new URLSearchParams();
    if (params?.phase) queryParams.append("phase", params.phase.toString());
    if (params?.week) queryParams.append("week", params.week.toString());

    const query = queryParams.toString();
    return apiClient.get(
      `/nlp/roadmap/recommended-resources/${roadmapId}${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get popular public roadmaps
   */
  async getPopularRoadmaps(limit?: number): Promise<{
    success: boolean;
    data: LearningRoadmap[];
  }> {
    const query = limit ? `?limit=${limit}` : "";
    return apiClient.get(`/nlp/popular-roadmaps${query}`);
  },

  // ============================================
  // Utilities
  // ============================================

  /**
   * Calculate matching scores for all active jobs for current candidate
   * (wraps POST /api/nlp/calculate-all-matches)
   */
  async calculateAllMatches(): Promise<{
    success: boolean;
    message?: string;
    data?: unknown;
  }> {
    return apiClient.post("/nlp/calculate-all-matches", {});
  },

  /**
   * Check RAG service health and statistics
   */
  async checkRagHealth(): Promise<{
    success: boolean;
    data: {
      status: "healthy" | "degraded" | "down";
      statistics?: {
        totalResources?: number;
        indexedResources?: number;
        lastIndexed?: string;
        averageResponseTime?: number;
      };
      message?: string;
    };
  }> {
    return apiClient.get("/nlp/rag-health");
  },
};
