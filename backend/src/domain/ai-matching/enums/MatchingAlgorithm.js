/**
 * MatchingAlgorithm Enum
 * Domain: AI-Matching
 * Represents different algorithms used for matching candidates to jobs
 */
const MatchingAlgorithm = Object.freeze({
  COSINE_SIMILARITY: 'COSINE_SIMILARITY',
  JACCARD_SIMILARITY: 'JACCARD_SIMILARITY',
  EUCLIDEAN_DISTANCE: 'EUCLIDEAN_DISTANCE',
  MANHATTAN_DISTANCE: 'MANHATTAN_DISTANCE',
  BERT_EMBEDDING: 'BERT_EMBEDDING',
  TF_IDF: 'TF_IDF',
  HYBRID: 'HYBRID'
});

module.exports = MatchingAlgorithm;