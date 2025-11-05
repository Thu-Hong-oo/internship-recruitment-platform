/**
 * CompanySize Enum
 * Domain: Recruitment
 * Represents the size categories of companies
 */
const CompanySize = Object.freeze({
  STARTUP_1_10: 'startup_1_10',
  SMALL_11_50: 'small_11_50',
  MEDIUM_51_200: 'medium_51_200',
  LARGE_201_1000: 'large_201_1000',
  ENTERPRISE_1000_PLUS: 'enterprise_1000_plus',
});

module.exports = CompanySize;

const WorkFormat = Object.freeze({
  ON_SITE: 'ON_SITE',
  HYBRID: 'HYBRID',
  REMOTE: 'REMOTE',
});

const EducationLevel = Object.freeze({
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  BACHELOR: 'BACHELOR',
  MASTER: 'MASTER',
  PHD: 'PHD',
});

module.exports = {
  CompanySize,
  WorkFormat,
  EducationLevel,
};
