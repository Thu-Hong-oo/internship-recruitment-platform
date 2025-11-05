/**
 * Create Skill Use Case
 * Creates a new skill in the system
 */

class CreateSkillUseCase {
  constructor(skillRepository) {
    this.skillRepository = skillRepository;
  }

  async execute(skillData) {
    try {
      // Validate required fields
      const validation = this._validateSkillData(skillData);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Check if skill already exists
      const existingSkill = await this.skillRepository.findByName(
        skillData.name
      );
      if (existingSkill) {
        throw new Error('Skill with this name already exists');
      }

      // Prepare skill data
      const newSkillData = {
        name: skillData.name.trim(),
        description: skillData.description || '',
        category: skillData.category,
        level: skillData.level || 'beginner',
        keywords: this._generateKeywords(skillData),
        relatedSkills: skillData.relatedSkills || [],
        trending: false,
        usageCount: 0,
        verificationRequired: skillData.verificationRequired || false,
        createdBy: skillData.createdBy,
        status: 'active',
        metadata: {
          difficulty: skillData.difficulty || 'medium',
          estimatedLearningTime: skillData.estimatedLearningTime,
          prerequisites: skillData.prerequisites || [],
          certifications: skillData.certifications || [],
          resources: skillData.resources || [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create skill
      const createdSkill = await this.skillRepository.create(newSkillData);

      // Update related skills if specified
      if (skillData.relatedSkills && skillData.relatedSkills.length > 0) {
        await this._updateRelatedSkills(
          createdSkill.id,
          skillData.relatedSkills
        );
      }

      return {
        success: true,
        data: createdSkill,
        message: 'Skill created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _validateSkillData(skillData) {
    if (!skillData.name || skillData.name.trim().length === 0) {
      return { isValid: false, message: 'Skill name is required' };
    }

    if (skillData.name.length > 100) {
      return {
        isValid: false,
        message: 'Skill name must be less than 100 characters',
      };
    }

    if (!skillData.category) {
      return { isValid: false, message: 'Skill category is required' };
    }

    const validCategories = [
      'programming',
      'design',
      'marketing',
      'data',
      'business',
      'communication',
      'project-management',
      'finance',
      'sales',
      'customer-service',
      'education',
      'healthcare',
      'engineering',
      'research',
      'writing',
      'languages',
      'other',
    ];

    if (!validCategories.includes(skillData.category)) {
      return { isValid: false, message: 'Invalid skill category' };
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (skillData.level && !validLevels.includes(skillData.level)) {
      return { isValid: false, message: 'Invalid skill level' };
    }

    return { isValid: true };
  }

  _generateKeywords(skillData) {
    const keywords = [];

    // Add name variants
    keywords.push(skillData.name.toLowerCase());
    keywords.push(...skillData.name.toLowerCase().split(' '));

    // Add explicit keywords
    if (skillData.keywords) {
      keywords.push(...skillData.keywords.map(k => k.toLowerCase()));
    }

    // Add synonyms based on category
    const categoryKeywords = this._getCategoryKeywords(skillData.category);
    keywords.push(...categoryKeywords);

    // Remove duplicates and empty strings
    return [...new Set(keywords.filter(k => k && k.trim().length > 0))];
  }

  _getCategoryKeywords(category) {
    const categoryMappings = {
      programming: ['coding', 'development', 'software', 'tech'],
      design: ['creative', 'visual', 'ui', 'ux', 'graphic'],
      marketing: ['promotion', 'advertising', 'digital', 'social'],
      data: ['analysis', 'analytics', 'statistics', 'insights'],
      business: ['management', 'strategy', 'operations', 'leadership'],
      communication: ['presentation', 'writing', 'speaking', 'interpersonal'],
      'project-management': ['planning', 'coordination', 'agile', 'scrum'],
    };

    return categoryMappings[category] || [];
  }

  async _updateRelatedSkills(skillId, relatedSkillIds) {
    try {
      // Add bidirectional relationships
      for (const relatedId of relatedSkillIds) {
        const relatedSkill = await this.skillRepository.findById(relatedId);
        if (relatedSkill) {
          // Add current skill to related skill's related skills
          const updatedRelatedSkills = relatedSkill.relatedSkills || [];
          if (!updatedRelatedSkills.includes(skillId)) {
            updatedRelatedSkills.push(skillId);
            await this.skillRepository.update(relatedId, {
              relatedSkills: updatedRelatedSkills,
              updatedAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating related skills:', error);
      // Don't fail the main operation if this fails
    }
  }
}

module.exports = CreateSkillUseCase;
