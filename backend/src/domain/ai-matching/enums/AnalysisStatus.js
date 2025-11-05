/**
 * AnalysisStatus Enum
 * Domain: AI Matching
 * Represents the status of AI analysis processes
 */
const AnalysisStatus = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

module.exports = AnalysisStatus;
