/**
 * Match Candidate To Job Use Case
 * Uses AI to match candidates with job postings
 */

class MatchCandidateToJobUseCase {
  constructor(
    aiMatchingService,
    candidateRepository,
    jobRepository,
    matchingHistoryRepository
  ) {
    this.aiMatchingService = aiMatchingService;
    this.candidateRepository = candidateRepository;
    this.jobRepository = jobRepository;
    this.matchingHistoryRepository = matchingHistoryRepository;
  }

  async execute(candidateId, jobId, options = {}) {
    try {
      // Get candidate and job data
      const [candidate, job] = await Promise.all([
        this.candidateRepository.findById(candidateId),
        this.jobRepository.findById(jobId),
      ]);

      if (!candidate) throw new Error('Candidate not found');
      if (!job) throw new Error('Job not found');

      // Perform AI matching
      const matchResult = await this.aiMatchingService.matchCandidateToJob(
        candidate,
        job,
        options
      );

      // Save matching history
      const historyRecord = {
        candidateId,
        jobId,
        matchScore: matchResult.overallScore,
        matchDetails: matchResult.details,
        algorithm: matchResult.algorithm,
        version: matchResult.version,
        createdAt: new Date(),
      };

      await this.matchingHistoryRepository.create(historyRecord);

      return {
        success: true,
        data: {
          candidate: {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
          },
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
          },
          matching: matchResult,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = MatchCandidateToJobUseCase;
