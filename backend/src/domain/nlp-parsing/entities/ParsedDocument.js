/**
 * ParsedDocument Entity
 * Domain: NLP-Parsing
 * Represents a document that has been parsed for information extraction
 */
class ParsedDocument {
  constructor(props) {
    this.id = props.id;
    this.documentId = props.documentId; // Reference to uploaded document
    this.documentType = props.documentType;
    this.parsingStatus = props.parsingStatus;
    this.extractedData = props.extractedData || {};
    this.confidenceScore = props.confidenceScore || 0;
    this.parsedAt = props.parsedAt;
    this.processingTime = props.processingTime || 0;

    this.validate();
  }

  validate() {
    if (!this.documentId) {
      throw new Error('Document ID is required');
    }
    if (!this.documentType) {
      throw new Error('Document type is required');
    }
    if (!this.parsingStatus) {
      throw new Error('Parsing status is required');
    }
    if (this.confidenceScore < 0 || this.confidenceScore > 1) {
      throw new Error('Confidence score must be between 0 and 1');
    }
  }

  isCompleted() {
    return this.parsingStatus === 'COMPLETED';
  }

  isFailed() {
    return this.parsingStatus === 'FAILED';
  }

  updateStatus(status, confidenceScore = null) {
    this.parsingStatus = status;
    if (confidenceScore !== null) {
      this.confidenceScore = confidenceScore;
    }
    this.parsedAt = new Date();
  }

  addExtractedData(type, data) {
    this.extractedData[type] = data;
  }

  getExtractedData(type) {
    return this.extractedData[type];
  }

  toJSON() {
    return {
      id: this.id,
      documentId: this.documentId,
      documentType: this.documentType,
      parsingStatus: this.parsingStatus,
      extractedData: this.extractedData,
      confidenceScore: this.confidenceScore,
      parsedAt: this.parsedAt,
      processingTime: this.processingTime
    };
  }
}

module.exports = ParsedDocument;