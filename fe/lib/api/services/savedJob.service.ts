import { apiClient } from "../client";

export interface SavedJob {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    status: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    deadline?: string;
    positions?: number;
    address?: {
      fullAddress?: string;
      city?: string;
    };
    employer?: {
      company?: {
        name: string;
        logo?: {
          url: string;
        };
        industry?: string;
        size?: string;
      };
    };
    createdAt?: string;
  };
  savedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJobsResponse {
  success: boolean;
  data: SavedJob[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface CheckJobSavedResponse {
  success: boolean;
  data: {
    isSaved: boolean;
    savedJobId?: string;
  };
}

class SavedJobService {
  /**
   * Get all saved jobs for current user
   */
  async getSavedJobs(params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
  }): Promise<SavedJobsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.category) query.set("category", params.category);
    if (params?.location) query.set("location", params.location);

    const queryString = query.toString();
    return apiClient.get<SavedJobsResponse>(
      `/saved-jobs${queryString ? `?${queryString}` : ""}`
    );
  }

  /**
   * Save a job
   */
  async saveJob(jobId: string, notes?: string): Promise<{
    success: boolean;
    data: SavedJob;
    message?: string;
  }> {
    return apiClient.post(`/saved-jobs`, { jobId, notes });
  }

  /**
   * Remove a saved job by saved job ID
   */
  async removeSavedJob(savedJobId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return apiClient.delete(`/saved-jobs/${savedJobId}`);
  }

  /**
   * Remove a saved job by job ID
   */
  async removeSavedJobByJobId(jobId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return apiClient.delete(`/saved-jobs/job/${jobId}`);
  }

  /**
   * Check if a job is saved
   */
  async checkJobSaved(jobId: string): Promise<CheckJobSavedResponse> {
    return apiClient.get<CheckJobSavedResponse>(`/saved-jobs/check/${jobId}`);
  }

  /**
   * Get saved jobs count
   */
  async getSavedJobsCount(): Promise<{
    success: boolean;
    data: { count: number };
  }> {
    return apiClient.get(`/saved-jobs/count`);
  }

  /**
   * Clear all saved jobs
   */
  async clearAllSavedJobs(): Promise<{
    success: boolean;
    message?: string;
  }> {
    return apiClient.delete(`/saved-jobs`);
  }
}

export const savedJobService = new SavedJobService();

