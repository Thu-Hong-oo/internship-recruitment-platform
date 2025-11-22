const Skill = require('../models/Skill');
const Job = require('../models/Job');
const { logger } = require('../utils/logger');
const { getCacheService } = require('../config/initializeServices');
const asyncHandler = require('express-async-handler');

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
const getAllSkills = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) query.category = category;

    // Try to get from cache first (only for simple queries without search/filters)
    const cacheService = getCacheService();
    let skills = null;
    let total = 0;
    
    // Only cache if no search and no category filter (most common case)
    const cacheKey = !search && !category 
      ? `skills:list:page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`
      : null;
    
    if (cacheService && cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        skills = cached.data;
        total = cached.total;
      }
    }

    // If not in cache, fetch from database
    if (!skills) {
      const skip = (page - 1) * limit;
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      skills = await Skill.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));

      total = await Skill.countDocuments(query);

      // Cache the results (only for simple queries)
      if (cacheService && cacheKey) {
        await cacheService.set(cacheKey, { data: skills, total }, 3600); // 1 hour
      }
    }

    res.status(200).json({
      success: true,
      data: skills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting skills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách kỹ năng'
    });
  }
});

// @desc    Get single skill
// @route   GET /api/skills/:id
// @access  Public
const getSkill = asyncHandler(async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kỹ năng'
      });
    }

    // Get jobs that require this skill
    const jobsCount = await Job.countDocuments({
      'requirements.skills.skillId': skill._id,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      data: {
        ...skill.toObject(),
        jobsCount
      }
    });
  } catch (error) {
    logger.error('Error getting skill:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin kỹ năng'
    });
  }
});

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private (Admin)
const createSkill = asyncHandler(async (req, res) => {
  try {
    const skill = await Skill.create(req.body);

    // Invalidate skills cache when new skill is created
    const cacheService = getCacheService();
    if (cacheService) {
      await cacheService.invalidateStaticData('skills');
      await cacheService.delete('skills:categories:list');
    }

    res.status(201).json({
      success: true,
      data: skill
    });
  } catch (error) {
    logger.error('Error creating skill:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo kỹ năng'
    });
  }
});

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private (Admin)
const updateSkill = asyncHandler(async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kỹ năng'
      });
    }

    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Invalidate skills cache when skill is updated
    const cacheService = getCacheService();
    if (cacheService) {
      await cacheService.invalidateStaticData('skills');
      await cacheService.delete('skills:categories:list');
    }

    res.status(200).json({
      success: true,
      data: updatedSkill
    });
  } catch (error) {
    logger.error('Error updating skill:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật kỹ năng'
    });
  }
});

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private (Admin)
const deleteSkill = asyncHandler(async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kỹ năng'
      });
    }

    // Check if skill is being used in jobs
    const jobsUsingSkill = await Job.countDocuments({
      'requirements.skills.skillId': skill._id
    });

    if (jobsUsingSkill > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa kỹ năng này vì đang được sử dụng trong ${jobsUsingSkill} công việc`
      });
    }

    await skill.deleteOne();

    // Invalidate skills cache when skill is deleted
    const cacheService = getCacheService();
    if (cacheService) {
      await cacheService.invalidateStaticData('skills');
      await cacheService.delete('skills:categories:list');
    }

    res.status(200).json({
      success: true,
      message: 'Xóa kỹ năng thành công'
    });
  } catch (error) {
    logger.error('Error deleting skill:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa kỹ năng'
    });
  }
});

// @desc    Get skill categories
// @route   GET /api/skills/categories
// @access  Public
const getSkillCategories = asyncHandler(async (req, res) => {
  try {
    // Try to get from cache first
    const cacheService = getCacheService();
    let categories = null;
    
    if (cacheService) {
      categories = await cacheService.get('skills:categories:list');
    }

    // If not in cache, fetch from database
    if (!categories) {
      categories = await Skill.distinct('category');
      
      // Cache the results
      if (cacheService) {
        await cacheService.set('skills:categories:list', categories, 3600); // 1 hour
      }
    }

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error getting skill categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh mục kỹ năng'
    });
  }
});

// @desc    Get skills by category
// @route   GET /api/skills/category/:category
// @access  Public
const getSkillsByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const skills = await Skill.find({ category })
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Skill.countDocuments({ category });

    res.status(200).json({
      success: true,
      data: skills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting skills by category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy kỹ năng theo danh mục'
    });
  }
});

// @desc    Get popular skills
// @route   GET /api/skills/popular
// @access  Public
const getPopularSkills = asyncHandler(async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Try to get from cache first
    const cacheService = getCacheService();
    let skills = null;
    const cacheKey = `skills:popular:limit:${limit}`;
    
    if (cacheService) {
      skills = await cacheService.get(cacheKey);
    }

    // If not in cache, fetch from database
    if (!skills) {
      // Get skills with job count
      skills = await Skill.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'requirements.skills.skillId',
          as: 'jobs'
        }
      },
      {
        $addFields: {
          jobCount: { $size: '$jobs' }
        }
      },
      {
        $match: {
          jobCount: { $gt: 0 }
        }
      },
      {
        $sort: { jobCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          name: 1,
          category: 1,
          description: 1,
          jobCount: 1
        }
      }
    ]);

      // Cache the results
      if (cacheService) {
        await cacheService.set(cacheKey, skills, 1800); // 30 minutes (popular skills change more frequently)
      }
    }

    res.status(200).json({
      success: true,
      data: skills
    });
  } catch (error) {
    logger.error('Error getting popular skills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy kỹ năng phổ biến'
    });
  }
});

// @desc    Search skills
// @route   GET /api/skills/search
// @access  Public
const searchSkills = asyncHandler(async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa tìm kiếm'
      });
    }

    const skills = await Skill.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ name: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: skills
    });
  } catch (error) {
    logger.error('Error searching skills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm kỹ năng'
    });
  }
});

module.exports = {
  getAllSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  getSkillCategories,
  getSkillsByCategory,
  getPopularSkills,
  searchSkills
};
