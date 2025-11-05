/**
 * MatchStatus Enum
 * Domain: AI-Matching
 * Represents the status of a candidate-job match
 */
const MatchStatus = Object.freeze({
  PENDING: 'PENDING',
  CALCULATED: 'CALCULATED',
  EXPIRED: 'EXPIRED',
  INVALIDATED: 'INVALIDATED'
});

module.exports = MatchStatus;