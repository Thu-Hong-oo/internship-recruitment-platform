export interface CompanyLite {
  name: string;
  logo?: { url?: string } | null;
}

export interface JobItem {
  id: string;
  _id?: string;
  title: string;
  companyId?: CompanyLite | null;
  fullLocation?: string;
  city?: string; // City from address.city
  salaryRange?: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  slug?: string;
}

export interface JobsResponse {
  success: boolean;
  data: JobItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Backend job shape (partial, based on response)
export interface BackendJob {
  _id: string;
  title: string;
  salary?: string;
  location?: string;
  createdAt?: string;
  employer?: {
    _id?: string;
    company?: {
      name?: string;
      logo?: { url?: string } | null;
      officeAddress?: {
        street?: string;
        ward?: string;
        district?: string;
        city?: string;
        country?: string;
      } | null;
    } | null;
  } | null;
}

export interface BackendJobsResponse {
  success: boolean;
  data: BackendJob[];
  pagination: JobsResponse["pagination"];
}

export interface BackendJobDetailResponse {
  success: boolean;
  data: BackendJob & {
    description?: string;
    requirements?: string;
    education?: string;
    experience?: string;
    skills?: string[];
    deadline?: string;
    status?: string;
    views?: number;
    positions?: number;
    stats?: {
      applications?: number;
      interviews?: number;
      offers?: number;
    };
    updatedAt?: string;
    postedBy?: {
      _id?: string;
      id?: string;
      email?: string;
      fullName?: string;
      displayFullName?: string;
      avatar?: string;
    };
  };
}

export interface ApplyToJobRequest {
  coverLetter?: string;
  resumeId?: string; // "current" or specific resume ID
  additionalInfo?: {
    availableStartDate?: string; // ISO date string (YYYY-MM-DD)
    expectedSalary?: number;
    noticePeriod?: string;
  };
}

export interface ApplicationResponse {
  success: boolean;
  data?: {
    _id: string;
    jobId: string;
    candidateId: string;
    status: string;
    coverLetter?: string;
    resume?: {
      url: string;
      uploadedAt: string;
    };
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
  };
  message?: string;
  error?: string;
}