const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type CreateJobPayload = {
  title: string;
  slug?: string;
  description: string;
  requirements: string;
  benefits?: string;
  skills: string[];
  skillIds?: string[];
  level?: string;
  jobType?: string;
  workingMode?: string;
  location: string;
  address?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  industryCode?: string;
  subIndustryCode?: string;
  positions: number;
  deadline: string;
};

export interface JobResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface JobsListResponse {
  success: boolean;
  data?: any[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export interface AnalyticsResponse {
  success: boolean;
  message?: string;
  data?: {
    jobs?: {
      total?: number;
      active?: number;
      draft?: number;
      closed?: number;
    };
    applications?: {
      total?: number;
    };
    summary?: {
      totalJobs?: number;
      activeJobs?: number;
      totalApplications?: number;
    };
  };
  error?: string;
}

// Create a new job
export const createJob = async (
  payload: CreateJobPayload,
  token: string
): Promise<JobResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return (await response.json()) as JobResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Get all jobs posted by employer
export const getMyJobs = async (
  token: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<JobsListResponse> => {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);
    if (options?.sortBy) params.append("sortBy", options.sortBy);
    if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/jobs/employer${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await response.json()) as JobsListResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Get draft jobs only
export const getDraftJobs = async (
  token: string
): Promise<JobsListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/drafts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await response.json()) as JobsListResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Update job
export const updateJob = async (
  jobId: string,
  payload: CreateJobPayload,
  token: string
): Promise<JobResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return (await response.json()) as JobResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Delete job
export const deleteJob = async (
  jobId: string,
  token: string
): Promise<JobResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await response.json()) as JobResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Get job applications
export const getJobApplications = async (
  jobId: string,
  token: string
): Promise<JobsListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/applications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await response.json()) as JobsListResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Submit job for review
export const submitJobForReview = async (
  jobId: string,
  token: string,
  notes: string = "Please review this job posting for approval",
  urgentReview: boolean = false
): Promise<JobResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/jobs/employer/${jobId}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes,
          urgentReview,
        }),
      }
    );
    return (await response.json()) as JobResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Get employer analytics
export const getAnalytics = async (
  token: string,
  period: string = "30d"
): Promise<AnalyticsResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/employers/analytics?period=${period}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return (await response.json()) as AnalyticsResponse;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};
