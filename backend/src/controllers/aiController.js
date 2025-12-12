const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const aiService = require('../services/ai/aiService');
const { logger } = require('../utils/logger');
const { ApiResponse } = require('../utils/responseHandler');
const { AppError } = require('../utils/errors');

// Pre-load Dialogflow services để đảm bảo initialization khi server start
// Thay vì lazy loading trong recognizeNavigationIntent
const dialogflowIntentService = require('../services/ai/dialogflowIntentService');
const navigationService = require('../services/ai/navigationService');

// ============================================
// MULTER CONFIGURATION FOR CV UPLOAD
// ============================================
// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../../uploads/cv');
if (!fsSync.existsSync(uploadPath)) {
  fsSync.mkdirSync(uploadPath, { recursive: true });
  logger.info(`Created upload directory: ${uploadPath}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Directory is already created above
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

// ============================================
// AI CONTROLLER CLASS
// ============================================
class AIController {
  constructor() {
    // CV Analysis
    this.analyzeCV = [upload.single('cv'), this.analyzeCVHandler.bind(this)];
    this.analyzeCVText = this.analyzeCVText.bind(this);

    // Job & Career AI
    this.getJobRecommendations = this.getJobRecommendations.bind(this);
    this.getCandidateRecommendations = this.getCandidateRecommendations.bind(this);
    this.analyzeJobPosting = this.analyzeJobPosting.bind(this);
    this.analyzeJobDescription = this.analyzeJobDescription.bind(this);

    // Matching & Scoring
    this.analyzeJobMatch = this.analyzeJobMatch.bind(this);
    this.getMatchScore = this.getMatchScore.bind(this);
    this.analyzeCandidate = this.analyzeCandidate.bind(this);

    // Skills & Learning
    this.getSkillGapAnalysis = this.getSkillGapAnalysis.bind(this);
    this.generateSkillRoadmap = this.generateSkillRoadmap.bind(this);
    this.getAISuggestions = this.getAISuggestions.bind(this);

    // Insights & Analytics
    this.getCandidateInsights = this.getCandidateInsights.bind(this);
    this.getEmployerInsights = this.getEmployerInsights.bind(this);
    this.getAIInsights = this.getAIInsights.bind(this);

    // Batch Operations
    this.batchAnalyzeApplications = this.batchAnalyzeApplications.bind(this);
    
    // Navigation Intent Recognition (Dialogflow)
    this.recognizeNavigationIntent = this.recognizeNavigationIntent.bind(this);
  }

  // ========================================
  // CV ANALYSIS ENDPOINTS
  // ========================================

  /**
   * Format degree name for better display
   * @private
   */
  _formatDegree(degree) {
    if (!degree) return '';
    
    const degreeLower = degree.toLowerCase();
    
    // Map common degree types
    if (degreeLower.includes('university') || degreeLower.includes('đại học')) {
      return 'Cử nhân'; // Default to Bachelor for university
    }
    if (degreeLower.includes('master') || degreeLower.includes('thạc sĩ')) {
      return 'Thạc sĩ';
    }
    if (degreeLower.includes('phd') || degreeLower.includes('doctor') || degreeLower.includes('tiến sĩ')) {
      return 'Tiến sĩ';
    }
    if (degreeLower.includes('college') || degreeLower.includes('cao đẳng')) {
      return 'Cao đẳng';
    }
    if (degreeLower.includes('tốt nghiệp')) {
      return 'Tốt nghiệp';
    }
    
    // Return original if already in Vietnamese or valid format
    return degree;
  }

  /**
   * POST /api/ai/analyze-cv
   * Phân tích CV từ file upload
   */
  async analyzeCVHandler(req, res) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, 'Please upload a CV file', 400);
      }

      const filePath = req.file.path;
      const userId = req.user.id;
      const fs = require('fs').promises;

      logger.info(`Starting CV analysis for user ${userId}`, {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
      });

      // Read file buffer and get mimeType
      const fileBuffer = await fs.readFile(filePath);
      const mimeType = req.file.mimetype || 'application/pdf'; // Default to PDF if not provided

      // Extract text from CV
      let extractedText = await aiService.extractTextFromCV(fileBuffer, mimeType);

      if (!extractedText || extractedText.trim().length === 0) {
        await fs.unlink(filePath);
        return ApiResponse.error(
          res,
          'Could not extract text from CV. Please ensure the file is readable.',
          400
        );
      }

      // CRITICAL: Clean text again to ensure no corruption before parsing
      if (aiService.cvParsingService && typeof aiService.cvParsingService.cleanText === 'function') {
        extractedText = aiService.cvParsingService.cleanText(extractedText);
      }
      
      // Log cleaned text for debugging
      logger.info('📄 Extracted text (first 500 chars):', extractedText.substring(0, 500));

      // CRITICAL: Use the same parser as /api/candidates/me/resume?action=parse for accuracy
      // This ensures consistent and accurate parsing across all endpoints
      let extractedData = {};
      let parseResult = null;
      let skillsAnalysis = { skills: { technical: [], soft: [], languages: [] } };
      
      try {
        // Use the same parseResumeFromBuffer method as /api/candidates/me/resume
        parseResult = await aiService.parseResumeFromBuffer(fileBuffer, mimeType);
        logger.info('✅ Successfully parsed CV using aiService.parseResumeFromBuffer (same as /candidates/me/resume)');
        
        if (parseResult && parseResult.extractedData) {
          extractedData = parseResult.extractedData;
          
          // Extract skills from parsed data (more accurate than text analysis)
          if (parseResult.skills && Array.isArray(parseResult.skills)) {
            // Categorize skills from parsed result
            const categorizedSkills = {
              technical: [],
              soft: [],
              languages: []
            };
            
            parseResult.skills.forEach(skill => {
              const skillName = typeof skill === 'string' ? skill : skill.name;
              const skillType = typeof skill === 'object' ? skill.type : null;
              
              if (skillType === 'technical' || skillType === 'programming_language') {
                categorizedSkills.technical.push(skillName);
              } else if (skillType === 'soft') {
                categorizedSkills.soft.push(skillName);
              } else if (skillType === 'language') {
                categorizedSkills.languages.push(skillName);
              } else {
                // Auto-categorize if type not specified
                const lower = skillName.toLowerCase();
                if (['toeic', 'ielts', 'english', 'vietnamese', 'tiếng anh', 'tiếng việt'].some(lang => lower.includes(lang))) {
                  categorizedSkills.languages.push(skillName);
                } else if (['giao tiếp', 'làm việc nhóm', 'quản lý', 'communication', 'teamwork'].some(soft => lower.includes(soft))) {
                  categorizedSkills.soft.push(skillName);
                } else {
                  categorizedSkills.technical.push(skillName);
                }
              }
            });
            
            skillsAnalysis.skills = categorizedSkills;
          }
        }
      } catch (parseError) {
        logger.warn('⚠️ CV parsing failed:', parseError.message);
        // DO NOT use fallback text extraction - it extracts incorrect skills from descriptions
        // Only use parsed data for accuracy
      }

      // Fallback: Extract experience and education directly from text if parsing failed
      if (!extractedData.experience || extractedData.experience.length === 0) {
        try {
          extractedData.experience = aiService.cvParsingService?.extractExperienceInfo(extractedText) || [];
        } catch (e) {
          logger.warn('Experience extraction failed:', e.message);
          extractedData.experience = [];
        }
      }

      if (!extractedData.education) {
        try {
          extractedData.education = aiService.cvParsingService?.extractEducationInfo(extractedText) || null;
        } catch (e) {
          logger.warn('Education extraction failed:', e.message);
          extractedData.education = null;
        }
      }

      // CRITICAL: Use skills from parsed result ONLY (most accurate)
      // DO NOT use fallback from text extraction as it adds "Kỹ năng" prefix
      let categorizedSkills = {
        technical: [],
        soft: [],
        languages: []
      };
      
      // Priority 1: Use skills from parseResult.skills (already parsed by Gemini - most accurate)
      if (parseResult && parseResult.skills && Array.isArray(parseResult.skills) && parseResult.skills.length > 0) {
        logger.info(`✅ Using ${parseResult.skills.length} skills from parseResult (accurate)`);
        
        parseResult.skills.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.name;
          const skillType = typeof skill === 'object' ? skill.type : null;
          
          // CRITICAL: Respect skill.type from parsed data (don't override)
          if (skillType === 'technical' || skillType === 'programming_language') {
            categorizedSkills.technical.push(skillName);
          } else if (skillType === 'soft') {
            categorizedSkills.soft.push(skillName);
          } else if (skillType === 'language') {
            categorizedSkills.languages.push(skillName);
          } else {
            // Only auto-categorize if type is not specified
            const lower = skillName.toLowerCase();
            if (['toeic', 'ielts', 'english', 'vietnamese', 'tiếng anh', 'tiếng việt'].some(lang => lower.includes(lang))) {
              categorizedSkills.languages.push(skillName);
            } else if (['giao tiếp', 'làm việc nhóm', 'communication', 'teamwork'].some(soft => lower.includes(soft))) {
              // Note: "quản lý" alone is soft, but "kiểm tra, quản lý, lưu trữ hồ sơ" is technical
              categorizedSkills.soft.push(skillName);
            } else {
              categorizedSkills.technical.push(skillName);
            }
          }
        });
      } 
      // Priority 2: Use skills from extractedData.skills (from parsed data structure)
      else if (extractedData.skills && Array.isArray(extractedData.skills) && extractedData.skills.length > 0) {
        logger.info(`⚠️ Using ${extractedData.skills.length} skills from extractedData (fallback)`);
        
        extractedData.skills.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.name;
          const skillType = typeof skill === 'object' ? skill.type : null;
          
          // CRITICAL: Respect skill.type from parsed data
          if (skillType === 'technical' || skillType === 'programming_language') {
            categorizedSkills.technical.push(skillName);
          } else if (skillType === 'soft') {
            categorizedSkills.soft.push(skillName);
          } else if (skillType === 'language') {
            categorizedSkills.languages.push(skillName);
          } else {
            // Auto-categorize only if type not specified
            const lower = skillName.toLowerCase();
            if (['toeic', 'ielts', 'english', 'vietnamese', 'tiếng anh', 'tiếng việt'].some(lang => lower.includes(lang))) {
              categorizedSkills.languages.push(skillName);
            } else if (['giao tiếp', 'làm việc nhóm', 'communication', 'teamwork'].some(soft => lower.includes(soft))) {
              categorizedSkills.soft.push(skillName);
            } else {
              categorizedSkills.technical.push(skillName);
            }
          }
        });
      }
      // DO NOT use skillsAnalysis from selfSufficientAI as it extracts from text and adds "Kỹ năng" prefix
      // DO NOT extract skills from experience/education descriptions - they are not skills
      
      // Filter out invalid skills (common words/phrases that are not actual skills)
      const invalidSkillPatterns = [
        /^(kỹ năng|skill|ability|năng lực)$/i,
        /^(kinh nghiệm|experience|thực tập|internship)$/i,
        /^(công ty|company|tổ chức|organization)$/i,
        /^(quản lý|management)$/i, // Too generic without context
        /^(học|study|education)$/i,
        /^(khai báo hải quan|giao nhận|chăm sóc khách hàng)$/i, // These are job tasks, not skills
      ];
      
      const filterInvalidSkills = (skills) => {
        return skills.filter(skill => {
          if (!skill || typeof skill !== 'string') return false;
          const skillLower = skill.toLowerCase().trim();
          // Skip if matches invalid patterns
          if (invalidSkillPatterns.some(pattern => pattern.test(skillLower))) {
            return false;
          }
          // Skip if too short (less than 2 characters)
          if (skillLower.length < 2) {
            return false;
          }
          // Skip if it's just a common word
          const commonWords = ['c', 'a', 'an', 'the', 'và', 'của', 'cho', 'với', 'từ', 'trong'];
          if (commonWords.includes(skillLower)) {
            return false;
          }
          return true;
        });
      };
      
      categorizedSkills.technical = filterInvalidSkills(categorizedSkills.technical);
      categorizedSkills.soft = filterInvalidSkills(categorizedSkills.soft);
      categorizedSkills.languages = filterInvalidSkills(categorizedSkills.languages);
      
      // Get all unique skills for total count
      const uniqueSkills = [
        ...categorizedSkills.technical,
        ...categorizedSkills.soft,
        ...categorizedSkills.languages
      ];

      // Format experience with full description
      const experience = (extractedData.experience || []).map(exp => ({
        position: exp.position || exp.title || exp.role || '',
        company: exp.company || exp.organization || '',
        duration: exp.duration || exp.period || (exp.startDate && exp.endDate 
          ? `${exp.startDate} - ${exp.endDate}` 
          : ''),
        description: exp.description || '', // Include full description
      })).filter(exp => exp.position || exp.company);

      // Format education with duration
      const education = extractedData.education 
        ? [{
            degree: this._formatDegree(extractedData.education.degree || extractedData.education.type || ''),
            major: extractedData.education.field || extractedData.education.major || '',
            school: extractedData.education.institution || extractedData.education.school || '',
            duration: extractedData.education.duration || 
              (extractedData.education.startYear && extractedData.education.endYear
                ? `${extractedData.education.startYear} - ${extractedData.education.endYear}`
                : extractedData.education.startDate && extractedData.education.endDate
                ? `${extractedData.education.startDate} - ${extractedData.education.endDate}`
                : ''),
          }].filter(e => e.degree || e.major || e.school)
        : [];

      // Generate suggestions
      const suggestions = [];
      if (uniqueSkills.length === 0) {
        suggestions.push('CV của bạn chưa có kỹ năng rõ ràng. Hãy thêm phần kỹ năng với các công nghệ, ngôn ngữ lập trình, hoặc kỹ năng mềm bạn đã học.');
      }
      if (experience.length === 0) {
        suggestions.push('Hãy thêm phần kinh nghiệm làm việc hoặc thực tập để CV của bạn nổi bật hơn.');
      }
      if (education.length === 0) {
        suggestions.push('Hãy thêm thông tin học vấn bao gồm tên trường, ngành học, và bằng cấp.');
      }
      if (extractedText.length < 200) {
        suggestions.push('CV của bạn khá ngắn. Hãy mở rộng mô tả về kinh nghiệm và dự án để thể hiện tốt hơn năng lực của bạn.');
      }
      if (suggestions.length === 0) {
        suggestions.push('CV của bạn đã có cấu trúc tốt. Hãy tiếp tục cập nhật và cải thiện để phù hợp với từng vị trí ứng tuyển.');
      }

      const analysis = {
        skills: categorizedSkills, // Use categorized skills instead of empty structure
        totalSkills: uniqueSkills.length,
        _method: 'self-sufficient (Hybrid System: Rule-based + Multilingual NER) + Rule-based parsing',
        _timestamp: new Date(),
      };

      // Update user profile with extracted information
      const updateData = {
        resume: {
          url: filePath,
          filename: req.file.filename,
          uploadedAt: new Date(),
        },
      };

      if (uniqueSkills.length > 0) {
        updateData.skills = uniqueSkills.map(skill => ({
          name: skill,
          level: 'intermediate',
          yearsOfExperience: 0,
        }));
      }

      if (experience.length > 0) {
        updateData.experience = experience;
      }

      if (education.length > 0) {
        updateData.education = education[0];
      }

      await User.findByIdAndUpdate(userId, updateData, { new: true });

      logger.info(`CV analysis completed for user ${userId}`, {
        skillsCount: uniqueSkills.length,
        experienceCount: experience.length,
        educationCount: education.length,
      });

      // Include additional data from parsed result (certificates, awards, activities, references)
      const certificates = (extractedData.certificates || []).map(cert => ({
        name: cert.name || '',
        issuer: cert.issuer || null,
        year: cert.year || null,
        description: cert.description || null
      }));
      
      const awards = (extractedData.awards || []).map(award => ({
        name: award.name || '',
        year: award.year || null,
        description: award.description || null
      }));
      
      const activities = (extractedData.activities || []).map(activity => ({
        name: activity.name || '',
        organization: activity.organization || null,
        duration: activity.duration || '',
        description: activity.description || ''
      }));
      
      const references = (extractedData.references || []).map(ref => ({
        name: ref.name || '',
        position: ref.position || null,
        phone: ref.phone || null,
        email: ref.email || null
      }));

      return ApiResponse.success(
        res,
        {
          analysis,
          extractedSkills: uniqueSkills,
          experience,
          education,
          suggestions,
          extractedText: extractedText, // Return full cleaned text for frontend parsing
          personalInfo: extractedData.personalInfo || {}, // Include personal info
          certificates: certificates.length > 0 ? certificates : undefined, // Include certificates if available
          awards: awards.length > 0 ? awards : undefined, // Include awards if available
          activities: activities.length > 0 ? activities : undefined, // Include activities if available
          references: references.length > 0 ? references : undefined, // Include references if available
          filename: req.file.filename,
          uploadedAt: new Date(),
        },
        'CV analyzed successfully'
      );
    } catch (error) {
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error('Error deleting uploaded file:', unlinkError);
        }
      }

      logger.error('CV analysis error:', error);
      return ApiResponse.error(
        res,
        'CV analysis failed. Please try again.',
        500
      );
    }
  }

  /**
   * POST /api/ai/analyze-cv-text
   * Phân tích CV từ văn bản thô (không cần upload file)
   */
  async analyzeCVText(req, res, next) {
    try {
      const { rawCVText } = req.body;

      if (
        !rawCVText ||
        typeof rawCVText !== 'string' ||
        rawCVText.trim().length === 0
      ) {
        return ApiResponse.error(res, 'Missing or invalid rawCVText', 400);
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeCV(rawCVText);
      logger.info('🔬 CV analyzed from text (self-sufficient mode)');

      let profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        profile = new CandidateProfile({ userId: req.user.id });
      }

      // Update profile với dữ liệu AI extract (không ghi đè dữ liệu có sẵn)
      profile.skills = analysis.skills || profile.skills;
      profile.experience = analysis.experience || profile.experience;
      profile.education = analysis.education || profile.education;
      profile.personalInfo = {
        ...profile.personalInfo,
        ...analysis.contact,
        bio: analysis.summary || profile.personalInfo?.bio || '',
      };

      await profile.save();

      return ApiResponse.success(
        res,
        {
          analysis,
          message: 'CV analyzed from text successfully',
        },
        'CV analyzed from text successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/analyze-cv-improvements
   * Phân tích CV và đưa ra gợi ý cải thiện để viết CV hay hơn
   * 
   * Có thể nhận dữ liệu từ các endpoint sau để tránh parse lại:
   * - parsingData: Dữ liệu từ response của /api/candidates/me/resume?action=parse (MOST ACCURATE - recommended)
   * - analysisData: Dữ liệu từ response của /api/ai/analyze-cv
   * - cvData, cvText: Dữ liệu CV trực tiếp
   * - cvId: ID của CV đã upload để fetch từ database
   */
  async analyzeCVImprovements(req, res, next) {
    try {
      const { cvData, cvText, cvId, targetJobId, analysisData, parsingData } = req.body;
      const userId = req.user.id;

      // Priority 1: Use data from /api/candidates/me/resume?action=parse (MOST ACCURATE)
      let finalCvData = cvData;
      let finalCvText = cvText;

      if (parsingData) {
        logger.info('📝 Using parsing data from /api/candidates/me/resume endpoint (most accurate)');
        
        // Extract from parsing response format: { parsing: { extractedData: {...} } }
        const extractedData = parsingData.parsing?.extractedData || parsingData.extractedData || parsingData;
        
        if (extractedData.personalInfo) {
          finalCvData = {
            ...finalCvData,
            personalInfo: {
              fullName: extractedData.personalInfo.fullName,
              email: extractedData.personalInfo.email,
              phone: extractedData.personalInfo.phone,
              address: extractedData.personalInfo.address,
              dateOfBirth: extractedData.personalInfo.dateOfBirth,
              summary: extractedData.personalInfo.summary || extractedData.personalInfo.bio
            }
          };
        }
        
        if (extractedData.experience && Array.isArray(extractedData.experience)) {
          finalCvData = {
            ...finalCvData,
            experience: extractedData.experience.map(exp => ({
              position: exp.position,
              company: exp.company,
              startDate: exp.startDate || (exp.duration?.split('-')[0]?.trim() || ''),
              endDate: exp.endDate || (exp.duration?.split('-')[1]?.trim() || ''),
              duration: exp.duration,
              description: exp.description || '',
              type: exp.type || 'fulltime',
              location: exp.location
            }))
          };
        }
        
        if (extractedData.education) {
          // Handle both single object and array format
          const educationArray = Array.isArray(extractedData.education) 
            ? extractedData.education 
            : [extractedData.education];
          
          finalCvData = {
            ...finalCvData,
            education: educationArray.map(edu => ({
              degree: edu.degree,
              field: edu.field || edu.major,
              institution: edu.institution || edu.school,
              startYear: edu.startYear || (edu.duration?.split('-')[0]?.trim() || ''),
              endYear: edu.endYear || edu.graduationYear || (edu.duration?.split('-')[1]?.trim() || ''),
              duration: edu.duration,
              gpa: edu.gpa,
              gradeText: edu.gradeText
            }))
          };
        }
        
        if (extractedData.skills && Array.isArray(extractedData.skills)) {
          // Categorize skills from array format
          const categorizedSkills = {
            technical: [],
            soft: [],
            languages: []
          };
          
          extractedData.skills.forEach(skill => {
            const skillName = typeof skill === 'string' ? skill : skill.name;
            const skillType = typeof skill === 'object' ? skill.type : null;
            
            if (skillType === 'technical' || skillType === 'programming_language') {
              categorizedSkills.technical.push(skillName);
            } else if (skillType === 'soft') {
              categorizedSkills.soft.push(skillName);
            } else if (skillType === 'language') {
              categorizedSkills.languages.push(skillName);
            } else {
              // Auto-categorize if type not specified
              const lower = skillName.toLowerCase();
              if (['toeic', 'ielts', 'english', 'vietnamese', 'tiếng anh', 'tiếng việt'].some(lang => lower.includes(lang))) {
                categorizedSkills.languages.push(skillName);
              } else if (['giao tiếp', 'làm việc nhóm', 'quản lý', 'communication', 'teamwork'].some(soft => lower.includes(soft))) {
                categorizedSkills.soft.push(skillName);
              } else {
                categorizedSkills.technical.push(skillName);
              }
            }
          });
          
          finalCvData = {
            ...finalCvData,
            skills: categorizedSkills
          };
        }
        
        // Include additional data if available
        if (extractedData.certificates) {
          finalCvData = {
            ...finalCvData,
            certifications: Array.isArray(extractedData.certificates) 
              ? extractedData.certificates 
              : [extractedData.certificates]
          };
        }
        
        if (extractedData.awards) {
          finalCvData = {
            ...finalCvData,
            awards: Array.isArray(extractedData.awards) 
              ? extractedData.awards 
              : [extractedData.awards]
          };
        }
        
        if (extractedData.activities) {
          finalCvData = {
            ...finalCvData,
            activities: Array.isArray(extractedData.activities) 
              ? extractedData.activities 
              : [extractedData.activities]
          };
        }
        
        // Build CV text from extracted data if not provided
        if (!finalCvText && extractedData.personalInfo) {
          const parts = [];
          if (extractedData.personalInfo.summary) parts.push(extractedData.personalInfo.summary);
          if (extractedData.experience) {
            // Ensure experience is an array
            const experienceArray = Array.isArray(extractedData.experience) 
              ? extractedData.experience 
              : [extractedData.experience].filter(Boolean);
            experienceArray.forEach(exp => {
              if (exp && typeof exp === 'object') {
                parts.push(`${exp.position || ''} at ${exp.company || ''}: ${exp.description || ''}`);
              }
            });
          }
          if (extractedData.education) {
            const eduArray = Array.isArray(extractedData.education) 
              ? extractedData.education 
              : [extractedData.education].filter(Boolean);
            eduArray.forEach(edu => {
              if (edu && typeof edu === 'object') {
                parts.push(`${edu.degree || ''} in ${edu.field || edu.major || ''} from ${edu.institution || edu.school || ''}`);
              }
            });
          }
          finalCvText = parts.join('\n');
        }
      } else if (analysisData) {
        // Priority 2: Use data from /api/ai/analyze-cv response
        logger.info('📝 Using analysis data from /api/ai/analyze-cv endpoint');
        
        // Extract data from analyze-cv response format
        if (analysisData.personalInfo) {
          finalCvData = {
            ...finalCvData,
            personalInfo: analysisData.personalInfo
          };
        }
        
        if (analysisData.experience && Array.isArray(analysisData.experience)) {
          finalCvData = {
            ...finalCvData,
            experience: analysisData.experience.map(exp => ({
              position: exp.position,
              company: exp.company,
              startDate: exp.duration?.split('-')[0]?.trim() || '',
              endDate: exp.duration?.split('-')[1]?.trim() || '',
              duration: exp.duration,
              description: exp.description || '',
              type: exp.type || 'fulltime'
            }))
          };
        }
        
        if (analysisData.education && Array.isArray(analysisData.education)) {
          finalCvData = {
            ...finalCvData,
            education: analysisData.education.map(edu => ({
              degree: edu.degree,
              field: edu.major,
              institution: edu.school,
              startYear: edu.duration?.split('-')[0]?.trim() || '',
              endYear: edu.duration?.split('-')[1]?.trim() || '',
              duration: edu.duration
            }))
          };
        }
        
        if (analysisData.skills || analysisData.analysis?.skills) {
          const skills = analysisData.skills || analysisData.analysis?.skills || {};
          finalCvData = {
            ...finalCvData,
            skills: {
              technical: skills.technical || [],
              soft: skills.soft || [],
              languages: skills.languages || []
            }
          };
        }
        
        // Use extractedText from analysis if available
        if (analysisData.extractedText) {
          finalCvText = analysisData.extractedText;
        }
      }

      if (!finalCvData || !finalCvText) {
        // Try to get from candidate profile
        const profile = await CandidateProfile.findOne({ userId });
        if (profile) {
          if (!finalCvData) {
            // Ensure experience and education are arrays
            const experienceArray = Array.isArray(profile.experience) 
              ? profile.experience 
              : (profile.experience ? [profile.experience] : []);
            const educationArray = Array.isArray(profile.education) 
              ? profile.education 
              : (profile.education ? [profile.education] : []);
            
            finalCvData = {
              personalInfo: profile.personalInfo,
              education: educationArray,
              experience: experienceArray,
              skills: profile.skills,
            };
          }

          // Try to get CV text from resume if cvId provided
          if (!finalCvText && cvId) {
            try {
              const aiService = require('../services/ai/aiService');
              const resume = profile.resume?.current || 
                            (profile.resume?.history && profile.resume.history.find(h => h._id?.toString() === cvId));
              
              if (resume?.url) {
                const extractedText = await aiService.extractTextFromCV(resume.url);
                if (extractedText) {
                  finalCvText = extractedText;
                }
              }
            } catch (extractError) {
              logger.warn('Could not extract text from CV file:', extractError.message);
            }
          }

          // Build CV text from profile data if still not available
          if (!finalCvText && finalCvData) {
            const parts = [];
            if (finalCvData.personalInfo?.bio) parts.push(finalCvData.personalInfo.bio);
            if (finalCvData.experience) {
              // Ensure experience is an array
              const experienceArray = Array.isArray(finalCvData.experience) 
                ? finalCvData.experience 
                : [finalCvData.experience].filter(Boolean);
              experienceArray.forEach(exp => {
                if (exp && typeof exp === 'object') {
                  parts.push(`${exp.position || ''} at ${exp.company || ''}: ${exp.description || ''}`);
                }
              });
            }
            if (finalCvData.education) {
              // Ensure education is an array
              const educationArray = Array.isArray(finalCvData.education) 
                ? finalCvData.education 
                : [finalCvData.education].filter(Boolean);
              educationArray.forEach(edu => {
                if (edu && typeof edu === 'object') {
                  parts.push(`${edu.degree || ''} in ${edu.major || edu.field || ''} from ${edu.school || edu.institution || ''}`);
                }
              });
            }
            if (finalCvData.skills) {
              const techSkills = finalCvData.skills.technical?.map(s => s.name || s).join(', ') || '';
              const softSkills = finalCvData.skills.soft?.map(s => s.name || s).join(', ') || '';
              if (techSkills) parts.push(`Technical skills: ${techSkills}`);
              if (softSkills) parts.push(`Soft skills: ${softSkills}`);
            }
            finalCvText = parts.join('\n');
          }
        }
      }

      if (!finalCvData && !finalCvText) {
        return ApiResponse.error(
          res,
          'Please provide cvData and cvText, or ensure you have a CV uploaded',
          400
        );
      }

      if (!finalCvText || finalCvText.trim().length < 50) {
        return ApiResponse.error(
          res,
          'CV text is too short or missing. Please upload a CV or provide cvText.',
          400
        );
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const improvements = await selfSufficientAI.analyzeCVImprovements(
        finalCvData || {},
        finalCvText,
        targetJobId || null
      );
      
      logger.info('📝 CV improvements analyzed', {
        userId,
        targetJobId,
        overallScore: improvements.overallScore,
        dataSource: improvements._dataSource || 'unknown',
        confidence: improvements._confidence || 'unknown',
        suggestionsCount: Object.values(improvements.suggestions).flat().length
      });

      return ApiResponse.success(
        res,
        improvements,
        'CV improvements analysis completed successfully'
      );
    } catch (error) {
      logger.error('CV improvements analysis error:', error);
      next(error);
    }
  }

  /**
   * POST /api/ai/cv-improvements/coordinates
   * Detect box coordinates for suggestions using Gemini Vision API
   */
  async detectCVImprovementCoordinates(req, res, next) {
    try {
      const { pdfUrl, improvements } = req.body;

      if (!pdfUrl || !improvements || !Array.isArray(improvements)) {
        return ApiResponse.error(
          res,
          'pdfUrl and improvements array are required',
          400
        );
      }

      // Fallback: return mock coordinates (Gemini Vision is optional)
      let coordinates = improvements.map((imp, idx) => ({
        index: idx,
        x: 50 + (idx % 3) * 200,
        y: 100 + Math.floor(idx / 3) * 150,
        width: 300,
        height: 80,
        page: 1,
        confidence: 0.5
      }));

      // Try Gemini Vision if available (optional enhancement)
      const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
      if (geminiApiKey && improvements.length > 0) {
        try {
          // Download PDF and convert to image
          const axios = require('axios');
          const pdfResponse = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            headers: {
              Authorization: req.headers.authorization
            }
          });

          const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');
          
          const loadingTask = pdfjsLib.getDocument({ data: pdfResponse.data });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 });
          
          // Try canvas if available
          try {
            const { createCanvas } = require('canvas');
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');
            
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            const imageBuffer = canvas.toBuffer('image/png');
            const base64Image = imageBuffer.toString('base64');

            // Use Gemini Vision
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const prompt = `Analyze this CV image and find exact pixel coordinates for text sections. Return JSON array with x, y, width, height for each section.`;

            const result = await model.generateContent([
              { inlineData: { data: base64Image, mimeType: 'image/png' } },
              { text: prompt }
            ]);

            const response = await result.response;
            let text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            try {
              const detected = JSON.parse(text);
              if (Array.isArray(detected) && detected.length > 0) {
                coordinates = detected;
                logger.info('✅ Successfully detected coordinates using Gemini Vision');
              }
            } catch (parseError) {
              logger.warn('Failed to parse Gemini response, using fallback');
            }
          } catch (canvasError) {
            logger.warn('Canvas not available, using fallback coordinates');
          }
        } catch (error) {
          logger.warn('Gemini Vision failed, using fallback:', error.message);
        }
      }

      return ApiResponse.success(
        res,
        coordinates,
        'Coordinates detected successfully'
      );
    } catch (error) {
      logger.error('Error detecting coordinates:', error);
      // Always return fallback coordinates
      const { improvements } = req.body;
      const mockCoordinates = (improvements || []).map((imp, idx) => ({
        index: idx,
        x: 50 + (idx % 3) * 200,
        y: 100 + Math.floor(idx / 3) * 150,
        width: 300,
        height: 80,
        page: 1,
        confidence: 0.5
      }));
      return ApiResponse.success(res, mockCoordinates, 'Using fallback coordinates');
    }
  }

  // ========================================
  // JOB & CAREER AI ENDPOINTS
  // ========================================

  /**
   * POST /api/ai/job-recommendations
   * Lấy gợi ý công việc dựa trên profile
   */
  async getJobRecommendations(req, res) {
    const userId = req.user.id;
    const { limit = 10, minScore = 60 } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      const jobs = await Job.findActive().populate(
        'postedBy',
        'firstName lastName company'
      );

      if (jobs.length === 0) {
        return ApiResponse.success(
          res,
          {
            recommendations: [],
            message: 'No active jobs available at the moment',
          },
          'No active jobs found'
        );
      }

      const recommendations = await aiService.getJobRecommendations(
        user,
        jobs,
        {
          limit: parseInt(limit),
          minScore: parseInt(minScore),
        }
      );

      logger.info(
        `Generated ${recommendations.length} job recommendations for user ${userId}`
      );

      return ApiResponse.success(
        res,
        {
          recommendations,
          totalJobs: jobs.length,
          filteredCount: recommendations.length,
        },
        'Job recommendations generated successfully'
      );
    } catch (error) {
      logger.error('Job recommendations error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate job recommendations',
        500
      );
    }
  }

  /**
   * POST /api/ai/candidate-recommendations
   * Lấy gợi ý ứng viên phù hợp cho một job (Employer only)
   */
  async getCandidateRecommendations(req, res) {
    const { jobId, limit = 10, minScore = 60, useRAG: useRAGBody, noCache: noCacheBody } = req.body;
    const noCache = req.query.noCache === 'true' || noCacheBody === true;

    try {
      const Job = require('../models/Job');
      const CandidateProfile = require('../models/CandidateProfile');
      const CandidateRecommendation = require('../models/CandidateRecommendation');
      const { getCacheService } = require('../services/cache/cacheService');

      // Verify job exists
      const job = await Job.findById(jobId).populate('postedBy', 'id company');
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      // Verify user is employer and owns the job
      if (!req.user.role || req.user.role !== 'employer') {
        return ApiResponse.error(res, 'Only employers can view candidate recommendations', 403);
      }

      if (job.postedBy && job.postedBy._id.toString() !== req.user.id && job.postedBy.id?.toString() !== req.user.id) {
        return ApiResponse.error(res, 'Not authorized to view recommendations for this job', 403);
      }

      // Check cache first (skip if noCache or useRAG)
      const cacheService = getCacheService();
      const useRAG = useRAGBody === true || process.env.ENABLE_RAG_RECOMMENDATIONS === 'true';
      if (!noCache && !useRAG) {
        const cached = await cacheService.getCachedCandidateRecommendations(jobId);
        if (cached && cached.length > 0) {
          logger.info(`Retrieved ${cached.length} candidate recommendations from cache for job ${jobId}`);
          return ApiResponse.success(
            res,
            {
              recommendations: cached,
              totalCandidates: cached.length,
              filteredCount: cached.length,
              cached: true,
            },
            'Candidate recommendations retrieved from cache'
          );
        }
      }

      // Get all active candidate profiles
      // Filter candidates that are searchable and active
      const candidates = await CandidateProfile.find({
        status: 'active',
        'settings.searchable': true,
        $or: [
          { deletedAt: { $exists: false } },
          { deletedAt: null },
        ],
      })
        .populate('userId', 'email')
        .limit(1000) // Limit to avoid performance issues with large datasets
        .lean();

      if (candidates.length === 0) {
        return ApiResponse.success(
          res,
          {
            recommendations: [],
            message: 'No active candidates available at the moment',
          },
          'No candidates found'
        );
      }

      // Generate recommendations
      // Note: aiService.getCandidateRecommendations() now uses self-sufficient
      // candidateRecommendationService which fetches candidates internally
      // We still pass candidates array for backward compatibility check, but it's not used
      const recommendations = await aiService.getCandidateRecommendations(
        job,
        candidates, // Kept for backward compatibility, but service fetches internally
        {
          limit: parseInt(limit),
          minScore: parseInt(minScore),
          useRAG: useRAG, // Pass useRAG option to enable RAG
          noCache: noCache
        }
      );

      // Cache results (1 hour)
      if (!noCache && !useRAG && recommendations.length > 0) {
        await cacheService.cacheCandidateRecommendations(jobId, recommendations, 3600);
      }

      // Save to database
      if (recommendations.length > 0) {
        await CandidateRecommendation.findOneAndUpdate(
          { jobId },
          {
            jobId,
            recommendations,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isStale: false,
          },
          { upsert: true, new: true }
        );
      }

      logger.info(
        `Generated ${recommendations.length} candidate recommendations for job ${jobId}`
      );

      return ApiResponse.success(
        res,
        {
          recommendations,
          totalCandidates: candidates.length,
          filteredCount: recommendations.length,
          cached: false,
        },
        'Candidate recommendations generated successfully'
      );
    } catch (error) {
      logger.error('Candidate recommendations error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate candidate recommendations',
        500
      );
    }
  }

  /**
   * POST /api/ai/analyze-job-posting
   * Phân tích job posting (từ jobId hoặc mô tả)
   */
  async analyzeJobPosting(req, res) {
    const { jobId, jobDescription } = req.body;

    try {
      let job;

      if (jobId) {
        job = await Job.findById(jobId);
        if (!job) {
          return ApiResponse.error(res, 'Job not found', 404);
        }

        if (
          job.postedBy.toString() !== req.user.id &&
          req.user.role !== 'admin'
        ) {
          return ApiResponse.error(
            res,
            'Not authorized to analyze this job',
            403
          );
        }
      } else if (jobDescription) {
        job = { description: jobDescription, title: 'Job Analysis' };
      } else {
        return ApiResponse.error(
          res,
          'Please provide either jobId or jobDescription',
          400
        );
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeJobPosting(job);
      logger.info('📝 Job posting analyzed (self-sufficient mode)');

      if (jobId && job._id) {
        job.aiAnalysis = {
          ...analysis,
          lastAnalyzed: new Date(),
        };
        await job.save();
      }

      logger.info(`Job analysis completed`, {
        jobId: jobId || 'description-only',
        skillsFound: analysis.skillsExtracted?.length || 0,
      });

      return ApiResponse.success(
        res,
        analysis,
        'Job posting analyzed successfully'
      );
    } catch (error) {
      logger.error('Job analysis error:', error);
      return ApiResponse.error(res, 'Failed to analyze job posting', 500);
    }
  }

  /**
   * POST /api/ai/analyze-job-description
   * Phân tích job description chi tiết (dành cho CV optimization)
   */
  async analyzeJobDescription(req, res, next) {
    try {
      const { jobDescription, targetJob, companyInfo } = req.body;

      if (!jobDescription) {
        return ApiResponse.error(res, 'Job description is required', 400);
      }

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return ApiResponse.error(res, 'Profile not found', 404);
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeJobDescription(
        jobDescription,
        targetJob,
        companyInfo
      );
      logger.info('🔬 Job description analyzed (self-sufficient mode)');

      return ApiResponse.success(
        res,
        analysis,
        'Job description analyzed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // MATCHING & SCORING ENDPOINTS
  // ========================================

  /**
   * POST /api/ai/analyze-job-match
   * Phân tích độ khớp giữa candidate và job
   * 
   * @deprecated This endpoint is deprecated. Use /api/nlp/matching-score instead for advanced matching with detailed breakdown, caching, and recalculation.
   */
  async analyzeJobMatch(req, res, next) {
    try {
      // Deprecation warning
      logger.warn('Deprecated endpoint /api/ai/analyze-job-match called. Consider using /api/nlp/matching-score instead.', {
        userId: req.user.id,
        endpoint: '/api/ai/analyze-job-match'
      });

      const { targetJobDescription, targetJobTitle, jobId } = req.body;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return ApiResponse.error(res, 'Profile not found', 404);
      }

      const cvData = this.extractCVData(profile);

      let jobData = {
        title: targetJobTitle,
        description: targetJobDescription,
      };

      // Nếu có jobId, lấy thêm thông tin từ DB
      if (jobId) {
        const job = await Job.findById(jobId);
        if (job) {
          jobData = {
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            skills: job.skills,
          };
        }
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeJobMatch(cvData, jobData);
      logger.info('🎯 Job match analyzed (self-sufficient mode)');

      return ApiResponse.success(
        res, 
        {
          ...analysis,
          _deprecationWarning: {
            message: 'This endpoint is deprecated. Use /api/nlp/matching-score instead for advanced features.',
            alternativeEndpoint: '/api/nlp/matching-score',
            reason: 'Advanced matching with detailed breakdown, caching, and recalculation'
          }
        }, 
        'Job match analysis completed'
      );
    } catch (error) {
      console.error('Job match analysis error:', error);
      next(new AppError('Failed to analyze job match', 500));
    }
  }

  /**
   * POST /api/ai/match-score
   * Tính điểm khớp giữa candidate và job
   */
  async getMatchScore(req, res) {
    try {
      const { jobId, applicantId } = req.body;
      const userId = req.user.id;

      const job = await Job.findById(jobId);
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      const targetApplicantId = applicantId || userId;
      const applicant = await CandidateProfile.findOne({
        userId: targetApplicantId,
      });

      if (!applicant) {
        return ApiResponse.error(res, 'Applicant profile not found', 404);
      }

      // Check authorization
      if (
        applicantId &&
        applicantId !== userId &&
        req.user.role !== 'admin' &&
        job.postedBy.toString() !== userId
      ) {
        return ApiResponse.error(
          res,
          'Not authorized to view this match score',
          403
        );
      }

      const matchScore = await aiService.calculateMatchScore(applicant, job);

      // Check và update application nếu tồn tại
      let application = null;
      if (targetApplicantId === userId) {
        application = await Application.findOne({
          job: jobId,
          applicant: targetApplicantId,
        });

        if (application) {
          application.aiAnalysis = {
            ...application.aiAnalysis,
            ...matchScore,
            lastAnalyzed: new Date(),
          };
          await application.save();
        }
      }

      logger.info(`Match score calculated`, {
        jobId,
        applicantId: targetApplicantId,
        score: matchScore.overallScore,
      });

      return ApiResponse.success(
        res,
        {
          matchScore,
          hasApplication: !!application,
          applicationId: application?._id,
        },
        'Match score calculated successfully'
      );
    } catch (error) {
      logger.error('Match score calculation error:', error);
      return ApiResponse.error(res, 'Failed to calculate match score', 500);
    }
  }

  /**
   * POST /api/ai/analyze-candidate
   * Phân tích candidate cho một job cụ thể (Employer view)
   */
  async analyzeCandidate(req, res) {
    const { jobId, applicantId } = req.body;
    const userId = req.user.id;

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      const targetApplicantId = applicantId || userId;
      const applicant = await User.findById(targetApplicantId);

      if (!applicant) {
        return ApiResponse.error(res, 'Applicant not found', 404);
      }

      // Check authorization
      if (
        applicantId &&
        applicantId !== userId &&
        req.user.role !== 'admin' &&
        job.postedBy.toString() !== userId
      ) {
        return ApiResponse.error(
          res,
          'Not authorized to view this match score',
          403
        );
      }

      const matchScore = await aiService.calculateMatchScore(applicant, job);

      let application = null;
      if (targetApplicantId === userId) {
        application = await Application.findOne({
          job: jobId,
          applicant: targetApplicantId,
        });

        if (application) {
          application.aiAnalysis = {
            ...application.aiAnalysis,
            ...matchScore,
            lastAnalyzed: new Date(),
          };
          await application.save();
        }
      }

      logger.info(`Candidate analyzed`, {
        jobId,
        applicantId: targetApplicantId,
        score: matchScore.overallScore,
      });

      return ApiResponse.success(
        res,
        {
          matchScore,
          hasApplication: !!application,
          applicationId: application?._id,
        },
        'Candidate analyzed successfully'
      );
    } catch (error) {
      logger.error('Candidate analysis error:', error);
      return ApiResponse.error(res, 'Failed to analyze candidate', 500);
    }
  }

  // ========================================
  // SKILLS & LEARNING ENDPOINTS
  // ========================================

  /**
   * POST /api/ai/skill-gap-analysis
   * Phân tích khoảng cách kỹ năng
   * 
   * ✅ SELF-SUFFICIENT: Uses PhoBERT + Sentence-BERT (NO Gemini)
   */
  async getSkillGapAnalysis(req, res, next) {
    try {
      const { targetJobDescription, targetJobTitle, industry, jobId } =
        req.body;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return ApiResponse.error(res, 'Profile not found', 404);
      }

      const cvData = this.extractCVData(profile);

      let jobData = {
        title: targetJobTitle,
        description: targetJobDescription,
        industry,
      };

      // Nếu có jobId, lấy thông tin job từ DB
      if (jobId) {
        const job = await Job.findById(jobId);
        if (job) {
          jobData = {
            title: job.title,
            description: job.description,
            industry: job.industry,
            skills: job.skills,
          };
        }
      }

      logger.info('🔬 Analyzing skill gaps (self-sufficient mode)', {
        userId: req.user.id,
        jobTitle: jobData.title,
        hasSkills: !!cvData.skills,
      });

      // ✅ Use self-sufficient AI service (PhoBERT + Sentence-BERT)
      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      
      const skillGapAnalysis = await selfSufficientAI.analyzeSkillGaps(
        cvData,
        jobData
      );

      return ApiResponse.success(
        res,
        skillGapAnalysis,
        'Skill gap analysis completed'
      );
    } catch (error) {
      logger.error('Skill gap analysis error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });
      next(new AppError('Failed to analyze skill gaps', 500));
    }
  }

  /**
   * POST /api/ai/skill-roadmap
   * Tạo lộ trình học tập/phát triển kỹ năng
   * 
   * @deprecated This endpoint is deprecated. Use /api/nlp/learning-roadmap instead for full CRUD operations, progress tracking, feedback, and resource recommendations.
   */
  async generateSkillRoadmap(req, res) {
    const userId = req.user.id;
    const {
      targetRole,
      targetSkills,
      timeframe = 12,
      currentLevel = 'beginner',
      targetJobTitle,
      targetJobDescription,
      skillGaps,
      learningPreferences,
    } = req.body;

    try {
      // Deprecation warning
      logger.warn('Deprecated endpoint /api/ai/skill-roadmap called. Consider using /api/nlp/learning-roadmap instead.', {
        userId: req.user.id,
        endpoint: '/api/ai/skill-roadmap'
      });
      if (
        !targetRole &&
        (!targetSkills || targetSkills.length === 0) &&
        !targetJobTitle
      ) {
        return ApiResponse.error(
          res,
          'Please provide either a target role, target skills, or target job',
          400
        );
      }

      const user = await User.findById(userId);
      const profile = await CandidateProfile.findOne({ userId });

      if (!user && !profile) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      let roadmap;

      // Case 1: Generate from target role/skills (legacy)
      if (targetRole || targetSkills) {
        const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
        const selfSufficientAI = getSelfSufficientAIService();
        roadmap = await selfSufficientAI.generateSkillRoadmap({
          user,
          targetRole,
          targetSkills,
          timeframe: parseInt(timeframe),
          currentLevel,
        });
        logger.info('🗺️ Skill roadmap generated (self-sufficient mode - deprecated)');
      }
      // Case 2: Generate from job description và skill gaps (advanced)
      else if (targetJobTitle || targetJobDescription) {
        const cvData = this.extractCVData(profile);

        const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
        const selfSufficientAI = getSelfSufficientAIService();
        roadmap = await selfSufficientAI.generateLearningRoadmap({
          currentSkills: cvData.skills,
          targetJob: {
            title: targetJobTitle,
            description: targetJobDescription,
          },
          skillGaps,
          timeframe: timeframe ? `${timeframe} weeks` : '12 weeks',
          preferences: learningPreferences || {},
        });
        logger.info('📚 Learning roadmap generated (self-sufficient mode - deprecated)');

        // Save roadmap to profile
        if (profile) {
          profile.skillRoadmap = {
            ...roadmap,
            createdAt: new Date(),
            targetJob: {
              title: targetJobTitle,
              description: targetJobDescription,
            },
          };
          await profile.save();
        }
      }

      logger.info(`Skill roadmap generated for user ${userId}`, {
        targetRole: targetRole || targetJobTitle,
        timeframe,
        skillsCount: roadmap.skills?.length || 0,
        deprecated: true,
      });

      return ApiResponse.success(
        res,
        {
          ...roadmap,
          _deprecationWarning: {
            message: 'This endpoint is deprecated. Use /api/nlp/learning-roadmap instead for full CRUD operations, progress tracking, feedback, and resource recommendations.',
            alternativeEndpoint: '/api/nlp/learning-roadmap',
            reason: 'Full CRUD operations, progress tracking, feedback, and resource recommendations'
          }
        },
        'Skill roadmap generated successfully'
      );
    } catch (error) {
      logger.error('Skill roadmap generation error:', error);
      return ApiResponse.error(res, 'Failed to generate skill roadmap', 500);
    }
  }

  /**
   * POST /api/ai/suggestions
   * Lấy gợi ý AI cho các trường form (career objective, skills, experience, etc.)
   */
  async getAISuggestions(req, res, next) {
    try {
      const { stepType, currentData, context } = req.body;

      let suggestions = {};

      switch (stepType) {
        case 'targetJob':
          const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI = getSelfSufficientAIService();
          suggestions = await selfSufficientAI.getJobSuggestions(currentData.title);
          break;

        case 'careerObjective':
          const { getSelfSufficientAIService: getSelfSufficientAIService2 } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI2 = getSelfSufficientAIService2();
          suggestions = await selfSufficientAI2.generateCareerObjective(
            currentData,
            context
          );
          break;

        case 'skills':
          const { getSelfSufficientAIService: getSelfSufficientAIService3 } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI3 = getSelfSufficientAIService3();
          suggestions = await selfSufficientAI3.suggestSkills(
            context.targetJob,
            context.experience
          );
          break;

        case 'experience':
          const { getSelfSufficientAIService: getSelfSufficientAIService4 } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI4 = getSelfSufficientAIService4();
          suggestions = await selfSufficientAI4.enhanceExperienceDescription(
            currentData
          );
          break;

        default:
          return ApiResponse.error(res, 'Invalid step type', 400);
      }

      return ApiResponse.success(
        res,
        { suggestions },
        'AI suggestions generated successfully'
      );
    } catch (error) {
      console.error('AI suggestions error:', error);
      return ApiResponse.error(res, 'Failed to generate AI suggestions', 500);
    }
  }

  // ========================================
  // INSIGHTS & ANALYTICS ENDPOINTS
  // ========================================

  /**
   * GET /api/ai/insights
   * Lấy AI insights dựa trên role (candidate/employer/admin)
   */
  async getAIInsights(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let insights = {};

      if (userRole === 'candidate') {
        return this.getCandidateInsights(req, res);
      } else if (userRole === 'employer') {
        return this.getEmployerInsights(req, res);
      } else if (userRole === 'admin') {
        insights = {
          platformStats: await aiService.getPlatformStatistics(),
          userBehavior: await aiService.getUserBehaviorInsights(),
          systemPerformance: await aiService.getSystemPerformanceMetrics(),
          trends: await aiService.getPlatformTrends(),
        };
      } else {
        return ApiResponse.error(res, 'Invalid user role', 400);
      }

      logger.info(`AI insights generated for user ${userId}`, {
        role: userRole,
      });

      return ApiResponse.success(
        res,
        insights,
        'AI insights generated successfully'
      );
    } catch (error) {
      logger.error('AI insights error:', error);
      return ApiResponse.error(res, 'Failed to generate AI insights', 500);
    }
  }

  /**
   * GET /api/ai/candidate-insights
   * Lấy insights cho candidate
   */
  async getCandidateInsights(req, res) {
    const userId = req.user.id;

    try {
      const user = await User.findById(userId);
      const applications = await Application.find({ applicant: userId })
        .populate('job', 'title company')
        .sort({ createdAt: -1 })
        .limit(10);

      const insights = {
        profileStrength: await aiService.calculateProfileStrength(user),
        skillGaps: await aiService.identifySkillGaps(user),
        applicationInsights: {
          totalApplications: applications.length,
          averageScore:
            applications.reduce(
              (acc, app) => acc + (app.aiAnalysis?.overallScore || 0),
              0
            ) / Math.max(applications.length, 1),
          topMatchingJobs: applications
            .filter(app => app.aiAnalysis?.overallScore > 80)
            .map(app => ({
              job: app.job,
              score: app.aiAnalysis.overallScore,
            })),
        },
        recommendations: {
          skillsToImprove: await aiService.getSkillRecommendations(user),
          careerSuggestions: await aiService.getCareerSuggestions(user),
        },
      };

      logger.info(`Candidate insights generated for user ${userId}`);

      return ApiResponse.success(
        res,
        insights,
        'Candidate insights generated successfully'
      );
    } catch (error) {
      logger.error('Candidate insights error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate candidate insights',
        500
      );
    }
  }

  /**
   * GET /api/ai/employer-insights
   * Lấy insights cho employer
   */
  async getEmployerInsights(req, res) {
    const userId = req.user.id;

    try {
      const jobs = await Job.find({ postedBy: userId });
      const applications = await Application.find({
        job: { $in: jobs.map(j => j._id) },
      }).populate('applicant', 'firstName lastName');

      const insights = {
        jobPerformance: await aiService.analyzeJobPerformance(jobs),
        applicantInsights: await aiService.getApplicantInsights(applications),
        marketTrends: await aiService.getMarketTrends(),
        recommendations: {
          jobOptimization: await aiService.getJobOptimizationTips(jobs),
          talentPool: await aiService.getTalentPoolInsights(),
        },
      };

      logger.info(`Employer insights generated for user ${userId}`);

      return ApiResponse.success(
        res,
        insights,
        'Employer insights generated successfully'
      );
    } catch (error) {
      logger.error('Employer insights error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate employer insights',
        500
      );
    }
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * POST /api/ai/batch-analyze-applications
   * Phân tích hàng loạt ứng viên cho một công việc
   */
  async batchAnalyzeApplications(req, res) {
    const { jobId } = req.body;
    const userId = req.user.id;

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      if (job.postedBy.toString() !== userId && req.user.role !== 'admin') {
        return ApiResponse.error(
          res,
          'Not authorized to analyze applications for this job',
          403
        );
      }

      const applications = await Application.find({ job: jobId }).populate(
        'applicant',
        'firstName lastName skills experience education'
      );

      if (applications.length === 0) {
        return ApiResponse.success(
          res,
          {
            message: 'No applications found for this job',
            analyzed: 0,
          },
          'No applications found'
        );
      }

      const analysisResults = [];
      for (const application of applications) {
        try {
          const matchScore = await aiService.calculateMatchScore(
            application.applicant,
            job
          );

          application.aiAnalysis = {
            ...application.aiAnalysis,
            ...matchScore,
            lastAnalyzed: new Date(),
          };

          await application.save();
          analysisResults.push({
            applicationId: application._id,
            applicantName: application.applicant.fullName,
            score: matchScore.overallScore,
            status: 'analyzed',
          });
        } catch (error) {
          logger.error(
            `Error analyzing application ${application._id}:`,
            error
          );
          analysisResults.push({
            applicationId: application._id,
            applicantName: application.applicant.fullName,
            status: 'error',
            error: error.message,
          });
        }
      }

      logger.info(`Batch analysis completed for job ${jobId}`, {
        totalApplications: applications.length,
        successful: analysisResults.filter(r => r.status === 'analyzed').length,
      });

      return ApiResponse.success(
        res,
        {
          jobTitle: job.title,
          totalApplications: applications.length,
          analyzed: analysisResults.filter(r => r.status === 'analyzed').length,
          errors: analysisResults.filter(r => r.status === 'error').length,
          results: analysisResults,
        },
        'Batch analysis completed successfully'
      );
    } catch (error) {
      logger.error('Batch analysis error:', error);
      return ApiResponse.error(res, 'Batch analysis failed', 500);
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Extract CV data từ CandidateProfile
   */
  extractCVData(profile) {
    return {
      personalInfo: profile.personalInfo || {},
      skills: this.formatSkills(profile.skills || {}),
      experience: this.getAllExperience(profile.experience || {}),
      education: this.getAllEducation(profile.education || {}),
      projects: profile.projects || [],
      certifications: profile.certifications || [],
      summary: profile.personalInfo?.bio || '',
      targetJob: profile.targetJob || {},
    };
  }

  /**
   * Format skills theo cấu trúc chuẩn
   */
  formatSkills(skills) {
    return {
      technical: skills?.technical || [],
      soft: skills?.soft || [],
      languages: skills?.languages || [],
    };
  }

  /**
   * Lấy tất cả experience từ các loại khác nhau
   */
  getAllExperience(experience) {
    const allExp = [];
    if (experience) {
      ['internships', 'fulltime', 'parttime', 'freelance'].forEach(type => {
        if (experience[type]) {
          experience[type].forEach(exp => allExp.push(exp));
        }
      });
    }
    return allExp.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  /**
   * Lấy tất cả education
   */
  getAllEducation(education) {
    const allEdu = [];
    if (education?.university) allEdu.push(education.university);
    if (education?.highSchool) allEdu.push(education.highSchool);
    return allEdu;
  }

  // ========================================
  // NAVIGATION INTENT RECOGNITION (DIALOGFLOW)
  // ========================================

  /**
   * Recognize navigation intent từ natural language input
   * Sử dụng Dialogflow CX với fallback rule-based
   * 
   * @swagger
   * /api/ai/navigate-intent:
   *   post:
   *     summary: Recognize navigation intent from natural language (Dialogflow)
   *     tags: [AI - Navigation]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - input
   *             properties:
   *               input:
   *                 type: string
   *                 example: "tôi muốn tìm các job ở sài gòn"
   *               frontend:
   *                 type: string
   *                 enum: [fe, fe-employer]
   *                 default: fe
   *               sessionId:
   *                 type: string
   *                 description: Optional session ID for Dialogflow context
   *     responses:
   *       200:
   *         description: Intent recognized successfully
   *       400:
   *         description: Invalid input
   */
  recognizeNavigationIntent = asyncHandler(async (req, res) => {
    const { input, frontend = 'fe', sessionId } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Input is required and must be a non-empty string'
      });
    }

    try {
      // Recognize intent với Dialogflow (hoặc fallback)
      // Services đã được require ở top level để đảm bảo initialization khi server start
      const intentResult = await dialogflowIntentService.recognizeIntent(
        input.trim(),
        frontend,
        sessionId || `session-${req.user?.id || 'anonymous'}-${Date.now()}`
      );

      if (!intentResult.success) {
        return res.status(200).json({
          success: false,
          error: intentResult.error || 'Could not recognize intent',
          suggestions: intentResult.suggestions || [
            'Tìm việc làm',
            'Tạo CV online',
            'Xem thông tin cá nhân',
            'Về trang chủ'
          ],
          originalInput: input
        });
      }

      // Build navigation URL từ intent + parameters
      const navigation = navigationService.buildNavigationUrl(
        intentResult.intent,
        intentResult.parameters || {},
        frontend
      );

      res.json({
        success: true,
        intent: intentResult.intent,
        route: navigation.route,
        url: navigation.url,
        params: navigation.params,
        confidence: intentResult.confidence || 0.8,
        method: intentResult.method || 'unknown',
        fulfillmentText: intentResult.fulfillmentText,
        originalInput: input
      });
    } catch (error) {
      logger.error('❌ Navigation intent recognition error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  });
}

module.exports = new AIController();
