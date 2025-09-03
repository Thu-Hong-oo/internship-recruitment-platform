const sampleJobs = [
  {
    title: 'Frontend Developer Intern',
    description: 'Chúng tôi đang tìm kiếm một Frontend Developer Intern để tham gia phát triển các ứng dụng web hiện đại. Bạn sẽ được làm việc với các công nghệ như React, Vue.js, TypeScript và các thư viện UI hiện đại.',
    company: 'FPT Software',
    location: {
      city: 'Hanoi',
      state: 'Hanoi',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 5000000,
      max: 8000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Technology', 'Software Engineering']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'JavaScript',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'HTML/CSS',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'React',
            level: 'beginner',
            priority: 'nice-to-have'
          },
          {
            name: 'Git',
            level: 'beginner',
            priority: 'must-have'
          }
        ],
        preferred: ['TypeScript', 'Vue.js', 'Tailwind CSS', 'REST API']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Môi trường làm việc trẻ trung, năng động',
      'Được đào tạo công nghệ mới nhất',
      'Cơ hội chuyển thành nhân viên chính thức',
      'Lương thưởng hấp dẫn',
      'Bảo hiểm sức khỏe'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-01-15'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'hr@fptsoftware.com',
      phone: '+84 24 7300 9999',
      website: 'https://fptsoftware.com/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 1250,
    applicationCount: 89,
    tags: ['Frontend', 'React', 'JavaScript', 'Internship', 'Hanoi'],
    aiAnalysis: {
      skillsExtracted: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'TypeScript'],
      difficultyLevel: 'entry',
      matchingScore: 85,
      keywords: ['frontend', 'react', 'javascript', 'internship'],
      category: 'Frontend Development',
      estimatedApplications: 100
    }
  },
  {
    title: 'Backend Developer Intern',
    description: 'Tham gia phát triển backend cho các ứng dụng web và mobile. Bạn sẽ được làm việc với Node.js, Python, databases và cloud services.',
    company: 'VNG Corporation',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 6000000,
      max: 9000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Technology', 'Software Engineering']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'Python',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Node.js',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'SQL',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'REST API',
            level: 'beginner',
            priority: 'must-have'
          }
        ],
        preferred: ['MongoDB', 'Redis', 'Docker', 'AWS', 'Microservices']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Làm việc với sản phẩm có hàng triệu người dùng',
      'Môi trường startup năng động',
      'Đào tạo công nghệ mới nhất',
      'Lương thưởng hấp dẫn',
      'Cơ hội thăng tiến'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-01-20'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'hr@vng.com.vn',
      phone: '+84 28 7300 9999',
      website: 'https://vng.com.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 980,
    applicationCount: 67,
    tags: ['Backend', 'Python', 'Node.js', 'Internship', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Python', 'Node.js', 'SQL', 'REST API', 'MongoDB'],
      difficultyLevel: 'entry',
      matchingScore: 82,
      keywords: ['backend', 'python', 'nodejs', 'internship'],
      category: 'Backend Development',
      estimatedApplications: 80
    }
  },
  {
    title: 'Mobile Developer Intern (React Native)',
    description: 'Tham gia phát triển ứng dụng mobile cross-platform sử dụng React Native. Bạn sẽ được làm việc với các sản phẩm có hàng triệu người dùng.',
    company: 'Grab Vietnam',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 7000000,
      max: 10000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Technology', 'Software Engineering']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'React Native',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'JavaScript',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Mobile Development',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Git',
            level: 'beginner',
            priority: 'must-have'
          }
        ],
        preferred: ['TypeScript', 'Redux', 'Firebase', 'App Store', 'Google Play']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Môi trường quốc tế đa văn hóa',
      'Tiếp cận công nghệ AI/ML hàng đầu',
      'Lương USD cạnh tranh',
      'Đào tạo chuyên sâu',
      'Cơ hội thăng tiến'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-02-01'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'vietnam.careers@grab.com',
      phone: '+84 28 7300 7777',
      website: 'https://grab.com/vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 1450,
    applicationCount: 123,
    tags: ['Mobile', 'React Native', 'JavaScript', 'Internship', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['React Native', 'JavaScript', 'Mobile Development', 'Git'],
      difficultyLevel: 'entry',
      matchingScore: 88,
      keywords: ['mobile', 'react native', 'javascript', 'internship'],
      category: 'Mobile Development',
      estimatedApplications: 120
    }
  },
  {
    title: 'Data Science Intern',
    description: 'Tham gia phân tích dữ liệu và xây dựng các mô hình machine learning cho các sản phẩm e-commerce. Bạn sẽ được làm việc với big data và AI.',
    company: 'Shopee Vietnam',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 8000000,
      max: 12000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Mathematics', 'Statistics', 'Data Science']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'Python',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Machine Learning',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'SQL',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Statistics',
            level: 'intermediate',
            priority: 'must-have'
          }
        ],
        preferred: ['TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Làm việc với big data thực tế',
      'Tiếp cận công nghệ AI/ML mới nhất',
      'Môi trường quốc tế',
      'Lương cạnh tranh',
      'Đào tạo chuyên sâu'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-02-15'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'vietnam.careers@shopee.com',
      phone: '+84 28 7300 6666',
      website: 'https://shopee.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 2100,
    applicationCount: 156,
    tags: ['Data Science', 'Machine Learning', 'Python', 'Internship', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow'],
      difficultyLevel: 'entry',
      matchingScore: 90,
      keywords: ['data science', 'machine learning', 'python', 'internship'],
      category: 'Data Science',
      estimatedApplications: 150
    }
  },
  {
    title: 'UI/UX Designer Intern',
    description: 'Tham gia thiết kế giao diện người dùng và trải nghiệm người dùng cho các sản phẩm fintech. Bạn sẽ được làm việc với các công cụ thiết kế hiện đại.',
    company: 'MoMo',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 5000000,
      max: 8000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Design', 'Graphic Design', 'Digital Arts', 'Computer Science']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'Figma',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Adobe Creative Suite',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'User Research',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Prototyping',
            level: 'beginner',
            priority: 'must-have'
          }
        ],
        preferred: ['Sketch', 'InVision', 'User Testing', 'Design Systems']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Tiếp cận công nghệ fintech hàng đầu',
      'Môi trường startup năng động',
      'Đào tạo kỹ năng thiết kế',
      'Lương thưởng hấp dẫn',
      'Cơ hội thăng tiến'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-01-25'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'careers@momo.vn',
      phone: '+84 28 7300 5555',
      website: 'https://momo.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 890,
    applicationCount: 45,
    tags: ['UI/UX', 'Design', 'Figma', 'Internship', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
      difficultyLevel: 'entry',
      matchingScore: 78,
      keywords: ['ui/ux', 'design', 'figma', 'internship'],
      category: 'UI/UX Design',
      estimatedApplications: 50
    }
  },
  {
    title: 'DevOps Engineer Intern',
    description: 'Tham gia xây dựng và quản lý infrastructure cho các ứng dụng web. Bạn sẽ được làm việc với cloud services, containers và automation.',
    company: 'Viettel',
    location: {
      city: 'Hanoi',
      state: 'Hanoi',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 6000000,
      max: 9000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Technology', 'Network Engineering']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'Linux',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Docker',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Git',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Shell Scripting',
            level: 'beginner',
            priority: 'must-have'
          }
        ],
        preferred: ['Kubernetes', 'AWS', 'CI/CD', 'Monitoring', 'Ansible']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Làm việc với infrastructure quy mô lớn',
      'Lương thưởng cao',
      'Bảo hiểm toàn diện',
      'Cơ hội thăng tiến',
      'Đào tạo liên tục'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-02-10'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'tuyendung@viettel.com.vn',
      phone: '+84 24 6266 6666',
      website: 'https://viettel.com.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 750,
    applicationCount: 38,
    tags: ['DevOps', 'Linux', 'Docker', 'Internship', 'Hanoi'],
    aiAnalysis: {
      skillsExtracted: ['Linux', 'Docker', 'Git', 'Shell Scripting', 'Kubernetes'],
      difficultyLevel: 'entry',
      matchingScore: 85,
      keywords: ['devops', 'linux', 'docker', 'internship'],
      category: 'DevOps',
      estimatedApplications: 40
    }
  },
  {
    title: 'Product Manager Intern',
    description: 'Tham gia quản lý sản phẩm và phát triển chiến lược sản phẩm. Bạn sẽ được làm việc với các sản phẩm có hàng triệu người dùng.',
    company: 'Tiki',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 7000000,
      max: 10000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Business Administration', 'Marketing', 'Computer Science', 'Economics']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'Product Management',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Data Analysis',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'User Research',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Project Management',
            level: 'beginner',
            priority: 'must-have'
          }
        ],
        preferred: ['SQL', 'Google Analytics', 'A/B Testing', 'Agile', 'Jira']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Làm việc với sản phẩm thực tế',
      'Môi trường trẻ trung, năng động',
      'Đào tạo kỹ năng quản lý sản phẩm',
      'Thưởng dự án',
      'Cơ hội thăng tiến'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-02-20'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'careers@tiki.vn',
      phone: '+84 28 7300 8888',
      website: 'https://tiki.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 1100,
    applicationCount: 78,
    tags: ['Product Management', 'Data Analysis', 'User Research', 'Internship', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Product Management', 'Data Analysis', 'User Research', 'Project Management'],
      difficultyLevel: 'entry',
      matchingScore: 82,
      keywords: ['product management', 'data analysis', 'internship'],
      category: 'Product Management',
      estimatedApplications: 80
    }
  },
  {
    title: 'Cybersecurity Intern',
    description: 'Tham gia bảo vệ hệ thống và dữ liệu khỏi các mối đe dọa bảo mật. Bạn sẽ được làm việc với các công nghệ bảo mật tiên tiến.',
    company: 'Bkav',
    location: {
      city: 'Hanoi',
      state: 'Hanoi',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 5000000,
      max: 8000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Security', 'Network Security']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'Network Security',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Linux',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Python',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Security Tools',
            level: 'beginner',
            priority: 'must-have'
          }
        ],
        preferred: ['Wireshark', 'Metasploit', 'Nmap', 'SIEM', 'Penetration Testing']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Làm việc với công nghệ bảo mật tiên tiến',
      'Đào tạo chuyên sâu về cybersecurity',
      'Lương thưởng hấp dẫn',
      'Môi trường chuyên nghiệp',
      'Cơ hội thăng tiến'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-02-05'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'hr@bkav.com.vn',
      phone: '+84 24 7300 3333',
      website: 'https://bkav.com.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 650,
    applicationCount: 29,
    tags: ['Cybersecurity', 'Network Security', 'Python', 'Internship', 'Hanoi'],
    aiAnalysis: {
      skillsExtracted: ['Network Security', 'Linux', 'Python', 'Security Tools'],
      difficultyLevel: 'entry',
      matchingScore: 80,
      keywords: ['cybersecurity', 'network security', 'python', 'internship'],
      category: 'Cybersecurity',
      estimatedApplications: 30
    }
  },
  {
    title: 'Full Stack Developer Intern',
    description: 'Tham gia phát triển toàn bộ ứng dụng web từ frontend đến backend. Bạn sẽ được làm việc với các công nghệ hiện đại và thực tế.',
    company: 'CMC Technology',
    location: {
      city: 'Hanoi',
      state: 'Hanoi',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'internship',
    salaryRange: {
      min: 6000000,
      max: 9000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Technology', 'Software Engineering']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'JavaScript',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Node.js',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'React',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'SQL',
            level: 'intermediate',
            priority: 'must-have'
          }
        ],
        preferred: ['TypeScript', 'MongoDB', 'Express.js', 'Docker', 'AWS']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Tiếp cận nhiều công nghệ khác nhau',
      'Đào tạo liên tục',
      'Lương thưởng hấp dẫn',
      'Môi trường chuyên nghiệp',
      'Cơ hội thăng tiến'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-02-15'),
    duration: {
      months: 6,
      description: 'Thực tập 6 tháng với khả năng chuyển thành nhân viên chính thức'
    },
    contactInfo: {
      email: 'hr@cmctechnology.vn',
      phone: '+84 24 7300 2222',
      website: 'https://cmctechnology.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 920,
    applicationCount: 52,
    tags: ['Full Stack', 'JavaScript', 'Node.js', 'React', 'Internship', 'Hanoi'],
    aiAnalysis: {
      skillsExtracted: ['JavaScript', 'Node.js', 'React', 'SQL', 'TypeScript'],
      difficultyLevel: 'entry',
      matchingScore: 87,
      keywords: ['full stack', 'javascript', 'nodejs', 'react', 'internship'],
      category: 'Full Stack Development',
      estimatedApplications: 55
    }
  },
  
  // Bổ sung thêm các job không phải internship
  {
    title: 'Junior Frontend Developer',
    description: 'Tuyển dụng Frontend Developer có kinh nghiệm 1-2 năm để tham gia phát triển các ứng dụng web hiện đại. Bạn sẽ được làm việc với React, TypeScript và các thư viện UI tiên tiến.',
    company: 'FPT Software',
    location: {
      city: 'Hanoi',
      state: 'Hanoi',
      country: 'Vietnam',
      remote: true
    },
    employmentType: 'full-time',
    salaryRange: {
      min: 15000000,
      max: 25000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Technology', 'Software Engineering']
      },
      experience: {
        years: 1,
        level: 'junior'
      },
      skills: {
        required: [
          {
            name: 'React',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'TypeScript',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'JavaScript',
            level: 'advanced',
            priority: 'must-have'
          },
          {
            name: 'HTML/CSS',
            level: 'advanced',
            priority: 'must-have'
          }
        ],
        preferred: ['Vue.js', 'Next.js', 'Tailwind CSS', 'Redux', 'Jest']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'fluent'
        }
      ]
    },
    benefits: [
      'Lương cạnh tranh trong ngành',
      'Làm việc remote linh hoạt',
      'Đào tạo công nghệ mới nhất',
      'Bảo hiểm sức khỏe toàn diện',
      'Cơ hội thăng tiến nhanh'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-03-01'),
    duration: {
      months: null,
      description: 'Vị trí full-time dài hạn'
    },
    contactInfo: {
      email: 'hr@fptsoftware.com',
      phone: '+84 24 7300 9999',
      website: 'https://fptsoftware.com/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 2100,
    applicationCount: 156,
    tags: ['Frontend', 'React', 'TypeScript', 'Full-time', 'Remote', 'Hanoi'],
    aiAnalysis: {
      skillsExtracted: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
      difficultyLevel: 'junior',
      matchingScore: 92,
      keywords: ['frontend', 'react', 'typescript', 'full-time', 'junior'],
      category: 'Frontend Development',
      estimatedApplications: 150
    }
  },
  {
    title: 'Mid-level Backend Developer',
    description: 'Tuyển dụng Backend Developer có kinh nghiệm 3-5 năm để tham gia phát triển hệ thống backend cho các ứng dụng quy mô lớn. Bạn sẽ được làm việc với microservices, cloud và database.',
    company: 'VNG Corporation',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: false
    },
    employmentType: 'full-time',
    salaryRange: {
      min: 30000000,
      max: 45000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Computer Science', 'Information Technology', 'Software Engineering']
      },
      experience: {
        years: 3,
        level: 'mid'
      },
      skills: {
        required: [
          {
            name: 'Node.js',
            level: 'advanced',
            priority: 'must-have'
          },
          {
            name: 'Python',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'MongoDB',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Microservices',
            level: 'intermediate',
            priority: 'must-have'
          }
        ],
        preferred: ['Docker', 'Kubernetes', 'Redis', 'RabbitMQ', 'AWS']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'fluent'
        }
      ]
    },
    benefits: [
      'Lương cao cạnh tranh',
      'Làm việc với sản phẩm có hàng triệu người dùng',
      'Môi trường startup năng động',
      'Thưởng cổ phiếu hấp dẫn',
      'Đào tạo công nghệ tiên tiến'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-03-15'),
    duration: {
      months: null,
      description: 'Vị trí full-time dài hạn'
    },
    contactInfo: {
      email: 'hr@vng.com.vn',
      phone: '+84 28 7300 9999',
      website: 'https://vng.com.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 1800,
    applicationCount: 89,
    tags: ['Backend', 'Node.js', 'Python', 'Microservices', 'Full-time', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Node.js', 'Python', 'MongoDB', 'Microservices', 'Docker'],
      difficultyLevel: 'mid',
      matchingScore: 88,
      keywords: ['backend', 'nodejs', 'python', 'microservices', 'mid-level'],
      category: 'Backend Development',
      estimatedApplications: 90
    }
  },
  {
    title: 'Senior Data Engineer',
    description: 'Tuyển dụng Data Engineer có kinh nghiệm 5+ năm để xây dựng và quản lý data pipeline, data warehouse cho các sản phẩm AI/ML. Bạn sẽ được làm việc với big data và cloud infrastructure.',
    company: 'Shopee Vietnam',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: true
    },
    employmentType: 'full-time',
    salaryRange: {
      min: 50000000,
      max: 80000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'master',
        field: ['Computer Science', 'Data Science', 'Information Technology']
      },
      experience: {
        years: 5,
        level: 'senior'
      },
      skills: {
        required: [
          {
            name: 'Python',
            level: 'advanced',
            priority: 'must-have'
          },
          {
            name: 'Apache Spark',
            level: 'advanced',
            priority: 'must-have'
          },
          {
            name: 'Data Pipeline',
            level: 'advanced',
            priority: 'must-have'
          },
          {
            name: 'SQL',
            level: 'advanced',
            priority: 'must-have'
          }
        ],
        preferred: ['Airflow', 'Kafka', 'Hadoop', 'AWS', 'Machine Learning']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'native'
        }
      ]
    },
    benefits: [
      'Lương cao nhất ngành',
      'Làm việc remote toàn thời gian',
      'Tiếp cận công nghệ AI/ML hàng đầu',
      'Môi trường quốc tế đa văn hóa',
      'Thưởng dự án hấp dẫn'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-04-01'),
    duration: {
      months: null,
      description: 'Vị trí full-time dài hạn'
    },
    contactInfo: {
      email: 'vietnam.careers@shopee.com',
      phone: '+84 28 7300 6666',
      website: 'https://shopee.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 3200,
    applicationCount: 234,
    tags: ['Data Engineering', 'Python', 'Spark', 'Senior', 'Full-time', 'Remote', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Python', 'Apache Spark', 'Data Pipeline', 'SQL', 'Airflow'],
      difficultyLevel: 'senior',
      matchingScore: 95,
      keywords: ['data engineering', 'python', 'spark', 'senior', 'big data'],
      category: 'Data Engineering',
      estimatedApplications: 230
    }
  },
  {
    title: 'Part-time Content Writer',
    description: 'Tuyển dụng Content Writer làm việc part-time để viết nội dung cho blog công nghệ, hướng dẫn sử dụng sản phẩm và marketing content. Phù hợp cho sinh viên hoặc freelancer.',
    company: 'Tiki',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: true
    },
    employmentType: 'part-time',
    salaryRange: {
      min: 200000,
      max: 500000,
      currency: 'VND',
      period: 'hourly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Marketing', 'Journalism', 'Literature', 'Computer Science']
      },
      experience: {
        years: 0,
        level: 'entry'
      },
      skills: {
        required: [
          {
            name: 'Content Writing',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Vietnamese',
            level: 'native',
            priority: 'must-have'
          },
          {
            name: 'SEO',
            level: 'beginner',
            priority: 'must-have'
          },
          {
            name: 'Research',
            level: 'intermediate',
            priority: 'must-have'
          }
        ],
        preferred: ['English', 'Social Media', 'Copywriting', 'Analytics']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'native'
        },
        {
          name: 'English',
          level: 'conversational'
        }
      ]
    },
    benefits: [
      'Làm việc linh hoạt theo giờ',
      'Làm việc remote hoàn toàn',
      'Tiếp cận sản phẩm thực tế',
      'Cơ hội học hỏi về e-commerce',
      'Thưởng dựa trên hiệu suất'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-02-01'),
    duration: {
      months: 12,
      description: 'Hợp đồng part-time 12 tháng, có thể gia hạn'
    },
    contactInfo: {
      email: 'careers@tiki.vn',
      phone: '+84 28 7300 8888',
      website: 'https://tiki.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 650,
    applicationCount: 45,
    tags: ['Content Writing', 'Part-time', 'Remote', 'SEO', 'Marketing', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Content Writing', 'Vietnamese', 'SEO', 'Research', 'English'],
      difficultyLevel: 'entry',
      matchingScore: 75,
      keywords: ['content writing', 'part-time', 'remote', 'seo', 'marketing'],
      category: 'Content & Marketing',
      estimatedApplications: 50
    }
  },
  {
    title: 'Contract UI/UX Designer',
    description: 'Tuyển dụng UI/UX Designer làm việc theo dự án để thiết kế giao diện cho ứng dụng mobile và web. Dự án kéo dài 3-6 tháng với khả năng gia hạn.',
    company: 'MoMo',
    location: {
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      country: 'Vietnam',
      remote: true
    },
    employmentType: 'contract',
    salaryRange: {
      min: 25000000,
      max: 40000000,
      currency: 'VND',
      period: 'monthly'
    },
    requirements: {
      education: {
        level: 'bachelor',
        field: ['Design', 'Graphic Design', 'Digital Arts', 'Computer Science']
      },
      experience: {
        years: 2,
        level: 'junior'
      },
      skills: {
        required: [
          {
            name: 'Figma',
            level: 'advanced',
            priority: 'must-have'
          },
          {
            name: 'UI/UX Design',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'Prototyping',
            level: 'intermediate',
            priority: 'must-have'
          },
          {
            name: 'User Research',
            level: 'intermediate',
            priority: 'must-have'
          }
        ],
        preferred: ['Sketch', 'Adobe Creative Suite', 'Design Systems', 'User Testing']
      },
      languages: [
        {
          name: 'Vietnamese',
          level: 'fluent'
        },
        {
          name: 'English',
          level: 'fluent'
        }
      ]
    },
    benefits: [
      'Lương cạnh tranh theo dự án',
      'Làm việc remote linh hoạt',
      'Tiếp cận công nghệ fintech hàng đầu',
      'Portfolio đa dạng',
      'Cơ hội chuyển thành full-time'
    ],
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2024-03-01'),
    duration: {
      months: 6,
      description: 'Hợp đồng 6 tháng, có thể gia hạn'
    },
    contactInfo: {
      email: 'careers@momo.vn',
      phone: '+84 28 7300 5555',
      website: 'https://momo.vn/careers'
    },
    status: 'active',
    isVerified: true,
    viewCount: 890,
    applicationCount: 67,
    tags: ['UI/UX Design', 'Contract', 'Remote', 'Figma', 'Fintech', 'Ho Chi Minh City'],
    aiAnalysis: {
      skillsExtracted: ['Figma', 'UI/UX Design', 'Prototyping', 'User Research', 'Sketch'],
      difficultyLevel: 'junior',
      matchingScore: 85,
      keywords: ['ui/ux design', 'contract', 'remote', 'figma', 'fintech'],
      category: 'UI/UX Design',
      estimatedApplications: 70
    }
  }
];

module.exports = sampleJobs;
