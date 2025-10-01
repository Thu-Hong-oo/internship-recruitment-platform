import axiosClient from "./axiosClient";

// Employers API for admin
export const employersAPI = {
  /**
   * Fetch employers with filters and pagination
   */
  getEmployers: async ({
    page = 1,
    limit = 20,
    search = "",
    status = "all",
    verified = "all",
    industry = "all",
  } = {}) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;
    if (verified && verified !== "all") params.verified = verified;
    if (industry && industry !== "all") params.industry = industry;

    const res = await axiosClient.get("/admin/employers", { params });

    return {
      success: Boolean(res?.success),
      data: res?.data ?? [],
      summary: res?.summary ?? {
        total: 0,
        verified: 0,
        pending: 0,
        approved: 0,
        withProfiles: 0,
      },
      pagination: res?.pagination ?? {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: Number(res?.data?.length || 0),
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: res?.filters ?? {
        search: "",
        status: "all",
        verified: "all",
        industry: "all",
      },
      raw: res,
    };
  },
};

export default employersAPI;
