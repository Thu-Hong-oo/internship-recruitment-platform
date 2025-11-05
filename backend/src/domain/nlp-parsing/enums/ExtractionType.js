/**
 * ExtractionType Enum
 * Domain: NLP-Parsing
 * Represents different types of information that can be extracted from documents
 */
const ExtractionType = Object.freeze({
  PERSONAL_INFO: 'PERSONAL_INFO',
  EDUCATION: 'EDUCATION',
  WORK_EXPERIENCE: 'WORK_EXPERIENCE',
  SKILLS: 'SKILLS',
  CERTIFICATIONS: 'CERTIFICATIONS',
  PROJECTS: 'PROJECTS',
  LANGUAGES: 'LANGUAGES',
  ACHIEVEMENTS: 'ACHIEVEMENTS'
});

module.exports = ExtractionType;