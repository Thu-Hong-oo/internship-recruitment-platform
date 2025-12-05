import { apiClient } from "../client";

// ============================================
// Types
// ============================================

export interface CVData {
  skills?: Array<{
    name: string;
    level?: "beginner" | "intermediate" | "advanced";
  }>;
  experience?: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    major: string;
    school: string;
  }>;
  currentLevel?: string;
}

export interface CVAnalysisResult {
  success: boolean;
  data: {
    extractedSkills: string[];
    experience: Array<{
      position: string;
      company: string;
      duration: string;
    }>;
    education: Array<{
      degree: string;
      major: string;
      school: string;
    }>;
    suggestions: string[];
  };
}

export interface JobRecommendation {
  jobId: string;
  title: string;
  company: string;
  score: number;
  tier: "A" | "B" | "C" | "D";
  matchDetails: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
  };
  strengths: string[];
  concerns?: string[];
}

export interface SkillGap {
  critical: string[];
  important: string[];
  optional: string[];
}

export interface SkillGapAnalysisResult {
  success: boolean;
  data: {
    currentSkills: string[];
    requiredSkills: string[];
    skillGaps: SkillGap;
    matchScore: number;
    recommendations: string[];
  };
}

export interface CandidateInsights {
  profileCompleteness: number;
  strongAreas: string[];
  improvementAreas: string[];
  marketTrends: string[];
  careerSuggestions: string[];
}

// ============================================
// AI Service
// ============================================

export const aiService = {
  /**
   * Analyze CV from uploaded file
   */
  async analyzeCVFromFile(file: File): Promise<CVAnalysisResult> {
    const formData = new FormData();
    formData.append("cv", file);

    return apiClient.post("/ai/analyze-cv", formData);
  },

  /**
   * Analyze CV from raw text
   */
  async analyzeCVFromText(rawCVText: string): Promise<CVAnalysisResult> {
    return apiClient.post("/ai/analyze-cv-text", {
      rawCVText,
    });
  },

  /**
   * Get personalized job recommendations
   */
  async getJobRecommendations(params?: {
    limit?: number;
    minScore?: number;
  }): Promise<{
    success: boolean;
    data: JobRecommendation[];
  }> {
    return apiClient.post("/ai/job-recommendations", {
      limit: params?.limit || 10,
      minScore: params?.minScore || 60,
    });
  },

  /**
   * Get top matching candidates for a job (Employer only)
   */
  async getCandidateRecommendations(
    jobId: string,
    params?: {
      limit?: number;
      minScore?: number;
    }
  ): Promise<{
    success: boolean;
    data: Array<{
      candidateId: string;
      name: string;
      rank: number;
      score: number;
      tier: "A" | "B" | "C" | "D";
      matchDetails: {
        skillsScore: number;
        experienceScore: number;
        educationScore: number;
      };
      strengths: string[];
      concerns: string[];
      skillGaps: SkillGap;
    }>;
  }> {
    return apiClient.post("/ai/candidate-recommendations", {
      jobId,
      limit: params?.limit || 10,
      minScore: params?.minScore || 60,
    });
  },

  /**
   * Analyze job description
   */
  async analyzeJobDescription(params: {
    jobDescription: string;
    targetJob?: string;
    companyInfo?: {
      name: string;
      industry: string;
    };
  }): Promise<{
    success: boolean;
    data: {
      extractedSkills: string[];
      requiredExperience: string;
      keyResponsibilities: string[];
      benefits: string[];
      suggestions: string[];
    };
  }> {
    return apiClient.post("/ai/analyze-job-description", params);
  },

  /**
   * Analyze skill gaps with job description
   */
  async analyzeSkillGaps(params: {
    targetJobDescription?: string;
    targetJobTitle?: string;
    jobId?: string;
    industry?: string;
  }): Promise<SkillGapAnalysisResult> {
    return apiClient.post("/ai/skill-gap-analysis", params);
  },

  /**
   * Get AI suggestions for CV sections
   */
  async getSuggestions(params: {
    stepType:
      | "careerObjective"
      | "skills"
      | "experience"
      | "education"
      | "projects";
    currentData?: Record<string, unknown>;
    context?: Record<string, unknown>;
  }): Promise<{
    success: boolean;
    data: {
      suggestions: string[];
    };
  }> {
    return apiClient.post("/ai/suggestions", params);
  },

  /**
   * Get candidate insights
   */
  async getCandidateInsights(): Promise<{
    success: boolean;
    data: CandidateInsights;
  }> {
    return apiClient.get("/ai/insights");
  },
};
