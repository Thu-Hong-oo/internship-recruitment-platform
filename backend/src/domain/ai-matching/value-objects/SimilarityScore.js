/**
 * SimilarityScore Value Object
 * Domain: AI-Matching
 * Represents a similarity score between two entities (candidate and job)
 */
class SimilarityScore {
  constructor(props) {
    this.overall = props.overall || 0;
    this.skillSimilarity = props.skillSimilarity || 0;
    this.experienceSimilarity = props.experienceSimilarity || 0;
    this.educationSimilarity = props.educationSimilarity || 0;
    this.locationSimilarity = props.locationSimilarity || 0;
    this.salarySimilarity = props.salarySimilarity || 0;
    this.customSimilarities = props.customSimilarities || {};

    this.validate();
  }

  validate() {
    const scores = [
      this.overall,
      this.skillSimilarity,
      this.experienceSimilarity,
      this.educationSimilarity,
      this.locationSimilarity,
      this.salarySimilarity,
      ...Object.values(this.customSimilarities)
    ];

    for (const score of scores) {
      if (score < 0 || score > 1) {
        throw new Error('All similarity scores must be between 0 and 1');
      }
    }
  }

  isHighSimilarity() {
    return this.overall >= 0.8;
  }

  isMediumSimilarity() {
    return this.overall >= 0.6 && this.overall < 0.8;
  }

  isLowSimilarity() {
    return this.overall < 0.6;
  }

  getWeightedScore(weights) {
    let weightedScore = 0;

    if (weights.skillWeight) {
      weightedScore += this.skillSimilarity * weights.skillWeight;
    }
    if (weights.experienceWeight) {
      weightedScore += this.experienceSimilarity * weights.experienceWeight;
    }
    if (weights.educationWeight) {
      weightedScore += this.educationSimilarity * weights.educationWeight;
    }
    if (weights.locationWeight) {
      weightedScore += this.locationSimilarity * weights.locationWeight;
    }
    if (weights.salaryWeight) {
      weightedScore += this.salarySimilarity * weights.salaryWeight;
    }

    // Add custom similarities
    for (const [key, similarity] of Object.entries(this.customSimilarities)) {
      const weight = weights.customWeights?.[key] || 0;
      weightedScore += similarity * weight;
    }

    return Math.min(weightedScore, 1); // Cap at 1.0
  }

  addCustomSimilarity(key, score) {
    if (score < 0 || score > 1) {
      throw new Error('Custom similarity score must be between 0 and 1');
    }
    this.customSimilarities[key] = score;
  }

  removeCustomSimilarity(key) {
    delete this.customSimilarities[key];
  }

  equals(other) {
    return other instanceof SimilarityScore &&
           this.overall === other.overall &&
           this.skillSimilarity === other.skillSimilarity &&
           this.experienceSimilarity === other.experienceSimilarity &&
           this.educationSimilarity === other.educationSimilarity &&
           this.locationSimilarity === other.locationSimilarity &&
           this.salarySimilarity === other.salarySimilarity &&
           JSON.stringify(this.customSimilarities) === JSON.stringify(other.customSimilarities);
  }

  toJSON() {
    return {
      overall: this.overall,
      skillSimilarity: this.skillSimilarity,
      experienceSimilarity: this.experienceSimilarity,
      educationSimilarity: this.educationSimilarity,
      locationSimilarity: this.locationSimilarity,
      salarySimilarity: this.salarySimilarity,
      customSimilarities: this.customSimilarities,
      similarityLevel: this.isHighSimilarity() ? 'HIGH' : this.isMediumSimilarity() ? 'MEDIUM' : 'LOW'
    };
  }
}

module.exports = SimilarityScore;