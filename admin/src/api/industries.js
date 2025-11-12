import axiosClient from "./axiosClient";

// Industries API for admin
export const industriesAPI = {
  /**
   * Fetch industries with optional filters.
   * @param {Object} params - Query parameters
   * @param {string} params.q - Search query keyword
   * @param {string} params.parent - Parent industry code (e.g., "root" for root industries)
   * @param {boolean} params.includeStats - Whether to include real-time statistics (default: false)
   * @returns {Promise<Object>} Industries response with data array
   */
  getIndustries: async ({ q, parent, includeStats = false } = {}) => {
    const params = {};
    if (q) params.q = q;
    if (parent !== undefined) params.parent = parent;
    if (includeStats !== undefined) {
      params.includeStats = includeStats;
    }

    const response = await axiosClient.get("/admin/industries", { params });

    const industriesArray = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.industries)
      ? response.data.industries
      : [];

    const metadata =
      response?.data && !Array.isArray(response.data)
        ? {
            ...response.data,
            industries: undefined,
          }
        : null;

    return {
      success: Boolean(response?.success),
      data: industriesArray,
      metadata,
      message: response?.message,
      error: response?.error,
      raw: response,
    };
  },

  /**
   * Get root industries (parent = "root")
   * @param {boolean} includeStats - Whether to include statistics
   * @returns {Promise<Object>} Root industries response
   */
  getRootIndustries: async (includeStats = false) => {
    return industriesAPI.getIndustries({ parent: "root", includeStats });
  },

  /**
   * Search industries by keyword
   * @param {string} query - Search keyword
   * @param {boolean} includeStats - Whether to include statistics
   * @returns {Promise<Object>} Search results response
   */
  searchIndustries: async (query, includeStats = false) => {
    return industriesAPI.getIndustries({ q: query, includeStats });
  },

  /**
   * Get sub-industries by parent code
   * @param {string} parentCode - Parent industry code
   * @param {boolean} includeStats - Whether to include statistics
   * @returns {Promise<Object>} Sub-industries response
   */
  getSubIndustries: async (parentCode, includeStats = false) => {
    return industriesAPI.getIndustries({ parent: parentCode, includeStats });
  },

  /**
   * Get industry detail by ID
   * @param {string} industryId - Industry ID
   * @param {boolean} includeStats - Whether to include statistics
   * @returns {Promise<Object>} Industry detail response
   */
  getIndustryDetail: async (industryId, includeStats = false) => {
    const params = {};
    if (includeStats) params.includeStats = includeStats;

    const response = await axiosClient.get(`/admin/industries/${industryId}`, {
      params,
    });

    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      message: response?.message,
      error: response?.error,
      raw: response,
    };
  },

  /**
   * Create a new industry
   * @param {Object} industryData - Industry data to create
   * @returns {Promise<Object>} Created industry response
   */
  createIndustry: async (industryData) => {
    const response = await axiosClient.post("/admin/industries", industryData);

    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      message: response?.message,
      error: response?.error,
      raw: response,
    };
  },

  /**
   * Update an industry by ID
   * @param {string} industryId - Industry ID
   * @param {Object} industryData - Industry data to update
   * @returns {Promise<Object>} Updated industry response
   */
  updateIndustry: async (industryId, industryData) => {
    const response = await axiosClient.put(
      `/admin/industries/${industryId}`,
      industryData
    );

    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      message: response?.message,
      error: response?.error,
      raw: response,
    };
  },

  /**
   * Delete an industry by ID
   * @param {string} industryId - Industry ID
   * @returns {Promise<Object>} Delete response
   */
  deleteIndustry: async (industryId) => {
    const response = await axiosClient.delete(`/admin/industries/${industryId}`);

    return {
      success: Boolean(response?.success),
      message: response?.message,
      error: response?.error,
      raw: response,
    };
  },
};

export default industriesAPI;

