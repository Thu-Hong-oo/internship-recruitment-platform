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
   */
  async getBestMatches(params?: {
    limit?: number;
    minScore?: number;
  }): Promise<{
    success: boolean;
    data: Array<
      MatchingScore & {
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
      }
    >;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.minScore)
      queryParams.append("minScore", params.minScore.toString());

    const query = queryParams.toString();
    return apiClient.get(`/nlp/best-matches${query ? `?${query}` : ""}`);
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
   */
  async generateLearningRoadmapRag(params: {
    candidateId?: string;
    jobId: string;
    targetRole?: string;
    timeframe?: number;
    cvData?: CVData;
  }): Promise<{
    success: boolean;
    data: LearningRoadmap;
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
};
