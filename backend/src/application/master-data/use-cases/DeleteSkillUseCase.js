/**
 * Delete Skill Use Case
 * Deletes a skill and handles related data cleanup
 */

class DeleteSkillUseCase {
  constructor(
    skillRepository,
    candidateSkillRepository,
    jobSkillRequirementRepository
  ) {
    this.skillRepository = skillRepository;
    this.candidateSkillRepository = candidateSkillRepository;
    this.jobSkillRequirementRepository = jobSkillRequirementRepository;
  }

  async execute(skillId, options = {}) {
    try {
      // Check if skill exists
      const skill = await this.skillRepository.findById(skillId);
      if (!skill) {
        throw new Error('Skill not found');
      }

      // Check for dependencies if not forcing delete
      if (!options.force) {
        const dependencies = await this._checkDependencies(skillId);
        if (dependencies.hasActive) {
          return {
            success: false,
            error: 'Cannot delete skill with active dependencies',
            data: {
              dependencies: dependencies.summary,
              suggestion:
                'Consider setting skill status to "deprecated" instead, or use force delete to remove all dependencies.',
            },
          };
        }
      }

      // Handle related skills cleanup
      await this._cleanupRelatedSkills(skillId, skill.relatedSkills || []);

      // Handle dependencies cleanup if forcing delete
      if (options.force) {
        await this._cleanupDependencies(skillId);
      }

      // Delete the skill
      await this.skillRepository.delete(skillId);

      return {
        success: true,
        message: 'Skill deleted successfully',
        data: {
          deletedSkill: {
            id: skill.id,
            name: skill.name,
            category: skill.category,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _checkDependencies(skillId) {
    try {
      // Check candidate skills
      const candidateSkills = await this.candidateSkillRepository.findBySkillId(
        skillId
      );

      // Check job requirements
      const jobRequirements =
        await this.jobSkillRequirementRepository.findBySkillId(skillId);

      // Check related skills
      const relatedSkills = await this.skillRepository.find({
        relatedSkills: { $in: [skillId] },
      });

      const hasActive =
        candidateSkills.length > 0 || jobRequirements.length > 0;

      return {
        hasActive,
        summary: {
          candidatesUsing: candidateSkills.length,
          jobsRequiring: jobRequirements.length,
          relatedSkills: relatedSkills.length,
        },
      };
    } catch (error) {
      console.error('Error checking dependencies:', error);
      return { hasActive: false, summary: {} };
    }
  }

  async _cleanupRelatedSkills(skillId, relatedSkillIds) {
    try {
      // Remove this skill from all related skills
      for (const relatedId of relatedSkillIds) {
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

      // Also remove from skills that have this skill as related
      const skillsWithThisAsRelated = await this.skillRepository.find({
        relatedSkills: { $in: [skillId] },
      });

      for (const skill of skillsWithThisAsRelated) {
        const updatedRelatedSkills = skill.relatedSkills.filter(
          id => id !== skillId
        );
        await this.skillRepository.update(skill.id, {
          relatedSkills: updatedRelatedSkills,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error cleaning up related skills:', error);
      // Continue with deletion even if cleanup fails
    }
  }

  async _cleanupDependencies(skillId) {
    try {
      // Remove from candidate skills
      await this.candidateSkillRepository.deleteBySkillId(skillId);

      // Remove from job requirements
      await this.jobSkillRequirementRepository.deleteBySkillId(skillId);

      // Note: In a real system, you might want to:
      // 1. Archive these records instead of deleting
      // 2. Send notifications to affected users
      // 3. Log the cleanup operations for audit
      // 4. Update any cached or computed data
    } catch (error) {
      console.error('Error cleaning up dependencies:', error);
      // Continue with deletion even if cleanup fails partially
    }
  }
}

module.exports = DeleteSkillUseCase;
