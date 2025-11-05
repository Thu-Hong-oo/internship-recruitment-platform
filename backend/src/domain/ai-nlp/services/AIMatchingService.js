/**
 * AIMatchingService
 * Domain: AI/NLP
 * Service for AI-powered candidate-job matching using NLP and machine learning
 */
class AIMatchingService {
  constructor(props) {
    this._nlpEngine = props.nlpEngine;
    this._cvParser = props.cvParser;
    this._jobDescriptionParser = props.jobDescriptionParser;
    this._skillRepository = props.skillRepository;
    this._matchingHistoryRepository = props.matchingHistoryRepository;
  }

  /**
   * Match a candidate with a job posting
   * @param {Object} candidate - Candidate entity
   * @param {Object} job - Job entity
   * @param {Object} options - Matching options
   * @returns {Promise<Object>} Matching result
   */
  async matchCandidateToJob(candidate, job, options = {}) {
    if (!candidate) {
      throw new Error('Candidate data is required');
    }
    if (!job) {
      throw new Error('Job data is required');
    }

    try {
      // Extract candidate profile information
      const candidateProfile = await this._extractCandidateProfile(candidate);

      // Extract job requirements
      const jobRequirements = await this._extractJobRequirements(job);

      // Calculate matching scores
      const matchingScores = await this._calculateMatchingScores(
        candidateProfile,
        jobRequirements
      );

      // Generate recommendations
      const recommendations = await this._generateRecommendations(
        candidateProfile,
        jobRequirements,
        matchingScores
      );

      // Create matching result
      const result = {
        candidateId: candidate.candidateId,
        jobId: job.jobId,
        overallScore: matchingScores.overall,
        skillMatch: matchingScores.skillMatch,
        experienceMatch: matchingScores.experienceMatch,
        educationMatch: matchingScores.educationMatch,
        locationMatch: matchingScores.locationMatch,
        recommendations,
        matchedAt: new Date(),
        confidence: this._calculateConfidence(matchingScores),
      };

      // Store matching history
      await this._storeMatchingHistory(result);

      return result;
    } catch (error) {
      throw new Error(`Failed to match candidate to job: ${error.message}`);
    }
  }

  /**
   * Find best job matches for a candidate
   * @param {Object} candidate - Candidate entity
   * @param {Array} jobs - Array of job entities
   * @param {Object} options - Matching options
   * @returns {Promise<Array>} Ranked job matches
   */
  async findBestJobsForCandidate(candidate, jobs, options = {}) {
    const matches = [];

    for (const job of jobs) {
      try {
        const match = await this.matchCandidateToJob(candidate, job, options);
        matches.push({
          job,
          matchScore: match.overallScore,
          matchDetails: match,
        });
      } catch (error) {
        // Log error but continue with other jobs
        console.warn(
          `Failed to match candidate ${candidate.candidateId} with job ${job.jobId}: ${error.message}`
        );
      }
    }

    // Sort by match score (descending)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches.slice(0, options.limit || 10);
  }

  /**
   * Find best candidates for a job
   * @param {Object} job - Job entity
   * @param {Array} candidates - Array of candidate entities
   * @param {Object} options - Matching options
   * @returns {Promise<Array>} Ranked candidate matches
   */
  async findBestCandidatesForJob(job, candidates, options = {}) {
    const matches = [];

    for (const candidate of candidates) {
      try {
        const match = await this.matchCandidateToJob(candidate, job, options);
        matches.push({
          candidate,
          matchScore: match.overallScore,
          matchDetails: match,
        });
      } catch (error) {
        // Log error but continue with other candidates
        console.warn(
          `Failed to match candidate ${candidate.candidateId} with job ${job.jobId}: ${error.message}`
        );
      }
    }

    // Sort by match score (descending)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches.slice(0, options.limit || 20);
  }

  /**
   * Calculate semantic similarity between candidate and job
   * @param {Object} candidateProfile - Candidate profile data
   * @param {Object} jobRequirements - Job requirements data
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async calculateSemanticSimilarity(candidateProfile, jobRequirements) {
    const candidateText = this._buildCandidateText(candidateProfile);
    const jobText = this._buildJobText(jobRequirements);

    return await this._nlpEngine.calculateSemanticSimilarity(
      candidateText,
      jobText
    );
  }

  /**
   * Extract candidate profile information
   * @param {Object} candidate - Candidate entity
   * @returns {Promise<Object>} Extracted profile data
   */
  async _extractCandidateProfile(candidate) {
    // If candidate has a CV, parse it
    if (candidate.cvContent) {
      const parsedCV = await this._cvParser.parseCV(candidate.cvContent);
      return {
        skills: parsedCV.skills,
        experience: parsedCV.experience,
        education: parsedCV.education,
        summary: parsedCV.summary,
        personalInfo: parsedCV.personalInfo,
      };
    }

    // Otherwise, build profile from entity data
    return {
      skills: candidate.skills || [],
      experience: Array.isArray(candidate.experience)
        ? candidate.experience
        : [candidate.experience].filter(Boolean),
      education: candidate.education || [],
      summary: candidate.summary || '',
      personalInfo: {
        location: candidate.location,
        languages: candidate.languages || [],
      },
    };
  }

  /**
   * Extract job requirements
   * @param {Object} job - Job entity
   * @returns {Promise<Object>} Extracted requirements
   */
  async _extractJobRequirements(job) {
    // If job has description, parse it
    if (job.description) {
      const parsedJob = await this._jobDescriptionParser.parseJobDescription(
        job.description
      );
      return {
        skills: parsedJob.skills,
        experience: parsedJob.experience,
        education: parsedJob.education,
        requirements: parsedJob.requirements,
        responsibilities: parsedJob.responsibilities,
        location: parsedJob.location,
        employmentType: parsedJob.employmentType,
      };
    }

    // Otherwise, build requirements from entity data
    return {
      skills: job.requiredSkills || [],
      experience: job.experienceRequirements || { min: 0, max: null },
      education: job.educationRequirements || [],
      requirements: job.requirements || [],
      responsibilities: job.responsibilities || [],
      location: job.location,
      employmentType: job.employmentType,
    };
  }

  /**
   * Calculate comprehensive matching scores
   * @param {Object} candidateProfile - Candidate profile
   * @param {Object} jobRequirements - Job requirements
   * @returns {Promise<Object>} Matching scores
   */
  async _calculateMatchingScores(candidateProfile, jobRequirements) {
    // Calculate skill match score
    const skillMatch = await this._calculateSkillMatch(
      candidateProfile.skills,
      jobRequirements.skills
    );

    // Calculate experience match score
    const experienceMatch = this._calculateExperienceMatch(
      candidateProfile.experience,
      jobRequirements.experience
    );

    // Calculate education match score
    const educationMatch = this._calculateEducationMatch(
      candidateProfile.education,
      jobRequirements.education
    );

    // Calculate location match score
    const locationMatch = this._calculateLocationMatch(
      candidateProfile.personalInfo.location,
      jobRequirements.location
    );

    // Calculate semantic similarity
    const semanticSimilarity = await this.calculateSemanticSimilarity(
      candidateProfile,
      jobRequirements
    );

    // Calculate overall score with weighted average
    const overall = this._calculateOverallScore({
      skillMatch,
      experienceMatch,
      educationMatch,
      locationMatch,
      semanticSimilarity,
    });

    return {
      overall,
      skillMatch,
      experienceMatch,
      educationMatch,
      locationMatch,
      semanticSimilarity,
    };
  }

  /**
   * Calculate skill matching score
   * @param {Array} candidateSkills - Candidate skills
   * @param {Array} jobSkills - Required job skills
   * @returns {Promise<number>} Skill match score (0-1)
   */
  async _calculateSkillMatch(candidateSkills, jobSkills) {
    if (!jobSkills || jobSkills.length === 0) return 1.0; // No requirements = perfect match
    if (!candidateSkills || candidateSkills.length === 0) return 0.0;

    let totalScore = 0;
    let matchedSkills = 0;

    for (const jobSkill of jobSkills) {
      let bestMatch = 0;
      const jobSkillName =
        typeof jobSkill === 'string' ? jobSkill : jobSkill.name;
      const jobProficiency =
        typeof jobSkill === 'string' ? 'intermediate' : jobSkill.proficiency;

      for (const candidateSkill of candidateSkills) {
        const candidateSkillName =
          typeof candidateSkill === 'string'
            ? candidateSkill
            : candidateSkill.name;
        const candidateProficiency =
          typeof candidateSkill === 'string'
            ? 'intermediate'
            : candidateSkill.proficiency;

        // Check exact match first
        if (
          this._normalizeSkillName(candidateSkillName) ===
          this._normalizeSkillName(jobSkillName)
        ) {
          bestMatch = Math.max(
            bestMatch,
            this._calculateProficiencyMatch(
              candidateProficiency,
              jobProficiency
            )
          );
        } else {
          // Use semantic similarity for partial matches
          const similarity = await this._nlpEngine.calculateSemanticSimilarity(
            candidateSkillName,
            jobSkillName
          );
          if (similarity > 0.7) {
            // Threshold for considering as match
            bestMatch = Math.max(
              bestMatch,
              similarity *
                this._calculateProficiencyMatch(
                  candidateProficiency,
                  jobProficiency
                )
            );
          }
        }
      }

      totalScore += bestMatch;
      if (bestMatch > 0.5) matchedSkills++; // Count as matched if score > 0.5
    }

    const averageScore = totalScore / jobSkills.length;
    const coverageRatio = matchedSkills / jobSkills.length;

    // Weight both average proficiency match and coverage
    return averageScore * 0.7 + coverageRatio * 0.3;
  }

  /**
   * Calculate experience matching score
   * @param {Array} candidateExperience - Candidate experience
   * @param {Object} jobExperienceReq - Job experience requirements
   * @returns {number} Experience match score (0-1)
   */
  _calculateExperienceMatch(candidateExperience, jobExperienceReq) {
    if (!jobExperienceReq || jobExperienceReq.min === 0) return 1.0;

    // Calculate total years of experience
    const totalYears = candidateExperience.reduce((total, exp) => {
      // Handle both object with .period and plain strings
      const period = typeof exp === 'string' ? exp : exp.period;
      const duration = this._estimateExperienceDuration(period);
      return total + duration;
    }, 0);

    const minRequired = jobExperienceReq.min || 0;
    const maxRequired = jobExperienceReq.max;

    if (totalYears >= minRequired) {
      if (!maxRequired || totalYears <= maxRequired) {
        return 1.0; // Perfect match
      } else if (totalYears <= maxRequired * 1.5) {
        return 0.8; // Slightly overqualified
      } else {
        return 0.6; // Significantly overqualified
      }
    } else {
      const ratio = totalYears / minRequired;
      return Math.max(0.1, ratio * 0.8); // Partial match based on ratio
    }
  }

  /**
   * Calculate education matching score
   * @param {Array} candidateEducation - Candidate education
   * @param {Array} jobEducationReq - Job education requirements
   * @returns {number} Education match score (0-1)
   */
  _calculateEducationMatch(candidateEducation, jobEducationReq) {
    if (!jobEducationReq || jobEducationReq.length === 0) return 1.0;

    let bestMatch = 0;

    for (const jobReq of jobEducationReq) {
      for (const candidateEdu of candidateEducation) {
        const match = this._calculateEducationLevelMatch(
          candidateEdu.degree,
          jobReq.level
        );
        bestMatch = Math.max(bestMatch, match);
      }
    }

    return bestMatch;
  }

  /**
   * Calculate location matching score
   * @param {string} candidateLocation - Candidate location
   * @param {string} jobLocation - Job location
   * @returns {number} Location match score (0-1)
   */
  _calculateLocationMatch(candidateLocation, jobLocation) {
    if (!candidateLocation || !jobLocation) return 0.5; // Neutral score when location unknown

    const candidate = candidateLocation.toLowerCase();
    const job = jobLocation.toLowerCase();

    if (candidate === job) return 1.0;
    if (candidate.includes('remote') || job.includes('remote')) return 0.9;
    if (candidate.includes('hybrid') || job.includes('hybrid')) return 0.8;

    // Check if same city/region
    const candidateCity = this._extractCity(candidate);
    const jobCity = this._extractCity(job);

    if (candidateCity && jobCity && candidateCity === jobCity) return 0.9;

    return 0.3; // Different locations
  }

  /**
   * Generate recommendations for improvement
   * @param {Object} candidateProfile - Candidate profile
   * @param {Object} jobRequirements - Job requirements
   * @param {Object} scores - Matching scores
   * @returns {Promise<Array>} Recommendations
   */
  async _generateRecommendations(candidateProfile, jobRequirements, scores) {
    const recommendations = [];

    // Skill gap analysis
    if (scores.skillMatch < 0.7) {
      const missingSkills = await this._identifyMissingSkills(
        candidateProfile.skills,
        jobRequirements.skills
      );
      if (missingSkills.length > 0) {
        recommendations.push({
          type: 'skill_gap',
          priority: 'high',
          message: `Consider developing skills in: ${missingSkills.join(', ')}`,
          skills: missingSkills,
        });
      }
    }

    // Experience recommendations
    if (scores.experienceMatch < 0.8) {
      const requiredExp = jobRequirements.experience.min;
      const candidateExp = this._calculateTotalExperience(
        candidateProfile.experience
      );

      if (candidateExp < requiredExp) {
        recommendations.push({
          type: 'experience',
          priority: 'high',
          message: `Gain ${
            requiredExp - candidateExp
          } more years of relevant experience`,
          requiredYears: requiredExp,
          currentYears: candidateExp,
        });
      }
    }

    // Education recommendations
    if (scores.educationMatch < 0.8) {
      const requiredEducation = jobRequirements.education;
      if (requiredEducation && requiredEducation.length > 0) {
        recommendations.push({
          type: 'education',
          priority: 'medium',
          message: `Consider pursuing: ${requiredEducation
            .map(req => req.level)
            .join(' or ')}`,
          requiredDegrees: requiredEducation,
        });
      }
    }

    // Location recommendations
    if (scores.locationMatch < 0.5) {
      recommendations.push({
        type: 'location',
        priority: 'low',
        message: `Consider relocating to ${jobRequirements.location} or look for remote positions`,
        preferredLocation: jobRequirements.location,
      });
    }

    return recommendations;
  }

  /**
   * Identify missing skills
   * @param {Array} candidateSkills - Candidate skills
   * @param {Array} requiredSkills - Required skills
   * @returns {Promise<Array>} Missing skills
   */
  async _identifyMissingSkills(candidateSkills, requiredSkills) {
    const missing = [];
    const candidateSkillNames = candidateSkills.map(s =>
      this._normalizeSkillName(typeof s === 'string' ? s : s.name)
    );

    for (const requiredSkill of requiredSkills) {
      const normalizedRequired = this._normalizeSkillName(
        typeof requiredSkill === 'string' ? requiredSkill : requiredSkill.name
      );
      let hasSkill = false;

      for (const candidateSkill of candidateSkillNames) {
        if (candidateSkill === normalizedRequired) {
          hasSkill = true;
          break;
        }

        const similarity = await this._nlpEngine.calculateSemanticSimilarity(
          candidateSkill,
          normalizedRequired
        );
        if (similarity > 0.8) {
          hasSkill = true;
          break;
        }
      }

      if (!hasSkill) {
        missing.push(
          typeof requiredSkill === 'string' ? requiredSkill : requiredSkill.name
        );
      }
    }

    return missing;
  }

  /**
   * Calculate proficiency match score
   * @param {string} candidateProf - Candidate proficiency
   * @param {string} requiredProf - Required proficiency
   * @returns {number} Proficiency match score (0-1)
   */
  _calculateProficiencyMatch(candidateProf, requiredProf) {
    const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const candidateLevel = levels[candidateProf] || 2;
    const requiredLevel = levels[requiredProf] || 2;

    if (candidateLevel >= requiredLevel) return 1.0;
    if (candidateLevel === requiredLevel - 1) return 0.7;
    return 0.3;
  }

  /**
   * Calculate education level match
   * @param {string} candidateDegree - Candidate degree
   * @param {string} requiredDegree - Required degree
   * @returns {number} Education match score (0-1)
   */
  _calculateEducationLevelMatch(candidateDegree, requiredDegree) {
    const levelHierarchy = {
      'high school': 1,
      associate: 2,
      bachelor: 3,
      master: 4,
      phd: 5,
      doctorate: 5,
    };

    const candidateLevel = levelHierarchy[candidateDegree?.toLowerCase()] || 0;
    const requiredLevel = levelHierarchy[requiredDegree?.toLowerCase()] || 0;

    if (candidateLevel >= requiredLevel) return 1.0;
    return 0.5; // Partial match for lower education level
  }

  /**
   * Calculate overall matching score
   * @param {Object} scores - Individual scores
   * @returns {number} Overall score (0-1)
   */
  _calculateOverallScore(scores) {
    // Weighted average with emphasis on skills and semantic similarity
    return (
      scores.skillMatch * 0.4 +
      scores.experienceMatch * 0.2 +
      scores.educationMatch * 0.15 +
      scores.locationMatch * 0.1 +
      scores.semanticSimilarity * 0.15
    );
  }

  /**
   * Calculate confidence in matching result
   * @param {Object} scores - Matching scores
   * @returns {number} Confidence score (0-1)
   */
  _calculateConfidence(scores) {
    // Higher confidence when scores are more extreme (closer to 0 or 1)
    const variance = Math.abs(scores.skillMatch - 0.5) * 2;
    return Math.min(variance + 0.3, 1.0);
  }

  /**
   * Store matching history
   * @param {Object} result - Matching result
   * @returns {Promise<void>}
   */
  async _storeMatchingHistory(result) {
    try {
      await this._matchingHistoryRepository.save({
        matchingHistoryId: this._generateId(),
        candidateId: result.candidateId,
        jobId: result.jobId,
        overallScore: result.overallScore,
        skillMatch: result.skillMatch,
        experienceMatch: result.experienceMatch,
        educationMatch: result.educationMatch,
        locationMatch: result.locationMatch,
        recommendations: result.recommendations,
        matchedAt: result.matchedAt,
        confidence: result.confidence,
      });
    } catch (error) {
      // Log error but don't fail the matching
      console.warn(`Failed to store matching history: ${error.message}`);
    }
  }

  /**
   * Build candidate text for semantic similarity
   * @param {Object} profile - Candidate profile
   * @returns {string} Combined text
   */
  _buildCandidateText(profile) {
    const parts = [];

    if (profile.summary) parts.push(profile.summary);
    if (profile.skills) parts.push(profile.skills.map(s => s.name).join(' '));
    if (profile.experience)
      parts.push(profile.experience.map(e => e.description).join(' '));

    return parts.join(' ').toLowerCase();
  }

  /**
   * Build job text for semantic similarity
   * @param {Object} requirements - Job requirements
   * @returns {string} Combined text
   */
  _buildJobText(requirements) {
    const parts = [];

    if (requirements.requirements)
      parts.push(requirements.requirements.map(r => r.description).join(' '));
    if (requirements.responsibilities)
      parts.push(requirements.responsibilities.join(' '));
    if (requirements.skills)
      parts.push(requirements.skills.map(s => s.name).join(' '));

    return parts.join(' ').toLowerCase();
  }

  /**
   * Normalize skill name for comparison
   * @param {string} skillName - Skill name
   * @returns {string} Normalized name
   */
  _normalizeSkillName(skillName) {
    if (!skillName || typeof skillName !== 'string') return '';
    return skillName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Estimate experience duration from period text
   * @param {string} period - Period text
   * @returns {number} Duration in years
   */
  _estimateExperienceDuration(period) {
    // Simple estimation - in production, would parse dates properly
    const yearMatch = period.match(/(\d+)\s*years?/i);
    if (yearMatch) return parseInt(yearMatch[1]);

    const monthMatch = period.match(/(\d+)\s*months?/i);
    if (monthMatch) return parseInt(monthMatch[1]) / 12;

    return 1; // Default 1 year if can't parse
  }

  /**
   * Calculate total experience years
   * @param {Array} experience - Experience entries
   * @returns {number} Total years
   */
  _calculateTotalExperience(experience) {
    return experience.reduce((total, exp) => {
      const period = typeof exp === 'string' ? exp : exp.period;
      return total + this._estimateExperienceDuration(period);
    }, 0);
  }

  /**
   * Extract city from location string
   * @param {string} location - Location string
   * @returns {string|null} City name
   */
  _extractCity(location) {
    // Simple extraction - in production, would use proper geocoding
    const cities = ['hanoi', 'ho chi minh', 'da nang', 'hai phong', 'can tho'];
    const lowerLocation = location.toLowerCase();

    for (const city of cities) {
      if (lowerLocation.includes(city)) {
        return city;
      }
    }

    return null;
  }

  /**
   * Calculate skill match score (public method)
   * @param {Array} candidateSkills - Candidate skills (array of strings)
   * @param {Array} jobSkills - Required job skills (array of strings)
   * @returns {number} Skill match score (0-1)
   */
  calculateSkillMatchScore(candidateSkills, jobSkills) {
    if (!jobSkills || jobSkills.length === 0) return 1.0; // No requirements = perfect match
    if (!candidateSkills || candidateSkills.length === 0) return 0.0;

    let totalScore = 0;
    let matchedSkills = 0;

    for (const jobSkill of jobSkills) {
      let bestMatch = 0;

      for (const candidateSkill of candidateSkills) {
        // Check exact match first
        if (
          this._normalizeSkillName(candidateSkill) ===
          this._normalizeSkillName(jobSkill)
        ) {
          bestMatch = 1.0; // Perfect match
        } else {
          // Simple partial match based on string similarity
          const similarity = this._calculateStringSimilarity(
            candidateSkill,
            jobSkill
          );
          if (similarity > 0.7) {
            bestMatch = Math.max(bestMatch, similarity);
          }
        }
      }

      totalScore += bestMatch;
      if (bestMatch > 0.5) matchedSkills++; // Count as matched if score > 0.5
    }

    const averageScore = totalScore / jobSkills.length;
    const coverageRatio = matchedSkills / jobSkills.length;

    // Weight both average proficiency match and coverage
    return averageScore * 0.7 + coverageRatio * 0.3;
  }

  /**
   * Calculate experience match score (public method)
   * @param {string} candidateExperience - Candidate experience string
   * @param {string} jobExperience - Job experience requirement
   * @returns {number} Experience match score (0-1)
   */
  calculateExperienceMatchScore(candidateExperience, jobExperience) {
    // Handle missing experience data
    if (!candidateExperience || candidateExperience.trim() === '') {
      return 0.5; // Neutral score for missing data
    }

    // Parse candidate experience (simple parsing)
    const candidateYears = this._parseExperienceYears(candidateExperience);
    const jobReq = this._parseJobExperienceRequirement(jobExperience);

    return this._calculateExperienceMatch(
      [{ period: `${candidateYears} years` }],
      jobReq
    );
  }

  /**
   * Generate recommendations (public method)
   * @param {Object} matchResult - Match result object
   * @returns {Array} Recommendations array
   */
  generateRecommendations(matchResult) {
    const recommendations = [];

    // Skill-based recommendations
    if ((matchResult.skillMatch || 0) < 0.7) {
      const missingSkills = matchResult.missingSkills || [];
      if (missingSkills.length > 0) {
        recommendations.push(`Consider learning: ${missingSkills.join(', ')}`);
      }
    }

    // Experience-based recommendations
    if ((matchResult.experienceMatch || 0) < 0.8) {
      recommendations.push('Consider gaining more relevant work experience');
    }

    // Education-based recommendations
    if ((matchResult.educationMatch || 0) < 0.9) {
      recommendations.push(
        'Consider pursuing additional education or certifications'
      );
    }

    return recommendations;
  }

  /**
   * Parse experience years from string
   * @param {string} experience - Experience string
   * @returns {number} Years of experience
   */
  _parseExperienceYears(experience) {
    const match = experience.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Parse job experience requirement
   * @param {string} requirement - Experience requirement string
   * @returns {Object} Parsed requirement
   */
  _parseJobExperienceRequirement(requirement) {
    const match = requirement.match(/(\d+)/);
    return { min: match ? parseInt(match[1]) : 0 };
  }

  /**
   * Calculate simple string similarity
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  _calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1.0;

    // Simple Jaccard similarity
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

module.exports = AIMatchingService;
