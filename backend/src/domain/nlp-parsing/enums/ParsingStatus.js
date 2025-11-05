/**
 * ParsingStatus Enum
 * Domain: NLP-Parsing
 * Represents the status of document parsing operations
 */
const ParsingStatus = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PARTIAL: 'PARTIAL'
});

module.exports = ParsingStatus;