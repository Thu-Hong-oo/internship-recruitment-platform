import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || null;
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default axiosClient