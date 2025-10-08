import {
  ApiResponse,
  ProfileData,
  EducationResponse,
  ExperienceResponse,
  SkillsResponse,
  EducationFormData,
  ExperienceFormData,
  ProjectFormData,
  SkillFormData,
} from "@/lib/types/profile";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ProfileAPI {
  private requestQueue: Promise<any>[] = [];
  private isProcessing = false;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Add to queue to prevent concurrent requests
    return new Promise((resolve, reject) => {
      this.requestQueue.push(
        this.processRequest(endpoint, options, resolve, reject)
      );
      this.processQueue();
    });
  }

  private async processRequest<T>(
    endpoint: string,
    options: RequestInit,
    resolve: (value: ApiResponse<T>) => void,
    reject: (reason?: any) => void
  ) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded, wait and retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
          throw new Error(`Rate limit exceeded. Please try again later.`);
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      resolve(data);
    } catch (error) {
      reject(error);
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request;
        // Add small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  // Profile Management
  async getProfile(include?: string[]): Promise<ApiResponse<ProfileData>> {
    const query = include?.length ? `?include=${include.join(",")}` : "";
    return this.request<ProfileData>(`/api/candidates/me${query}`);
  }

  async updateProfile(
    section: string,
    data: any
  ): Promise<ApiResponse<ProfileData>> {
    return this.request<ProfileData>("/api/candidates/me", {
      method: "PATCH",
      body: JSON.stringify({ section, data }),
    });
  }

  // Education Management
  async getEducation(): Promise<ApiResponse<EducationResponse>> {
    return this.request<EducationResponse>("/api/candidates/me/education");
  }

  async addEducation(
    data: EducationFormData
  ): Promise<ApiResponse<EducationResponse>> {
    return this.request<EducationResponse>("/api/candidates/me/education", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEducation(
    id: string,
    data: Partial<EducationFormData>
  ): Promise<ApiResponse<EducationResponse>> {
    return this.request<EducationResponse>(
      `/api/candidates/me/education/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteEducation(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      `/api/candidates/me/education/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  // Experience Management
  async getExperience(): Promise<ApiResponse<ExperienceResponse>> {
    return this.request<ExperienceResponse>("/api/candidates/me/experience");
  }

  async addExperience(
    data: ExperienceFormData
  ): Promise<ApiResponse<ExperienceResponse>> {
    return this.request<ExperienceResponse>("/api/candidates/me/experience", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateExperience(
    id: string,
    data: Partial<ExperienceFormData>
  ): Promise<ApiResponse<ExperienceResponse>> {
    return this.request<ExperienceResponse>(
      `/api/candidates/me/experience/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteExperience(
    id: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      `/api/candidates/me/experience/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  // Skills Management
  async getSkills(): Promise<ApiResponse<SkillsResponse>> {
    return this.request<SkillsResponse>("/api/candidates/me/skills");
  }

  async addSkill(data: SkillFormData): Promise<ApiResponse<SkillsResponse>> {
    return this.request<SkillsResponse>("/api/candidates/me/skills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSkill(
    id: string,
    data: Partial<SkillFormData>
  ): Promise<ApiResponse<SkillsResponse>> {
    return this.request<SkillsResponse>(`/api/candidates/me/skills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSkill(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      `/api/candidates/me/skills/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  // Visibility Settings
  async updateVisibility(settings: {
    profileVisibility: "public" | "private" | "connections";
    showEmail: boolean;
    showPhone: boolean;
  }): Promise<ApiResponse<ProfileData>> {
    return this.updateProfile("visibility", settings);
  }

  // Preferences
  async updatePreferences(preferences: {
    locations: string[];
    internshipTypes: string[];
    industries: string[];
    targetRoles: string[];
  }): Promise<ApiResponse<ProfileData>> {
    return this.updateProfile("preferences", preferences);
  }
}

export const profileAPI = new ProfileAPI();
