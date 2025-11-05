/**
 * Remove Saved Job Use Case
 * Removes a job from candidate's saved jobs list
 */

class RemoveSavedJobUseCase {
  constructor(savedJobRepository, jobRepository) {
    this.savedJobRepository = savedJobRepository;
    this.jobRepository = jobRepository;
  }

  async execute(candidateId, savedJobId) {
    try {
      // Find the saved job
      const savedJob = await this.savedJobRepository.findById(savedJobId);
      if (!savedJob) {
        throw new Error('Saved job not found');
      }

      // Verify ownership
      if (savedJob.candidateId !== candidateId) {
        throw new Error('Access denied');
      }

      // Store job info for response
      const jobInfo = {
        id: savedJob.jobId,
        title: savedJob.jobTitle,
        company: savedJob.companyName,
        savedAt: savedJob.savedAt,
      };

      // Remove the saved job
      await this.savedJobRepository.delete(savedJobId);

      // Decrement job's save count
      try {
        await this.jobRepository.decrementSaveCount(savedJob.jobId);
      } catch (error) {
        // Don't fail if job no longer exists
        console.warn(
          `Could not decrement save count for job ${savedJob.jobId}:`,
          error.message
        );
      }

      // Get updated saved jobs count
      const remainingSavedJobs =
        await this.savedJobRepository.countByCandidateId(candidateId);

      return {
        success: true,
        data: {
          removedJob: jobInfo,
          remainingSavedJobs,
        },
        message: 'Job removed from saved list successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remove multiple saved jobs at once
   */
  async executeBulk(candidateId, savedJobIds) {
    try {
      if (!Array.isArray(savedJobIds) || savedJobIds.length === 0) {
        throw new Error('No saved job IDs provided');
      }

      // Find all saved jobs belonging to the candidate
      const savedJobs = await this.savedJobRepository.find({
        _id: { $in: savedJobIds },
        candidateId,
      });

      if (savedJobs.length === 0) {
        return {
          success: true,
          data: { removedCount: 0 },
          message: 'No saved jobs found to remove',
        };
      }

      // Store job info for response
      const removedJobs = savedJobs.map(savedJob => ({
        id: savedJob.jobId,
        title: savedJob.jobTitle,
        company: savedJob.companyName,
        savedAt: savedJob.savedAt,
      }));

      // Remove all saved jobs
      const deletePromises = savedJobs.map(savedJob =>
        this.savedJobRepository.delete(savedJob.id)
      );
      await Promise.all(deletePromises);

      // Decrement save counts for all jobs
      const decrementPromises = savedJobs.map(async savedJob => {
        try {
          await this.jobRepository.decrementSaveCount(savedJob.jobId);
        } catch (error) {
          console.warn(
            `Could not decrement save count for job ${savedJob.jobId}:`,
            error.message
          );
        }
      });
      await Promise.all(decrementPromises);

      // Get updated saved jobs count
      const remainingSavedJobs =
        await this.savedJobRepository.countByCandidateId(candidateId);

      return {
        success: true,
        data: {
          removedJobs,
          removedCount: savedJobs.length,
          remainingSavedJobs,
        },
        message: `Removed ${savedJobs.length} job(s) from saved list successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = RemoveSavedJobUseCase;
