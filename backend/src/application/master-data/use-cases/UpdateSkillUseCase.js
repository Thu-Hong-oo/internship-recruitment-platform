/**
 * Update Skill Use Case
 * Updates an existing skill
 */

class UpdateSkillUseCase {
  constructor(skillRepository) {
    this.skillRepository = skillRepository;
  }

  async execute(skillId, updateData) {
    try {
      // Check if skill exists
      const existingSkill = await this.skillRepository.findById(skillId);
      if (!existingSkill) {
        throw new Error('Skill not found');
      }

      // Validate update data
      const validation = this._validateUpdateData(updateData, existingSkill);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Check name uniqueness if name is being changed
      if (updateData.name && updateData.name !== existingSkill.name) {
        const nameExists = await this.skillRepository.findByName(
          updateData.name
        );
        if (nameExists && nameExists.id !== skillId) {
          throw new Error('Skill with this name already exists');
        }
      }

      // Prepare update data
      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Update keywords if name changed
      if (updateData.name) {
        updateFields.keywords = this._generateKeywords({
          ...existingSkill,
          ...updateData,
        });
      }

      // Handle metadata updates
      if (updateData.metadata) {
        updateFields.metadata = {
          ...existingSkill.metadata,
          ...updateData.metadata,
        };
      }

      // Update skill
      const updatedSkill = await this.skillRepository.update(
        skillId,
        updateFields
      );

      // Handle related skills updates
      if (updateData.relatedSkills !== undefined) {
        await this._updateRelatedSkillsRelationships(
          skillId,
          existingSkill.relatedSkills || [],
          updateData.relatedSkills || []
        );
      }

      return {
        success: true,
        data: updatedSkill,
        message: 'Skill updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _validateUpdateData(updateData, existingSkill) {
    // Name validation
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        return { isValid: false, message: 'Skill name cannot be empty' };
      }
      if (updateData.name.length > 100) {
        return {
          isValid: false,
          message: 'Skill name must be less than 100 characters',
        };
      }
    }

    // Category validation
    if (updateData.category !== undefined) {
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

      if (!validCategories.includes(updateData.category)) {
        return { isValid: false, message: 'Invalid skill category' };
      }
    }

    // Level validation
    if (updateData.level !== undefined) {
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      if (!validLevels.includes(updateData.level)) {
        return { isValid: false, message: 'Invalid skill level' };
      }
    }

    // Status validation
    if (updateData.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'deprecated'];
      if (!validStatuses.includes(updateData.status)) {
        return { isValid: false, message: 'Invalid skill status' };
      }
    }

    // Related skills validation
    if (updateData.relatedSkills !== undefined) {
      if (!Array.isArray(updateData.relatedSkills)) {
        return { isValid: false, message: 'Related skills must be an array' };
      }

      // Check for self-reference
      if (updateData.relatedSkills.includes(existingSkill.id)) {
        return { isValid: false, message: 'Skill cannot be related to itself' };
      }
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

  async _updateRelatedSkillsRelationships(
    skillId,
    oldRelatedSkills,
    newRelatedSkills
  ) {
    try {
      // Skills to remove relationships from
      const toRemove = oldRelatedSkills.filter(
        id => !newRelatedSkills.includes(id)
      );

      // Skills to add relationships to
      const toAdd = newRelatedSkills.filter(
        id => !oldRelatedSkills.includes(id)
      );

      // Remove bidirectional relationships
      for (const relatedId of toRemove) {
        const relatedSkill = await this.skillRepository.findById(relatedId);
        if (relatedSkill && relatedSkill.relatedSkills) {
          const updatedRelatedSkills = relatedSkill.relatedSkills.filter(
            id => id !== skillId
          );
          await this.skillRepository.update(relatedId, {
            relatedSkills: updatedRelatedSkills,
            updatedAt: new Date(),
          });
        }
      }

      // Add bidirectional relationships
      for (const relatedId of toAdd) {
        const relatedSkill = await this.skillRepository.findById(relatedId);
        if (relatedSkill) {
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
      console.error('Error updating related skills relationships:', error);
      // Don't fail the main operation if this fails
    }
  }
}

module.exports = UpdateSkillUseCase;
