/**
 * CV Parsing Service
 * 
 * Chịu trách nhiệm parse CV từ file (PDF/DOCX) thành structured data
 * Sử dụng Gemini API với fallback sang rule-based parsing
 * 
 * UPDATED: Simplified with pdfjs-dist (better encoding, less cleanup needed)
 */

const { logger } = require('../../utils/logger');
const { getSkillExtractionService } = require('./skillExtractionService');
require('dotenv').config();

class CVParsingService {
  constructor(aiService) {
    this.aiService = aiService;
    this.lastExtractedText = null;
    this.skillExtractionService = getSkillExtractionService();
  }

  /**
   * Parse resume from buffer using Gemini API with fallback to rule-based
   */
  async parseResumeFromBuffer(fileBuffer, mimeType) {
    try {
      logger.info('📝 Starting resume parsing');
      logger.info(`📄 File type: ${mimeType}`);

      // Extract text from file
      const text = await this.extractTextFromCV(fileBuffer, mimeType);

      if (!text || text.length < 50) {
        throw new Error('Could not extract sufficient text from resume');
      }

      this.lastExtractedText = text;
      logger.info(`✅ Text extracted successfully (${text.length} characters)`);

      // Strategy 1: Try Gemini API first (faster, more accurate)
      if (process.env.GEMINI_API_KEY) {
        try {
          const model = this.aiService.getModel();
          if (!model) {
            throw new Error('Gemini model initialization failed');
          }

          logger.info('🤖 Using Gemini AI for intelligent CV parsing');
          
          // Truncate text for faster processing
          const maxTextLength = 3000;
          const truncatedText = text.length > maxTextLength 
            ? text.substring(0, maxTextLength) + '\n... (text truncated)'
            : text;

          // Basic cleanup before sending to Gemini
          const textForGemini = this.cleanText(truncatedText);

          // Parse with Gemini
          const parsedData = await this._parseWithGemini(model, textForGemini);
          
          // Post-processing: Clean parsed data
          const cleanedData = this.cleanParsedData(parsedData);

          logger.info('✅ Successfully parsed CV with Gemini AI');
          return cleanedData;
        } catch (error) {
          if (error.message?.includes('GEMINI_QUOTA_EXCEEDED')) {
            logger.warn('⚠️ Gemini API quota exceeded, using fallback');
          } else {
            logger.warn('⚠️ Gemini API failed, falling back to rule-based:', error.message);
          }
        }
      }

      // Strategy 2: Fallback to rule-based parsing
      if (process.env.ALLOW_RULE_BASED_FALLBACK !== 'false') {
        logger.warn('⚠️ Using rule-based parsing (fallback)');
        return await this.fallbackParseResume();
      }

      throw new Error('All CV parsing methods failed');
    } catch (error) {
      logger.error('❌ CV parsing failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from CV file using pdfjs-dist (better encoding)
   */
  async extractTextFromCV(fileBuffer, mimeType) {
    if (!mimeType || typeof mimeType !== 'string') {
      throw new Error('File type (mimeType) is required');
    }

    const normalizedMimeType = mimeType.toLowerCase();

    if (normalizedMimeType === 'application/pdf') {
      return await this._extractTextFromPDF(fileBuffer);
    } else if (normalizedMimeType.includes('word') || normalizedMimeType.includes('docx')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return this.cleanText(result.value);
    } else if (normalizedMimeType.includes('text') || normalizedMimeType.includes('plain')) {
      return this.cleanText(fileBuffer.toString('utf-8'));
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  /**
   * Extract text from PDF using pdfjs-dist (better encoding) or fallback to pdf-parse
   */
  async _extractTextFromPDF(fileBuffer) {
    // Try pdfjs-dist first (better encoding)
    try {
      // Try different paths for different pdfjs-dist versions
      let pdfjsLib;
      const path = require('path');

      try {
        // Try legacy path first (for older versions)
        pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
        // Configure worker for Node.js environment
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');
        } catch (workerError) {
          // If worker path resolution fails, disable worker (Node.js can work without it)
          pdfjsLib.GlobalWorkerOptions.workerSrc = false;
        }
      } catch (legacyError) {
        try {
          // Try newer version path
          pdfjsLib = require('pdfjs-dist');
          // Configure worker for Node.js environment
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js');
          } catch (workerError) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = false;
          }
        } catch (newError) {
          // Last resort: try legacy with absolute path
          pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
          const workerPath = path.join(__dirname, '../../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
        }
      }

      // Reduce canvas polyfill warnings; disable features not needed for text
      pdfjsLib.GlobalWorkerOptions.disableFontFace = true;
      pdfjsLib.GlobalWorkerOptions.disableRange = true;

      // pdfjs-dist expects Uint8Array for data (Buffer is technically Uint8Array, but make a clean view)
      let data;
      if (fileBuffer instanceof Uint8Array) {
        data = new Uint8Array(
          fileBuffer.buffer,
          fileBuffer.byteOffset || 0,
          fileBuffer.byteLength
        );
      } else {
        // Accept ArrayBuffer, Buffer, or plain typed data
        data = new Uint8Array(fileBuffer);
      }

      const loadingTask = pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
        verbosity: 0,
        // Disable worker eval in Node.js
        isEvalSupported: false,
      });
      
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item, index, items) => {
            let text = item.str || '';
            
            if (index > 0 && items[index - 1]) {
              const prevItem = items[index - 1];
              const spaceWidth = item.transform[4] - (prevItem.transform[4] + (prevItem.width || 0));
              if (spaceWidth > 5) {
                text = ' ' + text;
              }
            }
            
            return text;
          })
          .join('');
        
        fullText += pageText + '\n';
      }
      
      logger.info(`✅ Extracted text from PDF using pdfjs-dist (${pdf.numPages} pages)`);
      return this.cleanText(fullText.trim());
    } catch (pdfjsError) {
      // Fallback to pdf-parse if pdfjs-dist not available
      logger.warn('⚠️ pdfjs-dist failed, falling back to pdf-parse:', {
        message: pdfjsError.message,
        stack: pdfjsError.stack,
        name: pdfjsError.name,
        code: pdfjsError.code
      });
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileBuffer);
        logger.info('✅ Extracted text from PDF using pdf-parse (fallback)');
        return this.cleanText(pdfData.text);
      } catch (pdfParseError) {
        logger.error('❌ Both pdfjs-dist and pdf-parse failed:', pdfParseError.message);
        throw new Error('Failed to extract text from PDF');
      }
    }
  }

  /**
   * Clean text - minimal cleanup (pdfjs-dist handles encoding well)
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Basic cleanup only
    text = text
      .replace(/\uFFFD/g, ' ') // Remove replacement characters
      .replace(/•/g, ' ') // Remove bullet points
      .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, ' ')
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove non-printable
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return text;
  }

  /**
   * Parse CV with Gemini AI
   */
  async _parseWithGemini(model, text) {
    const prompt = `Bạn là chuyên gia phân tích CV. Hãy trích xuất thông tin từ CV sau:

${text}

**OUTPUT JSON:**
{
  "extractedData": {
    "personalInfo": {
      "fullName": "[Họ tên]",
      "email": "[Email]",
      "phone": "[Số điện thoại]",
      "address": "[Địa chỉ]",
      "dateOfBirth": "[DD/MM/YYYY hoặc null]",
      "summary": "[Mục tiêu nghề nghiệp]"
    },
    "education": {
      "type": "university|college|highschool",
      "institution": "[Tên trường]",
      "degree": "[Bằng cấp]",
      "field": "[Ngành học]",
      "graduationYear": [Năm hoặc null],
      "startYear": [Năm hoặc null],
      "endYear": [Năm hoặc null],
      "duration": "[MM/YYYY - MM/YYYY hoặc null]",
      "gpa": [GPA hoặc null],
      "gradeText": "[Xếp loại hoặc null]"
    },
    "experience": [
      {
        "type": "fulltime|parttime|internship|freelance",
        "company": "[Tên công ty]",
        "position": "[Vị trí]",
        "location": "[Địa điểm]",
        "startDate": "[MM/YYYY]",
        "endDate": "[MM/YYYY hoặc 'present']",
        "duration": "[MM/YYYY - MM/YYYY]",
        "description": "[Mô tả đầy đủ]"
      }
    ],
    "skills": [
      {"name": "[Tên kỹ năng]", "type": "technical|soft|language", "level": "beginner|intermediate|advanced"}
    ],
    "certificates": [
      {"name": "[Tên chứng chỉ]", "issuer": "[Tổ chức cấp]", "year": [Năm], "description": "[Mô tả]"}
    ],
    "awards": [
      {"name": "[Tên giải thưởng]", "year": [Năm], "description": "[Mô tả]"}
    ],
    "activities": [
      {"name": "[Tên hoạt động]", "organization": "[Tổ chức]", "duration": "[Năm]", "description": "[Mô tả]"}
    ],
    "references": [
      {"name": "[Tên người]", "position": "[Chức vụ]", "phone": "[Số điện thoại]", "email": "[Email]"}
    ]
  },
  "skills": ["[Danh sách tên kỹ năng]"],
  "suggestions": ["[3 gợi ý cải thiện CV]"]
}

**LƯU Ý:**
- HIỂU NGỮ NGHĨA, không theo format cứng nhắc
- Tên người: TỐI ĐA 5 từ, bỏ chức danh
- Kinh nghiệm: MÔ TẢ PHẢI ĐẦY ĐỦ
- JSON thuần túy, null nếu không tìm thấy
- Giữ dấu tiếng Việt chính xác`;

    const apiTimeout = 15000;
    let apiResult;
    let retryCount = 0;
    const maxRetries = 1;
    
    while (retryCount <= maxRetries) {
      try {
        const apiPromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API timeout')), apiTimeout)
        );
        
        apiResult = await Promise.race([apiPromise, timeoutPromise]);
        break;
      } catch (error) {
        retryCount++;
        
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          throw new Error('GEMINI_QUOTA_EXCEEDED');
        }
        
        if (retryCount > maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const response = await apiResult.response;
    let responseText = response.text();

    // Extract JSON from response
    let cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      responseText = cleanedText.substring(jsonStart, jsonEnd + 1);
    } else {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      } else {
        throw new Error('No JSON found in response');
      }
    }

    // Parse JSON with error handling
    let parsedData;
    try {
      // Fix common JSON issues
      let jsonToParse = responseText;
      
      // Fix incomplete JSON
      const openBraces = (jsonToParse.match(/\{/g) || []).length;
      const closeBraces = (jsonToParse.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        jsonToParse += '}'.repeat(openBraces - closeBraces);
      }
      
      // Fix trailing commas
      jsonToParse = jsonToParse.replace(/,(\s*[}\]])/g, '$1');
      
      parsedData = JSON.parse(jsonToParse);
      
      // Validate structure
      if (!parsedData.extractedData?.personalInfo) {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      logger.error('❌ Failed to parse Gemini response:', parseError.message);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Fix empty address
    if (parsedData.extractedData.personalInfo?.address === '') {
      parsedData.extractedData.personalInfo.address = null;
    }

    return parsedData;
  }

  /**
   * Clean parsed data - minimal cleanup
   */
  cleanParsedData(parsedData) {
    if (!parsedData?.extractedData) return parsedData;

    const cleanField = (value) => {
      if (typeof value !== 'string') return value;
      return value.trim() || null;
    };

    // Clean personalInfo
    if (parsedData.extractedData.personalInfo) {
      const pi = parsedData.extractedData.personalInfo;
      if (pi.fullName) pi.fullName = cleanField(pi.fullName);
      if (pi.address) pi.address = cleanField(pi.address);
    }

    // Clean education
    if (parsedData.extractedData.education) {
      const edu = parsedData.extractedData.education;
      if (edu.institution) edu.institution = cleanField(edu.institution);
      if (edu.degree) edu.degree = cleanField(edu.degree);
      if (edu.field) edu.field = cleanField(edu.field);
    }

    // Clean experience
    if (parsedData.extractedData.experience?.length) {
      parsedData.extractedData.experience = parsedData.extractedData.experience.map(exp => {
        if (exp.company) exp.company = cleanField(exp.company);
        if (exp.position) exp.position = cleanField(exp.position);
        if (exp.description) exp.description = cleanField(exp.description);
        if (exp.startDate) exp.startDate = this.normalizeDate(exp.startDate);
        if (exp.endDate) exp.endDate = this.normalizeDate(exp.endDate);
        return exp;
      }).filter(exp => exp.startDate || exp.position || exp.company);
    }

    // Clean skills
    if (parsedData.extractedData.skills?.length) {
      parsedData.extractedData.skills.forEach(skill => {
        if (skill.name) skill.name = cleanField(skill.name);
      });
    }

    return parsedData;
  }

  /**
   * Fallback to rule-based parsing
   */
  async fallbackParseResume() {
    if (!this.lastExtractedText || this.lastExtractedText.length < 100) {
      return this.getEmptyTemplate();
    }

    const text = this.cleanText(this.lastExtractedText);

    return {
      extractedData: {
        personalInfo: this.extractPersonalInfo(text),
        education: this.extractEducationInfo(text),
        experience: this.extractExperienceInfo(text),
        skills: await this.skillExtractionService.extractSkills(text, {
          maxSkills: 50,
          minConfidence: 0.5,
        }),
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
  }

  /**
   * Extract personal information
   */
  extractPersonalInfo(text) {
    const info = {};

    // Name pattern
    const namePattern = /(?:^|\n)\s*((?:Nguyễn|Trần|Lê|Phạm|Hoàng|Huỳnh|Phan|Vũ|Võ|Đặng|Bùi|Đỗ|Hồ|Ngô|Dương|Lý|Mai|Cao|Tạ|Lưu)\s+(?:Thị|Văn)?\s*[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:\s+[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)*)/m;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      let name = nameMatch[1].trim();
      const words = name.split(/\s+/);
      if (words.length > 5) {
        name = words.slice(0, 5).join(' ');
      }
      info.fullName = name;
    }

    // Email
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      info.email = emailMatch[1].trim();
    }

    // Phone
    const phoneMatch = text.match(/((?:\+84|84|0)(?:3|5|7|8|9)\d{8})/);
    if (phoneMatch) {
      info.phone = phoneMatch[1];
    }

    // Date of birth
    const dobMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (dobMatch) {
      info.dateOfBirth = dobMatch[1];
    }

    // Address
    const addressMatch = text.match(/([\w\s,]+(?:Hồ Chí Minh|HCM|Hà Nội|Đà Nẵng|Phường|Quận)[\w\s,]*)/i);
    if (addressMatch) {
      info.address = addressMatch[1].trim();
    }

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
      gradeText: null,
    };

    // University name
    const uniMatch = text.match(/(?:Đại học|University|College)\s+([^\n]{5,80})/i);
    if (uniMatch) {
      education.institution = uniMatch[1].trim();
    }

    // Degree
    const degreeMatch = text.match(/(Cử nhân|Kỹ sư|Thạc sĩ|Tiến sĩ|Bachelor|Master|PhD)/i);
    if (degreeMatch) {
      education.degree = degreeMatch[1];
    }

    // Field of study
    const fieldMatch = text.match(/(?:Ngành|Major|Field)\s*:?\s*([^\n]{5,50})/i);
    if (fieldMatch) {
      education.field = fieldMatch[1].trim();
    }

    // Graduation year
    const yearMatch = text.match(/(?:tốt nghiệp|graduation)\s*:?\s*(?:năm\s*)?(\d{4})/i);
    if (yearMatch) {
      education.graduationYear = parseInt(yearMatch[1]);
    }

    // GPA
    const gpaMatch = text.match(/(?:GPA|Điểm)\s*:?\s*(\d+\.?\d*)/i);
    if (gpaMatch) {
      education.gpa = parseFloat(gpaMatch[1]);
    }

    // Grade text
    const gradeMatch = text.match(/(?:loại|xếp loại)\s*:?\s*(Xuất sắc|Giỏi|Khá|Trung bình)/i);
    if (gradeMatch) {
      education.gradeText = gradeMatch[1];
    }

    return education;
  }

  /**
   * Extract work experience
   */
  extractExperienceInfo(text) {
    const experiences = [];
    const lines = text.split('\n');
    let currentExp = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      const datePattern = /(\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{4}|Hiện tại|Present)/i;
      const dateMatch = line.match(datePattern);
      
      if (dateMatch) {
        if (currentExp) experiences.push(currentExp);

        currentExp = {
          type: this.inferExperienceType(line),
          position: null,
          company: null,
          startDate: this.normalizeDate(dateMatch[1]),
          endDate: this.normalizeDate(dateMatch[2]),
          description: '',
          location: null,
        };

        // Extract position and company
        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        const companyMatch = line.match(/(?:tại|at|@|Công ty)\s*:?\s*(.+?)(?:\s+\d{1,2}\/\d{4})/i);
        
        if (companyMatch) {
          currentExp.company = companyMatch[1].trim();
          currentExp.position = prevLine || 'Not specified';
        } else if (prevLine) {
          currentExp.position = prevLine;
        }
      } else if (currentExp && (line.startsWith('•') || line.startsWith('-'))) {
        const desc = line.replace(/^[•\-]\s*/, '').trim();
        if (desc) {
          currentExp.description += desc + '\n';
        }
      }
    }

    if (currentExp) experiences.push(currentExp);
    
    // Clean descriptions
    experiences.forEach(exp => {
      if (exp.description) {
        exp.description = exp.description.trim();
      }
    });
    
    return experiences;
  }

  /**
   * Normalize date string to MM/YYYY format
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    if (typeof dateStr === 'string') {
      const lower = dateStr.toLowerCase().trim();
      
      if (lower === 'hiện tại' || lower === 'present' || lower === 'current') {
        return null; // null means "present"
      }

      if (lower === 'null' || lower === 'undefined') {
        return null;
      }

      const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const year = parseInt(dateMatch[2]);

        if (month < 1 || month > 12 || year < 1950 || year > 2030) {
          return null;
        }

        return `${month.toString().padStart(2, '0')}/${year}`;
      }
    }

    return null;
  }

  /**
   * Infer experience type
   */
  inferExperienceType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('thực tập') || lower.includes('intern')) return 'internship';
    if (lower.includes('fulltime') || lower.includes('chính thức')) return 'fulltime';
    if (lower.includes('parttime') || lower.includes('bán thời gian')) return 'parttime';
    if (lower.includes('freelance') || lower.includes('tự do')) return 'freelance';
    return 'fulltime';
  }

  /**
   * Extract certificates
   */
  extractCertificates(text) {
    const certificates = [];
    const lines = text.split('\n');

    const certPatterns = [
      /(?:chứng chỉ|certificate)\s*:?\s*(.+?)(?:\s*-?\s*(\d{4}))?$/i,
      /(TOEIC|IELTS|TOEFL|AWS|Azure)\s*:?\s*(\d+)?/gi,
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

          const yearMatch = line.match(/(\d{4})/);
          if (yearMatch) cert.year = parseInt(yearMatch[1]);

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
      /(?:giải thưởng|award)\s*:?\s*(.+?)(?:\s*-?\s*(\d{4}))?$/i,
    ];

    lines.forEach(line => {
      awardPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const award = {
            name: match[1]?.trim(),
            year: null,
            description: null,
          };

          const yearMatch = line.match(/(\d{4})/);
          if (yearMatch) award.year = parseInt(yearMatch[1]);

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
        'Thêm thông tin cá nhân đầy đủ',
        'Bổ sung chi tiết về học vấn và kinh nghiệm',
        'Liệt kê rõ ràng các kỹ năng chuyên môn',
      ],
    };
  }
}

// Singleton pattern
let cvParsingServiceInstance = null;

function getCVParsingService(aiService) {
  if (!cvParsingServiceInstance) {
    cvParsingServiceInstance = new CVParsingService(aiService);
  }
  return cvParsingServiceInstance;
}

module.exports = { getCVParsingService, CVParsingService };
