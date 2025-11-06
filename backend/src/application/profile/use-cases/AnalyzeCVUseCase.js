const { logger } = require('../../../shared/utils/logger');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ANALYSIS_STATUS = require('../../../domain/ai-matching/enums/AnalysisStatus');

/**
 * AnalyzeCVUseCase
 * Analyze CV content using AI/NLP services
 * Downloads CV file, extracts text, and performs keyword-based extraction
 */
class AnalyzeCVUseCase {
  constructor(cvRepository, candidateRepository, cvParserService) {
    this.cvRepository = cvRepository;
    this.candidateRepository = candidateRepository;
    this.cvParserService = cvParserService; // Infrastructure service for file parsing
  }

  async execute({ cvId, candidateId }) {
    try {
      // Validate required parameters
      if (!cvId) {
        throw new Error('MISSING_CV_ID');
      }

      if (!candidateId) {
        throw new Error('MISSING_CANDIDATE_ID');
      }

      // Find CV
      const cv = await this.cvRepository.findById(cvId);
      if (!cv) {
        throw new Error('CV_NOT_FOUND');
      }

      // Verify CV belongs to candidate
      logger.info('CV ownership check:', {
        cvCandidateId: cv.candidateId?.toString(),
        requestCandidateId: candidateId?.toString(),
        match: cv.candidateId?.toString() === candidateId?.toString(),
      });

      if (cv.candidateId.toString() !== candidateId.toString()) {
        throw new Error('CV_ACCESS_DENIED');
      }

      // Check if CV is active
      if (!cv.isActive) {
        throw new Error('CV_INACTIVE');
      }

      logger.info('Analyzing CV:', {
        cvId,
        candidateId,
        fileName: cv.originalName,
        fileUrl: cv.fileUrl,
        hasFileUrl: !!cv.fileUrl,
      });

      // Check if CV has file URL
      if (!cv.fileUrl || cv.fileUrl === '' || cv.fileUrl === null) {
        logger.error('CV file URL is missing or invalid:', {
          cvId,
          fileName: cv.originalName,
          fileUrl: cv.fileUrl,
          suggestion: 'Please re-upload the CV file',
        });
        throw new Error(
          'CV_FILE_URL_MISSING: CV file has not been uploaded yet. Please upload the CV file first before analyzing.'
        );
      }

      // Update status to in progress
      await this.cvRepository.updateAnalysisStatus(
        cvId,
        ANALYSIS_STATUS.IN_PROGRESS
      );

      try {
        // Download CV file from URL
        logger.info('Downloading CV file:', { fileUrl: cv.fileUrl });
        const response = await axios.get(cv.fileUrl, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 seconds timeout
        });

        const fileBuffer = Buffer.from(response.data);
        logger.info('CV file downloaded:', {
          size: fileBuffer.length,
          mimetype: response.headers['content-type'],
        });

        // Save to temporary file for parsing
        const tempDir = os.tmpdir();
        const tempFileName = `cv_${cvId}_${Date.now()}${path.extname(
          cv.originalName
        )}`;
        const tempFilePath = path.join(tempDir, tempFileName);

        await fs.writeFile(tempFilePath, fileBuffer);
        logger.info('CV saved to temporary file:', { tempFilePath });

        try {
          // Step 1: Extract text from CV file using CVParserService
          const parseResult = await this.cvParserService.parseCV(tempFilePath);

          if (!parseResult.success || !parseResult.text) {
            throw new Error('Failed to extract text from CV file');
          }

          logger.info('CV text extracted:', {
            textLength: parseResult.text.length,
            metadata: parseResult.metadata,
          });

          // Step 2: Extract structured information using keyword-based approach
          const extractedData = this._basicExtraction(parseResult.text);

          logger.info('CV analysis completed:', {
            hasExtractedData: !!extractedData,
            confidence: extractedData.confidence,
            skillsFound: extractedData.skills?.length || 0,
          });

          // Update CV with parsed data
          const updateData = {
            analysisStatus: ANALYSIS_STATUS.COMPLETED,
            analyzedAt: new Date(),
            parsedData: extractedData,
            parsingConfidence: extractedData.confidence,
          };

          await this.cvRepository.update(cvId, updateData);

          // Optionally update candidate profile with parsed information
          if (extractedData && cv.isDefault) {
            await this.updateCandidateProfileFromCV(candidateId, extractedData);
          }

          logger.info('CV analysis completed successfully:', {
            cvId,
            candidateId,
          });

          const analysis = {
            cvId: cv._id || cv.id,
            fileName: cv.originalName,
            fileUrl: cv.fileUrl,
            uploadedAt: cv.createdAt,
            analyzedAt: updateData.analyzedAt,
            analysisStatus: ANALYSIS_STATUS.COMPLETED,
            extracted: extractedData,
            confidence: extractedData.confidence,
            textLength: parseResult.text.length,
          };

          return {
            success: true,
            message: 'CV analysis completed successfully',
            analysis,
          };
        } finally {
          // Clean up temporary file
          try {
            await fs.unlink(tempFilePath);
            logger.info('Temporary file cleaned up:', { tempFilePath });
          } catch (unlinkError) {
            logger.warn('Failed to clean up temporary file:', {
              error: unlinkError.message,
              tempFilePath,
            });
          }
        }
      } catch (parseError) {
        logger.error('CV parsing failed:', {
          error: parseError.message,
          cvId,
          candidateId,
        });

        // Update status to failed
        await this.cvRepository.updateAnalysisStatus(
          cvId,
          ANALYSIS_STATUS.FAILED
        );

        throw new Error(
          `CV_PARSING_FAILED: ${parseError.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      logger.error('Analyze CV failed:', {
        error: error.message,
        cvId,
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Calculate confidence score from NLP result
   * @private
   */
  _calculateConfidence(nlpResult) {
    let score = 0;
    let factors = 0;

    if (nlpResult.skills && nlpResult.skills.length > 0) {
      score += 0.3;
      factors++;
    }
    if (nlpResult.experience && nlpResult.experience.length > 0) {
      score += 0.3;
      factors++;
    }
    if (nlpResult.education && nlpResult.education.length > 0) {
      score += 0.2;
      factors++;
    }
    if (nlpResult.summary || nlpResult.objective) {
      score += 0.2;
      factors++;
    }

    return factors > 0 ? score : 0.3; // Minimum confidence
  }

  /**
   * Basic keyword extraction when NLP is not available
   * @private
   */
  _basicExtraction(text) {
    const lowerText = text.toLowerCase();

    // Extract skills section
    const skills = this._extractSkills(text, lowerText);

    // Extract experience section
    const experience = this._extractExperience(text, lowerText);

    // Extract education section
    const education = this._extractEducation(text, lowerText);

    // Calculate confidence based on extracted data
    let confidence = 0.3;
    if (skills.length > 0) confidence += 0.2;
    if (experience.length > 0) confidence += 0.3;
    if (education.length > 0) confidence += 0.2;

    return {
      raw_text: text,
      skills,
      experience,
      education,
      confidence: Math.min(confidence, 0.9),
      note: 'Rule-based extraction with section parsing',
    };
  }

  /**
   * Extract skills from CV text
   * @private
   */
  _extractSkills(text, lowerText) {
    const skills = [];

    // Common technical skills
    const technicalSkills = [
      'javascript',
      'typescript',
      'java',
      'python',
      'c++',
      'c#',
      'php',
      'ruby',
      'go',
      'rust',
      'react',
      'angular',
      'vue',
      'svelte',
      'next.js',
      'nuxt.js',
      'node.js',
      'express',
      'nestjs',
      'spring boot',
      'django',
      'flask',
      'laravel',
      'mysql',
      'postgresql',
      'mongodb',
      'redis',
      'elasticsearch',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'jenkins',
      'gitlab ci',
      'github actions',
      'git',
      'svn',
      'agile',
      'scrum',
      'jira',
      'confluence',
      'html',
      'css',
      'sass',
      'tailwind',
      'bootstrap',
      'restful api',
      'graphql',
      'microservices',
      'websocket',
      'junit',
      'jest',
      'mocha',
      'pytest',
      'selenium',
    ];

    // Soft skills (Vietnamese)
    const softSkills = [
      'giao tiếp',
      'làm việc nhóm',
      'lãnh đạo',
      'quản lý thời gian',
      'giải quyết vấn đề',
      'tư duy logic',
      'sáng tạo',
      'trách nhiệm',
      'communication',
      'teamwork',
      'leadership',
      'time management',
      'problem solving',
      'critical thinking',
      'creativity',
    ];

    // Find skills section
    const skillSectionMatch = text.match(
      /(?:kỹ năng|skills?)(.*?)(?=\n[A-Z][^a-z\n]{5,}|$)/is
    );
    const skillSection = skillSectionMatch ? skillSectionMatch[1] : text;
    const skillSectionLower = skillSection.toLowerCase();

    // Extract technical skills
    technicalSkills.forEach(skill => {
      if (skillSectionLower.includes(skill.toLowerCase())) {
        skills.push({
          name: skill.charAt(0).toUpperCase() + skill.slice(1),
          category: 'technical',
          level: 'intermediate',
        });
      }
    });

    // Extract soft skills
    softSkills.forEach(skill => {
      if (skillSectionLower.includes(skill.toLowerCase())) {
        skills.push({
          name: skill.charAt(0).toUpperCase() + skill.slice(1),
          category: 'soft',
          level: 'intermediate',
        });
      }
    });

    // Remove duplicates
    return Array.from(
      new Map(skills.map(s => [s.name.toLowerCase(), s])).values()
    );
  }

  /**
   * Extract work experience from CV text
   * @private
   */
  _extractExperience(text, lowerText) {
    const experiences = [];

    // Find experience section
    const expMatch = text.match(
      /(?:kinh nghiệm làm việc|work experience|experience)(.*?)(?=\n(?:học vấn|education|kỹ năng|skills|chứng chỉ|certificates?)|$)/is
    );

    if (!expMatch) return experiences;

    const expSection = expMatch[1];
    const lines = expSection.split('\n').filter(l => l.trim());

    let currentExp = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Match position/title with date range (e.g., "Thực tập sinh chứng từ12/2024-04/2025")
      const positionMatch = trimmed.match(
        /^(.+?)(\d{1,2}\/\d{4}\s*-\s*(?:\d{1,2}\/\d{4}|nay|present|hiện tại))/i
      );

      if (positionMatch) {
        if (currentExp) experiences.push(currentExp);

        currentExp = {
          position: positionMatch[1].trim(),
          period: positionMatch[2].trim(),
          company: '',
          description: [],
        };
      } else if (currentExp && trimmed.startsWith('•')) {
        // Bullet point description
        currentExp.description.push(trimmed.substring(1).trim());
      } else if (currentExp && !currentExp.company && trimmed.length > 10) {
        // First non-bullet line after position is likely company name
        currentExp.company = trimmed;
      }
    });

    if (currentExp) experiences.push(currentExp);

    return experiences;
  }

  /**
   * Extract education from CV text
   * @private
   */
  _extractEducation(text, lowerText) {
    const education = [];

    // Find education section
    const eduMatch = text.match(
      /(?:học vấn|education)(.*?)(?=\n(?:kinh nghiệm|experience|kỹ năng|skills|chứng chỉ|certificates?)|$)/is
    );

    if (!eduMatch) return education;

    const eduSection = eduMatch[1];
    const lines = eduSection.split('\n').filter(l => l.trim());

    let currentEdu = null;

    lines.forEach(line => {
      const trimmed = line.trim();

      // Match degree with date range
      const degreeMatch = trimmed.match(
        /^(.+?)(\d{1,2}\/\d{4}\s*-\s*(?:\d{1,2}\/\d{4}|nay|present|hiện tại))/i
      );

      if (degreeMatch) {
        if (currentEdu) education.push(currentEdu);

        currentEdu = {
          degree: degreeMatch[1].trim(),
          period: degreeMatch[2].trim(),
          institution: '',
          details: [],
        };
      } else if (currentEdu && !currentEdu.institution && trimmed.length > 5) {
        // First line after degree is likely institution
        currentEdu.institution = trimmed;
      } else if (currentEdu && trimmed.length > 0) {
        // Additional details
        currentEdu.details.push(trimmed);
      }
    });

    if (currentEdu) education.push(currentEdu);

    return education;
  }

  /**
   * Update candidate profile with parsed CV data (for default CV only)
   * @private
   */
  async updateCandidateProfileFromCV(candidateId, extractedData) {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        logger.warn('Candidate not found for CV update:', { candidateId });
        return;
      }

      const updates = {};

      // Update skills if extracted
      if (extractedData.skills && extractedData.skills.length > 0) {
        updates.skills = extractedData.skills.map(skill => ({
          name: typeof skill === 'string' ? skill : skill.name,
          level: skill.level || 'intermediate',
        }));
      }

      // Update experience if extracted
      if (extractedData.experience && extractedData.experience.length > 0) {
        updates.experience = extractedData.experience.map(exp => ({
          company: exp.company || exp.organization,
          position: exp.position || exp.title || exp.role,
          startDate: exp.startDate || exp.from,
          endDate: exp.endDate || exp.to,
          description: exp.description || '',
          isCurrent: exp.isCurrent || !exp.endDate,
        }));
      }

      // Update education if extracted
      if (extractedData.education && extractedData.education.length > 0) {
        updates.education = extractedData.education.map(edu => ({
          institution: edu.institution || edu.school || edu.university,
          degree: edu.degree || edu.level,
          fieldOfStudy: edu.fieldOfStudy || edu.major || edu.field,
          startDate: edu.startDate || edu.from,
          endDate: edu.endDate || edu.to,
          grade: edu.grade || edu.gpa,
        }));
      }

      // Update personal info if extracted
      if (extractedData.personalInfo) {
        updates.personalInfo = {
          ...candidate.personalInfo,
          fullName:
            extractedData.personalInfo.name || candidate.personalInfo?.fullName,
          phone:
            extractedData.personalInfo.phone || candidate.personalInfo?.phone,
        };
      }

      // Update professional info if extracted
      if (extractedData.summary || extractedData.objective) {
        updates.professionalInfo = {
          ...candidate.professionalInfo,
          bio: extractedData.summary || extractedData.objective,
        };
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await this.candidateRepository.update(candidateId, updates);
        logger.info('Candidate profile updated from CV:', {
          candidateId,
          updatedFields: Object.keys(updates),
        });
      }
    } catch (error) {
      logger.error('Failed to update candidate profile from CV:', {
        error: error.message,
        candidateId,
      });
      // Don't throw - this is optional enhancement
    }
  }
}

module.exports = AnalyzeCVUseCase;
