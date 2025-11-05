const { GoogleGenerativeAI } = require('@google/generative-ai');
const natural = require('natural');
const logger = require('../../../../config/logger');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * JobMatcherService - Handles job matching and analysis between CV and job descriptions
 * Infrastructure Layer Service following Clean Architecture
 */
class JobMatcherService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  /**
   * Analyze job match between CV and job description
   * @param {Object} cvData - CV data object
   * @param {Object} jobData - Job data object
   * @returns {Promise<Object>} Match analysis result
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
- Requirements: ${jobData.requirements || 'Not specified'}
- Industry: ${jobData.industry || 'Not specified'}
- Level: ${jobData.level || 'Not specified'}

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
        const parsed = JSON.parse(jsonMatch[0]);
        return this._normalizeMatchResult(parsed);
      }

      // Fallback to basic analysis
      return this._analyzeJobMatchBasic(cvData, jobData);
    } catch (error) {
      logger.error('Job match analysis error:', error);
      return this._analyzeJobMatchBasic(cvData, jobData);
    }
  }

  /**
   * Basic job match analysis using text similarity
   * @private
   */
  _analyzeJobMatchBasic(cvData, jobData) {
    const cvText = this._extractTextFromCV(cvData);
    const jobText = `${jobData.title} ${jobData.description} ${
      jobData.requirements || ''
    }`;

    const skillsMatch = this._calculateSkillsMatch(
      cvData.skills || [],
      jobData
    );
    const experienceMatch = this._calculateExperienceMatch(
      cvData.experience || [],
      jobData
    );
    const educationMatch = this._calculateEducationMatch(
      cvData.education || [],
      jobData
    );
    const keywordsMatch = this._calculateKeywordsMatch(cvText, jobText);

    const overall = Math.round(
      (skillsMatch + experienceMatch + educationMatch + keywordsMatch) / 4
    );

    return {
      matchScore: {
        skills: skillsMatch,
        experience: experienceMatch,
        education: educationMatch,
        keywords: keywordsMatch,
        overall: overall,
      },
      strengths: this._identifyStrengths(cvData, jobData),
      gaps: this._identifyGaps(cvData, jobData),
      recommendations: this._generateRecommendations(cvData, jobData),
      fitLevel: this._determineFitLevel(overall),
    };
  }

  /**
   * Extract text content from CV data
   * @private
   */
  _extractTextFromCV(cvData) {
    let text = '';

    // Skills
    if (cvData.skills) {
      text +=
        Object.values(cvData.skills)
          .flat()
          .map(s => s.name || s)
          .join(' ') + ' ';
    }

    // Experience
    if (cvData.experience) {
      text +=
        cvData.experience
          .map(exp => `${exp.position} ${exp.company} ${exp.description}`)
          .join(' ') + ' ';
    }

    // Education
    if (cvData.education) {
      text +=
        cvData.education
          .map(edu => `${edu.degree} ${edu.field} ${edu.institution}`)
          .join(' ') + ' ';
    }

    // Projects
    if (cvData.projects) {
      text +=
        cvData.projects
          .map(
            proj =>
              `${proj.name} ${proj.description} ${proj.technologies?.join(' ')}`
          )
          .join(' ') + ' ';
    }

    return text.toLowerCase();
  }

  /**
   * Calculate skills match score
   * @private
   */
  _calculateSkillsMatch(cvSkills, jobData) {
    if (!cvSkills || !jobData) return 0;

    const jobText = `${jobData.title} ${jobData.description} ${
      jobData.requirements || ''
    }`.toLowerCase();
    const allCvSkills = Object.values(cvSkills).flat();

    let matchedSkills = 0;
    let totalSkills = allCvSkills.length;

    allCvSkills.forEach(skill => {
      const skillName = (skill.name || skill).toLowerCase();
      if (jobText.includes(skillName)) {
        matchedSkills++;
      }
    });

    return totalSkills > 0
      ? Math.round((matchedSkills / totalSkills) * 100)
      : 0;
  }

  /**
   * Calculate experience match score
   * @private
   */
  _calculateExperienceMatch(cvExperience, jobData) {
    if (!cvExperience || cvExperience.length === 0) return 0;

    const jobLevel = jobData.level || 'junior';
    const totalExperience = cvExperience.reduce((total, exp) => {
      const duration = this._calculateDuration(exp.startDate, exp.endDate);
      return total + duration;
    }, 0);

    // Level-based scoring
    const levelScores = {
      internship: { min: 0, max: 1, score: totalExperience >= 0.5 ? 80 : 40 },
      junior: {
        min: 0,
        max: 2,
        score: totalExperience >= 1 ? 90 : totalExperience >= 0.5 ? 60 : 30,
      },
      mid: {
        min: 2,
        max: 5,
        score: totalExperience >= 3 ? 90 : totalExperience >= 1 ? 70 : 40,
      },
      senior: {
        min: 5,
        max: 100,
        score: totalExperience >= 5 ? 90 : totalExperience >= 3 ? 70 : 40,
      },
    };

    const levelScore = levelScores[jobLevel] || levelScores.junior;
    return Math.min(levelScore.score, 100);
  }

  /**
   * Calculate education match score
   * @private
   */
  _calculateEducationMatch(cvEducation, jobData) {
    if (!cvEducation || cvEducation.length === 0) return 0;

    const jobRequirements =
      `${jobData.title} ${jobData.description}`.toLowerCase();
    let score = 50; // Base score

    cvEducation.forEach(edu => {
      const degree = (edu.degree || '').toLowerCase();
      const field = (edu.field || '').toLowerCase();

      // Degree relevance
      if (degree.includes('bachelor') || degree.includes('engineer')) {
        score += 20;
      } else if (degree.includes('master') || degree.includes('phd')) {
        score += 30;
      }

      // Field relevance
      if (
        field.includes('computer') ||
        field.includes('software') ||
        field.includes('it')
      ) {
        if (
          jobRequirements.includes('software') ||
          jobRequirements.includes('developer')
        ) {
          score += 20;
        }
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Calculate keywords match using TF-IDF similarity
   * @private
   */
  _calculateKeywordsMatch(cvText, jobText) {
    const cvTokens = this.tokenizer.tokenize(cvText) || [];
    const jobTokens = this.tokenizer.tokenize(jobText) || [];

    const cvStems = cvTokens.map(token => this.stemmer.stem(token));
    const jobStems = jobTokens.map(token => this.stemmer.stem(token));

    const commonStems = cvStems.filter(stem => jobStems.includes(stem));
    const uniqueStems = new Set([...cvStems, ...jobStems]);

    const similarity =
      uniqueStems.size > 0 ? commonStems.length / uniqueStems.size : 0;
    return Math.round(similarity * 100);
  }

  /**
   * Calculate duration between dates
   * @private
   */
  _calculateDuration(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = endDate === 'Present' ? new Date() : new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

      const diffTime = Math.abs(end - start);
      return diffTime / (1000 * 60 * 60 * 24 * 365); // Convert to years
    } catch (error) {
      return 0;
    }
  }

  /**
   * Identify strengths from CV data
   * @private
   */
  _identifyStrengths(cvData, jobData) {
    const strengths = [];

    // Skills strengths
    const cvSkills = Object.values(cvData.skills || {}).flat();
    if (cvSkills.length > 5) {
      strengths.push('Diverse technical skill set');
    }

    // Experience strengths
    const experience = cvData.experience || [];
    if (experience.length > 0) {
      const totalYears = experience.reduce((total, exp) => {
        return total + this._calculateDuration(exp.startDate, exp.endDate);
      }, 0);

      if (totalYears > 2) {
        strengths.push(
          `Over ${Math.round(totalYears)} years of relevant experience`
        );
      }
    }

    // Education strengths
    const education = cvData.education || [];
    if (education.some(edu => edu.degree?.toLowerCase().includes('bachelor'))) {
      strengths.push('Strong educational background');
    }

    return strengths;
  }

  /**
   * Identify gaps in CV compared to job requirements
   * @private
   */
  _identifyGaps(cvData, jobData) {
    const gaps = [];

    // Check for common required skills
    const jobText = `${jobData.title} ${jobData.description}`.toLowerCase();
    const requiredSkills = [
      'react',
      'node.js',
      'python',
      'aws',
      'docker',
      'kubernetes',
    ];

    requiredSkills.forEach(skill => {
      if (jobText.includes(skill)) {
        const cvSkills = Object.values(cvData.skills || {}).flat();
        const hasSkill = cvSkills.some(cvSkill =>
          (cvSkill.name || cvSkill).toLowerCase().includes(skill)
        );

        if (!hasSkill) {
          gaps.push(`Missing ${skill} experience`);
        }
      }
    });

    // Experience gaps
    const experience = cvData.experience || [];
    const totalYears = experience.reduce((total, exp) => {
      return total + this._calculateDuration(exp.startDate, exp.endDate);
    }, 0);

    if (totalYears < 1 && jobData.level !== 'internship') {
      gaps.push('Limited professional experience');
    }

    return gaps;
  }

  /**
   * Generate recommendations for improvement
   * @private
   */
  _generateRecommendations(cvData, jobData) {
    const recommendations = [];

    const gaps = this._identifyGaps(cvData, jobData);

    gaps.forEach(gap => {
      if (gap.includes('react')) {
        recommendations.push('Consider learning React through online courses');
      } else if (gap.includes('node.js')) {
        recommendations.push('Build projects with Node.js and Express');
      } else if (gap.includes('aws') || gap.includes('docker')) {
        recommendations.push('Get certified in cloud technologies');
      } else if (gap.includes('experience')) {
        recommendations.push(
          'Gain more practical experience through internships or personal projects'
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue building on your current strengths');
      recommendations.push('Consider obtaining relevant certifications');
    }

    return recommendations;
  }

  /**
   * Determine fit level based on overall score
   * @private
   */
  _determineFitLevel(overallScore) {
    if (overallScore >= 80) return 'excellent';
    if (overallScore >= 60) return 'good';
    if (overallScore >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Normalize match result structure
   * @private
   */
  _normalizeMatchResult(result) {
    return {
      matchScore: {
        skills: result.matchScore?.skills || 0,
        experience: result.matchScore?.experience || 0,
        education: result.matchScore?.education || 0,
        keywords: result.matchScore?.keywords || 0,
        overall: result.matchScore?.overall || 0,
      },
      strengths: result.strengths || [],
      gaps: result.gaps || [],
      recommendations: result.recommendations || [],
      fitLevel: result.fitLevel || 'poor',
    };
  }
}

module.exports = new JobMatcherService();
