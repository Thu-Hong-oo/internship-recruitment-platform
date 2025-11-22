export interface CVResponse {
  success: boolean;
  data: {
    // For upload only
    url?: string;
    publicId?: string;
    filename?: string;
    displayName?: string;
    format?: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string;

    // For parse response
    upload?: {
      url: string;
      publicId: string;
      filename: string;
      displayName: string;
      format: string;
      size: number;
      mimeType: string;
      uploadedAt: string;
    };
    parsing?: {
      extractedData?: {
        personalInfo?: {
          fullName?: string;
          email?: string;
          phone?: string;
          address?: string;
          dateOfBirth?: string;
        };
        education?: {
          institution?: string;
          degree?: string;
          field?: string;
          graduationYear?: number;
          gpa?: number;
          gradeText?: string;
        };
        experience?: Array<{
          company?: string;
          position?: string;
          location?: string;
          startDate?: string;
          endDate?: string;
          description?: string;
        }>;
        skills?: {
          technical?: string[];
          soft?: string[];
          languages?: string[];
        };
        certifications?: Array<{
          name?: string;
          issuer?: string;
          date?: string;
        }>;
      };
      skills?: string[];
      suggestions?: string[];
      analyzedAt?: string;
      error?: string;
    };
  };
  message: string;
}

export interface CandidateProfile {
  userId: string;
  fullName?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  summary?: string;
  skills: {
    technical: Array<{ name: string; level: string; verified?: boolean }>;
    soft: Array<{ name: string }>;
    languages: Array<{ name: string; level: string }>;
  };
  education: {
    university: {
      name?: string;
      major?: string;
      degree?: string;
      graduationYear?: number;
      gpa?: number;
    };
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate?: string;
      credentialUrl?: string;
    }>;
  };
  experience: {
    internships: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      description: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
      startDate: string;
      endDate?: string;
      url?: string;
    }>;
  };
  preferences: {
    locations?: string[];
    internshipTypes?: string[];
    salaryExpectation?: {
      min: number;
      max: number;
      currency: string;
    };
  };
  resume: {
    current: {
      url?: string;
      previewUrl?: string;
      downloadUrl?: string;
      filename?: string;
      format?: string;
      updatedAt?: string;
      aiAnalysis?: any;
    };
    history: Array<{
      url: string;
      filename: string;
      format: string;
      uploadedAt: string;
    }>;
  };
  analytics: {
    viewCount: number;
    applicationStats?: {
      total: number;
      interviews: number;
      offers: number;
      accepted: number;
    };
  };
  progress: {
    profileCompletion?: number;
    skillVerification?: {
      completed: number;
      total: number;
    };
  };
}

export interface CandidateProfileResponse {
  success: boolean;
  data: CandidateProfile;
}

// CV Builder Types
export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  style: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  sections: string[];
}

export interface CVTemplatesResponse {
  success: boolean;
  data: {
    templates: CVTemplate[];
    groupedTemplates?: {
      [key: string]: CVTemplate[];
    };
    categories: string[];
    total: number;
  };
}

// Application Types
export interface ApplicationResume {
  url?: string;
  uploadedAt?: string;
}

export interface ApplicationMatchingScore {
  skills?: Array<{
    name?: string;
    score?: number;
    required?: boolean;
  }>;
  experience?: number;
  education?: number;
  overall?: number;
}

export interface ApplicationFeedback {
  strengths?: string[];
  improvements?: string[];
  notes?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationAIAnalysis {
  matchAnalysis?: {
    strengths?: string[];
    concerns?: string[];
    recommendations?: string[];
    overallFit?: number;
    technicalFit?: number;
    experienceFit?: number;
    educationFit?: number;
    culturalFit?: number;
  };
  predictedSuccess?: {
    probability?: number;
    factors?: Array<{
      factor?: string;
      impact?: number;
      explanation?: string;
    }>;
  };
  resumeScore?: {
    overall?: number;
    sections?: {
      format?: number;
      content?: number;
      keywords?: number;
      experience?: number;
    };
  };
  analyzedAt?: string;
}

export interface ApplicationTimelineItem {
  _id?: string;
  status: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ApplicationJob {
  _id: string;
  title: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  status?: string;
}

export interface Application {
  _id: string;
  candidateId: string;
  jobId: ApplicationJob | null;
  status: string;
  resume?: ApplicationResume;
  coverLetter?: string;
  attachments?: Array<{
    name?: string;
    url?: string;
    type?: string;
  }>;
  matchingScore?: ApplicationMatchingScore;
  feedback?: ApplicationFeedback;
  aiAnalysis?: ApplicationAIAnalysis;
  interviews?: Array<{
    scheduledAt?: string;
    duration?: number;
    type?: string;
    location?: string;
    interviewer?: string;
    feedback?: any;
  }>;
  timeline?: ApplicationTimelineItem[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ApplicationsResponse {
  success: boolean;
  message?: string;
  data: {
    applications: Application[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
      hasMore: boolean;
    };
  };
  timestamp?: string;
  requestId?: string | null;
}