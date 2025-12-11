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
  location?: string;
  address?: {
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    country?: string;
    fullAddress?: string;
  } | string;
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
  // Tổng số job (có thể nằm trực tiếp trên root hoặc trong pagination/statistics)
  total?: number;
  page?: number;
  limit?: number;
  // Thông tin phân trang đầy đủ từ backend
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  // Thống kê bổ sung (ví dụ: byStatus)
  statistics?: {
    total?: number;
    byStatus?: Record<string, number>;
  };
  error?: string;
}

export interface AnalyticsResponse {
  success: boolean;
  message?: string;
  data?: {
    periodDays?: number;
    jobs?: {
      total?: number;
      active?: number;
      draft?: number;
      closed?: number;
      byIndustry?: {
        industryCode?: string | null;
        category?: string | null;
        industry?: string | null;
        name: string;
        count: number;
        active: number;
      }[];
    };
    applications?: {
      total?: number;
      new7d?: number;
      perDay?: { date: string; count: number }[];
      statusDistribution?: { status: string; count: number }[];
      topJobs?: { jobId: string; title: string; status?: string; count: number }[];
    };
    summary?: {
      totalJobs?: number;
      activeJobs?: number;
      totalApplications?: number;
    };
  };
  error?: string;
}

export interface EmployerApplicationsResponse {
  success: boolean;
  message?: string;
  data?: {
    pagination?: {
      page?: number;
      limit?: number;
      totalPages?: number;
      hasNextPage?: boolean;
      hasPrevPage?: boolean;
    };
    data?: any[];
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
    industry?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<JobsListResponse> => {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);
    if (options?.industry) params.append("industry", options.industry);
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

// View applicant resume for a specific job/application (returns blob URL for inline view)
export const viewApplicationResume = async (
  applicationId: string,
  token: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const url = `${API_BASE_URL}/jobs/applications/${applicationId}/resume`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch CV (${response.status})` };
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { success: true, url: objectUrl };
  } catch (e: any) {
    return { success: false, error: e?.message || "Không thể tải CV" };
  }
};

// Get job by ID
export const getJobById = async (
  jobId: string,
  token: string
): Promise<JobResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "GET",
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
  token: string,
  options?: {
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<JobsListResponse> => {
  try {
    const params = new URLSearchParams();
    if (options?.status) params.append("status", options.status);
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/jobs/${jobId}/applications${
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

// Get all applications submitted to employer jobs
export const getEmployerApplications = async (
  token: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: string;
  }
): Promise<EmployerApplicationsResponse> => {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);
    if (options?.jobId) params.append("jobId", options.jobId);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/employers/applications${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await response.json()) as EmployerApplicationsResponse;
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

// Update application status
export const updateApplicationStatus = async (
  applicationId: string,
  status: string,
  token: string,
  feedback?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          ...(feedback && { feedback }),
        }),
      }
    );
    return (await response.json()) as {
      success: boolean;
      data?: any;
      error?: string;
    };
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
};

// Schedule interview
export const scheduleInterview = async (
  applicationId: string,
  payload: {
    scheduledAt: string;
    duration?: number;
    type?: string;
    location?: string;
    interviewerId?: string;
    note?: string;
    metadata?: Record<string, any>;
  },
  token: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/interviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );
    return (await response.json()) as { success: boolean; data?: any; error?: string };
  } catch (e: any) {
    return { success: false, error: e?.message || "Không thể kết nối máy chủ" };
  }
};

// Update interview
export const updateInterview = async (
  applicationId: string,
  interviewId: string,
  payload: {
    scheduledAt?: string;
    duration?: number;
    type?: string;
    location?: string;
    interviewerId?: string;
    note?: string;
    metadata?: Record<string, any>;
  },
  token: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/interviews/${interviewId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );
    return (await response.json()) as { success: boolean; data?: any; error?: string };
  } catch (e: any) {
    return { success: false, error: e?.message || "Không thể kết nối máy chủ" };
  }
};

// Cancel interview
export const cancelInterview = async (
  applicationId: string,
  interviewId: string,
  token: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/interviews/${interviewId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return (await response.json()) as { success: boolean; data?: any; error?: string };
  } catch (e: any) {
    return { success: false, error: e?.message || "Không thể kết nối máy chủ" };
  }
};

// Get employer interviews (upcoming)
export const getEmployerInterviews = async (
  token: string,
  options?: { from?: string; to?: string; limit?: number }
): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const params = new URLSearchParams();
    if (options?.from) params.append("from", options.from);
    if (options?.to) params.append("to", options.to);
    if (options?.limit) params.append("limit", options.limit.toString());

    const url = `${API_BASE_URL}/applications/interviews/employer${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await response.json()) as { success: boolean; data?: any[]; error?: string };
  } catch (e: any) {
    return { success: false, error: e?.message || "Không thể kết nối máy chủ" };
  }
};