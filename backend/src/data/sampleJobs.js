const mongoose = require('mongoose');

// Sample Jobs Data
const sampleJobs = [
  // FPT Software Jobs
  {
    title: 'Frontend Developer Intern',
    companyId: null, // Will be set dynamically
    internship: {
      type: 'summer',
      duration: 3,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      isPaid: true,
      stipend: {
        amount: 8000000,
        currency: 'VND',
        period: 'month'
      },
      academicCredit: true,
      remoteOption: true
    },
    requirements: {
      education: {
        level: 'Bachelor',
        majors: ['Computer Science', 'Information Technology', 'Software Engineering'],
        minGpa: 3.0,
        year: [2, 3, 4]
      },
      skills: [
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 9
        },
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 8
        },
        {
          skillId: null, // Will be set dynamically
          level: 'preferred',
          importance: 7
        }
      ],
      experience: {
        minMonths: 0,
        projectBased: true
      }
    },
    description: 'Thực tập sinh Frontend Developer sẽ tham gia phát triển giao diện người dùng cho các dự án web application của FPT Software. Bạn sẽ được làm việc với các công nghệ hiện đại như React, TypeScript và được mentor bởi các developer có kinh nghiệm.',
    responsibilities: [
      'Phát triển giao diện người dùng responsive và user-friendly',
      'Tối ưu hóa performance và trải nghiệm người dùng',
      'Làm việc với REST APIs và tích hợp backend services',
      'Tham gia code review và đóng góp vào best practices',
      'Học hỏi và áp dụng các công nghệ mới'
    ],
    benefits: [
      'Môi trường làm việc chuyên nghiệp, năng động',
      'Được mentor bởi các developer có kinh nghiệm',
      'Cơ hội tham gia các dự án thực tế với khách hàng quốc tế',
      'Đào tạo kỹ năng mềm và kỹ thuật',
      'Cơ hội được nhận việc làm chính thức sau khi thực tập'
    ],
    learningOutcomes: [
      'Thành thạo React, TypeScript và các công nghệ frontend hiện đại',
      'Hiểu biết về software development lifecycle',
      'Kỹ năng làm việc nhóm và giao tiếp hiệu quả',
      'Kinh nghiệm thực tế với các dự án enterprise',
      'Cơ hội networking với các chuyên gia trong ngành'
    ],
    location: {
      city: 'TP.HCM',
      district: 'Quận 9',
      country: 'VN',
      remote: true,
      hybrid: true
    },
    aiAnalysis: {
      skillsExtracted: ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS'],
      difficulty: 'intermediate',
      category: 'tech',
      lastAnalyzedAt: new Date()
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: false,
      maxApplications: 50,
      deadline: '2024-05-15',
      rollingBasis: false
    },
    status: 'active',
    isVerified: true,
    isFeatured: true,
    stats: {
      views: 245,
      applications: 18,
      saves: 32
    },
    postedBy: null // Will be set dynamically
  },
  {
    title: 'Backend Developer Intern',
    companyId: null, // Will be set dynamically
    internship: {
      type: 'semester',
      duration: 6,
      startDate: '2024-09-01',
      endDate: '2025-02-28',
      isPaid: true,
      stipend: {
        amount: 10000000,
        currency: 'VND',
        period: 'month'
      },
      academicCredit: true,
      remoteOption: false
    },
    requirements: {
      education: {
        level: 'Bachelor',
        majors: ['Computer Science', 'Information Technology', 'Software Engineering'],
        minGpa: 3.2,
        year: [3, 4]
      },
      skills: [
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 9
        },
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 8
        },
        {
          skillId: null, // Will be set dynamically
          level: 'preferred',
          importance: 7
        }
      ],
      experience: {
        minMonths: 3,
        projectBased: true
      }
    },
    description: 'Thực tập sinh Backend Developer sẽ tham gia phát triển các hệ thống backend cho các ứng dụng web và mobile. Bạn sẽ được học về microservices architecture, database design và cloud deployment.',
    responsibilities: [
      'Phát triển RESTful APIs và microservices',
      'Thiết kế và tối ưu hóa database schema',
      'Tích hợp với các third-party services',
      'Implement security best practices',
      'Deploy và maintain applications trên cloud'
    ],
    benefits: [
      'Lương thực tập cạnh tranh',
      'Được làm việc với các công nghệ cloud hiện đại',
      'Cơ hội học hỏi về microservices architecture',
      'Mentorship từ các senior developers',
      'Cơ hội thăng tiến sau khi tốt nghiệp'
    ],
    learningOutcomes: [
      'Thành thạo Node.js, Express và các framework backend',
      'Hiểu biết về microservices và cloud deployment',
      'Kỹ năng database design và optimization',
      'Kinh nghiệm với Docker và containerization',
      'Kiến thức về security và best practices'
    ],
    location: {
      city: 'TP.HCM',
      district: 'Quận 9',
      country: 'VN',
      remote: false,
      hybrid: true
    },
    aiAnalysis: {
      skillsExtracted: ['Node.js', 'Express', 'MongoDB', 'Docker', 'AWS'],
      difficulty: 'intermediate',
      category: 'tech',
      lastAnalyzedAt: new Date()
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: true,
      maxApplications: 30,
      deadline: '2024-08-15',
      rollingBasis: false
    },
    status: 'active',
    isVerified: true,
    isFeatured: false,
    stats: {
      views: 189,
      applications: 12,
      saves: 25
    },
    postedBy: null // Will be set dynamically
  },
  // Tiki Jobs
  {
    title: 'Data Analyst Intern',
    companyId: null, // Will be set dynamically
    internship: {
      type: 'summer',
      duration: 3,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      isPaid: true,
      stipend: {
        amount: 7000000,
        currency: 'VND',
        period: 'month'
      },
      academicCredit: true,
      remoteOption: true
    },
    requirements: {
      education: {
        level: 'Bachelor',
        majors: ['Statistics', 'Mathematics', 'Economics', 'Business Administration'],
        minGpa: 3.0,
        year: [2, 3, 4]
      },
      skills: [
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 9
        },
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 8
        },
        {
          skillId: null, // Will be set dynamically
          level: 'preferred',
          importance: 6
        }
      ],
      experience: {
        minMonths: 0,
        projectBased: true
      }
    },
    description: 'Thực tập sinh Data Analyst sẽ tham gia phân tích dữ liệu để hỗ trợ các quyết định kinh doanh tại Tiki. Bạn sẽ được học về data visualization, statistical analysis và business intelligence.',
    responsibilities: [
      'Thu thập và làm sạch dữ liệu từ nhiều nguồn khác nhau',
      'Phân tích dữ liệu để tìm ra insights và trends',
      'Tạo báo cáo và dashboard cho các bộ phận kinh doanh',
      'Hỗ trợ A/B testing và performance analysis',
      'Làm việc với các công cụ BI và visualization'
    ],
    benefits: [
      'Được làm việc với big data thực tế',
      'Học hỏi về e-commerce analytics',
      'Mentorship từ các data scientists có kinh nghiệm',
      'Cơ hội tham gia các dự án machine learning',
      'Môi trường làm việc trẻ, năng động'
    ],
    learningOutcomes: [
      'Thành thạo SQL, Python và các công cụ phân tích dữ liệu',
      'Hiểu biết về e-commerce metrics và KPIs',
      'Kỹ năng data visualization và storytelling',
      'Kinh nghiệm với big data platforms',
      'Kiến thức về statistical analysis và A/B testing'
    ],
    location: {
      city: 'TP.HCM',
      district: 'Quận 4',
      country: 'VN',
      remote: true,
      hybrid: true
    },
    aiAnalysis: {
      skillsExtracted: ['SQL', 'Python', 'Data Analysis', 'Statistics', 'Excel'],
      difficulty: 'beginner',
      category: 'data',
      lastAnalyzedAt: new Date()
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: false,
      maxApplications: 40,
      deadline: '2024-05-20',
      rollingBasis: false
    },
    status: 'active',
    isVerified: true,
    isFeatured: true,
    stats: {
      views: 312,
      applications: 25,
      saves: 45
    },
    postedBy: null // Will be set dynamically
  },
  // VNG Jobs
  {
    title: 'UI/UX Design Intern',
    companyId: null, // Will be set dynamically
    internship: {
      type: 'year-round',
      duration: 12,
      startDate: '2024-09-01',
      endDate: '2025-08-31',
      isPaid: true,
      stipend: {
        amount: 12000000,
        currency: 'VND',
        period: 'month'
      },
      academicCredit: true,
      remoteOption: true
    },
    requirements: {
      education: {
        level: 'Bachelor',
        majors: ['Graphic Design', 'Digital Arts', 'Industrial Design', 'Computer Science'],
        minGpa: 3.0,
        year: [2, 3, 4]
      },
      skills: [
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 9
        },
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 8
        },
        {
          skillId: null, // Will be set dynamically
          level: 'preferred',
          importance: 7
        }
      ],
      experience: {
        minMonths: 6,
        projectBased: true
      }
    },
    description: 'Thực tập sinh UI/UX Design sẽ tham gia thiết kế giao diện người dùng cho các sản phẩm của VNG. Bạn sẽ được học về user research, design thinking và product design process.',
    responsibilities: [
      'Thực hiện user research và usability testing',
      'Thiết kế wireframes, mockups và prototypes',
      'Tạo design system và component library',
      'Làm việc với product managers và developers',
      'Tham gia design reviews và feedback sessions'
    ],
    benefits: [
      'Được làm việc với các sản phẩm có hàng triệu người dùng',
      'Học hỏi từ các senior designers có kinh nghiệm',
      'Cơ hội tham gia các dự án đa dạng',
      'Được sử dụng các công cụ design hiện đại',
      'Môi trường sáng tạo và đổi mới'
    ],
    learningOutcomes: [
      'Thành thạo Figma và các công cụ design',
      'Hiểu biết về user-centered design process',
      'Kỹ năng design thinking và problem solving',
      'Kinh nghiệm với design systems',
      'Kiến thức về accessibility và usability'
    ],
    location: {
      city: 'TP.HCM',
      district: 'Quận 7',
      country: 'VN',
      remote: true,
      hybrid: true
    },
    aiAnalysis: {
      skillsExtracted: ['Figma', 'UI Design', 'UX Design', 'Prototyping', 'User Research'],
      difficulty: 'intermediate',
      category: 'design',
      lastAnalyzedAt: new Date()
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: true,
      maxApplications: 25,
      deadline: '2024-08-30',
      rollingBasis: false
    },
    status: 'active',
    isVerified: true,
    isFeatured: true,
    stats: {
      views: 278,
      applications: 15,
      saves: 38
    },
    postedBy: null // Will be set dynamically
  },
  // Grab Jobs
  {
    title: 'Mobile Developer Intern',
    companyId: null, // Will be set dynamically
    internship: {
      type: 'semester',
      duration: 6,
      startDate: '2024-09-01',
      endDate: '2025-02-28',
      isPaid: true,
      stipend: {
        amount: 15000000,
        currency: 'VND',
        period: 'month'
      },
      academicCredit: true,
      remoteOption: false
    },
    requirements: {
      education: {
        level: 'Bachelor',
        majors: ['Computer Science', 'Information Technology', 'Software Engineering'],
        minGpa: 3.2,
        year: [3, 4]
      },
      skills: [
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 9
        },
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 8
        },
        {
          skillId: null, // Will be set dynamically
          level: 'preferred',
          importance: 7
        }
      ],
      experience: {
        minMonths: 6,
        projectBased: true
      }
    },
    description: 'Thực tập sinh Mobile Developer sẽ tham gia phát triển ứng dụng mobile cho Grab. Bạn sẽ được học về mobile app development, API integration và mobile UI/UX best practices.',
    responsibilities: [
      'Phát triển ứng dụng mobile cho iOS và Android',
      'Tích hợp với backend APIs và third-party services',
      'Tối ưu hóa performance và user experience',
      'Tham gia code review và testing',
      'Làm việc với cross-functional teams'
    ],
    benefits: [
      'Lương thực tập cao nhất trong ngành',
      'Được làm việc với ứng dụng có hàng triệu người dùng',
      'Học hỏi về mobile development best practices',
      'Mentorship từ các senior mobile developers',
      'Cơ hội tham gia hackathons và innovation projects'
    ],
    learningOutcomes: [
      'Thành thạo React Native hoặc Flutter',
      'Hiểu biết về mobile app architecture',
      'Kỹ năng API integration và state management',
      'Kinh nghiệm với mobile testing và debugging',
      'Kiến thức về app store deployment'
    ],
    location: {
      city: 'TP.HCM',
      district: 'Quận 1',
      country: 'VN',
      remote: false,
      hybrid: true
    },
    aiAnalysis: {
      skillsExtracted: ['React Native', 'Flutter', 'Mobile Development', 'API Integration', 'UI/UX'],
      difficulty: 'advanced',
      category: 'tech',
      lastAnalyzedAt: new Date()
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: true,
      maxApplications: 20,
      deadline: '2024-08-15',
      rollingBasis: false
    },
    status: 'active',
    isVerified: true,
    isFeatured: true,
    stats: {
      views: 198,
      applications: 8,
      saves: 22
    },
    postedBy: null // Will be set dynamically
  },
  // Shopee Jobs
  {
    title: 'Marketing Intern',
    companyId: null, // Will be set dynamically
    internship: {
      type: 'summer',
      duration: 3,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      isPaid: true,
      stipend: {
        amount: 6000000,
        currency: 'VND',
        period: 'month'
      },
      academicCredit: true,
      remoteOption: true
    },
    requirements: {
      education: {
        level: 'Bachelor',
        majors: ['Marketing', 'Business Administration', 'Communication', 'Economics'],
        minGpa: 3.0,
        year: [2, 3, 4]
      },
      skills: [
        {
          skillId: null, // Will be set dynamically
          level: 'required',
          importance: 8
        },
        {
          skillId: null, // Will be set dynamically
          level: 'preferred',
          importance: 7
        },
        {
          skillId: null, // Will be set dynamically
          level: 'preferred',
          importance: 6
        }
      ],
      experience: {
        minMonths: 0,
        projectBased: true
      }
    },
    description: 'Thực tập sinh Marketing sẽ tham gia các hoạt động marketing digital tại Shopee. Bạn sẽ được học về social media marketing, content creation và campaign management.',
    responsibilities: [
      'Hỗ trợ lập kế hoạch và thực hiện marketing campaigns',
      'Tạo content cho social media và website',
      'Phân tích hiệu quả marketing và báo cáo KPI',
      'Làm việc với các agency và partners',
      'Tham gia các sự kiện marketing và brand activation'
    ],
    benefits: [
      'Được làm việc với thương hiệu e-commerce hàng đầu',
      'Học hỏi về digital marketing trends',
      'Cơ hội tham gia các campaign lớn',
      'Mentorship từ các marketing professionals',
      'Môi trường làm việc sáng tạo và năng động'
    ],
    learningOutcomes: [
      'Thành thạo các công cụ marketing digital',
      'Hiểu biết về e-commerce marketing',
      'Kỹ năng content creation và storytelling',
      'Kinh nghiệm với campaign management',
      'Kiến thức về marketing analytics và ROI'
    ],
    location: {
      city: 'Hà Nội',
      district: 'Ba Đình',
      country: 'VN',
      remote: true,
      hybrid: true
    },
    aiAnalysis: {
      skillsExtracted: ['Digital Marketing', 'Social Media', 'Content Creation', 'Analytics', 'Communication'],
      difficulty: 'beginner',
      category: 'marketing',
      lastAnalyzedAt: new Date()
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: false,
      maxApplications: 35,
      deadline: '2024-05-25',
      rollingBasis: false
    },
    status: 'active',
    isVerified: true,
    isFeatured: false,
    stats: {
      views: 156,
      applications: 20,
      saves: 28
    },
    postedBy: null // Will be set dynamically
  }
];

module.exports = {
  sampleJobs
};
