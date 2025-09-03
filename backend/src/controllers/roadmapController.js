const SkillRoadmap = require('../models/SkillRoadmap');
const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const Skill = require('../models/Skill');
const aiService = require('../services/aiService');
const { logger } = require('../utils/logger');

// @desc    Get all roadmaps for user
// @route   GET /api/roadmaps
// @access  Private
const getRoadmaps = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const roadmaps = await SkillRoadmap.find(query)
      .populate('jobId', 'title companyId')
      .populate('targetSkills.skillId', 'name category')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SkillRoadmap.countDocuments(query);

    res.status(200).json({
      success: true,
      data: roadmaps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách roadmap'
    });
  }
};

// @desc    Get single roadmap
// @route   GET /api/roadmaps/:id
// @access  Private
const getRoadmap = async (req, res) => {
  try {
    const roadmap = await SkillRoadmap.findById(req.params.id)
      .populate('jobId', 'title companyId description requirements')
      .populate('targetSkills.skillId', 'name category description level');

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy roadmap'
      });
    }

    // Check ownership
    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem roadmap này'
      });
    }

    res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    logger.error('Error getting roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin roadmap'
    });
  }
};

// @desc    Create new roadmap
// @route   POST /api/roadmaps
// @access  Private
const createRoadmap = async (req, res) => {
  try {
    const roadmapData = req.body;
    roadmapData.userId = req.user.id;

    const roadmap = await SkillRoadmap.create(roadmapData);

    await roadmap.populate('jobId', 'title companyId');
    await roadmap.populate('targetSkills.skillId', 'name category');

    res.status(201).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    logger.error('Error creating roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo roadmap'
    });
  }
};

// @desc    Update roadmap
// @route   PUT /api/roadmaps/:id
// @access  Private
const updateRoadmap = async (req, res) => {
  try {
    const roadmap = await SkillRoadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy roadmap'
      });
    }

    // Check ownership
    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa roadmap này'
      });
    }

    const updatedRoadmap = await SkillRoadmap.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('jobId', 'title companyId')
      .populate('targetSkills.skillId', 'name category');

    res.status(200).json({
      success: true,
      data: updatedRoadmap
    });
  } catch (error) {
    logger.error('Error updating roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật roadmap'
    });
  }
};

// @desc    Delete roadmap
// @route   DELETE /api/roadmaps/:id
// @access  Private
const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await SkillRoadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy roadmap'
      });
    }

    // Check ownership
    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa roadmap này'
      });
    }

    await roadmap.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa roadmap thành công'
    });
  } catch (error) {
    logger.error('Error deleting roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa roadmap'
    });
  }
};

// @desc    Complete a week in roadmap
// @route   PUT /api/roadmaps/:id/complete-week/:weekNumber
// @access  Private
const completeWeek = async (req, res) => {
  try {
    const { id, weekNumber } = req.params;
    const { notes } = req.body;

    const roadmap = await SkillRoadmap.findById(id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy roadmap'
      });
    }

    // Check ownership
    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật roadmap này'
      });
    }

    await roadmap.completeWeek(parseInt(weekNumber), notes);

    res.status(200).json({
      success: true,
      data: roadmap,
      message: `Hoàn thành tuần ${weekNumber}`
    });
  } catch (error) {
    logger.error('Error completing week:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hoàn thành tuần'
    });
  }
};

// @desc    Update progress for a week
// @route   PUT /api/roadmaps/:id/progress/:weekNumber
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const { id, weekNumber } = req.params;
    const { objectivesCompleted } = req.body;

    const roadmap = await SkillRoadmap.findById(id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy roadmap'
      });
    }

    // Check ownership
    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật roadmap này'
      });
    }

    await roadmap.updateProgress(parseInt(weekNumber), objectivesCompleted);

    res.status(200).json({
      success: true,
      data: roadmap,
      message: 'Cập nhật tiến độ thành công'
    });
  } catch (error) {
    logger.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật tiến độ'
    });
  }
};

// @desc    Get roadmap analytics
// @route   GET /api/roadmaps/:id/analytics
// @access  Private
const getRoadmapAnalytics = async (req, res) => {
  try {
    const roadmap = await SkillRoadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy roadmap'
      });
    }

    // Check ownership
    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thống kê roadmap này'
      });
    }

    const analytics = {
      progress: roadmap.progress,
      weeklyProgress: roadmap.weeks.map(week => ({
        week: week.week,
        completed: week.completed,
        objectivesCount: week.objectives.length,
        resourcesCount: week.resources.length,
        completedAt: week.completedAt
      })),
      skillProgress: roadmap.targetSkills.map(skill => ({
        skill: skill.skillId,
        currentLevel: skill.currentLevel,
        targetLevel: skill.targetLevel,
        priority: skill.priority
      })),
      timeSpent: calculateTimeSpent(roadmap),
      estimatedCompletion: estimateCompletionDate(roadmap),
      recommendations: generateRecommendations(roadmap)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting roadmap analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê roadmap'
    });
  }
};

// @desc    Generate roadmap from job using AI
// @route   POST /api/roadmaps/generate-from-job/:jobId
// @access  Private
const generateRoadmapFromJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { duration = 8 } = req.body;
    const userId = req.user.id;

    // Get job details
    const job = await Job.findById(jobId)
      .populate('companyId', 'name')
      .populate('requirements.skills.skillId', 'name category');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Get user profile
    const userProfile = await CandidateProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người dùng'
      });
    }

    // Check if roadmap already exists
    const existingRoadmap = await SkillRoadmap.findOne({ userId, jobId });
    if (existingRoadmap) {
      return res.status(400).json({
        success: false,
        message: 'Roadmap cho công việc này đã tồn tại'
      });
    }

    // Generate roadmap using AI
    const aiRoadmap = await aiService.generateSkillRoadmapForJob(job, userProfile, parseInt(duration));

    // Create roadmap document
    const roadmapData = {
      userId,
      jobId,
      title: `Roadmap: ${job.title} tại ${job.companyId.name}`,
      description: `Lộ trình phát triển kỹ năng cho vị trí ${job.title}`,
      targetSkills: job.requirements.skills.map(skill => ({
        skillId: skill.skillId._id,
        currentLevel: 'beginner',
        targetLevel: skill.level === 'required' ? 'intermediate' : 'beginner',
        priority: skill.importance || 5
      })),
      weeks: aiRoadmap.weeks || [],
      settings: {
        duration: parseInt(duration),
        difficulty: aiRoadmap.difficulty || 'beginner',
        estimatedTotalHours: aiRoadmap.estimatedTotalHours || 0,
        pace: 'normal'
      },
      metadata: {
        skillGaps: aiRoadmap.skillGaps || [],
        userProfile: {
          currentSkills: userProfile.skills?.map(s => s.name) || [],
          education: userProfile.education?.fieldOfStudy,
          experience: userProfile.experience?.length || 0
        },
        targetJob: {
          title: job.title,
          company: job.companyId.name,
          category: job.aiAnalysis?.category
        }
      }
    };

    const roadmap = await SkillRoadmap.create(roadmapData);

    await roadmap.populate('jobId', 'title companyId');
    await roadmap.populate('targetSkills.skillId', 'name category');

    res.status(201).json({
      success: true,
      data: roadmap,
      message: 'Tạo roadmap thành công'
    });
  } catch (error) {
    logger.error('Error generating roadmap from job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo roadmap từ công việc'
    });
  }
};

// @desc    Get recommended roadmaps based on user profile
// @route   GET /api/roadmaps/recommended
// @access  Private
const getRecommendedRoadmaps = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    // Get user profile
    const userProfile = await CandidateProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người dùng'
      });
    }

    // Get jobs that match user skills
    const userSkills = userProfile.skills?.map(s => s.name.toLowerCase()) || [];
    
    const matchingJobs = await Job.find({
      'requirements.skills.skillId': {
        $in: await Skill.find({
          name: { $regex: userSkills.join('|'), $options: 'i' }
        }).distinct('_id')
      }
    })
      .populate('companyId', 'name')
      .populate('requirements.skills.skillId', 'name category')
      .limit(parseInt(limit));

    // Generate recommendations
    const recommendations = await Promise.all(
      matchingJobs.map(async (job) => {
        const matchScore = await aiService.calculateJobMatchScore(job, userProfile);
        return {
          job,
          matchScore: matchScore.overall,
          reasons: matchScore.breakdown
        };
      })
    );

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Error getting recommended roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy roadmap gợi ý'
    });
  }
};

// Helper functions
const calculateTimeSpent = (roadmap) => {
  const completedWeeks = roadmap.weeks.filter(week => week.completed);
  return completedWeeks.reduce((total, week) => {
    return total + week.resources.reduce((weekTotal, resource) => {
      return weekTotal + (resource.duration || 1);
    }, 0);
  }, 0);
};

const estimateCompletionDate = (roadmap) => {
  if (roadmap.progress.completionPercentage === 100) {
    return roadmap.weeks.find(week => week.completed)?.completedAt;
  }

  const completedWeeks = roadmap.progress.completedWeeks;
  const totalWeeks = roadmap.weeks.length;
  const remainingWeeks = totalWeeks - completedWeeks;
  
  const estimatedDays = remainingWeeks * 7; // Assuming 1 week per week
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + estimatedDays);
  
  return completionDate;
};

const generateRecommendations = (roadmap) => {
  const recommendations = [];
  
  if (roadmap.progress.completionPercentage < 25) {
    recommendations.push('Bạn mới bắt đầu roadmap. Hãy tập trung vào các mục tiêu tuần đầu tiên.');
  }
  
  if (roadmap.progress.completionPercentage > 50 && roadmap.progress.completionPercentage < 75) {
    recommendations.push('Bạn đã hoàn thành hơn một nửa roadmap. Hãy duy trì động lực!');
  }
  
  const currentWeek = roadmap.weeks.find(week => week.week === roadmap.progress.currentWeek);
  if (currentWeek && !currentWeek.completed) {
    recommendations.push(`Tuần ${currentWeek.week}: ${currentWeek.milestone}`);
  }
  
  return recommendations;
};

module.exports = {
  getRoadmaps,
  getRoadmap,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  completeWeek,
  updateProgress,
  getRoadmapAnalytics,
  generateRoadmapFromJob,
  getRecommendedRoadmaps
};
