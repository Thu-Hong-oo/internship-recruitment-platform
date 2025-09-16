const companies = [
  {
    name: 'FPT Software',
    description:
      'Công ty phần mềm hàng đầu Việt Nam với hơn 30 năm kinh nghiệm trong lĩnh vực công nghệ thông tin',
    shortDescription: 'Công ty phần mềm hàng đầu Việt Nam',
    industry: {
      primary: 'tech',
      secondary: ['consulting', 'education'],
      tags: ['software', 'outsourcing', 'digital-transformation'],
    },
    size: 'large',
    employeeCount: {
      min: 20000,
      max: 25000,
    },
    companyType: 'private',
    foundedYear: 1988,
    foundedMonth: 9,
    website: 'https://fptsoftware.com',
    logo: {
      url: 'https://fptsoftware.com/assets/images/logo.png',
      filename: 'fpt-software-logo.png',
      uploadedAt: new Date(),
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/fpt-software',
      facebook: 'https://facebook.com/fptsoftware',
      youtube: 'https://youtube.com/fptsoftware',
    },
    location: {
      type: 'multiple',
      headquarters: {
        address: 'FPT Tower, 10 Pham Van Bach, Cau Giay',
        city: 'Ha Noi',
        district: 'Cau Giay',
        country: 'VN',
        coordinates: {
          latitude: 21.0285,
          longitude: 105.8042,
        },
      },
      offices: [
        {
          name: 'FPT Software Ho Chi Minh',
          address: 'FPT Tower, 10 Duy Tan, District 1',
          city: 'Ho Chi Minh',
          district: 'District 1',
          country: 'VN',
          coordinates: {
            latitude: 10.8231,
            longitude: 106.6297,
          },
          isMain: false,
        },
      ],
    },
    contact: {
      email: 'hr@fptsoftware.com',
      phone: '+84 24 7300 9999',
      contactPerson: {
        name: 'Nguyen Thi Mai',
        position: 'HR Manager',
        email: 'mai.nguyen@fptsoftware.com',
        phone: '+84 24 7300 9999',
      },
    },
    culture: {
      values: ['Innovation', 'Excellence', 'Collaboration', 'Learning'],
      mission: 'Đưa công nghệ Việt Nam ra thế giới',
      vision: 'Trở thành công ty công nghệ hàng đầu Đông Nam Á',
      workStyle: ['collaborative', 'agile', 'flexible'],
      dressCode: 'business-casual',
    },
    benefits: [
      {
        name: 'Bảo hiểm sức khỏe',
        description: 'Bảo hiểm sức khỏe toàn diện cho nhân viên và gia đình',
        category: 'health',
        isHighlighted: true,
      },
      {
        name: 'Đào tạo miễn phí',
        description: 'Các khóa đào tạo công nghệ mới nhất',
        category: 'learning',
        isHighlighted: true,
      },
      {
        name: 'Lương thưởng cạnh tranh',
        description: 'Mức lương và thưởng theo hiệu suất công việc',
        category: 'financial',
        isHighlighted: true,
      },
    ],
    internshipProgram: {
      hasProgram: true,
      programName: 'FPT Software Internship Program',
      description:
        'Chương trình thực tập toàn diện với mentorship từ chuyên gia',
      duration: {
        min: 3,
        max: 6,
        unit: 'months',
      },
      stipend: {
        hasStipend: true,
        amount: {
          min: 5000000,
          max: 8000000,
        },
        currency: 'VND',
        period: 'month',
      },
      benefits: ['Mentorship', 'Networking', 'Employment Opportunity'],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true,
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: 'document',
    },
    status: 'active',
    rating: {
      overall: 4.2,
      count: 1250,
      categories: {
        workLifeBalance: 3.8,
        careerGrowth: 4.5,
        compensation: 4.0,
        management: 4.1,
        culture: 4.3,
      },
    },
    stats: {
      totalJobs: 45,
      activeJobs: 12,
      totalApplications: 1250,
      totalInterns: 300,
      totalEmployees: 22000,
      views: 15000,
      saves: 850,
    },
    seo: {
      keywords: [
        'FPT Software',
        'công ty phần mềm',
        'thực tập IT',
        'outsourcing',
      ],
      metaDescription:
        'FPT Software - Công ty phần mềm hàng đầu Việt Nam với cơ hội thực tập và việc làm hấp dẫn',
    },
  },
  {
    name: 'Viettel',
    description:
      'Tập đoàn viễn thông quân đội, nhà mạng lớn nhất Việt Nam với hơn 100 triệu thuê bao',
    shortDescription: 'Nhà mạng lớn nhất Việt Nam',
    industry: {
      primary: 'tech',
      secondary: ['telecommunications'],
      tags: ['telecom', 'digital', 'innovation'],
    },
    size: 'enterprise',
    employeeCount: {
      min: 80000,
      max: 100000,
    },
    companyType: 'government',
    foundedYear: 1989,
    foundedMonth: 6,
    website: 'https://viettel.com.vn',
    logo: {
      url: 'https://viettel.com.vn/assets/images/logo.png',
      filename: 'viettel-logo.png',
      uploadedAt: new Date(),
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/viettel',
      facebook: 'https://facebook.com/viettel',
      youtube: 'https://youtube.com/viettel',
    },
    location: {
      type: 'multiple',
      headquarters: {
        address: '1 Trang Thi, Hoan Kiem',
        city: 'Ha Noi',
        district: 'Hoan Kiem',
        country: 'VN',
        coordinates: {
          latitude: 21.0285,
          longitude: 105.8042,
        },
      },
    },
    contact: {
      email: 'hr@viettel.com.vn',
      phone: '+84 24 6262 6262',
      contactPerson: {
        name: 'Tran Van Nam',
        position: 'Talent Acquisition Manager',
        email: 'nam.tran@viettel.com.vn',
        phone: '+84 24 6262 6262',
      },
    },
    culture: {
      values: ['Innovation', 'Excellence', 'Service', 'Growth'],
      mission: 'Đưa Việt Nam vào top 20 nước phát triển nhất thế giới',
      vision: 'Trở thành tập đoàn công nghệ số hàng đầu Đông Nam Á',
      workStyle: ['collaborative', 'traditional', 'flexible'],
      dressCode: 'business-casual',
    },
    benefits: [
      {
        name: 'Bảo hiểm toàn diện',
        description: 'Bảo hiểm sức khỏe, bảo hiểm nhân thọ',
        category: 'health',
        isHighlighted: true,
      },
      {
        name: 'Phát triển nghề nghiệp',
        description: 'Cơ hội thăng tiến và đào tạo liên tục',
        category: 'career',
        isHighlighted: true,
      },
    ],
    internshipProgram: {
      hasProgram: true,
      programName: 'Viettel Future Leaders',
      description: 'Chương trình thực tập dành cho sinh viên xuất sắc',
      duration: {
        min: 2,
        max: 4,
        unit: 'months',
      },
      stipend: {
        hasStipend: true,
        amount: {
          min: 4000000,
          max: 6000000,
        },
        currency: 'VND',
        period: 'month',
      },
      benefits: ['Mentorship', 'Networking', 'Employment Opportunity'],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true,
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: 'document',
    },
    status: 'active',
    rating: {
      overall: 4.0,
      count: 2100,
      categories: {
        workLifeBalance: 3.5,
        careerGrowth: 4.2,
        compensation: 4.3,
        management: 3.8,
        culture: 4.1,
      },
    },
    stats: {
      totalJobs: 38,
      activeJobs: 15,
      totalApplications: 1800,
      totalInterns: 250,
      totalEmployees: 90000,
      views: 22000,
      saves: 1200,
    },
    seo: {
      keywords: ['Viettel', 'viễn thông', 'thực tập', 'telecom'],
      metaDescription:
        'Viettel - Tập đoàn viễn thông quân đội với cơ hội thực tập và việc làm hấp dẫn',
    },
  },
  {
    name: 'VNG Corporation',
    description:
      'Công ty internet hàng đầu Việt Nam, sở hữu các sản phẩm như Zalo, Zing, VNG Cloud',
    shortDescription: 'Công ty internet hàng đầu Việt Nam',
    industry: {
      primary: 'tech',
      secondary: ['entertainment'],
      tags: ['internet', 'gaming', 'social-media', 'cloud'],
    },
    size: 'large',
    employeeCount: {
      min: 3000,
      max: 4000,
    },
    companyType: 'private',
    foundedYear: 2004,
    foundedMonth: 9,
    website: 'https://vng.com.vn',
    logo: {
      url: 'https://vng.com.vn/assets/images/logo.png',
      filename: 'vng-logo.png',
      uploadedAt: new Date(),
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/vng-corporation',
      facebook: 'https://facebook.com/vngcorporation',
    },
    location: {
      type: 'multiple',
      headquarters: {
        address: 'VNG Campus, Zone 9, Tan Thuan Dong, District 7',
        city: 'Ho Chi Minh',
        district: 'District 7',
        country: 'VN',
        coordinates: {
          latitude: 10.7321,
          longitude: 106.7227,
        },
      },
    },
    contact: {
      email: 'hr@vng.com.vn',
      phone: '+84 28 7300 9999',
      contactPerson: {
        name: 'Le Thi Hoa',
        position: 'HR Director',
        email: 'hoa.le@vng.com.vn',
        phone: '+84 28 7300 9999',
      },
    },
    culture: {
      values: ['Innovation', 'User-Centric', 'Excellence', 'Growth'],
      mission: 'Đưa Việt Nam lên bản đồ công nghệ thế giới',
      vision: 'Trở thành công ty internet hàng đầu Đông Nam Á',
      workStyle: ['collaborative', 'agile', 'flexible', 'remote-first'],
      dressCode: 'casual',
    },
    benefits: [
      {
        name: 'Môi trường trẻ trung',
        description: 'Môi trường làm việc năng động, sáng tạo',
        category: 'work-life',
        isHighlighted: true,
      },
      {
        name: 'Lương thưởng hấp dẫn',
        description: 'Mức lương cạnh tranh và thưởng theo hiệu suất',
        category: 'financial',
        isHighlighted: true,
      },
      {
        name: 'Đào tạo liên tục',
        description: 'Các khóa đào tạo công nghệ mới nhất',
        category: 'learning',
        isHighlighted: true,
      },
    ],
    internshipProgram: {
      hasProgram: true,
      programName: 'VNG Summer Internship',
      description: 'Chương trình thực tập mùa hè với các dự án thực tế',
      duration: {
        min: 2,
        max: 3,
        unit: 'months',
      },
      stipend: {
        hasStipend: true,
        amount: {
          min: 6000000,
          max: 10000000,
        },
        currency: 'VND',
        period: 'month',
      },
      benefits: ['Real Projects', 'Mentorship', 'Employment Opportunity'],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true,
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: 'document',
    },
    status: 'active',
    rating: {
      overall: 4.5,
      count: 850,
      categories: {
        workLifeBalance: 4.2,
        careerGrowth: 4.7,
        compensation: 4.6,
        management: 4.3,
        culture: 4.8,
      },
    },
    stats: {
      totalJobs: 25,
      activeJobs: 8,
      totalApplications: 950,
      totalInterns: 120,
      totalEmployees: 3500,
      views: 18000,
      saves: 1100,
    },
    seo: {
      keywords: ['VNG', 'internet', 'Zalo', 'thực tập công nghệ'],
      metaDescription:
        'VNG Corporation - Công ty internet hàng đầu Việt Nam với cơ hội thực tập hấp dẫn',
    },
  },
  {
    name: 'Tiki',
    description:
      'Sàn thương mại điện tử hàng đầu Việt Nam với hơn 10 triệu sản phẩm',
    shortDescription: 'Sàn thương mại điện tử hàng đầu',
    industry: {
      primary: 'retail',
      secondary: ['tech', 'ecommerce'],
      tags: ['ecommerce', 'retail', 'logistics', 'digital'],
    },
    size: 'large',
    employeeCount: {
      min: 2000,
      max: 3000,
    },
    companyType: 'private',
    foundedYear: 2010,
    foundedMonth: 3,
    website: 'https://tiki.vn',
    logo: {
      url: 'https://tiki.vn/assets/images/logo.png',
      filename: 'tiki-logo.png',
      uploadedAt: new Date(),
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/tiki',
      facebook: 'https://facebook.com/tiki',
      instagram: 'https://instagram.com/tiki',
    },
    location: {
      type: 'multiple',
      headquarters: {
        address: 'Tiki Office, 123 Nguyen Van Linh, District 7',
        city: 'Ho Chi Minh',
        district: 'District 7',
        country: 'VN',
        coordinates: {
          latitude: 10.7321,
          longitude: 106.7227,
        },
      },
    },
    contact: {
      email: 'hr@tiki.vn',
      phone: '+84 28 7300 8888',
      contactPerson: {
        name: 'Pham Van Minh',
        position: 'Talent Acquisition',
        email: 'minh.pham@tiki.vn',
        phone: '+84 28 7300 8888',
      },
    },
    culture: {
      values: ['Customer First', 'Innovation', 'Excellence', 'Growth'],
      mission: 'Mang lại trải nghiệm mua sắm tốt nhất cho người Việt',
      vision: 'Trở thành nền tảng thương mại điện tử số 1 Việt Nam',
      workStyle: ['collaborative', 'agile', 'flexible'],
      dressCode: 'casual',
    },
    benefits: [
      {
        name: 'Môi trường năng động',
        description: 'Môi trường làm việc trẻ trung, sáng tạo',
        category: 'work-life',
        isHighlighted: true,
      },
      {
        name: 'Phát triển nghề nghiệp',
        description: 'Cơ hội thăng tiến và học hỏi từ chuyên gia',
        category: 'career',
        isHighlighted: true,
      },
    ],
    internshipProgram: {
      hasProgram: true,
      programName: 'Tiki Future Leaders',
      description: 'Chương trình thực tập dành cho sinh viên xuất sắc',
      duration: {
        min: 3,
        max: 6,
        unit: 'months',
      },
      stipend: {
        hasStipend: true,
        amount: {
          min: 5000000,
          max: 8000000,
        },
        currency: 'VND',
        period: 'month',
      },
      benefits: ['Real Projects', 'Mentorship', 'Employment Opportunity'],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true,
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: 'document',
    },
    status: 'active',
    rating: {
      overall: 4.1,
      count: 650,
      categories: {
        workLifeBalance: 3.8,
        careerGrowth: 4.3,
        compensation: 4.2,
        management: 4.0,
        culture: 4.4,
      },
    },
    stats: {
      totalJobs: 20,
      activeJobs: 6,
      totalApplications: 750,
      totalInterns: 80,
      totalEmployees: 2500,
      views: 12000,
      saves: 800,
    },
    seo: {
      keywords: ['Tiki', 'ecommerce', 'thương mại điện tử', 'thực tập'],
      metaDescription:
        'Tiki - Sàn thương mại điện tử hàng đầu với cơ hội thực tập và việc làm hấp dẫn',
    },
  },
  {
    name: 'Grab Vietnam',
    description:
      'Công ty công nghệ đa nền tảng hàng đầu Đông Nam Á, cung cấp dịch vụ giao hàng, giao đồ ăn và di chuyển',
    shortDescription: 'Công ty công nghệ đa nền tảng',
    industry: {
      primary: 'tech',
      secondary: ['transportation', 'logistics'],
      tags: ['ride-hailing', 'food-delivery', 'logistics', 'fintech'],
    },
    size: 'large',
    employeeCount: {
      min: 1500,
      max: 2000,
    },
    companyType: 'multinational',
    foundedYear: 2012,
    foundedMonth: 6,
    website: 'https://grab.com/vn',
    logo: {
      url: 'https://grab.com/vn/assets/images/logo.png',
      filename: 'grab-logo.png',
      uploadedAt: new Date(),
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/grab',
      facebook: 'https://facebook.com/grab',
      instagram: 'https://instagram.com/grab',
    },
    location: {
      type: 'multiple',
      headquarters: {
        address: 'Grab Office, 123 Le Loi, District 1',
        city: 'Ho Chi Minh',
        district: 'District 1',
        country: 'VN',
        coordinates: {
          latitude: 10.7769,
          longitude: 106.7009,
        },
      },
    },
    contact: {
      email: 'hr@grab.com',
      phone: '+84 28 7300 7777',
      contactPerson: {
        name: 'Nguyen Thi Lan',
        position: 'HR Manager',
        email: 'lan.nguyen@grab.com',
        phone: '+84 28 7300 7777',
      },
    },
    culture: {
      values: ['Customer First', 'Innovation', 'Excellence', 'Growth'],
      mission: 'Mang lại cuộc sống tốt hơn cho mọi người',
      vision: 'Trở thành siêu ứng dụng hàng đầu Đông Nam Á',
      workStyle: ['collaborative', 'agile', 'flexible', 'remote-first'],
      dressCode: 'casual',
    },
    benefits: [
      {
        name: 'Môi trường quốc tế',
        description: 'Làm việc trong môi trường đa văn hóa',
        category: 'work-life',
        isHighlighted: true,
      },
      {
        name: 'Lương thưởng cạnh tranh',
        description: 'Mức lương và thưởng theo tiêu chuẩn quốc tế',
        category: 'financial',
        isHighlighted: true,
      },
      {
        name: 'Đào tạo toàn cầu',
        description: 'Cơ hội học hỏi từ chuyên gia toàn cầu',
        category: 'learning',
        isHighlighted: true,
      },
    ],
    internshipProgram: {
      hasProgram: true,
      programName: 'Grab Internship Program',
      description: 'Chương trình thực tập với các dự án thực tế',
      duration: {
        min: 3,
        max: 6,
        unit: 'months',
      },
      stipend: {
        hasStipend: true,
        amount: {
          min: 7000000,
          max: 12000000,
        },
        currency: 'VND',
        period: 'month',
      },
      benefits: ['Real Projects', 'Mentorship', 'Networking'],
      mentorship: true,
      networking: true,
      employmentOpportunity: true,
      academicCredit: true,
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: 'document',
    },
    status: 'active',
    rating: {
      overall: 4.3,
      count: 450,
      categories: {
        workLifeBalance: 4.0,
        careerGrowth: 4.5,
        compensation: 4.4,
        management: 4.2,
        culture: 4.6,
      },
    },
    stats: {
      totalJobs: 18,
      activeJobs: 5,
      totalApplications: 600,
      totalInterns: 60,
      totalEmployees: 1800,
      views: 15000,
      saves: 950,
    },
    seo: {
      keywords: ['Grab', 'ride-hailing', 'food-delivery', 'thực tập công nghệ'],
      metaDescription:
        'Grab Vietnam - Công ty công nghệ đa nền tảng với cơ hội thực tập hấp dẫn',
    },
  },
];

module.exports = companies;
