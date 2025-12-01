const { faker } = require('@faker-js/faker/locale/vi');
const fs = require('fs').promises;
const path = require('path');

/**
 * Synthetic CV Generator for Research Dataset
 * Generates realistic Vietnamese CVs across 14 industries
 */
class SyntheticCVGenerator {
  constructor() {
    this.industries = [
      'technology', 'marketing', 'business', 'design', 'accounting',
      'finance', 'hr', 'healthcare', 'education', 'engineering',
      'hospitality', 'law', 'media', 'logistics'
    ];
  }

  /**
   * Generate a single realistic CV
   */
  generateCV(industry = null, level = 'intern') {
    const selectedIndustry = industry || faker.helpers.arrayElement(this.industries);
    const vietnameseName = this.generateVietnameseName();
    
    return {
      // Personal Info
      fullName: vietnameseName,
      email: this.generateEmail(vietnameseName),
      phone: '0' + faker.string.numeric(9),
      dateOfBirth: faker.date.birthdate({ min: 20, max: 25, mode: 'age' }).toISOString().split('T')[0],
      address: this.generateVietnameseAddress(),
      
      // Objective
      objective: this.generateObjective(selectedIndustry, level),
      
      // Education
      education: this.generateEducation(selectedIndustry),
      
      // Skills
      skills: this.getSkillsForIndustry(selectedIndustry, level),
      
      // Experience (empty for interns, filled for junior/mid)
      experience: level === 'intern' ? [] : this.generateExperience(selectedIndustry, level),
      
      // Projects
      projects: this.generateProjects(selectedIndustry, level),
      
      // Certifications
      certifications: this.generateCertifications(selectedIndustry),
      
      // Languages
      languages: this.generateLanguages(),
      
      // Soft Skills
      softSkills: this.getSoftSkills(),
      
      // Metadata
      metadata: {
        industry: selectedIndustry,
        level,
        language: 'vi',
        format: 'json',
        generatedAt: new Date().toISOString()
      }
    };
  }

  generateVietnameseName() {
    const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
    const middleNames = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Anh', 'Thành', 'Quốc', 'Thanh', 'Hồng', 'Thu', 'Mai', 'Lan', 'Hà'];
    const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hùng', 'Khang', 'Long', 'Nam', 'Phong', 'Quân', 'Tài', 'Tuấn', 'Việt', 'Linh', 'Hương', 'Trang', 'Nhi', 'My', 'Vy', 'Chi'];
    
    return `${faker.helpers.arrayElement(lastNames)} ${faker.helpers.arrayElement(middleNames)} ${faker.helpers.arrayElement(firstNames)}`;
  }

  generateEmail(fullName) {
    const normalized = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, '');
    
    return `${normalized}@${faker.helpers.arrayElement(['gmail.com', 'outlook.com', 'yahoo.com', 'student.hust.edu.vn'])}`;
  }

  generateVietnameseAddress() {
    const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang', 'Huế', 'Vũng Tàu'];
    const districts = ['Quận 1', 'Quận 2', 'Quận 3', 'Ba Đình', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Thanh Xuân'];
    
    return `${faker.helpers.arrayElement(districts)}, ${faker.helpers.arrayElement(cities)}`;
  }

  generateObjective(industry, level) {
    const objectives = {
      technology: [
        `Tìm kiếm vị trí ${level === 'intern' ? 'thực tập sinh' : 'junior developer'} để phát triển kỹ năng lập trình và làm việc trong môi trường chuyên nghiệp`,
        `Mong muốn trở thành một lập trình viên giỏi, đóng góp vào các dự án công nghệ`,
        `Áp dụng kiến thức về ${this.getSkillsForIndustry(industry, level)[0]} vào thực tế`
      ],
      marketing: [
        `Tìm kiếm cơ hội thực tập trong lĩnh vực marketing để phát triển kỹ năng chiến lược và sáng tạo`,
        `Mong muốn đóng góp vào các chiến dịch marketing hiệu quả`
      ],
      business: [
        `Phát triển kỹ năng phân tích kinh doanh và quản lý dự án`,
        `Tìm kiếm môi trường năng động để học hỏi và phát triển`
      ],
      design: [
        `Áp dụng kỹ năng thiết kế UI/UX vào các dự án thực tế`,
        `Tạo ra những sản phẩm có giá trị người dùng cao`
      ]
    };
    
    const defaultObjective = `Tìm kiếm cơ hội ${level === 'intern' ? 'thực tập' : 'làm việc'} để phát triển kỹ năng và kinh nghiệm trong lĩnh vực ${industry}`;
    
    return faker.helpers.arrayElement(objectives[industry] || [defaultObjective]);
  }

  generateEducation(industry) {
    const universities = [
      'Đại học Bách Khoa Hà Nội',
      'Đại học Quốc Gia TP.HCM',
      'Đại học Công Nghệ - ĐHQG Hà Nội',
      'Đại học FPT',
      'Đại học RMIT Việt Nam',
      'Đại học Kinh tế Quốc Dân',
      'Đại học Ngoại Thương',
      'Đại học Tôn Đức Thắng',
      'Đại học Khoa học Tự nhiên',
      'Đại học Công nghiệp'
    ];

    const majors = {
      technology: ['Công nghệ Thông tin', 'Khoa học Máy tính', 'Kỹ thuật Phần mềm', 'Công nghệ Thông tin - Viễn thông', 'Điện tử - Truyền thông'],
      marketing: ['Marketing', 'Quản trị Kinh doanh', 'Truyền thông và Marketing', 'Quảng cáo'],
      business: ['Quản trị Kinh doanh', 'Kinh tế', 'Tài chính Doanh nghiệp', 'Quản trị Nhân lực'],
      design: ['Thiết kế Đồ họa', 'Thiết kế Mỹ thuật', 'Mỹ thuật Ứng dụng', 'Thiết kế Thời trang'],
      accounting: ['Kế toán', 'Kiểm toán', 'Tài chính - Kế toán'],
      finance: ['Tài chính - Ngân hàng', 'Tài chính Doanh nghiệp', 'Kinh tế Đầu tư'],
      engineering: ['Kỹ thuật Cơ khí', 'Kỹ thuật Điện', 'Kỹ thuật Xây dựng', 'Công nghệ Kỹ thuật Ô tô']
    };

    const major = faker.helpers.arrayElement(majors[industry] || ['Quản trị Kinh doanh']);

    return [
      {
        school: faker.helpers.arrayElement(universities),
        degree: 'Cử nhân',
        major,
        gpa: parseFloat(faker.number.float({ min: 2.8, max: 3.9, precision: 0.01 }).toFixed(2)),
        startDate: '09/2020',
        endDate: '06/2024',
        achievements: this.generateAchievements()
      }
    ];
  }

  generateAchievements() {
    const achievements = [
      'Học bổng khuyến khích học tập',
      'Sinh viên 5 tốt cấp trường',
      'Giải Nhì cuộc thi Hackathon',
      'Thành viên CLB học thuật',
      'Top 10% sinh viên xuất sắc'
    ];
    
    return faker.helpers.arrayElements(achievements, { min: 0, max: 2 });
  }

  getSkillsForIndustry(industry, level) {
    const skillMap = {
      technology: {
        intern: ['JavaScript', 'HTML/CSS', 'Git', 'Python', 'SQL', 'React'],
        junior: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB', 'Git', 'Docker', 'REST API'],
        mid: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'Microservices', 'CI/CD', 'System Design']
      },
      marketing: {
        intern: ['Social Media Marketing', 'Content Writing', 'Google Analytics', 'Canva'],
        junior: ['Digital Marketing', 'SEO', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Google Analytics', 'Copywriting'],
        mid: ['Digital Marketing Strategy', 'SEO/SEM', 'Marketing Automation', 'Data Analysis', 'Campaign Management', 'Brand Strategy']
      },
      business: {
        intern: ['Microsoft Excel', 'PowerPoint', 'Data Entry', 'Communication'],
        junior: ['Excel', 'PowerPoint', 'Business Analysis', 'Project Management', 'Data Analysis', 'SQL'],
        mid: ['Strategic Planning', 'Financial Modeling', 'Business Intelligence', 'Stakeholder Management', 'Process Optimization']
      },
      design: {
        intern: ['Figma', 'Adobe Photoshop', 'Canva', 'UI Design'],
        junior: ['Figma', 'Adobe Illustrator', 'Adobe Photoshop', 'UI/UX Design', 'Prototyping', 'Wireframing'],
        mid: ['UI/UX Design', 'Design Systems', 'User Research', 'Figma', 'Adobe Creative Suite', 'Motion Design']
      },
      accounting: {
        intern: ['Excel', 'Kế toán cơ bản', 'MISA Accounting'],
        junior: ['Kế toán tài chính', 'Excel nâng cao', 'MISA', 'Phân tích báo cáo tài chính'],
        mid: ['Kế toán quản trị', 'Kiểm toán', 'Phân tích tài chính', 'SAP', 'Oracle']
      }
    };

    const skills = skillMap[industry]?.[level] || skillMap.technology.intern;
    return faker.helpers.arrayElements(skills, { min: 3, max: skills.length });
  }

  generateExperience(industry, level) {
    if (level === 'intern') return [];

    const companies = [
      'FPT Software', 'Viettel', 'VNG Corporation', 'Momo', 'Shopee',
      'Tiki', 'Grab', 'VinGroup', 'BIDV', 'Vietcombank', 'Accenture Vietnam'
    ];

    const positions = {
      technology: ['Junior Developer', 'Frontend Developer', 'Backend Developer', 'Fullstack Developer Intern'],
      marketing: ['Marketing Executive', 'Digital Marketing Specialist', 'Content Creator'],
      business: ['Business Analyst', 'Project Coordinator', 'Operations Assistant'],
      design: ['Junior UI/UX Designer', 'Graphic Designer', 'Product Designer']
    };

    const count = level === 'junior' ? 1 : faker.number.int({ min: 2, max: 3 });
    const experiences = [];

    for (let i = 0; i < count; i++) {
      experiences.push({
        company: faker.helpers.arrayElement(companies),
        position: faker.helpers.arrayElement(positions[industry] || positions.technology),
        startDate: '06/2023',
        endDate: level === 'junior' ? 'Hiện tại' : '12/2023',
        responsibilities: this.generateResponsibilities(industry),
        achievements: [
          `Hoàn thành ${faker.number.int({ min: 3, max: 10 })} dự án thành công`,
          `Cải thiện hiệu suất hệ thống ${faker.number.int({ min: 10, max: 50 })}%`
        ]
      });
    }

    return experiences;
  }

  generateResponsibilities(industry) {
    const responsibilities = {
      technology: [
        'Phát triển và bảo trì ứng dụng web',
        'Viết code clean và tối ưu hiệu suất',
        'Tham gia code review và pair programming',
        'Làm việc với Agile/Scrum methodology'
      ],
      marketing: [
        'Lập kế hoạch và thực thi chiến dịch marketing',
        'Quản lý và phát triển nội dung trên các kênh social media',
        'Phân tích dữ liệu marketing và đề xuất cải tiến'
      ],
      business: [
        'Phân tích yêu cầu nghiệp vụ và đề xuất giải pháp',
        'Làm việc với stakeholders để thu thập requirements',
        'Tạo báo cáo và dashboard cho management'
      ]
    };

    return faker.helpers.arrayElements(
      responsibilities[industry] || responsibilities.technology,
      { min: 2, max: 4 }
    );
  }

  generateProjects(industry, level) {
    const projectTemplates = {
      technology: [
        {
          name: 'Website Thương mại điện tử',
          description: 'Xây dựng website bán hàng online với đầy đủ tính năng giỏ hàng, thanh toán, quản lý đơn hàng',
          technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
          role: 'Fullstack Developer',
          url: 'github.com/user/ecommerce-project'
        },
        {
          name: 'Ứng dụng Quản lý Công việc',
          description: 'Todo list app với tính năng real-time collaboration',
          technologies: ['React', 'Firebase', 'Material-UI'],
          role: 'Frontend Developer',
          url: 'github.com/user/task-manager'
        },
        {
          name: 'Hệ thống Đặt phòng Khách sạn',
          description: 'Platform đặt phòng khách sạn với tìm kiếm, đánh giá, thanh toán online',
          technologies: ['Vue.js', 'Node.js', 'PostgreSQL', 'Stripe'],
          role: 'Backend Developer',
          url: 'github.com/user/hotel-booking'
        }
      ],
      marketing: [
        {
          name: 'Chiến dịch Social Media cho Startup',
          description: 'Lập kế hoạch và thực thi chiến dịch marketing trên Facebook, Instagram tăng 200% engagement',
          technologies: ['Facebook Ads', 'Canva', 'Google Analytics'],
          role: 'Marketing Lead'
        },
        {
          name: 'SEO Campaign',
          description: 'Tối ưu SEO cho website giúp tăng organic traffic 150% sau 3 tháng',
          technologies: ['Google Search Console', 'Ahrefs', 'Content Writing'],
          role: 'SEO Specialist'
        }
      ],
      design: [
        {
          name: 'Redesign Mobile App UI',
          description: 'Thiết kế lại giao diện ứng dụng mobile banking, tăng user satisfaction score lên 4.5/5',
          technologies: ['Figma', 'Adobe XD', 'User Research'],
          role: 'UI/UX Designer',
          url: 'behance.net/user/mobile-banking-redesign'
        },
        {
          name: 'Brand Identity cho Startup',
          description: 'Thiết kế logo, color palette, typography system cho startup công nghệ',
          technologies: ['Adobe Illustrator', 'Figma'],
          role: 'Brand Designer'
        }
      ]
    };

    const templates = projectTemplates[industry] || projectTemplates.technology;
    const count = level === 'intern' ? faker.number.int({ min: 1, max: 2 }) : faker.number.int({ min: 2, max: 3 });
    
    return faker.helpers.arrayElements(templates, count);
  }

  generateCertifications(industry) {
    const certs = {
      technology: [
        'AWS Certified Cloud Practitioner',
        'Google IT Support Certificate',
        'MongoDB Certified Developer',
        'Oracle Certified Associate'
      ],
      marketing: [
        'Google Analytics Certification',
        'Google Ads Certification',
        'HubSpot Content Marketing Certification',
        'Facebook Blueprint Certification'
      ],
      business: [
        'PMP (Project Management Professional)',
        'Certified Business Analyst',
        'Lean Six Sigma Yellow Belt'
      ],
      design: [
        'Adobe Certified Professional',
        'Google UX Design Certificate',
        'Interaction Design Foundation Certificate'
      ],
      accounting: [
        'Chứng chỉ Kế toán trưởng',
        'CPA (Certified Public Accountant)',
        'ACCA'
      ]
    };

    const industryOptions = certs[industry] || certs.technology;
    return faker.helpers.arrayElements(industryOptions, { min: 0, max: 2 });
  }

  generateLanguages() {
    const languages = [
      { name: 'Tiếng Việt', level: 'Bản ngữ' },
      { name: 'Tiếng Anh', level: faker.helpers.arrayElement(['Cơ bản', 'Trung cấp', 'Khá', 'Thành thạo']) }
    ];

    if (faker.datatype.boolean(0.2)) {
      languages.push({
        name: faker.helpers.arrayElement(['Tiếng Nhật', 'Tiếng Trung', 'Tiếng Hàn']),
        level: 'Cơ bản'
      });
    }

    return languages;
  }

  getSoftSkills() {
    const allSoftSkills = [
      'Giao tiếp tốt',
      'Làm việc nhóm',
      'Quản lý thời gian',
      'Giải quyết vấn đề',
      'Tư duy phản biện',
      'Chủ động học hỏi',
      'Thích ứng nhanh',
      'Làm việc độc lập',
      'Trình bày ý tưởng',
      'Lãnh đạo'
    ];

    return faker.helpers.arrayElements(allSoftSkills, { min: 3, max: 6 });
  }

  /**
   * Generate multiple CVs
   */
  async generateDataset(count = 500) {
    console.log(`🚀 Generating ${count} synthetic CVs...`);
    
    const dataset = [];
    const levels = ['intern', 'junior', 'mid'];
    const levelWeights = [0.6, 0.3, 0.1]; // 60% intern, 30% junior, 10% mid

    for (let i = 0; i < count; i++) {
      // Weighted random level selection
      const level = this.weightedRandom(levels, levelWeights);
      const industry = faker.helpers.arrayElement(this.industries);
      
      const cv = this.generateCV(industry, level);
      
      dataset.push({
        id: i + 1,
        cv,
        rawText: this.convertToRawText(cv) // For NLP processing
      });

      if ((i + 1) % 100 === 0) {
        console.log(`   Generated ${i + 1}/${count} CVs...`);
      }
    }

    console.log(`✅ Generated ${dataset.length} CVs`);
    return dataset;
  }

  weightedRandom(items, weights) {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * total;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1];
  }

  convertToRawText(cv) {
    // Convert structured CV to raw text format
    return `
THÔNG TIN CÁ NHÂN
Họ và tên: ${cv.fullName}
Email: ${cv.email}
Điện thoại: ${cv.phone}
Địa chỉ: ${cv.address}

MỤC TIÊU NGHỀ NGHIỆP
${cv.objective}

HỌC VẤN
${cv.education.map(edu => `
- ${edu.degree} ${edu.major}
  ${edu.school} (${edu.startDate} - ${edu.endDate})
  GPA: ${edu.gpa}
  ${edu.achievements.length > 0 ? 'Thành tích: ' + edu.achievements.join(', ') : ''}
`).join('\n')}

KỸ NĂNG
${cv.skills.map(skill => `- ${skill}`).join('\n')}

KINH NGHIỆM LÀM VIỆC
${cv.experience.length > 0 ? cv.experience.map(exp => `
- ${exp.position} tại ${exp.company} (${exp.startDate} - ${exp.endDate})
  Trách nhiệm:
  ${exp.responsibilities.map(r => `  • ${r}`).join('\n')}
`).join('\n') : 'Chưa có kinh nghiệm làm việc'}

DỰ ÁN
${cv.projects.map(proj => `
- ${proj.name}
  ${proj.description}
  Công nghệ: ${proj.technologies.join(', ')}
  Vai trò: ${proj.role}
`).join('\n')}

CHỨNG CHỈ
${cv.certifications.length > 0 ? cv.certifications.map(cert => `- ${cert}`).join('\n') : 'Chưa có chứng chỉ'}

NGOẠI NGỮ
${cv.languages.map(lang => `- ${lang.name}: ${lang.level}`).join('\n')}

KỸ NĂNG MỀM
${cv.softSkills.join(', ')}
    `.trim();
  }

  /**
   * Save dataset to file
   */
  async save(dataset, filename) {
    const filepath = path.join(__dirname, '../../../thesis/datasets/processed', filename);
    await fs.writeFile(filepath, JSON.stringify(dataset, null, 2), 'utf8');
    console.log(`💾 Saved to ${filepath}`);
    
    // Also save as JSONL for training
    const jsonlPath = filepath.replace('.json', '.jsonl');
    const jsonl = dataset.map(item => JSON.stringify(item)).join('\n');
    await fs.writeFile(jsonlPath, jsonl, 'utf8');
    console.log(`💾 Saved JSONL to ${jsonlPath}`);
    
    return { json: filepath, jsonl: jsonlPath };
  }

  /**
   * Get statistics
   */
  getStatistics(dataset) {
    const stats = {
      total: dataset.length,
      byIndustry: {},
      byLevel: {},
      avgSkills: 0,
      avgProjects: 0,
      withExperience: 0
    };

    dataset.forEach(item => {
      const { industry, level } = item.cv.metadata;
      
      stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      stats.avgSkills += item.cv.skills.length;
      stats.avgProjects += item.cv.projects.length;
      if (item.cv.experience.length > 0) stats.withExperience++;
    });

    stats.avgSkills = (stats.avgSkills / dataset.length).toFixed(1);
    stats.avgProjects = (stats.avgProjects / dataset.length).toFixed(1);

    return stats;
  }
}

module.exports = SyntheticCVGenerator;
