import axiosClient from "./axiosClient";

// Users API for admin
export const usersAPI = {
  /**
   * Fetch users with optional filters and pagination.
   * Returns data plus pagination helpers: current/total pages label and total users.
   */
  getUsers: async ({ page = 1, limit = 20, role, status } = {}) => {
    const params = { page, limit };
    if (role) params.role = role; // student | employer | admin
    if (status) params.status = status; // active | inactive

    const response = await axiosClient.get("/admin/users", { params });

    const total = Number(response?.total ?? 0);
    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: Boolean(response?.success),
      users: response?.data ?? [],
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
   * Get user detail by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User detail data
   */
  getUserDetail: async (userId) => {
    const response = await axiosClient.get(`/admin/users/${userId}`);
    return {
      success: Boolean(response?.success),
      data: response?.data ?? null,
      raw: response,
    };
  },
};

export default usersAPI;
