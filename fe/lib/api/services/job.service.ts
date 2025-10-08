import { apiClient } from "../client";
import type {
  JobsResponse,
  JobItem,
  BackendJobsResponse,
  BackendJobDetailResponse,
  BackendJob,
} from "../types";

class JobService {
  async getJobs(
    page = 1,
    limit = 10,
    params?: {
      q?: string;
      location?: string;
      skills?: string | string[];
      employer?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      jobType?: string;
      industry?: string;
      salaryMin?: string | number;
      salaryMax?: string | number;
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

      setParam("q", params.q);
      setParam("location", params.location);
      setParam("skills", params.skills);
      setParam("employer", params.employer);
      setParam("status", params.status);
      setParam("sortBy", params.sortBy);
      setParam("sortOrder", params.sortOrder);
      setParam("jobType", params.jobType);
      setParam("industry", params.industry);
      setParam("salaryMin", params.salaryMin);
      setParam("salaryMax", params.salaryMax);
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
      const companyName = job.employer?.company?.name || "Nhà tuyển dụng";
      const logoUrl = job.employer?.company?.logo?.url;
      const office = job.employer?.company?.officeAddress;
      const fallbackCity = office?.city;
      return {
        id: job._id,
        _id: job._id,
        title: job.title,
        companyId: {
          name: companyName,
          logo: { url: logoUrl },
        },
        fullLocation: job.location || fallbackCity || "",
        salaryRange: job.salary,
        isUrgent: false,
        isFeatured: false,
        createdAt: job.createdAt,
      };
    });

    return {
      success: backend.success,
      data: mapped,
      pagination: backend.pagination,
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
    const res = await apiClient.get<BackendJobDetailResponse>(`/jobs/${id}`);
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
}

export const jobService = new JobService();
