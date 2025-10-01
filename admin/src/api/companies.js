import axiosClient from "./axiosClient";

// Companies API for admin
export const companiesAPI = {
  /**
   * Fetch companies with optional filters and pagination.
   * Supports: page, limit, status, size, companyType, search
   */
  getCompanies: async ({
    page = 1,
    limit = 10,
    status,
    size,
    companyType,
    search,
  } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;
    if (size) params.size = size;
    if (companyType) params.companyType = companyType;
    if (search) params.search = search;

    const response = await axiosClient.get("/admin/companies", { params });

    const total = Number(response?.total ?? 0);
    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: Boolean(response?.success),
      companies: response?.data ?? [],
      count: Number(response?.count ?? response?.data?.length ?? 0),
      total,
      pagination: {
        currentPage,
        totalPages,
        label: `${currentPage}/${totalPages}`,
        pageSize,
        next: response?.pagination?.next ?? null,
        prev: response?.pagination?.prev ?? null,
      },
      raw: response,
    };
  },

  /**
   * Get company detail by ID
   */
  getCompanyDetail: async (companyId) => {
    const response = await axiosClient.get(`/admin/companies/${companyId}`);
    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      raw: response,
    };
  },

  /**
   * Verify/update company status
   */
  updateCompanyStatus: async (companyId, status = "verified") => {
    const response = await axiosClient.put(
      `/admin/companies/${companyId}/status`,
      { status }
    );
    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      message: response?.message,
      raw: response,
    };
  },
};

export default companiesAPI;
