/**
 * SkillGapAnalysis Entity
 * Domain: Skill Development
 * Represents the analysis of skill gaps between candidate's current skills and job requirements
 */
class SkillGapAnalysis {
  constructor(props) {
    this._gapId = props.gapId;
    this._candidateId = props.candidateId;
    this._jobId = props.jobId;
    this._currentSkills = props.currentSkills || []; // Array of skill IDs with proficiency levels
    this._requiredSkills = props.requiredSkills || []; // Array of skill IDs with required levels
    this._skillGaps = props.skillGaps || []; // Array of { skillId, currentLevel, requiredLevel, gapLevel }
    this._overallMatchScore = props.overallMatchScore || 0; // 0-100
    this._recommendations = props.recommendations || [];
    this._analysisDate = props.analysisDate || new Date();

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._gapId) {
      throw new Error('Gap ID is required');
    }
    if (!this._candidateId) {
      throw new Error('Candidate ID is required');
    }
    if (!this._jobId) {
      throw new Error('Job ID is required');
    }
    if (!Array.isArray(this._currentSkills)) {
      throw new Error('Current skills must be an array');
    }
    if (!Array.isArray(this._requiredSkills)) {
      throw new Error('Required skills must be an array');
    }
    if (!Array.isArray(this._skillGaps)) {
      throw new Error('Skill gaps must be an array');
    }
    if (!Array.isArray(this._recommendations)) {
      throw new Error('Recommendations must be an array');
    }
    if (this._overallMatchScore < 0 || this._overallMatchScore > 100) {
      throw new Error('Overall match score must be between 0 and 100');
    }
  }

  // Getters
  get gapId() {
    return this._gapId;
  }

  get candidateId() {
    return this._candidateId;
  }

  get jobId() {
    return this._jobId;
  }

  get currentSkills() {
    return [...this._currentSkills];
  }

  get requiredSkills() {
    return [...this._requiredSkills];
  }

  get skillGaps() {
    return [...this._skillGaps];
  }

  get overallMatchScore() {
    return this._overallMatchScore;
  }

  get recommendations() {
    return [...this._recommendations];
  }

  get analysisDate() {
    return this._analysisDate;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  /**
   * Calculate skill gap level
   * @param {number} currentLevel
   * @param {number} requiredLevel
   * @returns {string} 'none', 'low', 'medium', 'high', 'critical'
   */
  static calculateGapLevel(currentLevel, requiredLevel) {
    const gap = requiredLevel - currentLevel;
    if (gap <= 0) return 'none';
    if (gap <= 1) return 'low';
    if (gap <= 2) return 'medium';
    if (gap <= 3) return 'high';
    return 'critical';
  }

  /**
   * Analyze skill gaps
   * @param {Array} currentSkills - [{ skillId, level }]
   * @param {Array} requiredSkills - [{ skillId, level }]
   * @returns {Array} skillGaps - [{ skillId, currentLevel, requiredLevel, gapLevel }]
   */
  static analyzeGaps(currentSkills, requiredSkills) {
    const skillMap = new Map();
    const gaps = [];

    // Create map of current skills
    currentSkills.forEach(skill => {
      skillMap.set(skill.skillId, skill.level);
    });

    // Analyze each required skill
    requiredSkills.forEach(required => {
      const currentLevel = skillMap.get(required.skillId) || 0;
      const gapLevel = this.calculateGapLevel(currentLevel, required.level);

      gaps.push({
        skillId: required.skillId,
        currentLevel,
        requiredLevel: required.level,
        gapLevel,
      });
    });

    return gaps;
  }

  /**
   * Calculate overall match score
   * @param {Array} skillGaps
   * @returns {number}
   */
  static calculateMatchScore(skillGaps) {
    if (skillGaps.length === 0) return 100;

    const gapWeights = {
      none: 1,
      low: 0.8,
      medium: 0.6,
      high: 0.3,
      critical: 0,
    };

    const totalScore = skillGaps.reduce((sum, gap) => {
      return sum + gapWeights[gap.gapLevel];
    }, 0);

    return Math.round((totalScore / skillGaps.length) * 100);
  }

  /**
   * Update skill gap analysis
   * @param {Array} currentSkills
   * @param {Array} requiredSkills
   */
  updateAnalysis(currentSkills, requiredSkills) {
    this._currentSkills = [...currentSkills];
    this._requiredSkills = [...requiredSkills];
    this._skillGaps = SkillGapAnalysis.analyzeGaps(
      currentSkills,
      requiredSkills
    );
    this._overallMatchScore = SkillGapAnalysis.calculateMatchScore(
      this._skillGaps
    );
    this._analysisDate = new Date();
    this._updatedAt = new Date();

    this.validate();
  }

  /**
   * Add recommendation
   * @param {Object} recommendation
   */
  addRecommendation(recommendation) {
    this._recommendations.push(recommendation);
    this._updatedAt = new Date();
  }

  /**
   * Get critical gaps
   * @returns {Array}
   */
  getCriticalGaps() {
    return this._skillGaps.filter(gap => gap.gapLevel === 'critical');
  }

  /**
   * Get high priority gaps
   * @returns {Array}
   */
  getHighPriorityGaps() {
    return this._skillGaps.filter(
      gap => gap.gapLevel === 'critical' || gap.gapLevel === 'high'
    );
  }

  /**
   * Get gaps by level
   * @param {string} level
   * @returns {Array}
   */
  getGapsByLevel(level) {
    return this._skillGaps.filter(gap => gap.gapLevel === level);
  }

  /**
   * Check if candidate meets minimum requirements
   * @returns {boolean}
   */
  meetsMinimumRequirements() {
    return this._skillGaps.every(gap => gap.gapLevel !== 'critical');
  }

  /**
   * Get improvement priority order
   * @returns {Array}
   */
  getImprovementPriority() {
    const priorityOrder = ['critical', 'high', 'medium', 'low', 'none'];
    return this._skillGaps.sort((a, b) => {
      return (
        priorityOrder.indexOf(a.gapLevel) - priorityOrder.indexOf(b.gapLevel)
      );
    });
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      gapId: this._gapId,
      candidateId: this._candidateId,
      jobId: this._jobId,
      currentSkills: this._currentSkills,
      requiredSkills: this._requiredSkills,
      skillGaps: this._skillGaps,
      overallMatchScore: this._overallMatchScore,
      recommendations: this._recommendations,
      analysisDate: this._analysisDate,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = SkillGapAnalysis;
