// src/domain/ai-nlp/SuggestionService.js
const { Skill } = require('../master-data');

class SuggestionService {
  constructor(skillRepository, jobPostingRepository, companyRepository) {
    this.skillRepository = skillRepository;
    this.jobPostingRepository = jobPostingRepository;
    this.companyRepository = companyRepository;
  }

  async suggestSkills(partialSkill, limit = 10) {
    // This would typically query a search index or use AI/ML for suggestions
    const allSkills = await this.skillRepository.findActive();
    return allSkills
      .filter(skill =>
        skill.skillName.toLowerCase().includes(partialSkill.toLowerCase())
      )
      .slice(0, limit);
  }

  async suggestJobTitles(partialTitle, limit = 10) {
    // This would typically query job postings for existing titles
    const jobPostings = await this.jobPostingRepository.findAll();
    const titles = [...new Set(jobPostings.map(job => job.title))];
    return titles
      .filter(title => title.toLowerCase().includes(partialTitle.toLowerCase()))
      .slice(0, limit);
  }

  async suggestCompanies(partialName, limit = 10) {
    // This would typically query companies for existing names
    const companies = await this.companyRepository.findAll();
    return companies
      .filter(company =>
        company.name.toLowerCase().includes(partialName.toLowerCase())
      )
      .map(company => company.name)
      .slice(0, limit);
  }

  async suggestLocations(partialLocation, limit = 10) {
    // This would typically have a predefined list of locations or query existing data
    const commonLocations = [
      'Hanoi',
      'Ho Chi Minh City',
      'Da Nang',
      'Can Tho',
      'Hai Phong',
      'New York',
      'San Francisco',
      'London',
      'Tokyo',
      'Singapore',
    ];
    return commonLocations
      .filter(location =>
        location.toLowerCase().includes(partialLocation.toLowerCase())
      )
      .slice(0, limit);
  }

  async getFieldSuggestions(fieldType, partialValue, limit = 10) {
    switch (fieldType) {
      case 'skill':
        return await this.suggestSkills(partialValue, limit);
      case 'jobTitle':
        return await this.suggestJobTitles(partialValue, limit);
      case 'company':
        return await this.suggestCompanies(partialValue, limit);
      case 'location':
        return await this.suggestLocations(partialValue, limit);
      default:
        return [];
    }
  }
}

module.exports = SuggestionService;
