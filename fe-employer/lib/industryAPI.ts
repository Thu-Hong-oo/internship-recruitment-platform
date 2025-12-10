const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface IndustryName {
  vi: string;
  en: string;
}

export interface Industry {
  _id: string;
  name: IndustryName;
  code: string;
  parentCode: string | null;
  [key: string]: any;
}

export interface IndustriesResponse {
  success: boolean;
  data: Industry[];
  message?: string;
  error?: string;
}

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
    try {
      const query = new URLSearchParams();
      if (parent) {
        query.set("parent", parent);
      }
      if (q) {
        query.set("q", q);
      }

      const endpoint = `/industries${query.toString() ? `?${query.toString()}` : ""}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return (await response.json()) as IndustriesResponse;
    } catch (e) {
      return { success: false, data: [], error: "Không thể kết nối máy chủ" };
    }
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
   * Lấy danh sách các ngành nghề con dựa trên parentCode
   * @param parentCode - Mã ngành nghề cha
   * @returns Danh sách các ngành nghề con
   */
  async getSubIndustries(parentCode: string): Promise<Industry[]> {
    const response = await this.getIndustries(parentCode);
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





















































