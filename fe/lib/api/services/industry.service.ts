import { apiClient } from "../client";
import type { IndustriesResponse, Industry } from "../types";

class IndustryService {
  /**
   * Lấy danh sách các ngành nghề
   * @param parent - Mã ngành nghề cha (ví dụ: "root" để lấy các ngành nghề gốc)
   * @param q - Từ khóa tìm kiếm
   * @returns Danh sách các ngành nghề
   */
  async getIndustries(
    parent?: string,
    q?: string
  ): Promise<IndustriesResponse> {
    const query = new URLSearchParams();
    if (parent) {
      query.set("parent", parent);
    }
    if (q) {
      query.set("q", q);
    }

    const endpoint = `/industries${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<IndustriesResponse>(endpoint);
  }

  /**
   * Lấy danh sách các ngành nghề gốc (parent = root)
   * @returns Danh sách các ngành nghề gốc
   */
  async getRootIndustries(): Promise<Industry[]> {
    const response = await this.getIndustries("root");
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }

  /**
   * Tìm kiếm industries theo từ khóa
   * @param query - Từ khóa tìm kiếm
   * @returns Danh sách các ngành nghề
   */
  async searchIndustries(query: string): Promise<Industry[]> {
    const response = await this.getIndustries(undefined, query);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }
}

export const industryService = new IndustryService();

