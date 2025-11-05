/**
 * IJobCandidateMatchRepository Interface
 * Domain: AI-Matching
 * Repository interface for JobCandidateMatch entity
 */
class IJobCandidateMatchRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByJobId(jobId) {
    throw new Error('Method not implemented');
  }

  async findByCandidateId(candidateId) {
    throw new Error('Method not implemented');
  }

  async findByJobAndCandidate(jobId, candidateId) {
    throw new Error('Method not implemented');
  }

  async findByScoreRange(minScore, maxScore) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findTopMatchesForJob(jobId, limit = 10) {
    throw new Error('Method not implemented');
  }

  async findTopMatchesForCandidate(candidateId, limit = 10) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(match) {
    throw new Error('Method not implemented');
  }

  async update(match) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }

  async deleteExpiredMatches() {
    throw new Error('Method not implemented');
  }
}

module.exports = IJobCandidateMatchRepository;