export interface IndustryName {
  vi: string;
  en: string;
}

export interface IndustryDescription {
  vi: string;
  en: string;
}

export interface IndustrySuggestions {
  summary: string[];
  experience: string[];
  projects: string[];
  skills: string[];
}

export interface IndustryStats {
  totalJobs: number;
  totalCandidates: number;
  totalCVs: number;
  totalApplications: number;
}

export interface Industry {
  _id: string;
  name: IndustryName;
  description: IndustryDescription;
  suggestions: IndustrySuggestions;
  stats: IndustryStats;
  code: string;
  parentCode: string | null;
  color: string;
  icon: string;
  keywords: string[];
  suggestedTemplates: string[];
  visible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IndustriesResponse {
  success: boolean;
  data: Industry[];
  message?: string;
  error?: string;
}

