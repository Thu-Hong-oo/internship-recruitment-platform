/**
 * Save Job Use Case
 * Allows candidates to save/bookmark jobs for later
 */

class SaveJobUseCase {
  constructor(savedJobRepository, jobRepository, candidateRepository) {
    this.savedJobRepository = savedJobRepository;
    this.jobRepository = jobRepository;
    this.candidateRepository = candidateRepository;
  }

  async execute(candidateId, jobId, metadata = {}) {
    try {
      // Validate candidate exists
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Validate job exists and is active
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status !== 'published') {
        throw new Error('Cannot save unpublished job');
      }

      // Check if job is already saved
      const existingSavedJob =
        await this.savedJobRepository.findByCandidateAndJob(candidateId, jobId);
      if (existingSavedJob) {
        return {
          success: true,
          data: existingSavedJob,
          message: 'Job already saved',
        };
      }

      // Create saved job record
      const savedJobData = {
        candidateId,
        jobId,
        jobTitle: job.title,
        companyName: job.company?.name || 'Unknown Company',
        location: job.location,
        salaryRange: job.salaryRange,
        tags: metadata.tags || [],
        notes: metadata.notes || '',
        priority: metadata.priority || 'normal', // low, normal, high
        folder: metadata.folder || 'default', // for organization
        savedAt: new Date(),
        reminderDate: metadata.reminderDate,
        status: 'saved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedJob = await this.savedJobRepository.create(savedJobData);

      // Update job's save count
      await this.jobRepository.incrementSaveCount(jobId);

      // Get updated saved jobs count for candidate
      const totalSavedJobs = await this.savedJobRepository.countByCandidateId(
        candidateId
      );

      return {
        success: true,
        data: {
          savedJob,
          job: {
            id: job.id,
            title: job.title,
            company: job.company?.name,
            location: job.location,
            publishedAt: job.publishedAt,
          },
          totalSavedJobs,
        },
        message: 'Job saved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = SaveJobUseCase;
