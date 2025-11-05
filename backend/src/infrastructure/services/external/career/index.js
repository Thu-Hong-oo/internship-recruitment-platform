/**
 * Career Services - Export all career guidance and PDF generation services
 * These services provide career guidance and document generation
 */

module.exports = {
  // Career Guidance
  CareerGuidanceService: require('./CareerGuidanceService'),

  // PDF Generation
  PDFGenerationService: require('./PDFGenerationService'),
};
