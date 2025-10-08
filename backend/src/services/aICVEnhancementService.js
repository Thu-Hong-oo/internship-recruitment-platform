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
        // If parsing fails, throw an error instead of falling back to career change logic.
        throw new Error('Failed to parse the response from the AI service.');
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
