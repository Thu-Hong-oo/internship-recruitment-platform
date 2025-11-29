// CV Templates cho thực tập sinh và sinh viên
const CV_TEMPLATES = {
  // Template Modern - Phổ biến nhất
  modern: {
    name: 'Modern',
    description: 'Template hiện đại, phù hợp với mọi ngành nghề',
    sections: [
      'personalInfo',
      'careerObjective',
      'experience',
      'education',
      'skills',
      'projects',
    ],
    style: 'modern',
    color: '#2563eb',
    industryCode: 'general',
    preview: {
      image: '/templates/previews/modern-preview.jpg',
      thumbnail: '/templates/previews/modern-thumb.jpg',
      description:
        'Template hiện đại với layout 2 cột, màu xanh dương chuyên nghiệp',
    },
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#10b981',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      layout: 'two-column',
    },
    // Layout configuration cho rendering - định nghĩa vị trí, kích thước, màu sắc các sections
    renderLayout: {
      page: {
        width: 794, // A4 width in pixels
        height: 1123, // A4 height in pixels
        padding: 24,
        backgroundColor: '#ffffff',
      },
      sections: [
        {
          type: 'personalInfo',
          x: 48,
          y: 48,
          width: 520,
          height: 140,
          order: 1,
        },
        {
          type: 'careerObjective',
          x: 48,
          y: 210,
          width: 520,
          height: 80,
          order: 2,
        },
        {
          type: 'experience',
          x: 48,
          y: 310,
          width: 520,
          height: 380,
          order: 3,
        },
        {
          type: 'education',
          x: 48,
          y: 710,
          width: 520,
          height: 180,
          order: 4,
        },
        {
          type: 'projects',
          x: 48,
          y: 910,
          width: 520,
          height: 200,
          order: 5,
        },
        {
          type: 'skills',
          x: 596,
          y: 310,
          width: 150,
          height: 300,
          order: 6,
        },
        {
          type: 'languages',
          x: 596,
          y: 630,
          width: 150,
          height: 150,
          order: 7,
        },
        {
          type: 'certifications',
          x: 596,
          y: 800,
          width: 150,
          height: 200,
          order: 8,
        },
      ],
    },
  },

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
    style: 'modern',
    color: '#2563eb',
    industryCode: 'technology',
    preview: {
      image: '/templates/previews/student-tech-preview.jpg',
      thumbnail: '/templates/previews/student-tech-thumb.jpg',
      description:
        'Template công nghệ với gradient header, focus vào projects và skills',
    },
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#10b981',
      },
      fonts: {
        heading: 'JetBrains Mono',
        body: 'Inter',
      },
      layout: 'two-column',
    },
  },

  // Template cho thực tập sinh business
  'business-professional': {
    name: 'Business Professional',
    description: 'Dành cho thực tập sinh kinh doanh, marketing',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'experience',
      'activities',
      'skills',
    ],
    style: 'executive',
    color: '#059669',
    industryCode: 'business',
    preview: {
      image: '/templates/previews/business-professional-preview.jpg',
      thumbnail: '/templates/previews/business-professional-thumb.jpg',
      description: 'Template chuyên nghiệp cho business, phong cách corporate',
    },
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#059669',
        secondary: '#374151',
        accent: '#10b981',
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Source Sans Pro',
      },
      layout: 'two-column',
    },
  },

  // Template đơn giản cho fresher
  minimal: {
    name: 'Minimal',
    description: 'Template đơn giản, sạch sẽ cho người mới bắt đầu',
    sections: ['personalInfo', 'objective', 'education', 'skills', 'projects'],
    style: 'minimal',
    color: '#7c3aed',
    industryCode: 'general',
    preview: {
      image: '/templates/previews/minimal-preview.jpg',
      thumbnail: '/templates/previews/minimal-thumb.jpg',
      description: 'Template tối giản, đơn giản với typography sạch sẽ',
    },
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#000000',
        secondary: '#f8f9fa',
        accent: '#6c757d',
      },
      fonts: {
        heading: 'Helvetica',
        body: 'Helvetica',
      },
      layout: 'single-column',
    },
  },

  // Template creative cho design
  creative: {
    name: 'Creative',
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
    industryCode: 'design',
    preview: {
      image: '/templates/previews/creative-preview.jpg',
      thumbnail: '/templates/previews/creative-thumb.jpg',
      description: 'Template sáng tạo với gradient và design hiện đại',
    },
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#45b7d1',
      },
      fonts: {
        heading: 'Montserrat',
        body: 'Open Sans',
      },
      layout: 'two-column',
    },
  },

  // Template Executive cho senior
  executive: {
    name: 'Executive',
    description: 'Template chuyên nghiệp cho vị trí cấp cao',
    sections: [
      'personalInfo',
      'summary',
      'experience',
      'education',
      'skills',
      'achievements',
    ],
    style: 'executive',
    color: '#1a365d',
    industryCode: 'executive',
    preview: {
      image: '/templates/previews/executive-preview.jpg',
      thumbnail: '/templates/previews/executive-thumb.jpg',
      description: 'Template executive sang trọng cho vị trí quản lý',
    },
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#1a365d',
        secondary: '#2d3748',
        accent: '#4a5568',
      },
      fonts: {
        heading: 'Times New Roman',
        body: 'Times New Roman',
      },
      layout: 'two-column',
    },
  },

  // Template Classic truyền thống
  classic: {
    name: 'Classic',
    description: 'Template truyền thống, phù hợp với các ngành bảo thủ',
    sections: [
      'personalInfo',
      'objective',
      'experience',
      'education',
      'skills',
    ],
    style: 'classic',
    color: '#2c3e50',
    industryCode: 'traditional',
    preview: '/templates/classic-preview.jpg',
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#2c3e50',
        secondary: '#3498db',
        accent: '#27ae60',
      },
      fonts: {
        heading: 'Times New Roman',
        body: 'Times New Roman',
      },
      layout: 'single-column',
    },
  },

  // Template cho ngành y tế
  healthcare: {
    name: 'Healthcare',
    description: 'Dành cho sinh viên y khoa, điều dưỡng',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'clinical',
      'skills',
      'certifications',
    ],
    style: 'professional',
    color: '#059669',
    industryCode: 'healthcare',
    preview: '/templates/healthcare-preview.jpg',
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#059669',
        secondary: '#374151',
        accent: '#10b981',
      },
      fonts: {
        heading: 'Arial',
        body: 'Arial',
      },
      layout: 'two-column',
    },
  },

  // Template cho ngành giáo dục
  education: {
    name: 'Education',
    description: 'Dành cho sinh viên sư phạm, giáo dục',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'teaching',
      'skills',
      'certifications',
    ],
    style: 'professional',
    color: '#7c3aed',
    industryCode: 'education',
    preview: '/templates/education-preview.jpg',
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#7c3aed',
        secondary: '#374151',
        accent: '#10b981',
      },
      fonts: {
        heading: 'Georgia',
        body: 'Georgia',
      },
      layout: 'two-column',
    },
  },

  // Template cho ngành marketing
  marketing: {
    name: 'Marketing',
    description: 'Dành cho sinh viên marketing, truyền thông',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'campaigns',
      'skills',
      'achievements',
    ],
    style: 'creative',
    color: '#dc2626',
    industryCode: 'marketing',
    preview: '/templates/marketing-preview.jpg',
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#dc2626',
        secondary: '#f59e0b',
        accent: '#10b981',
      },
      fonts: {
        heading: 'Montserrat',
        body: 'Open Sans',
      },
      layout: 'two-column',
    },
  },
  // Finance & Accounting
  finance: {
    name: 'Finance Analyst',
    description:
      'Dành cho sinh viên/ thực tập sinh Tài chính - Phân tích dữ liệu',
    sections: [
      'personalInfo',
      'summary',
      'education',
      'experience',
      'projects',
      'skills',
      'certifications',
    ],
    style: 'professional',
    color: '#0f766e',
    industryCode: 'finance',
    preview: '/templates/finance-preview.jpg',
    options: { languages: ['vi', 'en'], supportsIcons: false },
    customization: {
      colors: { primary: '#0f766e', secondary: '#134e4a', accent: '#10b981' },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'two-column',
    },
  },
  accounting: {
    name: 'Accounting',
    description: 'Dành cho Kế toán/ Kiểm toán - bố cục rõ ràng, số liệu',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'experience',
      'skills',
      'certifications',
      'achievements',
    ],
    style: 'classic',
    color: '#334155',
    industryCode: 'finance',
    preview: '/templates/accounting-preview.jpg',
    options: { languages: ['vi', 'en'], supportsIcons: false },
    customization: {
      colors: { primary: '#334155', secondary: '#64748b', accent: '#16a34a' },
      fonts: { heading: 'Times New Roman', body: 'Times New Roman' },
      layout: 'single-column',
    },
  },
  // Logistics & Supply Chain
  logistics: {
    name: 'Logistics',
    description: 'Phù hợp ngành Logistics/ Xuất nhập khẩu/ Chuỗi cung ứng',
    sections: [
      'personalInfo',
      'objective',
      'education',
      'experience',
      'skills',
      'certifications',
      'projects',
    ],
    style: 'professional',
    color: '#2563eb',
    industryCode: 'logistics',
    preview: '/templates/logistics-preview.jpg',
    options: { languages: ['vi', 'en'], supportsIcons: false },
    customization: {
      colors: { primary: '#2563eb', secondary: '#1e293b', accent: '#38bdf8' },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'two-column',
    },
  },
  // Data & Analytics
  'data-analyst': {
    name: 'Data Analyst',
    description: 'Tập trung kỹ năng phân tích dữ liệu, dashboard, SQL/Excel',
    sections: [
      'personalInfo',
      'summary',
      'skills',
      'projects',
      'experience',
      'education',
      'certifications',
    ],
    style: 'modern',
    color: '#3b82f6',
    industryCode: 'data',
    preview: '/templates/data-analyst-preview.jpg',
    options: { languages: ['vi', 'en'], supportsIcons: false },
    customization: {
      colors: { primary: '#3b82f6', secondary: '#0f172a', accent: '#06b6d4' },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'two-column',
    },
  },
  // Human Resources
  hr: {
    name: 'Human Resources',
    description:
      'Dành cho HR/ Talent Acquisition - nhấn mạnh hoạt động & thành tích',
    sections: [
      'personalInfo',
      'summary',
      'experience',
      'activities',
      'skills',
      'education',
      'certifications',
    ],
    style: 'professional',
    color: '#9333ea',
    industryCode: 'human-resources',
    preview: '/templates/hr-preview.jpg',
    options: { languages: ['vi', 'en'], supportsIcons: false },
    customization: {
      colors: { primary: '#9333ea', secondary: '#6b21a8', accent: '#0ea5e9' },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'two-column',
    },
  },
  // Hospitality
  hospitality: {
    name: 'Hospitality',
    description: 'Du lịch - Khách sạn - Nhà hàng, nhấn mạnh dịch vụ & ca làm',
    sections: [
      'personalInfo',
      'objective',
      'experience',
      'skills',
      'education',
      'certifications',
      'awards',
    ],
    style: 'creative',
    color: '#dc2626',
    industryCode: 'hospitality',
    preview: '/templates/hospitality-preview.jpg',
    options: { languages: ['vi', 'en'], supportsIcons: false },
    customization: {
      colors: { primary: '#dc2626', secondary: '#1f2937', accent: '#f59e0b' },
      fonts: { heading: 'Montserrat', body: 'Open Sans' },
      layout: 'two-column',
    },
  },
  // Law/Legal
  legal: {
    name: 'Legal',
    description: 'Sinh viên Luật/ Pháp chế doanh nghiệp',
    sections: [
      'personalInfo',
      'summary',
      'education',
      'experience',
      'skills',
      'achievements',
    ],
    style: 'classic',
    color: '#1f2937',
    industryCode: 'law',
    preview: '/templates/legal-preview.jpg',
    options: { languages: ['vi', 'en'], supportsIcons: false },
    customization: {
      colors: { primary: '#1f2937', secondary: '#374151', accent: '#22c55e' },
      fonts: { heading: 'Times New Roman', body: 'Times New Roman' },
      layout: 'single-column',
    },
  },
  // New ultra-minimal, icon-free template
  'minimal-clean': {
    name: 'Minimal Clean',
    description: 'Biểu mẫu tối giản, không icon, tập trung nội dung',
    sections: [
      'personalInfo',
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
    ],
    style: 'minimal',
    color: '#111827',
    industryCode: 'general',
    preview: '/templates/minimal-clean-preview.jpg',
    options: {
      languages: ['vi', 'en'],
      supportsIcons: false,
    },
    customization: {
      colors: {
        primary: '#111827',
        secondary: '#6b7280',
        accent: '#0ea5e9',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      layout: 'single-column',
    },
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
  summary: {
    finance: [
      'Sinh viên Tài chính với nền tảng vững Excel/Power BI, đam mê phân tích số liệu và lập báo cáo quản trị.',
    ],
    logistics: [
      'Thực tập sinh Logistics hiểu quy trình XNK, Incoterms, tối ưu chi phí vận chuyển và theo dõi đơn hàng.',
    ],
    'data-analyst': [
      'Sinh viên Phân tích dữ liệu, thành thạo SQL/Excel, làm dashboard và trực quan hóa dữ liệu.',
    ],
    hr: [
      'Thực tập sinh HR, mạnh về tuyển dụng, phối hợp phỏng vấn và hoạt động nội bộ.',
    ],
    hospitality: [
      'Ứng viên ngành Dịch vụ với tác phong chuyên nghiệp, giao tiếp tốt, sẵn sàng ca kíp.',
    ],
    legal: [
      'Sinh viên Luật cẩn trọng, nắm vững kỹ năng tra cứu và soạn thảo văn bản.',
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
