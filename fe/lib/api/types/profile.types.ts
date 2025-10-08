// Profile Types for Candidate Management

export interface ProfileData {
  _id: string;
  userId: {
    _id: string;
    email: string;
    fullName: string;
    avatar: string;
    isEmailVerified: boolean;
    preferences: {
      privacySettings: {
        profileVisibility: "public" | "private" | "connections";
        showEmail: boolean;
        showPhone: boolean;
      };
      notifications: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        jobAlerts: boolean;
        applicationUpdates: boolean;
      };
      language: string;
      timezone: string;
    };
  };
  settings: {
    visibility: "public" | "private" | "connections";
    searchable: boolean;
  };
  personalInfo: {
    fullName?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    bio?: string;
    address?: {
      street?: string;
      ward?: string;
      district?: string;
      city?: string;
      country: string;
    };
  };
  targetJob: {
    level: "entry" | "mid" | "senior" | "lead";
    updatedAt: string;
  };
  education: {
    university?: EducationEntry;
    certifications: EducationEntry[];
  };
  skills: {
    technical: Skill[];
    soft: Skill[];
    languages: LanguageSkill[];
  };
  experience: {
    internships: ExperienceEntry[];
    projects: ProjectEntry[];
  };
  preferences: {
    locations: string[];
    internshipTypes: string[];
    industries: string[];
    targetRoles: string[];
  };
  resume: {
    current?: ResumeEntry;
    history: ResumeEntry[];
  };
  progress: {
    profileCompletion: number;
    activeRoadmaps: string[];
  };
  analytics: {
    applicationStats: {
      total: number;
      pending: number;
      interviews: number;
      offers: number;
      accepted: number;
    };
    viewCount: number;
    skillGrowth: any[];
  };
  followedCompanies: any[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface EducationEntry {
  _id?: string;
  type: "university" | "certification";
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: number;
  achievements?: string[];
  courses?: string[];
}

export interface ExperienceEntry {
  _id?: string;
  type: "internship" | "full-time" | "part-time" | "contract";
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  skills?: string[];
  projects?: ProjectReference[];
}

export interface ProjectEntry {
  _id?: string;
  type: "project";
  name: string;
  description: string;
  role?: string;
  technologies?: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProjectReference {
  name: string;
  description: string;
  technologies: string[];
}

export interface Skill {
  _id?: string;
  type: "technical" | "soft";
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  verified?: boolean;
  projects?: ProjectReference[];
  selfAssessment?: number;
}

export interface LanguageSkill {
  _id?: string;
  type: "language";
  name: string;
  level: string;
  certificate?: string;
}

export interface ResumeEntry {
  _id?: string;
  url?: string;
  publicId?: string;
  filename?: string;
  displayName?: string;
  size?: number;
  mimeType?: string;
  updatedAt?: string;
  aiAnalysis?: {
    skills?: string[];
    suggestions?: string[];
    detailedSkills?: any[];
    extractedData?: any;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

export interface EducationResponse {
  university?: EducationEntry;
  certifications: EducationEntry[];
}

export interface ExperienceResponse {
  internships: ExperienceEntry[];
  projects: ProjectEntry[];
}

export interface SkillsResponse {
  technical: Skill[];
  soft: Skill[];
  languages: LanguageSkill[];
}

// Form Data Types
export interface EducationFormData {
  type: "university" | "certification";
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: number;
  achievements?: string[];
}

export interface ExperienceFormData {
  type: "internship" | "full-time" | "part-time" | "contract";
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  skills?: string[];
  projects?: ProjectReference[];
}

export interface ProjectFormData {
  type: "project";
  name: string;
  description: string;
  role?: string;
  technologies?: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface SkillFormData {
  type: "technical" | "soft" | "language";
  name: string;
  level: string;
  projects?: ProjectReference[];
  selfAssessment?: number;
  certificate?: string;
}
