/**
 * Parse CV Use Case
 * Uses AI/NLP to extract information from CVs
 */

class ParseCVUseCase {
  constructor(cvParser, candidateRepository) {
    this.cvParser = cvParser;
    this.candidateRepository = candidateRepository;
  }

  async execute(candidateId, cvFile, options = {}) {
    try {
      // Validate candidate
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) throw new Error('Candidate not found');

      // Parse CV using AI/NLP
      const parseResult = await this.cvParser.parseCV(cvFile, options);

      return {
        success: true,
        data: {
          candidateId,
          cvFile: {
            name: cvFile.name,
            size: cvFile.size,
            type: cvFile.type,
          },
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

module.exports = ParseCVUseCase;
