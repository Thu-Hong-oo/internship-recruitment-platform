const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const Skill = require('../models/Skill');
const aiService = require('../services/aiService');
const { JobRecommendationEngine } = require('../services/jobRecommendation');
const { logger } = require('../utils/logger');

// Initialize AI services
const recommendationEngine = new JobRecommendationEngine();

// @desc    Get all jobs with filtering and pagination (supports text search)
// @route   GET /api/jobs
// @access  Public
const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      // Search parameters
      q, // Text search query
      // Filter parameters
      category,
      location,
      type,
      remote,
      skills,
      difficulty,
      company,
      salaryMin,
      salaryMax,
      experienceLevel,
      educationLevel,
      jobType,
      isUrgent,
      isFeatured,
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Text search (if query provided)
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'requirements.skills.skillId.name': { $regex: q, $options: 'i' } },
      ];
    }

    // Build filter query
    if (category) query['aiAnalysis.category'] = category;
    if (location) query['location.city'] = { $regex: location, $options: 'i' };
    if (type) query['internship.type'] = type;
    if (remote) query['location.remote'] = remote === 'true';
    if (difficulty) query['aiAnalysis.difficulty'] = difficulty;
    if (company) query['companyId'] = company;
    if (status) query['status'] = status;
    if (isUrgent !== undefined) query['isUrgent'] = isUrgent === 'true';
    if (isFeatured !== undefined) query['isFeatured'] = isFeatured === 'true';
    if (jobType) query['jobType'] = jobType;

    // Salary range filter
    if (salaryMin || salaryMax) {
      query['salary'] = {};
      if (salaryMin) query['salary.min'] = { $gte: parseInt(salaryMin) };
      if (salaryMax) query['salary.max'] = { $lte: parseInt(salaryMax) };
    }

    // Experience and education filter
    if (experienceLevel)
      query['requirements.experience.experienceLevel'] = experienceLevel;
    if (educationLevel) query['requirements.education.level'] = educationLevel;

    // Skills filter
    if (skills) {
      const skillIds = skills.split(',').map(skill => skill.trim());
      query['requirements.skills.skillId'] = { $in: skillIds };
    }

    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj = {};
    if (sortBy === 'salary') {
      sortObj['salary.min'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'views') {
      sortObj['stats.views'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'applications') {
      sortObj['stats.applications'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort(sortObj)
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
        pages: Math.ceil(total / limit),
      },
      filters: {
        appliedFilters: Object.keys(query).length,
        searchQuery: q || null,
        availableFilters: {
          category: !!category,
          location: !!location,
          type: !!type,
          remote: !!remote,
          skills: !!skills,
          difficulty: !!difficulty,
          company: !!company,
          salaryRange: !!(salaryMin || salaryMax),
          experienceLevel: !!experienceLevel,
          educationLevel: !!educationLevel,
          jobType: !!jobType,
          isUrgent: isUrgent !== undefined,
          isFeatured: isFeatured !== undefined,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc',
    });
  }
};

// @desc    Advanced semantic search for jobs using AI
// @route   GET /api/jobs/search
// @access  Public
const searchJobs = async (req, res) => {
  try {
    const {
      q, // Required search query
      page = 1,
      limit = 10,
      // Additional filters for AI search
      skills,
      location,
      category,
      jobType,
      salaryMin,
      salaryMax,
      experienceLevel,
      educationLevel,
      isRemote,
      isUrgent,
      isFeatured,
    } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa tìm kiếm (q)',
      });
    }

    let jobs = [];
    let searchMethod = 'text'; // Track which search method was used

    // Try AI semantic search first
    try {
      const searchResults = await aiService.semanticSearch(q, 'jobs');
      const jobIds = searchResults.map(result => result.id);

      if (jobIds.length > 0) {
        const query = { _id: { $in: jobIds }, status: 'active' };
        
        // Apply additional filters to AI results
        if (skills) {
          const skillIds = skills.split(',').map(skill => skill.trim());
          query['requirements.skills.skillId'] = { $in: skillIds };
        }
        if (location) query['location.city'] = { $regex: location, $options: 'i' };
        if (category) query['aiAnalysis.category'] = category;
        if (jobType) query['jobType'] = jobType;
        if (isRemote !== undefined) query['location.remote'] = isRemote === 'true';
        if (isUrgent !== undefined) query['isUrgent'] = isUrgent === 'true';
        if (isFeatured !== undefined) query['isFeatured'] = isFeatured === 'true';

        // Salary range
        if (salaryMin || salaryMax) {
          query['salary'] = {};
          if (salaryMin) query['salary.min'] = { $gte: parseInt(salaryMin) };
          if (salaryMax) query['salary.max'] = { $lte: parseInt(salaryMax) };
        }

        // Experience and education
        if (experienceLevel) query['requirements.experience.experienceLevel'] = experienceLevel;
        if (educationLevel) query['requirements.education.level'] = educationLevel;

        const skip = (page - 1) * limit;
        jobs = await Job.find(query)
          .populate('companyId', 'name logo industry')
          .populate('requirements.skills.skillId', 'name category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        searchMethod = 'ai';
      }
    } catch (aiError) {
      logger.warn('AI search failed, falling back to text search:', aiError);
    }

    // Fallback to enhanced text search if AI fails or returns no results
    if (jobs.length === 0) {
      const query = { status: 'active' };

      // Enhanced text search
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'requirements.skills.skillId.name': { $regex: q, $options: 'i' } },
        { 'companyId.name': { $regex: q, $options: 'i' } },
      ];

      // Apply filters
      if (skills) {
        const skillIds = skills.split(',').map(skill => skill.trim());
        query['requirements.skills.skillId'] = { $in: skillIds };
      }
      if (location) query['location.city'] = { $regex: location, $options: 'i' };
      if (category) query['aiAnalysis.category'] = category;
      if (jobType) query['jobType'] = jobType;
      if (isRemote !== undefined) query['location.remote'] = isRemote === 'true';
      if (isUrgent !== undefined) query['isUrgent'] = isUrgent === 'true';
      if (isFeatured !== undefined) query['isFeatured'] = isFeatured === 'true';

      // Salary range
      if (salaryMin || salaryMax) {
        query['salary'] = {};
        if (salaryMin) query['salary.min'] = { $gte: parseInt(salaryMin) };
        if (salaryMax) query['salary.max'] = { $lte: parseInt(salaryMax) };
      }

      // Experience and education
      if (experienceLevel) query['requirements.experience.experienceLevel'] = experienceLevel;
      if (educationLevel) query['requirements.education.level'] = educationLevel;

      const skip = (page - 1) * limit;
      jobs = await Job.find(query)
        .populate('companyId', 'name logo industry')
        .populate('requirements.skills.skillId', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      searchMethod = 'text';
    }

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      search: {
        query: q,
        method: searchMethod,
        totalResults: total,
      },
    });
  } catch (error) {
    logger.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm công việc',
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
      .populate(
        'requirements.skills.skillId',
        'name category description level'
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Error getting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công việc',
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
        message: 'User ID là bắt buộc',
      });
    }

    // Get user profile
    const userProfile = await CandidateProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người dùng',
      });
    }

    // Get similar jobs
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const recommendations = await recommendationEngine.getSimilarJobs(
      job,
      userProfile,
      10
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    logger.error('Error getting job recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy gợi ý công việc',
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
        message: 'User ID là bắt buộc',
      });
    }

    const job = await Job.findById(id).populate(
      'requirements.skills.skillId',
      'name category'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const userProfile = await CandidateProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người dùng',
      });
    }

    const matchScore = await aiService.calculateJobMatchScore(job, userProfile);

    res.status(200).json({
      success: true,
      data: matchScore,
    });
  } catch (error) {
    logger.error('Error calculating match score:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tính điểm phù hợp',
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
        message: 'Không tìm thấy công việc',
      });
    }

    // Analyze job description and requirements
    const analysis = await aiService.analyzeJobSkills(job);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('Error analyzing job skills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích kỹ năng công việc',
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

    const job = await Job.findById(id).populate(
      'requirements.skills.skillId',
      'name category level'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    let userProfile = null;
    if (userId) {
      userProfile = await CandidateProfile.findOne({ userId });
    }

    const roadmap = await aiService.generateSkillRoadmap(
      job,
      userProfile,
      parseInt(duration)
    );

    res.status(200).json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    logger.error('Error generating skill roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lộ trình kỹ năng',
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
    const aiAnalysis = await aiService.analyzeJobDescription(
      jobData.description
    );
    jobData.aiAnalysis = aiAnalysis;

    const job = await Job.create(jobData);

    // Populate company and skills
    await job.populate('companyId', 'name logo industry');
    await job.populate('requirements.skills.skillId', 'name category');

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công việc',
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
        message: 'Không tìm thấy công việc',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa công việc này',
      });
    }

    const updateData = req.body;

    // Re-analyze if description changed
    if (updateData.description && updateData.description !== job.description) {
      const aiAnalysis = await aiService.analyzeJobDescription(
        updateData.description
      );
      updateData.aiAnalysis = aiAnalysis;
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category');

    res.status(200).json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật công việc',
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
        message: 'Không tìm thấy công việc',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa công việc này',
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa công việc thành công',
    });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công việc',
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
        message: 'Không tìm thấy công việc',
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId: id,
      jobseekerId: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã ứng tuyển cho công việc này',
      });
    }

    // Check application deadline
    if (
      job.applicationSettings.deadline &&
      new Date() > job.applicationSettings.deadline
    ) {
      return res.status(400).json({
        success: false,
        message: 'Đã hết hạn ứng tuyển',
      });
    }

    const application = await Application.create({
      jobId: id,
      jobseekerId: req.user.id,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi ứng tuyển',
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
        message: 'Không tìm thấy công việc',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem ứng viên của công việc này',
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
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ứng viên',
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
        message: 'Không tìm thấy công việc',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật ứng viên của công việc này',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển',
      });
    }

    application.status = status;
    if (feedback) application.feedback = feedback;
    await application.save();

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái ứng tuyển',
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
        message: 'Không tìm thấy công việc',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thống kê của công việc này',
      });
    }

    const applications = await Application.find({ jobId: id });

    const analytics = {
      totalApplications: applications.length,
      statusBreakdown: {
        pending: applications.filter(app => app.status === 'pending').length,
        reviewing: applications.filter(app => app.status === 'reviewing')
          .length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
      },
      applicationsByDay: await getApplicationsByDay(id),
      topSkills: await getTopSkillsFromApplications(applications),
      averageMatchScore: await calculateAverageMatchScore(applications),
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error getting job analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê công việc',
    });
  }
};

// Helper functions
const getApplicationsByDay = async jobId => {
  const applications = await Application.aggregate([
    { $match: { jobId: jobId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return applications;
};

const getTopSkillsFromApplications = async applications => {
  // This would require analyzing CVs of applicants
  // For now, return empty array
  return [];
};

const calculateAverageMatchScore = async applications => {
  // This would require calculating match scores for all applications
  // For now, return 0
  return 0;
};

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
const getFeaturedJobs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = { isFeatured: true, status: 'active' };
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: jobs,
      total,
      limit: parseInt(limit),
      message: `Tìm thấy ${total} công việc nổi bật`,
    });
  } catch (error) {
    logger.error('Error getting featured jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc nổi bật',
    });
  }
};

// @desc    Get urgent jobs
// @route   GET /api/jobs/urgent
// @access  Public
const getUrgentJobs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = { isUrgent: true, status: 'active' };
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: jobs,
      total,
      limit: parseInt(limit),
      message: `Tìm thấy ${total} công việc khẩn cấp`,
    });
  } catch (error) {
    logger.error('Error getting urgent jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc khẩn cấp',
    });
  }
};

// @desc    Get hot jobs (most viewed)
// @route   GET /api/jobs/hot
// @access  Public
const getHotJobs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = { status: 'active' };
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ 'stats.views': -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: jobs,
      total,
      limit: parseInt(limit),
      message: `Tìm thấy ${total} công việc phổ biến`,
    });
  } catch (error) {
    logger.error('Error getting hot jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc phổ biến',
    });
  }
};

// @desc    Get jobs by category
// @route   GET /api/jobs/category/:category
// @access  Public
const getJobsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const jobs = await Job.find({ category, status: 'active' })
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({ category, status: 'active' });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting jobs by category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc theo danh mục',
    });
  }
};

// @desc    Get jobs by location
// @route   GET /api/jobs/location/:location
// @access  Public
const getJobsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const jobs = await Job.find({
      'location.city': { $regex: location, $options: 'i' },
      status: 'active',
    })
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      'location.city': { $regex: location, $options: 'i' },
      status: 'active',
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting jobs by location:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc theo địa điểm',
    });
  }
};

// @desc    Get job by slug
// @route   GET /api/jobs/slug/:slug
// @access  Public
const getJobBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const job = await Job.findOne({ slug, status: 'active' })
      .populate('companyId', 'name logo industry description')
      .populate(
        'requirements.skills.skillId',
        'name category description level'
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Error getting job by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công việc',
    });
  }
};

// @desc    Get similar jobs
// @route   GET /api/jobs/:id/similar
// @access  Public
const getSimilarJobs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    // Find similar jobs based on category and skills
    const query = {
      _id: { $ne: id },
      category: job.category,
      status: 'active',
    };
    const total = await Job.countDocuments(query);

    const similarJobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: similarJobs,
      total,
      limit: parseInt(limit),
      message: `Tìm thấy ${total} công việc tương tự`,
    });
  } catch (error) {
    logger.error('Error getting similar jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc tương tự',
    });
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/:id/stats
// @access  Public
const getJobStats = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const applications = await Application.find({ jobId: id });

    const stats = {
      views: job.stats?.views || 0,
      applications: applications.length,
      saves: job.stats?.saves || 0,
      shares: job.stats?.shares || 0,
      clicks: job.stats?.clicks || 0,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting job stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê công việc',
    });
  }
};

// @desc    Increment job views
// @route   POST /api/jobs/:id/view
// @access  Public
const incrementJobViews = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndUpdate(
      id,
      { $inc: { 'stats.views': 1 } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật lượt xem',
    });
  } catch (error) {
    logger.error('Error incrementing job views:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lượt xem',
    });
  }
};

// @desc    Get jobs by company
// @route   GET /api/jobs/company/:companyId
// @access  Public
const getJobsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status = 'active' } = req.query;

    const skip = (page - 1) * limit;

    const jobs = await Job.find({ companyId, status })
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({ companyId, status });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting jobs by company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc của công ty',
    });
  }
};

// @desc    Get jobs by skills
// @route   GET /api/jobs/skills
// @access  Public
const getJobsBySkills = async (req, res) => {
  try {
    const { skillIds, page = 1, limit = 10 } = req.query;

    if (!skillIds) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách kỹ năng',
      });
    }

    const skillIdArray = skillIds.split(',').map(skill => skill.trim());
    const skip = (page - 1) * limit;

    const jobs = await Job.find({
      'requirements.skills.skillId': { $in: skillIdArray },
      status: 'active',
    })
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      'requirements.skills.skillId': { $in: skillIdArray },
      status: 'active',
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting jobs by skills:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc theo kỹ năng',
    });
  }
};

// @desc    Get recent jobs
// @route   GET /api/jobs/recent
// @access  Public
const getRecentJobs = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;

    const query = { status: 'active' };
    if (category) query.category = category;

    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: jobs,
      total,
      limit: parseInt(limit),
      message: `Tìm thấy ${total} công việc gần đây`,
    });
  } catch (error) {
    logger.error('Error getting recent jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc gần đây',
    });
  }
};

// @desc    Get popular jobs
// @route   GET /api/jobs/popular
// @access  Public
const getPopularJobs = async (req, res) => {
  try {
    const { limit = 10, period = 'week' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const query = {
      status: 'active',
      createdAt: { $gte: startDate },
    };
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ 'stats.views': -1, 'stats.applications': -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: jobs,
      total,
      limit: parseInt(limit),
      period,
      message: `Tìm thấy ${total} công việc phổ biến trong ${period}`,
    });
  } catch (error) {
    logger.error('Error getting popular jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc phổ biến',
    });
  }
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
  updateApplicationStatus,
  getFeaturedJobs,
  getUrgentJobs,
  getHotJobs,
  getJobsByCategory,
  getJobsByLocation,
  getJobBySlug,
  getSimilarJobs,
  getJobStats,
  incrementJobViews,
  getJobsByCompany,
  getJobsBySkills,
  getRecentJobs,
  getPopularJobs,
};
