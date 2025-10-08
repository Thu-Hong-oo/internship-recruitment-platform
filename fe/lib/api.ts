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
  role: "candidate" | "employer" | "admin";
  fullName: string;
  authMethod: "local" | "google";
  isEmailVerified: boolean;
  profile?: UserProfile; // Profile object từ backend
  avatar?: string; // Fallback cho avatar trực tiếp
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
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

export interface EmailValidationResponse {
  success: boolean;
  data?: {
    email: string;
    userId: string;
    emailStatus: string;
    recentIssues: number;
    lastIssue: string | null;
    isEmailValid: boolean;
  };
  error?: string;
}

export interface UnverifiedAccountResponse {
  success: boolean;
  data?: {
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    verificationExpiry: string;
    timeRemaining: number;
  };
  error?: string;
  expired?: boolean;
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

  public async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body:
        body instanceof FormData ? (body as any) : JSON.stringify(body ?? {}),
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  // Auth methods
  async getGoogleAuthUrl(): Promise<{ success: boolean; authUrl?: string }> {
    try {
      return await this.request<{ success: boolean; authUrl?: string }>(
        "/auth/google",
        { method: "GET" }
      );
    } catch (e) {
      // Fallback shape
      return { success: false };
    }
  }
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

  // Candidate profile (for CV)
  async getUserProfile(): Promise<any> {
    return this.get<any>("/users/profile");
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

  async resendEmailVerification(email: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await this.request<{
      success: boolean;
      message?: string;
      error?: string;
    }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    return response;
  }

  async getUnverifiedAccount(
    email: string
  ): Promise<UnverifiedAccountResponse> {
    const response = await this.request<UnverifiedAccountResponse>(
      `/auth/unverified-account?email=${encodeURIComponent(email)}`
    );

    return response;
  }

  async validateEmail(email: string): Promise<EmailValidationResponse> {
    const response = await this.request<EmailValidationResponse>(
      `/auth/validate-email?email=${encodeURIComponent(email)}`
    );

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

    // Backend returns: { success, message, data: { avatar: { url, ... }, user: {...} } }
    const response = await this.request<any>("/users/avatar", {
      method: "POST",
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData,
    });

    return {
      success: !!response?.success,
      avatar: response?.data?.avatar?.url,
      user: response?.data?.user,
      error: response?.error,
    };
  }
  async googleAuth(idToken: string): Promise<{
    success: boolean;
    token?: string;
    user?: User;
    isNew?: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await this.request<{
      success: boolean;
      token?: string;
      user?: User;
      isNew?: boolean;
      message?: string;
      error?: string;
    }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    // Store token if Google auth is successful
    if (response.success && response.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
      this.token = response.token;
    }

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
  resendEmailVerification: apiClient.resendEmailVerification.bind(apiClient),
  getUnverifiedAccount: apiClient.getUnverifiedAccount.bind(apiClient),
  validateEmail: apiClient.validateEmail.bind(apiClient),
  uploadAvatar: apiClient.uploadAvatar.bind(apiClient),
  googleAuth: apiClient.googleAuth.bind(apiClient),
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

// Backend job shape (partial, based on response)
interface BackendJob {
  _id: string;
  title: string;
  salary?: string;
  location?: string;
  createdAt?: string;
  employer?: {
    _id?: string;
    company?: {
      name?: string;
      logo?: { url?: string } | null;
      officeAddress?: {
        street?: string;
        ward?: string;
        district?: string;
        city?: string;
        country?: string;
      } | null;
    } | null;
  } | null;
}

interface BackendJobsResponse {
  success: boolean;
  data: BackendJob[];
  pagination: JobsResponse["pagination"];
}

interface BackendJobDetailResponse {
  success: boolean;
  data: BackendJob & {
    description?: string;
    requirements?: string;
    education?: string;
    experience?: string;
    skills?: string[];
    deadline?: string;
    status?: string;
    views?: number;
    positions?: number;
    stats?: {
      applications?: number;
      interviews?: number;
      offers?: number;
    };
    updatedAt?: string;
    postedBy?: {
      _id?: string;
      id?: string;
      email?: string;
      fullName?: string;
      displayFullName?: string;
      avatar?: string;
    };
  };
}

class JobsApi {
  async getJobs(
    page = 1,
    limit = 10,
    params?: {
      q?: string;
      location?: string;
      skills?: string | string[];
      employer?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      jobType?: string;
      industry?: string;
      salaryMin?: string | number;
      salaryMax?: string | number;
      createdFrom?: string;
      createdTo?: string;
      deadlineFrom?: string;
      deadlineTo?: string;
      tags?: string | string[];
      category?: string; // keep backward compatibility
    }
  ): Promise<JobsResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (params) {
      const setParam = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === "") return;
        if (Array.isArray(value)) {
          if (value.length > 0) query.set(key, value.join(","));
        } else {
          query.set(key, String(value));
        }
      };

      setParam("q", params.q);
      setParam("location", params.location);
      setParam("skills", params.skills);
      setParam("employer", params.employer);
      setParam("status", params.status);
      setParam("sortBy", params.sortBy);
      setParam("sortOrder", params.sortOrder);
      setParam("jobType", params.jobType);
      setParam("industry", params.industry);
      setParam("salaryMin", params.salaryMin);
      setParam("salaryMax", params.salaryMax);
      setParam("createdFrom", params.createdFrom);
      setParam("createdTo", params.createdTo);
      setParam("deadlineFrom", params.deadlineFrom);
      setParam("deadlineTo", params.deadlineTo);
      setParam("tags", params.tags);
      // legacy
      setParam("category", params.category);
    }

    const backend = await apiClient.get<BackendJobsResponse>(
      `/jobs?${query.toString()}`
    );

    const mapped: JobItem[] = (backend.data || []).map((job) => {
      const companyName = job.employer?.company?.name || "Nhà tuyển dụng";
      const logoUrl = job.employer?.company?.logo?.url;
      const office = job.employer?.company?.officeAddress;
      const fallbackCity = office?.city;
      return {
        id: job._id,
        _id: job._id,
        title: job.title,
        companyId: {
          name: companyName,
          logo: { url: logoUrl },
        },
        fullLocation: job.location || fallbackCity || "",
        salaryRange: job.salary,
        isUrgent: false,
        isFeatured: false,
        createdAt: job.createdAt,
      };
    });

    return {
      success: backend.success,
      data: mapped,
      pagination: backend.pagination,
    };
  }

  async getJobById(id: string): Promise<{
    success: boolean;
    data: {
      id: string;
      title: string;
      description?: string;
      requirements?: string;
      education?: string;
      experience?: string;
      skills?: string[];
      salary?: string;
      location?: string;
      deadline?: string;
      status?: string;
      views?: number;
      positions?: number;
      stats?: { applications?: number; interviews?: number; offers?: number };
      createdAt?: string;
      updatedAt?: string;
      employer?: BackendJob["employer"]; // keep original nested employer for detail page
      postedBy?: {
        id?: string;
        email?: string;
        fullName?: string;
        avatar?: string;
      };
    };
  }> {
    const res = await apiClient.get<BackendJobDetailResponse>(`/jobs/${id}`);
    const j = res.data;
    return {
      success: res.success,
      data: {
        id: j._id,
        title: j.title,
        description: j.description,
        requirements: j.requirements,
        education: j.education,
        experience: j.experience,
        skills: j.skills,
        salary: (j as any).salary,
        location: (j as any).location,
        deadline: (j as any).deadline,
        status: (j as any).status,
        views: (j as any).views,
        positions: (j as any).positions,
        stats: (j as any).stats,
        createdAt: j.createdAt,
        updatedAt: (j as any).updatedAt,
        employer: j.employer,
        postedBy: j.postedBy
          ? {
              id: (j.postedBy as any).id || j.postedBy._id,
              email: j.postedBy.email,
              fullName:
                (j.postedBy as any).displayFullName || j.postedBy.fullName,
              avatar: j.postedBy.avatar,
            }
          : undefined,
      },
    };
  }
}

export const jobsAPI = new JobsApi();

// ===================== Candidate CV Management =====================
export interface CVResponse {
  success: boolean;
  data: {
    // For upload only
    url?: string;
    publicId?: string;
    filename?: string;
    displayName?: string;
    format?: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string;

    // For parse response
    upload?: {
      url: string;
      publicId: string;
      filename: string;
      displayName: string;
      format: string;
      size: number;
      mimeType: string;
      uploadedAt: string;
    };
    parsing?: {
      extractedData?: {
        personalInfo?: {
          fullName?: string;
          email?: string;
          phone?: string;
          address?: string;
          dateOfBirth?: string;
        };
        education?: {
          institution?: string;
          degree?: string;
          field?: string;
          graduationYear?: number;
          gpa?: number;
          gradeText?: string;
        };
        experience?: Array<{
          company?: string;
          position?: string;
          location?: string;
          startDate?: string;
          endDate?: string;
          description?: string;
        }>;
        skills?: {
          technical?: string[];
          soft?: string[];
          languages?: string[];
        };
        certifications?: Array<{
          name?: string;
          issuer?: string;
          date?: string;
        }>;
      };
      skills?: string[];
      suggestions?: string[];
      analyzedAt?: string;
      error?: string;
    };
  };
  message: string;
}

export interface CandidateProfile {
  userId: string;
  fullName?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  summary?: string;
  skills: {
    technical: Array<{ name: string; level: string; verified?: boolean }>;
    soft: Array<{ name: string }>;
    languages: Array<{ name: string; level: string }>;
  };
  education: {
    university: {
      name?: string;
      major?: string;
      degree?: string;
      graduationYear?: number;
      gpa?: number;
    };
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate?: string;
      credentialUrl?: string;
    }>;
  };
  experience: {
    internships: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      description: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
      startDate: string;
      endDate?: string;
      url?: string;
    }>;
  };
  preferences: {
    locations?: string[];
    internshipTypes?: string[];
    salaryExpectation?: {
      min: number;
      max: number;
      currency: string;
    };
  };
  resume: {
    current: {
      url?: string;
      previewUrl?: string;
      downloadUrl?: string;
      filename?: string;
      format?: string;
      updatedAt?: string;
      aiAnalysis?: any;
    };
    history: Array<{
      url: string;
      filename: string;
      format: string;
      uploadedAt: string;
    }>;
  };
  analytics: {
    viewCount: number;
    applicationStats?: {
      total: number;
      interviews: number;
      offers: number;
      accepted: number;
    };
  };
  progress: {
    profileCompletion?: number;
    skillVerification?: {
      completed: number;
      total: number;
    };
  };
}

export interface CandidateProfileResponse {
  success: boolean;
  data: CandidateProfile;
}

// CV Builder Types
export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  style: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  sections: string[];
}

export interface CVTemplatesResponse {
  success: boolean;
  data: {
    templates: CVTemplate[];
    groupedTemplates?: {
      [key: string]: CVTemplate[];
    };
    categories: string[];
    total: number;
  };
}

class CandidateCVApi {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = apiClient;
  }

  // Lấy profile candidate
  async getProfile(userId?: string): Promise<CandidateProfileResponse> {
    const endpoint = userId ? `/candidates/${userId}` : "/candidates/me";
    return this.apiClient.get<CandidateProfileResponse>(endpoint);
  }

  // Lấy resume (current + history) với version=all
  async getResumesAll(): Promise<{
    success: boolean;
    data: { current?: any; history?: any[] } | any; // backend returns current when not all
    message: string;
  }> {
    return this.apiClient.get(`/candidates/me/resume?version=all`);
  }

  // Upload CV (without parsing)
  async uploadCV(formData: FormData, userId?: string): Promise<CVResponse> {
    const endpoint = userId
      ? `/candidates/${userId}/resume`
      : "/candidates/me/resume";
    // Add action to formData
    formData.append("action", "upload");
    return this.apiClient.post<CVResponse>(endpoint, formData);
  }

  // Upload and Parse CV (with AI parsing)
  async uploadAndParseCV(
    formData: FormData,
    userId?: string
  ): Promise<CVResponse> {
    const endpoint = userId
      ? `/candidates/${userId}/resume`
      : "/candidates/me/resume";
    // Add action to formData
    formData.append("action", "parse");
    return this.apiClient.post<CVResponse>(endpoint, formData);
  }

  // Xóa CV khỏi lịch sử
  async deleteCV(
    cvIndex: number,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const endpoint = userId
      ? `/candidates/${userId}/cv/${cvIndex}`
      : `/candidates/me/cv/${cvIndex}`;
    return this.apiClient.delete(endpoint);
  }

  // Đặt CV trong lịch sử làm current
  async setCurrent(
    cvIndex: number,
    userId?: string
  ): Promise<{ success: boolean; message?: string; current?: any }> {
    const endpoint = userId
      ? `/candidates/${userId}/cv/current/${cvIndex}`
      : `/candidates/me/cv/current/${cvIndex}`;
    return this.apiClient.put(endpoint);
  }

  // Đổi tên CV (current hoặc history)
  async renameCV(
    params: {
      scope: "current" | "history";
      index?: number;
      displayName: string;
    },
    userId?: string
  ): Promise<{ success: boolean; message?: string }> {
    const endpoint = userId
      ? `/candidates/${userId}/cv/rename`
      : "/candidates/me/cv/rename";
    return this.apiClient.put(endpoint, params);
  }

  // Xem CV trực tiếp - sử dụng proxy route để tránh CORS và security issues
  async getCVViewUrl(userId?: string): Promise<string> {
    if (userId) {
      // For other users, use direct backend endpoint
      const endpoint = `/candidates/${userId}/cv/view`;
      const url = `${this.apiClient.getBaseURL()}${endpoint}`;
      const headers: Record<string, string> = {};

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log("Fetching CV for user:", userId, "from URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else {
      // For current user, use frontend proxy route
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching CV via proxy route for current user");

      const response = await fetch(
        `/api/cv/view?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
        }
      );

      console.log("Proxy response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Proxy error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const blob = await response.blob();
      console.log("Blob created, size:", blob.size, "type:", blob.type);

      const objectUrl = URL.createObjectURL(blob);
      console.log("Object URL created:", objectUrl.substring(0, 50));

      return objectUrl;
    }
  }

  // Lấy phân tích AI của CV
  async getCVAnalysis(
    userId?: string
  ): Promise<{ success: boolean; data: any }> {
    const endpoint = userId
      ? `/candidates/${userId}/cv/analysis`
      : "/candidates/me/cv/analysis";
    return this.apiClient.get(endpoint);
  }

  // CV Builder Methods
  async getTemplates(
    category?: string,
    style?: string
  ): Promise<CVTemplatesResponse> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (style) params.append("style", style);

    const queryString = params.toString();
    const endpoint = `/candidates/me/cv-builder/templates${
      queryString ? `?${queryString}` : ""
    }`;
    return this.apiClient.get<CVTemplatesResponse>(endpoint);
  }

  async generateCV(data: {
    template: string;
    customization?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
      fonts?: {
        heading?: string;
        body?: string;
      };
      layout?: string;
    };
    sections?: string[];
    targetJob?: string;
    jobDescription?: string;
    companyInfo?: {
      name?: string;
      industry?: string;
    };
    format?: string;
    setAsCurrent?: boolean;
  }): Promise<{ success: boolean; data: { url: string; filename: string } }> {
    return this.apiClient.post("/candidates/me/cv-builder/generate", data);
  }

  async analyzeJob(data: {
    jobDescription: string;
    targetJob: string;
    companyInfo?: {
      name?: string;
      industry?: string;
      size?: string;
    };
  }): Promise<{
    success: boolean;
    data: { recommendations: any; matchAnalysis: any };
  }> {
    return this.apiClient.post("/candidates/me/cv-builder/analyze-job", data);
  }

  async exportPDF(data: {
    cvUrl: string;
    template: string;
    pdfOptions?: {
      format?: string;
      printBackground?: boolean;
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    };
    filename?: string;
  }): Promise<{
    success: boolean;
    data: { pdf: { url: string }; entry: any };
  }> {
    return this.apiClient.post("/candidates/me/cv-builder/export-pdf", data);
  }

  // Cập nhật profile
  async updateProfile(
    data: Partial<CandidateProfile>,
    userId?: string
  ): Promise<CandidateProfileResponse> {
    const endpoint = userId ? `/candidates/${userId}` : "/candidates/me";
    return this.apiClient.put<CandidateProfileResponse>(endpoint, data);
  }
}

export const candidateCVAPI = new CandidateCVApi();

// Main API object for easy import
export const api = {
  candidateCV: candidateCVAPI,
  jobs: jobsAPI,
  auth: authAPI,
  client: apiClient,
};
