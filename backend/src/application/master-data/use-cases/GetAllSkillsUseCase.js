/**
 * Get All Skills Use Case
 * Retrieves all skills with pagination and filtering
 */

class GetAllSkillsUseCase {
  constructor(skillRepository) {
    this.skillRepository = skillRepository;
  }

  async execute(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        level,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
      } = filters;

      // Build query
      const query = {};
      if (category) query.category = category;
      if (level) query.level = level;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { keywords: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [skills, total] = await Promise.all([
        this.skillRepository.find(query, { skip, limit, sort }),
        this.skillRepository.count(query),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          skills,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = GetAllSkillsUseCase;
