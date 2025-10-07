const { GoogleGenerativeAI } = require('@google/generative-ai');
const natural = require('natural');
const { logger } = require('../utils/logger');
const aiCVEnhancementService = require('./aiCVEnhancementService');
require('dotenv').config();

// Initialize Gemini with proper model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Extended skill dictionary - more comprehensive
const COMMON_SKILLS = [
  // Programming languages
  'javascript',
  'python',
  'java',
  'c++',
  'c#',
  'php',
  'ruby',
  'go',
  'rust',
  'swift',
  'kotlin',
  'typescript',
  'r',
  'matlab',
  'scala',
  'perl',

  // Frontend
  'react',
  'vue',
  'angular',
  'html',
  'css',
  'sass',
  'tailwind',
  'bootstrap',
  'jquery',
  'next.js',
  'nuxt.js',
  'webpack',
  'vite',

  // Backend
  'node.js',
  'express',
  'django',
  'flask',
  'spring',
  'laravel',
  'rails',
  'fastapi',
  'nest.js',
  '.net',
  'asp.net',

  // Databases
  'sql',
  'mysql',
  'postgresql',
  'mongodb',
  'redis',
  'elasticsearch',
  'oracle',
  'sqlite',
  'mariadb',
  'cassandra',
  'dynamodb',

  // Cloud & DevOps
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'jenkins',
  'gitlab',
  'github',
  'terraform',
  'ansible',
  'ci/cd',
  'nginx',
  'apache',

  // Tools
  'git',
  'jira',
  'confluence',
  'figma',
  'photoshop',
  'illustrator',
  'sketch',

  // Data & AI
  'tensorflow',
  'pytorch',
  'scikit-learn',
  'pandas',
  'numpy',
  'power bi',
  'tableau',
  'excel',
  'powerpoint',
  'word',

  // Soft skills (Vietnamese + English)
  'teamwork',
  'communication',
  'leadership',
  'problem solving',
  'time management',
  'giao tiếp',
  'làm việc nhóm',
  'lãnh đạo',
  'quản lý thời gian',
  'giải quyết vấn đề',

  // Languages
  'english',
  'tiếng anh',
  'vietnamese',
  'tiếng việt',
  'chinese',
  'tiếng trung',
  'japanese',
  'tiếng nhật',
  'korean',
  'tiếng hàn',

  // Office & Business
  'tin học văn phòng',
  'microsoft office',
  'google workspace',
  'excel',
  'word',
  'powerpoint',
  'outlook',
  'ms office',

  // Specialized
  'xuất nhập khẩu',
  'export import',
  'logistics',
  'supply chain',
  'customs',
  'hải quan',
  'chứng từ',
  'documents',
  'kinh doanh quốc tế',
  'international business',
  'kế toán',
  'accounting',
  'toeic',
  'ielts',
];

class AIService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.lastExtractedText = null;

    // ✅ Use supported Gemini model
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.model = genAI.getGenerativeModel({ model: modelName });

    logger.info('Gemini model initialized:', modelName);
  }

  /**
   * Extract text from CV file with better encoding handling
   */
  async extractTextFromCV(fileBuffer, mimeType) {
    try {
      let text = '';

      if (mimeType === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else if (mimeType.includes('text')) {
        text = fileBuffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file type: ' + mimeType);
      }

      // Clean and fix Vietnamese encoding
      text = this.cleanExtractedText(text);
      return text;
    } catch (error) {
      logger.error('Error extracting text from CV:', error);
      throw error;
    }
  }

  /**
   * Clean extracted text - fix Vietnamese encoding and formatting
   */
  cleanExtractedText(text) {
    // Remove excessive whitespace between characters
    text = text.replace(
      /([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])\s+(?=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])/gi,
      '$1'
    );

    // Fix common Vietnamese name patterns
    const namePatterns = {
      'nguy n': 'Nguyễn',
      'tr n': 'Trần',
      'l ': 'Lê',
      'ph m': 'Phạm',
      'hu nh': 'Huỳnh',
      'v ': 'Vũ',
      'v ': 'Võ',
      'ng ': 'Ngô',
      'd ng': 'Dương',
      ' ng': 'Đặng',
      'b i': 'Bùi',
      ' ': 'Đỗ',
      'h ': 'Hồ',
      phan: 'Phan',
      mai: 'Mai',
      cao: 'Cao',
    };

    // Fix Vietnamese location names
    const locationPatterns = {
      'tp h ch minh': 'TP. Hồ Chí Minh',
      'h ch minh': 'Hồ Chí Minh',
      'tp hcm': 'TP. Hồ Chí Minh',
      hcm: 'Hồ Chí Minh',
      'ha n i': 'Hà Nội',
      'ha noi': 'Hà Nội',
      'da n ng': 'Đà Nẵng',
      'da nang': 'Đà Nẵng',
      'vi t nam': 'Việt Nam',
      'viet nam': 'Việt Nam',
    };

    // Fix Vietnamese education terms
    const educationPatterns = {
      'ti ng anh': 'Tiếng Anh',
      'ti ng vi t': 'Tiếng Việt',
      'tin h c': 'Tin học',
      'k thu t': 'Kỹ thuật',
      'i h c': 'Đại học',
      'c nhân': 'Cử nhân',
      'th c s ': 'Thạc sĩ',
      'ti n s ': 'Tiến sĩ',
      'cao ng': 'Cao đẳng',
      'trung c p': 'Trung cấp',
    };

    // Apply all fixes
    const allPatterns = {
      ...namePatterns,
      ...locationPatterns,
      ...educationPatterns,
    };
    for (const [wrong, correct] of Object.entries(allPatterns)) {
      const regex = new RegExp(wrong, 'gi');
      text = text.replace(regex, correct);
    }

    // Remove non-printable characters
    text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Parse resume from buffer using Gemini API with improved prompt
   */
  async parseResumeFromBuffer(fileBuffer, mimeType) {
    try {
      console.log('📝 Starting resume parsing with Gemini');
      console.log('📄 File type:', mimeType);

      // Check API key
      if (!process.env.GEMINI_API_KEY) {
        console.warn('❌ Gemini API key not configured');
        return this.fallbackParseResume();
      }

      // Extract text from file
      const text = await this.extractTextFromCV(fileBuffer, mimeType);

      if (!text || text.length < 50) {
        console.error(
          '❌ Insufficient text extracted. Length:',
          text?.length || 0
        );
        throw new Error('Could not extract sufficient text from resume');
      }

      this.lastExtractedText = text;
      console.log('✅ Text extracted successfully');
      console.log('📊 Text length:', text.length, 'characters');
      console.log('📄 Preview:', text.substring(0, 300).replace(/\n/g, ' '));

      // Enhanced Gemini prompt
      const prompt = `
Bạn là chuyên gia phân tích CV. Hãy phân tích CV này và trích xuất thông tin theo format JSON.

CV TEXT:
"""
${text}
"""

YÊU CẦU TRÍCH XUẤT:

1. THÔNG TIN CÁ NHÂN:
   - Họ tên: Tìm họ tên đầy đủ (có dấu tiếng Việt)
   - Email: Tìm địa chỉ email
   - Số điện thoại: Tìm số điện thoại (format: 0xxx hoặc +84xxx)
   - Địa chỉ: Tìm địa chỉ hiện tại
   - Ngày sinh: Tìm ngày sinh (format: dd/mm/yyyy)

2. HỌC VẤN:
   - Trường: Tên trường đại học/cao đẳng
   - Bằng cấp: Cử nhân/Kỹ sư/Thạc sĩ...
   - Ngành học: Tên ngành học
   - Năm tốt nghiệp: Năm tốt nghiệp (hoặc dự kiến)
   - GPA: 
     * Nếu có điểm số rõ ràng (3.5, 8.5, 85...) → trả về số đó
     * Nếu chỉ có xếp loại văn bản (Giỏi, Khá...) → để null, lưu vào gradeText
   - gradeText: Xếp loại văn bản (Giỏi, Khá, Xuất sắc...)

3. KINH NGHIỆM:
   - Vị trí: Chức danh công việc
   - Công ty: Tên công ty
   - Thời gian: Từ tháng/năm đến tháng/năm
   - Mô tả: Công việc và trách nhiệm chính

4. KỸ NĂNG:
   - Kỹ năng chuyên môn (technical): JavaScript, Python, Excel...
   - Kỹ năng mềm (soft skills): Giao tiếp, làm việc nhóm...
   - Ngôn ngữ (language): Tiếng Anh, TOEIC, IELTS...

5. CHỨNG CHỈ & GIẢI THƯỞNG:
   - Tất cả chứng chỉ, giải thưởng, danh hiệu được đề cập

TRẢ VỀ JSON ĐÚNG FORMAT SAU (không có markdown, không có \`\`\`):
{
  "extractedData": {
    "personalInfo": {
      "fullName": "Họ tên đầy đủ có dấu",
      "email": "email@example.com",
      "phone": "0123456789",
      "address": "Địa chỉ đầy đủ",
      "dateOfBirth": "dd/mm/yyyy"
    },
    "education": {
      "type": "university",
      "institution": "Tên trường",
      "degree": "Cử nhân",
      "field": "Ngành học",
      "graduationYear": 2025,
      "gpa": null,
      "gradeText": "Giỏi"
    },
    "experience": [
      {
        "type": "internship",
        "company": "Tên công ty",
        "position": "Vị trí",
        "location": "Địa điểm",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY",
        "description": "Mô tả chi tiết công việc"
      }
    ],
    "skills": [
      {
        "name": "Tên kỹ năng",
        "type": "technical|soft|language",
        "level": "beginner|intermediate|advanced"
      }
    ],
    "certificates": [
      {
        "name": "Tên chứng chỉ",
        "issuer": "Tổ chức cấp",
        "year": 2024
      }
    ],
    "awards": [
      {
        "name": "Tên giải thưởng",
        "year": 2024,
        "description": "Mô tả"
      }
    ]
  },
  "skills": ["skill1", "skill2", "skill3"],
  "suggestions": [
    "Gợi ý cải thiện CV",
    "Điểm mạnh cần phát huy",
    "Kỹ năng nên bổ sung"
  ]
}

LƯU Ý QUAN TRỌNG:
- Trích xuất CHÍNH XÁC từ CV, KHÔNG tạo dữ liệu giả
- Giữ NGUYÊN dấu tiếng Việt (Nguyễn Thị Thu Hậu, không phải Nguyen Thi Thu Hau)
- Nếu KHÔNG tìm thấy thông tin → để null
- Trả về JSON thuần túy, KHÔNG có markdown, KHÔNG có \`\`\`json
- Trích xuất TẤT CẢ kỹ năng: technical, soft skills, languages, certificates
`;

      console.log('🤖 Calling Gemini API...');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text();

      console.log('✅ Gemini response received');

      // Clean response - remove markdown
      responseText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '') // Remove text before first {
        .replace(/[^}]*$/, '') // Remove text after last }
        .trim();

      console.log(
        '📝 Cleaned response preview:',
        responseText.substring(0, 200)
      );

      // Parse JSON
      try {
        const parsedData = JSON.parse(responseText);

        // Validate structure
        if (!parsedData.extractedData) {
          console.warn('⚠️ Invalid response structure, using fallback');
          return this.fallbackParseResume();
        }

        // Log extracted info
        console.log('✅ Successfully parsed CV with Gemini');
        console.log(
          '👤 Name:',
          parsedData.extractedData?.personalInfo?.fullName || 'Not found'
        );
        console.log(
          '📧 Email:',
          parsedData.extractedData?.personalInfo?.email || 'Not found'
        );
        console.log(
          '📞 Phone:',
          parsedData.extractedData?.personalInfo?.phone || 'Not found'
        );
        console.log(
          '🎓 Education:',
          parsedData.extractedData?.education?.institution || 'Not found'
        );
        console.log(
          '💼 Experience count:',
          parsedData.extractedData?.experience?.length || 0
        );
        console.log('🔧 Skills count:', parsedData.skills?.length || 0);

        return parsedData;
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError.message);
        console.log('📄 Raw response:', responseText.substring(0, 500));
        return this.fallbackParseResume();
      }
    } catch (error) {
      console.error('❌ Gemini parsing error:', error.message);

      // If it's a 404 model error, log helpful message
      if (
        error.message.includes('404') ||
        error.message.includes('not found')
      ) {
        console.error(
          '⚠️ Model not found. Please update to: gemini-1.5-flash or gemini-1.5-pro'
        );
      }

      return this.fallbackParseResume();
    }
  }

  /**
   * Extract skills using Gemini AI with improved detection
   */
  async extractSkills(text) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.log('⚠️ No Gemini API, using enhanced fallback');
        return this.extractSkillsEnhanced(text);
      }

      const prompt = `
Trích xuất TẤT CẢ kỹ năng từ CV này:

CV TEXT:
"""
${text.substring(0, 4000)}
"""

BAO GỒM:
1. Kỹ năng chuyên môn: Ngôn ngữ lập trình, framework, công nghệ, phần mềm
2. Kỹ năng mềm: Giao tiếp, làm việc nhóm, lãnh đạo, quản lý thời gian
3. Ngôn ngữ: Tiếng Anh, TOEIC, IELTS, tiếng Việt, tiếng Trung...
4. Công cụ văn phòng: Excel, Word, PowerPoint, Tin học văn phòng
5. Chuyên môn: Xuất nhập khẩu, kế toán, logistics, marketing...

TRẢ VỀ JSON ARRAY (không markdown):
[
  {"name": "JavaScript", "type": "technical", "level": "intermediate"},
  {"name": "Giao tiếp", "type": "soft", "level": "intermediate"},
  {"name": "Tiếng Anh", "type": "language", "level": "intermediate"},
  {"name": "Excel", "type": "technical", "level": "advanced"}
]

QUY TẮC:
- type: "technical" | "soft" | "language"
- level: "beginner" | "intermediate" | "advanced"
- Trích xuất CHÍNH XÁC từ CV
- JSON thuần túy, không markdown
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let responseText = response
        .text()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const skills = JSON.parse(responseText);
      console.log(`✅ Extracted ${skills.length} skills with Gemini`);

      return skills;
    } catch (error) {
      console.error('❌ Gemini skill extraction failed:', error.message);
      return this.extractSkillsEnhanced(text);
    }
  }

  /**
   * Enhanced fallback skill extraction
   */
  extractSkillsEnhanced(text) {
    console.log('📝 Using enhanced skill extraction');

    const skills = [];
    const lowerText = text.toLowerCase();
    const foundSkills = new Set();

    // Search for all common skills
    COMMON_SKILLS.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const skillRegex = new RegExp(
        `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );

      if (skillRegex.test(lowerText) && !foundSkills.has(skillLower)) {
        foundSkills.add(skillLower);

        skills.push({
          name: skill,
          type: this.inferSkillType(skill),
          level: this.inferSkillLevel(text, skill),
          confidence: 0.7,
        });
      }
    });

    // Extract TOEIC/IELTS scores
    const toeicMatch = text.match(/toeic\s*:?\s*(\d{3,4})/i);
    if (toeicMatch) {
      skills.push({
        name: `TOEIC ${toeicMatch[1]}`,
        type: 'language',
        level: parseInt(toeicMatch[1]) >= 700 ? 'advanced' : 'intermediate',
        confidence: 0.95,
      });
    }

    const ieltsMatch = text.match(/ielts\s*:?\s*(\d+\.?\d*)/i);
    if (ieltsMatch) {
      skills.push({
        name: `IELTS ${ieltsMatch[1]}`,
        type: 'language',
        level: parseFloat(ieltsMatch[1]) >= 6.5 ? 'advanced' : 'intermediate',
        confidence: 0.95,
      });
    }

    console.log(`✅ Found ${skills.length} skills with enhanced fallback`);
    return skills;
  }

  /**
   * Infer skill type from name
   */
  inferSkillType(skillName) {
    const lower = skillName.toLowerCase();

    const languageSkills = [
      'english',
      'vietnamese',
      'chinese',
      'japanese',
      'korean',
      'tiếng anh',
      'tiếng việt',
      'tiếng trung',
      'tiếng nhật',
      'tiếng hàn',
      'toeic',
      'ielts',
    ];
    if (languageSkills.some(lang => lower.includes(lang))) return 'language';

    const softSkills = [
      'teamwork',
      'communication',
      'leadership',
      'management',
      'giao tiếp',
      'làm việc nhóm',
      'lãnh đạo',
      'quản lý',
    ];
    if (softSkills.some(soft => lower.includes(soft))) return 'soft';

    return 'technical';
  }

  /**
   * Infer skill level from context
   */
  inferSkillLevel(text, skill) {
    const skillContext = text.toLowerCase();
    const skillLower = skill.toLowerCase();

    const advancedKeywords = [
      'expert',
      'advanced',
      'proficient',
      'giỏi',
      'thành thạo',
      'chuyên sâu',
    ];
    const beginnerKeywords = [
      'basic',
      'beginner',
      'learning',
      'cơ bản',
      'đang học',
      'mới bắt đầu',
    ];

    const skillIndex = skillContext.indexOf(skillLower);
    if (skillIndex !== -1) {
      const context = skillContext.substring(
        Math.max(0, skillIndex - 50),
        skillIndex + 50
      );

      if (advancedKeywords.some(kw => context.includes(kw))) return 'advanced';
      if (beginnerKeywords.some(kw => context.includes(kw))) return 'beginner';
    }

    return 'intermediate';
  }

  /**
   * Improved fallback parsing with rule-based extraction
   */
  fallbackParseResume() {
    console.log('⚠️ Using fallback rule-based parsing');

    if (!this.lastExtractedText || this.lastExtractedText.length < 100) {
      console.log('❌ No text available for parsing');
      return this.getEmptyTemplate();
    }

    const text = this.lastExtractedText;
    console.log('📝 Parsing with rules from extracted text');

    const result = {
      extractedData: {
        personalInfo: this.extractPersonalInfo(text),
        education: this.extractEducationInfo(text),
        experience: this.extractExperienceInfo(text),
        skills: this.extractSkillsEnhanced(text),
        certificates: this.extractCertificates(text),
        awards: this.extractAwards(text),
      },
      skills: [],
      suggestions: [
        'Thêm chi tiết về dự án đã thực hiện',
        'Làm rõ thành tựu cụ thể bằng số liệu',
        'Bổ sung kỹ năng chuyên môn liên quan',
      ],
    };

    // Flatten skills for compatibility
    result.skills = result.extractedData.skills.map(s => s.name);

    console.log('✅ Fallback parsing complete');
    return result;
  }

  /**
   * Extract personal information
   */
  extractPersonalInfo(text) {
    const info = {};

    // Vietnamese name pattern (common surnames)
    const namePattern =
      /(?:^|\n)\s*((?:Nguyễn|Trần|Lê|Phạm|Hoàng|Huỳnh|Phan|Vũ|Võ|Đặng|Bùi|Đỗ|Hồ|Ngô|Dương|Lý|Mai|Cao|Tạ|Lưu)\s+(?:Thị|Văn|Minh|Anh|Hoàng)?\s*[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:\s+[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)*)/m;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      info.fullName = nameMatch[1].trim();
    }

    // Email
    const emailMatch = text.match(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
    );
    if (emailMatch) info.email = emailMatch[1];

    // Phone (Vietnamese format)
    const phoneMatch = text.match(/((?:\+84|84|0)(?:3|5|7|8|9)\d{8})/);
    if (phoneMatch) info.phone = phoneMatch[1];

    // Date of birth
    const dobMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (dobMatch) info.dateOfBirth = dobMatch[1];

    // Address (Vietnamese cities)
    const addressMatch = text.match(
      /([\w\s,]+(?:Hồ Chí Minh|HCM|TP\.HCM|HCMC|Hà Nội|Đà Nẵng|Cần Thơ|Biên Hòa|Nha Trang|Huế|Phường|Quận|District)[\w\s,]*)/i
    );
    if (addressMatch) info.address = addressMatch[1].trim();

    return info;
  }

  /**
   * Extract education information
   */
  extractEducationInfo(text) {
    const education = {
      type: 'university',
      institution: null,
      degree: null,
      field: null,
      graduationYear: null,
      gpa: null,
      gradeText: null, // NEW: Store original grade text
    };

    // University name
    const uniMatch = text.match(
      /(?:Đại học|University|College|Trường)\s+([^\n]{5,50})/i
    );
    if (uniMatch) education.institution = uniMatch[0].trim();

    // Degree
    const degreeMatch = text.match(
      /(Cử nhân|Kỹ sư|Thạc sĩ|Tiến sĩ|Bachelor|Master|PhD)/i
    );
    if (degreeMatch) education.degree = degreeMatch[1];

    // Field of study
    const fieldMatch = text.match(
      /(?:Ngành|Major|Field)\s*:?\s*([^\n]{5,50})/i
    );
    if (fieldMatch) education.field = fieldMatch[1].trim();

    // Graduation year
    const yearMatch = text.match(
      /(?:tốt nghiệp|graduation|graduated)\s*:?\s*(?:năm\s*)?(\d{4})/i
    );
    if (yearMatch) education.graduationYear = parseInt(yearMatch[1]);

    // GPA - FIXED: Keep numeric GPA only, store text separately
    const gpaNumericMatch = text.match(/(?:GPA|Điểm)\s*:?\s*(\d+\.?\d*)/i);
    if (gpaNumericMatch) {
      education.gpa = parseFloat(gpaNumericMatch[1]);
    }

    // Store grade text (Giỏi, Khá, etc.) separately - don't convert to number
    const gradeTextMatch = text.match(
      /(?:loại|xếp loại|grade|classification)\s*:?\s*(Xuất sắc|Giỏi|Khá|Trung bình|Yếu|Excellent|Very Good|Good|Average)/i
    );
    if (gradeTextMatch) {
      education.gradeText = gradeTextMatch[1];

      // If no numeric GPA, leave it null (let backend decide)
      if (!education.gpa) {
        education.gpa = null;
      }
    }

    return education;
  }

  /**
   * Extract work experience
   */
  extractExperienceInfo(text) {
    const experiences = [];

    // Split text into sections
    const lines = text.split('\n');
    let currentExp = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect experience title (position + company)
      const expPattern = /^(.*?)\s*(?:tại|at|@)\s*(.+)$/i;
      const datePattern =
        /(\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{4}|Hiện tại|Present|Current)/i;

      // Check if line contains dates (likely experience header)
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        if (currentExp) experiences.push(currentExp);

        currentExp = {
          type: this.inferExperienceType(line),
          position: null,
          company: null,
          startDate: dateMatch[1],
          endDate: dateMatch[2],
          description: '',
          location: null,
        };

        // Try to extract position from previous line or current line
        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        const companyMatch = line.match(
          /(?:tại|at)\s+(.+?)(?:\s+\d{1,2}\/\d{4})/i
        );

        if (companyMatch) {
          currentExp.company = companyMatch[1].trim();
          currentExp.position = prevLine || 'Not specified';
        } else if (prevLine) {
          currentExp.position = prevLine;
        }
      }
      // Collect description lines
      else if (
        (currentExp && line.startsWith('•')) ||
        line.startsWith('-') ||
        line.startsWith('*')
      ) {
        currentExp.description += line.replace(/^[•\-*]\s*/, '') + '\n';
      }
    }

    if (currentExp) experiences.push(currentExp);

    return experiences;
  }

  /**
   * Infer experience type
   */
  inferExperienceType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('thực tập') || lower.includes('intern'))
      return 'internship';
    if (lower.includes('fulltime') || lower.includes('chính thức'))
      return 'fulltime';
    if (lower.includes('parttime') || lower.includes('bán thời gian'))
      return 'parttime';
    if (lower.includes('freelance') || lower.includes('tự do'))
      return 'freelance';
    return 'internship';
  }

  /**
   * Extract certificates
   */
  extractCertificates(text) {
    const certificates = [];
    const lines = text.split('\n');

    const certPatterns = [
      /(?:chứng chỉ|certificate|certification)\s*:?\s*(.+?)(?:\s*-?\s*(\d{4}))?$/i,
      /(TOEIC|IELTS|TOEFL|AWS|Azure|Google Cloud)\s*:?\s*(\d+)?/gi,
      /(MOS|Microsoft Office Specialist)/i,
    ];

    lines.forEach(line => {
      certPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const cert = {
            name: match[1]?.trim() || match[0].trim(),
            issuer: null,
            year: null,
          };

          // Extract year if present
          const yearMatch = line.match(/(\d{4})/);
          if (yearMatch) cert.year = parseInt(yearMatch[1]);

          // Avoid duplicates
          if (!certificates.some(c => c.name === cert.name)) {
            certificates.push(cert);
          }
        }
      });
    });

    return certificates;
  }

  /**
   * Extract awards
   */
  extractAwards(text) {
    const awards = [];
    const lines = text.split('\n');

    const awardPatterns = [
      /(?:giải thưởng|award|prize|danh hiệu)\s*:?\s*(.+?)(?:\s*-?\s*(\d{4}))?$/i,
      /(?:sinh viên|student)\s+(.+?)(?:\s+(?:năm|year)\s*(\d{4}))?/i,
      /^(\d{4})\s*[-–]\s*(\d{4})?\s+(.+)$/,
    ];

    lines.forEach(line => {
      awardPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const award = {
            name: null,
            year: null,
            description: null,
          };

          if (pattern.source.includes('^(\\d{4})')) {
            // Format: "2023 - 2024 Award name"
            award.year = match[1];
            award.name = match[3]?.trim();
          } else {
            award.name = match[1]?.trim();
            const yearMatch = line.match(/(\d{4})/);
            if (yearMatch) award.year = parseInt(yearMatch[1]);
          }

          if (award.name && !awards.some(a => a.name === award.name)) {
            awards.push(award);
          }
        }
      });
    });

    return awards;
  }

  /**
   * Get empty template
   */
  getEmptyTemplate() {
    return {
      extractedData: {
        personalInfo: {
          fullName: null,
          email: null,
          phone: null,
          address: null,
          dateOfBirth: null,
        },
        education: {
          type: 'university',
          institution: null,
          degree: null,
          field: null,
          graduationYear: null,
          gpa: null,
        },
        experience: [],
        skills: [],
        certificates: [],
        awards: [],
      },
      skills: [],
      suggestions: [
        'Thêm thông tin cá nhân đầy đủ (email, phone)',
        'Bổ sung chi tiết về học vấn và kinh nghiệm',
        'Liệt kê rõ ràng các kỹ năng chuyên môn',
      ],
    };
  }

  /**
   * Generate smart resume using AI
   * @param {Object} resumeContent - Basic resume content
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Enhanced resume data
   */
  async generateResume(resumeContent, options = {}) {
    try {
      const {
        template = 'modern',
        targetJob = null,
        format = 'html',
      } = options;

      console.log('🤖 Generating AI-enhanced resume...');

      // Step 1: Analyze and enhance content with AI
      const enhancedContent = await this.enhanceResumeContent(
        resumeContent,
        targetJob
      );

      // Step 2: Generate optimized HTML
      const html = await this.generateOptimizedHTML(
        enhancedContent,
        template,
        targetJob
      );

      // Step 3: Upload to Cloudinary
      const uploadResult = await this.uploadGeneratedResume(html, format);

      return {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        format: format,
        size: uploadResult.bytes,
        content: html,
        enhancedContent,
        aiOptimized: true,
        targetJob,
      };
    } catch (error) {
      console.error('AI resume generation failed:', error);
      throw error;
    }
  }

  /**
   * Enhance resume content using AI
   * @param {Object} content - Basic resume content
   * @param {string} targetJob - Target job title
   * @returns {Promise<Object>} Enhanced content
   */
  async enhanceResumeContent(content, targetJob = null) {
    try {
      const prompt = `
Bạn là chuyên gia viết CV và career coach. Hãy cải thiện nội dung CV này để tối ưu cho công việc "${
        targetJob || 'general'
      }".

THÔNG TIN CV HIỆN TẠI:
${JSON.stringify(content, null, 2)}

YÊU CẦU CẢI THIỆN:

1. CAREER OBJECTIVE/SUMMARY:
   - Viết lại objective phù hợp với job "${targetJob || 'general'}"
   - Highlight điểm mạnh phù hợp
   - Thể hiện mục tiêu nghề nghiệp rõ ràng

2. EXPERIENCE ENHANCEMENT:
   - Viết lại mô tả công việc với action verbs
   - Quantify achievements khi có thể
   - Highlight skills phù hợp với job target
   - Sắp xếp theo độ liên quan đến job

3. SKILLS OPTIMIZATION:
   - Sắp xếp skills theo độ ưu tiên cho job
   - Thêm keywords phù hợp với job description
   - Group skills theo categories phù hợp

4. EDUCATION HIGHLIGHT:
   - Emphasize relevant coursework/projects
   - Highlight academic achievements
   - Add relevant certifications

5. PROJECTS ENHANCEMENT:
   - Viết lại project descriptions
   - Highlight technologies và results
   - Show impact và learning outcomes

TRẢ VỀ JSON FORMAT:
{
  "enhancedContent": {
    "personalInfo": {
      "fullName": "Tên đầy đủ",
      "email": "email",
      "phone": "phone",
      "address": "address",
      "bio": "Bio ngắn gọn, professional"
    },
    "objective": "Career objective tối ưu cho job target",
    "education": [
      {
        "institution": "Tên trường",
        "degree": "Bằng cấp",
        "field": "Ngành học",
        "graduationYear": 2025,
        "gpa": "GPA nếu có",
        "relevantCoursework": ["Môn học liên quan"],
        "achievements": ["Thành tích học tập"]
      }
    ],
    "experience": [
      {
        "title": "Chức danh",
        "company": "Công ty",
        "location": "Địa điểm",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY",
        "description": "Mô tả công việc được cải thiện",
        "achievements": ["Thành tích cụ thể"],
        "skills": ["Kỹ năng sử dụng"]
      }
    ],
    "skills": {
      "technical": [
        {
          "name": "Tên skill",
          "level": "beginner|intermediate|advanced",
          "relevance": "high|medium|low"
        }
      ],
      "soft": [
        {
          "name": "Tên skill",
          "level": "beginner|intermediate|advanced"
        }
      ],
      "languages": [
        {
          "name": "Ngôn ngữ",
          "level": "A1|A2|B1|B2|C1|C2",
          "certification": "Chứng chỉ nếu có"
        }
      ]
    },
    "projects": [
      {
        "name": "Tên project",
        "description": "Mô tả project được cải thiện",
        "technologies": ["Tech stack"],
        "results": ["Kết quả đạt được"],
        "url": "Link project nếu có"
      }
    ],
    "certifications": [
      {
        "name": "Tên chứng chỉ",
        "issuer": "Tổ chức cấp",
        "issueDate": "MM/YYYY",
        "credentialUrl": "Link chứng chỉ"
      }
    ]
  },
  "optimization": {
    "targetJob": "${targetJob || 'general'}",
    "keywords": ["keyword1", "keyword2"],
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "improvements": ["Cải thiện 1", "Cải thiện 2"]
  }
}

LƯU Ý:
- Giữ nguyên thông tin cá nhân chính xác
- Cải thiện cách diễn đạt, không thay đổi sự thật
- Tối ưu cho job target "${targetJob || 'general'}"
- Sử dụng action verbs và quantify achievements
- Trả về JSON thuần túy, không có markdown
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const enhanced = JSON.parse(jsonMatch[0]);
      console.log('✅ Resume content enhanced successfully');

      return enhanced;
    } catch (error) {
      console.error('Content enhancement failed:', error);
      // Return original content if enhancement fails
      return {
        enhancedContent: content,
        optimization: {
          targetJob: targetJob || 'general',
          keywords: [],
          strengths: [],
          improvements: ['AI enhancement failed, using original content'],
        },
      };
    }
  }

  /**
   * Generate optimized HTML resume
   * @param {Object} enhanced - Enhanced content
   * @param {string} template - Template name
   * @param {string} targetJob - Target job
   * @returns {Promise<string>} HTML content
   */
  async generateOptimizedHTML(enhanced, template, targetJob) {
    try {
      const content = enhanced.enhancedContent;
      const optimization = enhanced.optimization;

      // Generate dynamic CSS based on job type
      const dynamicStyles = this.getDynamicStyles(template, targetJob);

      const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${content.personalInfo.fullName}</title>
    <style>${dynamicStyles}</style>
</head>
<body>
    <div class="resume-container">
        <!-- Header -->
        <header class="header">
            <h1>${content.personalInfo.fullName}</h1>
            <div class="contact-info">
                <p>📧 ${content.personalInfo.email} | 📱 ${
        content.personalInfo.phone
      }</p>
                <p>📍 ${content.personalInfo.address}</p>
            </div>
            ${
              content.personalInfo.bio
                ? `<p class="bio">${content.personalInfo.bio}</p>`
                : ''
            }
        </header>

        <!-- Career Objective -->
        ${
          content.objective
            ? `
        <section class="section objective-section">
            <h2>🎯 Mục tiêu nghề nghiệp</h2>
            <p class="objective">${content.objective}</p>
        </section>
        `
            : ''
        }

        <!-- Education -->
        ${
          content.education && content.education.length > 0
            ? `
        <section class="section">
            <h2>🎓 Học vấn</h2>
            ${content.education
              .map(
                edu => `
                <div class="item">
                    <h3>${edu.institution || 'N/A'}</h3>
                    <p><strong>${edu.degree || 'N/A'}</strong> - ${
                  edu.field || 'N/A'
                }</p>
                    <p class="dates">${this.formatDateRange(
                      edu.startDate,
                      edu.endDate
                    )}</p>
                    ${edu.gpa ? `<p>📊 GPA: ${edu.gpa}</p>` : ''}
                    ${
                      edu.relevantCoursework &&
                      edu.relevantCoursework.length > 0
                        ? `
                        <p><strong>Môn học liên quan:</strong> ${edu.relevantCoursework.join(
                          ', '
                        )}</p>
                    `
                        : ''
                    }
                    ${
                      edu.achievements && edu.achievements.length > 0
                        ? `
                        <p><strong>Thành tích:</strong> ${edu.achievements.join(
                          ', '
                        )}</p>
                    `
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        <!-- Experience -->
        ${
          content.experience && content.experience.length > 0
            ? `
        <section class="section">
            <h2>💼 Kinh nghiệm</h2>
            ${content.experience
              .map(
                exp => `
                <div class="item">
                    <h3>${exp.title || 'N/A'}</h3>
                    <p><strong>🏢 ${exp.company || 'N/A'}</strong> | 📍 ${
                  exp.location || 'N/A'
                }</p>
                    <p class="dates">${this.formatDateRange(
                      exp.startDate,
                      exp.endDate
                    )}</p>
                    <p class="description">${exp.description || ''}</p>
                    ${
                      exp.achievements && exp.achievements.length > 0
                        ? `
                        <ul class="achievements">
                            ${exp.achievements
                              .map(ach => `<li>✅ ${ach}</li>`)
                              .join('')}
                        </ul>
                    `
                        : ''
                    }
                    ${
                      exp.skills && exp.skills.length > 0
                        ? `
                        <p><strong>🛠️ Kỹ năng:</strong> ${exp.skills.join(
                          ', '
                        )}</p>
                    `
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        <!-- Skills -->
        <section class="section">
            <h2>🛠️ Kỹ năng</h2>
            ${
              content.skills.technical && content.skills.technical.length > 0
                ? `
                <div class="skill-category">
                    <h4>💻 Kỹ năng chuyên môn</h4>
                    <div class="skills-grid">
                        ${content.skills.technical
                          .map(
                            skill => `
                            <span class="skill-tag ${
                              skill.relevance || 'medium'
                            }">
                                ${skill.name} ${
                              skill.level ? `(${skill.level})` : ''
                            }
                            </span>
                        `
                          )
                          .join('')}
                    </div>
                </div>
            `
                : ''
            }
            ${
              content.skills.soft && content.skills.soft.length > 0
                ? `
                <div class="skill-category">
                    <h4>🤝 Kỹ năng mềm</h4>
                    <div class="skills-grid">
                        ${content.skills.soft
                          .map(
                            skill => `
                            <span class="skill-tag soft">
                                ${skill.name} ${
                              skill.level ? `(${skill.level})` : ''
                            }
                            </span>
                        `
                          )
                          .join('')}
                    </div>
                </div>
            `
                : ''
            }
            ${
              content.skills.languages && content.skills.languages.length > 0
                ? `
                <div class="skill-category">
                    <h4>🌍 Ngôn ngữ</h4>
                    <div class="skills-grid">
                        ${content.skills.languages
                          .map(
                            lang => `
                            <span class="skill-tag language">
                                ${lang.name} ${
                              lang.level ? `(${lang.level})` : ''
                            }
                                ${
                                  lang.certification
                                    ? ` - ${lang.certification}`
                                    : ''
                                }
                            </span>
                        `
                          )
                          .join('')}
                    </div>
                </div>
            `
                : ''
            }
        </section>

        <!-- Projects -->
        ${
          content.projects && content.projects.length > 0
            ? `
        <section class="section">
            <h2>🚀 Dự án</h2>
            ${content.projects
              .map(
                project => `
                <div class="item">
                    <h3>${project.name || 'N/A'}</h3>
                    <p class="description">${project.description || ''}</p>
                    ${
                      project.technologies && project.technologies.length > 0
                        ? `
                        <p><strong>🛠️ Công nghệ:</strong> ${project.technologies.join(
                          ', '
                        )}</p>
                    `
                        : ''
                    }
                    ${
                      project.results && project.results.length > 0
                        ? `
                        <ul class="results">
                            ${project.results
                              .map(result => `<li>🎯 ${result}</li>`)
                              .join('')}
                        </ul>
                    `
                        : ''
                    }
                    ${
                      project.url
                        ? `<p><a href="${project.url}" target="_blank">🔗 Xem dự án</a></p>`
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        <!-- Certifications -->
        ${
          content.certifications && content.certifications.length > 0
            ? `
        <section class="section">
            <h2>🏆 Chứng chỉ</h2>
            ${content.certifications
              .map(
                cert => `
                <div class="item">
                    <h3>${cert.name || 'N/A'}</h3>
                    <p><strong>🏢 ${cert.issuer || 'N/A'}</strong></p>
                    <p class="dates">📅 Cấp ngày: ${this.formatDate(
                      cert.issueDate
                    )}</p>
                    ${
                      cert.credentialUrl
                        ? `<p><a href="${cert.credentialUrl}" target="_blank">🔗 Xem chứng chỉ</a></p>`
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        <!-- AI Optimization Info -->
        <footer class="ai-footer">
            <p>🤖 CV được tối ưu hóa bởi AI cho vị trí: <strong>${
              targetJob || 'General'
            }</strong></p>
            ${
              optimization.keywords && optimization.keywords.length > 0
                ? `
                <p>🔑 Keywords: ${optimization.keywords.join(', ')}</p>
            `
                : ''
            }
        </footer>
    </div>
</body>
</html>`;

      return html;
    } catch (error) {
      console.error('HTML generation failed:', error);
      throw error;
    }
  }

  /**
   * Get dynamic styles based on job type
   * @param {string} template - Template name
   * @param {string} targetJob - Target job
   * @returns {string} CSS styles
   */
  getDynamicStyles(template, targetJob) {
    const baseStyles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
      .resume-container { max-width: 800px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-radius: 8px; }
      .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e9ecef; }
      .header h1 { font-size: 2.5em; margin-bottom: 10px; color: #2c3e50; font-weight: 700; }
      .contact-info p { margin: 5px 0; font-size: 1.1em; color: #6c757d; }
      .bio { margin-top: 15px; font-style: italic; font-size: 1.1em; color: #495057; }
      .section { margin-bottom: 30px; }
      .section h2 { font-size: 1.5em; margin-bottom: 15px; color: #2c3e50; border-bottom: 2px solid #e9ecef; padding-bottom: 5px; }
      .item { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff; }
      .item h3 { font-size: 1.2em; margin-bottom: 5px; color: #495057; }
      .dates { color: #6c757d; font-style: italic; font-weight: 500; }
      .description { margin: 10px 0; }
      .achievements, .results { margin: 10px 0; padding-left: 20px; }
      .achievements li, .results li { margin: 5px 0; }
      .skill-category { margin-bottom: 20px; }
      .skill-category h4 { font-size: 1.1em; margin-bottom: 10px; color: #495057; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .skill-tag { padding: 5px 12px; border-radius: 20px; font-size: 0.9em; font-weight: 500; }
      .skill-tag.high { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      .skill-tag.medium { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
      .skill-tag.low { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      .skill-tag.soft { background: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }
      .skill-tag.language { background: #cce5ff; color: #004085; border: 1px solid #b3d7ff; }
      .objective-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
      .objective-section h2 { color: white; border-bottom: 2px solid rgba(255,255,255,0.3); }
      .objective { font-size: 1.1em; line-height: 1.7; }
      .ai-footer { margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center; font-size: 0.9em; color: #6c757d; }
      a { color: #007bff; text-decoration: none; font-weight: 500; }
      a:hover { text-decoration: underline; }
    `;

    // Job-specific color schemes
    const jobColors = {
      tech: { primary: '#28a745', secondary: '#20c997' },
      business: { primary: '#007bff', secondary: '#6f42c1' },
      marketing: { primary: '#fd7e14', secondary: '#e83e8c' },
      design: { primary: '#6f42c1', secondary: '#e83e8c' },
      finance: { primary: '#dc3545', secondary: '#fd7e14' },
      default: { primary: '#007bff', secondary: '#6c757d' },
    };

    const jobType = this.detectJobType(targetJob);
    const colors = jobColors[jobType] || jobColors.default;

    return (
      baseStyles +
      `
      .header h1 { color: ${colors.primary}; }
      .section h2 { color: ${colors.primary}; }
      .item { border-left-color: ${colors.primary}; }
      .skill-tag.high { background: ${colors.secondary}20; color: ${colors.primary}; border-color: ${colors.secondary}; }
    `
    );
  }

  /**
   * Detect job type for styling
   * @param {string} targetJob - Target job title
   * @returns {string} Job type
   */
  detectJobType(targetJob) {
    if (!targetJob) return 'default';

    const job = targetJob.toLowerCase();
    if (
      job.includes('developer') ||
      job.includes('engineer') ||
      job.includes('programmer')
    )
      return 'tech';
    if (
      job.includes('marketing') ||
      job.includes('social') ||
      job.includes('content')
    )
      return 'marketing';
    if (job.includes('design') || job.includes('ui') || job.includes('ux'))
      return 'design';
    if (
      job.includes('finance') ||
      job.includes('accounting') ||
      job.includes('analyst')
    )
      return 'finance';
    if (
      job.includes('business') ||
      job.includes('manager') ||
      job.includes('sales')
    )
      return 'business';

    return 'default';
  }

  /**
   * Upload generated resume to Cloudinary
   * @param {string} html - HTML content
   * @param {string} format - File format
   * @returns {Promise<Object>} Upload result
   */
  async uploadGeneratedResume(html, format = 'html') {
    try {
      console.log(`📤 Uploading AI-generated resume with format: ${format}`);

      // For HTML, use proper HTML upload
      if (format === 'html') {
        const fileName = `ai_resume_${Date.now()}.html`;
        const fileBuffer = Buffer.from(html, 'utf8');

        console.log(`File size: ${fileBuffer.length} bytes`);

        // Upload HTML as raw file with proper format
        const uploadOptions = {
          public_id: `ai_generated_resume_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          resource_type: 'raw',
          format: 'html', // Specify HTML format
          type: 'upload',
          use_filename: false,
          unique_filename: true,
        };

        console.log('Upload options:', uploadOptions);

        try {
          const { uploadFile } = require('./fileUploadService');
          const uploadResult = await uploadFile(
            'document',
            fileBuffer,
            uploadOptions
          );

          console.log('✅ HTML Resume uploaded successfully:', {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
          });

          return uploadResult;
        } catch (uploadError) {
          console.log('📤 Standard upload failed, trying base64 upload...');
          return await this.directCloudinaryUpload(html, format);
        }
      } else {
        // For other formats, use text upload
        const fileName = `ai_resume_${Date.now()}.txt`;
        const fileBuffer = Buffer.from(html, 'utf8');

        const uploadOptions = {
          public_id: `ai_generated_resume_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          resource_type: 'raw',
          type: 'upload',
          use_filename: false,
          unique_filename: true,
        };

        const { uploadFile } = require('./fileUploadService');
        const uploadResult = await uploadFile(
          'document',
          fileBuffer,
          uploadOptions
        );

        return {
          ...uploadResult,
          originalFormat: 'html',
          displayFormat: format,
        };
      }
    } catch (error) {
      console.error('Resume upload failed:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        http_code: error.http_code,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Direct Cloudinary upload as fallback
   * @param {string} html - HTML content
   * @param {string} format - File format
   * @returns {Promise<Object>} Upload result
   */
  async directCloudinaryUpload(html, format) {
    try {
      const cloudinary = require('cloudinary').v2;

      console.log('📤 Attempting direct Cloudinary upload...');

      // Create proper data URI for HTML content
      const dataUri = `data:text/html;base64,${Buffer.from(
        html,
        'utf8'
      ).toString('base64')}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'raw',
        public_id: `ai_resume_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        folder: 'internbridge/documents',
        format: format, // Preserve original format
      });

      console.log('✅ Direct HTML upload successful:', result.secure_url);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: format,
        type: 'ai_generated',
      };
    } catch (directError) {
      console.error('❌ Direct upload also failed:', directError);
      throw new Error(`All upload methods failed: ${directError.message}`);
    }
  }

  /**
   * Helper: Format date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {string} Formatted date range
   */
  formatDateRange(startDate, endDate) {
    const start = this.formatDate(startDate);
    const end = endDate ? this.formatDate(endDate) : 'Hiện tại';
    return `${start} - ${end}`;
  }

  /**
   * Helper: Format date
   * @param {string} date - Date string
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return date;
    }
  }

  /**
   * Calculate match score between CV and job
   */
  async calculateMatchScore(cvText, jobData, cvSkills = []) {
    try {
      const scores = {
        skills: 0,
        experience: 0,
        education: 0,
        keywords: 0,
        overall: 0,
      };

      // Skills matching (45% weight)
      if (jobData.skills && cvSkills.length > 0) {
        const requiredSkills = jobData.skills
          .filter(s => s.required)
          .map(s => s.name.toLowerCase());
        const niceToHaveSkills = jobData.skills
          .filter(s => !s.required)
          .map(s => s.name.toLowerCase());

        const cvSkillNames = cvSkills.map(s =>
          typeof s === 'string' ? s.toLowerCase() : s.name.toLowerCase()
        );

        const requiredMatch = requiredSkills.filter(skill =>
          cvSkillNames.some(
            cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill)
          )
        ).length;

        const niceToHaveMatch = niceToHaveSkills.filter(skill =>
          cvSkillNames.some(
            cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill)
          )
        ).length;

        scores.skills =
          (requiredMatch / Math.max(requiredSkills.length, 1)) * 0.7 +
          (niceToHaveMatch / Math.max(niceToHaveSkills.length, 1)) * 0.3;
      }

      // Experience matching (20% weight)
      if (jobData.experience) {
        const experienceKeywords = [
          'experience',
          'years',
          'worked',
          'kinh nghiệm',
          'năm',
        ];
        const hasExperience = experienceKeywords.some(kw =>
          cvText.toLowerCase().includes(kw)
        );
        scores.experience = hasExperience ? 0.8 : 0.3;
      }

      // Education matching (10% weight)
      if (jobData.education) {
        const educationKeywords = [
          'bachelor',
          'master',
          'university',
          'đại học',
          'cử nhân',
          'thạc sĩ',
        ];
        const hasEducation = educationKeywords.some(kw =>
          cvText.toLowerCase().includes(kw)
        );
        scores.education = hasEducation ? 0.9 : 0.4;
      }

      // Keyword similarity (25% weight)
      const jobText = `${jobData.description || ''} ${
        jobData.requirements || ''
      }`;
      scores.keywords = this.calculateTextSimilarity(cvText, jobText);

      // Overall weighted score
      scores.overall =
        scores.skills * 0.45 +
        scores.experience * 0.2 +
        scores.education * 0.1 +
        scores.keywords * 0.25;

      return scores;
    } catch (error) {
      logger.error('Error calculating match score:', error);
      throw error;
    }
  }

  /**
   * Calculate text similarity (Jaccard coefficient)
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(
      text1
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
    const words2 = new Set(
      text2
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / Math.max(union.size, 1);
  }

  /**
   * Identify skill gaps
   */
  identifySkillGaps(cvSkills, jobSkills) {
    const gaps = [];
    const cvSkillNames = cvSkills.map(s =>
      typeof s === 'string' ? s.toLowerCase() : s.name.toLowerCase()
    );

    jobSkills.forEach(jobSkill => {
      const hasSkill = cvSkillNames.some(
        cvSkill =>
          cvSkill.includes(jobSkill.name.toLowerCase()) ||
          jobSkill.name.toLowerCase().includes(cvSkill)
      );

      if (!hasSkill) {
        gaps.push({
          skill: jobSkill.name,
          required: jobSkill.required || false,
          level: jobSkill.level || 'intermediate',
          importance: jobSkill.required ? 0.9 : 0.6,
        });
      }
    });

    return gaps.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Generate personalized skill roadmap
   */
  async generateSkillRoadmap(skillGaps, userProfile, duration = 8) {
    try {
      if (!process.env.GEMINI_API_KEY || skillGaps.length === 0) {
        return this.getDefaultRoadmap(skillGaps, duration);
      }

      const prompt = `
Tạo lộ trình học ${duration} tuần cho các kỹ năng này:

Skill gaps: ${JSON.stringify(skillGaps.slice(0, 5))}
Nền tảng: ${userProfile?.education?.field || 'General'}

Trả về JSON:
{
  "weeks": [
    {
      "week": 1,
      "focus": "skill_name",
      "objectives": ["mục tiêu 1", "mục tiêu 2"],
      "resources": [
        {"title": "tên tài liệu", "type": "video|article|course", "duration": "10 hours"}
      ],
      "exercises": ["bài tập 1"],
      "milestone": "hoàn thành"
    }
  ],
  "estimatedTotalHours": 120,
  "difficulty": "beginner|intermediate|advanced"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let responseText = response
        .text()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error generating roadmap:', error);
      return this.getDefaultRoadmap(skillGaps, duration);
    }
  }

  /**
   * Default roadmap template
   */
  getDefaultRoadmap(skillGaps, duration) {
    const weeks = skillGaps.slice(0, duration).map((gap, index) => ({
      week: index + 1,
      focus: gap.skill,
      objectives: [
        `Học ${gap.skill} fundamentals`,
        `Thực hành với dự án thực tế`,
      ],
      resources: [
        {
          title: `${gap.skill} Tutorial`,
          type: 'course',
          duration: '10-15 hours',
        },
      ],
      exercises: [`Xây dựng project sử dụng ${gap.skill}`],
      milestone: `Hoàn thành ${gap.skill} basics`,
    }));

    return {
      weeks,
      estimatedTotalHours: duration * 15,
      difficulty: 'intermediate',
    };
  }

  /**
   * Analyze CV content
   */
  async analyzeCVContent(cvText, jobRequirements = null) {
    try {
      const analysis = {
        skills: await this.extractSkills(cvText),
        experience: this.extractExperienceInfo(cvText),
        education: this.extractEducationInfo(cvText),
        contact: this.extractPersonalInfo(cvText),
        summary: this.extractSummary(cvText),
      };

      if (jobRequirements) {
        analysis.matchScore = await this.calculateMatchScore(
          cvText,
          jobRequirements,
          analysis.skills
        );
        analysis.skillGaps = this.identifySkillGaps(
          analysis.skills,
          jobRequirements.skills || []
        );
      }

      return analysis;
    } catch (error) {
      logger.error('Error analyzing CV:', error);
      throw error;
    }
  }

  /**
   * Extract summary from CV
   */
  extractSummary(cvText) {
    const lines = cvText.split('\n').filter(line => line.trim().length > 50);

    // Look for objective or summary section
    const summaryKeywords = [
      'mục tiêu',
      'objective',
      'summary',
      'profile',
      'about',
    ];
    let summaryText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(kw => line.includes(kw))) {
        // Collect next few lines
        summaryText = lines.slice(i + 1, i + 4).join(' ');
        break;
      }
    }

    return summaryText || cvText.substring(0, 300);
  }

  /**
   * Analyze job description
   */
  async analyzeJobDescription(description) {
    try {
      if (!process.env.GEMINI_API_KEY || !description) {
        return this.getDefaultJobAnalysis();
      }

      const prompt = `
Phân tích job description này:
${description.substring(0, 2000)}

Trả về JSON:
{
  "skillsExtracted": ["skill1", "skill2"],
  "difficulty": "beginner|intermediate|advanced",
  "category": "tech|business|marketing|design|data",
  "responsibilities": ["resp1", "resp2"],
  "experienceLevel": "entry|mid|senior"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response
        .text()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const analysis = JSON.parse(text);
      analysis.lastAnalyzedAt = new Date();
      return analysis;
    } catch (error) {
      logger.error('Error analyzing job:', error);
      return this.getDefaultJobAnalysis();
    }
  }

  /**
   * Default job analysis
   */
  getDefaultJobAnalysis() {
    return {
      skillsExtracted: [],
      difficulty: 'intermediate',
      category: 'tech',
      responsibilities: [],
      experienceLevel: 'entry',
      lastAnalyzedAt: new Date(),
    };
  }

  /**
   * Semantic search (simplified)
   */
  async semanticSearch(query, type = 'jobs', limit = 10) {
    logger.info(`Semantic search: ${query}, type: ${type}`);
    return [];
  }

  /**
   * Generate enhanced CV with AI optimization
   * @param {Object} resumeContent - Resume content data
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated CV data
   */
  async generateEnhancedCV(resumeContent, options = {}) {
    try {
      const {
        template = 'modern',
        targetJob = null,
        format = 'html',
        customization = {},
      } = options;

      console.log('🎨 Generating enhanced CV with AI:', {
        template,
        targetJob,
        format,
      });

      // Step 1: Enhance content with AI using enhanced service
      const enhancedContent = await aiCVEnhancementService.enhanceResumeContent(
        resumeContent,
        targetJob,
        options.jobDescription
      );

      // Step 2: Apply customization
      const customizedContent = this.applyCustomization(
        enhancedContent.enhancedContent,
        customization
      );

      // Step 3: Generate optimized HTML with template
      const html = await this.generateTemplateHTML(
        customizedContent,
        template,
        targetJob,
        customization
      );

      // Step 4: Upload to cloud storage
      const uploadResult = await this.uploadGeneratedResume(html, format);

      return {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        format: format,
        size: uploadResult.bytes,
        content: html,
        enhancedContent: customizedContent,
        optimization: enhancedContent.optimization,
        template,
        customization,
        aiOptimized: true,
        targetJob,
      };
    } catch (error) {
      console.error('Enhanced CV generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate preview HTML without AI enhancement (for speed)
   * @param {Object} content - Resume content
   * @param {string} template - Template name
   * @param {Object} customization - Customization options
   * @returns {Promise<string>} Preview HTML
   */
  async generatePreviewHTML(content, template, customization = {}) {
    try {
      console.log('🔍 Generating preview HTML for template:', template);

      // Use direct template generation without AI enhancement
      const html = await this.generateTemplateHTML(
        content,
        template,
        null, // No target job for preview
        customization
      );

      return html;
    } catch (error) {
      console.error('Preview HTML generation failed:', error);
      throw error;
    }
  }

  /**
   * Apply customization to content
   * @param {Object} content - Resume content
   * @param {Object} customization - Customization options
   * @returns {Object} Customized content
   */
  applyCustomization(content, customization) {
    const customized = JSON.parse(JSON.stringify(content)); // Deep clone

    // Apply section reordering
    if (customization.sectionOrder) {
      customized._sectionOrder = customization.sectionOrder;
    }

    // Apply skill highlighting
    if (customization.highlightSkills && customized.skills) {
      const highlightSkills = customization.highlightSkills;

      if (customized.skills.technical) {
        customized.skills.technical = customized.skills.technical.map(
          skill => ({
            ...skill,
            highlighted: highlightSkills.includes(skill.name),
          })
        );
      }
    }

    // Apply content personalization
    if (customization.personalBranding) {
      const branding = customization.personalBranding;

      if (branding.tagline && customized.personalInfo) {
        customized.personalInfo.tagline = branding.tagline;
      }

      if (branding.summary && customized.objective) {
        customized.objective = branding.summary;
      }
    }

    return customized;
  }

  /**
   * Generate template-specific HTML
   * @param {Object} content - Resume content
   * @param {string} template - Template name
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {Promise<string>} Generated HTML
   */
  async generateTemplateHTML(content, template, targetJob, customization = {}) {
    try {
      console.log(`🎨 Generating ${template} template HTML`);

      const templateGenerators = {
        modern: this.generateModernTemplate,
        classic: this.generateClassicTemplate,
        creative: this.generateCreativeTemplate,
        minimal: this.generateMinimalTemplate,
        executive: this.generateExecutiveTemplate,
        'student-tech': this.generateStudentTechTemplate,
        'business-professional': this.generateBusinessProfessionalTemplate,
        healthcare: this.generateHealthcareTemplate,
        education: this.generateEducationTemplate,
        marketing: this.generateMarketingTemplate,
      };

      const generator =
        templateGenerators[template] || templateGenerators.modern;
      return await generator.call(this, content, targetJob, customization);
    } catch (error) {
      console.error(`Template ${template} generation failed:`, error);
      // Fallback to modern template
      return await this.generateModernTemplate(
        content,
        targetJob,
        customization
      );
    }
  }

  /**
   * Generate Modern template
   * @param {Object} content - Resume content
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {string} Generated HTML
   */
  generateModernTemplate(content, targetJob, customization = {}) {
    const colors = customization.colors || {
      primary: '#2c3e50',
      secondary: '#3498db',
      accent: '#27ae60',
    };

    const fonts = customization.fonts || {
      heading: 'Segoe UI',
      body: 'Segoe UI',
    };

    const layout = customization.layout || 'two-column';

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${
      content.personalInfo?.fullName || 'Professional Resume'
    }</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: '${
              fonts.body
            }', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa; 
        }
        .resume-container { 
            max-width: 1000px; 
            margin: 20px auto; 
            background: white; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            border-radius: 10px;
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, ${colors.primary} 0%, ${
      colors.secondary
    } 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
        }
        .header h1 { 
            font-family: '${fonts.heading}', sans-serif;
            font-size: 2.8em; 
            margin-bottom: 10px; 
            font-weight: 700; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header .tagline { 
            font-size: 1.2em; 
            opacity: 0.9; 
            margin-bottom: 20px; 
            font-style: italic; 
        }
        .contact-info { 
            display: flex; 
            justify-content: center; 
            gap: 30px; 
            flex-wrap: wrap;
            margin-top: 20px;
        }
        .contact-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 1em;
        }
        .contact-item i { 
            font-size: 1.2em; 
        }
        .main-content { 
            display: ${layout === 'two-column' ? 'grid' : 'block'};
            ${
              layout === 'two-column'
                ? 'grid-template-columns: 1fr 2fr; gap: 0;'
                : ''
            }
        }
        .sidebar { 
            background: #f8f9fa; 
            padding: 40px 30px;
            ${layout === 'single-column' ? 'display: none;' : ''}
        }
        .main-sections { 
            padding: 40px;
        }
        .section { 
            margin-bottom: 35px; 
        }
        .section h2 { 
            font-family: '${fonts.heading}', sans-serif;
            font-size: 1.5em; 
            margin-bottom: 20px; 
            color: ${colors.primary}; 
            border-bottom: 3px solid ${colors.accent}; 
            padding-bottom: 8px; 
            position: relative;
        }
        .section h2::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 50px;
            height: 3px;
            background: ${colors.secondary};
        }
        .item { 
            margin-bottom: 25px; 
            padding: 20px; 
            background: #fdfdfd; 
            border-radius: 8px; 
            border-left: 4px solid ${colors.accent}; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .item h3 { 
            font-size: 1.3em; 
            margin-bottom: 8px; 
            color: ${colors.primary}; 
            font-weight: 600;
        }
        .item .meta { 
            color: #666; 
            font-style: italic; 
            margin-bottom: 10px; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .item .description { 
            margin: 12px 0; 
            line-height: 1.7;
        }
        .skills-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
            gap: 12px; 
            margin-top: 15px;
        }
        .skill-tag { 
            padding: 8px 16px; 
            border-radius: 25px; 
            font-size: 0.9em; 
            font-weight: 500; 
            text-align: center;
            transition: all 0.3s ease;
        }
        .skill-tag.technical { 
            background: linear-gradient(135deg, ${colors.secondary}20, ${
      colors.accent
    }20); 
            color: ${colors.primary}; 
            border: 2px solid ${colors.secondary}30;
        }
        .skill-tag.soft { 
            background: linear-gradient(135deg, ${colors.accent}20, ${
      colors.primary
    }20); 
            color: ${colors.primary}; 
            border: 2px solid ${colors.accent}30;
        }
        .skill-tag.language { 
            background: linear-gradient(135deg, ${colors.primary}20, ${
      colors.secondary
    }20); 
            color: ${colors.primary}; 
            border: 2px solid ${colors.primary}30;
        }
        .skill-tag.highlighted {
            background: linear-gradient(135deg, ${colors.accent}, ${
      colors.secondary
    });
            color: white;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .achievements ul { 
            margin: 15px 0; 
            padding-left: 25px; 
        }
        .achievements li { 
            margin: 8px 0; 
            position: relative;
        }
        .achievements li::marker {
            color: ${colors.accent};
            font-size: 1.2em;
        }
        .objective-section { 
            background: linear-gradient(135deg, ${colors.primary}15, ${
      colors.secondary
    }15); 
            padding: 25px; 
            border-radius: 10px; 
            margin-bottom: 35px;
            border: 1px solid ${colors.secondary}30;
        }
        .objective-section h2 { 
            color: ${colors.primary}; 
            margin-bottom: 15px;
        }
        .objective { 
            font-size: 1.1em; 
            line-height: 1.7; 
            color: #444;
            font-style: italic;
        }
        .progress-bar {
            background: #e0e0e0;
            border-radius: 10px;
            height: 8px;
            margin-top: 5px;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(90deg, ${colors.accent}, ${
      colors.secondary
    });
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        .footer { 
            background: ${colors.primary}; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .resume-container { margin: 10px; }
            .main-content { grid-template-columns: 1fr; }
            .sidebar { padding: 20px; }
            .main-sections { padding: 20px; }
            .contact-info { flex-direction: column; gap: 15px; }
            .skills-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <!-- Header -->
        <header class="header">
            <h1>${content.personalInfo?.fullName || 'Professional Resume'}</h1>
            ${
              content.personalInfo?.tagline
                ? `<div class="tagline">${content.personalInfo.tagline}</div>`
                : ''
            }
            <div class="contact-info">
                ${
                  content.personalInfo?.email
                    ? `<div class="contact-item">📧 ${content.personalInfo.email}</div>`
                    : ''
                }
                ${
                  content.personalInfo?.phone
                    ? `<div class="contact-item">📱 ${content.personalInfo.phone}</div>`
                    : ''
                }
                ${
                  content.personalInfo?.address
                    ? `<div class="contact-item">📍 ${content.personalInfo.address}</div>`
                    : ''
                }
                ${
                  content.personalInfo?.linkedin
                    ? `<div class="contact-item">💼 LinkedIn</div>`
                    : ''
                }
                ${
                  content.personalInfo?.github
                    ? `<div class="contact-item">💻 GitHub</div>`
                    : ''
                }
            </div>
        </header>

        <div class="main-content">
            ${
              layout === 'two-column'
                ? this.generateSidebar(content, colors)
                : ''
            }
            
            <div class="main-sections">
                ${this.generateMainSections(
                  content,
                  customization,
                  colors,
                  fonts
                )}
            </div>
        </div>

        ${
          targetJob
            ? `
        <footer class="footer">
            🤖 CV được tối ưu hóa bởi AI cho vị trí: <strong>${targetJob}</strong>
        </footer>
        `
            : ''
        }
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate Classic template
   * @param {Object} content - Resume content
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {string} Generated HTML
   */
  generateClassicTemplate(content, targetJob, customization = {}) {
    const colors = {
      primary: '#000000',
      secondary: '#333333',
      accent: '#666666',
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${content.personalInfo?.fullName || 'Resume'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Times New Roman', Times, serif; 
            line-height: 1.5; 
            color: #000; 
            background: white; 
            font-size: 12pt;
        }
        .resume-container { 
            max-width: 8.5in; 
            margin: 0 auto; 
            padding: 1in; 
            background: white; 
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 { 
            font-size: 24pt; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .contact-info { 
            font-size: 11pt; 
            line-height: 1.4;
        }
        .section { 
            margin-bottom: 25px; 
        }
        .section h2 { 
            font-size: 14pt; 
            font-weight: bold; 
            margin-bottom: 15px; 
            text-transform: uppercase; 
            border-bottom: 1px solid #000; 
            padding-bottom: 5px; 
        }
        .item { 
            margin-bottom: 20px; 
        }
        .item h3 { 
            font-size: 12pt; 
            font-weight: bold; 
            margin-bottom: 5px; 
        }
        .item .meta { 
            font-style: italic; 
            margin-bottom: 8px; 
            font-size: 11pt;
        }
        .item .description { 
            text-align: justify; 
            margin-bottom: 10px;
        }
        .skills-list { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 5px; 
        }
        .skill-item { 
            font-size: 11pt; 
        }
        .skill-item:not(:last-child)::after { 
            content: ', '; 
        }
        ul { 
            padding-left: 20px; 
        }
        li { 
            margin-bottom: 5px; 
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <header class="header">
            <h1>${content.personalInfo?.fullName || 'Resume'}</h1>
            <div class="contact-info">
                ${
                  content.personalInfo?.address
                    ? `${content.personalInfo.address}<br>`
                    : ''
                }
                ${
                  content.personalInfo?.phone
                    ? `Tel: ${content.personalInfo.phone} | `
                    : ''
                }
                ${
                  content.personalInfo?.email
                    ? `Email: ${content.personalInfo.email}`
                    : ''
                }
            </div>
        </header>

        ${this.generateClassicSections(content)}
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate Creative template
   * @param {Object} content - Resume content
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {string} Generated HTML
   */
  generateCreativeTemplate(content, targetJob, customization = {}) {
    const colors = customization.colors || {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      accent: '#45b7d1',
    };

    // Creative template with more visual elements and modern design
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${content.personalInfo?.fullName || 'Creative Resume'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', 'Helvetica', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .resume-container { 
            max-width: 1000px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header { 
            background: linear-gradient(135deg, ${colors.primary}, ${
      colors.secondary
    }); 
            color: white; 
            padding: 60px 40px; 
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 40%;
            height: 200%;
            background: rgba(255,255,255,0.1);
            transform: rotate(15deg);
        }
        .header h1 { 
            font-size: 3em; 
            margin-bottom: 15px; 
            font-weight: 800;
            position: relative;
            z-index: 2;
        }
        .header .subtitle { 
            font-size: 1.4em; 
            opacity: 0.9; 
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }
        .contact-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px;
            position: relative;
            z-index: 2;
        }
        .contact-item { 
            background: rgba(255,255,255,0.2); 
            padding: 15px; 
            border-radius: 10px; 
            backdrop-filter: blur(10px);
        }
        .main-content { 
            display: grid; 
            grid-template-columns: 1fr 2fr; 
            gap: 0;
        }
        .sidebar { 
            background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%); 
            padding: 40px 30px;
        }
        .main-sections { 
            padding: 40px;
        }
        .section { 
            margin-bottom: 40px; 
        }
        .section h2 { 
            font-size: 1.8em; 
            margin-bottom: 25px; 
            color: ${colors.primary}; 
            position: relative;
            display: inline-block;
        }
        .section h2::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, ${colors.primary}, ${
      colors.secondary
    });
            border-radius: 2px;
        }
        .item { 
            margin-bottom: 30px; 
            padding: 25px; 
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); 
            border-radius: 15px; 
            border: 1px solid #e9ecef;
            position: relative;
            overflow: hidden;
        }
        .item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(180deg, ${colors.primary}, ${
      colors.secondary
    });
        }
        .item h3 { 
            font-size: 1.4em; 
            margin-bottom: 10px; 
            color: ${colors.primary}; 
            font-weight: 700;
        }
        .creative-skills { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); 
            gap: 15px; 
        }
        .skill-card { 
            background: linear-gradient(135deg, ${colors.secondary}, ${
      colors.accent
    }); 
            color: white; 
            padding: 20px 15px; 
            border-radius: 15px; 
            text-align: center; 
            font-weight: 600;
            transform: perspective(1000px) rotateY(5deg);
            transition: all 0.3s ease;
        }
        .skill-card:hover {
            transform: perspective(1000px) rotateY(0deg) scale(1.05);
        }
        
        @media (max-width: 768px) {
            .main-content { grid-template-columns: 1fr; }
            .header { padding: 40px 20px; }
            .header h1 { font-size: 2.2em; }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        ${this.generateCreativeHeader(content, colors)}
        <div class="main-content">
            ${this.generateCreativeSidebar(content, colors)}
            <div class="main-sections">
                ${this.generateCreativeMainSections(content, colors)}
            </div>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate helper methods for templates
   */
  generateSidebar(content, colors) {
    return `
    <div class="sidebar">
        <!-- Skills Section -->
        ${
          content.skills &&
          (content.skills.technical ||
            content.skills.soft ||
            content.skills.languages)
            ? `
        <div class="section">
            <h2>🛠️ Kỹ năng</h2>
            ${
              content.skills.technical
                ? `
            <div class="skill-category">
                <h4>💻 Chuyên môn</h4>
                <div class="skills-grid">
                    ${content.skills.technical
                      .map(
                        skill => `
                        <div class="skill-tag technical ${
                          skill.highlighted ? 'highlighted' : ''
                        }">
                            ${skill.name}
                            ${
                              skill.level
                                ? `
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${this.getLevelPercentage(
                                  skill.level
                                )}%"></div>
                            </div>
                            `
                                : ''
                            }
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
            `
                : ''
            }
            
            ${
              content.skills.soft
                ? `
            <div class="skill-category">
                <h4>🤝 Kỹ năng mềm</h4>
                <div class="skills-grid">
                    ${content.skills.soft
                      .map(
                        skill => `
                        <div class="skill-tag soft">
                            ${skill.name}
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
            `
                : ''
            }
            
            ${
              content.skills.languages
                ? `
            <div class="skill-category">
                <h4>🌍 Ngôn ngữ</h4>
                <div class="skills-grid">
                    ${content.skills.languages
                      .map(
                        lang => `
                        <div class="skill-tag language">
                            ${lang.name} ${lang.level ? `(${lang.level})` : ''}
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
            `
                : ''
            }
        </div>
        `
            : ''
        }

        <!-- Certifications -->
        ${
          content.certifications && content.certifications.length > 0
            ? `
        <div class="section">
            <h2>🏆 Chứng chỉ</h2>
            ${content.certifications
              .map(
                cert => `
                <div class="item">
                    <h4>${cert.name}</h4>
                    <p><strong>${cert.issuer}</strong></p>
                    <p class="meta">${this.formatDate(cert.issueDate)}</p>
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }
    </div>
    `;
  }

  generateMainSections(content, customization, colors, fonts) {
    const sectionOrder = customization.sectionOrder || [
      'objective',
      'experience',
      'education',
      'projects',
    ];

    const sections = {
      objective: this.generateObjectiveSection(content),
      experience: this.generateExperienceSection(content),
      education: this.generateEducationSection(content),
      projects: this.generateProjectsSection(content),
    };

    return sectionOrder.map(sectionKey => sections[sectionKey] || '').join('');
  }

  generateObjectiveSection(content) {
    if (!content.objective) return '';

    return `
    <section class="objective-section">
        <h2>🎯 Mục tiêu nghề nghiệp</h2>
        <p class="objective">${content.objective}</p>
    </section>
    `;
  }

  generateExperienceSection(content) {
    if (!content.experience || content.experience.length === 0) return '';

    return `
    <section class="section">
        <h2>💼 Kinh nghiệm</h2>
        ${content.experience
          .map(
            exp => `
            <div class="item">
                <h3>${exp.title || exp.position || 'N/A'}</h3>
                <div class="meta">
                    <span><strong>🏢 ${exp.company || 'N/A'}</strong></span>
                    <span>${this.formatDateRange(
                      exp.startDate,
                      exp.endDate
                    )}</span>
                </div>
                ${exp.location ? `<p>📍 ${exp.location}</p>` : ''}
                ${
                  exp.description
                    ? `<div class="description">${exp.description}</div>`
                    : ''
                }
                ${
                  exp.achievements && exp.achievements.length > 0
                    ? `
                    <div class="achievements">
                        <ul>
                            ${exp.achievements
                              .map(ach => `<li>${ach}</li>`)
                              .join('')}
                        </ul>
                    </div>
                `
                    : ''
                }
                ${
                  exp.skills && exp.skills.length > 0
                    ? `
                    <p><strong>🛠️ Kỹ năng:</strong> ${exp.skills.join(', ')}</p>
                `
                    : ''
                }
            </div>
        `
          )
          .join('')}
    </section>
    `;
  }

  generateEducationSection(content) {
    if (!content.education || content.education.length === 0) return '';

    return `
    <section class="section">
        <h2>🎓 Học vấn</h2>
        ${content.education
          .map(
            edu => `
            <div class="item">
                <h3>${edu.institution || 'N/A'}</h3>
                <div class="meta">
                    <span><strong>${edu.degree || 'N/A'}</strong> - ${
              edu.field || 'N/A'
            }</span>
                    <span>${
                      edu.graduationYear ||
                      this.formatDateRange(edu.startDate, edu.endDate)
                    }</span>
                </div>
                ${edu.gpa ? `<p>📊 GPA: ${edu.gpa}</p>` : ''}
                ${
                  edu.relevantCoursework && edu.relevantCoursework.length > 0
                    ? `
                    <p><strong>Môn học liên quan:</strong> ${edu.relevantCoursework.join(
                      ', '
                    )}</p>
                `
                    : ''
                }
                ${
                  edu.achievements && edu.achievements.length > 0
                    ? `
                    <p><strong>Thành tích:</strong> ${edu.achievements.join(
                      ', '
                    )}</p>
                `
                    : ''
                }
            </div>
        `
          )
          .join('')}
    </section>
    `;
  }

  generateProjectsSection(content) {
    if (!content.projects || content.projects.length === 0) return '';

    return `
    <section class="section">
        <h2>🚀 Dự án</h2>
        ${content.projects
          .map(
            project => `
            <div class="item">
                <h3>${project.name || project.title || 'N/A'}</h3>
                ${
                  project.description
                    ? `<div class="description">${project.description}</div>`
                    : ''
                }
                ${
                  project.technologies && project.technologies.length > 0
                    ? `
                    <p><strong>🛠️ Công nghệ:</strong> ${project.technologies.join(
                      ', '
                    )}</p>
                `
                    : ''
                }
                ${
                  project.results && project.results.length > 0
                    ? `
                    <div class="achievements">
                        <strong>🎯 Kết quả:</strong>
                        <ul>
                            ${project.results
                              .map(result => `<li>${result}</li>`)
                              .join('')}
                        </ul>
                    </div>
                `
                    : ''
                }
                ${
                  project.url
                    ? `<p><a href="${project.url}" target="_blank">🔗 Xem dự án</a></p>`
                    : ''
                }
            </div>
        `
          )
          .join('')}
    </section>
    `;
  }

  generateClassicSections(content) {
    return `
        ${
          content.objective
            ? `
        <section class="section">
            <h2>Objective</h2>
            <p>${content.objective}</p>
        </section>
        `
            : ''
        }

        ${
          content.experience && content.experience.length > 0
            ? `
        <section class="section">
            <h2>Professional Experience</h2>
            ${content.experience
              .map(
                exp => `
                <div class="item">
                    <h3>${exp.title || exp.position || 'N/A'}</h3>
                    <div class="meta">${
                      exp.company || 'N/A'
                    } | ${this.formatDateRange(
                  exp.startDate,
                  exp.endDate
                )}</div>
                    ${
                      exp.description
                        ? `<div class="description">${exp.description}</div>`
                        : ''
                    }
                    ${
                      exp.achievements && exp.achievements.length > 0
                        ? `
                        <ul>
                            ${exp.achievements
                              .map(ach => `<li>${ach}</li>`)
                              .join('')}
                        </ul>
                    `
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        ${
          content.education && content.education.length > 0
            ? `
        <section class="section">
            <h2>Education</h2>
            ${content.education
              .map(
                edu => `
                <div class="item">
                    <h3>${edu.degree || 'N/A'}</h3>
                    <div class="meta">${edu.institution || 'N/A'} | ${
                  edu.graduationYear || 'N/A'
                }</div>
                    ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        ${
          content.skills && (content.skills.technical || content.skills.soft)
            ? `
        <section class="section">
            <h2>Skills</h2>
            ${
              content.skills.technical
                ? `
                <p><strong>Technical Skills:</strong></p>
                <div class="skills-list">
                    ${content.skills.technical
                      .map(
                        skill => `<span class="skill-item">${skill.name}</span>`
                      )
                      .join('')}
                </div>
            `
                : ''
            }
            ${
              content.skills.soft
                ? `
                <p><strong>Soft Skills:</strong></p>
                <div class="skills-list">
                    ${content.skills.soft
                      .map(
                        skill => `<span class="skill-item">${skill.name}</span>`
                      )
                      .join('')}
                </div>
            `
                : ''
            }
        </section>
        `
            : ''
        }
    `;
  }

  getLevelPercentage(level) {
    const levels = {
      beginner: 30,
      intermediate: 60,
      advanced: 90,
      expert: 100,
    };
    return levels[level] || 50;
  }

  /**
   * Generate Minimal template
   * @param {Object} content - Resume content
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {string} Generated HTML
   */
  generateMinimalTemplate(content, targetJob, customization = {}) {
    const colors = customization.colors || {
      primary: '#000000',
      secondary: '#f8f9fa',
      accent: '#6c757d',
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${content.personalInfo?.fullName || 'Minimal Resume'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', 'Segoe UI', sans-serif; 
            line-height: 1.5; 
            color: ${colors.primary}; 
            background: white; 
            font-size: 14px;
        }
        .resume-container { 
            max-width: 700px; 
            margin: 40px auto; 
            padding: 60px; 
            background: white; 
        }
        .header { 
            margin-bottom: 40px; 
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .header h1 { 
            font-size: 2.5em; 
            font-weight: 300; 
            margin-bottom: 10px; 
            letter-spacing: -1px;
        }
        .contact-info { 
            font-size: 0.9em; 
            color: ${colors.accent}; 
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        .section { 
            margin-bottom: 35px; 
        }
        .section h2 { 
            font-size: 1.1em; 
            font-weight: 600; 
            margin-bottom: 20px; 
            text-transform: uppercase; 
            letter-spacing: 2px;
            color: ${colors.primary};
        }
        .item { 
            margin-bottom: 25px; 
        }
        .item h3 { 
            font-size: 1.1em; 
            font-weight: 500; 
            margin-bottom: 5px; 
        }
        .item .meta { 
            color: ${colors.accent}; 
            font-size: 0.9em; 
            margin-bottom: 8px; 
        }
        .item .description { 
            line-height: 1.6; 
        }
        .skills-minimal { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 15px; 
        }
        .skill-minimal { 
            font-size: 0.9em; 
            padding: 2px 0;
            border-bottom: 1px solid #eee;
        }
        .objective-minimal { 
            font-style: italic; 
            font-size: 1em; 
            line-height: 1.6; 
            margin-bottom: 30px;
            color: ${colors.accent};
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <header class="header">
            <h1>${content.personalInfo?.fullName || 'Resume'}</h1>
            <div class="contact-info">
                ${
                  content.personalInfo?.email
                    ? `<span>${content.personalInfo.email}</span>`
                    : ''
                }
                ${
                  content.personalInfo?.phone
                    ? `<span>${content.personalInfo.phone}</span>`
                    : ''
                }
                ${
                  content.personalInfo?.address
                    ? `<span>${content.personalInfo.address}</span>`
                    : ''
                }
            </div>
        </header>

        ${
          content.objective
            ? `
        <div class="objective-minimal">${content.objective}</div>
        `
            : ''
        }

        ${this.generateMinimalSections(content)}
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate Executive template
   * @param {Object} content - Resume content
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {string} Generated HTML
   */
  generateExecutiveTemplate(content, targetJob, customization = {}) {
    const colors = customization.colors || {
      primary: '#1a365d',
      secondary: '#2d3748',
      accent: '#4a5568',
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${content.personalInfo?.fullName || 'Executive Resume'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Georgia', 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa; 
        }
        .resume-container { 
            max-width: 900px; 
            margin: 30px auto; 
            background: white; 
            box-shadow: 0 0 30px rgba(0,0,0,0.1); 
        }
        .header { 
            background: linear-gradient(135deg, ${colors.primary} 0%, ${
      colors.secondary
    } 100%); 
            color: white; 
            padding: 50px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 3em; 
            margin-bottom: 15px; 
            font-weight: 400;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header .title { 
            font-size: 1.3em; 
            margin-bottom: 25px; 
            opacity: 0.9;
            font-style: italic;
        }
        .contact-executive { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
        }
        .contact-item { 
            text-align: center; 
        }
        .main-content { 
            padding: 50px; 
        }
        .section { 
            margin-bottom: 40px; 
        }
        .section h2 { 
            font-size: 1.6em; 
            margin-bottom: 25px; 
            color: ${colors.primary}; 
            border-bottom: 3px solid ${colors.accent}; 
            padding-bottom: 10px; 
            font-weight: 500;
        }
        .executive-summary { 
            background: linear-gradient(135deg, #f8f9fa, #e9ecef); 
            padding: 30px; 
            border-radius: 10px; 
            margin-bottom: 40px;
            border-left: 5px solid ${colors.primary};
        }
        .item { 
            margin-bottom: 30px; 
            padding: 25px; 
            border: 1px solid #e9ecef; 
            border-radius: 8px;
        }
        .item h3 { 
            font-size: 1.4em; 
            margin-bottom: 10px; 
            color: ${colors.primary}; 
        }
        .item .meta { 
            color: ${colors.accent}; 
            font-style: italic; 
            margin-bottom: 15px; 
            font-weight: 500;
        }
        .executive-skills { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
        }
        .skill-executive { 
            background: white; 
            padding: 20px; 
            border: 1px solid #e9ecef; 
            border-radius: 8px; 
            text-align: center;
        }
        .achievements { 
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 15px;
        }
        .achievements ul { 
            list-style: none; 
            padding: 0; 
        }
        .achievements li { 
            padding: 8px 0; 
            border-bottom: 1px solid #e9ecef; 
            position: relative;
            padding-left: 20px;
        }
        .achievements li::before {
            content: '▶';
            position: absolute;
            left: 0;
            color: ${colors.primary};
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <header class="header">
            <h1>${content.personalInfo?.fullName || 'Executive Resume'}</h1>
            ${
              content.targetJob?.title
                ? `<div class="title">${content.targetJob.title}</div>`
                : ''
            }
            <div class="contact-executive">
                ${
                  content.personalInfo?.email
                    ? `<div class="contact-item">📧 ${content.personalInfo.email}</div>`
                    : ''
                }
                ${
                  content.personalInfo?.phone
                    ? `<div class="contact-item">📱 ${content.personalInfo.phone}</div>`
                    : ''
                }
                ${
                  content.personalInfo?.address
                    ? `<div class="contact-item">📍 ${content.personalInfo.address}</div>`
                    : ''
                }
                ${
                  content.personalInfo?.linkedin
                    ? `<div class="contact-item">💼 LinkedIn Profile</div>`
                    : ''
                }
            </div>
        </header>

        <div class="main-content">
            ${
              content.objective
                ? `
            <div class="executive-summary">
                <h2>Executive Summary</h2>
                <p style="font-size: 1.1em; line-height: 1.7;">${content.objective}</p>
            </div>
            `
                : ''
            }

            ${this.generateExecutiveSections(content)}
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate Creative template header
   * @param {Object} content - Resume content
   * @param {Object} colors - Color scheme
   * @returns {string} Header HTML
   */
  generateCreativeHeader(content, colors) {
    return `
    <header class="header">
        <h1>${content.personalInfo?.fullName || 'Creative Resume'}</h1>
        ${
          content.targetJob?.title
            ? `<div class="subtitle">${content.targetJob.title}</div>`
            : ''
        }
        <div class="contact-grid">
            ${
              content.personalInfo?.email
                ? `
            <div class="contact-item">
                <strong>📧 Email</strong><br>
                ${content.personalInfo.email}
            </div>
            `
                : ''
            }
            ${
              content.personalInfo?.phone
                ? `
            <div class="contact-item">
                <strong>📱 Phone</strong><br>
                ${content.personalInfo.phone}
            </div>
            `
                : ''
            }
            ${
              content.personalInfo?.address
                ? `
            <div class="contact-item">
                <strong>📍 Location</strong><br>
                ${content.personalInfo.address}
            </div>
            `
                : ''
            }
            ${
              content.personalInfo?.portfolio
                ? `
            <div class="contact-item">
                <strong>🎨 Portfolio</strong><br>
                View Work
            </div>
            `
                : ''
            }
        </div>
    </header>
    `;
  }

  /**
   * Generate Creative template sidebar
   * @param {Object} content - Resume content
   * @param {Object} colors - Color scheme
   * @returns {string} Sidebar HTML
   */
  generateCreativeSidebar(content, colors) {
    return `
    <div class="sidebar">
        <!-- Creative Skills -->
        ${
          content.skills && (content.skills.technical || content.skills.soft)
            ? `
        <div class="section">
            <h2>🎨 Skills & Expertise</h2>
            ${
              content.skills.technical
                ? `
            <div class="creative-skills">
                ${content.skills.technical
                  .map(
                    skill => `
                    <div class="skill-card">
                        ${skill.name}
                        ${
                          skill.level ? `<br><small>${skill.level}</small>` : ''
                        }
                    </div>
                `
                  )
                  .join('')}
            </div>
            `
                : ''
            }
        </div>
        `
            : ''
        }

        <!-- Tools & Software -->
        ${
          content.tools && content.tools.length > 0
            ? `
        <div class="section">
            <h2>🛠️ Tools & Software</h2>
            <div class="creative-skills">
                ${content.tools
                  .map(
                    tool => `
                    <div class="skill-card">${tool}</div>
                `
                  )
                  .join('')}
            </div>
        </div>
        `
            : ''
        }
    </div>
    `;
  }

  /**
   * Generate Creative template main sections
   * @param {Object} content - Resume content
   * @param {Object} colors - Color scheme
   * @returns {string} Main sections HTML
   */
  generateCreativeMainSections(content, colors) {
    return `
        ${
          content.objective
            ? `
        <section class="section">
            <h2>🎯 Creative Vision</h2>
            <p style="font-size: 1.1em; line-height: 1.7; font-style: italic;">${content.objective}</p>
        </section>
        `
            : ''
        }

        ${this.generateExperienceSection(content)}
        ${this.generateEducationSection(content)}
        ${this.generateProjectsSection(content)}
    `;
  }

  /**
   * Generate minimal template sections
   * @param {Object} content - Resume content
   * @returns {string} Sections HTML
   */
  generateMinimalSections(content) {
    return `
        ${
          content.experience && content.experience.length > 0
            ? `
        <section class="section">
            <h2>Experience</h2>
            ${content.experience
              .map(
                exp => `
                <div class="item">
                    <h3>${exp.title || exp.position || 'N/A'}</h3>
                    <div class="meta">${
                      exp.company || 'N/A'
                    } • ${this.formatDateRange(
                  exp.startDate,
                  exp.endDate
                )}</div>
                    ${
                      exp.description
                        ? `<div class="description">${exp.description}</div>`
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        ${
          content.education && content.education.length > 0
            ? `
        <section class="section">
            <h2>Education</h2>
            ${content.education
              .map(
                edu => `
                <div class="item">
                    <h3>${edu.degree || 'N/A'}</h3>
                    <div class="meta">${edu.institution || 'N/A'} • ${
                  edu.graduationYear || 'N/A'
                }</div>
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        ${
          content.skills && (content.skills.technical || content.skills.soft)
            ? `
        <section class="section">
            <h2>Skills</h2>
            <div class="skills-minimal">
                ${
                  content.skills.technical
                    ? content.skills.technical
                        .map(
                          skill => `
                    <span class="skill-minimal">${skill.name}</span>
                `
                        )
                        .join('')
                    : ''
                }
                ${
                  content.skills.soft
                    ? content.skills.soft
                        .map(
                          skill => `
                    <span class="skill-minimal">${skill.name}</span>
                `
                        )
                        .join('')
                    : ''
                }
            </div>
        </section>
        `
            : ''
        }
    `;
  }

  /**
   * Generate executive template sections
   * @param {Object} content - Resume content
   * @returns {string} Sections HTML
   */
  generateExecutiveSections(content) {
    return `
        ${
          content.experience && content.experience.length > 0
            ? `
        <section class="section">
            <h2>Professional Experience</h2>
            ${content.experience
              .map(
                exp => `
                <div class="item">
                    <h3>${exp.title || exp.position || 'N/A'}</h3>
                    <div class="meta">${
                      exp.company || 'N/A'
                    } | ${this.formatDateRange(
                  exp.startDate,
                  exp.endDate
                )}</div>
                    ${
                      exp.description
                        ? `<div class="description">${exp.description}</div>`
                        : ''
                    }
                    ${
                      exp.achievements && exp.achievements.length > 0
                        ? `
                        <div class="achievements">
                            <strong>Key Achievements:</strong>
                            <ul>
                                ${exp.achievements
                                  .map(ach => `<li>${ach}</li>`)
                                  .join('')}
                            </ul>
                        </div>
                    `
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        ${
          content.skills && (content.skills.technical || content.skills.soft)
            ? `
        <section class="section">
            <h2>Core Competencies</h2>
            <div class="executive-skills">
                ${
                  content.skills.technical
                    ? content.skills.technical
                        .map(
                          skill => `
                    <div class="skill-executive">
                        <strong>${skill.name}</strong>
                        ${
                          skill.level
                            ? `<br><small>${skill.level.toUpperCase()}</small>`
                            : ''
                        }
                    </div>
                `
                        )
                        .join('')
                    : ''
                }
                ${
                  content.skills.soft
                    ? content.skills.soft
                        .map(
                          skill => `
                    <div class="skill-executive">
                        <strong>${skill.name}</strong>
                    </div>
                `
                        )
                        .join('')
                    : ''
                }
            </div>
        </section>
        `
            : ''
        }

        ${
          content.education && content.education.length > 0
            ? `
        <section class="section">
            <h2>Education & Credentials</h2>
            ${content.education
              .map(
                edu => `
                <div class="item">
                    <h3>${edu.degree || 'N/A'}</h3>
                    <div class="meta">${edu.institution || 'N/A'} | Class of ${
                  edu.graduationYear || 'N/A'
                }</div>
                    ${edu.gpa ? `<p><strong>GPA:</strong> ${edu.gpa}</p>` : ''}
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }
    `;
  }

  /**
   * Generate Student Tech template
   * @param {Object} content - Resume content
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {string} Generated HTML
   */
  generateStudentTechTemplate(content, targetJob, customization = {}) {
    const colors = customization.colors || {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#10b981',
    };

    const fonts = customization.fonts || {
      heading: 'JetBrains Mono',
      body: 'Inter',
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${content.personalInfo?.fullName || 'Student'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: '${
              fonts.body
            }', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa; 
        }
        .resume-container { 
            max-width: 1000px; 
            margin: 20px auto; 
            background: white; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            border-radius: 10px;
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, ${colors.primary} 0%, ${
      colors.secondary
    } 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
        }
        .header h1 { 
            font-family: '${fonts.heading}', monospace;
            font-size: 2.8em; 
            margin-bottom: 10px; 
            font-weight: 700; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header .tagline { 
            font-size: 1.2em; 
            opacity: 0.9; 
            margin-bottom: 20px; 
            font-style: italic; 
        }
        .contact-info { 
            display: flex; 
            justify-content: center; 
            gap: 30px; 
            flex-wrap: wrap;
            margin-top: 20px;
        }
        .contact-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 1em;
        }
        .main-content { 
            display: grid;
            grid-template-columns: 1fr 2fr; gap: 0;
        }
        .sidebar { 
            background: #f8f9fa; 
            padding: 40px 30px;
        }
        .main-sections { 
            padding: 40px;
        }
        .section { 
            margin-bottom: 35px; 
        }
        .section h2 { 
            font-family: '${fonts.heading}', monospace;
            font-size: 1.5em; 
            margin-bottom: 20px; 
            color: ${colors.primary}; 
            border-bottom: 3px solid ${colors.accent}; 
            padding-bottom: 8px; 
        }
        .item { 
            margin-bottom: 25px; 
            padding: 20px; 
            background: #fdfdfd; 
            border-radius: 8px; 
            border-left: 4px solid ${colors.accent}; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .item h3 { 
            font-size: 1.3em; 
            margin-bottom: 8px; 
            color: ${colors.primary}; 
            font-weight: 600;
        }
        .item .meta { 
            color: #666; 
            font-style: italic; 
            margin-bottom: 10px; 
        }
        .skills-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
            gap: 12px; 
            margin-top: 15px;
        }
        .skill-tag { 
            padding: 8px 16px; 
            border-radius: 25px; 
            font-size: 0.9em; 
            font-weight: 500; 
            text-align: center;
            background: linear-gradient(135deg, ${colors.accent}20, ${
      colors.primary
    }20); 
            color: ${colors.primary}; 
            border: 2px solid ${colors.accent}30;
        }
        .project-item {
            background: linear-gradient(135deg, ${colors.primary}15, ${
      colors.accent
    }15);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid ${colors.primary}30;
        }
        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        .tech-tag {
            background: ${colors.accent};
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: 500;
        }
        @media (max-width: 768px) {
            .resume-container { margin: 10px; }
            .main-content { grid-template-columns: 1fr; }
            .sidebar { padding: 20px; }
            .main-sections { padding: 20px; }
            .contact-info { flex-direction: column; gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <header class="header">
            <h1>${content.personalInfo?.fullName || 'Student Name'}</h1>
            <div class="tagline">Computer Science Student & Aspiring Developer</div>
            <div class="contact-info">
                <div class="contact-item">📧 ${
                  content.personalInfo?.email || 'email@example.com'
                }</div>
                <div class="contact-item">📱 ${
                  content.personalInfo?.phone || '+84 123 456 789'
                }</div>
                <div class="contact-item">📍 ${
                  content.personalInfo?.address || 'Vietnam'
                }</div>
                ${
                  content.personalInfo?.github
                    ? `<div class="contact-item">🐙 ${content.personalInfo.github}</div>`
                    : ''
                }
                ${
                  content.personalInfo?.linkedin
                    ? `<div class="contact-item">💼 ${content.personalInfo.linkedin}</div>`
                    : ''
                }
            </div>
        </header>

        <div class="main-content">
            <div class="sidebar">
                <div class="section">
                    <h2>🛠️ Technical Skills</h2>
                    <div class="skills-grid">
                        ${
                          content.skills?.technical
                            ?.map(
                              skill =>
                                `<div class="skill-tag">${skill.name}</div>`
                            )
                            .join('') || ''
                        }
                    </div>
                </div>
                
                <div class="section">
                    <h2>🎓 Education</h2>
                    ${
                      content.education
                        ?.map(
                          edu => `
                        <div class="item">
                            <h3>${edu.degree || 'Degree'}</h3>
                            <div class="meta">${
                              edu.institution || 'Institution'
                            } | ${edu.graduationYear || 'Year'}</div>
                            <p>${edu.field || 'Field of Study'}</p>
                        </div>
                    `
                        )
                        .join('') || ''
                    }
                </div>
            </div>
            
            <div class="main-sections">
                <section class="section">
                    <h2>🎯 Career Objective</h2>
                    <p>${
                      content.careerObjective ||
                      'Passionate computer science student seeking internship opportunities to apply technical skills and gain real-world experience in software development.'
                    }</p>
                </section>
                
                <section class="section">
                    <h2>💻 Projects</h2>
                    ${
                      content.projects
                        ?.map(
                          project => `
                        <div class="project-item">
                            <h3>${project.name}</h3>
                            <p>${project.description}</p>
                            <div class="tech-stack">
                                ${
                                  project.technologies
                                    ?.map(
                                      tech =>
                                        `<span class="tech-tag">${tech}</span>`
                                    )
                                    .join('') || ''
                                }
                            </div>
                        </div>
                    `
                        )
                        .join('') || ''
                    }
                </section>
                
                <section class="section">
                    <h2>🏆 Certifications</h2>
                    ${
                      content.certifications
                        ?.map(
                          cert => `
                        <div class="item">
                            <h3>${cert.name}</h3>
                            <div class="meta">${cert.issuer} | ${cert.date}</div>
                        </div>
                    `
                        )
                        .join('') || ''
                    }
                </section>
            </div>
        </div>
        
        <footer class="footer" style="background: ${
          colors.primary
        }; color: white; padding: 20px; text-align: center;">
            🤖 CV được tối ưu hóa bởi AI cho vị trí: <strong>${
              targetJob || 'Software Developer Intern'
            }</strong>
        </footer>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate Business Professional template
   * @param {Object} content - Resume content
   * @param {string} targetJob - Target job
   * @param {Object} customization - Customization options
   * @returns {string} Generated HTML
   */
  generateBusinessProfessionalTemplate(content, targetJob, customization = {}) {
    const colors = customization.colors || {
      primary: '#059669',
      secondary: '#374151',
      accent: '#10b981',
    };

    const fonts = customization.fonts || {
      heading: 'Playfair Display',
      body: 'Source Sans Pro',
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${content.personalInfo?.fullName || 'Professional'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: '${
              fonts.body
            }', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa; 
        }
        .resume-container { 
            max-width: 1000px; 
            margin: 20px auto; 
            background: white; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            border-radius: 10px;
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, ${colors.primary} 0%, ${
      colors.secondary
    } 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
        }
        .header h1 { 
            font-family: '${fonts.heading}', serif;
            font-size: 2.8em; 
            margin-bottom: 10px; 
            font-weight: 700; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header .tagline { 
            font-size: 1.2em; 
            opacity: 0.9; 
            margin-bottom: 20px; 
            font-style: italic; 
        }
        .contact-info { 
            display: flex; 
            justify-content: center; 
            gap: 30px; 
            flex-wrap: wrap;
            margin-top: 20px;
        }
        .contact-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 1em;
        }
        .main-content { 
            display: grid;
            grid-template-columns: 1fr 2fr; gap: 0;
        }
        .sidebar { 
            background: #f8f9fa; 
            padding: 40px 30px;
        }
        .main-sections { 
            padding: 40px;
        }
        .section { 
            margin-bottom: 35px; 
        }
        .section h2 { 
            font-family: '${fonts.heading}', serif;
            font-size: 1.5em; 
            margin-bottom: 20px; 
            color: ${colors.primary}; 
            border-bottom: 3px solid ${colors.accent}; 
            padding-bottom: 8px; 
        }
        .item { 
            margin-bottom: 25px; 
            padding: 20px; 
            background: #fdfdfd; 
            border-radius: 8px; 
            border-left: 4px solid ${colors.accent}; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .item h3 { 
            font-size: 1.3em; 
            margin-bottom: 8px; 
            color: ${colors.primary}; 
            font-weight: 600;
        }
        .item .meta { 
            color: #666; 
            font-style: italic; 
            margin-bottom: 10px; 
        }
        .skills-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
            gap: 12px; 
            margin-top: 15px;
        }
        .skill-tag { 
            padding: 8px 16px; 
            border-radius: 25px; 
            font-size: 0.9em; 
            font-weight: 500; 
            text-align: center;
            background: linear-gradient(135deg, ${colors.accent}20, ${
      colors.primary
    }20); 
            color: ${colors.primary}; 
            border: 2px solid ${colors.accent}30;
        }
        @media (max-width: 768px) {
            .resume-container { margin: 10px; }
            .main-content { grid-template-columns: 1fr; }
            .sidebar { padding: 20px; }
            .main-sections { padding: 20px; }
            .contact-info { flex-direction: column; gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <header class="header">
            <h1>${content.personalInfo?.fullName || 'Professional Name'}</h1>
            <div class="tagline">Business Professional & Strategic Thinker</div>
            <div class="contact-info">
                <div class="contact-item">📧 ${
                  content.personalInfo?.email || 'email@example.com'
                }</div>
                <div class="contact-item">📱 ${
                  content.personalInfo?.phone || '+84 123 456 789'
                }</div>
                <div class="contact-item">📍 ${
                  content.personalInfo?.address || 'Vietnam'
                }</div>
            </div>
        </header>

        <div class="main-content">
            <div class="sidebar">
                <div class="section">
                    <h2>🛠️ Skills</h2>
                    <div class="skills-grid">
                        ${
                          content.skills?.technical
                            ?.map(
                              skill =>
                                `<div class="skill-tag">${skill.name}</div>`
                            )
                            .join('') || ''
                        }
                        ${
                          content.skills?.soft
                            ?.map(
                              skill =>
                                `<div class="skill-tag">${skill.name}</div>`
                            )
                            .join('') || ''
                        }
                    </div>
                </div>
                
                <div class="section">
                    <h2>🎓 Education</h2>
                    ${
                      content.education
                        ?.map(
                          edu => `
                        <div class="item">
                            <h3>${edu.degree || 'Degree'}</h3>
                            <div class="meta">${
                              edu.institution || 'Institution'
                            } | ${edu.graduationYear || 'Year'}</div>
                            <p>${edu.field || 'Field of Study'}</p>
                        </div>
                    `
                        )
                        .join('') || ''
                    }
                </div>
            </div>
            
            <div class="main-sections">
                <section class="section">
                    <h2>🎯 Career Objective</h2>
                    <p>${
                      content.careerObjective ||
                      'Results-driven business professional seeking opportunities to leverage analytical skills and strategic thinking in a dynamic business environment.'
                    }</p>
                </section>
                
                <section class="section">
                    <h2>💼 Experience</h2>
                    ${
                      content.experience
                        ?.map(
                          exp => `
                        <div class="item">
                            <h3>${exp.title}</h3>
                            <div class="meta">${exp.company} | ${exp.startDate} - ${exp.endDate}</div>
                            <p>${exp.description}</p>
                        </div>
                    `
                        )
                        .join('') || ''
                    }
                </section>
                
                <section class="section">
                    <h2>🏆 Achievements</h2>
                    ${
                      content.awards
                        ?.map(
                          award => `
                        <div class="item">
                            <h3>${award.name}</h3>
                            <div class="meta">${award.issuer} | ${award.date}</div>
                            <p>${award.description}</p>
                        </div>
                    `
                        )
                        .join('') || ''
                    }
                </section>
            </div>
        </div>
        
        <footer class="footer" style="background: ${
          colors.primary
        }; color: white; padding: 20px; text-align: center;">
            🤖 CV được tối ưu hóa bởi AI cho vị trí: <strong>${
              targetJob || 'Business Professional'
            }</strong>
        </footer>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Analyze job description and provide CV optimization suggestions
   * @param {string} jobDescription - Job description text
   * @param {string} targetJob - Target job title
   * @param {Object} profile - Candidate profile
   * @param {Object} companyInfo - Company information
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeJobDescription(
    jobDescription,
    targetJob,
    profile,
    companyInfo = null
  ) {
    try {
      const prompt = `
Bạn là chuyên gia phân tích job description và career coach. Hãy phân tích job description này và đưa ra gợi ý tối ưu CV cho ứng viên.

JOB DESCRIPTION:
${jobDescription}

TARGET JOB: ${targetJob || 'Not specified'}

COMPANY INFO: ${
        companyInfo ? JSON.stringify(companyInfo, null, 2) : 'Not provided'
      }

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

YÊU CẦU PHÂN TÍCH:

1. JOB REQUIREMENTS ANALYSIS:
   - Extract key skills và technologies required
   - Identify experience level needed
   - Highlight soft skills requirements
   - Note any certifications or qualifications

2. CV OPTIMIZATION SUGGESTIONS:
   - Keywords cần thêm vào CV
   - Skills cần emphasize
   - Experience cần highlight
   - Projects cần showcase
   - Certifications cần obtain

3. MATCH ANALYSIS:
   - Đánh giá độ phù hợp với profile hiện tại
   - Điểm mạnh cần highlight
   - Điểm yếu cần cải thiện
   - Gap analysis

4. ACTION PLAN:
   - Immediate actions để optimize CV
   - Long-term development plan
   - Skills cần học thêm

TRẢ VỀ JSON FORMAT:
{
  "jobAnalysis": {
    "title": "Job title extracted",
    "level": "entry|mid|senior|lead",
    "industry": "Industry identified",
    "requiredSkills": [
      {
        "skill": "Skill name",
        "importance": "high|medium|low",
        "category": "technical|soft|tool|certification"
      }
    ],
    "requiredExperience": "X years",
    "education": "Education requirements",
    "certifications": ["Required certifications"],
    "softSkills": ["Required soft skills"],
    "technologies": ["Required technologies"]
  },
  "cvOptimization": {
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "skillsToHighlight": [
      {
        "skill": "Skill name",
        "reason": "Why highlight this skill",
        "currentLevel": "current level in profile",
        "suggestion": "How to improve"
      }
    ],
    "experienceToEmphasize": [
      {
        "experience": "Experience item",
        "reason": "Why emphasize",
        "suggestion": "How to rewrite"
      }
    ],
    "projectsToShowcase": [
      {
        "project": "Project name",
        "relevance": "Why relevant",
        "suggestion": "How to present"
      }
    ],
    "missingElements": [
      {
        "element": "Missing element",
        "importance": "high|medium|low",
        "suggestion": "How to address"
      }
    ]
  },
  "matchAnalysis": {
    "overallMatch": "high|medium|low",
    "skillsMatch": "high|medium|low",
    "experienceMatch": "high|medium|low",
    "educationMatch": "high|medium|low",
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "gaps": ["Gap 1", "Gap 2"]
  },
  "actionPlan": {
    "immediate": [
      {
        "action": "Action to take",
        "priority": "high|medium|low",
        "timeline": "Time needed"
      }
    ],
    "longTerm": [
      {
        "action": "Long-term action",
        "priority": "high|medium|low",
        "timeline": "Time needed"
      }
    ],
    "skillDevelopment": [
      {
        "skill": "Skill to develop",
        "method": "How to develop",
        "timeline": "Time needed",
        "resources": ["Resources to use"]
      }
    ]
  },
  "recommendations": {
    "template": "Suggested CV template",
    "sections": ["Suggested sections to include"],
    "customization": {
      "colors": "Suggested color scheme",
      "fonts": "Suggested fonts",
      "layout": "Suggested layout"
    },
    "content": "Overall content strategy"
  }
}

LƯU Ý:
- Phân tích chi tiết và cụ thể
- Đưa ra gợi ý actionable
- Tối ưu cho ATS
- Phù hợp với industry và level
`;

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsedResponse = JSON.parse(text);
        return parsedResponse;
      } catch (parseError) {
        console.error('Failed to parse job analysis response:', parseError);
        console.log('Raw AI response:', text);

        // Fallback response
        return {
          jobAnalysis: {
            title: targetJob || 'Unknown',
            level: 'mid',
            industry: 'Technology',
            requiredSkills: [],
            requiredExperience: '2-3 years',
            education: 'Bachelor degree',
            certifications: [],
            softSkills: [],
            technologies: [],
          },
          cvOptimization: {
            keywords: [],
            skillsToHighlight: [],
            experienceToEmphasize: [],
            projectsToShowcase: [],
            missingElements: [],
          },
          matchAnalysis: {
            overallMatch: 'medium',
            skillsMatch: 'medium',
            experienceMatch: 'medium',
            educationMatch: 'medium',
            strengths: [],
            weaknesses: [],
            gaps: [],
          },
          actionPlan: {
            immediate: [],
            longTerm: [],
            skillDevelopment: [],
          },
          recommendations: {
            template: 'modern',
            sections: [
              'personalInfo',
              'careerObjective',
              'experience',
              'education',
              'skills',
            ],
            customization: {
              colors: 'Professional blue',
              fonts: 'Modern sans-serif',
              layout: 'two-column',
            },
            content: 'Focus on relevant experience and skills',
          },
        };
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
      throw error;
    }
  }

  /**
   * Compatibility methods
   */
  async analyzeCV(cvText, jobData = null) {
    return this.analyzeCVContent(cvText, jobData);
  }

  async calculateJobMatchScore(job, userProfile) {
    return {
      skills: 0,
      experience: 0,
      education: 0,
      keywords: 0,
      culture: 0,
      overall: 0,
      breakdown: {
        skills: 0,
        experience: 0,
        education: 0,
        keywords: 0,
        culture: 0,
      },
    };
  }

  // ============================================
  // NEW AI ANALYSIS METHODS FOR CV BUILDER
  // ============================================

  /**
   * Get job suggestions based on job title input
   */
  async getJobSuggestions(jobTitle) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Dựa trên job title "${jobTitle}", hãy gợi ý:

1. Related job titles (5 titles tương tự)
2. Required skills (10 skills quan trọng nhất)
3. Industry classification
4. Experience level typically required
5. Salary range in Vietnam (triệu VND)

Return JSON format:
{
  "relatedTitles": ["title1", "title2", ...],
  "requiredSkills": [
    {"name": "skill", "importance": "high/medium/low", "category": "technical/soft"}
  ],
  "industry": "industry_name",
  "experienceLevel": "intern/fresher/junior/mid/senior",
  "salaryRange": "X-Y triệu VND",
  "marketDemand": "high/medium/low"
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        relatedTitles: [],
        requiredSkills: [],
        industry: '',
        experienceLevel: 'fresher',
        salaryRange: '',
        marketDemand: 'medium',
      };
    } catch (error) {
      logger.error('Job suggestions error:', error);
      return {
        relatedTitles: [],
        requiredSkills: [],
        industry: '',
        experienceLevel: 'fresher',
        salaryRange: '',
        marketDemand: 'medium',
      };
    }
  }

  /**
   * Generate career objective based on target job and context
   */
  async generateCareerObjective(targetJobData, context) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Tạo career objective professional cho:
- Target job: ${targetJobData.title || 'Not specified'}
- Industry: ${targetJobData.industry || 'Not specified'}
- Level: ${targetJobData.level || 'fresher'}
- Current experience: ${JSON.stringify(context.experience || [])}
- Education: ${JSON.stringify(context.education || [])}

Yêu cầu:
- 2-3 câu ngắn gọn
- Highlight relevant skills và experience
- Show passion và commitment
- Professional tone
- Tiếng Việt

Return JSON:
{
  "suggestions": [
    "objective1",
    "objective2", 
    "objective3"
  ],
  "tips": ["tip1", "tip2"]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        suggestions: [],
        tips: [],
      };
    } catch (error) {
      logger.error('Career objective generation error:', error);
      return {
        suggestions: [],
        tips: [],
      };
    }
  }

  /**
   * Analyze job match score between CV and job description
   */
  async analyzeJobMatch(cvData, jobData) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Phân tích độ phù hợp giữa CV và Job Description:

CV DATA:
${JSON.stringify(cvData, null, 2)}

JOB DATA:
- Title: ${jobData.title}
- Description: ${jobData.description}

Tính toán match score (0-100) cho từng category:
1. Skills Match (technical + soft skills)
2. Experience Match (relevance + years)
3. Education Match (degree + field)
4. Keywords Match (semantic similarity)
5. Overall Match

Return JSON:
{
  "matchScore": {
    "skills": 85,
    "experience": 70,
    "education": 90,
    "keywords": 75,
    "overall": 80
  },
  "strengths": [
    "Strong technical skills in React, Node.js",
    "Relevant internship experience"
  ],
  "gaps": [
    "Missing AWS experience",
    "Need more project management skills"
  ],
  "recommendations": [
    "Consider learning AWS basics",
    "Highlight team leadership experience"
  ],
  "fitLevel": "good" // excellent/good/fair/poor
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        matchScore: {
          skills: 0,
          experience: 0,
          education: 0,
          keywords: 0,
          overall: 0,
        },
        strengths: [],
        gaps: [],
        recommendations: [],
        fitLevel: 'poor',
      };
    } catch (error) {
      logger.error('Job match analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze skill gaps between current skills and target job
   */
  async analyzeSkillGaps(cvData, jobData) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Phân tích skill gaps giữa CV hiện tại và job requirements:

CURRENT SKILLS:
${JSON.stringify(cvData.skills, null, 2)}

TARGET JOB:
- Title: ${jobData.title}
- Description: ${jobData.description}
- Industry: ${jobData.industry}

Identify:
1. Missing critical skills
2. Skills needing improvement  
3. Skills that are strong matches
4. Priority order for learning

Return JSON:
{
  "missingSkills": [
    {
      "name": "AWS",
      "category": "technical",
      "importance": "high",
      "reason": "Required for cloud deployment"
    }
  ],
  "skillsToImprove": [
    {
      "name": "React",
      "currentLevel": "beginner", 
      "targetLevel": "intermediate",
      "importance": "high"
    }
  ],
  "strongSkills": [
    {
      "name": "JavaScript",
      "level": "advanced",
      "relevance": "high"
    }
  ],
  "learningPriority": [
    {
      "skill": "AWS",
      "priority": 1,
      "timeToLearn": "4-6 weeks",
      "difficulty": "medium"
    }
  ],
  "overallGapLevel": "medium" // low/medium/high
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        missingSkills: [],
        skillsToImprove: [],
        strongSkills: [],
        learningPriority: [],
        overallGapLevel: 'high',
      };
    } catch (error) {
      logger.error('Skill gap analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate personalized learning roadmap
   */
  async generateLearningRoadmap(data) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Tạo learning roadmap cá nhân hóa:

CURRENT SITUATION:
- Current Skills: ${JSON.stringify(data.currentSkills)}
- Target Job: ${data.targetJob.title}
- Skill Gaps: ${JSON.stringify(data.skillGaps)}
- Timeframe: ${data.timeframe}
- Learning Preferences: ${JSON.stringify(data.preferences)}

Create detailed roadmap with:
1. Weekly breakdown
2. Learning objectives
3. Resources (courses, books, projects)
4. Milestones and assessments
5. Success criteria

Return JSON:
{
  "roadmapTitle": "Full Stack Developer Learning Path",
  "totalDuration": "12 weeks",
  "overview": "Comprehensive plan to bridge skill gaps",
  "phases": [
    {
      "phase": 1,
      "title": "Foundation Phase",
      "duration": "4 weeks",
      "objectives": ["Master ES6", "Learn React basics"],
      "weeks": [
        {
          "week": 1,
          "focus": "JavaScript ES6",
          "learningObjectives": ["arrow functions", "destructuring"],
          "resources": [
            {
              "type": "course",
              "title": "ES6 Masterclass",
              "url": "https://...",
              "duration": "10 hours"
            }
          ],
          "projects": ["Build a calculator app"],
          "assessments": ["Complete 5 coding challenges"],
          "timeCommitment": "15 hours/week"
        }
      ]
    }
  ],
  "milestones": [
    {
      "week": 4,
      "title": "Complete React Fundamentals",
      "criteria": ["Build 3 React apps", "Pass React quiz"]
    }
  ],
  "successMetrics": [
    "Complete 80% of assignments",
    "Build 2 portfolio projects"
  ]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        roadmapTitle: 'Learning Roadmap',
        totalDuration: '12 weeks',
        overview: 'Personalized learning plan',
        phases: [],
        milestones: [],
        successMetrics: [],
      };
    } catch (error) {
      logger.error('Roadmap generation error:', error);
      throw error;
    }
  }

  /**
   * Suggest skills based on target job and experience
   */
  async suggestSkills(targetJob, experience) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Gợi ý skills phù hợp cho:
- Target job: ${JSON.stringify(targetJob)}
- Current experience: ${JSON.stringify(experience)}

Return JSON:
{
  "technical": [
    {"name": "React", "importance": "high", "reason": "Required for frontend development"}
  ],
  "soft": [
    {"name": "Communication", "importance": "medium", "reason": "Important for team collaboration"}
  ],
  "trending": [
    {"name": "AI/ML", "growth": "high", "relevance": "medium"}
  ]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        technical: [],
        soft: [],
        trending: [],
      };
    } catch (error) {
      logger.error('Skill suggestions error:', error);
      return {
        technical: [],
        soft: [],
        trending: [],
      };
    }
  }

  /**
   * Enhance experience descriptions
   */
  async enhanceExperienceDescription(experienceData) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Enhance experience description:
${JSON.stringify(experienceData)}

Cải thiện:
1. Use action verbs
2. Quantify achievements
3. Highlight impact
4. Professional tone

Return JSON:
{
  "enhanced": "Enhanced description",
  "suggestions": ["tip1", "tip2"],
  "keywords": ["keyword1", "keyword2"]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        enhanced: '',
        suggestions: [],
        keywords: [],
      };
    } catch (error) {
      logger.error('Experience enhancement error:', error);
      return {
        enhanced: '',
        suggestions: [],
        keywords: [],
      };
    }
  }
}

module.exports = new AIService();
