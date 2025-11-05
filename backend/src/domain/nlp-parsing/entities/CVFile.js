/**
 * CVFile Entity
 * Domain: NLP Parsing
 * Represents a CV/resume file uploaded by a candidate
 */
class CVFile {
  constructor(props) {
    this._fileId = props.fileId;
    this._candidateId = props.candidateId;
    this._fileName = props.fileName;
    this._fileUrl = props.fileUrl;
    this._fileSize = props.fileSize;
    this._mimeType = props.mimeType;
    this._parsingStatus = props.parsingStatus || 'PENDING';
    this._parsedData = props.parsedData || null;
    this._parsingError = props.parsingError || null;

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._candidateId) {
      throw new Error('Candidate ID is required');
    }
    if (!this._fileName) {
      throw new Error('File name is required');
    }
    if (!this._fileUrl) {
      throw new Error('File URL is required');
    }
    if (!this._mimeType) {
      throw new Error('MIME type is required');
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(this._parsingStatus)) {
      throw new Error('Invalid parsing status');
    }
  }

  // Getters
  get fileId() { return this._fileId; }
  get candidateId() { return this._candidateId; }
  get fileName() { return this._fileName; }
  get fileUrl() { return this._fileUrl; }
  get fileSize() { return this._fileSize; }
  get mimeType() { return this._mimeType; }
  get parsingStatus() { return this._parsingStatus; }
  get parsedData() { return this._parsedData; }
  get parsingError() { return this._parsingError; }

  // Business methods
  startParsing() {
    this._parsingStatus = 'PROCESSING';
    this._updatedAt = new Date();
  }

  completeParsing(parsedData) {
    this._parsingStatus = 'COMPLETED';
    this._parsedData = parsedData;
    this._parsingError = null;
    this._updatedAt = new Date();
  }

  failParsing(error) {
    this._parsingStatus = 'FAILED';
    this._parsingError = error;
    this._parsedData = null;
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      fileId: this._fileId,
      candidateId: this._candidateId,
      fileName: this._fileName,
      fileUrl: this._fileUrl,
      fileSize: this._fileSize,
      mimeType: this._mimeType,
      parsingStatus: this._parsingStatus,
      parsedData: this._parsedData,
      parsingError: this._parsingError,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}

module.exports = CVFile;
