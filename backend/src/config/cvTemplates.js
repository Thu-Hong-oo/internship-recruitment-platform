// CV Templates cho thực tập sinh
const CV_TEMPLATES = {
  // Template cho sinh viên IT
  'student-tech': {
    name: 'Student Tech',
    description: 'Dành cho sinh viên IT, tập trung vào projects và skills',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'projects',
      'skills',
      'certifications',
    ],
    style: 'clean',
    color: '#2563eb',
  },

  // Template cho thực tập sinh business
  'internship-business': {
    name: 'Business Internship',
    description: 'Dành cho thực tập sinh kinh doanh, marketing',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'experience',
      'activities',
      'skills',
    ],
    style: 'professional',
    color: '#059669',
  },

  // Template đơn giản cho fresher
  'fresher-simple': {
    name: 'Fresher Simple',
    description: 'Template đơn giản cho người mới bắt đầu',
    sections: ['personalInfo', 'objective', 'education', 'skills', 'projects'],
    style: 'minimal',
    color: '#7c3aed',
  },

  // Template creative cho design
  'creative-design': {
    name: 'Creative Design',
    description: 'Dành cho sinh viên thiết kế, sáng tạo',
    sections: [
      'personalInfo',
      'portfolio',
      'education',
      'projects',
      'skills',
      'awards',
    ],
    style: 'creative',
    color: '#dc2626',
  },
};

// Smart content suggestions cho từng section
const CONTENT_SUGGESTIONS = {
  objective: {
    'student-tech': [
      'Sinh viên Công nghệ Thông tin năm {year} với đam mê phát triển phần mềm, tìm kiếm cơ hội thực tập để áp dụng kiến thức và học hỏi kinh nghiệm thực tế.',
      'Tôi là sinh viên chuyên ngành {major} với khả năng {topSkill}, mong muốn đóng góp cho đội ngũ phát triển sản phẩm và trải nghiệm thực tế về {targetField}.',
      'Sinh viên năm {year} với nền tảng vững về {topSkills}, tìm kiếm vị trí thực tập {targetRole} để phát triển kỹ năng và đóng góp giá trị cho công ty.',
    ],
    'internship-business': [
      'Sinh viên chuyên ngành {major} với khả năng {topSkill}, tìm kiếm cơ hội thực tập trong lĩnh vực {targetField} để phát triển kỹ năng và kinh nghiệm nghề nghiệp.',
      'Với tinh thần học hỏi và khả năng {topSkill}, tôi mong muốn đóng góp cho đội ngũ {targetDepartment} và học hỏi kinh nghiệm thực tế.',
      'Sinh viên năm {year} với đam mê {field}, tìm kiếm vị trí thực tập để áp dụng kiến thức lý thuyết vào thực tế và phát triển bản thân.',
    ],
  },

  skills: {
    technical: {
      'Lập trình': [
        'JavaScript',
        'Python',
        'Java',
        'C++',
        'HTML/CSS',
        'React',
        'Node.js',
      ],
      Database: ['MySQL', 'MongoDB', 'PostgreSQL', 'Firebase'],
      Tools: ['Git', 'VS Code', 'Docker', 'Postman', 'Figma'],
      Frameworks: ['React', 'Vue.js', 'Express.js', 'Spring Boot', 'Django'],
    },
    soft: [
      'Làm việc nhóm',
      'Giao tiếp',
      'Quản lý thời gian',
      'Tư duy logic',
      'Khả năng học hỏi',
      'Giải quyết vấn đề',
      'Thuyết trình',
      'Tiếng Anh',
    ],
  },

  projects: {
    'web-development': {
      'E-commerce Website':
        'Phát triển website bán hàng với tính năng giỏ hàng, thanh toán online sử dụng React và Node.js',
      'Task Management App':
        'Ứng dụng quản lý công việc với khả năng phân công, theo dõi tiến độ, sử dụng Vue.js và Firebase',
      'Blog Platform':
        'Nền tảng blog cá nhân với tính năng CRUD, authentication, sử dụng MERN stack',
    },
    'mobile-development': {
      'Food Delivery App':
        'Ứng dụng đặt đồ ăn với tính năng tìm kiếm, đặt hàng, tracking, phát triển bằng React Native',
      'Expense Tracker':
        'Ứng dụng quản lý chi tiêu cá nhân với biểu đồ thống kê, sử dụng Flutter',
      'Learning App':
        'Ứng dụng học tập trực tuyến với video, quiz, progress tracking',
    },
  },
};

// Industry-specific keywords
const INDUSTRY_KEYWORDS = {
  technology: [
    'software development',
    'programming',
    'algorithm',
    'data structure',
    'API',
    'database',
    'testing',
  ],
  business: [
    'analysis',
    'strategy',
    'communication',
    'presentation',
    'research',
    'planning',
    'coordination',
  ],
  marketing: [
    'social media',
    'content creation',
    'analytics',
    'campaign',
    'branding',
    'SEO',
    'digital marketing',
  ],
  design: [
    'UI/UX',
    'creative',
    'visual design',
    'prototyping',
    'user research',
    'design thinking',
    'Adobe Creative',
  ],
};

module.exports = {
  CV_TEMPLATES,
  CONTENT_SUGGESTIONS,
  INDUSTRY_KEYWORDS,
};
