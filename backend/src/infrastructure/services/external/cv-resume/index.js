/**
 * CV & Resume Services - Export all CV and resume processing services
 * These services handle CV parsing, generation, enhancement, and preview
 */

module.exports = {
  // CV Processing
  CVParserService: require('./CVParserService'),
  CVPreviewGenerator: require('./CVPreviewGenerator'),
  AICVEnhancementService: require('./AICVEnhancementService'),

  // Resume Generation
  ResumeGeneratorService: require('./ResumeGeneratorService'),
  ResumeParserService: require('./ResumeParserService'),
};
