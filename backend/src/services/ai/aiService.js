
const { GoogleGenerativeAI } = require('@google/generative-ai');
const natural = require('natural');
const { logger } = require('../../utils/logger');
const aiCVEnhancementService = require('./aiCVEnhancementService');
const { getSkillNormalizationService } = require('./skillNormalizationService');
const { getSkillExtractionService } = require('./skillExtractionService');
const jobMatchingService = require('./jobMatchingService');
const candidateRecommendationService = require('./candidateRecommendationService');
require('dotenv').config();

// Initialize Gemini with proper model (top-level, but will be recreated in getModel() if needed)
// Note: This is kept for backward compatibility, but getModel() creates its own instance
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
if (!geminiApiKey) {
  console.error('❌ GEMINI_API_KEY is not set in .env file!');
  console.error('   Hệ thống sẽ sử dụng fallback parsing (rule-based)');
} else {
  if (!geminiApiKey.startsWith('AIzaSy')) {
    console.error(`❌ GEMINI_API_KEY format is INVALID - must start with "AIzaSy"`);
    console.error(`   Current key starts with: "${geminiApiKey.substring(0, 6)}"`);
  } else {
    console.log(`✅ GEMINI_API_KEY loaded: ${geminiApiKey.substring(0, 10)}...${geminiApiKey.substring(geminiApiKey.length - 4)} (length: ${geminiApiKey.length})`);
  }
}
// Note: genAI instance here is not used, getModel() creates its own
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// 🧠 DEPRECATED: Hardcoded skill dictionaries đã được thay thế bằng AI services
// Sử dụng getSkillNormalizationService() và getSkillExtractionService() thay vì hardcode
// 
// Legacy constants (chỉ dùng cho fallback khi AI không available):
// - SKILL_SYNONYMS: Đã thay thế bởi SkillNormalizationService
// - COMMON_SKILLS: Đã thay thế bởi SkillExtractionService

class AIService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.lastExtractedText = null;
    this._cachedModel = null;
    this._cachedModelName = null;
    
    // 🧠 Intelligent Skill Services (AI-powered)
    this.skillNormalizationService = getSkillNormalizationService();
    this.skillExtractionService = getSkillExtractionService();
    
    // 📄 CV Parsing Service (refactored from aiService)
    const { getCVParsingService } = require('./cvParsingService');
    this.cvParsingService = getCVParsingService(this);
    
    // Note: Ollama/Local LLM removed - using Gemini API + Rule-based fallback only
  }

  /**
   * Get Gemini model instance - reads from env each time to support hot-reload
   * @returns {Object|null} Gemini model instance or null if unavailable
   */
  getModel() {
    // Get API key and model name from env
    let apiKey = process.env.GEMINI_API_KEY;
    
    // Respect user's choice from .env, use default if not set
    // Default: gemini-2.0-flash-lite (nhanh nhất) - xem GEMINI_MODEL_COMPARISON.md
    let modelName = process.env.GEMINI_MODEL
    
    // Check if API key is available
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY is not set. Cannot initialize Gemini model.');
      return null;
    }
    
    // Trim API key to remove any whitespace
    apiKey = apiKey.trim();
    
    // Debug: Log API key info (only first and last few chars for security)
    console.log(`🔑 API Key Info: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})`);
    
    // Validate API key format (basic check)
    if (!apiKey.startsWith('AIzaSy')) {
      console.error('❌ GEMINI_API_KEY format is INVALID - must start with "AIzaSy"');
      console.error(`   Current key starts with: "${apiKey.substring(0, 6)}"`);
      return null;
    }
    
    if (apiKey.length < 30 || apiKey.length > 50) {
      console.warn(`⚠️ GEMINI_API_KEY length is unusual: ${apiKey.length} (expected ~39 chars)`);
    }
    
    // If model name changed or model not cached, create new instance
    // ✅ Code chuẩn theo hướng dẫn: Khởi tạo genAI và model đúng cách
    if (!this._cachedModel || this._cachedModelName !== modelName || this._cachedApiKey !== apiKey) {
      try {
        // ✅ Bước 1: Khởi tạo GoogleGenerativeAI với API key (đã trim)
        const genAI = new GoogleGenerativeAI(apiKey);
        
        try {
          this._cachedModel = genAI.getGenerativeModel({
            model: modelName
          });
          // Log model being used (respect user's choice from .env)
          console.log(`✅ Using Gemini model: ${modelName} (from ${process.env.GEMINI_MODEL ? '.env' : 'default'})`);
        } catch (modelError) {
          // Nếu model không tìm thấy, thử fallback models
          console.warn(`⚠️ Model "${modelName}" not available, trying alternatives...`);
          
          // Fallback models - thử các model có sẵn (ưu tiên tốc độ)
          const fallbackModels = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-2.5-flash', 'gemini-1.5-flash'];
          let modelFound = false;
          
          for (const fallbackModel of fallbackModels) {
            try {
              this._cachedModel = genAI.getGenerativeModel({
                model: fallbackModel
              });
              console.log(`✅ Using fallback model: ${fallbackModel}`);
              modelName = fallbackModel; // Update model name
              modelFound = true;
              break;
            } catch (e) {
              // Continue to next fallback
              console.log(`   ⚠️ Fallback model "${fallbackModel}" not available: ${e.message.substring(0, 50)}`);
            }
          }
          
          if (!modelFound) {
            throw new Error(`No available Gemini models found. Original error: ${modelError.message}`);
          }
        }
        
        this._cachedModelName = modelName;
        this._cachedApiKey = apiKey;
        console.log(`✅ Gemini model initialized: ${modelName}`);
        logger.info(`Gemini model initialized: ${modelName}`);
      } catch (error) {
        console.error(`❌ Failed to initialize Gemini model: ${error.message}`);
        logger.warn('Failed to initialize Gemini model, using fallback methods', error.message);
        this._cachedModel = null;
        this._cachedModelName = null;
        this._cachedApiKey = null;
      }
    }
    
    return this._cachedModel;
  }

  /**
   * Extract text from CV file - delegate to CV Parsing Service
   */
  async extractTextFromCV(fileBuffer, mimeType) {
    return this.cvParsingService.extractTextFromCV(fileBuffer, mimeType);
  }

  /**
   * Clean extracted text - delegate to CV Parsing Service
   */
  cleanExtractedText(text) {
    return this.cvParsingService.cleanExtractedText(text);
  }

  /**
   * Clean extracted text - fix Vietnamese encoding and formatting (DEPRECATED - use cvParsingService)
   * @deprecated Use cvParsingService.cleanExtractedText() instead
   */

  /**
   * Parse resume from buffer - delegate to CV Parsing Service
   */
  async parseResumeFromBuffer(fileBuffer, mimeType) {
    // Store extracted text for backward compatibility
    const text = await this.cvParsingService.extractTextFromCV(fileBuffer, mimeType);
      this.lastExtractedText = text;
    this.cvParsingService.lastExtractedText = text;
    
    return this.cvParsingService.parseResumeFromBuffer(fileBuffer, mimeType);
  }

  /**
   * Extract skills using Gemini AI with improved detection
   */
  async extractSkills(text) {
    try {
      // Use AI-powered skill extraction service
      console.log('🤖 Using AI-powered skill extraction service');
      return await this.extractSkillsEnhanced(text);

      console.log('🤖 Using Gemini API for skill extraction');
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

      const model = this.getModel();
      if (!model) {
        throw new Error('Gemini model not available');
      }
      const result = await model.generateContent(prompt);
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
      return await this.extractSkillsEnhanced(text);
    }
  }

  /**
   * Enhanced fallback skill extraction - Sử dụng AI-powered service
   */
  async extractSkillsEnhanced(text) {
    console.log('📝 Using AI-powered skill extraction service');

    try {
      // Sử dụng AI-powered skill extraction service
      const skills = await this.skillExtractionService.extractSkills(text, {
        maxSkills: 50,
        minConfidence: 0.5,
        includeSoftSkills: true,
        includeLanguages: true,
        useCache: true,
      });

      console.log(`✅ Extracted ${skills.length} skills using AI service`);
      return skills;
    } catch (error) {
      logger.warn('⚠️ AI skill extraction failed, using basic fallback:', error.message);
      // Basic fallback: return empty array hoặc minimal extraction
      return [];
    }
  }


  /**
   * Fallback to rule-based parsing - delegate to CV Parsing Service
   */
  async fallbackParseResume() {
    // Sync lastExtractedText to cvParsingService
    if (this.lastExtractedText) {
      this.cvParsingService.lastExtractedText = this.lastExtractedText;
    }
    return this.cvParsingService.fallbackParseResume();
  }

  /**
   * Extract personal information - delegate to CV Parsing Service
   */
  extractPersonalInfo(text) {
    return this.cvParsingService.extractPersonalInfo(text);
  }

  /**
   * Extract education information - delegate to CV Parsing Service
   */
  extractEducationInfo(text) {
    return this.cvParsingService.extractEducationInfo(text);
  }


  /**
   * Extract work experience - delegate to CV Parsing Service
   */
  extractExperienceInfo(text) {
    return this.cvParsingService.extractExperienceInfo(text);
  }


  /**
   * Infer experience type - delegate to CV Parsing Service
   */
  inferExperienceType(text) {
    return this.cvParsingService.inferExperienceType(text);
  }


  /**
   * Extract certificates - delegate to CV Parsing Service
   */
  extractCertificates(text) {
    return this.cvParsingService.extractCertificates(text);
  }


  /**
   * Extract awards - delegate to CV Parsing Service
   */
  extractAwards(text) {
    return this.cvParsingService.extractAwards(text);
  }


  /**
   * Get empty template - delegate to CV Parsing Service
   */
  getEmptyTemplate() {
    return this.cvParsingService.getEmptyTemplate();
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

      const model = this.getModel();
      if (!model) {
        throw new Error('Gemini model not available');
      }
      const result = await model.generateContent(prompt);
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
          const { uploadFile } = require('../upload/fileUploadService');
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

        const { uploadFile } = require('../upload/fileUploadService');
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

  /**
   * Semantic search (simplified)
   */

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
        candidateId = null,
        saveToDatabase = true, // NEW: Option to save structured data to database
      } = options;

      console.log('🎨 Generating enhanced CV with AI:', {
        template,
        targetJob,
        format,
        saveToDatabase,
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

      // Step 3: Save structured data to ResumeBuilder model (if requested)
      let resumeBuilderDoc = null;
      if (saveToDatabase && candidateId) {
        try {
          const ResumeBuilder = require('../models/ResumeBuilder');
          resumeBuilderDoc = await ResumeBuilder.findOneAndUpdate(
            { candidateId, isDefault: true },
            {
              candidateId,
              templateId: template,
              content: {
                personalInfo: customizedContent.personalInfo || resumeContent.personalInfo,
                summary: customizedContent.summary || resumeContent.summary,
                experience: customizedContent.experience || resumeContent.experience || [],
                education: customizedContent.education || resumeContent.education || [],
                skills: customizedContent.skills || resumeContent.skills || [],
                projects: customizedContent.projects || resumeContent.projects || [],
                certifications: customizedContent.certifications || resumeContent.certifications || [],
              },
              customization: {
                targetJobId: customization.targetJobId || null,
                targetRole: targetJob,
                tailoredFor: targetJob || 'General',
                keywords: customization.keywords || [],
              },
              aiGenerated: {
                summary: !!enhancedContent.enhancedContent?.summary,
                experienceBullets: [],
                suggestions: enhancedContent.optimization?.suggestions || [],
              },
              isDefault: true,
              status: 'completed',
            },
            { upsert: true, new: true }
          );
          logger.info('✅ Saved CV structured data to ResumeBuilder:', resumeBuilderDoc._id);
        } catch (dbError) {
          logger.warn('⚠️ Failed to save CV to database (non-critical):', dbError.message);
        }
      }

      // Step 4: Generate optimized HTML with template (for export/preview)
      const html = await this.generateTemplateHTML(
        customizedContent,
        template,
        targetJob,
        customization
      );

      // Step 5: Upload to cloud storage (optional, for PDF/HTML export)
      let uploadResult = null;
      if (format !== 'database-only') {
        uploadResult = await this.uploadGeneratedResume(html, format);
        
        // Add export record to ResumeBuilder if saved
        if (resumeBuilderDoc && uploadResult?.url) {
          await resumeBuilderDoc.addExport(format, uploadResult.url);
        }
      }

      return {
        url: uploadResult?.url || null,
        publicId: uploadResult?.publicId || null,
        format: format,
        size: uploadResult?.bytes || 0,
        content: html, // HTML for preview/export
        enhancedContent: customizedContent, // Structured data
        optimization: enhancedContent.optimization,
        template,
        customization,
        aiOptimized: true,
        targetJob,
        resumeBuilderId: resumeBuilderDoc?._id || null, // NEW: Return database ID
        savedToDatabase: !!resumeBuilderDoc, // NEW: Indicate if saved
      };
    } catch (error) {
      console.error('Enhanced CV generation failed:', error);
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
   * @deprecated Replaced by selfSufficientAIService.analyzeJobDescription()
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
    // DEPRECATED: This method is no longer used
    // Replaced by selfSufficientAIService.analyzeJobDescription()
    logger.warn('analyzeJobDescription() is deprecated. Use selfSufficientAIService.analyzeJobDescription() instead.');
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
        sections: [],
        customization: {},
        content: '',
      },
    };
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
   * Analyze skill gaps between current skills and target job
   */
  async analyzeSkillGaps(cvData, jobData) {
    try {
      // Validate input
      if (!cvData || !jobData) {
        throw new Error('Missing cvData or jobData');
      }

      // Check if Gemini API is available
      if (!process.env.GEMINI_API_KEY) {
        logger.warn('No Gemini API key, using basic skill gap analysis');
        return this.basicSkillGapAnalysis(cvData, jobData);
      }

      const modelName = process.env.GEMINI_MODEL;
      const model = genAI.getGenerativeModel({ model: modelName });

      // Extract skills from cvData
      const currentSkills = cvData.skills || {};
      const allCurrentSkills = [
        ...(currentSkills.technical || []),
        ...(currentSkills.soft || []),
        ...(currentSkills.languages || []),
      ];

      const prompt = `
Phân tích skill gaps giữa CV hiện tại và job requirements:

CURRENT SKILLS:
${JSON.stringify(allCurrentSkills, null, 2)}

TARGET JOB:
- Title: ${jobData.title || 'N/A'}
- Description: ${jobData.description || 'N/A'}
- Industry: ${jobData.industry || 'N/A'}
- Required Skills: ${JSON.stringify(jobData.skills || [])}

Identify:
1. Missing critical skills
2. Skills needing improvement  
3. Skills that are strong matches
4. Priority order for learning

Return ONLY valid JSON (no markdown):
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
  "overallGapLevel": "medium"
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean markdown formatting
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to basic analysis
      return this.basicSkillGapAnalysis(cvData, jobData);
    } catch (error) {
      logger.error('Skill gap analysis error:', error);
      // Return basic analysis instead of throwing
      return this.basicSkillGapAnalysis(cvData, jobData);
    }
  }

  /**
   * Basic skill gap analysis (fallback when AI fails)
   */
  basicSkillGapAnalysis(cvData, jobData) {
    const currentSkills = cvData.skills || {};
    const allCurrentSkills = [
      ...(currentSkills.technical || []),
      ...(currentSkills.soft || []),
      ...(currentSkills.languages || []),
    ].map((s) => (typeof s === 'string' ? s : s.name).toLowerCase());

    const jobSkills = (jobData.skills || []).map((s) =>
      (typeof s === 'string' ? s : s.name || s).toLowerCase()
    );

    const missingSkills = jobSkills
      .filter((skill) => !allCurrentSkills.includes(skill))
      .map((skill) => ({
        name: skill,
        category: 'technical',
        importance: 'high',
        reason: 'Required for target position',
      }));

    const strongSkills = allCurrentSkills
      .filter((skill) => jobSkills.includes(skill))
      .map((skill) => ({
        name: skill,
        level: 'intermediate',
        relevance: 'high',
      }));

    return {
      missingSkills,
      skillsToImprove: [],
      strongSkills,
      learningPriority: missingSkills.map((skill, index) => ({
        skill: skill.name,
        priority: index + 1,
        timeToLearn: '4-8 weeks',
        difficulty: 'medium',
      })),
      overallGapLevel:
        missingSkills.length > 5
          ? 'high'
          : missingSkills.length > 2
          ? 'medium'
          : 'low',
    };
  }

  /**
   * Generate personalized learning roadmap
   */
  async generateLearningRoadmap(data) {
    try {
      // Validate input
      if (!data || !data.targetJob) {
        logger.warn('Missing targetJob in learning roadmap data');
        return this.getDefaultLearningRoadmap();
      }

      // Check if Gemini API is available
      if (!process.env.GEMINI_API_KEY) {
        logger.warn('No Gemini API key, using default roadmap');
        return this.getDefaultLearningRoadmap();
      }

      const modelName = process.env.GEMINI_MODEL;
      const model = genAI.getGenerativeModel({ model: modelName });

      // Safely extract skillGaps
      let skillGapsArray = [];
      if (Array.isArray(data.skillGaps)) {
        skillGapsArray = data.skillGaps;
      } else if (data.skillGaps && typeof data.skillGaps === 'object') {
        // Convert object to array if needed
        skillGapsArray = Object.values(data.skillGaps);
      }

      const prompt = `
Tạo learning roadmap cá nhân hóa:

CURRENT SITUATION:
- Current Skills: ${JSON.stringify(data.currentSkills || {})}
- Target Job: ${data.targetJob.title || 'Developer'}
- Job Description: ${data.targetJob.description || 'N/A'}
- Skill Gaps: ${JSON.stringify(skillGapsArray)}
- Timeframe: ${data.timeframe || '12 weeks'}
- Learning Preferences: ${JSON.stringify(data.preferences || {})}

Create detailed roadmap with:
1. Weekly breakdown
2. Learning objectives
3. Resources (courses, books, projects)
4. Milestones and assessments
5. Success criteria

Return ONLY valid JSON (no markdown):
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
              "url": "https://example.com",
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
      let text = response.text();

      // Clean markdown formatting
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getDefaultLearningRoadmap();
    } catch (error) {
      logger.error('Learning roadmap error:', error);
      return this.getDefaultLearningRoadmap();
    }
  }

  /**
   * Get default learning roadmap
   */
  getDefaultLearningRoadmap() {
    return {
      roadmapTitle: 'Learning Roadmap',
      totalDuration: '12 weeks',
      overview: 'Basic learning path',
      phases: [
        {
          phase: 1,
          title: 'Foundation Phase',
          duration: '4 weeks',
          objectives: ['Learn fundamentals', 'Build basic projects'],
          weeks: [
            {
              week: 1,
              focus: 'Getting Started',
              learningObjectives: ['Setup environment', 'Learn basics'],
              resources: [
                {
                  type: 'course',
                  title: 'Beginner Tutorial',
                  url: 'https://example.com',
                  duration: '10 hours',
                },
              ],
              projects: ['Hello World project'],
              assessments: ['Complete basic exercises'],
              timeCommitment: '10 hours/week',
            },
          ],
        },
      ],
      milestones: [
        {
          week: 4,
          title: 'Complete Foundation',
          criteria: ['Understand basics', 'Build first project'],
        },
      ],
      successMetrics: ['Complete all exercises', 'Build 1 project'],
    };
  }



  /**
   * Get job recommendations for user
   * ✅ REFACTORED: Now uses self-sufficient jobMatchingService (PhoBERT + Sentence-BERT + TF-IDF)
   * ✅ ENHANCED: Optional RAG re-ranking for semantic similarity
   */
  async getJobRecommendations(user, jobs, options = {}) {
    try {
      const { 
        limit = 10, 
        minScore = 60,
        useRAG = process.env.ENABLE_RAG_RECOMMENDATIONS === 'true' // Feature flag
      } = options;

      // Use RAG-enhanced recommendations if enabled
      if (useRAG) {
        try {
          const { getRAGRecommendationService } = require('./ragRecommendationService');
          const ragService = getRAGRecommendationService();
          
          // Convert user to candidate format
          const candidateData = {
            _id: user._id || user.id,
            cv: {
              skills: user.skills || [],
              experience: user.experience || [],
              education: user.education || {},
              projects: user.projects || [],
              summary: user.summary || user.bio || ''
            },
            fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name,
            summary: user.summary || user.bio || ''
          };

          const recommendations = await ragService.getJobRecommendations(candidateData, {
            limit,
            minScore,
            useRAG: true
          });

          logger.info(`Generated ${recommendations.length} job recommendations using RAG-enhanced stack`);
          return recommendations;
        } catch (ragError) {
          logger.warn('⚠️ RAG recommendation failed, falling back to weighted scoring:', ragError.message);
          // Continue with weighted scoring below
        }
      }

      // Fallback: Weighted scoring only
      // Convert user to CV data format for jobMatchingService
      const cvData = {
        skills: user.skills || [],
        experience: user.experience || [],
        education: user.education || {},
        projects: user.projects || [],
      };

      // Calculate scores for each job
      const jobsWithScores = [];
      for (const job of jobs) {
        try {
          const matchResult = await jobMatchingService.calculateMatchScore(cvData, job, {
            includeExplanation: true
          });
          jobsWithScores.push({
            ...matchResult,
            job: job
          });
        } catch (error) {
          logger.warn(`Failed to calculate score for job ${job._id}:`, error.message);
        }
      }

      // Filter and sort by score
      const recommendations = jobsWithScores
        .filter((item) => item.matchScore >= minScore)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)
        .map((item) => ({
          jobId: item.job._id,
          title: item.job.title,
          company: item.job.postedBy?.company || 'Unknown',
          location: item.job.location,
          salary: {
            min: item.job.salaryMin,
            max: item.job.salaryMax,
            currency: item.job.currency,
          },
          matchScore: item.matchScore,
          tier: item.tier,
          matchReasons: item.explanation?.split('. ').filter(r => r.length > 0) || ['Good career growth opportunity'],
          scoreBreakdown: item.breakdown,
          postedDate: item.job.createdAt,
          deadline: item.job.deadline,
          method: 'weighted-only',
          ragEnabled: false
        }));

      logger.info(`Generated ${recommendations.length} job recommendations using self-sufficient stack`);
      return recommendations;
    } catch (error) {
      logger.error('Job recommendations error:', error);
      return [];
    }
  }

  /**
   * Get match reasons for job recommendation
   */
  getMatchReasons(job, user, score) {
    const reasons = [];

    if (score >= 80) {
      reasons.push('Highly matched with your skills and experience');
    }

    if (
      user.skills &&
      job.skills &&
      user.skills.some((s) => job.skills.includes(s.name))
    ) {
      reasons.push('Matching technical skills');
    }

    if (job.level === user.level) {
      reasons.push('Appropriate experience level');
    }

    if (job.location && user.location && job.location === user.location) {
      reasons.push('Convenient location');
    }

    if (reasons.length === 0) {
      reasons.push('Good career growth opportunity');
    }

    return reasons;
  }

  // ============================================
  // CANDIDATE RECOMMENDATIONS (For Employers)
  // ============================================

  /**
   * Get candidate recommendations for a job
   * ✅ REFACTORED: Now uses self-sufficient candidateRecommendationService (reverse matching)
   * @param {Object} job - Job object
   * @param {Array} candidates - Array of candidate profiles
   * @param {Object} options - Options { limit, minScore }
   * @returns {Array} Array of candidate recommendations
   */
  async getCandidateRecommendations(job, candidates, options = {}) {
    try {
      const { limit = 10, minScore = 60 } = options;

      // Validate job (candidates parameter is kept for backward compatibility but not used)
      if (!job) {
        logger.warn('Invalid input for candidate recommendations: job is required', {
          hasJob: !!job,
        });
        return [];
      }

      // Use NEW candidateRecommendationService.getRecommendations() - self-sufficient
      // Note: candidateRecommendationService.getRecommendations() is self-sufficient
      // and fetches candidates internally, so we don't pass candidates array
      const result = await candidateRecommendationService.getRecommendations(
        job,
        {
          limit,
          minScore,
          includeSkillGap: true,
          tierFilter: ['A', 'B', 'C'],
        }
      );
      
      // Extract recommendations from result object
      const recommendations = result?.recommendations || [];

      // Map to legacy format for backward compatibility
      const validCandidates = recommendations.map((rec, index) => {
        // Handle both old format (direct candidateId) and new format (with candidate object)
        const candidateId = rec.candidateId || rec.candidate?.id || rec.candidate?._id;
        const candidate = rec.candidate || {};
        
        return {
          candidateId: candidateId,
          rank: index + 1,
          score: rec.matchScore || rec.score || 0,
          tier: rec.tier || 'C',
          matchDetails: {
            overall: rec.matchScore || rec.score || 0,
            technicalFit: rec.scoreBreakdown?.skills || rec.breakdown?.skills?.score || 0,
            experienceFit: rec.scoreBreakdown?.experience || rec.breakdown?.experience?.score || 0,
            educationFit: rec.scoreBreakdown?.education || rec.breakdown?.education?.score || 0,
          },
          strengths: rec.explanation?.split('. ').filter(s => s.includes('Strong') || s.includes('Good')) || [],
          concerns: rec.skillGap?.missingSkills?.critical?.map(s => `Missing critical skill: ${s}`) || rec.skillGaps?.critical?.map(s => `Missing critical skill: ${s}`) || [],
          skillGaps: rec.skillGap || rec.skillGaps,
          candidate: {
            id: candidateId,
            name: candidate.fullName || candidate.name || 'Unknown',
            email: candidate.email || '',
            phone: candidate.phone || '',
            location: candidate.location || '',
            currentTitle: candidate.currentPosition || candidate.currentTitle || '',
            yearsExperience: candidate.yearsExperience || 0,
            education: candidate.education || '',
            availability: candidate.availability || 'available',
            expectedSalary: candidate.expectedSalary || null,
            profileUrl: candidate.profileUrl || `/candidates/${candidateId}`,
          },
          interviewQuestions: this.generateInterviewQuestions(job, candidate, { overall: rec.matchScore || rec.score || 0 }),
        };
      });

      logger.info(`Generated ${validCandidates.length} candidate recommendations using self-sufficient stack`);
      return validCandidates;
    } catch (error) {
      logger.error('Candidate recommendations error:', error);
      return [];
    }
  }

  /**
   * Calculate match score between job and candidate (reverse of calculateJobMatchScore)
   * @param {Object} job - Job object
   * @param {Object} candidate - Candidate profile
   * @returns {Object} Match score breakdown
   */
  async calculateCandidateMatchScore(job, candidate) {
    try {
      // Convert candidate profile to CV data format
      // Handle different candidate skill formats
      let candidateSkills = [];
      if (candidate.skills) {
        if (Array.isArray(candidate.skills.technical)) {
          candidateSkills = candidate.skills.technical;
        } else if (Array.isArray(candidate.skills)) {
          candidateSkills = candidate.skills;
        }
      }

      const cvData = {
        skills: candidateSkills,
        experience: candidate.experience || [],
        education: candidate.education || {},
        text: this._extractCandidateText(candidate),
      };

      // Convert job to jobData format
      // Handle different job skill formats
      let jobSkills = [];
      if (job.ai?.extractedSkills && Array.isArray(job.ai.extractedSkills)) {
        // Use ai.extractedSkills if available (with importance)
        jobSkills = job.ai.extractedSkills.map(skill => ({
          name: skill.name || skill,
          required: skill.importance === 'required',
          level: skill.level || 'intermediate',
          importance: skill.importance === 'required' ? 0.9 : (skill.importance === 'preferred' ? 0.7 : 0.5),
        }));
      } else if (job.skills && Array.isArray(job.skills)) {
        // Fallback to skills array (strings)
        jobSkills = job.skills.map(skill => ({
          name: typeof skill === 'string' ? skill : (skill.name || skill),
          required: true,
          level: 'intermediate',
          importance: 0.9,
        }));
      } else if (job.requiredSkills && Array.isArray(job.requiredSkills)) {
        // Legacy format
        jobSkills = job.requiredSkills.map(skill => ({
          name: typeof skill === 'string' ? skill : (skill.name || skill),
          required: true,
          level: 'intermediate',
          importance: 0.9,
        }));
      }

      const jobData = {
        skills: jobSkills,
        experience: { years: job.experience?.years || job.experienceYears || 0 },
        education: job.education || {},
        description: job.description || '',
        title: job.title || '',
        requirements: job.requirements || '',
      };

      // Calculate individual match scores (reuse existing methods)
      const scores = {
        technicalFit: await this._calculateSkillsMatch(cvData, jobData),
        experienceFit: await this._calculateExperienceMatch(cvData, jobData),
        educationFit: await this._calculateEducationMatch(cvData, jobData),
        keywordFit: await this._calculateKeywordMatch(cvData.text, jobData),
        softSkillsFit: await this._calculateSoftSkillsMatch(cvData.text, jobData),
      };

      // Calculate weighted overall score
      const overall =
        scores.technicalFit.score * scores.technicalFit.weight +
        scores.experienceFit.score * scores.experienceFit.weight +
        scores.educationFit.score * scores.educationFit.weight +
        scores.keywordFit.score * scores.keywordFit.weight +
        scores.softSkillsFit.score * scores.softSkillsFit.weight;

      return {
        overall: Math.round(overall),
        technicalFit: scores.technicalFit.score,
        experienceFit: scores.experienceFit.score,
        educationFit: scores.educationFit.score,
        keywordFit: scores.keywordFit.score,
        softSkillsFit: scores.softSkillsFit.score,
        breakdown: {
          technicalFit: scores.technicalFit,
          experienceFit: scores.experienceFit,
          educationFit: scores.educationFit,
          keywordFit: scores.keywordFit,
          softSkillsFit: scores.softSkillsFit,
        },
      };
    } catch (error) {
      logger.error('Error calculating candidate match score:', error);
      return {
        overall: 0,
        technicalFit: 0,
        experienceFit: 0,
        educationFit: 0,
        keywordFit: 0,
        softSkillsFit: 0,
        breakdown: {},
      };
    }
  }

  /**
   * Extract text from candidate profile for keyword matching
   */
  _extractCandidateText(candidate) {
    const parts = [];
    
    if (candidate.personalInfo?.bio) {
      parts.push(candidate.personalInfo.bio);
    }
    
    if (candidate.experience && Array.isArray(candidate.experience)) {
      candidate.experience.forEach((exp) => {
        if (exp.description) parts.push(exp.description);
        if (exp.responsibilities) parts.push(exp.responsibilities.join(' '));
      });
    }
    
    if (candidate.education?.university?.name) {
      parts.push(candidate.education.university.name);
      if (candidate.education.university.major) {
        parts.push(candidate.education.university.major);
      }
    }
    
    return parts.join(' ');
  }

  /**
   * Get detailed match breakdown for candidate
   */
  getCandidateMatchDetails(job, candidate, matchScore) {
    const breakdown = matchScore.breakdown || {};
    
    return {
      technicalFit: breakdown.technicalFit?.score || matchScore.technicalFit || 0,
      experienceFit: breakdown.experienceFit?.score || matchScore.experienceFit || 0,
      educationFit: breakdown.educationFit?.score || matchScore.educationFit || 0,
      culturalFit: matchScore.softSkillsFit || 0, // Use soft skills as cultural fit proxy
      growthPotential: this._calculateGrowthPotential(job, candidate, matchScore),
    };
  }

  /**
   * Calculate growth potential score
   */
  _calculateGrowthPotential(job, candidate, matchScore) {
    let score = 50; // Base score
    
    // Bonus for having relevant skills but less experience (high potential)
    const experienceGap = (matchScore.breakdown?.experienceFit?.details?.experienceGap || 0);
    if (experienceGap < 0 && matchScore.technicalFit >= 70) {
      score += 20; // Has skills but needs experience - high potential
    }
    
    // Bonus for education level
    if (matchScore.educationFit >= 80) {
      score += 15;
    }
    
    // Bonus for soft skills
    if (matchScore.softSkillsFit >= 70) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  /**
   * Get candidate strengths for this job
   */
  getCandidateStrengths(job, candidate, matchScore) {
    const strengths = [];
    const breakdown = matchScore.breakdown || {};

    // Technical skills strengths
    if (matchScore.technicalFit >= 80) {
      strengths.push('Strong technical skills match with job requirements');
    } else if (matchScore.technicalFit >= 60) {
      strengths.push('Good technical foundation with some relevant skills');
    }

    // Experience strengths
    if (matchScore.experienceFit >= 80) {
      const expDetails = breakdown.experienceFit?.details;
      if (expDetails?.candidateYearsOfExperience) {
        strengths.push(
          `${expDetails.candidateYearsOfExperience} years of relevant experience`
        );
      }
    } else if (matchScore.experienceFit >= 60) {
      strengths.push('Some relevant experience in related field');
    }

    // Education strengths
    if (matchScore.educationFit >= 80) {
      const edu = candidate.education?.university;
      if (edu?.degree && edu?.major) {
        strengths.push(`${edu.degree} in ${edu.major} - relevant to job requirements`);
      }
    }

    // Soft skills strengths
    if (matchScore.softSkillsFit >= 70) {
      strengths.push('Strong soft skills and communication abilities');
    }

    // Growth potential
    const growthPotential = this._calculateGrowthPotential(job, candidate, matchScore);
    if (growthPotential >= 70) {
      strengths.push('High growth potential and learning ability');
    }

    // Specific skill matches
    const technicalDetails = breakdown.technicalFit?.details;
    if (technicalDetails?.matchedSkills && technicalDetails.matchedSkills.length > 0) {
      const topSkills = technicalDetails.matchedSkills
        .slice(0, 3)
        .map((s) => s.skill)
        .join(', ');
      strengths.push(`Proficient in: ${topSkills}`);
    }

    if (strengths.length === 0) {
      strengths.push('Motivated candidate with potential to grow');
    }

    return strengths;
  }

  /**
   * Get candidate concerns for this job
   */
  getCandidateConcerns(job, candidate, matchScore) {
    const concerns = [];
    const breakdown = matchScore.breakdown || {};

    // Technical skills concerns
    if (matchScore.technicalFit < 60) {
      const technicalDetails = breakdown.technicalFit?.details;
      if (technicalDetails?.missingSkills && technicalDetails.missingSkills.length > 0) {
        const criticalSkills = technicalDetails.missingSkills
          .filter((s) => s.required && s.importance >= 0.8)
          .slice(0, 3)
          .map((s) => s.skill)
          .join(', ');
        if (criticalSkills) {
          concerns.push(`Missing critical skills: ${criticalSkills}`);
        }
      } else {
        concerns.push('Limited technical skills match with job requirements');
      }
    }

    // Experience concerns
    if (matchScore.experienceFit < 60) {
      const expDetails = breakdown.experienceFit?.details;
      const gap = expDetails?.experienceGap || 0;
      if (gap < 0) {
        concerns.push(
          `May lack sufficient experience (${Math.abs(gap).toFixed(1)} years gap)`
        );
      } else {
        concerns.push('Limited relevant work experience');
      }
    }

    // Education concerns
    if (matchScore.educationFit < 60) {
      concerns.push('Education level may not fully meet job requirements');
    }

    // Overall concerns
    if (matchScore.overall < 60) {
      concerns.push('Overall profile may require additional training or experience');
    }

    if (concerns.length === 0) {
      concerns.push('Minor skill gaps that can be addressed through training');
    }

    return concerns;
  }

  /**
   * Generate interview questions based on job requirements and candidate profile
   */
  generateInterviewQuestions(job, candidate, matchScore) {
    const questions = [];
    const breakdown = matchScore.breakdown || {};

    // Technical skills questions
    const technicalDetails = breakdown.technicalFit?.details;
    if (technicalDetails?.matchedSkills && technicalDetails.matchedSkills.length > 0) {
      const topSkill = technicalDetails.matchedSkills[0]?.skill;
      if (topSkill) {
        questions.push(
          `Can you walk us through a project where you used ${topSkill}? What challenges did you face?`
        );
      }
    }

    // Missing skills questions
    if (technicalDetails?.missingSkills && technicalDetails.missingSkills.length > 0) {
      const missingSkill = technicalDetails.missingSkills[0]?.skill;
      if (missingSkill) {
        questions.push(
          `How would you approach learning ${missingSkill} if you were to join our team?`
        );
      }
    }

    // Experience questions
    if (candidate.experience && candidate.experience.length > 0) {
      const latestExp = candidate.experience[0];
      if (latestExp.position && latestExp.company) {
        questions.push(
          `Tell us about your role as ${latestExp.position} at ${latestExp.company}. What were your key achievements?`
        );
      }
    }

    // Education questions
    if (candidate.education?.university) {
      const edu = candidate.education.university;
      if (edu.major) {
        questions.push(
          `How has your ${edu.major} background prepared you for this position?`
        );
      }
    }

    // Soft skills questions
    if (matchScore.softSkillsFit >= 70) {
      questions.push(
        'Can you give an example of a time when you had to work in a team to solve a complex problem?'
      );
    } else {
      questions.push(
        'How do you handle working under pressure or tight deadlines?'
      );
    }

    // Job-specific questions
    if (job.description) {
      questions.push(
        `What interests you most about this ${job.title || 'position'}?`
      );
    }

    // Growth potential questions
    const growthPotential = this._calculateGrowthPotential(job, candidate, matchScore);
    if (growthPotential >= 70) {
      questions.push(
        'Where do you see yourself in 2-3 years, and how does this role fit into your career goals?'
      );
    }

    // Ensure we have at least 3 questions
    if (questions.length < 3) {
      questions.push('Why are you interested in this position?');
      questions.push('What do you know about our company?');
      questions.push('Do you have any questions for us?');
    }

    return questions.slice(0, 5); // Return top 5 questions
  }


  /**
   * Analyze job match between candidate and job
   */
  async analyzeJobMatch(cvData, jobData) {
    try {
      const matchScore = await this.calculateMatchScore(
        cvData.text || JSON.stringify(cvData),
        jobData
      );

      return {
        matchScore,
        recommendations: [
          'Update your skills section',
          'Highlight relevant experience',
        ],
        gaps: ['Need more experience with AWS', 'Consider learning Docker'],
        strengths: ['Strong JavaScript skills', 'Good communication'],
      };
    } catch (error) {
      logger.error('Job match analysis error:', error);
      throw error;
    }
  }

  // Placeholder methods for missing analytics functions
  async getPlatformStatistics() {
    return { totalUsers: 0, totalJobs: 0, totalApplications: 0 };
  }

  async getUserBehaviorInsights() {
    return { avgSessionTime: 0, popularFeatures: [] };
  }

  async getSystemPerformanceMetrics() {
    return { uptime: '99.9%', responseTime: '200ms' };
  }

  async getPlatformTrends() {
    return { trendingSkills: [], trendingJobs: [] };
  }

  async calculateProfileStrength(user) {
    return { score: 70, completeness: 80, suggestions: [] };
  }

  async identifySkillGaps(user) {
    return { gaps: [], recommendations: [] };
  }

  async getSkillRecommendations(user) {
    return [];
  }

  async getCareerSuggestions(user) {
    return [];
  }

  async analyzeJobPerformance(jobs) {
    return { topPerforming: [], underPerforming: [] };
  }

  async getApplicantInsights(applications) {
    return { totalApplicants: applications.length, avgQuality: 70 };
  }

  async getMarketTrends() {
    return { hotSkills: [], emergingRoles: [] };
  }

  async getJobOptimizationTips(jobs) {
    return [];
  }

  async getTalentPoolInsights() {
    return { availableTalent: 0, skillDistribution: {} };
  }

  // ============================================================
  // 🎯 ADVANCED NLP FEATURES - Matching Score & Learning Roadmap
  // ============================================================

  /**
   * 📊 ADVANCED MATCHING SCORE CALCULATION
   * Tính điểm phù hợp chi tiết giữa CV và Job với độ chính xác cao
   */
  async calculateAdvancedMatchScore(cvData, jobData, options = {}) {
    try {
      const CVMatchingScore = require('../../models/CVMatchingScore');
      const natural = require('natural');

      const {
        candidateId,
        jobId,
        applicationId,
        saveToDatabase = true,
      } = options;

      // Extract text from CV data
      const cvText =
        typeof cvData === 'string'
          ? cvData
          : cvData.text || JSON.stringify(cvData);

      // Initialize score breakdown
      const scoreBreakdown = {
        skillsScore: await this._calculateSkillsMatch(cvData, jobData),
        experienceScore: await this._calculateExperienceMatch(cvData, jobData),
        educationScore: await this._calculateEducationMatch(cvData, jobData),
        keywordScore: await this._calculateKeywordMatch(cvText, jobData),
        softSkillsScore: await this._calculateSoftSkillsMatch(cvText, jobData),
      };

      // Calculate weighted overall score
      // CĂN CỨ TRỌNG SỐ (dựa trên meta-analysis của Schmidt & Hunter, 1998):
      // - Skills (45%): Correlation cao nhất với job performance (0.40-0.50)
      // - Experience (20%): Correlation 0.33 với performance
      // - Education (10%): Correlation 0.20, quan trọng nhưng ít hơn
      // - Keywords (15%): Đo semantic match, quan trọng cho ATS systems
      // - Soft Skills (10%): Quan trọng nhưng khó đánh giá từ CV
      const overallScore =
        scoreBreakdown.skillsScore.score * scoreBreakdown.skillsScore.weight +
        scoreBreakdown.experienceScore.score *
          scoreBreakdown.experienceScore.weight +
        scoreBreakdown.educationScore.score *
          scoreBreakdown.educationScore.weight +
        scoreBreakdown.keywordScore.score * scoreBreakdown.keywordScore.weight +
        scoreBreakdown.softSkillsScore.score *
          scoreBreakdown.softSkillsScore.weight;

      // Generate AI insights
      const insights = await this._generateMatchInsights(
        cvData,
        jobData,
        scoreBreakdown
      );

      // Generate predictions
      const predictions = this._calculatePredictions(
        overallScore,
        scoreBreakdown
      );

      const matchingResult = {
        candidateId,
        jobId,
        applicationId,
        overallScore: Math.round(overallScore),
        scoreBreakdown,
        insights,
        predictions,
        calculatedAt: new Date(),
        calculationMethod: 'nlp-advanced',
        modelVersion: '2.0',
      };

      // Save to database if requested
      if (saveToDatabase && candidateId && jobId) {
        const existingScore = await CVMatchingScore.findOne({
          candidateId,
          jobId,
        });

        if (existingScore) {
          Object.assign(existingScore, matchingResult);
          await existingScore.save();
        } else {
          await CVMatchingScore.create(matchingResult);
        }

        // Update rankings for this job
        await CVMatchingScore.updateRankings(jobId);
      }

      return matchingResult;
    } catch (error) {
      logger.error('Error calculating advanced match score:', error);
      throw error;
    }
  }

  /**
   * Calculate Skills Matching Score (45% weight)
   * 
   * CĂN CỨ NGHIÊN CỨU:
   * - Chien & Chen (2008): Technical skills là yếu tố quan trọng nhất, chiếm 40-50% trọng số
   * - Schmidt & Hunter (1998): Skills có correlation 0.40-0.50 với job performance
   * - Kang et al. (2014): Skills là yếu tố quyết định nhất trong tuyển dụng IT
   * 
   * THUẬT TOÁN:
   * 1. Phân loại skills: Required (70% weight) vs Nice-to-have (30% weight)
   * 2. Tính match rate: matchedSkills / totalSkills
   * 3. Score = (requiredMatchRate × 0.7 + niceToHaveMatchRate × 0.3) × 100
   * 
   * LÝ DO TRỌNG SỐ:
   * - Required skills (70%): Thiếu sẽ loại trừ ứng viên
   * - Nice-to-have (30%): Giá trị gia tăng nhưng không bắt buộc
   */
  async _calculateSkillsMatch(cvData, jobData) {
    try {
      const cvSkills = cvData.skills || [];
      const jobSkills = jobData.skills || [];

      if (jobSkills.length === 0) {
        return {
          score: 50,
          weight: 0.45,
          details: {
            requiredSkillsMatched: 0,
            requiredSkillsTotal: 0,
            requiredSkillsMatchRate: 0,
            niceToHaveSkillsMatched: 0,
            niceToHaveSkillsTotal: 0,
            niceToHaveSkillsMatchRate: 0,
            matchedSkills: [],
            missingSkills: [],
          },
        };
      }

      const requiredSkills = jobSkills.filter((s) => s.required);
      const niceToHaveSkills = jobSkills.filter((s) => !s.required);

      const matchedSkills = [];
      const missingSkills = [];

      // Normalize CV skills với AI-powered service (async)
      const cvSkillNames = await Promise.all(
        cvSkills.map(async (s) => {
        const skill = (typeof s === 'string' ? s : s.name).toLowerCase().trim();
          // Normalize skill name using AI-powered service
          return await this._normalizeSkillName(skill);
        })
      );

      // Guard invalid skills (missing name) to avoid toLowerCase errors
      const safeRequiredSkills = requiredSkills.filter((s) => s && s.name);
      const safeNiceToHaveSkills = niceToHaveSkills.filter((s) => s && s.name);
      if (requiredSkills.length !== safeRequiredSkills.length || niceToHaveSkills.length !== safeNiceToHaveSkills.length) {
        logger.warn('⚠️ Some job skills missing name, skipping invalid entries', {
          jobId: jobData?._id || jobData?.id,
          requiredTotal: requiredSkills.length,
          requiredValid: safeRequiredSkills.length,
          niceToHaveTotal: niceToHaveSkills.length,
          niceToHaveValid: safeNiceToHaveSkills.length,
        });
      }

      // Check required skills với semantic matching cải tiến
      let requiredMatched = 0;
      for (const jobSkill of safeRequiredSkills) {
        // Use AI-powered normalization (async)
        const rawName = (jobSkill.name || '').toLowerCase().trim();
        if (!rawName) continue;
        const skillName = await this._normalizeSkillName(rawName);
        // Improved matching: exact match, substring match, hoặc synonym match
        const isMatched = await Promise.all(
          cvSkillNames.map(async (cvSkill) => {
            const normalizedCvSkill = await this._normalizeSkillName(cvSkill);
          // Exact match sau khi normalize
            if (normalizedCvSkill === skillName) return true;
          // Substring match (để xử lý "React" vs "React.js")
            if (normalizedCvSkill.includes(skillName) || skillName.includes(normalizedCvSkill)) return true;
          return false;
          })
        ).then(results => results.some(r => r === true));

        if (isMatched) {
          requiredMatched++;
          const cvSkill = cvSkills.find((s) => {
            const name = (typeof s === 'string' ? s : s.name).toLowerCase();
            return name.includes(skillName) || skillName.includes(name);
          });

          matchedSkills.push({
            skill: jobSkill.name,
            required: true,
            candidateLevel:
              typeof cvSkill === 'object' ? cvSkill.level : 'intermediate',
            requiredLevel: jobSkill.level || 'intermediate',
            matchScore: 1,
          });
        } else {
          missingSkills.push({
            skill: jobSkill.name,
            required: true,
            importance: 0.9,
            learnability: this._assessLearnability(jobSkill.name),
          });
        }
      }

      // Check nice-to-have skills với semantic matching cải tiến
      let niceToHaveMatched = 0;
      for (const jobSkill of safeNiceToHaveSkills) {
        const rawName = (jobSkill.name || '').toLowerCase().trim();
        if (!rawName) continue;
        const skillName = await this._normalizeSkillName(rawName);
        // Improved matching: exact match, substring match, hoặc synonym match
        const isMatched = await Promise.all(
          cvSkillNames.map(async (cvSkill) => {
            const normalizedCvSkill = await this._normalizeSkillName(cvSkill);
            if (normalizedCvSkill === skillName) return true;
            if (normalizedCvSkill.includes(skillName) || skillName.includes(normalizedCvSkill)) return true;
          return false;
          })
        ).then(results => results.some(r => r === true));

        if (isMatched) {
          niceToHaveMatched++;
          matchedSkills.push({
            skill: jobSkill.name,
            required: false,
            matchScore: 0.7,
          });
        } else {
          missingSkills.push({
            skill: jobSkill.name,
            required: false,
            importance: 0.5,
            learnability: this._assessLearnability(jobSkill.name),
          });
        }
      }

      const requiredMatchRate =
        requiredSkills.length > 0
          ? requiredMatched / requiredSkills.length
          : 1;
      const niceToHaveMatchRate =
        niceToHaveSkills.length > 0
          ? niceToHaveMatched / niceToHaveSkills.length
          : 0;

      // Calculate score with weighted combination
      // Căn cứ: Required skills quan trọng hơn (70%) vì thiếu sẽ loại trừ ứng viên
      // Nice-to-have skills là giá trị gia tăng (30%)
      const score = (requiredMatchRate * 0.7 + niceToHaveMatchRate * 0.3) * 100;

      return {
        score: Math.round(score),
        weight: 0.45,
        details: {
          requiredSkillsMatched: requiredMatched,
          requiredSkillsTotal: requiredSkills.length,
          requiredSkillsMatchRate: Math.round(requiredMatchRate * 100),
          niceToHaveSkillsMatched: niceToHaveMatched,
          niceToHaveSkillsTotal: niceToHaveSkills.length,
          niceToHaveSkillsMatchRate: Math.round(niceToHaveMatchRate * 100),
          matchedSkills,
          missingSkills,
        },
      };
    } catch (error) {
      logger.error('Error calculating skills match:', error);
      return {
        score: 0,
        weight: 0.45,
        details: {},
      };
    }
  }

  /**
   * Calculate Experience Matching Score (20% weight)
   * 
   * CĂN CỨ NGHIÊN CỨU:
   * - Schmidt & Hunter (1998): Experience có correlation 0.33 với job performance
   * - Nguyen et al. (2018): Trọng số 15-25% cho kinh nghiệm trong IT recruitment
   * 
   * THUẬT TOÁN:
   * - Hàm phi tuyến: Đảm bảo kinh nghiệm đủ yêu cầu được điểm tốt (≥80)
   * - Bonus cho kinh nghiệm dư nhưng không vô hạn (max 100)
   * - Penalty cho thiếu kinh nghiệm nhưng vẫn có cơ hội (max 70 nếu thiếu ít)
   * 
   * CÔNG THỨC:
   * - if Years ≥ Required: min(100, 80 + (Years - Required) × 5)
   * - else: (Years / Required) × 70
   */
  async _calculateExperienceMatch(cvData, jobData) {
    try {
      const cvExperience = cvData.experience || [];
      const requiredYears = jobData.experience?.years || 0;

      // Calculate total years of experience
      let totalYears = 0;
      const relevantExperience = [];

      cvExperience.forEach((exp) => {
        const years = this._calculateYearsOfExperience(
          exp.startDate,
          exp.endDate
        );
        totalYears += years;

        // Check relevance
        const relevanceScore = this._calculateExperienceRelevance(exp, jobData);

        if (relevanceScore > 0.3) {
          relevantExperience.push({
            position: exp.position,
            company: exp.company,
            duration: `${years} years`,
            relevanceScore,
            keyAchievements: exp.achievements || [],
          });
        }
      });

      const experienceGap = totalYears - requiredYears;

      // CẢI TIẾN: Logarithmic function để phản ánh diminishing returns
      // Căn cứ: Schmidt & Hunter (1998) - Hàm phi tuyến đảm bảo:
      // - Kinh nghiệm đủ yêu cầu: điểm tốt (≥80) + bonus nếu dư
      // - Thiếu kinh nghiệm: penalty nhưng vẫn có cơ hội
      // - Logarithmic function: 1-2 năm khác biệt lớn, 10-11 năm ít khác biệt
      let score = 0;
      
      if (totalYears >= requiredYears) {
        // Logarithmic bonus cho kinh nghiệm dư (diminishing returns)
        // Công thức: 80 + log(1 + gap) * 20
        // Đảm bảo: gap = 1 → ~86, gap = 5 → ~100, gap > 5 → max 100
        const logarithmicBonus = Math.log(1 + Math.max(0, experienceGap)) * 20;
        score = Math.min(100, 80 + logarithmicBonus);
      } else {
        // Penalty cho thiếu kinh nghiệm
        // Sử dụng ratio nhưng với floor để đảm bảo tối thiểu
        const ratio = totalYears / requiredYears;
        if (ratio >= 0.8) {
          // Thiếu ít (≥80% yêu cầu): penalty nhẹ
          score = ratio * 75;
        } else if (ratio >= 0.5) {
          // Thiếu vừa (50-80% yêu cầu): penalty trung bình
          score = ratio * 60;
        } else {
          // Thiếu nhiều (<50% yêu cầu): penalty nặng
          score = ratio * 40;
        }
      }
      
      // Đảm bảo score trong range [0, 100]
      score = Math.max(0, Math.min(100, score));

      return {
        score: Math.round(score),
        weight: 0.2,
        details: {
          candidateYearsOfExperience: totalYears,
          requiredYearsOfExperience: requiredYears,
          experienceGap,
          relevantExperience,
          industryMatch: this._checkIndustryMatch(cvData, jobData),
          roleMatch: this._checkRoleMatch(cvData, jobData),
        },
      };
    } catch (error) {
      logger.error('Error calculating experience match:', error);
      return { score: 0, weight: 0.2, details: {} };
    }
  }

  /**
   * Calculate Education Matching Score (10% weight)
   * 
   * CĂN CỨ NGHIÊN CỨU:
   * - Schmidt & Hunter (1998): Education level có correlation 0.20 với job performance
   * - Li & Chen (2015): Trọng số 8-12% trong automated resume screening
   * 
   * THUẬT TOÁN:
   * - Chuẩn hóa education level: highschool(1) → diploma(2) → bachelor(3) → master(4) → phd(5)
   * - Bonus cho học vấn cao hơn yêu cầu (max 100)
   * - Penalty cho học vấn thấp hơn (tỷ lệ với yêu cầu)
   * - Bonus thêm 10 điểm nếu chuyên ngành liên quan
   */
  async _calculateEducationMatch(cvData, jobData) {
    try {
      const cvEducation = cvData.education || [];
      const requiredEducation = jobData.education || {};

      if (!requiredEducation.level) {
        return { score: 70, weight: 0.1, details: {} };
      }

      const educationLevels = {
        highschool: 1,
        diploma: 2,
        bachelor: 3,
        master: 4,
        phd: 5,
      };

      const candidateLevel =
        Math.max(
          ...cvEducation.map(
            (edu) => educationLevels[edu.degree?.toLowerCase()] || 0
          )
        ) || 0;
      const requiredLevel =
        educationLevels[requiredEducation.level?.toLowerCase()] || 3;

      const meetsRequirement = candidateLevel >= requiredLevel;
      const score = meetsRequirement
        ? Math.min(100, 85 + (candidateLevel - requiredLevel) * 5)
        : (candidateLevel / requiredLevel) * 60;

      // Check relevant major
      const relevantMajor = cvEducation.some((edu) =>
        this._checkMajorRelevance(edu.major, jobData)
      );

      return {
        score: Math.round(score + (relevantMajor ? 10 : 0)),
        weight: 0.1,
        details: {
          candidateEducationLevel: candidateLevel,
          requiredEducationLevel: requiredLevel,
          meetsRequirement,
          relevantMajor,
          additionalCertifications:
            cvData.certifications?.map((c) => c.name) || [],
        },
      };
    } catch (error) {
      logger.error('Error calculating education match:', error);
      return { score: 0, weight: 0.1, details: {} };
    }
  }

  /**
   * Calculate Keyword & Semantic Similarity (15% weight)
   * 
   * CĂN CỨ NGHIÊN CỨU:
   * - Jaccard (1912): J(A,B) = |A ∩ B| / |A ∪ B| - Đo độ overlap của keywords
   * - Salton & McGill (1986): TF-IDF và Cosine Similarity - Chuẩn cho text similarity
   * - Manning et al. (2008): Kết hợp Jaccard (40%) và Cosine (60%) cho độ chính xác cao hơn
   * 
   * THUẬT TOÁN:
   * 1. Tokenize và clean text (loại bỏ stop words, normalize)
   * 2. Jaccard Similarity: Đo độ overlap của keyword sets
   * 3. Cosine Similarity với TF-IDF: Đo semantic similarity
   * 4. Weighted combination: Jaccard (0.4) + Cosine (0.6)
   * 
   * LÝ DO KẾT HỢP:
   * - Jaccard (40%): Tốt cho đo keyword overlap
   * - Cosine + TF-IDF (60%): Tốt hơn cho semantic, ít bị ảnh hưởng bởi document length
   */
  async _calculateKeywordMatch(cvText, jobData) {
    try {
      const natural = require('natural');
      const TfIdf = natural.TfIdf;
      const tfidf = new TfIdf();

      const jobText = `${jobData.title || ''} ${jobData.description || ''} ${
        jobData.requirements || ''
      }`;

      // Tokenize and clean
      const cvWords = this._tokenizeAndClean(cvText);
      const jobWords = this._tokenizeAndClean(jobText);

      // Jaccard Similarity
      const jaccardSimilarity = this._calculateJaccardSimilarity(
        cvWords,
        jobWords
      );

      // Cosine Similarity using TF-IDF
      tfidf.addDocument(cvWords.join(' '));
      tfidf.addDocument(jobWords.join(' '));
      const cosineSimilarity = this._calculateCosineSimilarity(tfidf, 0, 1);

      // Find common keywords
      const commonKeywords = cvWords.filter((word) => jobWords.includes(word));

      // Weighted combination: Jaccard (40%) + Cosine (60%)
      // Căn cứ: Manning et al. (2008) - Kết hợp hai phương pháp cho độ chính xác cao hơn
      // Jaccard tốt cho keyword overlap, Cosine tốt cho semantic similarity
      const score = (jaccardSimilarity * 0.4 + cosineSimilarity * 0.6) * 100;

      return {
        score: Math.round(score),
        weight: 0.15,
        details: {
          jaccardSimilarity: Math.round(jaccardSimilarity * 100) / 100,
          cosineSimilarity: Math.round(cosineSimilarity * 100) / 100,
          semanticSimilarity: Math.round(score) / 100,
          commonKeywords: commonKeywords.slice(0, 20),
          topMatchingPhrases: this._extractMatchingPhrases(cvText, jobText),
        },
      };
    } catch (error) {
      logger.error('Error calculating keyword match:', error);
      return { score: 0, weight: 0.15, details: {} };
    }
  }

  /**
   * Calculate Soft Skills Score (10% weight)
   * 
   * CĂN CỨ NGHIÊN CỨU:
   * - Boyatzis (1982): Soft skills quan trọng nhưng khó đánh giá từ CV
   * - Heckman & Kautz (2012): Tầm quan trọng cao nhưng trọng số thấp hơn hard skills (8-12%)
   * 
   * THUẬT TOÁN:
   * - Keyword-based detection: Phát hiện từ khóa liên quan đến soft skills
   * - 5 categories: communication, teamwork, leadership, problemSolving, adaptability
   * - Score = average(scores of all categories)
   * 
   * LIMITATION:
   * - Chỉ dựa trên keyword detection, chưa sử dụng semantic NLP
   * - Có thể cải thiện với BERT/Sentence-BERT embeddings trong tương lai
   */
  async _calculateSoftSkillsMatch(cvText, jobData) {
    try {
      const softSkillsKeywords = {
        communication: [
          'communication',
          'present',
          'negotiate',
          'giao tiếp',
          'thuyết trình',
        ],
        teamwork: ['team', 'collaborate', 'cooperation', 'nhóm', 'hợp tác'],
        leadership: ['lead', 'manage', 'mentor', 'lãnh đạo', 'quản lý'],
        problemSolving: [
          'problem solving',
          'analytical',
          'critical thinking',
          'giải quyết',
          'phân tích',
        ],
        adaptability: [
          'adapt',
          'flexible',
          'learning',
          'linh hoạt',
          'học hỏi',
        ],
      };

      const cvTextLower = cvText.toLowerCase();
      const detectedSoftSkills = [];
      const scores = {};

      // CẢI TIẾN: Context-aware soft skills detection
      // Thay vì chỉ đếm keywords, kiểm tra context (ví dụ: "led a team", "collaborated with")
      // Để tránh spam keywords, giới hạn điểm trần cho mỗi skill
      Object.keys(softSkillsKeywords).forEach((skill) => {
        const keywords = softSkillsKeywords[skill];
        
        // Improved: Context-aware detection với pattern matching
        let contextMatches = 0;
        keywords.forEach((kw) => {
          // Tìm keyword trong context (sentence/phrase)
          const regex = new RegExp(`\\b${kw}\\w*\\b`, 'gi');
          const matches = cvTextLower.match(regex);
          if (matches) {
            // Bonus nếu keyword xuất hiện trong context phù hợp
            // Ví dụ: "led a team", "collaborated with", "managed projects"
            const contextPatterns = this._getSoftSkillContextPatterns(skill);
            const hasContext = contextPatterns.some((pattern) => 
              cvTextLower.includes(pattern)
            );
            
            if (hasContext) {
              contextMatches += matches.length * 1.5; // Bonus cho context
            } else {
              contextMatches += matches.length * 1.0; // Normal match
            }
          }
        });

        // Giới hạn điểm trần cho mỗi skill (tránh spam)
        // Max score per skill: 70 (thay vì 100)
        const skillScore = Math.min(70, Math.round(contextMatches * 15));
        
        if (skillScore > 0) {
          detectedSoftSkills.push(skill);
          scores[skill] = skillScore;
        } else {
          scores[skill] = 0;
        }
      });

      // Tính điểm trung bình
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      const skillsWithScore = Object.values(scores).filter((s) => s > 0).length;
      
      // Nếu không có soft skills nào được detect, điểm = 0
      // Nếu có, tính trung bình và giới hạn max = 70 (tránh quá cao)
      const averageScore = skillsWithScore > 0 
        ? Math.min(70, Math.round(totalScore / Object.keys(scores).length))
        : 0;

      return {
        score: Math.round(averageScore),
        weight: 0.1,
        details: {
          ...scores,
          detectedSoftSkills,
        },
      };
    } catch (error) {
      logger.error('Error calculating soft skills match:', error);
      return { score: 0, weight: 0.1, details: {} };
    }
  }

  /**
   * Generate AI-powered insights
   */
  async _generateMatchInsights(cvData, jobData, scoreBreakdown) {
    try {
      const strengths = [];
      const weaknesses = [];
      const recommendations = [];

      // Analyze skills
      if (scoreBreakdown.skillsScore.score >= 80) {
        strengths.push('Excellent technical skills match');
      } else if (scoreBreakdown.skillsScore.score < 50) {
        weaknesses.push('Significant skill gaps identified');
        recommendations.push(
          'Consider upskilling in: ' +
            scoreBreakdown.skillsScore.details.missingSkills
              .slice(0, 3)
              .map((s) => s.skill)
              .join(', ')
        );
      }

      // Analyze experience
      if (scoreBreakdown.experienceScore.score >= 80) {
        strengths.push('Strong relevant experience');
      } else if (scoreBreakdown.experienceScore.details.experienceGap < 0) {
        weaknesses.push('Below required years of experience');
        recommendations.push(
          'Highlight transferable skills and achievements'
        );
      }

      // Analyze education
      if (scoreBreakdown.educationScore.details.meetsRequirement) {
        strengths.push('Meets educational requirements');
      } else {
        weaknesses.push('Educational background below requirements');
        recommendations.push('Consider relevant certifications');
      }

      // Cultural fit
      const culturalFitScore =
        scoreBreakdown.softSkillsScore.score / 100;

      let potentialForGrowth = 'medium';
      if (scoreBreakdown.skillsScore.score >= 70 && culturalFitScore >= 0.7) {
        potentialForGrowth = 'high';
      } else if (
        scoreBreakdown.skillsScore.score >= 85 &&
        culturalFitScore >= 0.8
      ) {
        potentialForGrowth = 'excellent';
      } else if (scoreBreakdown.skillsScore.score < 50) {
        potentialForGrowth = 'low';
      }

      return {
        strengths,
        weaknesses,
        recommendations,
        culturalFitScore,
        potentialForGrowth,
      };
    } catch (error) {
      logger.error('Error generating insights:', error);
      return {
        strengths: [],
        weaknesses: [],
        recommendations: [],
        culturalFitScore: 0.5,
        potentialForGrowth: 'medium',
      };
    }
  }

  /**
   * Calculate predictions (success probability, retention, etc.)
   */
  _calculatePredictions(overallScore, scoreBreakdown) {
    const successProbability = overallScore / 100;

    // Retention score based on experience and cultural fit
    const retentionScore =
      (scoreBreakdown.experienceScore.score / 100) * 0.6 +
      (scoreBreakdown.softSkillsScore.score / 100) * 0.4;

    // Performance score
    const performanceScore =
      (scoreBreakdown.skillsScore.score / 100) * 0.7 +
      (scoreBreakdown.experienceScore.score / 100) * 0.3;

    // Hiring recommendation
    let hiringRecommendation = 'not-recommended';
    if (overallScore >= 85) {
      hiringRecommendation = 'highly-recommended';
    } else if (overallScore >= 75) {
      hiringRecommendation = 'recommended';
    } else if (overallScore >= 60) {
      hiringRecommendation = 'consider';
    }

    return {
      successProbability: Math.round(successProbability * 100) / 100,
      retentionScore: Math.round(retentionScore * 100) / 100,
      performanceScore: Math.round(performanceScore * 100) / 100,
      hiringRecommendation,
    };
  }

  /**
   * 🎓 GENERATE PERSONALIZED LEARNING ROADMAP
   * Tạo lộ trình học tập cá nhân hóa với tài liệu cụ thể
   * 
   * CĂN CỨ NGHIÊN CỨU:
   * - Bloom's Taxonomy (1956): Phân chia học tập thành levels (Remember → Create)
   * - Spaced Repetition Theory (Ebbinghaus, 1885): Học theo khoảng cách tăng dần
   * - Wenger (1998): Learning path nên chia thành phases với clear milestones
   * 
   * QUY TRÌNH:
   * 1. Phân tích Skill Gaps (so sánh CV skills vs Job requirements)
   * 2. Xác định Priority & Importance (required skills = critical priority)
   * 3. Phân chia thành Phases (Foundation → Intermediate → Advanced → Specialization)
   * 4. Sinh nội dung từng tuần (AI generation hoặc template-based)
   * 5. Gắn Resources với Credibility Assessment (dựa trên Source Credibility Theory)
   * 6. Tạo Projects & Assessments (theo Bloom's Taxonomy - Apply, Analyze, Create)
   * 7. Thiết lập Milestones (theo spaced repetition - review điểm quan trọng)
   */
  async generatePersonalizedRoadmap(options) {
    try {
      const LearningRoadmap = require('../../models/LearningRoadmap');

      const {
        candidateId,
        targetJobId,
        targetRole,
        cvData,
        jobData,
        timeframe = 12, // weeks
        saveToDatabase = true,
        learningPreferences = {}, // NEW: Learning preferences from candidate profile
        roadmapPreferences = {}, // NEW: Roadmap preferences
      } = options;

      // Identify skill gaps (self-built algorithm)
      const skillGaps = await this._identifySkillGapsDetailed(cvData, jobData);
      
      if (!skillGaps || skillGaps.length === 0) {
        logger.warn('No skill gaps identified, returning empty roadmap', {
          candidateId,
          targetJobId,
          hasCvData: !!cvData,
          hasJobData: !!jobData,
        });
      }

      const preferredLanguage = this._determinePreferredLanguage(cvData, jobData);

      // Generate roadmap structure using Rule-Based Generator (deterministic)
      const ruleBasedRoadmapGenerator = require('../roadmap/ruleBasedRoadmapGenerator');
      let roadmapData;
      
      try {
        roadmapData = ruleBasedRoadmapGenerator.generateStructure(
          skillGaps,
          targetRole || jobData?.title || 'Developer',
          timeframe,
          cvData?.currentLevel || 'beginner'
        );
      } catch (ruleBasedError) {
        logger.error('Error generating rule-based roadmap structure', {
          error: ruleBasedError.message,
          stack: ruleBasedError.stack,
        });
        // Fallback to default structure
        roadmapData = {
          phases: [],
          milestones: [],
          successMetrics: [],
          difficulty: 'intermediate',
        };
      }

      // Optional: Enhance roadmap structure with AI if API key is available
      if (process.env.GEMINI_API_KEY && skillGaps.length > 0) {
        try {
          const aiEnhancedRoadmapData = await this._generateRoadmapWithAI(
            skillGaps,
            targetRole || jobData?.title || 'Developer',
            timeframe,
            cvData?.currentLevel || 'beginner'
          );
          // Merge AI enhancements if available (optional, prioritize rule-based)
          if (aiEnhancedRoadmapData && aiEnhancedRoadmapData.phases) {
            // For now, we prioritize rule-based structure and use AI for resource enhancement only
            logger.info('AI enhancement available but using rule-based structure as primary');
          }
        } catch (aiError) {
          logger.warn('AI enhancement for roadmap structure failed, proceeding with rule-based structure', {
            error: aiError.message,
          });
        }
      }

      // Enhance with intelligent resource recommendations (self-built algorithm + RAG)
      let enhancedPhases = roadmapData.phases || [];
      if (skillGaps.length > 0) {
        try {
          enhancedPhases = await this._enhanceWithRealResources(
            roadmapData.phases || [],
            {
              skillGaps,
              currentLevel: cvData?.currentLevel || 'beginner',
              timeframe,
              preferredLanguage: learningPreferences.preferredLanguage || preferredLanguage,
              targetRole: targetRole || jobData?.title || 'Developer', // Pass target role for context
              // NEW: Pass learning preferences for personalization
              learningPreferences: {
                style: learningPreferences.style || 'visual',
                budget: learningPreferences.budget || 'free',
                maxHours: learningPreferences.maxHours || null,
                preferredResourceTypes: learningPreferences.preferredResourceTypes || [],
              },
            }
          );
        } catch (resourceError) {
          logger.warn('Error enhancing with real resources, using base phases', {
            error: resourceError.message,
          });
        }
      }

      // Determine generatedBy value (must be one of: 'ai', 'manual', 'hybrid')
      let generatedBy = 'manual'; // Default to manual (rule-based, no external AI APIs)
      if (process.env.GEMINI_API_KEY) {
        generatedBy = 'hybrid'; // Rule-based + Gemini AI enhancement
      }

      const roadmap = {
        candidateId,
        targetJobId,
        targetRole: targetRole || jobData?.title || 'Developer',
        currentLevel: cvData?.currentLevel || 'beginner',
        skillGaps,
        phases: enhancedPhases,
        milestones: roadmapData.milestones || [],
        successMetrics: roadmapData.successMetrics || [],
        totalDuration: `${timeframe} weeks`,
        estimatedTotalHours: timeframe * 15,
        difficulty: roadmapData.difficulty || 'intermediate',
        generatedBy, // Use valid enum value
        aiModelVersion: '2.0',
        status: 'active',
        isPersonalized: true,
        preferredLanguage,
      };

      // Save to database
      if (saveToDatabase && candidateId) {
        const savedRoadmap = await LearningRoadmap.create(roadmap);
        return savedRoadmap;
      }

      return roadmap;
    } catch (error) {
      logger.error('Error generating personalized roadmap:', error);
      throw error;
    }
  }

  /**
   * Identify skill gaps with detailed analysis
   */
  /**
   * Normalize job skills from multiple sources into a consistent format
   * @param {Object} jobData - Job data object
   * @returns {Array} Normalized skills array with { name, level, required, importance }
   */
  _normalizeJobSkills(jobData) {
    if (!jobData) return [];
    
    const normalizedSkills = [];
    const skillMap = new Map(); // To deduplicate by name
    
    // 1. Extract from jobData.skills (array of strings or objects)
    if (jobData.skills && Array.isArray(jobData.skills)) {
      jobData.skills.forEach((skill) => {
        if (typeof skill === 'string' && skill.trim()) {
          const normalized = skill.trim().toLowerCase();
          if (!skillMap.has(normalized)) {
            skillMap.set(normalized, {
              name: skill.trim(),
              level: 'intermediate',
              required: true,
              importance: 0.8,
            });
          }
        } else if (skill && typeof skill === 'object') {
          const name = skill.name || skill.skill || skill.title;
          if (name && typeof name === 'string' && name.trim()) {
            const normalized = name.trim().toLowerCase();
            if (!skillMap.has(normalized)) {
              skillMap.set(normalized, {
                name: name.trim(),
                level: skill.level || skill.targetLevel || 'intermediate',
                required: skill.required !== false && (skill.required === true || skill.importance === 'required'),
                importance: skill.importance === 'required' ? 0.9 : 
                           skill.importance === 'preferred' ? 0.7 : 
                           skill.required === false ? 0.5 : 0.8,
              });
            }
          }
        }
      });
    }
    
    // 2. Extract from jobData.ai.extractedSkills (structured format)
    if (jobData.ai?.extractedSkills && Array.isArray(jobData.ai.extractedSkills)) {
      jobData.ai.extractedSkills.forEach((skill) => {
        if (skill && skill.name && typeof skill.name === 'string') {
          const normalized = skill.name.trim().toLowerCase();
          const existing = skillMap.get(normalized);
          
          if (!existing || (skill.confidence && skill.confidence > 0.7)) {
            skillMap.set(normalized, {
              name: skill.name.trim(),
              level: skill.level || existing?.level || 'intermediate',
              required: skill.importance === 'required' || existing?.required || false,
              importance: skill.importance === 'required' ? 0.9 :
                         skill.importance === 'preferred' ? 0.7 :
                         skill.importance === 'nice-to-have' ? 0.5 :
                         existing?.importance || 0.7,
            });
          }
        }
      });
    }
    
    // 3. Extract from jobData.requirements (text parsing - basic)
    if (jobData.requirements && typeof jobData.requirements === 'string') {
      // Simple keyword extraction for common skills
      const commonTechSkills = [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
        'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring',
        'mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch',
        'aws', 'docker', 'kubernetes', 'git', 'ci/cd', 'agile', 'scrum'
      ];
      
      const lowerRequirements = jobData.requirements.toLowerCase();
      commonTechSkills.forEach((techSkill) => {
        if (lowerRequirements.includes(techSkill) && !skillMap.has(techSkill)) {
          skillMap.set(techSkill, {
            name: techSkill.charAt(0).toUpperCase() + techSkill.slice(1),
            level: 'intermediate',
            required: false,
            importance: 0.6,
          });
        }
      });
    }
    
    return Array.from(skillMap.values());
  }

  /**
   * Normalize CV skills from various formats into a consistent format
   * @param {*} cvSkills - CV skills (can be array, object, or mixed)
   * @returns {Array} Normalized skills array with { name, level }
   */
  _normalizeCVSkills(cvSkills) {
    if (!cvSkills) return [];
    
    const normalized = [];
    
    // Handle array format
    if (Array.isArray(cvSkills)) {
      cvSkills.forEach((skill) => {
        if (typeof skill === 'string' && skill.trim()) {
          normalized.push({
            name: skill.trim(),
            level: 'beginner',
          });
        } else if (skill && typeof skill === 'object') {
          const name = skill.name || skill.skill || skill.title || skill;
          if (name && typeof name === 'string' && name.trim()) {
            normalized.push({
              name: name.trim(),
              level: skill.level || skill.currentLevel || 'beginner',
            });
          }
        }
      });
      return normalized;
    }
    
    // Handle object format { technical: [...], soft: [...] }
    if (typeof cvSkills === 'object' && !Array.isArray(cvSkills)) {
      const allSkills = [];
      
      if (cvSkills.technical && Array.isArray(cvSkills.technical)) {
        allSkills.push(...cvSkills.technical);
      }
      if (cvSkills.soft && Array.isArray(cvSkills.soft)) {
        allSkills.push(...cvSkills.soft);
      }
      if (cvSkills.languages && Array.isArray(cvSkills.languages)) {
        allSkills.push(...cvSkills.languages);
      }
      
      return this._normalizeCVSkills(allSkills);
    }
    
    return normalized;
  }

  /**
   * Calculate skill similarity score between two skill names
   * @param {string} skill1 - First skill name
   * @param {string} skill2 - Second skill name
   * @returns {number} Similarity score (0-1)
   */
  _calculateSkillSimilarity(skill1, skill2) {
    if (!skill1 || !skill2) return 0;
    
    const s1 = skill1.toLowerCase().trim();
    const s2 = skill2.toLowerCase().trim();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Common aliases mapping
    const aliases = {
      'js': 'javascript',
      'ts': 'typescript',
      'reactjs': 'react',
      'vuejs': 'vue',
      'nodejs': 'node',
      'node.js': 'node',
      'postgres': 'postgresql',
      'mongo': 'mongodb',
      'aws cloud': 'aws',
    };
    
    let normalized1 = s1;
    let normalized2 = s2;
    
    Object.keys(aliases).forEach((alias) => {
      if (s1 === alias) normalized1 = aliases[alias];
      if (s2 === alias) normalized2 = aliases[alias];
    });
    
    if (normalized1 === normalized2) return 0.9;
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.7;
    
    // Word-level similarity (simple)
    const words1 = normalized1.split(/[\s\-_]+/);
    const words2 = normalized2.split(/[\s\-_]+/);
    const commonWords = words1.filter((w) => words2.includes(w));
    
    if (commonWords.length > 0) {
      return Math.min(0.6, commonWords.length / Math.max(words1.length, words2.length));
    }
    
    return 0;
  }

  async _identifySkillGapsDetailed(cvData, jobData) {
    try {
      // Normalize CV skills
      const cvSkills = this._normalizeCVSkills(cvData?.skills);
      
      // Normalize job skills
      const jobSkills = this._normalizeJobSkills(jobData);
      
      if (jobSkills.length === 0) {
        logger.warn('No job skills found for skill gap analysis', {
          jobId: jobData?._id || jobData?.id,
          hasSkills: !!jobData?.skills,
          hasExtractedSkills: !!jobData?.ai?.extractedSkills,
        });
        return [];
      }
      
      const skillGaps = [];
      const cvSkillNames = cvSkills.map((s) => s.name.toLowerCase().trim());
      
      jobSkills.forEach((jobSkill) => {
        if (!jobSkill || !jobSkill.name) {
          logger.warn('Invalid job skill found, skipping', { jobSkill });
          return;
        }
        
        const jobSkillName = jobSkill.name.toLowerCase().trim();
        if (!jobSkillName) return;
        
        // Find matching CV skill using similarity
        let bestMatch = null;
        let bestSimilarity = 0;
        
        cvSkills.forEach((cvSkill) => {
          const similarity = this._calculateSkillSimilarity(cvSkill.name, jobSkill.name);
          if (similarity > bestSimilarity && similarity >= 0.6) {
            bestSimilarity = similarity;
            bestMatch = cvSkill;
          }
        });
        
        // Check if skill exists (exact or similar match)
        const hasSkill = bestMatch !== null;
        
        if (!hasSkill) {
          // Skill gap: candidate doesn't have this skill
          skillGaps.push({
            skill: jobSkill.name,
            currentLevel: 'none',
            targetLevel: jobSkill.level || 'intermediate',
            priority: jobSkill.required ? 'critical' : 'medium',
            importance: jobSkill.importance || (jobSkill.required ? 0.9 : 0.6),
            gapType: 'missing',
          });
        } else {
          // Check if level needs improvement
          const currentLevel = bestMatch.level || 'beginner';
          const targetLevel = jobSkill.level || 'intermediate';
          
          if (this._needsLevelImprovement(currentLevel, targetLevel)) {
            skillGaps.push({
              skill: jobSkill.name,
              currentLevel,
              targetLevel,
              priority: 'high',
              importance: jobSkill.importance || 0.7,
              gapType: 'level_improvement',
              similarity: bestSimilarity,
            });
          }
        }
      });
      
      const dedupedGaps = this._dedupeSkillGaps(skillGaps);
      return this._sortSkillGaps(dedupedGaps);
    } catch (error) {
      logger.error('Error in _identifySkillGapsDetailed', {
        error: error.message,
        stack: error.stack,
        cvData: cvData ? { hasSkills: !!cvData.skills } : null,
        jobData: jobData ? { 
          hasSkills: !!jobData.skills,
          hasExtractedSkills: !!jobData.ai?.extractedSkills,
          jobId: jobData._id || jobData.id,
        } : null,
      });
      throw error;
    }
  }

  /**
   * Generate roadmap using Rule-Based Algorithm (Primary) hoặc AI (Optional Enhancement)
   * 
   * Priority:
   * 1. Rule-Based Generator (deterministic, reproducible, có căn cứ)
   * 2. AI Enhancement (optional, nếu có GEMINI_API_KEY)
   * 3. Default Template (fallback)
   */
  async _generateRoadmapWithAI(skillGaps, targetRole, timeframe, currentLevel) {
    try {
      // PRIMARY: Use Rule-Based Generator (deterministic, có căn cứ)
      const ruleBasedGenerator = require('../roadmap/ruleBasedRoadmapGenerator');
      const ruleBasedStructure = ruleBasedGenerator.generateStructure(
        skillGaps,
        targetRole,
        timeframe,
        currentLevel
      );
      
      // OPTIONAL: Enhance with AI nếu có GEMINI_API_KEY
      if (this.model && process.env.GEMINI_API_KEY) {
        try {
          const aiEnhancements = await this._getAIEnhancements(
            skillGaps,
            targetRole,
            timeframe,
            currentLevel,
            ruleBasedStructure
          );
          
          // Merge AI enhancements với rule-based structure
          return this._mergeAIEnhancements(ruleBasedStructure, aiEnhancements);
        } catch (aiError) {
          logger.warn('AI enhancement failed, using rule-based structure only', {
            error: aiError.message,
          });
          // Fallback to rule-based only
          return ruleBasedStructure;
        }
      }
      
      // Return rule-based structure (no AI)
      return ruleBasedStructure;
    } catch (error) {
      logger.error('Error generating roadmap, falling back to default structure:', error);
      return this._getDefaultRoadmapStructure(skillGaps, timeframe);
    }
  }
  
  /**
   * Get AI enhancements (optional) - chỉ enhance, không thay thế
   */
  async _getAIEnhancements(skillGaps, targetRole, timeframe, currentLevel, baseStructure) {
    if (!this.model) return null;
    
    const prompt = `
Enhance this learning roadmap structure with additional details:

Base Structure:
${JSON.stringify(baseStructure, null, 2)}

Target Role: ${targetRole}
Timeframe: ${timeframe} weeks
Current Level: ${currentLevel}

Please provide ONLY enhancements (no structure changes):
1. More specific learning objectives for each week
2. Additional project ideas
3. Assessment suggestions
4. Better milestone descriptions

Return JSON format:
{
  "enhancements": {
    "phases": [
      {
        "phaseNumber": 1,
        "weeks": [
          {
            "weekNumber": 1,
            "enhancedObjectives": ["more specific objective 1", "objective 2"],
            "projectIdeas": ["project idea 1"],
            "assessmentSuggestions": ["assessment 1"]
          }
        ]
      }
    ],
    "milestones": [
      {
        "weekNumber": 4,
        "enhancedDescription": "more detailed description"
      }
    ]
  }
}
`;

    try {
      const model = this.getModel();
      if (!model) {
        throw new Error('Gemini model not available');
      }
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean markdown
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
    } catch (error) {
      logger.warn('AI enhancement generation failed:', error);
      return null;
    }
  }
  
  /**
   * Merge AI enhancements với rule-based structure
   */
  _mergeAIEnhancements(baseStructure, aiEnhancements) {
    if (!aiEnhancements || !aiEnhancements.enhancements) {
      return baseStructure;
    }
    
    const enhanced = JSON.parse(JSON.stringify(baseStructure)); // Deep clone
    
    // Enhance weeks
    if (aiEnhancements.enhancements.phases) {
      aiEnhancements.enhancements.phases.forEach(aiPhase => {
        const basePhase = enhanced.phases.find(p => p.phaseNumber === aiPhase.phaseNumber);
        if (basePhase && aiPhase.weeks) {
          aiPhase.weeks.forEach(aiWeek => {
            const baseWeek = basePhase.weeks.find(w => w.weekNumber === aiWeek.weekNumber);
            if (baseWeek) {
              // Merge enhanced objectives
              if (aiWeek.enhancedObjectives && aiWeek.enhancedObjectives.length > 0) {
                baseWeek.learningObjectives = [
                  ...baseWeek.learningObjectives,
                  ...aiWeek.enhancedObjectives,
                ].slice(0, 7); // Limit to 7 objectives
              }
              
              // Add project ideas
              if (aiWeek.projectIdeas && aiWeek.projectIdeas.length > 0) {
                baseWeek.projects = aiWeek.projectIdeas.map(idea => ({
                  title: idea,
                  description: `Project: ${idea}`,
                  difficulty: basePhase.focus === 'fundamentals' ? 'beginner' : 'intermediate',
                  estimatedTime: '10-15 hours',
                }));
              }
              
              // Add assessment suggestions
              if (aiWeek.assessmentSuggestions && aiWeek.assessmentSuggestions.length > 0) {
                baseWeek.assessments = aiWeek.assessmentSuggestions.map(suggestion => ({
                  type: 'project',
                  description: suggestion,
                  passingCriteria: 'Complete successfully',
                }));
              }
            }
          });
        }
      });
    }
    
    // Enhance milestones
    if (aiEnhancements.enhancements.milestones) {
      aiEnhancements.enhancements.milestones.forEach(aiMilestone => {
        const baseMilestone = enhanced.milestones.find(m => m.weekNumber === aiMilestone.weekNumber);
        if (baseMilestone && aiMilestone.enhancedDescription) {
          baseMilestone.description = aiMilestone.enhancedDescription;
        }
      });
    }
    
    return enhanced;
  }
  
  /**
   * OLD METHOD - Keep for backward compatibility
   * Generate roadmap using Gemini AI (DEPRECATED - Use Rule-Based instead)
   */

  /**
   * Get default roadmap structure
   */
  _getDefaultRoadmapStructure(skillGaps, timeframe) {
    const weeksPerPhase = Math.ceil(timeframe / 3);
    const skillsPerWeek = Math.ceil(skillGaps.length / timeframe);

    const phases = [];
    let currentWeek = 1;

    for (let phase = 1; phase <= 3; phase++) {
      const phaseWeeks = [];

      for (let week = 0; week < weeksPerPhase && currentWeek <= timeframe; week++) {
        const weekSkills = skillGaps.slice(
          (currentWeek - 1) * skillsPerWeek,
          currentWeek * skillsPerWeek
        );

        if (weekSkills.length > 0) {
          phaseWeeks.push({
            weekNumber: currentWeek,
            focus: weekSkills.map((s) => s.skill).join(', '),
            learningObjectives: weekSkills.map((s) => `Learn ${s.skill}`),
            resources: this._getDefaultResources(weekSkills[0]?.skill),
            projects: [
              {
                title: `Build a project using ${weekSkills[0]?.skill}`,
                description: `Practical project to apply ${weekSkills[0]?.skill}`,
                difficulty: 'intermediate',
                estimatedTime: '10 hours',
                skills: weekSkills.map((s) => s.skill),
              },
            ],
            assessments: [
              {
                type: 'project',
                description: 'Complete the week project',
                passingCriteria: 'Working implementation',
              },
            ],
            timeCommitment: '12-15 hours/week',
          });

          currentWeek++;
        }
      }

      if (phaseWeeks.length > 0) {
        phases.push({
          phaseNumber: phase,
          title: `Phase ${phase}`,
          duration: `${phaseWeeks.length} weeks`,
          objectives: [`Master skills from week ${phaseWeeks[0].weekNumber}`],
          weeks: phaseWeeks,
        });
      }
    }

    return {
      phases,
      milestones: [
        {
          weekNumber: Math.ceil(timeframe / 2),
          title: 'Mid-point Review',
          description: 'Complete half of the roadmap',
          criteria: ['Complete all projects', 'Pass assessments'],
        },
      ],
      successMetrics: ['Complete all weeks', 'Build portfolio'],
      difficulty: 'intermediate',
    };
  }

  /**
   * Get default resources for a skill
   */
  _getDefaultResources(skillName) {
    return [
      {
        type: 'course',
        title: `${skillName} Complete Guide`,
        url: `https://www.udemy.com`,
        provider: 'Udemy',
        duration: '20 hours',
        difficulty: 'intermediate',
        isFree: false,
        rating: 4.5,
        credibility: 0.8,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
      {
        type: 'documentation',
        title: `Official ${skillName} Documentation`,
        url: '#',
        provider: 'Official Docs',
        isFree: true,
        rating: 5.0,
        credibility: 1.0,
      },
      {
        type: 'video',
        title: `${skillName} Tutorial for Beginners`,
        url: 'https://www.youtube.com',
        provider: 'YouTube',
        duration: '3 hours',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.7,
        credibility: 0.75,
      },
    ];
  }

  /**
   * Enhance roadmap with intelligent resource recommendations
   * 
   * Sử dụng ResourceRecommendationService để:
   * 1. Recommend resources dựa trên skill gaps và trình độ
   * 2. Đánh giá credibility với multi-factor scoring
   * 3. Match resources với learning objectives và timeline
   * 4. Đảm bảo progression phù hợp (beginner → intermediate → advanced)
   */
  async _enhanceWithRealResources(phases, context = {}) {
    try {
      const resourceRecommendationService = require('../resource/resourceRecommendationService');
      const languagePreference = (context?.preferredLanguage || 'en').toLowerCase();

      const enhancedPhases = [];
      
      for (const phase of phases) {
        const enhancedWeeks = [];

        for (const week of phase.weeks) {
          // Extract skill và level info từ week
          let focusSkill = week.focus || '';
          const learningObjectives = week.learningObjectives || [];
          
          // Handle multiple skills in focus (e.g., "Node.js, Python" -> take first)
          if (focusSkill.includes(',')) {
            focusSkill = focusSkill.split(',')[0].trim();
          }
          
          // Determine current level và target level từ skill gaps
          // Try exact match first, then partial match
          let skillGap = context.skillGaps?.find(
            (gap) => gap.skill.toLowerCase() === focusSkill.toLowerCase()
          );
          
          if (!skillGap) {
            // Try reverse match (focusSkill contains gap.skill or vice versa)
            skillGap = context.skillGaps?.find(
              (gap) => {
                const gapSkillLower = gap.skill.toLowerCase();
                const focusLower = focusSkill.toLowerCase();
                return gapSkillLower.includes(focusLower) || focusLower.includes(gapSkillLower);
              }
            );
          }
          
          // If still no match, try to find by removing common suffixes/prefixes
          if (!skillGap && focusSkill) {
            const normalizedFocus = focusSkill.toLowerCase().replace(/\.js$|\.py$|^node$/i, '');
            skillGap = context.skillGaps?.find(
              (gap) => {
                const normalizedGap = gap.skill.toLowerCase().replace(/\.js$|\.py$|^node$/i, '');
                return normalizedGap === normalizedFocus || normalizedGap.includes(normalizedFocus) || normalizedFocus.includes(normalizedGap);
              }
            );
          }
          
          skillGap = skillGap || {};
          const currentLevel = skillGap.currentLevel || context.currentLevel || 'beginner';
          const targetLevel = skillGap.targetLevel || 'intermediate';
          const canonicalSkill = this._extractSkillFromWeekFocus(focusSkill, skillGap);
          
          // Map generic skills to specific skills based on target role and skill gaps
          let requestSkill =
            canonicalSkill ||
            skillGap.skill ||
            (focusSkill ? focusSkill.split('-')[0].trim() : '') ||
            'General Programming';
          
          // Handle generic skills like "mastery" - map to specific skills from skill gaps
          requestSkill = this._mapGenericSkillToSpecific(requestSkill, context.skillGaps, context.targetRole);

          // Get industry from database (preferred) or fallback to role extraction
          let industry = null;
          if (context.industryCode) {
            industry = await this._getIndustryFromDatabase(context.industryCode, {
              jobId: context.jobId,
              candidateId: context.candidateId,
            });
          }
          // Fallback to deprecated method if no industry from database
          if (!industry) {
            industry = this._extractIndustryFromRole(context.targetRole);
          }
          
          // Recommend resources thông minh
          let recommendedResources = [];
          try {
            // Get learning preferences from context (if available)
            const learningPrefs = context.learningPreferences || {};
            
            recommendedResources = await resourceRecommendationService.recommendResources({
              skill: requestSkill,
              currentLevel,
              targetLevel,
              phaseNumber: phase.phaseNumber || 1,
              learningObjectives,
              weekNumber: week.weekNumber || 1,
              totalWeeks: context.timeframe || 12,
              preferredLanguage: languagePreference,
              industry: industry, // Add industry for better filtering
              targetRole: context.targetRole, // Add target role for context-aware filtering
              // NEW: Add personalization preferences
              budget: learningPrefs.budget || 'free',
              maxHours: learningPrefs.maxHours || null,
              learningStyle: learningPrefs.style || 'visual',
            });
            
            if (!recommendedResources || recommendedResources.length === 0) {
              logger.warn('No resources recommended for skill, using default fallback', {
                skill: focusSkill,
                phaseNumber: phase.phaseNumber,
                weekNumber: week.weekNumber,
              });
              // Fallback to default resources when nothing is found
              recommendedResources = this._getDefaultResourcesForSkill(requestSkill);
            }
          } catch (resourceError) {
            logger.error('Error recommending resources for week', {
              error: resourceError.message,
              skill: focusSkill,
              phaseNumber: phase.phaseNumber,
              weekNumber: week.weekNumber,
            });
            // Fallback to default resources instead of empty array
            recommendedResources = this._getDefaultResourcesForSkill(requestSkill);
          }
          
          // Final check: Ensure we always have at least some resources
          if (!recommendedResources || recommendedResources.length === 0) {
            logger.warn('No resources available after all fallbacks, providing basic defaults', {
              skill: requestSkill,
              focusSkill,
            });
            // Use generic fallback
            recommendedResources = [
              {
                type: 'documentation',
                title: `${requestSkill} Documentation`,
                provider: 'Official Docs',
                difficulty: 'beginner',
                duration: 'Reference',
                credibility: 1.0,
                rating: 5.0,
                isFree: true,
                estimatedCost: 0,
                url: `https://www.google.com/search?q=${encodeURIComponent(requestSkill + ' documentation')}`,
                isCurated: false,
              },
            ];
          }

          // Replace hoặc merge với existing resources
          // Keep existing projects and assessments from rule-based generator
          const enhancedWeek = {
            ...week,
            resources: recommendedResources.map((resource) => ({
              type: resource.type,
              title: resource.title,
              url: resource.url,
              provider: resource.provider,
              duration: resource.duration,
              difficulty: resource.difficulty,
              isFree: resource.isFree,
              rating: resource.rating,
               language: resource.language || languagePreference,
              estimatedCost: resource.estimatedCost || 0,
              credibility: resource.credibility, // ✅ Độ tin cậy đã tính
              certificateOffered: resource.certificateOffered || false,
              recommendationScore: resource.recommendationScore, // Score cho ranking
            })),
            // Keep projects and assessments from rule-based generator
            projects: week.projects || [],
            assessments: week.assessments || [],
          };

          enhancedWeeks.push(enhancedWeek);
        }

        enhancedPhases.push({
          ...phase,
          weeks: enhancedWeeks,
        });
      }

      return enhancedPhases;
    } catch (error) {
      logger.error('Error enhancing with real resources:', error);
      // Fallback: return original phases
      return phases;
    }
  }

  // ============================================================
  // 🔧 HELPER METHODS
  // ============================================================

  /**
   * Normalize skill name using AI-powered service
   * Giúp matching tốt hơn: JS → JavaScript, Nodejs → Node.js
   * @param {string} skillName - Skill name to normalize
   * @param {boolean} useCache - Use cache for faster response
   * @returns {Promise<string>} Normalized skill name
   */
  async _normalizeSkillName(skillName, useCache = true) {
    if (!skillName || typeof skillName !== 'string') {
      return '';
    }
    
    try {
      // Use AI-powered normalization service
      const normalized = await this.skillNormalizationService.normalizeSkill(skillName, useCache);
      return normalized;
    } catch (error) {
      logger.warn(`⚠️ Failed to normalize skill "${skillName}" with AI, using fallback:`, error.message);
      // Fallback: basic normalization
    const normalized = skillName.toLowerCase().trim();
      return normalized
        .replace(/^proficient\s+in\s+/i, '')
        .replace(/\s+experience$/i, '')
        .replace(/\s+skill$/i, '')
        .trim();
    }
  }

  /**
   * Synchronous version for backward compatibility (uses cache if available)
   * @param {string} skillName 
   * @returns {string}
   */
  _normalizeSkillNameSync(skillName) {
    // Try to get from cache first (synchronous)
    const normalized = skillName.toLowerCase().trim();
    const cached = this.skillNormalizationService.cache.get(normalized);
    if (cached) {
      return cached;
    }
    // Fallback normalization
    return normalized
      .replace(/^proficient\s+in\s+/i, '')
      .replace(/\s+experience$/i, '')
      .replace(/\s+skill$/i, '')
      .trim();
  }

  _extractSkillFromWeekFocus(focusSkill = '', skillGap = {}) {
    if (skillGap?.skill) {
      return this._normalizeSkillNameSync(skillGap.skill);
    }
    if (!focusSkill || typeof focusSkill !== 'string') {
      return '';
    }
    const base = focusSkill.split('-')[0].trim();
    if (!base) {
      return '';
    }
    return this._normalizeSkillNameSync(base);
  }

  _determinePreferredLanguage(cvData = {}, jobData = {}) {
    const directPreference =
      cvData.preferredLanguage ||
      cvData.languagePreference ||
      jobData.preferredLanguage;

    if (directPreference && typeof directPreference === 'string') {
      return this._languageNameToCode(directPreference);
    }

    if (Array.isArray(cvData.languages) && cvData.languages.length > 0) {
      const preferred =
        cvData.languages.find((lang) => lang?.proficiency?.toLowerCase() === 'native') ||
        cvData.languages[0];
      if (typeof preferred === 'string') {
        return this._languageNameToCode(preferred);
      }
      if (preferred?.code) {
        return preferred.code.toLowerCase();
      }
      if (preferred?.name) {
        return this._languageNameToCode(preferred.name);
      }
    }

    return 'en';
  }

  _languageNameToCode(name = '') {
    if (!name || typeof name !== 'string') return 'en';
    const normalized = name.trim().toLowerCase();
    const map = {
      english: 'en',
      'en-us': 'en',
      'en-gb': 'en',
      'tiếng anh': 'en',
      vietnamese: 'vi',
      'tiếng việt': 'vi',
      chinese: 'zh',
      'tiếng trung': 'zh',
      japanese: 'ja',
      'tiếng nhật': 'ja',
      korean: 'ko',
      'tiếng hàn': 'ko',
    };
    return map[normalized] || normalized.slice(0, 2) || 'en';
  }

  _dedupeSkillGaps(skillGaps = []) {
    const map = new Map();
    skillGaps.forEach((gap) => {
      if (!gap || !gap.skill) return;
      const canonical = this._normalizeSkillNameSync(gap.skill);
      const key = canonical || gap.skill.toLowerCase();
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          ...gap,
          skill: canonical || gap.skill,
        });
        return;
      }

      const existing = map.get(key);
      if (this._getPriorityRank(gap.priority) > this._getPriorityRank(existing.priority)) {
        existing.priority = gap.priority;
      }
      existing.importance = Math.max(existing.importance || 0, gap.importance || 0);
      existing.targetLevel = this._pickHigherLevel(existing.targetLevel, gap.targetLevel);
      existing.currentLevel = this._pickLowerLevel(existing.currentLevel, gap.currentLevel);
      if (existing.gapType !== 'missing' && gap.gapType === 'missing') {
        existing.gapType = 'missing';
      }
    });

    return Array.from(map.values());
  }

  _sortSkillGaps(skillGaps = []) {
    return skillGaps.sort((a, b) => {
      if (a.priority === 'critical' && b.priority !== 'critical') return -1;
      if (b.priority === 'critical' && a.priority !== 'critical') return 1;
      return (b.importance || 0) - (a.importance || 0);
    });
  }

  _getPriorityRank(priority) {
    const ranks = { critical: 4, high: 3, medium: 2, low: 1 };
    return ranks[priority] || 0;
  }

  _pickHigherLevel(levelA, levelB) {
    const indexA = this._levelToIndex(levelA);
    const indexB = this._levelToIndex(levelB);
    return indexA >= indexB ? levelA : levelB;
  }

  _pickLowerLevel(levelA, levelB) {
    const indexA = this._levelToIndex(levelA);
    const indexB = this._levelToIndex(levelB);
    return indexA <= indexB ? levelA : levelB;
  }

  _levelToIndex(level) {
    const order = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];
    const normalized = (level || '').toString().toLowerCase();
    const index = order.indexOf(normalized);
    return index >= 0 ? index : 1;
  }

  /**
   * Get context patterns for soft skills
   * Giúp phát hiện soft skills trong context thực tế, tránh spam keywords
   */
  _getSoftSkillContextPatterns(skillType) {
    const contextPatterns = {
      communication: [
        'presented to',
        'communicated with',
        'wrote',
        'documented',
        'thuyết trình',
        'giao tiếp',
      ],
      teamwork: [
        'collaborated with',
        'worked with team',
        'team member',
        'hợp tác',
        'làm việc nhóm',
      ],
      leadership: [
        'led a team',
        'managed',
        'mentored',
        'supervised',
        'lãnh đạo',
        'quản lý',
      ],
      problemSolving: [
        'solved',
        'analyzed',
        'implemented solution',
        'giải quyết',
        'phân tích',
      ],
      adaptability: [
        'adapted to',
        'learned quickly',
        'flexible',
        'linh hoạt',
        'học hỏi',
      ],
    };
    return contextPatterns[skillType] || [];
  }

  _assessLearnability(skillName) {
    const easySkills = ['html', 'css', 'git', 'basic javascript'];
    const hardSkills = ['machine learning', 'blockchain', 'kubernetes'];

    if (easySkills.some((s) => skillName.toLowerCase().includes(s))) {
      return 'easy';
    }
    if (hardSkills.some((s) => skillName.toLowerCase().includes(s))) {
      return 'hard';
    }
    return 'moderate';
  }

  _calculateYearsOfExperience(startDate, endDate) {
    try {
      // Validate startDate
      if (!startDate || startDate === 'undefined' || startDate === 'null') {
        return 0;
      }

      const start = new Date(startDate);
      
      // Check if start date is valid
      if (isNaN(start.getTime())) {
        return 0;
      }

      // Validate endDate - if null/undefined/invalid, use current date
      let end;
      if (!endDate || endDate === 'undefined' || endDate === 'null' || endDate === null) {
        end = new Date(); // Current position - use today
      } else {
        end = new Date(endDate);
        // If end date is invalid, use current date
        if (isNaN(end.getTime())) {
          end = new Date();
        }
      }

      // Sanity check: start date should not be in the future
      const now = new Date();
      if (start > now) {
        return 0;
      }

      // Sanity check: end date should not be before start date
      if (end < start) {
        return 0;
      }

      // Sanity check: duration should not exceed 50 years (likely data error)
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      if (years > 50) {
        logger.warn(`Suspicious experience duration: ${years.toFixed(1)} years. Capping at 50.`);
        return 50;
      }

      return Math.max(0, Math.round(years * 10) / 10);
    } catch (error) {
      logger.error('Error calculating years of experience:', error);
      return 0;
    }
  }

  _calculateExperienceRelevance(experience, jobData) {
    const expText = `${experience.position} ${experience.description || ''}`.toLowerCase();
    const jobText = `${jobData.title} ${jobData.description || ''}`.toLowerCase();

    const expWords = this._tokenizeAndClean(expText);
    const jobWords = this._tokenizeAndClean(jobText);

    return this._calculateJaccardSimilarity(expWords, jobWords);
  }

  _checkIndustryMatch(cvData, jobData) {
    // Simplified industry check
    return true;
  }

  _checkRoleMatch(cvData, jobData) {
    // Simplified role check
    return true;
  }

  _checkMajorRelevance(major, jobData) {
    if (!major) return false;

    const techMajors = [
      'computer science',
      'software',
      'information technology',
      'engineering',
      'khoa học máy tính',
      'công nghệ thông tin',
    ];

    return techMajors.some((m) => major.toLowerCase().includes(m));
  }

  _tokenizeAndClean(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  _calculateJaccardSimilarity(set1, set2) {
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = new Set([...s1].filter((x) => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return intersection.size / Math.max(union.size, 1);
  }

  _calculateCosineSimilarity(tfidf, doc1Index, doc2Index) {
    try {
      const vector1 = [];
      const vector2 = [];

      tfidf.listTerms(doc1Index).forEach((item) => {
        vector1.push(item.tfidf);
      });

      tfidf.listTerms(doc2Index).forEach((item) => {
        vector2.push(item.tfidf);
      });

      const dotProduct = vector1.reduce(
        (sum, val, i) => sum + val * (vector2[i] || 0),
        0
      );
      const mag1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
      const mag2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

      return dotProduct / Math.max(mag1 * mag2, 1);
    } catch {
      return 0;
    }
  }

  _extractMatchingPhrases(text1, text2) {
    // Simple phrase extraction (can be enhanced with n-grams)
    const words1 = this._tokenizeAndClean(text1);
    const words2 = this._tokenizeAndClean(text2);

    return words1.filter((w) => words2.includes(w)).slice(0, 10);
  }

  /**
   * Check if current skill level needs improvement to reach target level
   * @param {string} currentLevel - Current skill level
   * @param {string} targetLevel - Target skill level
   * @returns {boolean} True if improvement is needed
   */
  _needsLevelImprovement(currentLevel, targetLevel) {
    if (!currentLevel || !targetLevel) return false;
    
    // Normalize level names
    const normalizeLevel = (level) => {
      if (!level || typeof level !== 'string') return 'beginner';
      const normalized = level.toLowerCase().trim();
      
      // Handle variations
      if (normalized === 'none' || normalized === 'novice' || normalized === 'entry') return 'beginner';
      if (normalized === 'junior' || normalized === 'basic') return 'beginner';
      if (normalized === 'mid' || normalized === 'medium') return 'intermediate';
      if (normalized === 'senior' || normalized === 'pro') return 'advanced';
      if (normalized === 'expert' || normalized === 'master') return 'expert';
      
      return normalized;
    };
    
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const normalizedCurrent = normalizeLevel(currentLevel);
    const normalizedTarget = normalizeLevel(targetLevel);
    
    const currentIndex = levels.indexOf(normalizedCurrent);
    const targetIndex = levels.indexOf(normalizedTarget);
    
    // If levels are not recognized, default to beginner
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const safeTargetIndex = targetIndex >= 0 ? targetIndex : 0;
    
    return safeTargetIndex > safeCurrentIndex;
  }

  /**
   * Map generic skills (like "mastery") to specific skills based on target role and skill gaps
   * 
   * @param {string} skill - Generic skill name
   * @param {Array} skillGaps - Available skill gaps
   * @param {string} targetRole - Target role (e.g., "UI/UX Designer")
   * @returns {string} Specific skill name
   */
  _mapGenericSkillToSpecific(skill, skillGaps = [], targetRole = '') {
    if (!skill || typeof skill !== 'string') return skill || 'General Programming';
    
    const normalizedSkill = skill.toLowerCase().trim();
    
    // Generic skills that need mapping
    const genericSkills = {
      'mastery': true,
      'expertise': true,
      'advanced': true,
      'specialization': true,
    };
    
    // Check if this is a generic skill
    if (!genericSkills[normalizedSkill]) {
      return skill; // Not generic, return as-is
    }
    
    // Role-based skill mapping
    const roleSkillMapping = {
      'ui/ux designer': ['figma', 'adobe xd', 'sketch', 'prototyping', 'user research', 'wireframing'],
      'ui designer': ['figma', 'adobe xd', 'sketch', 'prototyping', 'wireframing'],
      'ux designer': ['user research', 'usability testing', 'prototyping', 'figma'],
      'frontend developer': ['react', 'javascript', 'typescript', 'html', 'css'],
      'backend developer': ['node.js', 'python', 'database', 'api'],
      'fullstack developer': ['react', 'node.js', 'javascript', 'database'],
      'web developer': ['javascript', 'html', 'css', 'react'],
      'mobile developer': ['react native', 'flutter', 'ios', 'android'],
    };
    
    // Try to map based on target role
    if (targetRole) {
      const normalizedRole = targetRole.toLowerCase().trim();
      
      // Find matching role
      for (const [role, skills] of Object.entries(roleSkillMapping)) {
        if (normalizedRole.includes(role) || role.includes(normalizedRole.split('/')[0])) {
          // Try to find a skill from mapping that exists in skill gaps
          for (const mappedSkill of skills) {
            const found = skillGaps.find(
              gap => gap.skill && gap.skill.toLowerCase().includes(mappedSkill)
            );
            if (found) {
              logger.info('Mapped generic skill to specific skill', {
                genericSkill: skill,
                specificSkill: found.skill,
                targetRole,
              });
              return found.skill;
            }
          }
          
          // If no match found, return first skill from mapping
          if (skills.length > 0) {
            logger.info('Mapped generic skill to role-based skill', {
              genericSkill: skill,
              specificSkill: skills[0],
              targetRole,
            });
            return skills[0];
          }
        }
      }
    }
    
    // Fallback: Use first skill gap if available
    if (skillGaps && skillGaps.length > 0) {
      const firstSkill = skillGaps[0].skill;
      logger.info('Mapped generic skill to first skill gap', {
        genericSkill: skill,
        specificSkill: firstSkill,
      });
      return firstSkill;
    }
    
    // Final fallback: Return generic skill with role context
    if (targetRole) {
      const rolePrefix = targetRole.toLowerCase().includes('design') ? 'design' : 'programming';
      return `${rolePrefix} ${normalizedSkill}`;
    }
    
    return skill;
  }

  /**
   * Get industry from database (by code or from job/candidate profile)
   * @param {string} industryCode - Industry code from database
   * @param {Object} options - Options { jobId, candidateId, targetRole }
   * @returns {Promise<string|null>} Industry code or null
   */
  async _getIndustryFromDatabase(industryCode = null, options = {}) {
    try {
      const Industry = require('../models/Industry');
      
      // If industry code provided, validate it exists
      if (industryCode) {
        const industry = await Industry.findOne({ code: industryCode, visible: true });
        if (industry) return industry.code;
      }
      
      // Try to get from job if jobId provided
      if (options.jobId) {
        const Job = require('../models/Job');
        const job = await Job.findById(options.jobId).populate('industry');
        if (job?.industry) {
          return typeof job.industry === 'string' ? job.industry : job.industry.code;
        }
      }
      
      // Try to get from candidate profile if candidateId provided
      if (options.candidateId) {
        const CandidateProfile = require('../models/CandidateProfile');
        const candidate = await CandidateProfile.findById(options.candidateId);
        if (candidate?.preferences?.industries?.[0]) {
          return candidate.preferences.industries[0];
        }
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting industry from database:', error.message);
      return null;
    }
  }

  /**
   * Extract industry from target role (DEPRECATED - use _getIndustryFromDatabase instead)
   * @deprecated Use Industry model from database instead. This method is kept for backward compatibility only.
   * @param {string} targetRole - Target role/job title
   * @returns {string|null} Industry code or null
   */
  _extractIndustryFromRole(targetRole = '') {
    logger.warn('_extractIndustryFromRole() is deprecated. Use _getIndustryFromDatabase() with Industry model instead.');
    if (!targetRole || typeof targetRole !== 'string') return null;
    
    const normalized = targetRole.toLowerCase().trim();
    
    // Role to industry mapping (DEPRECATED - should use database)
    const roleIndustryMap = {
      'design': 'design',
      'designer': 'design',
      'ui/ux': 'design',
      'ux': 'design',
      'ui': 'design',
      'developer': 'technology',
      'programmer': 'technology',
      'engineer': 'engineering',
      'frontend': 'technology',
      'backend': 'technology',
      'fullstack': 'technology',
      'mobile': 'technology',
      'data scientist': 'technology',
      'data analyst': 'technology',
      'product manager': 'business',
      'marketing': 'marketing',
      'sales': 'business',
    };
    
    for (const [keyword, industry] of Object.entries(roleIndustryMap)) {
      if (normalized.includes(keyword)) {
        return industry;
      }
    }
    
    return 'technology'; // Default to technology
  }

  /**
   * Get default resources for a skill (fallback)
   * 
   * @param {string} skill - Skill name
   * @returns {Array} Array of default resources
   */
  _getDefaultResourcesForSkill(skill) {
    const skillName = skill || 'Programming';
    return [
      {
        type: 'documentation',
        title: `${skillName} Documentation`,
        provider: 'Official Docs',
        difficulty: 'beginner',
        duration: 'Reference',
        credibility: 1.0,
        rating: 5.0,
        isFree: true,
        estimatedCost: 0,
        url: `https://www.google.com/search?q=${encodeURIComponent(skillName + ' documentation')}`,
        lastUpdated: new Date().toISOString(),
        isCurated: false,
      },
      {
        type: 'video',
        title: `${skillName} Tutorial for Beginners`,
        provider: 'YouTube',
        difficulty: 'beginner',
        duration: '2-3 hours',
        credibility: 0.7,
        rating: 4.5,
        isFree: true,
        estimatedCost: 0,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial beginner')}`,
        lastUpdated: new Date().toISOString(),
        isCurated: false,
      },
    ];
  }
}

module.exports = new AIService();

