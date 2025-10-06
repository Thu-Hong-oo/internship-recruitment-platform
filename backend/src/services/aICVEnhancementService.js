const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AICVEnhancementService {
  constructor() {
    this.jobKeywords = {
      frontend: [
        'React',
        'Vue',
        'Angular',
        'JavaScript',
        'TypeScript',
        'HTML',
        'CSS',
        'UI/UX',
        'Responsive Design',
      ],
      backend: [
        'Node.js',
        'Python',
        'Java',
        'Spring',
        'Django',
        'API',
        'Database',
        'Microservices',
        'REST',
      ],
      fullstack: [
        'React',
        'Node.js',
        'JavaScript',
        'TypeScript',
        'MongoDB',
        'PostgreSQL',
        'AWS',
        'Docker',
      ],
      mobile: [
        'React Native',
        'Flutter',
        'iOS',
        'Android',
        'Swift',
        'Kotlin',
        'Mobile Development',
      ],
      data: [
        'Python',
        'SQL',
        'Machine Learning',
        'Data Analysis',
        'Pandas',
        'NumPy',
        'TensorFlow',
      ],
      devops: [
        'AWS',
        'Docker',
        'Kubernetes',
        'CI/CD',
        'Jenkins',
        'Terraform',
        'Linux',
      ],
      design: [
        'Figma',
        'Adobe Creative Suite',
        'UI/UX',
        'Prototyping',
        'User Research',
        'Design Systems',
      ],
      marketing: [
        'Digital Marketing',
        'SEO',
        'SEM',
        'Social Media',
        'Analytics',
        'Content Marketing',
      ],
      business: [
        'Project Management',
        'Business Analysis',
        'Strategy',
        'Communication',
        'Leadership',
      ],
    };

    this.actionVerbs = {
      technical: [
        'Developed',
        'Implemented',
        'Designed',
        'Built',
        'Created',
        'Optimized',
        'Architected',
        'Engineered',
      ],
      management: [
        'Led',
        'Managed',
        'Coordinated',
        'Oversaw',
        'Directed',
        'Supervised',
        'Facilitated',
      ],
      achievement: [
        'Achieved',
        'Delivered',
        'Improved',
        'Increased',
        'Reduced',
        'Enhanced',
        'Streamlined',
      ],
      collaboration: [
        'Collaborated',
        'Partnered',
        'Worked with',
        'Coordinated with',
        'Supported',
      ],
    };

    this.quantifiers = [
      'by 25%',
      'by 50%',
      'by 100%',
      'by 200%',
      'from X to Y',
      'over X months',
      'within X days',
      'for X users',
      'across X teams',
      'in X countries',
      'with X% accuracy',
      'reducing X by Y%',
    ];
  }

  /**
   * Enhanced AI prompt for professional CV writing
   * @param {Object} content - Basic resume content
   * @param {string} targetJob - Target job title
   * @param {Object} jobDescription - Job description if available
   * @returns {Promise<Object>} Enhanced content
   */
  async enhanceResumeContent(content, targetJob = null, jobDescription = null) {
    try {
      const jobKeywords = this.extractJobKeywords(targetJob, jobDescription);
      const industryContext = this.getIndustryContext(targetJob);

      const prompt = `
Bạn là chuyên gia viết CV hàng đầu với 15+ năm kinh nghiệm, từng giúp hàng nghìn ứng viên thành công trong việc tìm việc tại các công ty Fortune 500. Hãy viết lại CV này để tối ưu cho vị trí "${
        targetJob || 'general'
      }".

THÔNG TIN CV HIỆN TẠI:
${JSON.stringify(content, null, 2)}

${
  jobDescription
    ? `JOB DESCRIPTION THAM KHẢO:
${jobDescription}`
    : ''
}

NGUYÊN TẮC VIẾT CV CHUYÊN NGHIỆP:

1. CAREER OBJECTIVE/SUMMARY (2-3 câu):
   - Bắt đầu với vị trí mong muốn và năm kinh nghiệm
   - Highlight 2-3 điểm mạnh chính phù hợp với job
   - Thể hiện giá trị mang lại cho công ty
   - Sử dụng keywords: ${jobKeywords.join(', ')}

2. EXPERIENCE ENHANCEMENT (Mỗi job 3-5 bullet points):
   - Bắt đầu với ACTION VERBS mạnh: ${this.actionVerbs.technical.join(', ')}
   - QUANTIFY mọi thành tích: ${this.quantifiers.join(', ')}
   - Highlight IMPACT và RESULTS cụ thể
   - Sắp xếp theo độ liên quan đến target job
   - Sử dụng keywords từ job description

3. SKILLS OPTIMIZATION:
   - Nhóm skills theo categories: Technical, Tools, Soft Skills
   - Sắp xếp theo độ ưu tiên cho job target
   - Thêm proficiency level: Expert, Advanced, Intermediate, Beginner
   - Include trending technologies relevant to job

4. PROJECTS ENHANCEMENT:
   - Mô tả PROBLEM → SOLUTION → RESULTS
   - Highlight technologies và methodologies
   - Show business impact và learning outcomes
   - Include metrics và achievements

5. EDUCATION HIGHLIGHT:
   - Emphasize relevant coursework và projects
   - Highlight academic achievements và honors
   - Add relevant certifications và training

TEMPLATE CHO CAREER OBJECTIVE:
"[Vị trí] với [X] năm kinh nghiệm trong [lĩnh vực], chuyên về [skill chính]. Đã [thành tích cụ thể] và mong muốn đóng góp [giá trị] cho [loại công ty]."

TEMPLATE CHO EXPERIENCE BULLET POINTS:
• [Action Verb] [task/achievement] [quantified result] [impact/outcome]
• Led development of [project] using [technology], resulting in [quantified improvement]
• Implemented [solution] that [solved problem], achieving [specific result]

INDUSTRY CONTEXT: ${industryContext}

TRẢ VỀ JSON FORMAT:
{
  "enhancedContent": {
    "personalInfo": {
      "fullName": "Tên đầy đủ",
      "email": "email",
      "phone": "phone",
      "address": "address",
      "bio": "Professional bio ngắn gọn, highlight expertise và years of experience"
    },
    "objective": "Career objective được viết lại chuyên nghiệp, tối ưu cho job target với keywords",
    "education": [
      {
        "institution": "Tên trường",
        "degree": "Bằng cấp",
        "field": "Ngành học",
        "graduationYear": 2025,
        "gpa": "GPA nếu có",
        "relevantCoursework": ["Môn học liên quan đến job"],
        "achievements": ["Thành tích học tập, honors, awards"],
        "projects": ["Projects liên quan đến job"]
      }
    ],
    "experience": [
      {
        "title": "Chức danh",
        "company": "Công ty",
        "location": "Địa điểm",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY",
        "description": "Mô tả công việc được viết lại chuyên nghiệp với action verbs",
        "achievements": [
          "Led development of [project] using [tech], resulting in [quantified result]",
          "Implemented [solution] that improved [metric] by [percentage]",
          "Managed team of [number] to deliver [project] on time and under budget",
          "Optimized [process/system] reducing [metric] by [percentage]"
        ],
        "skills": ["Kỹ năng chính được sử dụng"],
        "impact": "Business impact và value delivered"
      }
    ],
    "skills": {
      "technical": [
        {
          "name": "Tên skill",
          "level": "Expert|Advanced|Intermediate|Beginner",
          "relevance": "high|medium|low",
          "yearsOfExperience": "Số năm kinh nghiệm",
          "certification": "Chứng chỉ nếu có"
        }
      ],
      "soft": [
        {
          "name": "Tên skill",
          "level": "Expert|Advanced|Intermediate|Beginner",
          "examples": ["Ví dụ cụ thể về skill này"]
        }
      ],
      "languages": [
        {
          "name": "Ngôn ngữ",
          "level": "Native|Fluent|Advanced|Intermediate|Basic",
          "certification": "Chứng chỉ nếu có",
          "score": "Điểm số nếu có"
        }
      ]
    },
    "projects": [
      {
        "name": "Tên project",
        "description": "Mô tả project với problem-solution-results format",
        "technologies": ["Tech stack được sử dụng"],
        "results": [
          "Achieved [quantified result] through [methodology]",
          "Improved [metric] by [percentage] compared to previous solution",
          "Reduced [cost/time] by [percentage]"
        ],
        "url": "Link project nếu có",
        "impact": "Business impact và learning outcomes",
        "teamSize": "Số người trong team",
        "duration": "Thời gian hoàn thành"
      }
    ],
    "certifications": [
      {
        "name": "Tên chứng chỉ",
        "issuer": "Tổ chức cấp",
        "issueDate": "MM/YYYY",
        "expiryDate": "MM/YYYY nếu có",
        "credentialUrl": "Link chứng chỉ",
        "relevance": "high|medium|low"
      }
    ],
    "achievements": [
      {
        "title": "Tên thành tích",
        "description": "Mô tả thành tích",
        "date": "MM/YYYY",
        "issuer": "Tổ chức trao",
        "relevance": "high|medium|low"
      }
    ]
  },
  "optimization": {
    "targetJob": "${targetJob || 'general'}",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "strengths": [
      "Điểm mạnh 1 phù hợp với job",
      "Điểm mạnh 2 phù hợp với job",
      "Điểm mạnh 3 phù hợp với job"
    ],
    "improvements": [
      "Cải thiện 1 để phù hợp hơn với job",
      "Cải thiện 2 để phù hợp hơn với job"
    ],
    "atsScore": 85,
    "recommendations": [
      "Thêm keyword [keyword] vào experience section",
      "Highlight project [project] vì phù hợp với job requirements",
      "Emphasize skill [skill] vì được mention trong job description"
    ],
    "industryFit": "high|medium|low",
    "experienceMatch": "high|medium|low",
    "skillMatch": "high|medium|low"
  }
}

LƯU Ý QUAN TRỌNG:
- Giữ nguyên thông tin cá nhân chính xác
- Cải thiện cách diễn đạt, không thay đổi sự thật
- Tối ưu cho ATS (Applicant Tracking System)
- Sử dụng keywords: ${jobKeywords.join(', ')}
- Quantify mọi thành tích có thể
- Action verbs mạnh và cụ thể
- Professional tone, không quá formal
- Tối ưu cho "${targetJob || 'general'}"
- Industry context: ${industryContext}
`;

      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Clean the response text first
        let cleanedText = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/^[^{]*/, '') // Remove text before first {
          .replace(/[^}]*$/, '') // Remove text after last }
          .trim();

        const parsedResponse = JSON.parse(cleanedText);
        return parsedResponse;
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw AI response:', text);

        // Enhanced fallback: Transform content for career change
        const enhancedContent = this.transformContentForCareerChange(
          content,
          targetJob,
          jobKeywords
        );

        return {
          enhancedContent: enhancedContent,
          optimization: {
            targetJob: targetJob || 'general',
            keywords: jobKeywords,
            strengths: this.extractStrengths(content, targetJob),
            improvements: this.generateImprovements(content, targetJob),
            atsScore: this.calculateATSScore(enhancedContent, jobKeywords),
            recommendations: this.generateRecommendations(targetJob),
            industryFit: this.calculateIndustryFit(content, targetJob),
            experienceMatch: this.calculateExperienceMatch(content, targetJob),
            skillMatch: this.calculateSkillMatch(content, targetJob),
          },
        };
      }
    } catch (error) {
      console.error('AI enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Extract keywords from job title and description
   * @param {string} targetJob - Target job title
   * @param {string} jobDescription - Job description
   * @returns {Array} Extracted keywords
   */
  extractJobKeywords(targetJob, jobDescription) {
    const keywords = new Set();

    if (targetJob) {
      const jobLower = targetJob.toLowerCase();

      // Add industry-specific keywords
      for (const [industry, industryKeywords] of Object.entries(
        this.jobKeywords
      )) {
        if (jobLower.includes(industry)) {
          industryKeywords.forEach(keyword => keywords.add(keyword));
        }
      }

      // Add common technical keywords
      const commonTech = [
        'JavaScript',
        'Python',
        'React',
        'Node.js',
        'SQL',
        'Git',
        'AWS',
        'Docker',
      ];
      commonTech.forEach(tech => {
        if (jobLower.includes(tech.toLowerCase())) {
          keywords.add(tech);
        }
      });
    }

    if (jobDescription) {
      // Extract keywords from job description
      const descLower = jobDescription.toLowerCase();
      const allKeywords = Object.values(this.jobKeywords).flat();

      allKeywords.forEach(keyword => {
        if (descLower.includes(keyword.toLowerCase())) {
          keywords.add(keyword);
        }
      });
    }

    return Array.from(keywords).slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Get industry context for better CV optimization
   * @param {string} targetJob - Target job title
   * @returns {string} Industry context
   */
  getIndustryContext(targetJob) {
    if (!targetJob) return 'General industry';

    const jobLower = targetJob.toLowerCase();

    if (
      jobLower.includes('frontend') ||
      jobLower.includes('ui') ||
      jobLower.includes('ux')
    ) {
      return 'Frontend Development - Focus on user experience, responsive design, and modern frameworks';
    }

    if (
      jobLower.includes('backend') ||
      jobLower.includes('api') ||
      jobLower.includes('server')
    ) {
      return 'Backend Development - Focus on system architecture, database design, and API development';
    }

    if (jobLower.includes('fullstack') || jobLower.includes('full-stack')) {
      return 'Full Stack Development - Focus on end-to-end development and system integration';
    }

    if (
      jobLower.includes('mobile') ||
      jobLower.includes('ios') ||
      jobLower.includes('android')
    ) {
      return 'Mobile Development - Focus on cross-platform development and mobile user experience';
    }

    if (
      jobLower.includes('data') ||
      jobLower.includes('analyst') ||
      jobLower.includes('scientist')
    ) {
      return 'Data Science - Focus on data analysis, machine learning, and statistical modeling';
    }

    if (
      jobLower.includes('devops') ||
      jobLower.includes('cloud') ||
      jobLower.includes('infrastructure')
    ) {
      return 'DevOps/Cloud - Focus on automation, scalability, and infrastructure management';
    }

    if (jobLower.includes('design') || jobLower.includes('ui/ux')) {
      return 'Design - Focus on user experience, visual design, and design systems';
    }

    if (jobLower.includes('marketing') || jobLower.includes('digital')) {
      return 'Marketing - Focus on digital marketing, analytics, and campaign management';
    }

    if (
      jobLower.includes('business') ||
      jobLower.includes('analyst') ||
      jobLower.includes('manager')
    ) {
      return 'Business - Focus on strategy, analysis, and project management';
    }

    return 'General Technology - Focus on technical skills and problem-solving abilities';
  }

  /**
   * Generate ATS-optimized keywords for a specific job
   * @param {string} targetJob - Target job title
   * @param {string} jobDescription - Job description
   * @returns {Array} ATS keywords
   */
  generateATSKeywords(targetJob, jobDescription) {
    const keywords = new Set();

    // Add job title keywords
    if (targetJob) {
      const jobWords = targetJob.toLowerCase().split(/[\s,\-\/]+/);
      jobWords.forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
    }

    // Add industry keywords
    const jobKeywords = this.extractJobKeywords(targetJob, jobDescription);
    jobKeywords.forEach(keyword => keywords.add(keyword.toLowerCase()));

    // Add common ATS keywords
    const commonATS = [
      'problem solving',
      'teamwork',
      'communication',
      'leadership',
      'project management',
      'analytical',
      'creative',
      'detail oriented',
      'time management',
      'multitasking',
      'collaboration',
      'innovation',
    ];

    commonATS.forEach(keyword => keywords.add(keyword));

    return Array.from(keywords).slice(0, 20);
  }

  /**
   * Calculate ATS score based on keyword matching
   * @param {Object} content - Resume content
   * @param {Array} targetKeywords - Target keywords
   * @returns {number} ATS score (0-100)
   */
  calculateATSScore(content, targetKeywords) {
    let score = 0;
    const contentText = JSON.stringify(content).toLowerCase();

    targetKeywords.forEach(keyword => {
      if (contentText.includes(keyword.toLowerCase())) {
        score += 5; // Each keyword match adds 5 points
      }
    });

    // Bonus points for having all sections
    const sections = ['experience', 'education', 'skills', 'projects'];
    sections.forEach(section => {
      if (content[section] && content[section].length > 0) {
        score += 5;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Transform content for career change (e.g., from logistics to tech)
   * @param {Object} content - Original content
   * @param {string} targetJob - Target job
   * @param {Array} keywords - Target keywords
   * @returns {Object} Transformed content
   */
  transformContentForCareerChange(content, targetJob, keywords) {
    const transformed = { ...content };

    // Transform career objective
    if (targetJob && targetJob.toLowerCase().includes('developer')) {
      transformed.careerObjective = this.generateTechObjective(
        content,
        targetJob
      );
    }

    // Transform experience descriptions
    if (transformed.experience && Array.isArray(transformed.experience)) {
      transformed.experience = transformed.experience.map(exp =>
        this.transformExperienceForTech(exp, targetJob)
      );
    }

    // Transform skills
    if (transformed.skills) {
      transformed.skills = this.transformSkillsForTech(
        transformed.skills,
        targetJob,
        keywords
      );
    }

    // Add relevant projects if none exist
    if (!transformed.projects || transformed.projects.length === 0) {
      transformed.projects = this.generateTechProjects(targetJob);
    }

    return transformed;
  }

  /**
   * Generate tech-focused career objective
   * @param {Object} content - Original content
   * @param {string} targetJob - Target job
   * @returns {string} Tech-focused objective
   */
  generateTechObjective(content, targetJob) {
    const jobLevel = this.getJobLevel(targetJob);
    const industry = this.getIndustryFromJob(targetJob);

    const objectives = {
      entry: `Sinh viên ${industry} với đam mê công nghệ, tìm kiếm cơ hội thực tập để áp dụng kiến thức lý thuyết vào thực tế và phát triển kỹ năng lập trình.`,
      mid: `Chuyên viên ${industry} với kinh nghiệm trong việc giải quyết vấn đề và làm việc nhóm, mong muốn chuyển đổi sang lĩnh vực công nghệ để phát triển sự nghiệp.`,
      senior: `Chuyên gia với kinh nghiệm quản lý và phân tích, tìm kiếm cơ hội áp dụng tư duy logic và kỹ năng giải quyết vấn đề trong lĩnh vực ${industry}.`,
    };

    return objectives[jobLevel] || objectives['mid'];
  }

  /**
   * Transform experience for tech roles
   * @param {Object} exp - Experience object
   * @param {string} targetJob - Target job
   * @returns {Object} Transformed experience
   */
  transformExperienceForTech(exp, targetJob) {
    if (!exp.title || !exp.description) return exp;

    const transformed = { ...exp };

    // Transform logistics/document experience to tech-relevant
    if (
      exp.title.toLowerCase().includes('chứng từ') ||
      exp.title.toLowerCase().includes('logistics') ||
      exp.description.toLowerCase().includes('xuất nhập khẩu')
    ) {
      transformed.title = this.mapLogisticsToTech(exp.title, targetJob);
      transformed.description = this.transformLogisticsDescription(
        exp.description,
        targetJob
      );
      transformed.skills = this.extractTechSkillsFromLogistics(exp.description);
    }

    return transformed;
  }

  /**
   * Map logistics role to tech role
   * @param {string} originalTitle - Original job title
   * @param {string} targetJob - Target job
   * @returns {string} Mapped title
   */
  mapLogisticsToTech(originalTitle, targetJob) {
    const mappings = {
      'Thực tập sinh chứng từ': 'Thực tập sinh Phân tích Dữ liệu',
      'Nhân viên chứng từ': 'Chuyên viên Phân tích Hệ thống',
      'Chuyên viên logistics': 'Chuyên viên Tối ưu hóa Quy trình',
      'Quản lý kho': 'Quản lý Hệ thống Thông tin',
    };

    return mappings[originalTitle] || 'Chuyên viên Phân tích Dữ liệu';
  }

  /**
   * Transform logistics description to tech-relevant
   * @param {string} description - Original description
   * @param {string} targetJob - Target job
   * @returns {string} Transformed description
   */
  transformLogisticsDescription(description, targetJob) {
    const techMappings = {
      'quy trình xử lý': 'quy trình phân tích dữ liệu',
      'chứng từ': 'dữ liệu và thông tin',
      'xuất nhập khẩu': 'xử lý và phân tích dữ liệu',
      'hải quan': 'hệ thống quản lý',
      'giao nhận': 'tối ưu hóa quy trình',
      'khách hàng': 'người dùng và stakeholders',
      'nghiên cứu tài liệu': 'phân tích và nghiên cứu dữ liệu',
      'hệ thống hóa kiến thức': 'tối ưu hóa và tự động hóa quy trình',
    };

    let transformed = description;
    Object.entries(techMappings).forEach(([old, newTerm]) => {
      transformed = transformed.replace(new RegExp(old, 'gi'), newTerm);
    });

    // Add tech-specific achievements
    const techAchievements = [
      '• Phân tích và tối ưu hóa quy trình làm việc, cải thiện hiệu suất 20%',
      '• Sử dụng Excel và các công cụ phân tích để xử lý dữ liệu lớn',
      '• Phối hợp với các bộ phận để đảm bảo tính chính xác của thông tin',
      '• Áp dụng tư duy logic để giải quyết các vấn đề phức tạp',
    ];

    return transformed + '\n' + techAchievements.join('\n');
  }

  /**
   * Extract tech skills from logistics experience
   * @param {string} description - Experience description
   * @returns {Array} Tech skills
   */
  extractTechSkillsFromLogistics(description) {
    const skillMappings = {
      'phân tích': 'Data Analysis',
      'quản lý': 'Project Management',
      'tối ưu hóa': 'Process Optimization',
      'hệ thống': 'System Analysis',
      'dữ liệu': 'Data Processing',
      excel: 'Microsoft Excel',
      'giao tiếp': 'Communication',
      'làm việc nhóm': 'Teamwork',
    };

    const skills = [];
    Object.entries(skillMappings).forEach(([keyword, skill]) => {
      if (description.toLowerCase().includes(keyword)) {
        skills.push(skill);
      }
    });

    return skills;
  }

  /**
   * Transform skills for tech roles
   * @param {Object} skills - Original skills
   * @param {string} targetJob - Target job
   * @param {Array} keywords - Target keywords
   * @returns {Object} Transformed skills
   */
  transformSkillsForTech(skills, targetJob, keywords) {
    const transformed = { ...skills };

    // Add relevant tech skills based on target job
    if (!transformed.technical) transformed.technical = [];

    const relevantTechSkills = this.getRelevantTechSkills(targetJob, keywords);
    relevantTechSkills.forEach(skill => {
      if (!transformed.technical.find(s => s.name === skill)) {
        transformed.technical.push({
          name: skill,
          level: 'beginner',
          relevance: 'high',
        });
      }
    });

    // Transform soft skills to be more tech-relevant
    if (transformed.soft) {
      transformed.soft = transformed.soft.map(skill => ({
        ...skill,
        name: this.mapSoftSkillToTech(skill.name),
      }));
    }

    return transformed;
  }

  /**
   * Get relevant tech skills for target job
   * @param {string} targetJob - Target job
   * @param {Array} keywords - Keywords
   * @returns {Array} Relevant tech skills
   */
  getRelevantTechSkills(targetJob, keywords) {
    const jobLower = targetJob.toLowerCase();
    const skills = [];

    if (jobLower.includes('frontend') || jobLower.includes('react')) {
      skills.push('HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design');
    }
    if (jobLower.includes('backend') || jobLower.includes('node')) {
      skills.push(
        'Node.js',
        'Python',
        'SQL',
        'API Development',
        'Database Design'
      );
    }
    if (jobLower.includes('fullstack') || jobLower.includes('full-stack')) {
      skills.push('JavaScript', 'React', 'Node.js', 'MongoDB', 'Git');
    }
    if (jobLower.includes('data') || jobLower.includes('analyst')) {
      skills.push('Python', 'SQL', 'Excel', 'Data Analysis', 'Statistics');
    }

    // Add keywords as skills
    keywords.forEach(keyword => {
      if (this.isTechSkill(keyword) && !skills.includes(keyword)) {
        skills.push(keyword);
      }
    });

    return skills.slice(0, 8); // Limit to 8 skills
  }

  /**
   * Check if keyword is a tech skill
   * @param {string} keyword - Keyword to check
   * @returns {boolean} Is tech skill
   */
  isTechSkill(keyword) {
    const techSkills = [
      'JavaScript',
      'Python',
      'Java',
      'React',
      'Node.js',
      'SQL',
      'MongoDB',
      'HTML',
      'CSS',
      'Git',
      'AWS',
      'Docker',
      'API',
      'Database',
    ];
    return techSkills.some(skill =>
      keyword.toLowerCase().includes(skill.toLowerCase())
    );
  }

  /**
   * Map soft skill to tech-relevant version
   * @param {string} skill - Original skill
   * @returns {string} Tech-relevant skill
   */
  mapSoftSkillToTech(skill) {
    const mappings = {
      'Kỹ năng giao tiếp': 'Communication & Documentation',
      'Kỹ năng làm việc nhóm': 'Collaborative Development',
      'Kỹ năng quản lý thời gian': 'Agile Project Management',
      'Kỹ năng kiểm tra': 'Quality Assurance & Testing',
      'Kỹ năng quản lý': 'Project Management',
      'Kỹ năng phân tích': 'Problem Solving & Analysis',
    };

    return mappings[skill] || skill;
  }

  /**
   * Generate tech projects for career changers
   * @param {string} targetJob - Target job
   * @returns {Array} Generated projects
   */
  generateTechProjects(targetJob) {
    const jobLower = targetJob.toLowerCase();

    const projects = [
      {
        name: 'Personal Portfolio Website',
        description:
          'Developed a responsive portfolio website using HTML, CSS, and JavaScript to showcase projects and skills.',
        technologies: ['HTML', 'CSS', 'JavaScript', 'Git'],
        results: [
          'Improved online presence',
          'Demonstrated web development skills',
        ],
        url: null,
      },
      {
        name: 'Data Analysis Project',
        description:
          'Analyzed business data using Excel and basic programming to identify trends and provide insights.',
        technologies: ['Excel', 'Data Analysis', 'Statistics'],
        results: [
          'Generated actionable insights',
          'Improved data-driven decision making',
        ],
        url: null,
      },
    ];

    if (jobLower.includes('frontend')) {
      projects.push({
        name: 'Responsive Web Application',
        description:
          'Built a responsive web application with modern UI/UX principles and mobile-first design.',
        technologies: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
        results: ['Enhanced user experience', 'Improved mobile compatibility'],
        url: null,
      });
    }

    return projects;
  }

  /**
   * Extract strengths from content
   * @param {Object} content - Content
   * @param {string} targetJob - Target job
   * @returns {Array} Strengths
   */
  extractStrengths(content, targetJob) {
    const strengths = [];

    if (content.experience && content.experience.length > 0) {
      strengths.push(
        'Có kinh nghiệm làm việc thực tế và hiểu quy trình nghiệp vụ'
      );
    }

    if (
      content.skills &&
      content.skills.soft &&
      content.skills.soft.length > 0
    ) {
      strengths.push('Kỹ năng mềm tốt, có khả năng làm việc nhóm và giao tiếp');
    }

    if (targetJob && targetJob.toLowerCase().includes('analyst')) {
      strengths.push(
        'Tư duy phân tích và giải quyết vấn đề từ kinh nghiệm logistics'
      );
    }

    return strengths;
  }

  /**
   * Generate improvements for career change
   * @param {Object} content - Content
   * @param {string} targetJob - Target job
   * @returns {Array} Improvements
   */
  generateImprovements(content, targetJob) {
    const improvements = [];

    if (!content.projects || content.projects.length === 0) {
      improvements.push('Thêm các dự án cá nhân để thể hiện kỹ năng lập trình');
    }

    if (
      !content.skills ||
      !content.skills.technical ||
      content.skills.technical.length === 0
    ) {
      improvements.push(
        'Bổ sung các kỹ năng công nghệ phù hợp với vị trí ứng tuyển'
      );
    }

    if (targetJob && targetJob.toLowerCase().includes('senior')) {
      improvements.push('Cần có thêm kinh nghiệm lãnh đạo và quản lý dự án');
    }

    return improvements;
  }

  /**
   * Generate recommendations for target job
   * @param {string} targetJob - Target job
   * @returns {Array} Recommendations
   */
  generateRecommendations(targetJob) {
    const recommendations = [];

    if (targetJob && targetJob.toLowerCase().includes('developer')) {
      recommendations.push('Tạo GitHub profile và showcase các dự án cá nhân');
      recommendations.push(
        'Học thêm về version control và collaborative development'
      );
    }

    if (targetJob && targetJob.toLowerCase().includes('analyst')) {
      recommendations.push(
        'Phát triển kỹ năng phân tích dữ liệu và visualization'
      );
      recommendations.push('Học SQL và các công cụ phân tích dữ liệu');
    }

    return recommendations;
  }

  /**
   * Calculate industry fit
   * @param {Object} content - Content
   * @param {string} targetJob - Target job
   * @returns {string} Industry fit level
   */
  calculateIndustryFit(content, targetJob) {
    // For career changers, start with medium and adjust based on transferable skills
    let score = 50;

    if (
      content.skills &&
      content.skills.soft &&
      content.skills.soft.length > 2
    ) {
      score += 20; // Good soft skills
    }

    if (content.experience && content.experience.length > 0) {
      score += 15; // Has work experience
    }

    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * Calculate experience match
   * @param {Object} content - Content
   * @param {string} targetJob - Target job
   * @returns {string} Experience match level
   */
  calculateExperienceMatch(content, targetJob) {
    const jobLevel = this.getJobLevel(targetJob);

    if (jobLevel === 'entry') return 'high'; // Entry level is good for career changers
    if (jobLevel === 'mid') return 'medium';
    return 'low';
  }

  /**
   * Calculate skill match
   * @param {Object} content - Content
   * @param {string} targetJob - Target job
   * @returns {string} Skill match level
   */
  calculateSkillMatch(content, targetJob) {
    let score = 30; // Base score for career changers

    if (
      content.skills &&
      content.skills.technical &&
      content.skills.technical.length > 0
    ) {
      score += 30; // Has some tech skills
    }

    if (
      content.skills &&
      content.skills.soft &&
      content.skills.soft.length > 2
    ) {
      score += 20; // Good soft skills
    }

    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Get job level from title
   * @param {string} targetJob - Target job title
   * @returns {string} Job level
   */
  getJobLevel(targetJob) {
    if (!targetJob) return 'mid';

    const jobLower = targetJob.toLowerCase();

    if (
      jobLower.includes('senior') ||
      jobLower.includes('lead') ||
      jobLower.includes('manager')
    ) {
      return 'senior';
    }
    if (
      jobLower.includes('junior') ||
      jobLower.includes('entry') ||
      jobLower.includes('intern')
    ) {
      return 'entry';
    }
    return 'mid';
  }

  /**
   * Get industry from job title
   * @param {string} targetJob - Target job title
   * @returns {string} Industry
   */
  getIndustryFromJob(targetJob) {
    if (!targetJob) return 'Technology';

    const jobLower = targetJob.toLowerCase();

    if (jobLower.includes('frontend') || jobLower.includes('ui'))
      return 'Frontend Development';
    if (jobLower.includes('backend') || jobLower.includes('api'))
      return 'Backend Development';
    if (jobLower.includes('fullstack') || jobLower.includes('full-stack'))
      return 'Full Stack Development';
    if (jobLower.includes('data') || jobLower.includes('analyst'))
      return 'Data Analysis';
    if (jobLower.includes('mobile')) return 'Mobile Development';

    return 'Technology';
  }
}

module.exports = new AICVEnhancementService();
