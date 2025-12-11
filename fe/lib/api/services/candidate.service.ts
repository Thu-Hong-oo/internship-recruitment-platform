import { apiClient } from "../client";
// NEW-MOCK: imports for mock data (used only when NEXT_PUBLIC_USE_MOCK=1)
import { templates as MOCK_TEMPLATES } from "../../mocks/templates";
import { templateLayouts as MOCK_TEMPLATE_LAYOUTS } from "../../mocks/templateLayouts";
import {
  sampleCVs as MOCK_SAMPLE_CVS,
  type CVData as MockCVData,
} from "../../mocks/cvSamples";
import type {
  CandidateProfile,
  CandidateProfileResponse,
  CVResponse,
  CVTemplatesResponse,
  ApplicationsResponse,
} from "../types";

class CandidateService {
  // NEW-MOCK: toggle to decide using mock behavior
  private readonly useMock =
    typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    process.env.NEXT_PUBLIC_USE_MOCK === "1";

  // Lấy profile candidate
  async getProfile(userId?: string): Promise<CandidateProfileResponse> {
    const endpoint = userId ? `/candidates/${userId}` : "/candidates/me";
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
    return apiClient.get(`/candidates/me`);
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
      ? `/candidates/${userId}/resume?action=upload`
      : "/candidates/me/resume?action=upload";
    // Add action to formData as well (for multer to read from req.body)
    formData.append("action", "upload");
    return apiClient.post<CVResponse>(endpoint, formData);
  }

  // Upload and Parse CV (with AI parsing)
  async uploadAndParseCV(
    formData: FormData,
    userId?: string
  ): Promise<CVResponse> {
    const endpoint = userId
      ? `/candidates/${userId}/resume?action=parse`
      : "/candidates/me/resume?action=parse";
    // Add action to formData as well (for multer to read from req.body)
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
      id: string;
      displayName: string;
    },
    userId?: string
  ): Promise<{ success: boolean; message?: string }> {
    const endpoint = userId
      ? `/candidates/${userId}/cv/rename`
      : "/candidates/me/resume/rename";
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
  /**
   * Tạo CV mới từ template
   * @param templateId - ID của template (ví dụ: "modern", "student-tech")
   * @param setAsDefault - Có đặt làm CV mặc định không
   */
  async createCVFromTemplate(
    templateId: string,
    setAsDefault: boolean = false
  ): Promise<{
    success: boolean;
    data: {
      resume: any;
      template: {
        id: string;
        name: string;
        style: string;
        description: string;
      };
    };
    message?: string;
  }> {
    return apiClient.post("/candidates/me/cv-builder/create-from-template", {
      templateId,
      setAsDefault,
    });
  }

  /**
   * Lấy CV theo ID từ ResumeBuilder
   */
  async getResumeById(resumeId: string): Promise<{
    success: boolean;
    data: {
      resumeId: string;
      templateId: string | null;
      content: any;
      customization: any;
      isDefault: boolean;
      status: string;
    };
  }> {
    return apiClient.get(`/candidates/me/cv-builder/resume/${resumeId}`);
  }

  /**
   * Lấy CV mặc định hoặc mới nhất
   */
  async getDefaultResume(): Promise<{
    success: boolean;
    data: {
      resumeId: string | null;
      templateId: string | null;
      content: any;
      customization: any;
      isDefault: boolean;
      status: string;
    };
  }> {
    return apiClient.get("/candidates/me/cv-builder/default");
  }

  /**
   * Lấy thông tin chi tiết một template (bao gồm renderLayout)
   */
  async getTemplateById(templateId: string): Promise<{
    success: boolean;
    data: {
      id: string;
      name: string;
      description: string;
      customization: {
        colors: { primary: string; secondary: string; accent: string };
        fonts: { heading: string; body: string };
        layout: string;
      };
      renderLayout: {
        page: { width: number; height: number; padding: number; backgroundColor: string };
        sections: Array<{
          type: string;
          x: number;
          y: number;
          width: number;
          height: number;
          order: number;
        }>;
      } | null;
    };
  }> {
    return apiClient.get(`/candidates/me/cv-builder/template/${templateId}`);
  }

  /**
   * Lấy dữ liệu CV builder từ CandidateProfile
   */
  async getBuilderData(): Promise<{
    success: boolean;
    data: {
      personalInfo: any;
      targetJob: any;
      careerObjective: string;
      experience: any[];
      education: any[];
      skills: any;
      projects: any[];
      certifications: any[];
      awards: any[];
      languages: any[];
      hobbies: any[];
      references: any[];
    };
  }> {
    return apiClient.get("/candidates/me/cv-builder");
  }

  /**
   * Cập nhật dữ liệu CV builder
   */
  async updateBuilderData(data: {
    personalInfo?: any;
    targetJob?: any;
    careerObjective?: string;
    experience?: any[];
    education?: any[];
    skills?: any;
    projects?: any[];
    certifications?: any[];
    awards?: any[];
    languages?: any[];
    hobbies?: any[];
    references?: any[];
  }): Promise<{
    success: boolean;
    data: {
      message: string;
      completeness: number;
    };
  }> {
    return apiClient.put("/candidates/me/cv-builder", data);
  }

  /**
   * Cập nhật nội dung một ResumeBuilder (state riêng cho từng CV/template)
   * PUT /candidates/me/cv-builder/resume/:resumeId
   */
  async updateResumeBuilder(resumeId: string, payload: {
    content: any;
    customization?: any;
    createVersion?: boolean;
    status?: "draft" | "completed" | "archived";
  }): Promise<{
    success: boolean;
    data: {
      resumeId: string;
      templateId: string | null;
      content: any;
      customization: any;
      status: string;
      updatedAt: string;
    };
  }> {
    return apiClient.put(`/candidates/me/cv-builder/resume/${resumeId}`, payload);
  }

  /**
   * Lấy map templateId -> resumeId đã tạo trước đó
   */
  async getTemplateResumeMap(): Promise<{
    success: boolean;
    data: {
      map: Record<string, string>;
    };
  }> {
    return apiClient.get("/candidates/me/cv-builder/template-map");
  }

  /**
   * Upload avatar cho CV builder
   */
  async uploadAvatar(file: File): Promise<{
    success: boolean;
    data: {
      avatar: {
        publicId: string;
        url: string;
        size: number;
        format: string;
        dimensions: { width: number; height: number };
      };
    };
    message?: string;
  }> {
    const formData = new FormData();
    formData.append("avatar", file);
    // Không set Content-Type header, để browser tự động set với boundary
    return apiClient.post("/candidates/me/cv-builder/avatar", formData);
  }

  async getTemplates(
    category?: string,
    style?: string
  ): Promise<CVTemplatesResponse> {
    // NEW-MOCK: return mock templates when mock mode is enabled
    if (this.useMock) {
      return Promise.resolve({
        success: true,
        data: {
          items: MOCK_TEMPLATES.map((t) => ({
            id: String(t.id),
            name: t.name,
            thumbnail: t.thumbnail,
          })),
        },
        message: "mock",
      } as unknown as CVTemplatesResponse);
    }
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (style) params.append("style", style);

    const queryString = params.toString();
    const endpoint = `/candidates/me/cv-builder/templates${
      queryString ? `?${queryString}` : ""
    }`;
    return apiClient.get<CVTemplatesResponse>(endpoint);
  }

  // NEW-MOCK: get a template layout by templateId (mock only). Backend endpoint
  // may differ later; replace implementation when BE is ready.
  async getTemplateLayout(templateId: number): Promise<{
    success: boolean;
    data: any;
  }> {
    if (this.useMock) {
      return Promise.resolve({
        success: true,
        data: MOCK_TEMPLATE_LAYOUTS[templateId],
      });
    }
    // Placeholder: adjust once backend route is specified
    // return apiClient.get(`/candidates/me/cv-builder/templates/${templateId}/layout`);
    return Promise.resolve({
      success: true,
      data: MOCK_TEMPLATE_LAYOUTS[templateId],
    });
  }

  // NEW-MOCK: Local CV helpers for mock-only CRUD using localStorage.
  // Replace with real endpoints later when backend is ready.
  private readonly LOCAL_KEY = "cv_items";
  private readLocalCVs(): MockCVData[] {
    if (typeof window === "undefined") return MOCK_SAMPLE_CVS;
    const raw = localStorage.getItem(this.LOCAL_KEY);
    if (!raw) return MOCK_SAMPLE_CVS;
    try {
      return JSON.parse(raw) as MockCVData[];
    } catch {
      return MOCK_SAMPLE_CVS;
    }
  }
  private writeLocalCVs(items: MockCVData[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.LOCAL_KEY, JSON.stringify(items));
  }
  async listLocalCVs(): Promise<{ success: boolean; data: MockCVData[] }> {
    if (!this.useMock) {
      // Optional: map to real list endpoint later
      // return apiClient.get(`/candidates/me/cv-builder/cv`);
    }
    const data = this.readLocalCVs();
    return { success: true, data };
  }
  async getLocalCV(
    index: number
  ): Promise<{ success: boolean; data?: MockCVData }> {
    const data = this.readLocalCVs();
    return { success: true, data: data[index] };
  }
  async createLocalCV(
    cv: MockCVData
  ): Promise<{ success: boolean; id: number }> {
    const data = this.readLocalCVs();
    data.push(cv);
    this.writeLocalCVs(data);
    return { success: true, id: data.length - 1 };
  }
  async updateLocalCV(
    index: number,
    cv: MockCVData
  ): Promise<{ success: boolean }> {
    const data = this.readLocalCVs();
    data[index] = cv;
    this.writeLocalCVs(data);
    return { success: true };
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
  async updateProfile(data: {
    section: "profile";
    data: {
      personalInfo?: {
        fullName?: string;
        phone?: string;
        bio?: string;
        address?: {
          street?: string;
          ward?: string;
          district?: string;
          city?: string;
          country?: string;
        };
      };
    };
  }): Promise<CandidateProfileResponse> {
    return apiClient.patch<CandidateProfileResponse>("/candidates/me", data);
  }

  /**
   * Lấy danh sách các đơn ứng tuyển của candidate
   * @param params - Query parameters (page, limit, status, etc.)
   * @returns Danh sách applications với pagination
   */
  async getApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApplicationsResponse> {
    const query = new URLSearchParams();
    if (params?.page) {
      query.set("page", String(params.page));
    }
    if (params?.limit) {
      query.set("limit", String(params.limit));
    }
    if (params?.status) {
      query.set("status", params.status);
    }

    const endpoint = `/candidates/applications${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<ApplicationsResponse>(endpoint);
  }

  /**
   * Lấy thống kê số lượng đơn ứng tuyển theo status của ứng viên hiện tại
   * GET /candidates/applications/status
   */
  async getApplicationStatusStats(params?: {
    from?: string;
    to?: string;
  }): Promise<import("../types").ApplicationStatusStatsResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const endpoint = `/candidates/applications/status${
      query.toString() ? `?${query.toString()}` : ""
    }`;
    return apiClient.get(endpoint);
  }
}

export const candidateService = new CandidateService();
