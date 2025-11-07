/**
 * Seed script for Skills and Industries
 * Run: node scripts/seedSkillsAndIndustries.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../src/infrastructure/models/Skill');
const Industry = require('../src/infrastructure/models/Industry');

// Sample Industries Data
const industries = [
  {
    code: 'tech',
    parentCode: null,
    name: {
      vi: 'Công nghệ thông tin',
      en: 'Information Technology',
    },
    description: {
      vi: 'Ngành công nghệ thông tin và phần mềm',
      en: 'Information technology and software industry',
    },
    keywords: ['IT', 'technology', 'software', 'công nghệ'],
    color: '#3b82f6',
    icon: 'computer',
    visible: true,
    sortOrder: 1,
  },
  {
    code: 'tech-software',
    parentCode: 'tech',
    name: {
      vi: 'Phát triển Phần mềm',
      en: 'Software Development',
    },
    description: {
      vi: 'Ngành phát triển phần mềm và ứng dụng',
      en: 'Software and application development industry',
    },
    keywords: ['software', 'programming', 'development', 'lập trình'],
    color: '#3b82f6',
    icon: 'code',
    visible: true,
    sortOrder: 2,
  },
  {
    code: 'tech-frontend',
    parentCode: 'tech-software',
    name: {
      vi: 'Frontend Development',
      en: 'Frontend Development',
    },
    description: {
      vi: 'Phát triển giao diện người dùng',
      en: 'User interface development',
    },
    keywords: ['frontend', 'UI', 'web', 'giao diện'],
    color: '#06b6d4',
    icon: 'palette',
    visible: true,
    sortOrder: 3,
  },
  {
    code: 'tech-backend',
    parentCode: 'tech-software',
    name: {
      vi: 'Backend Development',
      en: 'Backend Development',
    },
    description: {
      vi: 'Phát triển server và hệ thống backend',
      en: 'Server and backend system development',
    },
    keywords: ['backend', 'server', 'API', 'database'],
    color: '#8b5cf6',
    icon: 'server',
    visible: true,
    sortOrder: 4,
  },
  {
    code: 'design',
    parentCode: null,
    name: {
      vi: 'Thiết kế',
      en: 'Design',
    },
    description: {
      vi: 'Thiết kế đồ họa và sáng tạo',
      en: 'Graphic design and creative',
    },
    keywords: ['design', 'graphic', 'creative', 'thiết kế'],
    color: '#ec4899',
    icon: 'brush',
    visible: true,
    sortOrder: 5,
  },
  {
    code: 'marketing',
    parentCode: null,
    name: {
      vi: 'Marketing',
      en: 'Marketing',
    },
    description: {
      vi: 'Marketing và truyền thông',
      en: 'Marketing and communications',
    },
    keywords: ['marketing', 'communications', 'digital', 'quảng cáo'],
    color: '#f59e0b',
    icon: 'megaphone',
    visible: true,
    sortOrder: 6,
  },
];

// Sample Skills Data
const skills = [
  // Frontend Skills
  {
    code: 'javascript',
    name: {
      vi: 'JavaScript',
      en: 'JavaScript',
    },
    description: {
      vi: 'Ngôn ngữ lập trình web phổ biến',
      en: 'Popular web programming language',
    },
    category: 'frontend',
    level: 'intermediate',
    keywords: ['javascript', 'js', 'programming', 'web'],
    relatedSkills: ['typescript', 'react', 'nodejs'],
    visible: true,
    verified: true,
    sortOrder: 1,
  },
  {
    code: 'react',
    name: {
      vi: 'React',
      en: 'React',
    },
    description: {
      vi: 'Thư viện JavaScript để xây dựng UI',
      en: 'JavaScript library for building user interfaces',
    },
    category: 'frontend',
    level: 'intermediate',
    keywords: ['react', 'reactjs', 'frontend', 'ui'],
    relatedSkills: ['javascript', 'typescript', 'redux'],
    visible: true,
    verified: true,
    sortOrder: 2,
  },
  {
    code: 'typescript',
    name: {
      vi: 'TypeScript',
      en: 'TypeScript',
    },
    description: {
      vi: 'JavaScript với kiểu dữ liệu tĩnh',
      en: 'JavaScript with static typing',
    },
    category: 'frontend',
    level: 'advanced',
    keywords: ['typescript', 'ts', 'typed', 'javascript'],
    relatedSkills: ['javascript', 'react', 'angular'],
    visible: true,
    verified: true,
    sortOrder: 3,
  },
  {
    code: 'html',
    name: {
      vi: 'HTML',
      en: 'HTML',
    },
    description: {
      vi: 'Ngôn ngữ đánh dấu siêu văn bản',
      en: 'HyperText Markup Language',
    },
    category: 'frontend',
    level: 'beginner',
    keywords: ['html', 'markup', 'web'],
    relatedSkills: ['css', 'javascript'],
    visible: true,
    verified: true,
    sortOrder: 4,
  },
  {
    code: 'css',
    name: {
      vi: 'CSS',
      en: 'CSS',
    },
    description: {
      vi: 'Cascading Style Sheets',
      en: 'Cascading Style Sheets',
    },
    category: 'frontend',
    level: 'beginner',
    keywords: ['css', 'styling', 'design'],
    relatedSkills: ['html', 'sass', 'tailwind'],
    visible: true,
    verified: true,
    sortOrder: 5,
  },

  // Backend Skills
  {
    code: 'nodejs',
    name: {
      vi: 'Node.js',
      en: 'Node.js',
    },
    description: {
      vi: 'JavaScript runtime cho backend',
      en: 'JavaScript runtime for backend',
    },
    category: 'backend',
    level: 'intermediate',
    keywords: ['nodejs', 'javascript', 'backend', 'server'],
    relatedSkills: ['javascript', 'express', 'mongodb'],
    visible: true,
    verified: true,
    sortOrder: 6,
  },
  {
    code: 'python',
    name: {
      vi: 'Python',
      en: 'Python',
    },
    description: {
      vi: 'Ngôn ngữ lập trình đa năng',
      en: 'General-purpose programming language',
    },
    category: 'backend',
    level: 'intermediate',
    keywords: ['python', 'programming', 'backend'],
    relatedSkills: ['django', 'flask', 'fastapi'],
    visible: true,
    verified: true,
    sortOrder: 7,
  },
  {
    code: 'java',
    name: {
      vi: 'Java',
      en: 'Java',
    },
    description: {
      vi: 'Ngôn ngữ lập trình hướng đối tượng',
      en: 'Object-oriented programming language',
    },
    category: 'backend',
    level: 'intermediate',
    keywords: ['java', 'programming', 'backend', 'spring'],
    relatedSkills: ['spring', 'kotlin', 'maven'],
    visible: true,
    verified: true,
    sortOrder: 8,
  },

  // Database Skills
  {
    code: 'mongodb',
    name: {
      vi: 'MongoDB',
      en: 'MongoDB',
    },
    description: {
      vi: 'Cơ sở dữ liệu NoSQL',
      en: 'NoSQL database',
    },
    category: 'database',
    level: 'intermediate',
    keywords: ['mongodb', 'nosql', 'database'],
    relatedSkills: ['nodejs', 'mongoose'],
    visible: true,
    verified: true,
    sortOrder: 9,
  },
  {
    code: 'postgresql',
    name: {
      vi: 'PostgreSQL',
      en: 'PostgreSQL',
    },
    description: {
      vi: 'Cơ sở dữ liệu quan hệ',
      en: 'Relational database',
    },
    category: 'database',
    level: 'intermediate',
    keywords: ['postgresql', 'sql', 'database', 'relational'],
    relatedSkills: ['sql', 'mysql'],
    visible: true,
    verified: true,
    sortOrder: 10,
  },

  // Design Skills
  {
    code: 'figma',
    name: {
      vi: 'Figma',
      en: 'Figma',
    },
    description: {
      vi: 'Công cụ thiết kế giao diện',
      en: 'Interface design tool',
    },
    category: 'design',
    level: 'intermediate',
    keywords: ['figma', 'design', 'ui', 'ux'],
    relatedSkills: ['sketch', 'adobe-xd'],
    visible: true,
    verified: true,
    sortOrder: 11,
  },
  {
    code: 'photoshop',
    name: {
      vi: 'Adobe Photoshop',
      en: 'Adobe Photoshop',
    },
    description: {
      vi: 'Phần mềm chỉnh sửa ảnh chuyên nghiệp',
      en: 'Professional photo editing software',
    },
    category: 'design',
    level: 'intermediate',
    keywords: ['photoshop', 'adobe', 'design', 'photo'],
    relatedSkills: ['illustrator', 'design'],
    visible: true,
    verified: true,
    sortOrder: 12,
  },
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Industry.deleteMany({});
    await Skill.deleteMany({});
    console.log('✅ Cleared existing data');

    // Seed Industries
    console.log('🌱 Seeding industries...');
    const createdIndustries = await Industry.insertMany(industries);
    console.log(`✅ Created ${createdIndustries.length} industries`);

    // Seed Skills
    console.log('🌱 Seeding skills...');
    const createdSkills = await Skill.insertMany(skills);
    console.log(`✅ Created ${createdSkills.length} skills`);

    console.log('\n📊 Seed Summary:');
    console.log(`   - Industries: ${createdIndustries.length}`);
    console.log(`   - Skills: ${createdSkills.length}`);
    console.log('\n✨ Seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedData();
