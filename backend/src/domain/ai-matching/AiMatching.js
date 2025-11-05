/**
 * AiMatching Domain Entity
 * Represents AI-powered candidate-job matching result
 *
 * Business Rules:
 * - All scores must be between 0 and 1
 * - Overall score is weighted average of component scores
 * - Confidence must be between 0 and 1
 * - High confidence + low score = clear mismatch
 * - Low confidence = need more data or manual review
 * - Recommendations are generated based on score breakdowns
 */

const MatchType = {
  INITIAL: 'INITIAL', // First time matching
  REFINED: 'REFINED', // After CV analysis
  MANUAL: 'MANUAL', // Manually triggered
  AUTO: 'AUTO', // Automatically triggered
};

const MatchQuality = {
  EXCELLENT: 'EXCELLENT', // 80-100%
  GOOD: 'GOOD', // 60-80%
  FAIR: 'FAIR', // 40-60%
  POOR: 'POOR', // 0-40%
};

class AiMatching {
  constructor(
    id,
    matchId,
    candidateId,
    jobId,
    overallScore,
    skillMatch,
    experienceMatch,
    educationMatch,
    locationMatch,
    confidence,
    matchType = MatchType.AUTO,
    recommendations = null,
    metadata = null,
    matchedAt = null,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.matchId = matchId;
    this.candidateId = candidateId;
    this.jobId = jobId;
    this.overallScore = overallScore;
    this.skillMatch = skillMatch;
    this.experienceMatch = experienceMatch;
    this.educationMatch = educationMatch;
    this.locationMatch = locationMatch;
    this.confidence = confidence;
    this.matchType = matchType;
    this.recommendations = recommendations || [];
    this.metadata = metadata || {};
    this.matchedAt = matchedAt || new Date();
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    if (!this.id) {
      throw new Error('Matching ID is required');
    }

    if (!this.matchId) {
      throw new Error('Match ID is required');
    }

    if (!this.candidateId) {
      throw new Error('Candidate ID is required');
    }

    if (!this.jobId) {
      throw new Error('Job ID is required');
    }

    // Validate all scores are between 0 and 1
    this.validateScore(this.overallScore, 'Overall score');
    this.validateScore(this.skillMatch, 'Skill match');
    this.validateScore(this.experienceMatch, 'Experience match');
    this.validateScore(this.educationMatch, 'Education match');
    this.validateScore(this.locationMatch, 'Location match');
    this.validateScore(this.confidence, 'Confidence');

    if (!this.matchType || !Object.values(MatchType).includes(this.matchType)) {
      throw new Error('Valid match type is required');
    }

    if (!Array.isArray(this.recommendations)) {
      throw new Error('Recommendations must be an array');
    }
  }

  validateScore(score, name) {
    if (typeof score !== 'number') {
      throw new Error(`${name} must be a number`);
    }

    if (score < 0 || score > 1) {
      throw new Error(`${name} must be between 0 and 1`);
    }
  }

  // ============================================
  // Score Calculations
  // ============================================

  recalculateOverallScore(weights = null) {
    // Default weights (must sum to 1.0)
    const defaultWeights = {
      skill: 0.4, // Skills are most important
      experience: 0.25,
      education: 0.2,
      location: 0.15,
    };

    const w = weights || defaultWeights;

    this.overallScore =
      this.skillMatch * w.skill +
      this.experienceMatch * w.experience +
      this.educationMatch * w.education +
      this.locationMatch * w.location;

    this.updatedAt = new Date();
    return this.overallScore;
  }

  getScorePercentage() {
    return Math.round(this.overallScore * 100);
  }

  getQuality() {
    const percentage = this.getScorePercentage();

    if (percentage >= 80) return MatchQuality.EXCELLENT;
    if (percentage >= 60) return MatchQuality.GOOD;
    if (percentage >= 40) return MatchQuality.FAIR;
    return MatchQuality.POOR;
  }

  isExcellentMatch() {
    return this.getQuality() === MatchQuality.EXCELLENT;
  }

  isGoodMatch() {
    return this.getQuality() === MatchQuality.GOOD;
  }

  isPoorMatch() {
    return this.getQuality() === MatchQuality.POOR;
  }

  // ============================================
  // Component Score Analysis
  // ============================================

  getStrongestArea() {
    const scores = {
      Skills: this.skillMatch,
      Experience: this.experienceMatch,
      Education: this.educationMatch,
      Location: this.locationMatch,
    };

    let maxScore = 0;
    let maxArea = null;

    for (const [area, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxArea = area;
      }
    }

    return { area: maxArea, score: maxScore };
  }

  getWeakestArea() {
    const scores = {
      Skills: this.skillMatch,
      Experience: this.experienceMatch,
      Education: this.educationMatch,
      Location: this.locationMatch,
    };

    let minScore = 1;
    let minArea = null;

    for (const [area, score] of Object.entries(scores)) {
      if (score < minScore) {
        minScore = score;
        minArea = area;
      }
    }

    return { area: minArea, score: minScore };
  }

  getScoreBreakdown() {
    return {
      overall: this.getScorePercentage(),
      skill: Math.round(this.skillMatch * 100),
      experience: Math.round(this.experienceMatch * 100),
      education: Math.round(this.educationMatch * 100),
      location: Math.round(this.locationMatch * 100),
      confidence: Math.round(this.confidence * 100),
    };
  }

  // ============================================
  // Confidence Analysis
  // ============================================

  hasHighConfidence() {
    return this.confidence >= 0.8;
  }

  hasLowConfidence() {
    return this.confidence < 0.5;
  }

  needsManualReview() {
    // Low confidence OR borderline scores
    if (this.hasLowConfidence()) {
      return true;
    }

    const percentage = this.getScorePercentage();
    // Borderline cases (55-65%)
    if (percentage >= 55 && percentage <= 65) {
      return true;
    }

    return false;
  }

  isReliable() {
    return this.hasHighConfidence() && !this.needsManualReview();
  }

  // ============================================
  // Recommendations Management
  // ============================================

  addRecommendation(text) {
    if (!text || text.trim() === '') {
      throw new Error('Recommendation text is required');
    }

    if (!this.recommendations.includes(text)) {
      this.recommendations.push(text.trim());
      this.updatedAt = new Date();
    }
  }

  removeRecommendation(text) {
    const index = this.recommendations.indexOf(text);
    if (index > -1) {
      this.recommendations.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  clearRecommendations() {
    this.recommendations = [];
    this.updatedAt = new Date();
  }

  generateRecommendations() {
    this.clearRecommendations();

    const scores = this.getScoreBreakdown();

    // Skill recommendations
    if (scores.skill < 60) {
      this.addRecommendation(
        'Consider developing additional technical skills to better match job requirements'
      );
    } else if (scores.skill >= 80) {
      this.addRecommendation(
        'Excellent skill match! Highlight these skills in your application'
      );
    }

    // Experience recommendations
    if (scores.experience < 50) {
      this.addRecommendation(
        'Gain more relevant work experience or emphasize transferable skills'
      );
    } else if (scores.experience >= 80) {
      this.addRecommendation(
        'Your experience aligns well with the role requirements'
      );
    }

    // Education recommendations
    if (scores.education < 50) {
      this.addRecommendation(
        'Consider pursuing additional certifications or education in this field'
      );
    }

    // Location recommendations
    if (scores.location < 70) {
      this.addRecommendation(
        'This position may require relocation or remote work arrangements'
      );
    }

    // Overall recommendations
    if (this.isExcellentMatch()) {
      this.addRecommendation(
        'Highly recommended! You are an excellent fit for this position'
      );
    } else if (this.isGoodMatch()) {
      this.addRecommendation(
        'Good match! Consider applying and highlighting your strengths'
      );
    } else if (this.isPoorMatch()) {
      this.addRecommendation(
        'This may not be the best fit. Consider roles that better match your profile'
      );
    }

    if (this.needsManualReview()) {
      this.addRecommendation(
        'Manual review recommended to assess fit more accurately'
      );
    }

    this.updatedAt = new Date();
    return this.recommendations;
  }

  hasRecommendations() {
    return this.recommendations.length > 0;
  }

  // ============================================
  // Metadata Management
  // ============================================

  setMetadata(key, value) {
    if (!key) {
      throw new Error('Metadata key is required');
    }

    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  getMetadata(key) {
    return this.metadata[key] || null;
  }

  // ============================================
  // Match Type
  // ============================================

  isInitialMatch() {
    return this.matchType === MatchType.INITIAL;
  }

  isRefinedMatch() {
    return this.matchType === MatchType.REFINED;
  }

  isManualMatch() {
    return this.matchType === MatchType.MANUAL;
  }

  isAutoMatch() {
    return this.matchType === MatchType.AUTO;
  }

  // ============================================
  // Time Analysis
  // ============================================

  getAgeInDays() {
    if (!this.matchedAt) {
      return 0;
    }

    const now = new Date();
    return Math.floor((now - this.matchedAt) / (1000 * 60 * 60 * 24));
  }

  isRecent(days = 7) {
    return this.getAgeInDays() < days;
  }

  isStale(days = 30) {
    return this.getAgeInDays() > days;
  }

  // ============================================
  // Comparison & Ranking
  // ============================================

  compareTo(otherMatch) {
    // Compare overall scores
    if (this.overallScore > otherMatch.overallScore) {
      return 1;
    } else if (this.overallScore < otherMatch.overallScore) {
      return -1;
    }

    // If equal, prefer higher confidence
    if (this.confidence > otherMatch.confidence) {
      return 1;
    } else if (this.confidence < otherMatch.confidence) {
      return -1;
    }

    return 0;
  }

  isBetterThan(otherMatch) {
    return this.compareTo(otherMatch) > 0;
  }

  // ============================================
  // Display Information
  // ============================================

  getSummary() {
    return {
      matchId: this.matchId,
      overallScore: this.getScorePercentage(),
      quality: this.getQuality(),
      confidence: Math.round(this.confidence * 100),
      breakdown: this.getScoreBreakdown(),
      strongest: this.getStrongestArea(),
      weakest: this.getWeakestArea(),
      needsReview: this.needsManualReview(),
      matchType: this.matchType,
      matchedAt: this.matchedAt,
    };
  }

  toJSON() {
    return {
      id: this.id,
      matchId: this.matchId,
      candidateId: this.candidateId,
      jobId: this.jobId,
      scores: this.getScoreBreakdown(),
      quality: this.getQuality(),
      confidence: this.confidence,
      matchType: this.matchType,
      recommendations: this.recommendations,
      needsManualReview: this.needsManualReview(),
      matchedAt: this.matchedAt,
    };
  }
}

// Export class and constants
AiMatching.Type = MatchType;
AiMatching.Quality = MatchQuality;

module.exports = AiMatching;
