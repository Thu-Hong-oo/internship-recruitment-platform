const mongoose = require('mongoose');

// Sample Skills Data
const sampleSkills = [
  // Programming Languages
  {
    name: 'JavaScript',
    category: 'programming',
    aliases: ['js', 'ecmascript'],
    description: 'Ngôn ngữ lập trình web phổ biến, được sử dụng cho frontend và backend',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình', 
      advanced: 'Nâng cao'
    },
    popularity: 95,
    metadata: {
      difficulty: 'medium',
      learningTime: 200,
      resources: ['course', 'video', 'project']
    }
  },
  {
    name: 'Python',
    category: 'programming',
    aliases: ['py'],
    description: 'Ngôn ngữ lập trình đa năng, phổ biến trong AI/ML và web development',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 90,
    metadata: {
      difficulty: 'easy',
      learningTime: 150,
      resources: ['course', 'video', 'book']
    }
  },
  {
    name: 'React',
    category: 'web',
    aliases: ['reactjs', 'react.js'],
    description: 'Thư viện JavaScript để xây dựng giao diện người dùng',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 88,
    metadata: {
      difficulty: 'medium',
      learningTime: 180,
      resources: ['course', 'video', 'project']
    }
  },
  {
    name: 'Node.js',
    category: 'web',
    aliases: ['nodejs', 'node'],
    description: 'Runtime JavaScript cho backend development',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 85,
    metadata: {
      difficulty: 'medium',
      learningTime: 160,
      resources: ['course', 'video', 'project']
    }
  },
  {
    name: 'Java',
    category: 'programming',
    aliases: ['java programming'],
    description: 'Ngôn ngữ lập trình hướng đối tượng, phổ biến trong enterprise',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 82,
    metadata: {
      difficulty: 'hard',
      learningTime: 300,
      resources: ['course', 'book', 'project']
    }
  },
  {
    name: 'SQL',
    category: 'data',
    aliases: ['structured query language'],
    description: 'Ngôn ngữ truy vấn cơ sở dữ liệu quan hệ',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 80,
    metadata: {
      difficulty: 'medium',
      learningTime: 120,
      resources: ['course', 'video', 'tutorial']
    }
  },
  {
    name: 'Git',
    category: 'devops',
    aliases: ['git version control'],
    description: 'Hệ thống quản lý phiên bản phân tán',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 78,
    metadata: {
      difficulty: 'easy',
      learningTime: 80,
      resources: ['course', 'video', 'tutorial']
    }
  },
  {
    name: 'Docker',
    category: 'devops',
    aliases: ['containerization'],
    description: 'Nền tảng containerization cho ứng dụng',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 75,
    metadata: {
      difficulty: 'medium',
      learningTime: 140,
      resources: ['course', 'video', 'project']
    }
  },
  {
    name: 'Figma',
    category: 'design',
    aliases: ['ui design', 'ux design'],
    description: 'Công cụ thiết kế giao diện người dùng',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 70,
    metadata: {
      difficulty: 'easy',
      learningTime: 100,
      resources: ['course', 'video', 'tutorial']
    }
  },
  {
    name: 'Data Analysis',
    category: 'data',
    aliases: ['analytics', 'data analytics'],
    description: 'Kỹ năng phân tích và xử lý dữ liệu',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 72,
    metadata: {
      difficulty: 'medium',
      learningTime: 200,
      resources: ['course', 'book', 'project']
    }
  },
  {
    name: 'Communication',
    category: 'soft-skills',
    aliases: ['giao tiếp'],
    description: 'Kỹ năng giao tiếp hiệu quả trong môi trường làm việc',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 85,
    metadata: {
      difficulty: 'medium',
      learningTime: 150,
      resources: ['course', 'book', 'tutorial']
    }
  },
  {
    name: 'Problem Solving',
    category: 'soft-skills',
    aliases: ['giải quyết vấn đề'],
    description: 'Kỹ năng phân tích và giải quyết vấn đề hiệu quả',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 88,
    metadata: {
      difficulty: 'medium',
      learningTime: 180,
      resources: ['course', 'book', 'project']
    }
  },
  {
    name: 'Teamwork',
    category: 'soft-skills',
    aliases: ['làm việc nhóm'],
    description: 'Kỹ năng làm việc hiệu quả trong nhóm',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 82,
    metadata: {
      difficulty: 'easy',
      learningTime: 120,
      resources: ['course', 'video', 'project']
    }
  },
  {
    name: 'Digital Marketing',
    category: 'marketing',
    aliases: ['online marketing'],
    description: 'Kỹ năng marketing trong môi trường số',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 68,
    metadata: {
      difficulty: 'medium',
      learningTime: 160,
      resources: ['course', 'video', 'project']
    }
  },
  {
    name: 'Business Analysis',
    category: 'business',
    aliases: ['phân tích kinh doanh'],
    description: 'Kỹ năng phân tích và đánh giá các vấn đề kinh doanh',
    level: {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    },
    popularity: 65,
    metadata: {
      difficulty: 'hard',
      learningTime: 250,
      resources: ['course', 'book', 'project']
    }
  }
];

// Sample Users Data
const sampleUsers = [
  // Students
  {
    email: 'nguyen.van.a@student.hcmut.edu.vn',
    password: 'password123',
    authMethod: 'local',
    role: 'student',
    profile: {
      firstName: 'Nguyễn Văn',
      lastName: 'An',
      phone: '+84901234567',
      bio: 'Sinh viên năm 3 ngành Công nghệ thông tin, đam mê lập trình web và AI',
      location: {
        city: 'TP.HCM',
        district: 'Quận 1',
        country: 'VN'
      },
      dateOfBirth: '2002-05-15',
      gender: 'male'
    },
    isEmailVerified: true,
    isActive: true
  },
  {
    email: 'tran.thi.b@student.hcmut.edu.vn',
    password: 'password123',
    authMethod: 'local',
    role: 'student',
    profile: {
      firstName: 'Trần Thị',
      lastName: 'Bình',
      phone: '+84901234568',
      bio: 'Sinh viên năm 4 ngành Kinh tế, quan tâm đến marketing và phân tích dữ liệu',
      location: {
        city: 'TP.HCM',
        district: 'Quận 3',
        country: 'VN'
      },
      dateOfBirth: '2001-08-20',
      gender: 'female'
    },
    isEmailVerified: true,
    isActive: true
  },
  {
    email: 'le.van.c@student.hcmut.edu.vn',
    password: 'password123',
    authMethod: 'local',
    role: 'student',
    profile: {
      firstName: 'Lê Văn',
      lastName: 'Cường',
      phone: '+84901234569',
      bio: 'Sinh viên năm 2 ngành Thiết kế đồ họa, yêu thích UI/UX design',
      location: {
        city: 'TP.HCM',
        district: 'Quận 7',
        country: 'VN'
      },
      dateOfBirth: '2003-03-10',
      gender: 'male'
    },
    isEmailVerified: true,
    isActive: true
  },
  // Employers
  {
    email: 'hr@fpt.com.vn',
    password: 'password123',
    authMethod: 'local',
    role: 'employer',
    profile: {
      firstName: 'Phạm Thị',
      lastName: 'Dung',
      phone: '+84901234570',
      bio: 'HR Manager tại FPT Software, chuyên tuyển dụng nhân sự IT',
      location: {
        city: 'TP.HCM',
        district: 'Quận 9',
        country: 'VN'
      },
      dateOfBirth: '1985-12-05',
      gender: 'female'
    },
    isEmailVerified: true,
    isActive: true
  },
  {
    email: 'tuyendung@tiki.vn',
    password: 'password123',
    authMethod: 'local',
    role: 'employer',
    profile: {
      firstName: 'Nguyễn Văn',
      lastName: 'Em',
      phone: '+84901234571',
      bio: 'Talent Acquisition Specialist tại Tiki, chuyên tuyển dụng sinh viên thực tập',
      location: {
        city: 'TP.HCM',
        district: 'Quận 1',
        country: 'VN'
      },
      dateOfBirth: '1988-07-15',
      gender: 'male'
    },
    isEmailVerified: true,
    isActive: true
  },
  {
    email: 'careers@vng.com.vn',
    password: 'password123',
    authMethod: 'local',
    role: 'employer',
    profile: {
      firstName: 'Trần Thị',
      lastName: 'Phương',
      phone: '+84901234572',
      bio: 'Senior HR Manager tại VNG Corporation, có 8 năm kinh nghiệm tuyển dụng',
      location: {
        city: 'TP.HCM',
        district: 'Quận 7',
        country: 'VN'
      },
      dateOfBirth: '1983-04-25',
      gender: 'female'
    },
    isEmailVerified: true,
    isActive: true
  },
  // Admin
  {
    email: 'admin@internship-platform.com',
    password: 'admin123',
    authMethod: 'local',
    role: 'admin',
    profile: {
      firstName: 'Admin',
      lastName: 'System',
      phone: '+84901234573',
      bio: 'Quản trị viên hệ thống',
      location: {
        city: 'TP.HCM',
        district: 'Quận 1',
        country: 'VN'
      }
    },
    isEmailVerified: true,
    isActive: true
  }
];

// Sample Companies Data
const sampleCompanies = [
  {
    name: 'FPT Software',
    slug: 'fpt-software',
    description: 'Công ty phần mềm hàng đầu Việt Nam, chuyên về outsourcing và phát triển phần mềm',
    industry: ['Technology', 'Software Development', 'IT Services'],
    size: '1000+',
    foundedYear: 1999,
    website: 'https://fptsoftware.com',
    logo: 'https://example.com/fpt-logo.png',
    banner: 'https://example.com/fpt-banner.jpg',
    location: {
      address: 'FPT Tower, 10 Pham Van Bach, Cau Giay',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      country: 'VN',
      coordinates: {
        lat: 21.0285,
        lng: 105.8048
      }
    },
    contact: {
      email: 'hr@fpt.com.vn',
      phone: '024 7300 9999',
      linkedin: 'https://linkedin.com/company/fpt-software',
      facebook: 'https://facebook.com/fptsoftware'
    },
    benefits: [
      {
        name: 'Bảo hiểm sức khỏe',
        description: 'Bảo hiểm sức khỏe toàn diện cho nhân viên',
        icon: 'health'
      },
      {
        name: 'Đào tạo miễn phí',
        description: 'Các khóa đào tạo kỹ năng và công nghệ mới',
        icon: 'training'
      },
      {
        name: 'Môi trường trẻ',
        description: 'Môi trường làm việc năng động, sáng tạo',
        icon: 'environment'
      }
    ],
    isVerified: true,
    isActive: true,
    rating: {
      average: 4.2,
      count: 156
    },
    stats: {
      totalJobs: 45,
      totalApplications: 1200,
      activeInternships: 12
    }
  },
  {
    name: 'Tiki',
    slug: 'tiki',
    description: 'Sàn thương mại điện tử hàng đầu Việt Nam, chuyên về bán lẻ trực tuyến',
    industry: ['E-commerce', 'Retail', 'Technology'],
    size: '1000+',
    foundedYear: 2010,
    website: 'https://tiki.vn',
    logo: 'https://example.com/tiki-logo.png',
    banner: 'https://example.com/tiki-banner.jpg',
    location: {
      address: 'Tiki Office, 52 Ut Tich, District 4',
      city: 'TP.HCM',
      district: 'Quận 4',
      country: 'VN',
      coordinates: {
        lat: 10.7626,
        lng: 106.6602
      }
    },
    contact: {
      email: 'tuyendung@tiki.vn',
      phone: '028 7300 9999',
      linkedin: 'https://linkedin.com/company/tiki',
      facebook: 'https://facebook.com/tiki.vn'
    },
    benefits: [
      {
        name: 'Thưởng hiệu suất',
        description: 'Thưởng dựa trên hiệu suất làm việc',
        icon: 'bonus'
      },
      {
        name: 'Flexible working',
        description: 'Làm việc linh hoạt, có thể work from home',
        icon: 'flexible'
      },
      {
        name: 'Phát triển sự nghiệp',
        description: 'Cơ hội thăng tiến và phát triển sự nghiệp rõ ràng',
        icon: 'career'
      }
    ],
    isVerified: true,
    isActive: true,
    rating: {
      average: 4.0,
      count: 89
    },
    stats: {
      totalJobs: 28,
      totalApplications: 850,
      activeInternships: 8
    }
  },
  {
    name: 'VNG Corporation',
    slug: 'vng-corporation',
    description: 'Tập đoàn công nghệ hàng đầu Việt Nam, sở hữu nhiều sản phẩm internet nổi tiếng',
    industry: ['Technology', 'Internet', 'Gaming'],
    size: '1000+',
    foundedYear: 2004,
    website: 'https://vng.com.vn',
    logo: 'https://example.com/vng-logo.png',
    banner: 'https://example.com/vng-banner.jpg',
    location: {
      address: 'VNG Campus, 02 Nguyen Van Linh, District 7',
      city: 'TP.HCM',
      district: 'Quận 7',
      country: 'VN',
      coordinates: {
        lat: 10.7321,
        lng: 106.7227
      }
    },
    contact: {
      email: 'careers@vng.com.vn',
      phone: '028 7300 9999',
      linkedin: 'https://linkedin.com/company/vng-corporation',
      facebook: 'https://facebook.com/vngcorporation'
    },
    benefits: [
      {
        name: 'Lương cạnh tranh',
        description: 'Mức lương cạnh tranh trong ngành công nghệ',
        icon: 'salary'
      },
      {
        name: 'Stock options',
        description: 'Cơ hội sở hữu cổ phiếu công ty',
        icon: 'stock'
      },
      {
        name: 'Sản phẩm thực tế',
        description: 'Được làm việc với các sản phẩm có hàng triệu người dùng',
        icon: 'product'
      }
    ],
    isVerified: true,
    isActive: true,
    rating: {
      average: 4.5,
      count: 234
    },
    stats: {
      totalJobs: 35,
      totalApplications: 1500,
      activeInternships: 15
    }
  },
  {
    name: 'Grab Vietnam',
    slug: 'grab-vietnam',
    description: 'Công ty công nghệ đa nền tảng, cung cấp dịch vụ giao hàng, di chuyển và thanh toán',
    industry: ['Technology', 'Transportation', 'Fintech'],
    size: '1000+',
    foundedYear: 2012,
    website: 'https://grab.com/vn',
    logo: 'https://example.com/grab-logo.png',
    banner: 'https://example.com/grab-banner.jpg',
    location: {
      address: 'Grab Office, 168 Nguyen Duy Duong, District 1',
      city: 'TP.HCM',
      district: 'Quận 1',
      country: 'VN',
      coordinates: {
        lat: 10.7769,
        lng: 106.7009
      }
    },
    contact: {
      email: 'careers@grabtaxi.com',
      phone: '028 7300 9999',
      linkedin: 'https://linkedin.com/company/grab',
      facebook: 'https://facebook.com/grabvietnam'
    },
    benefits: [
      {
        name: 'Môi trường quốc tế',
        description: 'Làm việc trong môi trường đa văn hóa, đa quốc gia',
        icon: 'international'
      },
      {
        name: 'Công nghệ tiên tiến',
        description: 'Tiếp cận với công nghệ AI/ML và big data hiện đại',
        icon: 'tech'
      },
      {
        name: 'Impact lớn',
        description: 'Tạo ra tác động tích cực cho xã hội',
        icon: 'impact'
      }
    ],
    isVerified: true,
    isActive: true,
    rating: {
      average: 4.3,
      count: 178
    },
    stats: {
      totalJobs: 22,
      totalApplications: 980,
      activeInternships: 6
    }
  },
  {
    name: 'Shopee Vietnam',
    slug: 'shopee-vietnam',
    description: 'Nền tảng thương mại điện tử hàng đầu Đông Nam Á',
    industry: ['E-commerce', 'Technology', 'Retail'],
    size: '1000+',
    foundedYear: 2015,
    website: 'https://shopee.vn',
    logo: 'https://example.com/shopee-logo.png',
    banner: 'https://example.com/shopee-banner.jpg',
    location: {
      address: 'Shopee Office, 4th Floor, Capital Place, 29 Lieu Giai',
      city: 'Hà Nội',
      district: 'Ba Đình',
      country: 'VN',
      coordinates: {
        lat: 21.0369,
        lng: 105.8125
      }
    },
    contact: {
      email: 'careers@shopee.com',
      phone: '024 7300 9999',
      linkedin: 'https://linkedin.com/company/shopee',
      facebook: 'https://facebook.com/shopeevn'
    },
    benefits: [
      {
        name: 'Learning budget',
        description: 'Ngân sách học tập và phát triển kỹ năng',
        icon: 'learning'
      },
      {
        name: 'Team building',
        description: 'Các hoạt động team building thường xuyên',
        icon: 'team'
      },
      {
        name: 'Free lunch',
        description: 'Bữa trưa miễn phí tại văn phòng',
        icon: 'food'
      }
    ],
    isVerified: true,
    isActive: true,
    rating: {
      average: 4.1,
      count: 145
    },
    stats: {
      totalJobs: 18,
      totalApplications: 720,
      activeInternships: 5
    }
  }
];

module.exports = {
  sampleSkills,
  sampleUsers,
  sampleCompanies
};
