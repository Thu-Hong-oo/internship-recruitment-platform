/**
 * Rule-Based CV Parser
 * 
 * Parse CV từ PDF/DOCX mà KHÔNG cần AI (Ollama hoặc Gemini)
 * Sử dụng regex patterns và rule-based extraction
 * 
 * Ưu điểm:
 * - ✅ Nhanh (instant, không cần chờ AI)
 * - ✅ Miễn phí (không tốn API costs)
 * - ✅ Privacy (không gửi data lên cloud)
 * - ✅ Offline (không cần internet)
 * 
 * Nhược điểm:
 * - ⚠️ Độ chính xác thấp hơn AI (70-80% vs 95%+)
 * - ⚠️ Không hiểu context phức tạp
 * - ⚠️ Cần CV format chuẩn
 */

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { logger } = require('../../utils/logger');

class RuleBasedCVParser {
  constructor() {
    // Common Vietnamese surnames
    this.vietnameseSurnames = [
      'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ',
      'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Mai', 'Cao', 'Tạ', 'Lưu'
    ];
    
    // Common skills keywords
    this.skillKeywords = {
      technical: [
        'javascript', 'python', 'java', 'react', 'node', 'vue', 'angular',
        'html', 'css', 'sql', 'mongodb', 'mysql', 'postgresql',
        'git', 'docker', 'aws', 'azure', 'linux', 'windows',
        'excel', 'word', 'powerpoint', 'photoshop', 'illustrator'
      ],
      soft: [
        'giao tiếp', 'làm việc nhóm', 'quản lý thời gian', 'lãnh đạo',
        'giải quyết vấn đề', 'sáng tạo', 'thuyết trình', 'đàm phán'
      ],
      language: [
        'tiếng anh', 'tiếng việt', 'toeic', 'ielts', 'toefl', 'english', 'vietnamese'
      ]
    };
  }

  /**
   * Extract text from CV file (PDF, DOCX, TXT)
   */
  async extractTextFromCV(fileBuffer, mimeType) {
    try {
      let text = '';

      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else if (mimeType.includes('text')) {
        text = fileBuffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file type: ' + mimeType);
      }

      // Clean text
      text = this.cleanText(text);
      return text;
    } catch (error) {
      logger.error('Error extracting text from CV:', error);
      throw error;
    }
  }

  /**
   * Clean extracted text and fix spacing issues from PDF
   */
  cleanText(text) {
    // Fix Vietnamese encoding issues
    text = text.replace(/\s+/g, ' '); // Multiple spaces to single
    text = text.replace(/\n\s*\n/g, '\n'); // Multiple newlines to single
    
    // Fix text dính liền từ PDF (thêm space trước chữ hoa)
    // Pattern: "NgọcĐỗTườNgôVân" -> "Ngọc Đỗ Tườ Ngô Vân"
    text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
    
    // Fix các từ đặc biệt: "Đỗ", "Ngô" đứng giữa
    text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Đỗ([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 Đỗ $2');
    text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Ngô([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 Ngô $2');
    
    text = text.trim();
    return text;
  }

  /**
   * Parse CV using rule-based extraction
   */
  async parseCV(fileBuffer, mimeType) {
    try {
      console.log('📝 Starting rule-based CV parsing (no AI required)');
      
      // Step 1: Extract text from file
      const text = await this.extractTextFromCV(fileBuffer, mimeType);
      
      if (!text || text.length < 50) {
        console.error('❌ Insufficient text extracted from CV');
        console.error(`   Text length: ${text?.length || 0}`);
        throw new Error('Insufficient text extracted from CV');
      }

      console.log(`✅ Text extracted: ${text.length} characters`);
      console.log(`📄 Text preview (first 500 chars): ${text.substring(0, 500)}`);

      // Step 2: Extract information using rules
      const personalInfo = this.extractPersonalInfo(text);
      const education = this.extractEducationInfo(text);
      const experience = this.extractExperienceInfo(text);
      const skills = this.extractSkills(text);
      const certificates = this.extractCertificates(text);
      const awards = this.extractAwards(text);
      
      // Log extracted info for debugging
      console.log('📊 Extracted information:');
      console.log(`   Name: ${personalInfo.fullName || 'Not found'}`);
      console.log(`   Email: ${personalInfo.email || 'Not found'}`);
      console.log(`   Phone: ${personalInfo.phone || 'Not found'}`);
      console.log(`   Education: ${education.institution || 'Not found'}`);
      console.log(`   Experience count: ${experience.length}`);
      console.log(`   Skills count: ${skills.length}`);
      
      const result = {
        extractedData: {
          personalInfo,
          education,
          experience,
          skills,
          certificates,
          awards,
          activities: []
        },
        skills: [],
        suggestions: [
          'Để có kết quả chính xác hơn, hãy sử dụng AI parsing (Gemini hoặc Ollama)',
          'Đảm bảo CV có format rõ ràng và đầy đủ thông tin',
          'Kiểm tra lại thông tin đã được trích xuất'
        ]
      };

      // Flatten skills for compatibility
      result.skills = result.extractedData.skills.map(s => s.name || s);

      console.log('✅ Rule-based parsing complete');
      return result;
    } catch (error) {
      logger.error('Rule-based CV parsing error:', error);
      throw error;
    }
  }

  /**
   * Extract personal information
   */
  extractPersonalInfo(text) {
    const info = {};

    // Name - Multiple patterns to try
    // Pattern 1: Vietnamese name with spaces
    let namePattern = new RegExp(
      `(?:^|\\n)\\s*((${this.vietnameseSurnames.join('|')})\\s+(?:Thị|Văn|Minh|Anh|Hoàng)?\\s*[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:\\s+[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)*)`,
      'm'
    );
    let nameMatch = text.match(namePattern);
    
    // Pattern 2: Name without surname (first line of CV)
    if (!nameMatch) {
      const firstLine = text.split('\n')[0].trim();
      if (firstLine.length > 5 && firstLine.length < 50 && !firstLine.includes('@')) {
        nameMatch = [null, firstLine];
      }
    }
    
    // Pattern 3: Any capitalized Vietnamese name pattern
    if (!nameMatch) {
      namePattern = /(?:^|\n)\s*([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:\s+[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+){1,4})/m;
      nameMatch = text.match(namePattern);
    }
    
    if (nameMatch && nameMatch[1]) {
      info.fullName = nameMatch[1].trim();
    }

    // Email - Multiple patterns
    let emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (!emailMatch) {
      // Try with case insensitive
      emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    }
    if (emailMatch) info.email = emailMatch[1];

    // Phone - Multiple formats
    let phoneMatch = text.match(/((?:\+84|84|0)(?:3|5|7|8|9)\d{8})/);
    if (!phoneMatch) {
      // Try without country code
      phoneMatch = text.match(/(0(?:3|5|7|8|9)\d{8})/);
    }
    if (!phoneMatch) {
      // Try with spaces/dashes
      phoneMatch = text.match(/(0(?:3|5|7|8|9)[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})/);
    }
    if (phoneMatch) info.phone = phoneMatch[1].replace(/[\s\-]/g, '');

    // Date of birth - Multiple formats
    let dobMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (!dobMatch) {
      dobMatch = text.match(/(\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4})/i);
    }
    if (dobMatch) info.dateOfBirth = dobMatch[1];

    // Address - Expanded patterns
    let addressMatch = text.match(
      /([\w\s,]+(?:Hồ Chí Minh|HCM|TP\.HCM|HCMC|Hà Nội|Đà Nẵng|Cần Thơ|Biên Hòa|Nha Trang|Huế|Phường|Quận|District|Thành phố|TP)[\w\s,]*)/i
    );
    if (!addressMatch) {
      // Try simpler pattern
      addressMatch = text.match(/(?:Địa chỉ|Address|Địa điểm)[\s:]+([^\n]{10,100})/i);
    }
    if (addressMatch && addressMatch[1] && addressMatch[1].trim() !== '') {
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
      gradeText: null
    };

    // University name - Multiple patterns
    let uniMatch = text.match(/(?:Đại học|University|College|Trường|Trường Đại học)\s+([^\n]{5,80})/i);
    if (!uniMatch) {
      // Try without "Đại học" prefix
      uniMatch = text.match(/(?:Đại học|University)\s+([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][^\n]{5,80})/i);
    }
    if (uniMatch && uniMatch[1]) {
      education.institution = uniMatch[1].trim();
    }

    // Degree - Expanded patterns
    let degreeMatch = text.match(/(Cử nhân|Kỹ sư|Thạc sĩ|Tiến sĩ|Bachelor|Master|PhD|B\.S\.|M\.S\.)/i);
    if (!degreeMatch) {
      degreeMatch = text.match(/(?:Bằng|Degree)[\s:]+([^\n]{5,30})/i);
    }
    if (degreeMatch) education.degree = degreeMatch[1];

    // Field of study - Multiple patterns
    let fieldMatch = text.match(/(?:Ngành|Major|Field|Chuyên ngành)[\s:]+([^\n]{5,50})/i);
    if (!fieldMatch) {
      fieldMatch = text.match(/(?:Học|Theo học)[\s]+(?:ngành|chuyên ngành)[\s:]+([^\n]{5,50})/i);
    }
    if (fieldMatch && fieldMatch[1]) {
      education.field = fieldMatch[1].trim();
    }

    // Graduation year - Multiple patterns
    let yearMatch = text.match(/(?:tốt nghiệp|graduation|graduated|năm tốt nghiệp)[\s:]+(?:năm\s*)?(\d{4})/i);
    if (!yearMatch) {
      yearMatch = text.match(/(\d{4})\s*(?:tốt nghiệp|graduation)/i);
    }
    if (!yearMatch) {
      // Try to find year near education section
      const educationSection = text.match(/(?:Học vấn|Education|Học tập)[\s\S]{0,500}/i);
      if (educationSection) {
        yearMatch = educationSection[0].match(/(\d{4})/);
      }
    }
    if (yearMatch) education.graduationYear = parseInt(yearMatch[1]);

    // GPA - Multiple patterns
    let gpaMatch = text.match(/(?:GPA|Điểm|Điểm trung bình|Grade Point Average)[\s:]+(\d+\.?\d*)/i);
    if (!gpaMatch) {
      gpaMatch = text.match(/(?:GPA|Điểm)[\s:]+(\d+[,\.]\d+)/i);
    }
    if (gpaMatch) {
      education.gpa = parseFloat(gpaMatch[1].replace(',', '.'));
    }

    // Grade text - Expanded patterns
    let gradeMatch = text.match(
      /(?:loại|xếp loại|grade|classification)[\s:]+(Xuất sắc|Giỏi|Khá|Trung bình|Yếu|Excellent|Very Good|Good|Average|Fair)/i
    );
    if (!gradeMatch) {
      gradeMatch = text.match(/(Xuất sắc|Giỏi|Khá|Trung bình|Yếu|Excellent|Very Good|Good|Average)/i);
    }
    if (gradeMatch) education.gradeText = gradeMatch[1];

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

      // Detect experience header (position + company + dates)
      const datePattern = /(\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{4}|Hiện tại|Present|Current)/i;
      const dateMatch = line.match(datePattern);

      if (dateMatch) {
        if (currentExp) experiences.push(currentExp);

        // Extract position and company
        const expMatch = line.match(/^(.*?)\s*(?:tại|at|@)\s*(.+?)\s*[-–]/i);
        currentExp = {
          type: 'internship',
          company: expMatch ? expMatch[2].trim() : null,
          position: expMatch ? expMatch[1].trim() : null,
          startDate: dateMatch[1],
          endDate: dateMatch[2],
          description: ''
        };
      } else if (currentExp && line.length > 10) {
        // Add description lines
        currentExp.description += (currentExp.description ? ' ' : '') + line;
      }
    }

    if (currentExp) experiences.push(currentExp);
    return experiences;
  }

  /**
   * Extract skills
   */
  extractSkills(text) {
    const skills = [];
    const textLower = text.toLowerCase();
    const foundSkills = new Set(); // Avoid duplicates

    // Technical skills - Check in skills section first
    const skillsSection = text.match(/(?:Kỹ năng|Skills|Kỹ năng chuyên môn|Technical Skills)[\s\S]{0,1000}/i);
    const searchText = skillsSection ? skillsSection[0] : text;
    const searchTextLower = searchText.toLowerCase();

    this.skillKeywords.technical.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (searchTextLower.includes(skillLower) && !foundSkills.has(skillLower)) {
        skills.push({
          name: skill,
          type: 'technical',
          level: 'intermediate'
        });
        foundSkills.add(skillLower);
      }
    });

    // Soft skills
    this.skillKeywords.soft.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (textLower.includes(skillLower) && !foundSkills.has(skillLower)) {
        skills.push({
          name: skill,
          type: 'soft',
          level: 'intermediate'
        });
        foundSkills.add(skillLower);
      }
    });

    // Languages
    this.skillKeywords.language.forEach(lang => {
      const langLower = lang.toLowerCase();
      if (textLower.includes(langLower) && !foundSkills.has(langLower)) {
        skills.push({
          name: lang,
          type: 'language',
          level: 'intermediate'
        });
        foundSkills.add(langLower);
      }
    });

    // Try to extract skills from bullet points or lists
    const bulletPoints = text.match(/(?:[-•*]|\d+\.)\s*([^\n]{5,50})/g);
    if (bulletPoints) {
      bulletPoints.forEach(point => {
        const pointLower = point.toLowerCase();
        this.skillKeywords.technical.forEach(skill => {
          const skillLower = skill.toLowerCase();
          if (pointLower.includes(skillLower) && !foundSkills.has(skillLower)) {
            skills.push({
              name: skill,
              type: 'technical',
              level: 'intermediate'
            });
            foundSkills.add(skillLower);
          }
        });
      });
    }

    return skills;
  }

  /**
   * Extract certificates
   */
  extractCertificates(text) {
    const certificates = [];
    const certPattern = /(?:Chứng chỉ|Certificate|Certification)\s*:?\s*([^\n]{5,100})/gi;
    let match;

    while ((match = certPattern.exec(text)) !== null) {
      certificates.push({
        name: match[1].trim(),
        issuer: null,
        year: null
      });
    }

    return certificates;
  }

  /**
   * Extract awards
   */
  extractAwards(text) {
    const awards = [];
    const awardPattern = /(?:Giải thưởng|Award|Danh hiệu)\s*:?\s*([^\n]{5,100})/gi;
    let match;

    while ((match = awardPattern.exec(text)) !== null) {
      awards.push({
        name: match[1].trim(),
        year: null,
        description: null
      });
    }

    return awards;
  }
}

module.exports = new RuleBasedCVParser();

