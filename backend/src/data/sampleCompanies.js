const sampleCompanies = [
  {
    name: 'FPT Software',
    shortDescription: 'FPT Software là một trong những công ty phần mềm hàng đầu Việt Nam, chuyên cung cấp các giải pháp công nghệ thông tin toàn cầu.',
    logo: 'https://via.placeholder.com/200x200?text=FPT',
    website: 'https://fptsoftware.com',
    industry: 'Information Technology',
    founded: 1999,
    size: '10000+',
    location: {
      address: 'FPT Tower, 10 Pham Van Bach, Cau Giay',
      city: 'Hanoi',
      state: 'Hanoi',
      country: 'Vietnam',
      postalCode: '100000',
      coordinates: {
        lat: 21.0285,
        lng: 105.8542
      }
    },
    contact: {
      email: 'hr@fptsoftware.com',
      phone: '+84 24 7300 9999',
      fax: '+84 24 7300 9998'
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/fpt-software',
      facebook: 'https://facebook.com/fptsoftware',
      twitter: 'https://twitter.com/fptsoftware'
    },
    description: 'FPT Software là công ty phần mềm hàng đầu Việt Nam với hơn 20 năm kinh nghiệm trong lĩnh vực CNTT. Chúng tôi cung cấp các giải pháp phần mềm cho hơn 600 khách hàng tại 50 quốc gia.',
    mission: 'Đổi mới sáng tạo để tạo ra giá trị bền vững cho khách hàng và xã hội',
    vision: 'Trở thành công ty công nghệ hàng đầu Đông Nam Á',
    values: ['Đổi mới', 'Chất lượng', 'Trách nhiệm', 'Hợp tác'],
    benefits: [
      'Môi trường làm việc trẻ trung, năng động',
      'Đào tạo và phát triển kỹ năng liên tục',
      'Cơ hội thăng tiến rõ ràng',
      'Lương thưởng cạnh tranh',
      'Bảo hiểm sức khỏe toàn diện',
      'Du lịch team building hàng năm'
    ],
    stats: {
      totalJobs: 0,
      activeInternships: 0,
      totalEmployees: 25000,
      averageRating: 4.2,
      reviewCount: 1250
    },
    isVerified: true,
    isActive: true,
    tags: ['Software Development', 'IT Services', 'Digital Transformation', 'Cloud Computing']
  },
  {
    name: 'VNG Corporation',
    description: 'VNG Corporation là công ty internet hàng đầu Việt Nam, sở hữu nhiều sản phẩm và dịch vụ số phổ biến.',
    logo: 'https://via.placeholder.com/200x200?text=VNG',
    website: 'https://vng.com.vn',
    industry: 'Internet & Technology',
    founded: 2004,
    size: '5000+',
    location: {
      address: 'VNG Campus, 06 Phan Van Chuong, District 1',
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh City',
      country: 'Vietnam',
      postalCode: '70000',
      coordinates: {
        lat: 10.8231,
        lng: 106.6297
      }
    },
    contact: {
      email: 'hr@vng.com.vn',
      phone: '+84 28 7300 8888',
      fax: '+84 28 7300 8889'
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/vng-corporation',
      facebook: 'https://facebook.com/vngcorporation',
      twitter: 'https://twitter.com/vngcorporation'
    },
    description: 'VNG Corporation là công ty internet hàng đầu Việt Nam, sở hữu các sản phẩm như Zalo, Zing MP3, Zing News và nhiều dịch vụ số khác.',
    mission: 'Kết nối và phục vụ hàng triệu người dùng Việt Nam',
    vision: 'Trở thành công ty công nghệ hàng đầu Đông Nam Á',
    values: ['Đổi mới', 'Chất lượng', 'Người dùng là trung tâm', 'Tốc độ'],
    benefits: [
      'Môi trường startup năng động',
      'Lương thưởng cạnh tranh',
      'Cổ phiếu ESOP',
      'Đào tạo liên tục',
      'Bảo hiểm sức khỏe',
      'Phòng gym miễn phí'
    ],
    stats: {
      totalJobs: 0,
      activeInternships: 0,
      totalEmployees: 5000,
      averageRating: 4.5,
      reviewCount: 890
    },
    isVerified: true,
    isActive: true,
    tags: ['Internet', 'Gaming', 'Social Media', 'Digital Services']
  },
  {
    name: 'Viettel',
    description: 'Viettel là tập đoàn viễn thông quân đội, là nhà mạng di động lớn nhất Việt Nam.',
    logo: 'https://via.placeholder.com/200x200?text=Viettel',
    website: 'https://viettel.com.vn',
    industry: 'Telecommunications',
    founded: 1989,
    size: '50000+',
    location: {
      address: 'Viettel Tower, 1 Tran Huu Duc, Nam Tu Liem',
      city: 'Hanoi',
      state: 'Hanoi',
      country: 'Vietnam',
      postalCode: '100000',
      coordinates: {
        lat: 21.0285,
        lng: 105.8542
      }
    },
    contact: {
      email: 'hr@viettel.com.vn',
      phone: '+84 24 7300 7777',
      fax: '+84 24 7300 7778'
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/viettel-group',
      facebook: 'https://facebook.com/viettelgroup',
      twitter: 'https://twitter.com/viettelgroup'
    },
    description: 'Viettel là tập đoàn viễn thông quân đội, cung cấp dịch vụ viễn thông, công nghệ thông tin và truyền thông cho hàng triệu khách hàng.',
    mission: 'Kết nối mọi người, mọi nơi',
    vision: 'Trở thành tập đoàn công nghệ số hàng đầu khu vực',
    values: ['Chất lượng', 'Đổi mới', 'Trách nhiệm', 'Hợp tác'],
    benefits: [
      'Môi trường làm việc ổn định',
      'Lương thưởng cạnh tranh',
      'Bảo hiểm toàn diện',
      'Đào tạo nội bộ',
      'Cơ hội thăng tiến',
      'Phúc lợi xã hội tốt'
    ],
    stats: {
      totalJobs: 0,
      activeInternships: 0,
      totalEmployees: 50000,
      averageRating: 4.0,
      reviewCount: 2100
    },
    isVerified: true,
    isActive: true,
    tags: ['Telecommunications', 'Mobile Network', 'Digital Services', 'Government']
  },
  {
    name: 'Mobifone',
    description: 'Mobifone là một trong những nhà mạng di động lớn nhất Việt Nam, thuộc Tập đoàn Bưu chính Viễn thông.',
    logo: 'https://via.placeholder.com/200x200?text=Mobifone',
    website: 'https://mobifone.vn',
    industry: 'Telecommunications',
    founded: 1993,
    size: '15000+',
    location: {
      address: 'Mobifone Tower, 139 Nguyen Thi Minh Khai, District 1',
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh City',
      country: 'Vietnam',
      postalCode: '70000',
      coordinates: {
        lat: 10.8231,
        lng: 106.6297
      }
    },
    contact: {
      email: 'hr@mobifone.vn',
      phone: '+84 28 7300 6666',
      fax: '+84 28 7300 6667'
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/mobifone',
      facebook: 'https://facebook.com/mobifone',
      twitter: 'https://twitter.com/mobifone'
    },
    description: 'Mobifone là nhà mạng di động hàng đầu Việt Nam, cung cấp các dịch vụ viễn thông chất lượng cao cho hàng triệu khách hàng.',
    mission: 'Kết nối mọi người với công nghệ tiên tiến',
    vision: 'Trở thành nhà mạng số 1 Việt Nam',
    values: ['Chất lượng', 'Đổi mới', 'Khách hàng', 'Phát triển'],
    benefits: [
      'Môi trường làm việc chuyên nghiệp',
      'Lương thưởng cạnh tranh',
      'Bảo hiểm sức khỏe',
      'Đào tạo kỹ năng',
      'Cơ hội thăng tiến',
      'Phúc lợi tốt'
    ],
    stats: {
      totalJobs: 0,
      activeInternships: 0,
      totalEmployees: 15000,
      averageRating: 3.8,
      reviewCount: 750
    },
    isVerified: true,
    isActive: true,
    tags: ['Telecommunications', 'Mobile Network', 'Digital Services', 'Government']
  },
  {
    name: 'Google',
    description: 'Google là công ty công nghệ đa quốc gia hàng đầu thế giới, chuyên về các dịch vụ internet và công nghệ.',
    logo: 'https://via.placeholder.com/200x200?text=Google',
    website: 'https://google.com',
    industry: 'Technology',
    founded: 1998,
    size: '150000+',
    location: {
      address: 'Google Asia Pacific, 70 Pasir Panjang Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '117371',
      coordinates: {
        lat: 1.3521,
        lng: 103.8198
      }
    },
    contact: {
      email: 'hr@google.com',
      phone: '+65 6307 3000',
      fax: '+65 6307 3001'
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/google',
      facebook: 'https://facebook.com/google',
      twitter: 'https://twitter.com/google'
    },
    description: 'Google là công ty công nghệ hàng đầu thế giới, cung cấp các dịch vụ tìm kiếm, quảng cáo, cloud computing và nhiều sản phẩm khác.',
    mission: 'Tổ chức thông tin thế giới và làm cho thông tin trở nên hữu ích và dễ tiếp cận',
    vision: 'Tạo ra một thế giới nơi mọi người có thể truy cập thông tin một cách dễ dàng',
    values: ['Đổi mới', 'Chất lượng', 'Người dùng', 'Tốc độ'],
    benefits: [
      'Môi trường làm việc sáng tạo',
      'Lương thưởng cạnh tranh toàn cầu',
      'Phúc lợi hàng đầu',
      'Đào tạo liên tục',
      'Cơ hội thăng tiến toàn cầu',
      'Môi trường đa văn hóa'
    ],
    stats: {
      totalJobs: 0,
      activeInternships: 0,
      totalEmployees: 150000,
      averageRating: 4.7,
      reviewCount: 50000
    },
    isVerified: true,
    isActive: true,
    tags: ['Technology', 'Internet', 'AI', 'Cloud Computing', 'Global']
  }
];

module.exports = sampleCompanies;
