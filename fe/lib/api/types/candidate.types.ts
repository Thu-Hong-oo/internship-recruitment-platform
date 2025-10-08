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
