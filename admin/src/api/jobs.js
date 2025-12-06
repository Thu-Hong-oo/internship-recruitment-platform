import axiosClient from "./axiosClient";

// Jobs API for admin
export const jobsAPI = {
  /**
   * Fetch jobs with optional filters and pagination.
   * Supports: page, limit, status, level, jobType, location, salaryMin, salaryMax, search, flagged, dateFrom, dateTo
   */
  getJobs: async ({
    page = 1,
    limit = 10,
    status,
    level,
    jobType,
    location,
    salaryMin,
    salaryMax,
    search,
    flagged,
    dateFrom,
    dateTo,
  } = {}) => {
    const params = { page, limit };
    if (status && status !== "all") params.status = status;
    if (level && level !== "all") params.level = level;
    if (jobType && jobType !== "all") params.jobType = jobType;
    if (location) params.location = location.trim();
    if (salaryMin) params.salaryMin = salaryMin;
    if (salaryMax) params.salaryMax = salaryMax;
    if (search) params.search = search.trim();
    if (typeof flagged === "boolean") params.flagged = String(flagged);
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const response = await axiosClient.get("/admin/jobs", { params });

    return {
      success: Boolean(response?.success),
      data: response?.data ?? [],
      stats: response?.stats ?? null,
      pagination: response?.pagination ?? {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        total: 0,
      },
      error: response?.error,
      raw: response,
    };
  },

  /**
   * Get job detail by ID
   */
  getJobDetail: async (jobId) => {
    const response = await axiosClient.get(`/admin/jobs/${jobId}`);
    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      error: response?.error,
      raw: response,
    };
  },

  /**
   * Update job status
   */
  updateJobStatus: async (jobId, status = "active") => {
    const response = await axiosClient.put(`/admin/jobs/${jobId}/status`, {
      status,
    });
    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      message: response?.message,
      error: response?.error,
      raw: response,
    };
  },
};

export default jobsAPI;

