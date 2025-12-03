import axiosClient from "./axiosClient";

// Dashboard API for admin
export const dashboardAPI = {
  /**
   * Fetch dashboard data with optional period filter
   * @param {number} period - Number of days (7, 30, 90)
   * @returns {Promise<Object>} Dashboard data including stats, charts, and recent activities
   */
  getDashboard: async (period = 30) => {
    const response = await axiosClient.get("/admin/dashboard", {
      params: { period },
    });
    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      raw: response,
    };
  },
};

export default dashboardAPI;

