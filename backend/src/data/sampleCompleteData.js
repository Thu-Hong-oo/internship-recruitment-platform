const mongoose = require('mongoose');

// Sample Companies Data
const sampleCompanies = [
  {
    name: "FPT Software",
    slug: "fpt-software",
    description: "FPT Software là công ty công nghệ hàng đầu Việt Nam, chuyên về phát triển phần mềm, dịch vụ công nghệ thông tin và chuyển đổi số cho các doanh nghiệp trong và ngoài nước.",
    shortDescription: "Công ty công nghệ hàng đầu Việt Nam",
    industry: {
      primary: "tech",
      secondary: ["business", "consulting"],
      tags: ["software", "digital-transformation", "outsourcing"]
    },
    size: "large",
    employeeCount: { min: 10000, max: 15000 },
    companyType: "public",
    foundedYear: 1999,
    foundedMonth: 9,
    website: "https://fpt-software.com",
    logo: {
      url: "https://example.com/logos/fpt-software.png",
      filename: "fpt-software-logo.png",
      uploadedAt: new Date()
    },
    location: {
      type: "multiple",
      headquarters: {
        address: "17 Duy Tân, Cầu Giấy",
        city: "Hà Nội",
        district: "Cầu Giấy",
        country: "VN",
        coordinates: { latitude: 21.0285, longitude: 105.8542 }
      },
      offices: [
        {
          name: "TP.HCM Office",
          address: "123 Nguyễn Huệ, Quận 1",
          city: "TP.HCM",
          district: "Quận 1",
          country: "VN",
          coordinates: { latitude: 10.7769, longitude: 106.7009 },
          isMain: false
        }
      ]
    },
    contact: {
      email: "hr@fpt-software.com",
      phone: "+84 24 7300 5588",
      contactPerson: {
        name: "Nguyễn Thị Lan",
        position: "HR Manager",
        email: "lan.nguyen@fpt-software.com",
        phone: "+84 24 7300 5589"
      }
    },
    culture: {
      values: ["Innovation", "Excellence", "Collaboration", "Learning"],
      mission: "Đưa công nghệ Việt Nam ra thế giới",
      vision: "Trở thành công ty công nghệ hàng đầu Đông Nam Á",
      workStyle: ["collaborative", "agile", "flexible"],
      dressCode: "business-casual"
    },
    benefits: [
      {
        name: "Bảo hiểm sức khỏe",
        description: "Bảo hiểm sức khỏe toàn diện cho nhân viên và gia đình",
        category: "health",
        icon: "health-icon",
        isHighlighted: true
      },
      {
        name: "Đào tạo kỹ năng",
        description: "Chương trình đào tạo kỹ năng chuyên môn và kỹ năng mềm",
        category: "learning",
        icon: "learning-icon",
        isHighlighted: true
      }
    ],
    internshipProgram: {
      hasProgram: true,
      programName: "FPT Software Internship Program",
      description: "Chương trình thực tập chuyên nghiệp với mentorship và cơ hội việc làm",
      duration: { min: 3, max: 6, unit: "months" },
      stipend: {
        hasStipend: true,
        amount: { min: 3000000, max: 5000000 },
        currency: "VND",
        period: "month"
      },
      benefits: ["Mentorship", "Networking", "Certificate"],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: "document"
    },
    status: "active",
    rating: {
      overall: 4.5,
      count: 150,
      categories: {
        workLifeBalance: 4.2,
        careerGrowth: 4.6,
        compensation: 4.3,
        management: 4.4,
        culture: 4.5
      }
    },
    stats: {
      totalJobs: 25,
      activeJobs: 15,
      totalApplications: 500,
      totalInterns: 200,
      totalEmployees: 12000,
      views: 5000,
      saves: 800
    },
    seo: {
      keywords: ["fpt", "software", "internship", "technology", "vietnam"],
      metaDescription: "Thực tập tại FPT Software - Công ty công nghệ hàng đầu Việt Nam"
    }
  },
  {
    name: "Viettel Group",
    slug: "viettel-group",
    description: "Viettel là tập đoàn viễn thông và công nghệ hàng đầu Việt Nam, hoạt động trong lĩnh vực viễn thông, công nghệ thông tin và các dịch vụ số.",
    shortDescription: "Tập đoàn viễn thông và công nghệ hàng đầu",
    industry: {
      primary: "tech",
      secondary: ["telecommunications", "business"],
      tags: ["telecom", "digital-services", "innovation"]
    },
    size: "enterprise",
    employeeCount: { min: 50000, max: 60000 },
    companyType: "government",
    foundedYear: 1989,
    foundedMonth: 6,
    website: "https://viettel.com.vn",
    logo: {
      url: "https://example.com/logos/viettel.png",
      filename: "viettel-logo.png",
      uploadedAt: new Date()
    },
    location: {
      type: "multiple",
      headquarters: {
        address: "1 Giang Văn Minh, Ba Đình",
        city: "Hà Nội",
        district: "Ba Đình",
        country: "VN",
        coordinates: { latitude: 21.0333, longitude: 105.8333 }
      }
    },
    contact: {
      email: "hr@viettel.com.vn",
      phone: "+84 24 6266 8888",
      contactPerson: {
        name: "Trần Văn Minh",
        position: "HR Director",
        email: "minh.tran@viettel.com.vn",
        phone: "+84 24 6266 8889"
      }
    },
    culture: {
      values: ["Innovation", "Customer First", "Excellence", "Integrity"],
      mission: "Kết nối và phục vụ cộng đồng",
      vision: "Trở thành tập đoàn công nghệ hàng đầu khu vực",
      workStyle: ["collaborative", "traditional", "flexible"],
      dressCode: "business-casual"
    },
    benefits: [
      {
        name: "Lương thưởng cạnh tranh",
        description: "Hệ thống lương thưởng cạnh tranh và minh bạch",
        category: "financial",
        icon: "money-icon",
        isHighlighted: true
      },
      {
        name: "Phúc lợi toàn diện",
        description: "Gói phúc lợi toàn diện cho nhân viên",
        category: "health",
        icon: "benefits-icon",
        isHighlighted: true
      }
    ],
    internshipProgram: {
      hasProgram: true,
      programName: "Viettel Future Leaders",
      description: "Chương trình phát triển tài năng trẻ cho tương lai",
      duration: { min: 4, max: 8, unit: "months" },
      stipend: {
        hasStipend: true,
        amount: { min: 4000000, max: 6000000 },
        currency: "VND",
        period: "month"
      },
      benefits: ["Leadership Training", "Mentorship", "Career Path"],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: "document"
    },
    status: "active",
    rating: {
      overall: 4.3,
      count: 200,
      categories: {
        workLifeBalance: 4.0,
        careerGrowth: 4.5,
        compensation: 4.4,
        management: 4.2,
        culture: 4.3
      }
    },
    stats: {
      totalJobs: 30,
      activeJobs: 20,
      totalApplications: 800,
      totalInterns: 300,
      totalEmployees: 55000,
      views: 8000,
      saves: 1200
    },
    seo: {
      keywords: ["viettel", "telecom", "internship", "technology", "government"],
      metaDescription: "Thực tập tại Viettel - Tập đoàn viễn thông hàng đầu Việt Nam"
    }
  },
  {
    name: "VinGroup",
    slug: "vingroup",
    description: "VinGroup là tập đoàn kinh tế tư nhân lớn nhất Việt Nam, hoạt động đa ngành từ bất động sản, ô tô, giáo dục đến công nghệ.",
    shortDescription: "Tập đoàn kinh tế tư nhân lớn nhất Việt Nam",
    industry: {
      primary: "business",
      secondary: ["tech", "manufacturing", "education"],
      tags: ["conglomerate", "innovation", "diversified"]
    },
    size: "enterprise",
    employeeCount: { min: 80000, max: 100000 },
    companyType: "private",
    foundedYear: 1993,
    foundedMonth: 8,
    website: "https://vingroup.net",
    logo: {
      url: "https://example.com/logos/vingroup.png",
      filename: "vingroup-logo.png",
      uploadedAt: new Date()
    },
    location: {
      type: "multiple",
      headquarters: {
        address: "7 Điện Biên Phủ, Ba Đình",
        city: "Hà Nội",
        district: "Ba Đình",
        country: "VN",
        coordinates: { latitude: 21.0333, longitude: 105.8333 }
      }
    },
    contact: {
      email: "hr@vingroup.net",
      phone: "+84 24 3974 9999",
      contactPerson: {
        name: "Lê Thị Hương",
        position: "Talent Acquisition Manager",
        email: "huong.le@vingroup.net",
        phone: "+84 24 3974 9998"
      }
    },
    culture: {
      values: ["Innovation", "Excellence", "Integrity", "Social Responsibility"],
      mission: "Tạo ra giá trị bền vững cho cộng đồng",
      vision: "Trở thành tập đoàn hàng đầu khu vực",
      workStyle: ["collaborative", "agile", "flexible"],
      dressCode: "business-casual"
    },
    benefits: [
      {
        name: "Môi trường làm việc chuyên nghiệp",
        description: "Môi trường làm việc hiện đại và chuyên nghiệp",
        category: "work-life",
        icon: "office-icon",
        isHighlighted: true
      },
      {
        name: "Cơ hội thăng tiến",
        description: "Hệ thống thăng tiến rõ ràng và công bằng",
        category: "career",
        icon: "career-icon",
        isHighlighted: true
      }
    ],
    internshipProgram: {
      hasProgram: true,
      programName: "VinGroup Young Talent",
      description: "Chương trình phát triển tài năng trẻ đa ngành",
      duration: { min: 3, max: 12, unit: "months" },
      stipend: {
        hasStipend: true,
        amount: { min: 5000000, max: 8000000 },
        currency: "VND",
        period: "month"
      },
      benefits: ["Cross-functional Training", "Mentorship", "Global Exposure"],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: "document"
    },
    status: "active",
    rating: {
      overall: 4.4,
      count: 300,
      categories: {
        workLifeBalance: 4.1,
        careerGrowth: 4.6,
        compensation: 4.5,
        management: 4.3,
        culture: 4.4
      }
    },
    stats: {
      totalJobs: 40,
      activeJobs: 25,
      totalApplications: 1200,
      totalInterns: 400,
      totalEmployees: 90000,
      views: 12000,
      saves: 1800
    },
    seo: {
      keywords: ["vingroup", "conglomerate", "internship", "business", "innovation"],
      metaDescription: "Thực tập tại VinGroup - Tập đoàn kinh tế tư nhân lớn nhất Việt Nam"
    }
  }
];

// Sample Skills Data
const sampleSkills = [
  {
    name: "JavaScript",
    slug: "javascript",
    category: "programming",
    description: "Ngôn ngữ lập trình JavaScript cho web development",
    aliases: ["JS", "ECMAScript"],
    level: "intermediate",
    popularity: 95,
    difficulty: "medium",
    keywords: ["web", "frontend", "backend", "nodejs"],
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
  },
  {
    name: "React",
    slug: "react",
    category: "programming",
    description: "Thư viện JavaScript cho xây dựng giao diện người dùng",
    aliases: ["ReactJS", "React.js"],
    level: "intermediate",
    popularity: 90,
    difficulty: "medium",
    keywords: ["frontend", "ui", "component", "javascript"],
    embedding: [0.2, 0.3, 0.4, 0.5, 0.6]
  },
  {
    name: "Python",
    slug: "python",
    category: "programming",
    description: "Ngôn ngữ lập trình Python đa mục đích",
    aliases: ["Python3", "Py"],
    level: "beginner",
    popularity: 88,
    difficulty: "easy",
    keywords: ["backend", "data", "ai", "automation"],
    embedding: [0.3, 0.4, 0.5, 0.6, 0.7]
  },
  {
    name: "Java",
    slug: "java",
    category: "programming",
    description: "Ngôn ngữ lập trình Java cho enterprise applications",
    aliases: ["Java SE", "Java EE"],
    level: "intermediate",
    popularity: 85,
    difficulty: "medium",
    keywords: ["backend", "enterprise", "spring", "oop"],
    embedding: [0.4, 0.5, 0.6, 0.7, 0.8]
  },
  {
    name: "UI/UX Design",
    slug: "ui-ux-design",
    category: "design",
    description: "Thiết kế giao diện và trải nghiệm người dùng",
    aliases: ["User Interface", "User Experience"],
    level: "intermediate",
    popularity: 80,
    difficulty: "medium",
    keywords: ["design", "user", "interface", "experience"],
    embedding: [0.5, 0.6, 0.7, 0.8, 0.9]
  },
  {
    name: "Data Analysis",
    slug: "data-analysis",
    category: "data",
    description: "Phân tích dữ liệu và business intelligence",
    aliases: ["Analytics", "BI"],
    level: "intermediate",
    popularity: 75,
    difficulty: "medium",
    keywords: ["data", "analysis", "statistics", "insights"],
    embedding: [0.6, 0.7, 0.8, 0.9, 1.0]
  },
  {
    name: "Project Management",
    slug: "project-management",
    category: "business",
    description: "Quản lý dự án và team leadership",
    aliases: ["PM", "Project Lead"],
    level: "advanced",
    popularity: 70,
    difficulty: "hard",
    keywords: ["management", "leadership", "planning", "coordination"],
    embedding: [0.7, 0.8, 0.9, 1.0, 1.1]
  },
  {
    name: "Digital Marketing",
    slug: "digital-marketing",
    category: "marketing",
    description: "Marketing kỹ thuật số và social media",
    aliases: ["Online Marketing", "Social Media Marketing"],
    level: "beginner",
    popularity: 65,
    difficulty: "easy",
    keywords: ["marketing", "digital", "social", "seo"],
    embedding: [0.8, 0.9, 1.0, 1.1, 1.2]
  }
];

// Sample Jobs Data
const sampleJobs = [
  {
    title: "Frontend Developer Intern",
    slug: "frontend-developer-intern-fpt",
    description: "Tham gia phát triển các ứng dụng web frontend sử dụng React, JavaScript và các công nghệ hiện đại. Bạn sẽ được làm việc trong môi trường chuyên nghiệp với các mentor giàu kinh nghiệm.",
    companyId: null, // Will be set after company creation
    jobType: "internship",
    category: "tech",
    subCategory: "Frontend Development",
    internship: {
      type: "summer",
      duration: 3,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-08-31"),
      isPaid: true,
      stipend: {
        amount: 4000000,
        currency: "VND",
        period: "month",
        isNegotiable: true
      },
      academicCredit: true,
      remoteOption: false,
      flexibleHours: true
    },
    requirements: {
      education: {
        level: "Bachelor",
        majors: ["Computer Science", "Information Technology", "Software Engineering"],
        minGpa: 3.0,
        year: [3, 4]
      },
      skills: [
        {
          skillId: null, // Will be set after skill creation
          level: "required",
          importance: 9
        },
        {
          skillId: null, // Will be set after skill creation
          level: "required",
          importance: 8
        }
      ],
      experience: {
        minMonths: 0,
        projectBased: true,
        experienceLevel: "beginner"
      },
      languages: [
        {
          language: "Vietnamese",
          level: "fluent"
        },
        {
          language: "English",
          level: "intermediate"
        }
      ],
      age: { min: 18, max: 25 },
      gender: "any"
    },
    description: "Tham gia phát triển các ứng dụng web frontend sử dụng React, JavaScript và các công nghệ hiện đại. Bạn sẽ được làm việc trong môi trường chuyên nghiệp với các mentor giàu kinh nghiệm.",
    responsibilities: [
      "Phát triển giao diện người dùng responsive",
      "Tối ưu hóa hiệu suất ứng dụng web",
      "Tham gia code review và testing",
      "Học hỏi và áp dụng best practices"
    ],
    jobRequirements: [
      "Kiến thức cơ bản về HTML, CSS, JavaScript",
      "Kinh nghiệm với React hoặc framework tương tự",
      "Khả năng làm việc nhóm và giao tiếp tốt",
      "Tinh thần học hỏi và cầu tiến"
    ],
    benefits: [
      "Môi trường làm việc chuyên nghiệp",
      "Mentorship từ senior developers",
      "Cơ hội tham gia các dự án thực tế",
      "Chứng chỉ thực tập có giá trị"
    ],
    learningOutcomes: [
      "Nắm vững React và ecosystem",
      "Kỹ năng làm việc nhóm trong dự án",
      "Hiểu biết về quy trình phát triển phần mềm",
      "Kinh nghiệm thực tế trong môi trường doanh nghiệp"
    ],
    location: {
      type: "onsite",
      city: "Hà Nội",
      district: "Cầu Giấy",
      address: "17 Duy Tân, Cầu Giấy, Hà Nội",
      country: "VN",
      coordinates: { latitude: 21.0285, longitude: 105.8542 },
      remote: false,
      hybrid: false
    },
    salary: {
      type: "range",
      min: 4000000,
      max: 5000000,
      currency: "VND",
      period: "month",
      isNegotiable: true,
      benefits: ["transportation", "meals", "learning"]
    },
    aiAnalysis: {
      skillsExtracted: ["JavaScript", "React", "HTML", "CSS"],
      difficulty: "intermediate",
      category: "tech",
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      lastAnalyzedAt: new Date(),
      matchingScore: 85
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: false,
      requireReferences: false,
      maxApplications: 50,
      deadline: new Date("2024-05-15"),
      rollingBasis: false,
      questions: [
        {
          question: "Tại sao bạn quan tâm đến vị trí Frontend Developer?",
          required: true,
          type: "textarea"
        },
        {
          question: "Bạn đã có kinh nghiệm với React chưa? Nếu có, hãy mô tả ngắn gọn.",
          required: true,
          type: "text"
        }
      ]
    },
    status: "active",
    isVerified: true,
    isFeatured: true,
    isUrgent: false,
    isHot: true,
    priority: 8,
    stats: {
      views: 150,
      applications: 25,
      saves: 10,
      shares: 5,
      clicks: 30
    },
    seo: {
      keywords: ["frontend", "react", "javascript", "internship", "fpt"],
      metaDescription: "Thực tập Frontend Developer tại FPT Software - Cơ hội học hỏi React và JavaScript"
    },
    contact: {
      name: "Nguyễn Thị Lan",
      email: "lan.nguyen@fpt-software.com",
      phone: "+84 24 7300 5589"
    },
    postedBy: null // Will be set after user creation
  },
  {
    title: "Backend Developer Intern",
    slug: "backend-developer-intern-viettel",
    description: "Tham gia phát triển các hệ thống backend sử dụng Java, Spring Boot và các công nghệ enterprise. Cơ hội học hỏi về microservices và cloud computing.",
    companyId: null,
    jobType: "internship",
    category: "tech",
    subCategory: "Backend Development",
    internship: {
      type: "semester",
      duration: 4,
      startDate: new Date("2024-09-01"),
      endDate: new Date("2024-12-31"),
      isPaid: true,
      stipend: {
        amount: 4500000,
        currency: "VND",
        period: "month",
        isNegotiable: true
      },
      academicCredit: true,
      remoteOption: true,
      flexibleHours: true
    },
    requirements: {
      education: {
        level: "Bachelor",
        majors: ["Computer Science", "Information Technology", "Software Engineering"],
        minGpa: 3.2,
        year: [3, 4]
      },
      skills: [
        {
          skillId: null,
          level: "required",
          importance: 9
        },
        {
          skillId: null,
          level: "required",
          importance: 8
        }
      ],
      experience: {
        minMonths: 0,
        projectBased: true,
        experienceLevel: "beginner"
      },
      languages: [
        {
          language: "Vietnamese",
          level: "fluent"
        },
        {
          language: "English",
          level: "intermediate"
        }
      ],
      age: { min: 18, max: 25 },
      gender: "any"
    },
    description: "Tham gia phát triển các hệ thống backend sử dụng Java, Spring Boot và các công nghệ enterprise. Cơ hội học hỏi về microservices và cloud computing.",
    responsibilities: [
      "Phát triển API và microservices",
      "Thiết kế và tối ưu hóa database",
      "Tham gia code review và testing",
      "Học hỏi về cloud computing và DevOps"
    ],
    jobRequirements: [
      "Kiến thức cơ bản về Java và OOP",
      "Kinh nghiệm với Spring Boot hoặc framework tương tự",
      "Hiểu biết về database và SQL",
      "Khả năng làm việc nhóm và giao tiếp tốt"
    ],
    benefits: [
      "Môi trường làm việc hiện đại",
      "Mentorship từ senior developers",
      "Cơ hội học hỏi về cloud computing",
      "Chứng chỉ thực tập có giá trị"
    ],
    learningOutcomes: [
      "Nắm vững Java và Spring ecosystem",
      "Kỹ năng thiết kế API và microservices",
      "Hiểu biết về cloud computing",
      "Kinh nghiệm thực tế trong môi trường enterprise"
    ],
    location: {
      type: "hybrid",
      city: "Hà Nội",
      district: "Ba Đình",
      address: "1 Giang Văn Minh, Ba Đình, Hà Nội",
      country: "VN",
      coordinates: { latitude: 21.0333, longitude: 105.8333 },
      remote: true,
      hybrid: true
    },
    salary: {
      type: "range",
      min: 4500000,
      max: 5500000,
      currency: "VND",
      period: "month",
      isNegotiable: true,
      benefits: ["transportation", "meals", "learning", "mentorship"]
    },
    aiAnalysis: {
      skillsExtracted: ["Java", "Spring Boot", "SQL", "Microservices"],
      difficulty: "intermediate",
      category: "tech",
      embedding: [0.2, 0.3, 0.4, 0.5, 0.6],
      lastAnalyzedAt: new Date(),
      matchingScore: 80
    },
    applicationSettings: {
      requireCoverLetter: true,
      requireResume: true,
      requirePortfolio: false,
      requireReferences: false,
      maxApplications: 40,
      deadline: new Date("2024-08-15"),
      rollingBasis: false,
      questions: [
        {
          question: "Bạn đã có kinh nghiệm với Java và Spring Boot chưa?",
          required: true,
          type: "text"
        },
        {
          question: "Mô tả một dự án backend bạn đã thực hiện (nếu có).",
          required: false,
          type: "textarea"
        }
      ]
    },
    status: "active",
    isVerified: true,
    isFeatured: true,
    isUrgent: false,
    isHot: false,
    priority: 7,
    stats: {
      views: 120,
      applications: 20,
      saves: 8,
      shares: 3,
      clicks: 25
    },
    seo: {
      keywords: ["backend", "java", "spring", "internship", "viettel"],
      metaDescription: "Thực tập Backend Developer tại Viettel - Học hỏi Java và Spring Boot"
    },
    contact: {
      name: "Trần Văn Minh",
      email: "minh.tran@viettel.com.vn",
      phone: "+84 24 6266 8889"
    },
    postedBy: null
  }
];

module.exports = {
  sampleCompanies,
  sampleSkills,
  sampleJobs
};
