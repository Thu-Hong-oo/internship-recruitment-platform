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
    const endpoint = userId ? `/candidates/${userId}` : "/candidates/me/profile";
    return apiClient.get<CandidateProfileResponse>(endpoint);
  }

  // Lấy đầy đủ dữ liệu /candidates/me (bao gồm userId, personalInfo, progress...)
  async getMeRaw(): Promise<{
    success: boolean;
    message?: string;
    data: any;
    timestamp?: string;
    requestId?: string | null;
  }> {
    return apiClient.get(`/candidates/me/profile`);
  }

  // Lấy thông tin cơ bản để hiển thị tab Cá nhân (map từ /candidates/me)
  async getMeBasic(): Promise<{
    success: boolean;
    data: {
      fullName: string;
      phone: string;
      email: string;
      avatar?: string;
      dateOfBirth?: string;
      addressCountry?: string;
      isEmailVerified?: boolean;
    };
  }> {
    const res = await this.getMeRaw();
    const apiData = res?.data || {};
    const user = apiData.userId || {};
    const personalInfo = apiData.personalInfo || {};
    const address = personalInfo.address || {};

    return {
      success: Boolean(res?.success),
      data: {
        fullName: personalInfo.fullName || user.fullName || "",
        phone: personalInfo.phone || "",
        email: user.email || "",
        avatar: user.avatar,
        dateOfBirth: personalInfo.dateOfBirth,
        addressCountry: address.country,
        isEmailVerified: user.isEmailVerified,
      },
    };
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

  // Xóa CV theo ID ("current" hoặc ObjectId)
  async deleteCV(
    cvId: string,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const endpoint = userId
      ? `/candidates/${userId}/resume/${cvId}`
      : `/candidates/me/resume/${cvId}`;
    return apiClient.delete(endpoint);
  }

  // Đặt CV trong lịch sử làm current
  async setCurrent(
    cvId: string
    // userId?: string
  ): Promise<{ success: boolean; message?: string; current?: any }> {
    const endpoint = `/candidates/me/resume/set-current/${cvId}`;
    // const endpoint = userId
    //   ? `/candidates/${userId}/cv/current/${cvIndex}`
    //   : `/candidates/me/cv/current/${cvIndex}`;
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

  // Xem CV trực tiếp - gọi thẳng backend với Bearer token và trả về Object URL
  async getCVObjectUrl(cvId?: string): Promise<string> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token found");

    const base = apiClient.getBaseURL();
    const endpoint = cvId
      ? `${base}/candidates/me/resume/view/${cvId}`
      : `${base}/candidates/me/resume/view`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status} ${response.statusText} ${errorText}`.trim()
      );
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Helper: mở CV tab mới (current hoặc theo id)
  async openCVInNewTab(cvId?: string): Promise<void> {
    const objectUrl = await this.getCVObjectUrl(cvId);
    window.open(objectUrl, "_blank");
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
