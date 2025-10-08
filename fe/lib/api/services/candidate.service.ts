import { apiClient } from "../client";
import type {
  CandidateProfile,
  CandidateProfileResponse,
  CVResponse,
  CVTemplatesResponse,
} from "../types";

class CandidateService {
  // Lấy profile candidate
  async getProfile(userId?: string): Promise<CandidateProfileResponse> {
    const endpoint = userId ? `/candidates/${userId}` : "/candidates/me";
    return apiClient.get<CandidateProfileResponse>(endpoint);
  }

  // Lấy resume (current + history) với version=all
  async getResumesAll(): Promise<{
    success: boolean;
    data: { current?: any; history?: any[] } | any; // backend returns current when not all
    message: string;
  }> {
    return apiClient.get(`/candidates/me/resume?version=all`);
  }

  // Upload CV (without parsing)
  async uploadCV(formData: FormData, userId?: string): Promise<CVResponse> {
    const endpoint = userId
      ? `/candidates/${userId}/resume`
      : "/candidates/me/resume";
    // Add action to formData
    formData.append("action", "upload");
    return apiClient.post<CVResponse>(endpoint, formData);
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
    return apiClient.post<CVResponse>(endpoint, formData);
  }

  // Xóa CV khỏi lịch sử
  async deleteCV(
    cvIndex: number,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const endpoint = userId
      ? `/candidates/${userId}/cv/${cvIndex}`
      : `/candidates/me/cv/${cvIndex}`;
    return apiClient.delete(endpoint);
  }

  // Đặt CV trong lịch sử làm current
  async setCurrent(
    cvIndex: number,
    userId?: string
  ): Promise<{ success: boolean; message?: string; current?: any }> {
    const endpoint = userId
      ? `/candidates/${userId}/cv/current/${cvIndex}`
      : `/candidates/me/cv/current/${cvIndex}`;
    return apiClient.put(endpoint);
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
    return apiClient.put(endpoint, params);
  }

  // Xem CV trực tiếp - sử dụng proxy route để tránh CORS và security issues
  async getCVViewUrl(userId?: string): Promise<string> {
    if (userId) {
      // For other users, use direct backend endpoint
      const endpoint = `/candidates/${userId}/cv/view`;
      const url = `${apiClient.getBaseURL()}${endpoint}`;
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
    return apiClient.get(endpoint);
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
    return apiClient.get<CVTemplatesResponse>(endpoint);
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
    return apiClient.post("/candidates/me/cv-builder/generate", data);
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
    return apiClient.post("/candidates/me/cv-builder/analyze-job", data);
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
    return apiClient.post("/candidates/me/cv-builder/export-pdf", data);
  }

  // Cập nhật profile
  async updateProfile(
    data: Partial<CandidateProfile>,
    userId?: string
  ): Promise<CandidateProfileResponse> {
    const endpoint = userId ? `/candidates/${userId}` : "/candidates/me";
    return apiClient.put<CandidateProfileResponse>(endpoint, data);
  }
}

export const candidateService = new CandidateService();
