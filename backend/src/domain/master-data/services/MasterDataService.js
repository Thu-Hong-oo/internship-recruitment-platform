/**
 * MasterDataService
 * Domain: Master Data
 * Domain service for managing master data operations
 */
class MasterDataService {
  constructor(props) {
    this._skillRepository = props.skillRepository;
    this._industryRepository = props.industryRepository;
    this._institutionRepository = props.institutionRepository;
    this._degreeRepository = props.degreeRepository;
    this._fieldOfStudyRepository = props.fieldOfStudyRepository;
    this._jobSkillRequirementRepository = props.jobSkillRequirementRepository;
    this._candidateSkillRepository = props.candidateSkillRepository;
  }

  /**
   * Get all skills with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Skill[]>}
   */
  async getAllSkills(filters = {}) {
    return await this._skillRepository.findAll(filters);
  }

  /**
   * Get skill by ID
   * @param {string} skillId
   * @returns {Promise<Skill|null>}
   */
  async getSkillById(skillId) {
    return await this._skillRepository.findById(skillId);
  }

  /**
   * Get skill by slug
   * @param {string} slug
   * @returns {Promise<Skill|null>}
   */
  async getSkillBySlug(slug) {
    return await this._skillRepository.findBySlug(slug);
  }

  /**
   * Search skills by name or alias
   * @param {string} searchTerm
   * @returns {Promise<Skill[]>}
   */
  async searchSkills(searchTerm) {
    return await this._skillRepository.searchByNameOrAlias(searchTerm);
  }

  /**
   * Get all industries with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Industry[]>}
   */
  async getAllIndustries(filters = {}) {
    return await this._industryRepository.findAll(filters);
  }

  /**
   * Get industry by ID
   * @param {string} industryId
   * @returns {Promise<Industry|null>}
   */
  async getIndustryById(industryId) {
    return await this._industryRepository.findById(industryId);
  }

  /**
   * Get industry by slug
   * @param {string} slug
   * @returns {Promise<Industry|null>}
   */
  async getIndustryBySlug(slug) {
    return await this._industryRepository.findBySlug(slug);
  }

  /**
   * Get industry hierarchy
   * @param {string} industryId
   * @returns {Promise<Industry[]>}
   */
  async getIndustryHierarchy(industryId) {
    const industry = await this._industryRepository.findById(industryId);
    if (!industry) {
      return [];
    }
    return await this._industryRepository.getHierarchy(industry);
  }

  /**
   * Get all institutions
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Institution[]>}
   */
  async getAllInstitutions(filters = {}) {
    return await this._institutionRepository.findAll(filters);
  }

  /**
   * Get institution by ID
   * @param {string} institutionId
   * @returns {Promise<Institution|null>}
   */
  async getInstitutionById(institutionId) {
    return await this._institutionRepository.findById(institutionId);
  }

  /**
   * Get all degrees
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Degree[]>}
   */
  async getAllDegrees(filters = {}) {
    return await this._degreeRepository.findAll(filters);
  }

  /**
   * Get degree by ID
   * @param {string} degreeId
   * @returns {Promise<Degree|null>}
   */
  async getDegreeById(degreeId) {
    return await this._degreeRepository.findById(degreeId);
  }

  /**
   * Get all fields of study
   * @param {Object} filters - Filter criteria
   * @returns {Promise<FieldOfStudy[]>}
   */
  async getAllFieldsOfStudy(filters = {}) {
    return await this._fieldOfStudyRepository.findAll(filters);
  }

  /**
   * Get field of study by ID
   * @param {string} fieldOfStudyId
   * @returns {Promise<FieldOfStudy|null>}
   */
  async getFieldOfStudyById(fieldOfStudyId) {
    return await this._fieldOfStudyRepository.findById(fieldOfStudyId);
  }

  /**
   * Get job skill requirements for a job
   * @param {string} jobId
   * @returns {Promise<JobSkillRequirement[]>}
   */
  async getJobSkillRequirements(jobId) {
    return await this._jobSkillRequirementRepository.findByJobId(jobId);
  }

  /**
   * Get candidate skills for a candidate
   * @param {string} candidateId
   * @returns {Promise<CandidateSkill[]>}
   */
  async getCandidateSkills(candidateId) {
    return await this._candidateSkillRepository.findByCandidateId(candidateId);
  }

  /**
   * Validate skill exists
   * @param {string} skillId
   * @returns {Promise<boolean>}
   */
  async validateSkillExists(skillId) {
    const skill = await this._skillRepository.findById(skillId);
    return skill !== null;
  }

  /**
   * Validate industry exists
   * @param {string} industryId
   * @returns {Promise<boolean>}
   */
  async validateIndustryExists(industryId) {
    const industry = await this._industryRepository.findById(industryId);
    return industry !== null;
  }

  /**
   * Validate institution exists
   * @param {string} institutionId
   * @returns {Promise<boolean>}
   */
  async validateInstitutionExists(institutionId) {
    const institution = await this._institutionRepository.findById(
      institutionId
    );
    return institution !== null;
  }

  /**
   * Validate degree exists
   * @param {string} degreeId
   * @returns {Promise<boolean>}
   */
  async validateDegreeExists(degreeId) {
    const degree = await this._degreeRepository.findById(degreeId);
    return degree !== null;
  }

  /**
   * Validate field of study exists
   * @param {string} fieldOfStudyId
   * @returns {Promise<boolean>}
   */
  async validateFieldOfStudyExists(fieldOfStudyId) {
    const fieldOfStudy = await this._fieldOfStudyRepository.findById(
      fieldOfStudyId
    );
    return fieldOfStudy !== null;
  }
}

module.exports = MasterDataService;
