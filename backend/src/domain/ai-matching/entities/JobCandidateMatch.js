/**
 * JobCandidateMatch Entity
 * Domain: AI-Matching
 * Represents a match between a job posting and a candidate
 */
class JobCandidateMatch {
  constructor(props) {
    this.id = props.id;
    this.jobId = props.jobId;
    this.candidateId = props.candidateId;
    this.matchScore = props.matchScore || 0;
    this.matchType = props.matchType;
    this.matchingAlgorithm = props.matchingAlgorithm;
    this.matchStatus = props.matchStatus;
    this.matchingCriteria = props.matchingCriteria || {};
    this.explanation = props.explanation || '';
    this.calculatedAt = props.calculatedAt;
    this.expiresAt = props.expiresAt;

    this.validate();
  }

  validate() {
    if (!this.jobId) {
      throw new Error('Job ID is required');
    }
    if (!this.candidateId) {
      throw new Error('Candidate ID is required');
    }
    if (this.matchScore < 0 || this.matchScore > 1) {
      throw new Error('Match score must be between 0 and 1');
    }
    if (!this.matchType) {
      throw new Error('Match type is required');
    }
    if (!this.matchingAlgorithm) {
      throw new Error('Matching algorithm is required');
    }
    if (!this.matchStatus) {
      throw new Error('Match status is required');
    }
  }

  isHighMatch() {
    return this.matchScore >= 0.8;
  }

  isMediumMatch() {
    return this.matchScore >= 0.6 && this.matchScore < 0.8;
  }

  isLowMatch() {
    return this.matchScore < 0.6;
  }

  isExpired() {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  isValid() {
    return this.matchStatus === 'CALCULATED' && !this.isExpired();
  }

  updateScore(newScore) {
    if (newScore < 0 || newScore > 1) {
      throw new Error('Match score must be between 0 and 1');
    }
    this.matchScore = newScore;
    this.calculatedAt = new Date();
  }

  invalidate() {
    this.matchStatus = 'INVALIDATED';
  }

  toJSON() {
    return {
      id: this.id,
      jobId: this.jobId,
      candidateId: this.candidateId,
      matchScore: this.matchScore,
      matchType: this.matchType,
      matchingAlgorithm: this.matchingAlgorithm,
      matchStatus: this.matchStatus,
      matchingCriteria: this.matchingCriteria,
      explanation: this.explanation,
      calculatedAt: this.calculatedAt,
      expiresAt: this.expiresAt,
      isValid: this.isValid(),
      matchLevel: this.isHighMatch() ? 'HIGH' : this.isMediumMatch() ? 'MEDIUM' : 'LOW'
    };
  }
}

module.exports = JobCandidateMatch;