// Master-Data Domain Exports
// Entities
const Skill = require('./entities/Skill');
const Industry = require('./entities/Industry');
const Institution = require('./entities/Institution');
const Degree = require('./entities/Degree');
const FieldOfStudy = require('./entities/FieldOfStudy');
const JobSkillRequirement = require('./entities/JobSkillRequirement');
const CandidateSkill = require('./entities/CandidateSkill');

// Enums
const SkillLevel = require('./enums/SkillLevel');
const InstitutionType = require('./enums/InstitutionType');
const DegreeLevel = require('./enums/DegreeLevel');

// Value Objects
const Address = require('./value-objects/Address');
const Location = require('./value-objects/Location');
const ContactInfo = require('./value-objects/ContactInfo');

// Domain Services
const MasterDataService = require('./services/MasterDataService');

// Repository Interfaces
const ISkillRepository = require('./repositories/ISkillRepository');
const IIndustryRepository = require('./repositories/IIndustryRepository');
const IInstitutionRepository = require('./repositories/IInstitutionRepository');
const IDegreeRepository = require('./repositories/IDegreeRepository');
const IFieldOfStudyRepository = require('./repositories/IFieldOfStudyRepository');
const IJobSkillRequirementRepository = require('./repositories/IJobSkillRequirementRepository');
const ICandidateSkillRepository = require('./repositories/ICandidateSkillRepository');

module.exports = {
  // Entities
  Skill,
  Industry,
  Institution,
  Degree,
  FieldOfStudy,
  JobSkillRequirement,
  CandidateSkill,

  // Enums
  SkillLevel,
  InstitutionType,
  DegreeLevel,

  // Value Objects
  Address,
  Location,
  ContactInfo,

  // Domain Services
  MasterDataService,

  // Repository Interfaces
  ISkillRepository,
  IIndustryRepository,
  IInstitutionRepository,
  IDegreeRepository,
  IFieldOfStudyRepository,
  IJobSkillRequirementRepository,
  ICandidateSkillRepository,
};
