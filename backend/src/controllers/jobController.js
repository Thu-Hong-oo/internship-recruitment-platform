const Job = require('../models/Job');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const Skill = require('../models/Skill');
const aiService = require('../services/aiService');
const { JobRecommendationEngine } = require('../services/jobRecommendation');
const { logger } = require('../utils/logger');

// Initialize AI services
const recommendationEngine = new JobRecommendationEngine();

// @desc    Get all jobs with filtering and pagination
// @route   GET /api/jobs
// @access  Public
const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      location,
      type,
      remote,
      skills,
      difficulty,
      company
    } = req.query;

    const query = {};

    // Build filter query
    if (category) query['aiAnalysis.category'] = category;
    if (location) query['location.city'] = { $regex: location, $options: 'i' };
    if (type) query['internship.type'] = type;
    if (remote) query['location.remote'] = remote === 'true';
    if (difficulty) query['aiAnalysis.difficulty'] = difficulty;
    if (company) query['companyId'] = company;

    // Skills filter
    if (skills) {
      const skillIds = skills.split(',').map(skill => skill.trim());
      query['requirements.skills.skillId'] = { $in: skillIds };
    }

    const skip = (page - 1) * limit;

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc'
    });
  }
};

// @desc    Search jobs with semantic search
// @route   GET /api/jobs/search
// @access  Public
const searchJobs = async (req, res) => {
  try {
    const { q, skills, location, type, limit = 10 } = req.query;

    let jobs = [];

    if (q) {
      // Use AI service for semantic search
      const searchResults = await aiService.semanticSearch(q, 'jobs');
      const jobIds = searchResults.map(result => result.id);
      jobs = await Job.find({ _id: { $in: jobIds } })
        .populate('companyId', 'name logo industry')
        .populate('requirements.skills.skillId', 'name category')
        .limit(parseInt(limit));
    } else {
      // Fallback to regular search
      const query = {};
      if (skills) {
        const skillIds = skills.split(',').map(skill => skill.trim());
        query['requirements.skills.skillId'] = { $in: skillIds };
      }
      if (location) query['location.city'] = { $regex: location, $options: 'i' };
      if (type) query['internship.type'] = type;

      jobs = await Job.find(query)
        .populate('companyId', 'name logo industry')
        .populate('requirements.skills.skillId', 'name category')
        .limit(parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: jobs
    });
  } catch (error) {
    logger.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm công việc'
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name logo industry description')
      .populate('requirements.skills.skillId', 'name category description level');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Error getting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công việc'
    });
  }
};

// @desc    Get job recommendations for user
// @route   GET /api/jobs/:id/recommendations
// @access  Public
const getJobRecommendations = async (req, res) => {
  try {
    const { userId } = req.query;
    const { id } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
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

    // Get similar jobs
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    const recommendations = await recommendationEngine.getSimilarJobs(job, userProfile, 10);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Error getting job recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy gợi ý công việc'
    });
  }
};

// @desc    Get job match score for user
// @route   GET /api/jobs/:id/match-score
// @access  Public
const getJobMatchScore = async (req, res) => {
  try {
    const { userId } = req.query;
    const { id } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
      });
    }

    const job = await Job.findById(id)
      .populate('requirements.skills.skillId', 'name category');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    const userProfile = await CandidateProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người dùng'
      });
    }

    const matchScore = await aiService.calculateJobMatchScore(job, userProfile);

    res.status(200).json({
      success: true,
      data: matchScore
    });
  } catch (error) {
    logger.error('Error calculating match score:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tính điểm phù hợp'
    });
  }
};

// @desc    Analyze job skills using AI
// @route   GET /api/jobs/:id/skill-analysis
// @access  Public
const analyzeJobSkills = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Analyze job description and requirements
    const analysis = await aiService.analyzeJobSkills(job);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error analyzing job skills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích kỹ năng công việc'
    });
  }
};

// @desc    Generate skill roadmap for job
// @route   GET /api/jobs/:id/roadmap
// @access  Public
const generateSkillRoadmap = async (req, res) => {
  try {
    const { userId, duration = 8 } = req.query;
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate('requirements.skills.skillId', 'name category level');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    let userProfile = null;
    if (userId) {
      userProfile = await CandidateProfile.findOne({ userId });
    }

    const roadmap = await aiService.generateSkillRoadmap(job, userProfile, parseInt(duration));

    res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    logger.error('Error generating skill roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lộ trình kỹ năng'
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
const createJob = async (req, res) => {
  try {
    const jobData = req.body;
    jobData.companyId = req.user.companyId;

    // Analyze job with AI
    const aiAnalysis = await aiService.analyzeJobDescription(jobData.description);
    jobData.aiAnalysis = aiAnalysis;

    const job = await Job.create(jobData);

    // Populate company and skills
    await job.populate('companyId', 'name logo industry');
    await job.populate('requirements.skills.skillId', 'name category');

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công việc'
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa công việc này'
      });
    }

    const updateData = req.body;

    // Re-analyze if description changed
    if (updateData.description && updateData.description !== job.description) {
      const aiAnalysis = await aiService.analyzeJobDescription(updateData.description);
      updateData.aiAnalysis = aiAnalysis;
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category');

    res.status(200).json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật công việc'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa công việc này'
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa công việc thành công'
    });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công việc'
    });
  }
};

// @desc    Apply for job
// @route   POST /api/jobs/:id/apply
// @access  Private (Candidate)
const applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverLetter, resumeUrl, portfolioUrl } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId: id,
      jobseekerId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã ứng tuyển cho công việc này'
      });
    }

    // Check application deadline
    if (job.applicationSettings.deadline && new Date() > job.applicationSettings.deadline) {
      return res.status(400).json({
        success: false,
        message: 'Đã hết hạn ứng tuyển'
      });
    }

    const application = await Application.create({
      jobId: id,
      jobseekerId: req.user.id,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi ứng tuyển'
    });
  }
};

// @desc    Get job applications
// @route   GET /api/jobs/:id/applications
// @access  Private (Employer)
const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem ứng viên của công việc này'
      });
    }

    const query = { jobId: id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .populate('jobseekerId', 'name email avatar')
      .populate('jobId', 'title companyId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ứng viên'
    });
  }
};

// @desc    Update application status
// @route   PUT /api/jobs/:id/applications/:applicationId
// @access  Private (Employer)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id, applicationId } = req.params;
    const { status, feedback } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật ứng viên của công việc này'
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển'
      });
    }

    application.status = status;
    if (feedback) application.feedback = feedback;
    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái ứng tuyển'
    });
  }
};

// @desc    Get job analytics
// @route   GET /api/jobs/:id/analytics
// @access  Private (Employer)
const getJobAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thống kê của công việc này'
      });
    }

    const applications = await Application.find({ jobId: id });
    
    const analytics = {
      totalApplications: applications.length,
      statusBreakdown: {
        pending: applications.filter(app => app.status === 'pending').length,
        reviewing: applications.filter(app => app.status === 'reviewing').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length
      },
      applicationsByDay: await getApplicationsByDay(id),
      topSkills: await getTopSkillsFromApplications(applications),
      averageMatchScore: await calculateAverageMatchScore(applications)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting job analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê công việc'
    });
  }
};

// Helper functions
const getApplicationsByDay = async (jobId) => {
  const applications = await Application.aggregate([
    { $match: { jobId: jobId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  return applications;
};

const getTopSkillsFromApplications = async (applications) => {
  // This would require analyzing CVs of applicants
  // For now, return empty array
  return [];
};

const calculateAverageMatchScore = async (applications) => {
  // This would require calculating match scores for all applications
  // For now, return 0
  return 0;
};

module.exports = {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobRecommendations,
  getJobMatchScore,
  generateSkillRoadmap,
  analyzeJobSkills,
  searchJobs,
  getJobAnalytics,
  applyForJob,
  getJobApplications,
  updateApplicationStatus
};
