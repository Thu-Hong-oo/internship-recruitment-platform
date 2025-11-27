import { apiClient } from "../client";
import type {
  JobsResponse,
  JobItem,
  BackendJobsResponse,
  BackendJobDetailResponse,
  BackendJob,
  ApplyToJobRequest,
  ApplicationResponse,
} from "../types";

class JobService {
  async getJobs(
    page = 1,
    limit = 10,
    params?: {
      q?: string;
      search?: string; // Alternative search param
      location?: string;
      skills?: string | string[];
      employer?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      jobType?: string;
      employmentType?: string; // New: full-time, part-time, internship, remote
      experienceLevel?: string; // New: junior, mid, senior, fresh
      industry?: string;
      industryCode?: string; // New: normalized industry code
      salaryMin?: string | number;
      salaryMax?: string | number;
      minSalary?: string | number; // Alternative param name
      maxSalary?: string | number; // Alternative param name
      createdFrom?: string;
      createdTo?: string;
      deadlineFrom?: string;
      deadlineTo?: string;
      tags?: string | string[];
      category?: string; // keep backward compatibility
    }
  ): Promise<JobsResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (params) {
      const setParam = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === "") return;
        if (Array.isArray(value)) {
          if (value.length > 0) query.set(key, value.join(","));
        } else {
          query.set(key, String(value));
        }
      };

      // Search - use 'q' or 'search' param
      if (params.q) {
        setParam("q", params.q);
      } else if (params.search) {
        setParam("q", params.search);
      }

      setParam("location", params.location);
      setParam("skills", params.skills);
      setParam("employer", params.employer);
      setParam("status", params.status);
      setParam("sortBy", params.sortBy);
      setParam("sortOrder", params.sortOrder);
      setParam("jobType", params.jobType);
      setParam("employmentType", params.employmentType);
      setParam("experienceLevel", params.experienceLevel);
      setParam("industry", params.industry);
      setParam("industryCode", params.industryCode);

      // Salary - support both naming conventions
      if (params.minSalary !== undefined) {
        setParam("minSalary", params.minSalary);
      } else if (params.salaryMin !== undefined) {
        setParam("minSalary", params.salaryMin);
      }

      if (params.maxSalary !== undefined) {
        setParam("maxSalary", params.maxSalary);
      } else if (params.salaryMax !== undefined) {
        setParam("maxSalary", params.salaryMax);
      }

      setParam("createdFrom", params.createdFrom);
      setParam("createdTo", params.createdTo);
      setParam("deadlineFrom", params.deadlineFrom);
      setParam("deadlineTo", params.deadlineTo);
      setParam("tags", params.tags);
      // legacy
      setParam("category", params.category);
    }

    const backend = await apiClient.get<BackendJobsResponse>(
      `/jobs?${query.toString()}`
    );

    const mapped: JobItem[] = (backend.data || []).map((job) => {
      // Handle both old and new response structures
      const companyName =
        job.employer?.company?.name ||
        (job as any).postedBy?.displayFullName ||
        "Nhà tuyển dụng";
      const logoUrl =
        job.employer?.company?.logo?.url || (job as any).postedBy?.avatar;
      const office = job.employer?.company?.officeAddress;
      const fallbackCity = office?.city;

      // Extract salary info from various possible fields
      const salary =
        (job as any).salary ||
        (job as any).salaryRange ||
        ((job as any).currency
          ? `${(job as any).currency} - Thỏa thuận`
          : "Thỏa thuận");

      return {
        id: job._id,
        _id: job._id,
        title: job.title,
        companyId: {
          name: companyName,
          logo: { url: logoUrl },
        },
        fullLocation:
          job.location || fallbackCity || (job as any).location || "",
        salaryRange: salary,
        isUrgent: (job as any).isUrgent || false,
        isFeatured: (job as any).isFeatured || false,
        createdAt: job.createdAt || (job as any).createdAt,
      };
    });

    return {
      success: backend.success,
      data: mapped,
      pagination: backend.pagination || {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  async getJobById(id: string): Promise<{
    success: boolean;
    data: {
      id: string;
      title: string;
      description?: string;
      requirements?: string;
      education?: string;
      experience?: string;
      skills?: string[];
      salary?: string;
      location?: string;
      deadline?: string;
      status?: string;
      views?: number;
      positions?: number;
      stats?: { applications?: number; interviews?: number; offers?: number };
      createdAt?: string;
      updatedAt?: string;
      employer?: BackendJob["employer"]; // keep original nested employer for detail page
      postedBy?: {
        id?: string;
        email?: string;
        fullName?: string;
        avatar?: string;
      };
    };
  }> {
    // Add cache busting timestamp to ensure fresh data
    const timestamp = Date.now();
    const res = await apiClient.get<BackendJobDetailResponse>(
      `/jobs/${id}?t=${timestamp}`
    );
    const j = res.data;
    return {
      success: res.success,
      data: {
        id: j._id,
        title: j.title,
        description: j.description,
        requirements: j.requirements,
        education: j.education,
        experience: j.experience,
        skills: j.skills,
        salary: (j as any).salary,
        location: (j as any).location,
        deadline: (j as any).deadline,
        status: (j as any).status,
        views: (j as any).views,
        positions: (j as any).positions,
        stats: (j as any).stats,
        createdAt: j.createdAt,
        updatedAt: (j as any).updatedAt,
        employer: j.employer,
        postedBy: j.postedBy
          ? {
              id: (j.postedBy as any).id || j.postedBy._id,
              email: j.postedBy.email,
              fullName:
                (j.postedBy as any).displayFullName || j.postedBy.fullName,
              avatar: j.postedBy.avatar,
            }
          : undefined,
      },
    };
  }

  /**
   * Apply to a job
   * @param jobId - Job ID to apply for
   * @param data - Application data (coverLetter, resumeUrl, portfolioUrl)
   * @returns Application response
   */
  async applyToJob(
    jobId: string,
    data?: ApplyToJobRequest
  ): Promise<ApplicationResponse> {
    try {
      const response = await apiClient.post<ApplicationResponse>(
        `/jobs/${jobId}/apply`,
        data || {}
      );
      return response;
    } catch (error: any) {
      // Handle error response from API
      if (error && typeof error === "object" && error.success === false) {
        return error as ApplicationResponse;
      }
      // Re-throw other errors
      throw error;
    }
  }
}

export const jobService = new JobService();
