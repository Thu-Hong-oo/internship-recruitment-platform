const RoadmapRepository = require('../../repositories/RoadmapRepository');
const CandidateRepository = require('../../repositories/CandidateRepository');
const SkillRepository = require('../../repositories/SkillRepository');
const GeminiAIService = require('../external/GeminiAIService');
const ValidationService = require('./ValidationService');
const QueueService = require('../external/QueueService');

class RoadmapService {
  constructor() {
    this.roadmapRepository = new RoadmapRepository();
    this.candidateRepository = new CandidateRepository();
    this.skillRepository = new SkillRepository();
    this.validationService = new ValidationService();
  }

  async generateRoadmap(candidateId, roadmapData) {
    try {
      const { targetSkills, currentSkills, preferences = {} } = roadmapData;

      // Get candidate profile
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Generate roadmap using AI
      const roadmapContent = await GeminiAIService.generateRoadmap(
        targetSkills,
        currentSkills,
        preferences
      );

      // Create roadmap
      const roadmap = await this.roadmapRepository.create({
        candidateId,
        title: roadmapContent.title,
        description: roadmapContent.description,
        targetSkills,
        currentSkills,
        phases: roadmapContent.phases,
        estimatedDuration: roadmapContent.estimatedDuration,
        difficulty: roadmapContent.difficulty,
        preferences,
        status: 'draft',
      });

      return {
        success: true,
        roadmap: {
          id: roadmap._id,
          title: roadmap.title,
          description: roadmap.description,
          targetSkills: roadmap.targetSkills,
          currentSkills: roadmap.currentSkills,
          phases: roadmap.phases,
          estimatedDuration: roadmap.estimatedDuration,
          difficulty: roadmap.difficulty,
          status: roadmap.status,
          createdAt: roadmap.createdAt,
        },
        message: 'Roadmap generated successfully',
      };
    } catch (error) {
      throw new Error(`Generate roadmap failed: ${error.message}`);
    }
  }

  async getUserRoadmaps(candidateId, filters = {}) {
    try {
      const { page = 1, limit = 10, status } = filters;
      const skip = (page - 1) * limit;

      const query = { candidateId };
      if (status) query.status = status;

      const roadmaps = await this.roadmapRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
      });

      const total = await this.roadmapRepository.count(query);

      return {
        success: true,
        roadmaps: roadmaps.map(roadmap => ({
          id: roadmap._id,
          title: roadmap.title,
          description: roadmap.description,
          targetSkills: roadmap.targetSkills,
          currentSkills: roadmap.currentSkills,
          phases: roadmap.phases,
          estimatedDuration: roadmap.estimatedDuration,
          difficulty: roadmap.difficulty,
          status: roadmap.status,
          progress: roadmap.progress,
          createdAt: roadmap.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get user roadmaps failed: ${error.message}`);
    }
  }

  async getRoadmapById(roadmapId, candidateId) {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      // Check if user owns the roadmap
      if (roadmap.candidateId.toString() !== candidateId) {
        throw new Error('Access denied');
      }

      return {
        success: true,
        roadmap: {
          id: roadmap._id,
          title: roadmap.title,
          description: roadmap.description,
          targetSkills: roadmap.targetSkills,
          currentSkills: roadmap.currentSkills,
          phases: roadmap.phases,
          estimatedDuration: roadmap.estimatedDuration,
          difficulty: roadmap.difficulty,
          status: roadmap.status,
          progress: roadmap.progress,
          createdAt: roadmap.createdAt,
          updatedAt: roadmap.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get roadmap by ID failed: ${error.message}`);
    }
  }

  async updateRoadmapProgress(roadmapId, candidateId, progressData) {
    try {
      const { phaseId, completed, notes } = progressData;

      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      // Check if user owns the roadmap
      if (roadmap.candidateId.toString() !== candidateId) {
        throw new Error('Access denied');
      }

      // Update phase progress
      const updatedPhases = roadmap.phases.map(phase => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            completed,
            completedAt: completed ? new Date() : null,
            notes,
          };
        }
        return phase;
      });

      // Calculate overall progress
      const completedPhases = updatedPhases.filter(
        phase => phase.completed
      ).length;
      const totalPhases = updatedPhases.length;
      const progress = Math.round((completedPhases / totalPhases) * 100);

      // Update roadmap
      const updatedRoadmap = await this.roadmapRepository.update(roadmapId, {
        phases: updatedPhases,
        progress,
        status: progress === 100 ? 'completed' : 'active',
      });

      return {
        success: true,
        roadmap: {
          id: updatedRoadmap._id,
          progress: updatedRoadmap.progress,
          status: updatedRoadmap.status,
          phases: updatedRoadmap.phases,
        },
        message: 'Roadmap progress updated successfully',
      };
    } catch (error) {
      throw new Error(`Update roadmap progress failed: ${error.message}`);
    }
  }

  async completeRoadmapPhase(roadmapId, phaseId, candidateId) {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      // Check if user owns the roadmap
      if (roadmap.candidateId.toString() !== candidateId) {
        throw new Error('Access denied');
      }

      // Find and complete the phase
      const updatedPhases = roadmap.phases.map(phase => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            completed: true,
            completedAt: new Date(),
          };
        }
        return phase;
      });

      // Calculate overall progress
      const completedPhases = updatedPhases.filter(
        phase => phase.completed
      ).length;
      const totalPhases = updatedPhases.length;
      const progress = Math.round((completedPhases / totalPhases) * 100);

      // Update roadmap
      const updatedRoadmap = await this.roadmapRepository.update(roadmapId, {
        phases: updatedPhases,
        progress,
        status: progress === 100 ? 'completed' : 'active',
      });

      return {
        success: true,
        roadmap: {
          id: updatedRoadmap._id,
          progress: updatedRoadmap.progress,
          status: updatedRoadmap.status,
          phases: updatedRoadmap.phases,
        },
        message: 'Roadmap phase completed successfully',
      };
    } catch (error) {
      throw new Error(`Complete roadmap phase failed: ${error.message}`);
    }
  }

  async getRoadmapProgress(roadmapId, candidateId) {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      // Check if user owns the roadmap
      if (roadmap.candidateId.toString() !== candidateId) {
        throw new Error('Access denied');
      }

      const completedPhases = roadmap.phases.filter(
        phase => phase.completed
      ).length;
      const totalPhases = roadmap.phases.length;
      const progress = Math.round((completedPhases / totalPhases) * 100);

      return {
        success: true,
        progress: {
          overall: progress,
          completedPhases,
          totalPhases,
          phases: roadmap.phases.map(phase => ({
            id: phase.id,
            title: phase.title,
            description: phase.description,
            completed: phase.completed,
            completedAt: phase.completedAt,
            estimatedDuration: phase.estimatedDuration,
            skills: phase.skills,
          })),
        },
      };
    } catch (error) {
      throw new Error(`Get roadmap progress failed: ${error.message}`);
    }
  }

  async deleteRoadmap(roadmapId, candidateId) {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      // Check if user owns the roadmap
      if (roadmap.candidateId.toString() !== candidateId) {
        throw new Error('Access denied');
      }

      // Delete roadmap
      await this.roadmapRepository.delete(roadmapId);

      return {
        success: true,
        message: 'Roadmap deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete roadmap failed: ${error.message}`);
    }
  }

  async getRoadmapRecommendations(candidateId, filters = {}) {
    try {
      const { limit = 5 } = filters;

      // Get candidate's current skills
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const currentSkills = candidate.skills || [];

      // Get popular skills
      const popularSkills = await this.skillRepository.find(
        {},
        { limit: 10, sort: { popularity: -1 } }
      );

      // Filter out skills candidate already has
      const recommendedSkills = popularSkills
        .filter(skill => !currentSkills.includes(skill.name))
        .slice(0, limit);

      return {
        success: true,
        recommendations: recommendedSkills.map(skill => ({
          id: skill._id,
          name: skill.name,
          category: skill.category,
          description: skill.description,
          popularity: skill.popularity,
        })),
      };
    } catch (error) {
      throw new Error(`Get roadmap recommendations failed: ${error.message}`);
    }
  }

  async getRoadmapStats(candidateId) {
    try {
      const totalRoadmaps = await this.roadmapRepository.count({ candidateId });
      const activeRoadmaps = await this.roadmapRepository.count({
        candidateId,
        status: 'active',
      });
      const completedRoadmaps = await this.roadmapRepository.count({
        candidateId,
        status: 'completed',
      });

      const roadmaps = await this.roadmapRepository.find(
        { candidateId },
        { limit: 5, sort: { updatedAt: -1 } }
      );

      return {
        success: true,
        stats: {
          totalRoadmaps,
          activeRoadmaps,
          completedRoadmaps,
          recentRoadmaps: roadmaps.map(roadmap => ({
            id: roadmap._id,
            title: roadmap.title,
            status: roadmap.status,
            progress: roadmap.progress,
            updatedAt: roadmap.updatedAt,
          })),
        },
      };
    } catch (error) {
      throw new Error(`Get roadmap stats failed: ${error.message}`);
    }
  }
}

module.exports = new RoadmapService();
