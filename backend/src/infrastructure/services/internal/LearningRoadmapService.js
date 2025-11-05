const LearningRoadmapRepository = require('../../repositories/LearningRoadmapRepository');
const UserRepository = require('../../repositories/UserRepository');
const ValidationService = require('./ValidationService');

class LearningRoadmapService {
  constructor() {
    this.learningRoadmapRepository = new LearningRoadmapRepository();
    this.userRepository = new UserRepository();
    this.validationService = new ValidationService();
  }

  async createLearningRoadmap(roadmapData) {
    try {
      // Validate roadmap data
      const validation =
        this.validationService.validateLearningRoadmap(roadmapData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user exists
      const user = await this.userRepository.findById(roadmapData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create learning roadmap
      const roadmap = await this.learningRoadmapRepository.create(roadmapData);

      return {
        success: true,
        roadmap: {
          id: roadmap._id,
          userId: roadmap.userId,
          title: roadmap.title,
          description: roadmap.description,
          skills: roadmap.skills,
          status: roadmap.status,
          progress: roadmap.progress,
          createdAt: roadmap.createdAt,
        },
        message: 'Learning roadmap created successfully',
      };
    } catch (error) {
      throw new Error(`Create learning roadmap failed: ${error.message}`);
    }
  }

  async getLearningRoadmapById(roadmapId) {
    try {
      const roadmap = await this.learningRoadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Learning roadmap not found');
      }

      return {
        success: true,
        roadmap: {
          id: roadmap._id,
          userId: roadmap.userId,
          title: roadmap.title,
          description: roadmap.description,
          skills: roadmap.skills,
          status: roadmap.status,
          progress: roadmap.progress,
          createdAt: roadmap.createdAt,
          updatedAt: roadmap.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get learning roadmap by ID failed: ${error.message}`);
    }
  }

  async updateLearningRoadmap(roadmapId, updateData) {
    try {
      const roadmap = await this.learningRoadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Learning roadmap not found');
      }

      // Validate update data
      const validation =
        this.validationService.validateLearningRoadmap(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update learning roadmap
      const updatedRoadmap = await this.learningRoadmapRepository.update(
        roadmapId,
        updateData
      );

      return {
        success: true,
        roadmap: {
          id: updatedRoadmap._id,
          userId: updatedRoadmap.userId,
          title: updatedRoadmap.title,
          description: updatedRoadmap.description,
          skills: updatedRoadmap.skills,
          status: updatedRoadmap.status,
          progress: updatedRoadmap.progress,
          updatedAt: updatedRoadmap.updatedAt,
        },
        message: 'Learning roadmap updated successfully',
      };
    } catch (error) {
      throw new Error(`Update learning roadmap failed: ${error.message}`);
    }
  }

  async deleteLearningRoadmap(roadmapId) {
    try {
      const roadmap = await this.learningRoadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Learning roadmap not found');
      }

      // Soft delete learning roadmap
      await this.learningRoadmapRepository.softDelete(roadmapId);

      return {
        success: true,
        message: 'Learning roadmap deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete learning roadmap failed: ${error.message}`);
    }
  }

  async getUserLearningRoadmaps(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, status, search } = filters;
      const skip = (page - 1) * limit;

      const query = { userId };
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const roadmaps = await this.learningRoadmapRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
      });

      const total = await this.learningRoadmapRepository.count(query);

      return {
        success: true,
        roadmaps: roadmaps.map(roadmap => ({
          id: roadmap._id,
          title: roadmap.title,
          description: roadmap.description,
          skills: roadmap.skills,
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
      throw new Error(`Get user learning roadmaps failed: ${error.message}`);
    }
  }

  async getAllLearningRoadmaps(filters = {}) {
    try {
      const { page = 1, limit = 20, status, userId, search } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) query.status = status;
      if (userId) query.userId = userId;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const roadmaps = await this.learningRoadmapRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['userId'],
      });

      const total = await this.learningRoadmapRepository.count(query);

      return {
        success: true,
        roadmaps: roadmaps.map(roadmap => ({
          id: roadmap._id,
          userId: roadmap.userId,
          title: roadmap.title,
          description: roadmap.description,
          skills: roadmap.skills,
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
      throw new Error(`Get all learning roadmaps failed: ${error.message}`);
    }
  }

  async getLearningRoadmapStats(roadmapId) {
    try {
      const roadmap = await this.learningRoadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Learning roadmap not found');
      }

      // Get roadmap statistics
      const totalSkills = roadmap.skills.length;
      const completedSkills = roadmap.skills.filter(
        skill => skill.status === 'completed'
      ).length;
      const inProgressSkills = roadmap.skills.filter(
        skill => skill.status === 'in_progress'
      ).length;
      const pendingSkills = roadmap.skills.filter(
        skill => skill.status === 'pending'
      ).length;

      return {
        success: true,
        stats: {
          totalSkills,
          completedSkills,
          inProgressSkills,
          pendingSkills,
          progressPercentage: Math.round((completedSkills / totalSkills) * 100),
        },
      };
    } catch (error) {
      throw new Error(`Get learning roadmap stats failed: ${error.message}`);
    }
  }

  async updateRoadmapProgress(roadmapId, skillId, status) {
    try {
      const roadmap = await this.learningRoadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Learning roadmap not found');
      }

      // Find and update skill status
      const skillIndex = roadmap.skills.findIndex(
        skill => skill._id.toString() === skillId
      );
      if (skillIndex === -1) {
        throw new Error('Skill not found in roadmap');
      }

      roadmap.skills[skillIndex].status = status;
      roadmap.skills[skillIndex].updatedAt = new Date();

      // Calculate overall progress
      const completedSkills = roadmap.skills.filter(
        skill => skill.status === 'completed'
      ).length;
      const progress = Math.round(
        (completedSkills / roadmap.skills.length) * 100
      );

      // Update roadmap
      const updatedRoadmap = await this.learningRoadmapRepository.update(
        roadmapId,
        {
          skills: roadmap.skills,
          progress,
          status: progress === 100 ? 'completed' : 'in_progress',
        }
      );

      return {
        success: true,
        roadmap: {
          id: updatedRoadmap._id,
          skills: updatedRoadmap.skills,
          progress: updatedRoadmap.progress,
          status: updatedRoadmap.status,
        },
        message: 'Roadmap progress updated successfully',
      };
    } catch (error) {
      throw new Error(`Update roadmap progress failed: ${error.message}`);
    }
  }

  async searchLearningRoadmaps(searchQuery) {
    try {
      const roadmaps = await this.learningRoadmapRepository.find({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
        ],
        status: 'active',
      });

      return {
        success: true,
        roadmaps: roadmaps.map(roadmap => ({
          id: roadmap._id,
          title: roadmap.title,
          description: roadmap.description,
          skills: roadmap.skills,
          status: roadmap.status,
          progress: roadmap.progress,
        })),
      };
    } catch (error) {
      throw new Error(`Search learning roadmaps failed: ${error.message}`);
    }
  }

  async getLearningRoadmapTrends() {
    try {
      const trends = await this.learningRoadmapRepository.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        trends: trends.map(trend => ({
          status: trend._id,
          count: trend.count,
        })),
      };
    } catch (error) {
      throw new Error(`Get learning roadmap trends failed: ${error.message}`);
    }
  }

  async getLearningRoadmapRecommendations(userId) {
    try {
      // Get user's existing roadmaps
      const userRoadmaps = await this.learningRoadmapRepository.find({
        userId,
      });
      const userSkillIds = new Set();
      userRoadmaps.forEach(roadmap => {
        roadmap.skills.forEach(skill => {
          userSkillIds.add(skill.skillId.toString());
        });
      });

      // Get recommended roadmaps
      const recommendations = await this.learningRoadmapRepository.find(
        {
          _id: { $nin: userRoadmaps.map(r => r._id) },
          status: 'active',
        },
        {
          limit: 10,
          sort: { createdAt: -1 },
        }
      );

      return {
        success: true,
        recommendations: recommendations.map(roadmap => ({
          id: roadmap._id,
          title: roadmap.title,
          description: roadmap.description,
          skills: roadmap.skills,
          status: roadmap.status,
          progress: roadmap.progress,
        })),
      };
    } catch (error) {
      throw new Error(
        `Get learning roadmap recommendations failed: ${error.message}`
      );
    }
  }

  async getLearningRoadmapHistory(roadmapId) {
    try {
      const roadmap = await this.learningRoadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Learning roadmap not found');
      }

      // Get roadmap history (if it was updated)
      const history = await this.learningRoadmapRepository.find(
        {
          _id: roadmapId,
        },
        {
          sort: { updatedAt: 1 },
        }
      );

      return {
        success: true,
        history: history.map(roadmap => ({
          id: roadmap._id,
          title: roadmap.title,
          skills: roadmap.skills,
          status: roadmap.status,
          progress: roadmap.progress,
          createdAt: roadmap.createdAt,
          updatedAt: roadmap.updatedAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get learning roadmap history failed: ${error.message}`);
    }
  }
}

module.exports = new LearningRoadmapService();
