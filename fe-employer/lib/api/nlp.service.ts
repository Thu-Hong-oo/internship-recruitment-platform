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
    return apiClient.get(
      `/nlp/top-candidates/${jobId}${query ? `?${query}` : ""}`,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
    );
  },
};

