/**
 * Parse Job Description Use Case
 * Uses AI/NLP to extract structured data from job descriptions
 */

class ParseJobDescriptionUseCase {
  constructor(jobDescriptionParser, jobRepository) {
    this.jobDescriptionParser = jobDescriptionParser;
    this.jobRepository = jobRepository;
  }

  async execute(jobId, jobDescription, options = {}) {
    try {
      // Validate job if jobId provided
      if (jobId) {
        const job = await this.jobRepository.findById(jobId);
        if (!job) throw new Error('Job not found');
      }

      // Parse job description using AI/NLP
      const parseResult = await this.jobDescriptionParser.parseJobDescription(
        jobDescription,
        options
      );

      return {
        success: true,
        data: {
          jobId,
          originalDescription: jobDescription,
          extracted: parseResult.extracted,
          confidence: parseResult.confidence,
          suggestions: parseResult.suggestions,
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

module.exports = ParseJobDescriptionUseCase;
