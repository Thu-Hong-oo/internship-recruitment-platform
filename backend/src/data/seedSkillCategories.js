const mongoose = require('mongoose');
const SkillCategory = require('../models/SkillCategory');
require('dotenv').config();

const skillCategories = [
  // Root categories
  {
    name: 'Programming',
    slug: 'programming',
    description: 'Kỹ năng lập trình và phát triển phần mềm',
    icon: '💻',
    color: '#3B82F6',
    sortOrder: 1,
    metadata: {
      demandLevel: 'critical',
      trendDirection: 'growing',
    },
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'Kỹ năng thiết kế UI/UX, graphic design',
    icon: '🎨',
    color: '#EC4899',
    sortOrder: 2,
    metadata: {
      demandLevel: 'high',
      trendDirection: 'growing',
    },
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Kỹ năng kinh doanh và quản lý',
    icon: '💼',
    color: '#10B981',
    sortOrder: 3,
    metadata: {
      demandLevel: 'high',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Soft Skills',
    slug: 'soft-skills',
    description: 'Kỹ năng mềm và giao tiếp',
    icon: '🤝',
    color: '#8B5CF6',
    sortOrder: 4,
    metadata: {
      demandLevel: 'critical',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Kỹ năng marketing và quảng cáo',
    icon: '📈',
    color: '#F59E0B',
    sortOrder: 5,
    metadata: {
      demandLevel: 'high',
      trendDirection: 'growing',
    },
  },
  {
    name: 'Data',
    slug: 'data',
    description: 'Kỹ năng phân tích dữ liệu và khoa học dữ liệu',
    icon: '📊',
    color: '#06B6D4',
    sortOrder: 6,
    metadata: {
      demandLevel: 'critical',
      trendDirection: 'growing',
    },
  },
  {
    name: 'DevOps',
    slug: 'devops',
    description: 'Kỹ năng DevOps và infrastructure',
    icon: '⚙️',
    color: '#EF4444',
    sortOrder: 7,
    metadata: {
      demandLevel: 'high',
      trendDirection: 'growing',
    },
  },
  {
    name: 'Mobile',
    slug: 'mobile',
    description: 'Kỹ năng phát triển ứng dụng di động',
    icon: '📱',
    color: '#84CC16',
    sortOrder: 8,
    metadata: {
      demandLevel: 'medium',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Web',
    slug: 'web',
    description: 'Kỹ năng phát triển web',
    icon: '🌐',
    color: '#F97316',
    sortOrder: 9,
    metadata: {
      demandLevel: 'critical',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Finance',
    slug: 'finance',
    description: 'Kỹ năng tài chính và kế toán',
    icon: '💰',
    color: '#22C55E',
    sortOrder: 10,
    metadata: {
      demandLevel: 'medium',
      trendDirection: 'stable',
    },
  },
  {
    name: 'HR',
    slug: 'hr',
    description: 'Kỹ năng nhân sự và quản lý con người',
    icon: '👥',
    color: '#A855F7',
    sortOrder: 11,
    metadata: {
      demandLevel: 'medium',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Sales',
    slug: 'sales',
    description: 'Kỹ năng bán hàng và kinh doanh',
    icon: '🛒',
    color: '#EAB308',
    sortOrder: 12,
    metadata: {
      demandLevel: 'high',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Content',
    slug: 'content',
    description: 'Kỹ năng sáng tạo nội dung và viết lách',
    icon: '✍️',
    color: '#14B8A6',
    sortOrder: 13,
    metadata: {
      demandLevel: 'medium',
      trendDirection: 'growing',
    },
  },
  {
    name: 'Analytics',
    slug: 'analytics',
    description: 'Kỹ năng phân tích và báo cáo',
    icon: '📈',
    color: '#6366F1',
    sortOrder: 14,
    metadata: {
      demandLevel: 'high',
      trendDirection: 'growing',
    },
  },
  {
    name: 'Security',
    slug: 'security',
    description: 'Kỹ năng bảo mật và cybersecurity',
    icon: '🔒',
    color: '#DC2626',
    sortOrder: 15,
    metadata: {
      demandLevel: 'critical',
      trendDirection: 'growing',
    },
  },
  {
    name: 'Cloud',
    slug: 'cloud',
    description: 'Kỹ năng cloud computing và AWS/Azure',
    icon: '☁️',
    color: '#0EA5E9',
    sortOrder: 16,
    metadata: {
      demandLevel: 'critical',
      trendDirection: 'growing',
    },
  },
  {
    name: 'AI/ML',
    slug: 'ai-ml',
    description: 'Kỹ năng trí tuệ nhân tạo và machine learning',
    icon: '🤖',
    color: '#7C3AED',
    sortOrder: 17,
    metadata: {
      demandLevel: 'critical',
      trendDirection: 'emerging',
    },
  },
  {
    name: 'Blockchain',
    slug: 'blockchain',
    description: 'Kỹ năng blockchain và cryptocurrency',
    icon: '⛓️',
    color: '#059669',
    sortOrder: 18,
    metadata: {
      demandLevel: 'medium',
      trendDirection: 'emerging',
    },
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Kỹ năng phát triển game',
    icon: '🎮',
    color: '#DB2777',
    sortOrder: 19,
    metadata: {
      demandLevel: 'medium',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Technical',
    slug: 'technical',
    description: 'Kỹ năng kỹ thuật chuyên môn',
    icon: '🔧',
    color: '#6B7280',
    sortOrder: 20,
    metadata: {
      demandLevel: 'high',
      trendDirection: 'stable',
    },
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Các kỹ năng khác',
    icon: '📋',
    color: '#9CA3AF',
    sortOrder: 21,
    metadata: {
      demandLevel: 'low',
      trendDirection: 'stable',
    },
  },
];

const seedSkillCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await SkillCategory.deleteMany({});
    console.log('Cleared existing skill categories');

    // Insert new categories
    const createdCategories = await SkillCategory.insertMany(skillCategories);
    console.log(`Created ${createdCategories.length} skill categories`);

    // Update statistics
    for (const category of createdCategories) {
      await category.updateSkillCount();
      await category.updateJobCount();
    }
    console.log('Updated category statistics');

    console.log('✅ Skill categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding skill categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  seedSkillCategories();
}

module.exports = seedSkillCategories;

