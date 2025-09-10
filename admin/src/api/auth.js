import axiosClient from "./axiosClient";

// API cho authentication
export const authAPI = {
  // Đăng nhập
  login: async (email, password) => {
    try {
      const response = await axiosClient.post("/auth/login", {
        email,
        password,
      });
      return response;
    } catch (error) {
      // Xử lý lỗi từ API
      if (error.response?.data) {
        // Nếu server trả về response với success: false, trả về response thay vì throw error
        if (error.response.data.success === false) {
          return error.response.data;
        }

        // Nếu là lỗi khác, throw error
        const serverError = new Error(
          error.response.data.error || "Đăng nhập thất bại"
        );
        serverError.response = error.response;
        throw serverError;
      }

      // Lỗi mạng hoặc lỗi khác
      if (error.code === "NETWORK_ERROR" || !navigator.onLine) {
        throw new Error(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
        );
      }

      throw new Error("Có lỗi xảy ra khi đăng nhập");
    }
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userInfo");
  },

  // Kiểm tra token có hợp lệ không
  verifyToken: async () => {
    try {
      const response = await axiosClient.get("/auth/verify");
      return response;
    } catch (error) {
      throw new Error("Token không hợp lệ");
    }
  },
};
