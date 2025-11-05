/**
 * Generate Roadmap Use Case
 * Creates a personalized skill development roadmap for a candidate
 */

class GenerateRoadmapUseCase {
  constructor(skillRoadmapRepository, candidateRepository, skillRepository) {
    this.skillRoadmapRepository = skillRoadmapRepository;
    this.candidateRepository = candidateRepository;
    this.skillRepository = skillRepository;
  }

  async execute(candidateId, targetSkills, preferences = {}) {
    try {
      // Get candidate profile and current skills
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Analyze skill gaps
      const currentSkills = candidate.skills || [];
      const skillGaps = targetSkills.filter(
        targetSkill =>
          !currentSkills.some(
            currentSkill => currentSkill.skillId === targetSkill.skillId
          )
      );

      // Generate roadmap phases
      const phases = await this._generatePhases(skillGaps, preferences);

      // Create roadmap entity
      const roadmapData = {
        candidateId,
        title: preferences.title || 'Personal Skill Development Roadmap',
        description:
          preferences.description ||
          'Generated roadmap to achieve target skills',
        targetSkills,
        phases,
        estimatedDuration: this._calculateDuration(phases),
        difficulty: this._calculateDifficulty(targetSkills),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const roadmap = await this.skillRoadmapRepository.create(roadmapData);

      return {
        success: true,
        data: roadmap,
        message: 'Roadmap generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _generatePhases(skillGaps, preferences) {
    const phases = [];
    const learningStyle = preferences.learningStyle || 'balanced';
    const timeCommitment = preferences.timeCommitment || 'moderate';

    for (let i = 0; i < skillGaps.length; i++) {
      const skill = skillGaps[i];
      const phase = {
        id: `phase-${i + 1}`,
        title: `Learn ${skill.name}`,
        description: `Master ${skill.name} skills`,
        order: i + 1,
        skills: [skill],
        resources: await this._generateResources(skill, learningStyle),
        estimatedWeeks: this._estimateWeeks(skill, timeCommitment),
        prerequisites: i > 0 ? [`phase-${i}`] : [],
        status: 'not_started',
        milestones: this._generateMilestones(skill),
      };
      phases.push(phase);
    }

    return phases;
  }

  async _generateResources(skill, learningStyle) {
    // Basic resource generation logic
    const resources = [
      {
        type: 'course',
        title: `${skill.name} Fundamentals`,
        url: '#',
        provider: 'Internal',
        duration: '4-6 weeks',
        difficulty: 'beginner',
      },
      {
        type: 'practice',
        title: `${skill.name} Exercises`,
        url: '#',
        provider: 'Practice Platform',
        duration: '2-3 weeks',
        difficulty: 'intermediate',
      },
    ];

    if (learningStyle === 'visual') {
      resources.push({
        type: 'video',
        title: `${skill.name} Video Tutorial`,
        url: '#',
        provider: 'Video Platform',
        duration: '1-2 weeks',
        difficulty: 'beginner',
      });
    }

    return resources;
  }

  _generateMilestones(skill) {
    return [
      {
        id: 'milestone-1',
        title: `Complete ${skill.name} basics`,
        description: `Understand fundamental concepts of ${skill.name}`,
        targetDate: null,
        completed: false,
      },
      {
        id: 'milestone-2',
        title: `Build ${skill.name} project`,
        description: `Apply ${skill.name} in a practical project`,
        targetDate: null,
        completed: false,
      },
      {
        id: 'milestone-3',
        title: `Master ${skill.name}`,
        description: `Demonstrate proficiency in ${skill.name}`,
        targetDate: null,
        completed: false,
      },
    ];
  }

  _estimateWeeks(skill, timeCommitment) {
    const baseWeeks =
      skill.difficulty === 'advanced'
        ? 8
        : skill.difficulty === 'intermediate'
        ? 6
        : 4;

    const multiplier =
      timeCommitment === 'intensive'
        ? 0.7
        : timeCommitment === 'light'
        ? 1.5
        : 1;

    return Math.ceil(baseWeeks * multiplier);
  }

  _calculateDuration(phases) {
    return phases.reduce((total, phase) => total + phase.estimatedWeeks, 0);
  }

  _calculateDifficulty(targetSkills) {
    const avgDifficulty =
      targetSkills.reduce((sum, skill) => {
        const difficultyScore =
          skill.difficulty === 'advanced'
            ? 3
            : skill.difficulty === 'intermediate'
            ? 2
            : 1;
        return sum + difficultyScore;
      }, 0) / targetSkills.length;

    return avgDifficulty >= 2.5
      ? 'advanced'
      : avgDifficulty >= 1.5
      ? 'intermediate'
      : 'beginner';
  }
}

module.exports = GenerateRoadmapUseCase;
