const { GoogleGenerativeAI } = require('@google/generative-ai');
const natural = require('natural');
const { logger } = require('../utils/logger');
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
}

module.exports = new AIService();
