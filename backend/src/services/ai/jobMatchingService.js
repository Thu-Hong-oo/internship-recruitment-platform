/**
 * 🎯 Job Matching Service
 * 
 * SELF-SUFFICIENT matching algorithm - NO LLM dependency
 * 
 * Algorithm:
 * 1. Skill Matching (40%): TF-IDF + Cosine Similarity
 * 2. Experience Matching (30%): Years + Level comparison
 * 3. Education Matching (15%): Degree level + Field relevance
 * 4. Project Matching (15%): Domain + Technology overlap
 * 
 * Techniques:
 * - PhoBERT for skill extraction (already trained)
 * - Sentence-BERT for semantic similarity
 * - Rule-based scoring for experience/education
 * - Multi-dimensional weighted aggregation
 */

const natural = require('natural');
const { getSentenceBertService } = require('./sentenceBertService');
const { getSkillExtractionService } = require('./skillExtractionService');
const { logger } = require('../../utils/logger');

// TF-IDF tokenizer
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

class JobMatchingService {
  constructor() {
    this.sentenceBert = getSentenceBertService();
    this.skillExtractor = getSkillExtractionService();
    
    // Weights for multi-dimensional scoring
    this.weights = {
      skills: 0.40,      // 40% - Most important
      experience: 0.30,  // 30% - Career level
      education: 0.15,   // 15% - Academic background
      projects: 0.15     // 15% - Practical experience
    };
    
    // Cache for similarity calculations
    this.cache = new Map();
  }

  /**
   * Calculate match score between candidate CV and job posting
   * 
   * @param {Object} candidate - Candidate data with CV
   * @param {Object} job - Job posting data
   * @param {Object} options - Matching options
   * @returns {Promise<Object>} Match result with score and breakdown
   */
  async calculateMatchScore(candidate, job, options = {}) {
    try {
      const {
        useSemanticSimilarity = true,
        weights = this.weights,
        includeExplanation = true
      } = options;

      // Extract candidate data
      const candidateSkills = await this._extractSkills(candidate);
      const candidateExperience = this._extractExperience(candidate);
      const candidateEducation = this._extractEducation(candidate);
      const candidateProjects = this._extractProjects(candidate);

      // Extract job requirements
      const jobSkills = await this._extractSkills(job);
      const jobExperience = this._extractExperienceRequirement(job);
      const jobEducation = this._extractEducationRequirement(job);
      const jobDomain = this._extractDomain(job);

      // Calculate component scores
      const skillScore = await this._calculateSkillScore(
        candidateSkills,
        jobSkills,
        useSemanticSimilarity
      );

      const experienceScore = this._calculateExperienceScore(
        candidateExperience,
        jobExperience
      );

      const educationScore = this._calculateEducationScore(
        candidateEducation,
        jobEducation
      );

      const projectScore = this._calculateProjectScore(
        candidateProjects,
        jobSkills,
        jobDomain
      );

      // Aggregate weighted score
      const totalScore = (
        skillScore.score * weights.skills +
        experienceScore.score * weights.experience +
        educationScore.score * weights.education +
        projectScore.score * weights.projects
      );

      // Build result
      const result = {
        matchScore: Math.round(totalScore * 100), // 0-100
        tier: this._calculateTier(totalScore),
        breakdown: {
          skills: {
            score: Math.round(skillScore.score * 100),
            weight: weights.skills,
            matched: skillScore.matched,
            missing: skillScore.missing,
            total: jobSkills.length
          },
          experience: {
            score: Math.round(experienceScore.score * 100),
            weight: weights.experience,
            candidateYears: candidateExperience.totalYears,
            requiredYears: jobExperience.minYears,
            candidateLevel: candidateExperience.level,
            requiredLevel: jobExperience.level
          },
          education: {
            score: Math.round(educationScore.score * 100),
            weight: weights.education,
            candidateDegree: candidateEducation.highestDegree,
            requiredDegree: jobEducation.minDegree,
            fieldMatch: educationScore.fieldMatch
          },
          projects: {
            score: Math.round(projectScore.score * 100),
            weight: weights.projects,
            relevantProjects: projectScore.relevantCount,
            totalProjects: candidateProjects.length
          }
        },
        candidateId: candidate._id || candidate.id,
        jobId: job._id || job.id,
        timestamp: new Date()
      };

      // Add explanation if requested
      if (includeExplanation) {
        result.explanation = this._generateExplanation(result);
      }

      logger.info(`Match calculated: Candidate ${result.candidateId} vs Job ${result.jobId} = ${result.matchScore}% (Tier ${result.tier})`);

      return result;
    } catch (error) {
      logger.error('Job matching error:', error);
      throw error;
    }
  }

  /**
   * Calculate skill matching score using hybrid approach
   */
  async _calculateSkillScore(candidateSkills, jobSkills, useSemanticSimilarity = true) {
    // Filter out invalid/empty skills
    const clean = (arr) =>
      arr
        .map((s) => (typeof s === 'string' ? s : s.name))
        .filter((s) => s && typeof s === 'string' && s.trim().length > 0);

    const candidateSkillsClean = clean(candidateSkills);
    const jobSkillsClean = clean(jobSkills);

    if (jobSkillsClean.length === 0) {
      logger.warn('⚠️ Job skills empty after cleaning, skipping skill match');
      return { score: 0, matched: [], missing: [] };
    }
    if (candidateSkillsClean.length === 0) {
      logger.warn('⚠️ Candidate skills empty after cleaning, skipping skill match');
      return { score: 0, matched: [], missing: jobSkillsClean };
    }

    const matched = [];
    const missing = [];

    // Normalize skill names for comparison
    const candidateSkillNames = candidateSkillsClean.map(s => s.toLowerCase().trim());

    const jobSkillNames = jobSkillsClean.map(s => s.toLowerCase().trim());

    // Method 1: Exact match
    for (const jobSkill of jobSkillNames) {
      if (candidateSkillNames.includes(jobSkill)) {
        matched.push(jobSkill);
      } else {
        missing.push(jobSkill);
      }
    }

    // Method 2: Semantic similarity (optional, slower but more accurate)
    if (useSemanticSimilarity && this.sentenceBert.isAvailable && missing.length > 0) {
      try {
        // Check if missing skills are semantically similar to candidate skills
        const similarities = await this.sentenceBert.similarityBatch(
          missing.join(', '),
          candidateSkillNames
        );

        // Consider skills with similarity > 0.75 as matched
        const semanticThreshold = 0.75;
        const semanticMatched = [];

        for (let i = 0; i < missing.length; i++) {
          const maxSimilarity = Math.max(...similarities.slice(i * candidateSkillNames.length, (i + 1) * candidateSkillNames.length));
          
          if (maxSimilarity >= semanticThreshold) {
            semanticMatched.push(missing[i]);
          }
        }

        // Update matched/missing lists
        matched.push(...semanticMatched);
        semanticMatched.forEach(skill => {
          const index = missing.indexOf(skill);
          if (index > -1) missing.splice(index, 1);
        });
      } catch (error) {
        logger.warn('Semantic similarity failed, using exact match only:', error.message);
      }
    }

    // Calculate score with partial credit for related skills
    const exactMatchScore = matched.length / jobSkillNames.length;
    const coverageScore = Math.min(1.0, candidateSkillNames.length / jobSkillNames.length);
    
    // Weighted: 80% exact match, 20% coverage
    const finalScore = exactMatchScore * 0.8 + coverageScore * 0.2;

    return {
      score: finalScore,
      matched,
      missing
    };
  }

  /**
   * Calculate experience matching score
   */
  _calculateExperienceScore(candidateExperience, jobExperience) {
    if (!jobExperience || !jobExperience.minYears) {
      return { score: 1.0 }; // No requirement = full score
    }

    const candidateYears = candidateExperience.totalYears || 0;
    const requiredYears = jobExperience.minYears || 0;

    // Years score: 0-100% based on years ratio
    let yearsScore = 0;
    if (candidateYears >= requiredYears) {
      yearsScore = 1.0; // Meets or exceeds requirement
    } else if (candidateYears === 0) {
      yearsScore = 0.0;
    } else {
      // Partial score if close (e.g., 2 years for 3 years requirement = 0.67)
      yearsScore = Math.min(1.0, candidateYears / requiredYears);
    }

    // Level score: match career level
    const levelScore = this._compareExperienceLevels(
      candidateExperience.level,
      jobExperience.level
    );

    // Weighted: 70% years, 30% level
    const finalScore = yearsScore * 0.7 + levelScore * 0.3;

    return { score: finalScore };
  }

  /**
   * Compare experience levels
   */
  _compareExperienceLevels(candidateLevel, requiredLevel) {
    const levels = ['intern', 'entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
    
    const candidateIdx = levels.indexOf(candidateLevel?.toLowerCase() || 'intern');
    const requiredIdx = levels.indexOf(requiredLevel?.toLowerCase() || 'intern');

    if (candidateIdx === -1 || requiredIdx === -1) {
      return 0.5; // Unknown levels = neutral score
    }

    if (candidateIdx >= requiredIdx) {
      return 1.0; // Meets or exceeds
    }

    // Partial credit if close (e.g., junior for mid = 0.6)
    const gap = requiredIdx - candidateIdx;
    return Math.max(0, 1.0 - (gap * 0.2));
  }

  /**
   * Calculate education matching score
   */
  _calculateEducationScore(candidateEducation, jobEducation) {
    if (!jobEducation || !jobEducation.minDegree) {
      return { score: 1.0, fieldMatch: true }; // No requirement
    }

    const candidateDegree = candidateEducation.highestDegree || 'none';
    const requiredDegree = jobEducation.minDegree || 'none';

    // Degree level score
    const degreeScore = this._compareDegreeLevels(candidateDegree, requiredDegree);

    // Field relevance score
    const fieldScore = this._compareEducationFields(
      candidateEducation.major,
      jobEducation.preferredMajors || []
    );

    // Weighted: 70% degree level, 30% field relevance
    const finalScore = degreeScore * 0.7 + fieldScore * 0.3;

    return { 
      score: finalScore,
      fieldMatch: fieldScore > 0.5
    };
  }

  /**
   * Compare degree levels
   */
  _compareDegreeLevels(candidateDegree, requiredDegree) {
    const degrees = ['none', 'highschool', 'associate', 'bachelor', 'master', 'phd'];
    
    const candidateIdx = degrees.indexOf(candidateDegree?.toLowerCase() || 'none');
    const requiredIdx = degrees.indexOf(requiredDegree?.toLowerCase() || 'none');

    if (candidateIdx >= requiredIdx) {
      return 1.0; // Meets or exceeds
    }

    // Partial credit
    const gap = requiredIdx - candidateIdx;
    return Math.max(0, 1.0 - (gap * 0.25));
  }

  /**
   * Compare education fields
   */
  _compareEducationFields(candidateMajor, preferredMajors) {
    if (!candidateMajor || preferredMajors.length === 0) {
      return 0.5; // Neutral if no data
    }

    const candidateLower = candidateMajor.toLowerCase();
    
    for (const preferred of preferredMajors) {
      if (candidateLower.includes(preferred.toLowerCase()) || 
          preferred.toLowerCase().includes(candidateLower)) {
        return 1.0; // Exact or partial match
      }
    }

    // Check related fields (simple keyword matching)
    const techKeywords = ['computer', 'software', 'information', 'engineering', 'technology'];
    const hasTechMajor = techKeywords.some(kw => candidateLower.includes(kw));
    const needsTechMajor = preferredMajors.some(major => 
      techKeywords.some(kw => major.toLowerCase().includes(kw))
    );

    if (hasTechMajor && needsTechMajor) {
      return 0.7; // Related field
    }

    return 0.3; // Unrelated field
  }

  /**
   * Calculate project relevance score
   */
  _calculateProjectScore(candidateProjects, jobSkills, jobDomain) {
    if (!candidateProjects || candidateProjects.length === 0) {
      return { score: 0.5, relevantCount: 0 }; // Neutral if no projects
    }

    let relevantCount = 0;

    for (const project of candidateProjects) {
      const projectText = `${project.title} ${project.description} ${project.technologies?.join(' ') || ''}`.toLowerCase();
      
      // Check if project uses required skills
      const usesRequiredSkills = jobSkills.some(skill => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        return projectText.includes(skillName.toLowerCase());
      });

      // Check if project is in relevant domain
      const inRelevantDomain = jobDomain ? 
        projectText.includes(jobDomain.toLowerCase()) : true;

      if (usesRequiredSkills || inRelevantDomain) {
        relevantCount++;
      }
    }

    const score = Math.min(1.0, relevantCount / Math.max(1, candidateProjects.length));

    return { score, relevantCount };
  }

  /**
   * Calculate tier (A/B/C/D) based on match score
   */
  _calculateTier(score) {
    if (score >= 0.80) return 'A'; // Excellent match (80-100%)
    if (score >= 0.60) return 'B'; // Good match (60-79%)
    if (score >= 0.40) return 'C'; // Fair match (40-59%)
    return 'D'; // Poor match (0-39%)
  }

  /**
   * Generate human-readable explanation
   */
  _generateExplanation(matchResult) {
    const { matchScore, tier, breakdown } = matchResult;
    
    const explanations = [];

    // Overall assessment
    if (tier === 'A') {
      explanations.push('✨ Excellent match! Candidate highly qualified for this role.');
    } else if (tier === 'B') {
      explanations.push('✅ Good match. Candidate meets most requirements.');
    } else if (tier === 'C') {
      explanations.push('⚠️ Fair match. Candidate has some relevant skills but gaps exist.');
    } else {
      explanations.push('❌ Limited match. Significant skill gaps.');
    }

    // Skills assessment
    const skillMatch = breakdown.skills.matched.length / Math.max(1, breakdown.skills.total);
    if (skillMatch >= 0.8) {
      explanations.push(`Strong technical skills: ${breakdown.skills.matched.length}/${breakdown.skills.total} required skills matched.`);
    } else if (skillMatch >= 0.5) {
      explanations.push(`Moderate technical fit: ${breakdown.skills.matched.length}/${breakdown.skills.total} required skills matched. Missing: ${breakdown.skills.missing.slice(0, 3).join(', ')}${breakdown.skills.missing.length > 3 ? '...' : ''}.`);
    } else {
      explanations.push(`Limited technical alignment: Only ${breakdown.skills.matched.length}/${breakdown.skills.total} required skills matched.`);
    }

    // Experience assessment
    if (breakdown.experience.score >= 80) {
      explanations.push(`Experience level appropriate: ${breakdown.experience.candidateYears} years (${breakdown.experience.candidateLevel}).`);
    } else if (breakdown.experience.candidateYears < breakdown.experience.requiredYears) {
      explanations.push(`Experience below requirement: ${breakdown.experience.candidateYears} years vs ${breakdown.experience.requiredYears} years required.`);
    }

    // Education assessment
    if (breakdown.education.score >= 80) {
      explanations.push('Education meets requirements.');
    }

    // Projects assessment
    if (breakdown.projects.relevantProjects > 0) {
      explanations.push(`${breakdown.projects.relevantProjects} relevant project(s) found.`);
    }

    return explanations.join(' ');
  }

  /**
   * Extract skills from candidate or job
   */
  async _extractSkills(data) {
    // Stopwords/ignore list for generic skills
    const stopwords = new Set([
      'giao tiếp',
      'kỹ năng giao tiếp',
      'kỹ năng làm việc nhóm',
      'làm việc nhóm',
      'kỹ năng mềm',
      'kinh nghiệm',
      'thành thạo microsoft office',
      'tin học văn phòng',
      'office',
      'ms office',
      'word',
      'excel',
    ]);

    // Check if skills already extracted
    if (data.cv && data.cv.skills && Array.isArray(data.cv.skills)) {
      return data.cv.skills
        .map((s) => (typeof s === 'string' ? s : s.name))
        .filter((s) => s && typeof s === 'string')
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s && !stopwords.has(s));
    }

    if (data.requirements && data.requirements.skills && Array.isArray(data.requirements.skills)) {
      return data.requirements.skills
        .map((s) => (typeof s === 'string' ? s : s.name))
        .filter((s) => s && typeof s === 'string')
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s && !stopwords.has(s));
    }

    if (data.skills && Array.isArray(data.skills)) {
      return data.skills
        .map((s) => (typeof s === 'string' ? s : s.name))
        .filter((s) => s && typeof s === 'string')
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s && !stopwords.has(s));
    }

    // Extract from text using PhoBERT
    const text = data.cv?.rawText || data.description || data.requirements?.description || '';
    
    if (!text) {
      return [];
    }

    try {
      const extracted = await this.skillExtractor.extractSkills(text, {
        useHybrid: true,      // Use Hybrid System (Rule-based + Multilingual NER)
        usePhoBERT: false,    // Disabled - will re-enable after fixing PhoBERT
        useGemini: false      // NO Gemini dependency
      });
      
      return extracted
        .map(s => s.name)
        .filter(s => s && typeof s === 'string')
        .map(s => s.toLowerCase().trim())
        .filter(s => s && !stopwords.has(s));
    } catch (error) {
      logger.warn('Skill extraction failed:', error.message);
      return [];
    }
  }

  /**
   * Extract experience data from candidate
   */
  _extractExperience(candidate) {
    const cv = candidate.cv || candidate;
    const experience = cv.experience || [];

    let totalYears = 0;
    let level = 'intern';

    // Calculate total years from experience array
    for (const exp of experience) {
      if (exp.duration) {
        // Parse duration like "2 years", "6 months"
        const years = this._parseDuration(exp.duration);
        totalYears += years;
      }
    }

    // Infer level from total years
    if (totalYears >= 7) level = 'senior';
    else if (totalYears >= 4) level = 'mid';
    else if (totalYears >= 2) level = 'junior';
    else if (totalYears >= 1) level = 'entry';

    return {
      totalYears,
      level,
      positions: experience.map(e => e.position || e.title)
    };
  }

  /**
   * Parse duration string to years
   */
  _parseDuration(duration) {
    if (!duration) return 0;
    
    const lower = duration.toLowerCase();
    let years = 0;

    // Match patterns like "2 years", "6 months", "1.5 years"
    const yearMatch = lower.match(/(\d+\.?\d*)\s*(year|yr|năm)/);
    const monthMatch = lower.match(/(\d+)\s*(month|tháng)/);

    if (yearMatch) {
      years += parseFloat(yearMatch[1]);
    }

    if (monthMatch) {
      years += parseInt(monthMatch[1]) / 12;
    }

    return years;
  }

  /**
   * Extract experience requirements from job
   */
  _extractExperienceRequirement(job) {
    const requirements = job.requirements || job;
    
    return {
      minYears: requirements.minYearsExperience || requirements.minYears || 0,
      maxYears: requirements.maxYearsExperience || requirements.maxYears || null,
      level: requirements.level || requirements.seniorityLevel || 'intern'
    };
  }

  /**
   * Extract education data from candidate
   */
  _extractEducation(candidate) {
    const cv = candidate.cv || candidate;
    const education = cv.education || [];

    if (education.length === 0) {
      return { highestDegree: 'none', major: null };
    }

    // Find highest degree
    const degrees = ['phd', 'master', 'bachelor', 'associate'];
    let highestDegree = 'highschool';
    let major = null;

    for (const edu of education) {
      const degree = (edu.degree || '').toLowerCase();
      
      for (const degreeType of degrees) {
        if (degree.includes(degreeType)) {
          if (degrees.indexOf(degreeType) <= degrees.indexOf(highestDegree)) {
            highestDegree = degreeType;
            major = edu.major || edu.fieldOfStudy || major;
          }
        }
      }
    }

    return { highestDegree, major };
  }

  /**
   * Extract education requirements from job
   */
  _extractEducationRequirement(job) {
    const requirements = job.requirements || job;
    
    return {
      minDegree: requirements.minDegree || requirements.education || 'bachelor',
      preferredMajors: requirements.preferredMajors || requirements.majors || []
    };
  }

  /**
   * Extract projects from candidate
   */
  _extractProjects(candidate) {
    const cv = candidate.cv || candidate;
    return cv.projects || [];
  }

  /**
   * Extract domain from job
   */
  _extractDomain(job) {
    return job.industry || job.domain || job.category || null;
  }

  /**
   * Batch calculate match scores for multiple candidates
   */
  async batchCalculateScores(candidates, job, options = {}) {
    const results = [];

    for (const candidate of candidates) {
      try {
        const score = await this.calculateMatchScore(candidate, job, options);
        results.push(score);
      } catch (error) {
        logger.error(`Failed to calculate score for candidate ${candidate._id}:`, error.message);
        results.push({
          candidateId: candidate._id,
          jobId: job._id,
          matchScore: 0,
          tier: 'D',
          error: error.message
        });
      }
    }

    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results;
  }

  /**
   * Calculate semantic similarity between job and candidate using Sentence-BERT
   * NEW: RAG-enhanced semantic matching
   * 
   * @param {Object} candidate - Candidate data
   * @param {Object} job - Job posting data
   * @returns {Promise<number>} Semantic similarity score (0-1)
   */
  async calculateSemanticSimilarity(candidate, job) {
    try {
      if (!this.sentenceBert || !this.sentenceBert.isAvailable) {
        logger.warn('Sentence-BERT not available, returning 0.5 (neutral)');
        return 0.5; // Neutral score if Sentence-BERT unavailable
      }

      // Build text representations
      const jobText = this._buildJobTextForEmbedding(job);
      const candidateText = this._buildCandidateTextForEmbedding(candidate);

      // Generate embeddings
      const jobEmbedding = await this.sentenceBert.encode(jobText);
      const candidateEmbedding = await this.sentenceBert.encode(candidateText);

      // Calculate cosine similarity
      return this._cosineSimilarity(jobEmbedding, candidateEmbedding);
    } catch (error) {
      logger.error('Semantic similarity calculation error:', error);
      return 0.5; // Fallback to neutral
    }
  }

  /**
   * Build text representation of job for embedding
   */
  _buildJobTextForEmbedding(job) {
    const parts = [
      job.title || '',
      job.description || '',
      job.requirements || '',
      job.skills?.join(' ') || '',
      job.industry || '',
      job.level || ''
    ].filter(p => p.length > 0);

    return parts.join(' ').substring(0, 2000);
  }

  /**
   * Build text representation of candidate for embedding
   */
  _buildCandidateTextForEmbedding(candidate) {
    const cv = candidate.cv || candidate;
    const parts = [
      candidate.fullName || cv.fullName || '',
      candidate.summary || cv.summary || '',
      candidate.experience?.map(e => `${e.position} ${e.description || ''}`).join(' ') || 
        cv.experience?.map(e => `${e.position} ${e.description || ''}`).join(' ') || '',
      candidate.skills?.map(s => s.name || s).join(' ') || 
        cv.skills?.map(s => s.name || s).join(' ') || '',
      candidate.projects?.map(p => `${p.title} ${p.description || ''}`).join(' ') ||
        cv.projects?.map(p => `${p.title} ${p.description || ''}`).join(' ') || ''
    ].filter(p => p.length > 0);

    return parts.join(' ').substring(0, 2000);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }
}

// Singleton instance
let instance = null;

function getJobMatchingService() {
  if (!instance) {
    instance = new JobMatchingService();
  }
  return instance;
}

module.exports = {
  JobMatchingService,
  getJobMatchingService
};
