import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url;

    // Chỉ xử lý 401 cho các API khác, không phải login API
    if (status === 401 && url !== "/auth/login") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userInfo");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userInfo");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default axiosClient;
