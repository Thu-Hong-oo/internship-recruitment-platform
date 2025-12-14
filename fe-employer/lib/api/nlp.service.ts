import { apiClient } from "./apiClient";
import { getToken } from "@/lib/userStorage";

export const nlpService = {
  /**
   * Get top matching candidates for a job (Employer only)
   */
  async getTopCandidates(
    jobId: string,
    params?: {
      limit?: number;
      minScore?: number;
      tier?: "top" | "good" | "potential";
      noCache?: boolean;
    }
  ): Promise<{
    success: boolean;
    message?: string;
    data: any[];
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.minScore)
      queryParams.append("minScore", params.minScore.toString());
    if (params?.tier) queryParams.append("tier", params.tier);
    if (params?.noCache) queryParams.append("noCache", "true");

    const query = queryParams.toString();
    const token = getToken();
    const response = await apiClient.get(
      `/nlp/top-candidates/${jobId}${query ? `?${query}` : ""}`,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
    );
    return response.data;
  },

  /**
   * Invite candidate to apply for a job (Employer only)
   */
  async inviteCandidate(
    jobId: string,
    candidateId: string,
    message?: string
  ): Promise<{
    success: boolean;
    message?: string;
    data?: {
      candidateEmail: string;
      candidateName: string;
      jobTitle: string;
      notificationSent: boolean;
      sentAt: string;
    };
    error?: string;
  }> {
    const token = getToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập lại");
    }

    const response = await apiClient.post(
      `/nlp/top-candidates/${jobId}/invite`,
      {
        candidateId,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },
};

