/**
 * CVParser
 * Domain: AI/NLP
 * Service for parsing and extracting information from CVs/resumes
 */
class CVParser {
  constructor(props) {
    this._nlpEngine = props.nlpEngine;
    this._skillRepository = props.skillRepository;
    this._educationRepository = props.educationRepository;
  }

  /**
   * Parse CV content and extract structured information
   * @param {string} cvContent - Raw CV text content
   * @param {string} contentType - Type of content ('text', 'pdf', 'docx', etc.)
   * @returns {Promise<Object>} Parsed CV data
   */
  async parseCV(cvContent, contentType = 'text') {
    if (!cvContent || typeof cvContent !== 'string') {
      throw new Error('CV content is required and must be a string');
    }

    try {
      // Preprocess content based on type
      const processedContent = await this._preprocessContent(
        cvContent,
        contentType
      );

      // Extract information using NLP engine
      const extractedInfo = await this._nlpEngine.extractCandidateInfo(
        processedContent
      );

      // Enrich and validate extracted data
      const enrichedData = await this._enrichExtractedData(extractedInfo);

      // Structure the final CV data
      return {
        personalInfo: this._extractPersonalInfo(processedContent),
        summary: extractedInfo.summary,
        skills: enrichedData.skills,
        experience: enrichedData.experience,
        education: enrichedData.education,
        certifications: this._extractCertifications(processedContent),
        languages: this._extractLanguages(processedContent),
        projects: this._extractProjects(processedContent),
        metadata: {
          parsedAt: new Date(),
          contentType,
          contentLength: cvContent.length,
          confidence: this._calculateOverallConfidence(enrichedData),
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse CV: ${error.message}`);
    }
  }

  /**
   * Extract skills from CV with validation against master data
   * @param {string} cvContent - CV content
   * @returns {Promise<Array>} Validated skills
   */
  async extractSkills(cvContent) {
    const extractedSkills = await this._nlpEngine.extractSkills(cvContent);
    return await this._validateAndEnrichSkills(extractedSkills);
  }

  /**
   * Extract work experience from CV
   * @param {string} cvContent - CV content
   * @returns {Promise<Array>} Work experience entries
   */
  async extractExperience(cvContent) {
    const extractedInfo = await this._nlpEngine.extractCandidateInfo(cvContent);
    return this._structureExperience(extractedInfo.experience);
  }

  /**
   * Extract education history from CV
   * @param {string} cvContent - CV content
   * @returns {Promise<Array>} Education entries
   */
  async extractEducation(cvContent) {
    const extractedInfo = await this._nlpEngine.extractCandidateInfo(cvContent);
    return this._structureEducation(extractedInfo.education);
  }

  /**
   * Preprocess CV content based on type
   * @param {string} content - Raw content
   * @param {string} contentType - Content type
   * @returns {Promise<string>} Processed content
   */
  async _preprocessContent(content, contentType) {
    // Basic preprocessing - in production, this would handle PDF, DOCX, etc.
    let processed = content;

    // Remove excessive whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    // Remove common CV artifacts
    processed = processed.replace(/[^\w\s.,;:!?()-]/g, ' ');

    // Normalize line breaks
    processed = processed.replace(/[\r\n]+/g, '\n');

    return processed;
  }

  /**
   * Enrich extracted data with additional processing
   * @param {Object} extractedInfo - Raw extracted information
   * @returns {Promise<Object>} Enriched data
   */
  async _enrichExtractedData(extractedInfo) {
    return {
      skills: await this._validateAndEnrichSkills(extractedInfo.skills),
      experience: this._structureExperience(extractedInfo.experience),
      education: this._structureEducation(extractedInfo.education),
    };
  }

  /**
   * Validate skills against master data and enrich with additional info
   * @param {Array} extractedSkills - Raw extracted skills
   * @returns {Promise<Array>} Validated and enriched skills
   */
  async _validateAndEnrichSkills(extractedSkills) {
    const enrichedSkills = [];

    for (const extractedSkill of extractedSkills) {
      try {
        // Try to find matching skill in master data
        const masterSkill = await this._skillRepository.findByNameOrAlias(
          extractedSkill.skill
        );

        if (masterSkill) {
          enrichedSkills.push({
            skillId: masterSkill.skillId,
            name: masterSkill.skillName,
            confidence: extractedSkill.confidence,
            category: masterSkill.category || extractedSkill.category,
            proficiency: this._estimateProficiency(
              extractedSkill.skill,
              extractedSkill.confidence
            ),
          });
        } else {
          // Keep extracted skill if not in master data
          enrichedSkills.push({
            skillId: null,
            name: extractedSkill.skill,
            confidence: extractedSkill.confidence * 0.8, // Lower confidence for unmatched skills
            category: extractedSkill.category,
            proficiency: this._estimateProficiency(
              extractedSkill.skill,
              extractedSkill.confidence
            ),
          });
        }
      } catch (error) {
        // If skill validation fails, keep the extracted skill
        enrichedSkills.push({
          skillId: null,
          name: extractedSkill.skill,
          confidence: extractedSkill.confidence * 0.5,
          category: extractedSkill.category,
          proficiency: 'beginner',
        });
      }
    }

    return enrichedSkills;
  }

  /**
   * Structure experience entries
   * @param {Array} rawExperience - Raw experience data
   * @returns {Array} Structured experience
   */
  _structureExperience(rawExperience) {
    return rawExperience.map(exp => ({
      company: this._extractCompanyName(exp.period + ' ' + exp.description),
      position: this._extractPosition(exp.period + ' ' + exp.description),
      period: exp.period,
      description: exp.description,
      technologies: this._extractTechnologies(exp.description),
      achievements: this._extractAchievements(exp.description),
    }));
  }

  /**
   * Structure education entries
   * @param {Array} rawEducation - Raw education data
   * @returns {Array} Structured education
   */
  _structureEducation(rawEducation) {
    return rawEducation.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      field: this._extractFieldOfStudy(edu.institution),
      graduationYear: this._extractGraduationYear(edu.institution),
      gpa: null, // Would need more sophisticated extraction
    }));
  }

  /**
   * Extract personal information from CV
   * @param {string} content - CV content
   * @returns {Object} Personal information
   */
  _extractPersonalInfo(content) {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return {
      name: this._extractName(lines),
      email: this._extractEmail(content),
      phone: this._extractPhone(content),
      location: this._extractLocation(content),
      linkedin: this._extractLinkedIn(content),
      github: this._extractGitHub(content),
    };
  }

  /**
   * Extract certifications from CV
   * @param {string} content - CV content
   * @returns {Array} Certifications
   */
  _extractCertifications(content) {
    const certificationKeywords = [
      'certification',
      'certificate',
      'certified',
      'license',
    ];
    const lines = content.split('\n');
    const certifications = [];

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (certificationKeywords.some(keyword => lowerLine.includes(keyword))) {
        certifications.push(line.trim());
      }
    });

    return certifications;
  }

  /**
   * Extract languages from CV
   * @param {string} content - CV content
   * @returns {Array} Languages
   */
  _extractLanguages(content) {
    const commonLanguages = [
      'english',
      'french',
      'german',
      'spanish',
      'chinese',
      'japanese',
      'korean',
      'vietnamese',
    ];
    const foundLanguages = [];

    commonLanguages.forEach(language => {
      if (content.toLowerCase().includes(language)) {
        foundLanguages.push({
          language: language.charAt(0).toUpperCase() + language.slice(1),
          proficiency: this._estimateLanguageProficiency(content, language),
        });
      }
    });

    return foundLanguages;
  }

  /**
   * Extract projects from CV
   * @param {string} content - CV content
   * @returns {Array} Projects
   */
  _extractProjects(content) {
    const projectKeywords = [
      'project',
      'developed',
      'built',
      'created',
      'implemented',
    ];
    const lines = content.split('\n');
    const projects = [];

    let currentProject = null;
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (projectKeywords.some(keyword => lowerLine.includes(keyword))) {
        if (currentProject) {
          projects.push(currentProject);
        }
        currentProject = {
          name: line.trim(),
          description: '',
          technologies: [],
        };
      } else if (currentProject) {
        currentProject.description += line.trim() + ' ';
        currentProject.technologies = this._extractTechnologies(line);
      }
    });

    if (currentProject) {
      projects.push(currentProject);
    }

    return projects.slice(0, 5);
  }

  /**
   * Extract name from CV lines
   * @param {Array} lines - CV lines
   * @returns {string|null} Name
   */
  _extractName(lines) {
    // Simple heuristic: first non-empty line that's not too long
    for (const line of lines.slice(0, 3)) {
      if (
        line.length > 0 &&
        line.length < 50 &&
        !line.includes('@') &&
        !line.match(/\d/)
      ) {
        return line;
      }
    }
    return null;
  }

  /**
   * Extract email from content
   * @param {string} content - Content
   * @returns {string|null} Email
   */
  _extractEmail(content) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = content.match(emailRegex);
    return match ? match[0] : null;
  }

  /**
   * Extract phone from content
   * @param {string} content - Content
   * @returns {string|null} Phone
   */
  _extractPhone(content) {
    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/;
    const match = content.match(phoneRegex);
    return match ? match[0] : null;
  }

  /**
   * Extract location from content
   * @param {string} content - Content
   * @returns {string|null} Location
   */
  _extractLocation(content) {
    // Simple extraction - would need more sophisticated NLP in production
    const locationKeywords = ['hanoi', 'ho chi minh', 'da nang', 'vietnam'];
    for (const keyword of locationKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    return null;
  }

  /**
   * Extract LinkedIn profile
   * @param {string} content - Content
   * @returns {string|null} LinkedIn URL
   */
  _extractLinkedIn(content) {
    const linkedinRegex = /linkedin\.com\/in\/[A-Za-z0-9_-]+/;
    const match = content.match(linkedinRegex);
    return match ? `https://www.${match[0]}` : null;
  }

  /**
   * Extract GitHub profile
   * @param {string} content - Content
   * @returns {string|null} GitHub URL
   */
  _extractGitHub(content) {
    const githubRegex = /github\.com\/[A-Za-z0-9_-]+/;
    const match = content.match(githubRegex);
    return match ? `https://www.${match[0]}` : null;
  }

  /**
   * Extract company name from experience text
   * @param {string} text - Experience text
   * @returns {string|null} Company name
   */
  _extractCompanyName(text) {
    // Simple extraction - look for common company patterns
    const companyPatterns = [
      /at\s+([A-Z][A-Za-z\s&]+?)(?:\s|$)/i,
      /\@\s*([A-Z][A-Za-z\s&]+?)(?:\s|$)/i,
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract position from experience text
   * @param {string} text - Experience text
   * @returns {string|null} Position
   */
  _extractPosition(text) {
    // Look for common position indicators
    const positionPatterns = [
      /^([A-Z][A-Za-z\s]+?)(?:\s+at|\s+\@)/i,
      /([A-Z][A-Za-z\s]+?)(?:\s+-|\s+\/)/i,
    ];

    for (const pattern of positionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract technologies from text
   * @param {string} text - Text content
   * @returns {Array} Technologies
   */
  _extractTechnologies(text) {
    const technologies = [];
    const techKeywords = [
      'javascript',
      'python',
      'java',
      'react',
      'node.js',
      'sql',
      'aws',
      'docker',
    ];

    techKeywords.forEach(tech => {
      if (text.toLowerCase().includes(tech)) {
        technologies.push(tech);
      }
    });

    return technologies;
  }

  /**
   * Extract achievements from experience description
   * @param {string} description - Experience description
   * @returns {Array} Achievements
   */
  _extractAchievements(description) {
    const achievementIndicators = [
      'achieved',
      'improved',
      'increased',
      'reduced',
      'developed',
      'led',
    ];
    const sentences = description.split(/[.;]/);

    return sentences
      .filter(sentence =>
        achievementIndicators.some(indicator =>
          sentence.toLowerCase().includes(indicator)
        )
      )
      .map(sentence => sentence.trim())
      .slice(0, 3);
  }

  /**
   * Extract field of study from education text
   * @param {string} text - Education text
   * @returns {string|null} Field of study
   */
  _extractFieldOfStudy(text) {
    const fields = [
      'computer science',
      'engineering',
      'business',
      'mathematics',
      'physics',
    ];
    const lowerText = text.toLowerCase();

    for (const field of fields) {
      if (lowerText.includes(field)) {
        return field.charAt(0).toUpperCase() + field.slice(1);
      }
    }

    return null;
  }

  /**
   * Extract graduation year from education text
   * @param {string} text - Education text
   * @returns {number|null} Graduation year
   */
  _extractGraduationYear(text) {
    const yearRegex = /\b(20\d{2}|19\d{2})\b/;
    const match = text.match(yearRegex);
    return match ? parseInt(match[0]) : null;
  }

  /**
   * Estimate skill proficiency level
   * @param {string} skill - Skill name
   * @param {number} confidence - Confidence score
   * @returns {string} Proficiency level
   */
  _estimateProficiency(skill, confidence) {
    if (confidence > 0.8) return 'expert';
    if (confidence > 0.6) return 'advanced';
    if (confidence > 0.4) return 'intermediate';
    return 'beginner';
  }

  /**
   * Estimate language proficiency
   * @param {string} content - Content
   * @param {string} language - Language name
   * @returns {string} Proficiency level
   */
  _estimateLanguageProficiency(content, language) {
    const proficiencyIndicators = {
      native: ['native', 'mother tongue', 'fluent'],
      advanced: ['advanced', 'proficient', 'business level'],
      intermediate: ['intermediate', 'conversational', 'working knowledge'],
      beginner: ['basic', 'elementary', 'limited'],
    };

    const lowerContent = content.toLowerCase();
    for (const [level, indicators] of Object.entries(proficiencyIndicators)) {
      if (indicators.some(indicator => lowerContent.includes(indicator))) {
        return level;
      }
    }

    return 'intermediate'; // Default
  }

  /**
   * Calculate overall confidence score for parsed CV
   * @param {Object} enrichedData - Enriched data
   * @returns {number} Overall confidence (0-1)
   */
  _calculateOverallConfidence(enrichedData) {
    const skillConfidence =
      enrichedData.skills.reduce((sum, skill) => sum + skill.confidence, 0) /
      Math.max(enrichedData.skills.length, 1);
    const experienceCount = enrichedData.experience.length;
    const educationCount = enrichedData.education.length;

    // Weighted confidence calculation
    const confidence =
      skillConfidence * 0.4 +
      Math.min(experienceCount / 3, 1) * 0.3 +
      Math.min(educationCount / 2, 1) * 0.3;

    return Math.min(confidence, 1);
  }
}

module.exports = CVParser;
