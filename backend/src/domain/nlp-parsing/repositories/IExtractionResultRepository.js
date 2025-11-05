/**
 * IExtractionResultRepository Interface
 * Domain: NLP-Parsing
 * Repository interface for ExtractionResult entity
 */
class IExtractionResultRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByParsedDocumentId(parsedDocumentId) {
    throw new Error('Method not implemented');
  }

  async findByExtractionType(extractionType) {
    throw new Error('Method not implemented');
  }

  async findByConfidenceRange(minConfidence, maxConfidence) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(extractionResult) {
    throw new Error('Method not implemented');
  }

  async update(extractionResult) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }

  async deleteByParsedDocumentId(parsedDocumentId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IExtractionResultRepository;