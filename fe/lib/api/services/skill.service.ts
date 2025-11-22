import { apiClient } from "../client";

export interface Skill {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  aliases?: string[];
  isActive?: boolean;
}

export interface SkillsResponse {
  success: boolean;
  data: Skill[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class SkillService {
  /**
   * Lấy danh sách các kỹ năng
   * @param page - Số trang
   * @param limit - Số lượng mỗi trang
   * @param search - Từ khóa tìm kiếm
   * @param category - Lọc theo danh mục
   * @returns Danh sách các kỹ năng
   */
  async getSkills(
    page = 1,
    limit = 50,
    search?: string,
    category?: string
  ): Promise<SkillsResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search) {
      query.set("search", search);
    }
    if (category) {
      query.set("category", category);
    }

    return apiClient.get<SkillsResponse>(`/skills?${query.toString()}`);
  }

  /**
   * Lấy danh sách tất cả kỹ năng (không phân trang)
   * @param search - Từ khóa tìm kiếm
   * @returns Danh sách các kỹ năng
   */
  async getAllSkills(search?: string): Promise<Skill[]> {
    const response = await this.getSkills(1, 1000, search);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }

  /**
   * Tìm kiếm kỹ năng theo từ khóa
   * @param query - Từ khóa tìm kiếm
   * @returns Danh sách các kỹ năng
   */
  async searchSkills(query: string): Promise<Skill[]> {
    const response = await this.getSkills(1, 50, query);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }
}

export const skillService = new SkillService();

