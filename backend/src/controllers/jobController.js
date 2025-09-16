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
      .populate('postedBy', 'fullName name email profile googleProfile avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const jobObj = job.toObject();
    if (jobObj.postedBy) {
      const pb = jobObj.postedBy;
      const computedFullName =
        pb.fullName ||
        pb.name ||
        (pb.profile && `${pb.profile.firstName || ''} ${pb.profile.lastName || ''}`.trim()) ||
        (pb.googleProfile && pb.googleProfile.name) ||
        pb.email?.split('@')[0] ||
        'Chưa cập nhật';
      jobObj.postedBy = {
        ...pb,
        fullName: computedFullName,
      };
    }

    res.status(200).json({
      success: true,
      data: jobObj,
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
    // Default: employer creates as draft; must submit for review to move to pending
    if (req.user.role !== 'admin') {
      jobData.status = 'draft';
    }

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
    await job.populate('postedBy', 'fullName name email profile googleProfile avatar');

    const jobObj = job.toObject();
    if (jobObj.postedBy) {
      const pb = jobObj.postedBy;
      const computedFullName =
        pb.fullName ||
        pb.name ||
        (pb.profile && `${pb.profile.firstName || ''} ${pb.profile.lastName || ''}`.trim()) ||
        (pb.googleProfile && pb.googleProfile.name) ||
        pb.email?.split('@')[0] ||
        'Chưa cập nhật';
      jobObj.postedBy = {
        ...pb,
        fullName: computedFullName,
      };
    }

    res.status(201).json({
      success: true,
      data: jobObj,
      message:
        jobObj.status === 'active'
          ? 'Đăng job thành công'
          : 'Tạo job thành công, chờ admin duyệt',
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
    // Employers cannot directly change status to active/closed/filled
    if (updateData.status && req.user.role !== 'admin') {
      delete updateData.status;
    }

    // Validate subCategories (max 2)
    if (updateData.subCategories && updateData.subCategories.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được chọn tối đa 2 ngành nghề phụ',
      });
    }

    // Validate reasonsToApply (max 3)
    if (updateData.reasonsToApply && updateData.reasonsToApply.length > 5) {
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

// @desc    Submit job for admin review (draft -> pending)
// @route   POST /api/jobs/employer/:id/submit
// @access  Private (Employer)
const submitJobForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });
    }

    // Check company ownership
    const company = await Company.findByOwner(req.user.id);
    if (!company || job.companyId.toString() !== company._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền gửi duyệt công việc này' });
    }

    if (job.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể gửi duyệt job ở trạng thái draft' });
    }

    job.status = 'pending';
    await job.save();

    res.status(200).json({ success: true, data: job, message: 'Đã gửi duyệt. Vui lòng chờ admin phê duyệt' });
  } catch (error) {
    logger.error('Error submitting job for review:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi duyệt job' });
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
  incrementJobViews,
  getJobCompany,
  getJobStats,
  submitJobForReview,
};
