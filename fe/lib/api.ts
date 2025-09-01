const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Types based on your API
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "employer" | "admin";
  fullName: string;
  authMethod: "local" | "google";
  isEmailVerified: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "student" | "employer";
}

//hiểu dữ liệu user gởi đi và server trả về

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message: string;
  error?: string; // Optional error field
}

// API Client
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
  }
  // tránh lỗi next js server không có window

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        //200-299 >< 400, 401, 403, 404, 500, ...
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Store token if registration is successful
    if (response.success && response.token) {
      this.token = response.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
    }

    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.token) {
      this.token = response.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
    }

    return response;
  }

  async logout() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    if (response.success && response.token) {
      this.token = response.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
    }

    return response;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const authAPI = {
  register: apiClient.register.bind(apiClient),
  login: apiClient.login.bind(apiClient),
  logout: apiClient.logout.bind(apiClient),
  getCurrentUser: apiClient.getCurrentUser.bind(apiClient),
  verifyEmail: apiClient.verifyEmail.bind(apiClient),
};
