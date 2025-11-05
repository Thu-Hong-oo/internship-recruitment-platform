/**
 * ExtractionResult Entity
 * Domain: NLP-Parsing
 * Represents the result of extracting specific information from a document
 */
class ExtractionResult {
  constructor(props) {
    this.id = props.id;
    this.parsedDocumentId = props.parsedDocumentId;
    this.extractionType = props.extractionType;
    this.extractedValue = props.extractedValue;
    this.confidenceScore = props.confidenceScore || 0;
    this.sourceText = props.sourceText || '';
    this.position = props.position || { start: 0, end: 0 };
    this.metadata = props.metadata || {};

    this.validate();
  }

  validate() {
    if (!this.parsedDocumentId) {
      throw new Error('Parsed document ID is required');
    }
    if (!this.extractionType) {
      throw new Error('Extraction type is required');
    }
    if (this.confidenceScore < 0 || this.confidenceScore > 1) {
      throw new Error('Confidence score must be between 0 and 1');
    }
  }

  isHighConfidence() {
    return this.confidenceScore >= 0.8;
  }

  isMediumConfidence() {
    return this.confidenceScore >= 0.6 && this.confidenceScore < 0.8;
  }

  isLowConfidence() {
    return this.confidenceScore < 0.6;
  }

  updateConfidence(newScore) {
    if (newScore < 0 || newScore > 1) {
      throw new Error('Confidence score must be between 0 and 1');
    }
    this.confidenceScore = newScore;
  }

  addMetadata(key, value) {
    this.metadata[key] = value;
  }

  getMetadata(key) {
    return this.metadata[key];
  }

  toJSON() {
    return {
      id: this.id,
      parsedDocumentId: this.parsedDocumentId,
      extractionType: this.extractionType,
      extractedValue: this.extractedValue,
      confidenceScore: this.confidenceScore,
      sourceText: this.sourceText,
      position: this.position,
      metadata: this.metadata
    };
  }
}

module.exports = ExtractionResult;