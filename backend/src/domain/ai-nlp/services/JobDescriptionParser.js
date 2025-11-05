/**
 * JobDescriptionParser
 * Domain: AI/NLP
 * Service for parsing and extracting information from job descriptions
 */
class JobDescriptionParser {
  constructor(props) {
    this._nlpEngine = props.nlpEngine;
    this._skillRepository = props.skillRepository;
    this._industryRepository = props.industryRepository;
  }

  /**
   * Parse job description and extract structured information
   * @param {string} jobDescription - Raw job description text
   * @param {string} contentType - Type of content ('text', 'html', etc.)
   * @returns {Promise<Object>} Parsed job data
   */
  async parseJobDescription(jobDescription, contentType = 'text') {
    if (!jobDescription || typeof jobDescription !== 'string') {
      throw new Error('Job description is required and must be a string');
    }

    try {
      // Preprocess content based on type
      const processedContent = await this._preprocessContent(
        jobDescription,
        contentType
      );

      // Extract information using NLP engine
      const extractedInfo = await this._nlpEngine.extractJobRequirements(
        processedContent
      );

      // Enrich and validate extracted data
      const enrichedData = await this._enrichExtractedData(extractedInfo);

      // Structure the final job data
      return {
        title: this._extractJobTitle(processedContent),
        summary: extractedInfo.summary,
        requirements: enrichedData.requirements,
        responsibilities: this._extractResponsibilities(processedContent),
        skills: enrichedData.skills,
        experience: this._extractExperienceRequirements(processedContent),
        education: this._extractEducationRequirements(processedContent),
        salary: this._extractSalaryInfo(processedContent),
        location: this._extractLocation(processedContent),
        employmentType: this._extractEmploymentType(processedContent),
        industry: await this._extractIndustry(processedContent),
        benefits: this._extractBenefits(processedContent),
        metadata: {
          parsedAt: new Date(),
          contentType,
          contentLength: jobDescription.length,
          confidence: this._calculateOverallConfidence(enrichedData),
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse job description: ${error.message}`);
    }
  }

  /**
   * Extract required skills from job description
   * @param {string} jobDescription - Job description content
   * @returns {Promise<Array>} Required skills
   */
  async extractRequiredSkills(jobDescription) {
    const extractedSkills = await this._nlpEngine.extractSkills(jobDescription);
    return await this._validateAndEnrichSkills(extractedSkills, true); // true for required skills
  }

  /**
   * Extract job requirements from description
   * @param {string} jobDescription - Job description content
   * @returns {Promise<Array>} Job requirements
   */
  async extractRequirements(jobDescription) {
    const extractedInfo = await this._nlpEngine.extractJobRequirements(
      jobDescription
    );
    return this._structureRequirements(extractedInfo.requirements);
  }

  /**
   * Extract responsibilities from job description
   * @param {string} jobDescription - Job description content
   * @returns {Array} Job responsibilities
   */
  extractResponsibilities(jobDescription) {
    return this._extractResponsibilities(jobDescription);
  }

  /**
   * Preprocess job description content based on type
   * @param {string} content - Raw content
   * @param {string} contentType - Content type
   * @returns {Promise<string>} Processed content
   */
  async _preprocessContent(content, contentType) {
    let processed = content;

    // Handle HTML content
    if (contentType === 'html') {
      processed = this._stripHtmlTags(content);
    }

    // Remove excessive whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    // Remove common job posting artifacts
    processed = processed.replace(/[^\w\s.,;:!?()-]/g, ' ');

    // Normalize line breaks
    processed = processed.replace(/[\r\n]+/g, '\n');

    return processed;
  }

  /**
   * Strip HTML tags from content
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  _stripHtmlTags(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Enrich extracted data with additional processing
   * @param {Object} extractedInfo - Raw extracted information
   * @returns {Promise<Object>} Enriched data
   */
  async _enrichExtractedData(extractedInfo) {
    return {
      requirements: this._structureRequirements(extractedInfo.requirements),
      skills: await this._validateAndEnrichSkills(extractedInfo.skills, true),
    };
  }

  /**
   * Validate skills against master data and enrich with additional info
   * @param {Array} extractedSkills - Raw extracted skills
   * @param {boolean} isRequired - Whether skills are required
   * @returns {Promise<Array>} Validated and enriched skills
   */
  async _validateAndEnrichSkills(extractedSkills, isRequired = false) {
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
            required: isRequired,
            confidence: extractedSkill.confidence,
            category: masterSkill.category || extractedSkill.category,
            proficiency: this._estimateRequiredProficiency(
              extractedSkill.skill,
              extractedSkill.confidence
            ),
          });
        } else {
          // Keep extracted skill if not in master data
          enrichedSkills.push({
            skillId: null,
            name: extractedSkill.skill,
            required: isRequired,
            confidence: extractedSkill.confidence * 0.8,
            category: extractedSkill.category,
            proficiency: 'intermediate',
          });
        }
      } catch (error) {
        // If skill validation fails, keep the extracted skill
        enrichedSkills.push({
          skillId: null,
          name: extractedSkill.skill,
          required: isRequired,
          confidence: extractedSkill.confidence * 0.5,
          category: extractedSkill.category,
          proficiency: 'intermediate',
        });
      }
    }

    return enrichedSkills;
  }

  /**
   * Structure requirements from extracted data
   * @param {Array} rawRequirements - Raw requirements data
   * @returns {Array} Structured requirements
   */
  _structureRequirements(rawRequirements) {
    return rawRequirements.map(req => ({
      type: this._categorizeRequirement(req.text),
      description: req.text,
      priority: req.priority || 'medium',
      mandatory: req.mandatory || false,
    }));
  }

  /**
   * Extract job title from description
   * @param {string} content - Job description content
   * @returns {string|null} Job title
   */
  _extractJobTitle(content) {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Look for title in first few lines
    for (const line of lines.slice(0, 5)) {
      if (
        line.length > 0 &&
        line.length < 100 &&
        !line.toLowerCase().includes('company') &&
        !line.toLowerCase().includes('location') &&
        !line.match(/\d/)
      ) {
        return line;
      }
    }

    return null;
  }

  /**
   * Extract responsibilities from job description
   * @param {string} content - Job description content
   * @returns {Array} Responsibilities
   */
  _extractResponsibilities(content) {
    const responsibilityKeywords = [
      'responsibilities',
      'responsibility',
      'duties',
      'duty',
      'role',
      'you will',
    ];
    const lines = content.split('\n');
    const responsibilities = [];

    let inResponsibilitiesSection = false;
    let currentResponsibility = '';

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();

      if (responsibilityKeywords.some(keyword => lowerLine.includes(keyword))) {
        inResponsibilitiesSection = true;
        return;
      }

      if (inResponsibilitiesSection) {
        if (
          line.trim().startsWith('•') ||
          line.trim().startsWith('-') ||
          line.trim().match(/^\d+\./)
        ) {
          if (currentResponsibility) {
            responsibilities.push(currentResponsibility.trim());
          }
          currentResponsibility = line
            .trim()
            .replace(/^[•\-]\s*/, '')
            .replace(/^\d+\.\s*/, '');
        } else if (line.trim().length > 0) {
          currentResponsibility += ' ' + line.trim();
        } else if (currentResponsibility) {
          responsibilities.push(currentResponsibility.trim());
          currentResponsibility = '';
        }
      }
    });

    if (currentResponsibility) {
      responsibilities.push(currentResponsibility.trim());
    }

    return responsibilities.slice(0, 10);
  }

  /**
   * Extract experience requirements from job description
   * @param {string} content - Job description content
   * @returns {Object} Experience requirements
   */
  _extractExperienceRequirements(content) {
    const experiencePatterns = [
      /(\d+)\s*(?:to|[-])\s*(\d+)\s*years?/i,
      /(\d+)\+?\s*years?/i,
      /(?:minimum|at least)\s*(\d+)\s*years?/i,
    ];

    for (const pattern of experiencePatterns) {
      const match = content.match(pattern);
      if (match) {
        if (match[2]) {
          return {
            min: parseInt(match[1]),
            max: parseInt(match[2]),
            unit: 'years',
          };
        } else {
          return {
            min: parseInt(match[1]),
            max: null,
            unit: 'years',
          };
        }
      }
    }

    return { min: 0, max: null, unit: 'years' };
  }

  /**
   * Extract education requirements from job description
   * @param {string} content - Job description content
   * @returns {Array} Education requirements
   */
  _extractEducationRequirements(content) {
    const educationLevels = ['bachelor', 'master', 'phd', 'degree', 'diploma'];
    const foundRequirements = [];

    educationLevels.forEach(level => {
      if (content.toLowerCase().includes(level)) {
        foundRequirements.push({
          level: level.charAt(0).toUpperCase() + level.slice(1),
          field: this._extractEducationField(content),
          required: true,
        });
      }
    });

    return foundRequirements.length > 0
      ? foundRequirements
      : [{ level: 'Not specified', required: false }];
  }

  /**
   * Extract salary information from job description
   * @param {string} content - Job description content
   * @returns {Object|null} Salary information
   */
  _extractSalaryInfo(content) {
    const salaryPatterns = [
      /\$(\d{1,3}(?:,\d{3})*)\s*(?:to|-)\s*\$(\d{1,3}(?:,\d{3})*)/i,
      /\$(\d{1,3}(?:,\d{3})*)\+?/i,
      /(\d{1,3}(?:,\d{3})*)\s*(?:to|-)\s*(\d{1,3}(?:,\d{3})*)\s*(?:usd|vnd)/i,
    ];

    for (const pattern of salaryPatterns) {
      const match = content.match(pattern);
      if (match) {
        const currency = content.toLowerCase().includes('vnd') ? 'VND' : 'USD';
        if (match[2]) {
          return {
            min: parseInt(match[1].replace(/,/g, '')),
            max: parseInt(match[2].replace(/,/g, '')),
            currency,
            period: 'year',
          };
        } else {
          return {
            min: parseInt(match[1].replace(/,/g, '')),
            max: null,
            currency,
            period: 'year',
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract location from job description
   * @param {string} content - Job description content
   * @returns {string|null} Location
   */
  _extractLocation(content) {
    const locationKeywords = [
      'hanoi',
      'ho chi minh',
      'da nang',
      'remote',
      'hybrid',
    ];
    const lowerContent = content.toLowerCase();

    for (const keyword of locationKeywords) {
      if (lowerContent.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }

    return null;
  }

  /**
   * Extract employment type from job description
   * @param {string} content - Job description content
   * @returns {string} Employment type
   */
  _extractEmploymentType(content) {
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes('full-time') ||
      lowerContent.includes('full time')
    ) {
      return 'full-time';
    }
    if (
      lowerContent.includes('part-time') ||
      lowerContent.includes('part time')
    ) {
      return 'part-time';
    }
    if (lowerContent.includes('contract')) {
      return 'contract';
    }
    if (
      lowerContent.includes('internship') ||
      lowerContent.includes('intern')
    ) {
      return 'internship';
    }

    return 'full-time'; // Default
  }

  /**
   * Extract industry from job description
   * @param {string} content - Job description content
   * @returns {Promise<Object|null>} Industry information
   */
  async _extractIndustry(content) {
    const industryKeywords = {
      Technology: ['software', 'it', 'tech', 'digital'],
      Finance: ['finance', 'banking', 'financial'],
      Healthcare: ['healthcare', 'medical', 'hospital'],
      Education: ['education', 'teaching', 'academic'],
      Manufacturing: ['manufacturing', 'production', 'industrial'],
    };

    const lowerContent = content.toLowerCase();

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        try {
          const masterIndustry = await this._industryRepository.findByName(
            industry
          );
          return masterIndustry || { name: industry, industryId: null };
        } catch (error) {
          return { name: industry, industryId: null };
        }
      }
    }

    return null;
  }

  /**
   * Extract benefits from job description
   * @param {string} content - Job description content
   * @returns {Array} Benefits
   */
  _extractBenefits(content) {
    const benefitKeywords = [
      'health insurance',
      'dental',
      'vacation',
      'bonus',
      'remote work',
      'flexible hours',
    ];
    const foundBenefits = [];

    benefitKeywords.forEach(benefit => {
      if (content.toLowerCase().includes(benefit)) {
        foundBenefits.push(benefit);
      }
    });

    return foundBenefits;
  }

  /**
   * Extract education field from content
   * @param {string} content - Content
   * @returns {string|null} Education field
   */
  _extractEducationField(content) {
    const fields = [
      'computer science',
      'engineering',
      'business',
      'mathematics',
      'physics',
    ];
    const lowerContent = content.toLowerCase();

    for (const field of fields) {
      if (lowerContent.includes(field)) {
        return field.charAt(0).toUpperCase() + field.slice(1);
      }
    }

    return null;
  }

  /**
   * Categorize requirement type
   * @param {string} requirement - Requirement text
   * @returns {string} Category
   */
  _categorizeRequirement(requirement) {
    const lowerReq = requirement.toLowerCase();

    if (lowerReq.includes('experience') || lowerReq.includes('years')) {
      return 'experience';
    }
    if (lowerReq.includes('degree') || lowerReq.includes('education')) {
      return 'education';
    }
    if (lowerReq.includes('skill') || lowerReq.includes('knowledge')) {
      return 'skill';
    }
    if (lowerReq.includes('language')) {
      return 'language';
    }

    return 'general';
  }

  /**
   * Estimate required proficiency level for skills
   * @param {string} skill - Skill name
   * @param {number} confidence - Confidence score
   * @returns {string} Proficiency level
   */
  _estimateRequiredProficiency(skill, confidence) {
    if (confidence > 0.8) return 'expert';
    if (confidence > 0.6) return 'advanced';
    return 'intermediate';
  }

  /**
   * Calculate overall confidence score for parsed job description
   * @param {Object} enrichedData - Enriched data
   * @returns {number} Overall confidence (0-1)
   */
  _calculateOverallConfidence(enrichedData) {
    const skillConfidence =
      enrichedData.skills.reduce((sum, skill) => sum + skill.confidence, 0) /
      Math.max(enrichedData.skills.length, 1);
    const requirementsCount = enrichedData.requirements.length;

    // Weighted confidence calculation
    const confidence =
      skillConfidence * 0.5 + Math.min(requirementsCount / 5, 1) * 0.5;

    return Math.min(confidence, 1);
  }
}

module.exports = JobDescriptionParser;
