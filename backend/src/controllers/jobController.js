const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const { logger } = require('../utils/logger');

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
      subCategory,
      location,
      district,
      type, // location type: onsite, remote, hybrid
      remote,
      skills,
      company,
      salaryMin,
      salaryMax,
      yearOfStudy,
      majors,
      isPaid,
      internshipType,
      workEnvironment,
      genderRequirement,
      level,
      hiringCount,
      tags,
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Text search (if query provided)
    if (q) {
      query.$text = { $search: q };
    }

    // Build filter query
    if (category) query['category'] = category;
    if (subCategory) query['subCategories'] = { $in: subCategory.split(',') };
    if (location) query['location.city'] = { $regex: location, $options: 'i' };
    if (district)
      query['location.district'] = { $regex: district, $options: 'i' };
    if (type) query['location.type'] = type;
    if (remote) query['location.type'] = { $in: ['remote', 'hybrid'] };
    if (company) query['companyId'] = company;
    if (status) query['status'] = status;
    if (isPaid !== undefined) query['internship.isPaid'] = isPaid === 'true';
    if (internshipType) query['internship.type'] = internshipType;
    if (workEnvironment) query['workEnvironment'] = workEnvironment;
    if (genderRequirement)
      query['requirements.genderRequirement'] = genderRequirement;
    if (level) query['requirements.level'] = level;
    if (hiringCount) query['hiringCount'] = { $gte: parseInt(hiringCount) };

    // Salary range filter
    if (salaryMin || salaryMax) {
      query['internship.salary.amount'] = {};
      if (salaryMin)
        query['internship.salary.amount']['$gte'] = parseInt(salaryMin);
      if (salaryMax)
        query['internship.salary.amount']['$lte'] = parseInt(salaryMax);
    }

    // Year of study filter
    if (yearOfStudy) {
      const years = yearOfStudy.split(',').map(year => year.trim());
      query['requirements.yearOfStudy'] = { $in: years };
    }

    // Majors filter
    if (majors) {
      const majorArray = majors.split(',').map(major => major.trim());
      query['requirements.majors'] = { $in: majorArray };
    }

    // Skills filter
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query['requirements.skills'] = { $in: skillArray };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query['tags'] = { $in: tagArray };
    }

    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj = {};
    if (sortBy === 'salary') {
      sortObj['internship.salary.amount'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'views') {
      sortObj['stats.views'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'applications') {
      sortObj['stats.applications'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'startDate') {
      sortObj['internship.startDate'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo industry description')
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
          subCategory: !!subCategory,
          location: !!location,
          district: !!district,
          type: !!type,
          remote: !!remote,
          skills: !!skills,
          company: !!company,
          salaryRange: !!(salaryMin || salaryMax),
          yearOfStudy: !!yearOfStudy,
          majors: !!majors,
          isPaid: isPaid !== undefined,
          internshipType: !!internshipType,
          workEnvironment: !!workEnvironment,
          genderRequirement: !!genderRequirement,
          level: !!level,
          hiringCount: !!hiringCount,
          tags: !!tags,
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


// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name logo industry description')
      .populate('postedBy', 'name email');

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

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
const createJob = async (req, res) => {
  try {
    // Check if employer has a company
    const company = await Company.findByOwner(req.user.id);

    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần tạo thông tin công ty trước khi đăng job',
      });
    }

    // Check if company is approved
    if (company.status !== 'active') {
      return res.status(400).json({
        success: false,
        message:
          'Công ty của bạn chưa được duyệt. Vui lòng chờ admin duyệt trước khi đăng job.',
      });
    }

    const jobData = req.body;
    jobData.companyId = company._id;
    jobData.postedBy = req.user.id;

    // Validate subCategories (max 2)
    if (jobData.subCategories && jobData.subCategories.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được chọn tối đa 2 ngành nghề phụ',
      });
    }

    // Validate reasonsToApply (max 3)
    if (jobData.reasonsToApply && jobData.reasonsToApply.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được nhập tối đa 3 lý do nên ứng tuyển',
      });
    }

    const job = await Job.create(jobData);

    // Populate company info
    await job.populate('companyId', 'name logo industry description');
    await job.populate('postedBy', 'name email');

    res.status(201).json({
      success: true,
      data: job,
      message: 'Đăng job thành công',
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công việc',
      error: error.message,
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

    // Check if employer has a company
    const company = await Company.findByOwner(req.user.id);

    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần tạo thông tin công ty trước khi quản lý job',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa công việc này',
      });
    }

    const updateData = req.body;

    // Validate subCategories (max 2)
    if (updateData.subCategories && updateData.subCategories.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được chọn tối đa 2 ngành nghề phụ',
      });
    }

    // Validate reasonsToApply (max 3)
    if (updateData.reasonsToApply && updateData.reasonsToApply.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được nhập tối đa 3 lý do nên ứng tuyển',
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('companyId', 'name logo industry description')
      .populate('postedBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật công việc',
      error: error.message,
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

    // Check if employer has a company
    const company = await Company.findByOwner(req.user.id);

    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần tạo thông tin công ty trước khi quản lý job',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== company._id.toString()) {
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
      candidateId: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã ứng tuyển cho công việc này',
      });
    }

    // Check application deadline
    if (job.application.deadline && new Date() > job.application.deadline) {
      return res.status(400).json({
        success: false,
        message: 'Đã hết hạn ứng tuyển',
      });
    }

    const application = await Application.create({
      jobId: id,
      candidateId: req.user.id,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      status: 'pending',
    });

    // Update job stats
    await Job.findByIdAndUpdate(id, {
      $inc: { 'stats.applications': 1 },
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

    // Check if employer has a company
    const company = await Company.findByOwner(req.user.id);

    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần tạo thông tin công ty trước khi quản lý job',
      });
    }

    // Check ownership
    if (job.companyId.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem ứng viên của công việc này',
      });
    }

    const query = { jobId: id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .populate('candidateId', 'name email avatar')
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

// @desc    Get job by slug
// @route   GET /api/jobs/slug/:slug
// @access  Public
const getJobBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const job = await Job.findOne({ slug, status: 'active' })
      .populate('companyId', 'name logo industry description')
      .populate('postedBy', 'name email');

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

// @desc    Get jobs by category
// @route   GET /api/jobs/category/:category
// @access  Public
const getJobsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const jobs = await Job.find({ category, status: 'active' })
      .populate('companyId', 'name logo industry description')
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
      .populate('companyId', 'name logo industry description')
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
      .populate('companyId', 'name logo industry description')
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
    const { skills, page = 1, limit = 10 } = req.query;

    if (!skills) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách kỹ năng',
      });
    }

    const skillArray = skills.split(',').map(skill => skill.trim());
    const skip = (page - 1) * limit;

    const jobs = await Job.find({
      'requirements.skills': { $in: skillArray },
      status: 'active',
    })
      .populate('companyId', 'name logo industry description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      'requirements.skills': { $in: skillArray },
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
      .populate('companyId', 'name logo industry description')
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

// @desc    Get jobs by subcategory
// @route   GET /api/jobs/subcategory/:subCategory
// @access  Public
const getJobsBySubCategory = async (req, res) => {
  try {
    const { subCategory } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const jobs = await Job.find({
      subCategories: subCategory,
      status: 'active',
    })
      .populate('companyId', 'name logo industry description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      subCategories: subCategory,
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
    logger.error('Error getting jobs by subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc theo ngành nghề phụ',
    });
  }
};

// @desc    Get jobs by district
// @route   GET /api/jobs/district/:district
// @access  Public
const getJobsByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const jobs = await Job.find({
      'location.district': { $regex: district, $options: 'i' },
      status: 'active',
    })
      .populate('companyId', 'name logo industry description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      'location.district': { $regex: district, $options: 'i' },
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
    logger.error('Error getting jobs by district:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc theo quận/huyện',
    });
  }
};

// @desc    Get company info for job display
// @route   GET /api/jobs/:id/company
// @access  Public
const getJobCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id).populate(
      'companyId',
      'name logo industry description website size foundedYear headquarters'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        company: job.companyId,
        jobTitle: job.title,
        jobId: job._id,
      },
    });
  } catch (error) {
    logger.error('Error getting job company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công ty',
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

    const stats = {
      views: job.stats?.views || 0,
      applications: job.stats?.applications || 0,
      daysLeft: job.daysLeft,
      isExpired: job.isExpired,
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

module.exports = {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  getJobBySlug,
  getJobsByCategory,
  getJobsBySubCategory,
  getJobsByLocation,
  getJobsByDistrict,
  incrementJobViews,
  getJobsByCompany,
  getJobsBySkills,
  getRecentJobs,
  getJobCompany,
  getJobStats,
};
