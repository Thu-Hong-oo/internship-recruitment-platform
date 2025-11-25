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
      slug?: string;
      description?: string;
      requirements?: string;
      benefits?: string;
      education?: string;
      experience?: string;
      skills?: string[];
      skillIds?: any[];
      tags?: string[];
      salary?: string;
      salaryMin?: number;
      salaryMax?: number;
      currency?: string;
      location?: string;
      address?: any;
      deadline?: string;
      status?: string;
      level?: string;
      jobType?: string;
      workingMode?: string;
      industryCode?: string;
      subIndustryCode?: string;
      views?: number;
      positions?: number;
      stats?: { applications?: number; interviews?: number; offers?: number };
      createdAt?: string;
      updatedAt?: string;
      hasApplied?: boolean;
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
    
    // Format salary from salaryMin, salaryMax, currency
    let salaryString = (j as any).salary;
    if (!salaryString && ((j as any).salaryMin || (j as any).salaryMax)) {
      const min = (j as any).salaryMin;
      const max = (j as any).salaryMax;
      const currency = (j as any).currency || "VND";
      
      if (min && max) {
        if (currency === "VND") {
          salaryString = `${(min / 1000000).toFixed(0)}M - ${(max / 1000000).toFixed(0)}M VND`;
        } else {
          salaryString = `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
        }
      } else if (min) {
        if (currency === "VND") {
          salaryString = `Từ ${(min / 1000000).toFixed(0)}M VND`;
        } else {
          salaryString = `Từ ${min.toLocaleString()} ${currency}`;
        }
      } else if (max) {
        if (currency === "VND") {
          salaryString = `Đến ${(max / 1000000).toFixed(0)}M VND`;
        } else {
          salaryString = `Đến ${max.toLocaleString()} ${currency}`;
        }
      }
    }
    
    // Format location from address object or location string
    let locationString = (j as any).location;
    if (!locationString && (j as any).address) {
      const addr = (j as any).address;
      locationString = addr.fullAddress || 
        [addr.street, addr.ward, addr.district, addr.city, addr.country]
          .filter(Boolean)
          .join(", ");
    }
    
    return {
      success: res.success,
      data: {
        id: j._id,
        title: j.title,
        slug: (j as any).slug,
        description: j.description,
        requirements: j.requirements,
        benefits: (j as any).benefits,
        education: j.education,
        experience: j.experience,
        skills: j.skills,
        skillIds: (j as any).skillIds,
        tags: (j as any).tags,
        salary: salaryString,
        salaryMin: (j as any).salaryMin,
        salaryMax: (j as any).salaryMax,
        currency: (j as any).currency,
        location: locationString,
        address: (j as any).address,
        deadline: (j as any).deadline,
        status: (j as any).status,
        level: (j as any).level,
        jobType: (j as any).jobType,
        workingMode: (j as any).workingMode,
        industryCode: (j as any).industryCode,
        subIndustryCode: (j as any).subIndustryCode,
        views: (j as any).views,
        positions: (j as any).positions,
        stats: (j as any).stats, // Keep for internal use but don't display
        createdAt: j.createdAt,
        updatedAt: (j as any).updatedAt,
        hasApplied: (j as any).hasApplied,
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
