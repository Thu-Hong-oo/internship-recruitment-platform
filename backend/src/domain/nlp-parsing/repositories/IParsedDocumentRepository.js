/**
 * IParsedDocumentRepository Interface
 * Domain: NLP-Parsing
 * Repository interface for ParsedDocument entity
 */
class IParsedDocumentRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByDocumentId(documentId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findByDocumentType(documentType) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(parsedDocument) {
    throw new Error('Method not implemented');
  }

  async update(parsedDocument) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IParsedDocumentRepository;