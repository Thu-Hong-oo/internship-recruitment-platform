/**
 * DocumentType Enum
 * Domain: NLP-Parsing
 * Represents different types of documents that can be parsed
 */
const DocumentType = Object.freeze({
  CV: 'CV',
  RESUME: 'RESUME',
  COVER_LETTER: 'COVER_LETTER',
  PORTFOLIO: 'PORTFOLIO',
  CERTIFICATE: 'CERTIFICATE',
  TRANSCRIPT: 'TRANSCRIPT',
  RECOMMENDATION_LETTER: 'RECOMMENDATION_LETTER'
});

module.exports = DocumentType;