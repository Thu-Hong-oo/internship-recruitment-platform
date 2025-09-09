const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Types based on your API
export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string; // URL của avatar
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "employer" | "admin";
  fullName: string;
  authMethod: "local" | "google";
  isEmailVerified: boolean;
  profile?: UserProfile; // Profile object từ backend
  avatar?: string; // Fallback cho avatar trực tiếp
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
  token?: string; // Optional vì register có thể không trả về token
  user: User;
  message?: string;
  error?: string; // Optional error field
  errorType?: string; // For specific error types
  requiresEmailVerification?: boolean; // For login when email not verified
}

// API Client
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null; // Initialize as null, will be set when needed
  }

  // Method to get token from localStorage
  private getTokenFromStorage(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  // Method to update token from localStorage
  private updateTokenFromStorage() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Update token from localStorage before each request
    this.updateTokenFromStorage();

    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Add Content-Type only if not FormData
    if (!(options.body instanceof FormData)) {
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      };
    }

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

  // Basic helpers
  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body:
        body instanceof FormData ? (body as any) : JSON.stringify(body ?? {}),
    });
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Store token if registration is successful and token is provided
    if (response.success && response.token) {
      // Store token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
      // Update instance token
      this.token = response.token;
    }

    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.token) {
      // Store token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
      // Update instance token
      this.token = response.token;
    }

    return response;
  }

  async logout() {
    try {
      // Notify server to invalidate token
      await this.request<{ success: boolean; message?: string }>(
        "/auth/logout",
        { method: "POST" }
      );
    } catch (e) {
      // Ignore server errors; proceed to clear local auth
    } finally {
      this.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const result = await this.request<{ success: boolean; user: User }>(
        "/auth/me"
      );

      if (result.success && result.user) {
        return result.user;
      } else {
        throw new Error("Invalid response format from getCurrentUser");
      }
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    // Note: Backend doesn't return token on email verification
    // Token is only returned on successful login after email verification
    return response;
  }

  async uploadAvatar(file: File): Promise<{
    success: boolean;
    avatar?: string;
    error?: string;
    user?: User;
  }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await this.request<{
      success: boolean;
      avatar?: string;
      error?: string;
      user?: User;
    }>("/users/upload-avatar", {
      method: "POST",
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData,
    });

    return response;
  }
}

// Helper function to get avatar URL from user object
export const getUserAvatar = (user: User | null): string | undefined => {
  if (!user) return undefined;
  return user.profile?.avatar || user.avatar;
};

// Create singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const authAPI = {
  register: apiClient.register.bind(apiClient),
  login: apiClient.login.bind(apiClient),
  logout: apiClient.logout.bind(apiClient),
  getCurrentUser: apiClient.getCurrentUser.bind(apiClient),
  verifyEmail: apiClient.verifyEmail.bind(apiClient),
  uploadAvatar: apiClient.uploadAvatar.bind(apiClient),
};

// ===================== Jobs =====================
export interface CompanyLite {
  name: string;
  logo?: { url?: string } | null;
}

export interface JobItem {
  id: string;
  _id?: string;
  title: string;
  companyId?: CompanyLite | null;
  fullLocation?: string;
  salaryRange?: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  slug?: string;
}

export interface JobsResponse {
  success: boolean;
  data: JobItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class JobsApi {
  async getJobs(page = 1, limit = 10): Promise<JobsResponse> {
    return apiClient.get<JobsResponse>(`/jobs?page=${page}&limit=${limit}`);
  }
}

export const jobsAPI = new JobsApi();
