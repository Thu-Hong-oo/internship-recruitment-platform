/**
 * Get Skill Categories Use Case
 * Retrieves all available skill categories with statistics
 */

class GetSkillCategoriesUseCase {
  constructor(skillRepository) {
    this.skillRepository = skillRepository;
  }

  async execute() {
    try {
      // Get category statistics
      const categoryStats = await this.skillRepository.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' },
            avgUsage: { $avg: '$usageCount' },
            trending: { $sum: { $cond: ['$trending', 1, 0] } },
            levels: { $addToSet: '$level' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Enhance with category metadata
      const categoriesWithMetadata = categoryStats.map(stat => ({
        id: stat._id,
        name: stat._id,
        displayName: this._getCategoryDisplayName(stat._id),
        description: this._getCategoryDescription(stat._id),
        icon: this._getCategoryIcon(stat._id),
        color: this._getCategoryColor(stat._id),
        count: stat.count,
        totalUsage: stat.totalUsage || 0,
        avgUsage: Math.round(stat.avgUsage || 0),
        trendingCount: stat.trending || 0,
        levels: stat.levels || [],
        popularity: this._calculatePopularity(stat.count, stat.totalUsage),
      }));

      // Sort by popularity
      const sortedCategories = categoriesWithMetadata.sort(
        (a, b) => b.popularity - a.popularity
      );

      return {
        success: true,
        data: {
          categories: sortedCategories,
          totalCategories: sortedCategories.length,
          totalSkills: sortedCategories.reduce(
            (sum, cat) => sum + cat.count,
            0
          ),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _getCategoryDisplayName(category) {
    const displayNames = {
      programming: 'Programming & Development',
      design: 'Design & Creative',
      marketing: 'Marketing & Sales',
      data: 'Data & Analytics',
      business: 'Business & Management',
      communication: 'Communication',
      'project-management': 'Project Management',
      finance: 'Finance & Accounting',
      sales: 'Sales',
      'customer-service': 'Customer Service',
      education: 'Education & Training',
      healthcare: 'Healthcare',
      engineering: 'Engineering',
      research: 'Research & Development',
      writing: 'Writing & Content',
      languages: 'Languages',
      other: 'Other Skills',
    };

    return (
      displayNames[category] ||
      category.charAt(0).toUpperCase() + category.slice(1)
    );
  }

  _getCategoryDescription(category) {
    const descriptions = {
      programming:
        'Software development, coding languages, frameworks, and technical skills',
      design: 'Visual design, UX/UI, graphic design, and creative skills',
      marketing:
        'Digital marketing, advertising, branding, and promotion skills',
      data: 'Data analysis, statistics, business intelligence, and data science',
      business: 'Business strategy, operations, leadership, and management',
      communication:
        'Presentation, writing, interpersonal, and communication skills',
      'project-management':
        'Project planning, coordination, Agile, and organizational skills',
      finance:
        'Financial analysis, accounting, budgeting, and monetary management',
      sales: 'Sales techniques, customer acquisition, and revenue generation',
      'customer-service':
        'Customer support, relationship management, and service skills',
      education:
        'Teaching, training, curriculum development, and educational skills',
      healthcare:
        'Medical, nursing, healthcare administration, and wellness skills',
      engineering:
        'Technical engineering, design, manufacturing, and technical skills',
      research:
        'Research methodology, analysis, development, and investigation skills',
      writing:
        'Content creation, copywriting, editing, and written communication',
      languages: 'Foreign languages, translation, and linguistic skills',
      other: "Miscellaneous skills that don't fit other categories",
    };

    return descriptions[category] || 'Skills in this category';
  }

  _getCategoryIcon(category) {
    const icons = {
      programming: 'code',
      design: 'palette',
      marketing: 'megaphone',
      data: 'chart-bar',
      business: 'briefcase',
      communication: 'comments',
      'project-management': 'tasks',
      finance: 'dollar-sign',
      sales: 'handshake',
      'customer-service': 'headset',
      education: 'graduation-cap',
      healthcare: 'heartbeat',
      engineering: 'cogs',
      research: 'search',
      writing: 'pen',
      languages: 'globe',
      other: 'ellipsis-h',
    };

    return icons[category] || 'tag';
  }

  _getCategoryColor(category) {
    const colors = {
      programming: '#3B82F6',
      design: '#F59E0B',
      marketing: '#EF4444',
      data: '#10B981',
      business: '#6366F1',
      communication: '#8B5CF6',
      'project-management': '#F97316',
      finance: '#059669',
      sales: '#DC2626',
      'customer-service': '#7C3AED',
      education: '#0891B2',
      healthcare: '#BE123C',
      engineering: '#4B5563',
      research: '#7C2D12',
      writing: '#1F2937',
      languages: '#047857',
      other: '#6B7280',
    };

    return colors[category] || '#6B7280';
  }

  _calculatePopularity(count, totalUsage) {
    // Weighted popularity score combining skill count and usage
    const countWeight = 0.3;
    const usageWeight = 0.7;

    return Math.round(
      count * countWeight + ((totalUsage || 0) * usageWeight) / 100
    );
  }
}

module.exports = GetSkillCategoriesUseCase;
