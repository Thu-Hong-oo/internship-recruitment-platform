import { apiClient } from "./apiClient";

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

    const query = queryParams.toString();
    return apiClient.get(
      `/nlp/top-candidates/${jobId}${query ? `?${query}` : ""}`
    );
  },
};

