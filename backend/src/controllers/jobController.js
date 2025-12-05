const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const Industry = require('../models/Industry');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const { logger } = require('../utils/logger');
const {
  createFlexibleRegex,
  removeVietnameseTones,
} = require('../utils/textUtils');
const {
  formatJobResponse,
  formatJobsResponse,
  formatMinimalJobsResponse,
} = require('../utils/jobFormatter');
const { processJobData } = require('../utils/jobHelpers');
const { getCacheService } = require('../config/initializeServices');
const {
  JOB_STATUS,
  EMPLOYER_PROFILE_STATUS,
  APPLICATION_STATUS,
} = require('../constants/common.constants');

// @desc    Get all jobs with filtering and pagination (supports text search)
// @route   GET /api/jobs
// @access  Public
// @query   sortBy - Sort field: 'createdAt' (default), 'updatedAt', 'title', 'salaryMin', 'deadline', etc.
// @query   sortOrder - Sort order: 'desc' (default, newest first) or 'asc' (oldest first)
// @note    Jobs are ALWAYS sorted. Default: by createdAt desc (newest jobs first)
const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      q, // Text search query
      location, // Legacy location field
      city, // New: filter by city in address
      district, // New: filter by district in address
      skills,
      employer,
      status,
      jobType,
      level, // New: filter by job level (Intern, Fresher, Junior, Senior, Manager, Director)
      workingMode, // New: filter by working mode (Onsite, Remote, Hybrid)
      experience, // New: filter by experience requirement
      education, // New: filter by education requirement
      positions, // New: filter by number of positions
      industry, // legacy string filter
      industryCode, // new normalized filter (root or leaf)
      subIndustryCode, // new leaf filter
      includeDescendants = 'true', // include children via industryPath
      category,
      salaryMin,
      salaryMax,
      salaryRange, // New: combined salary filter (e.g., "5000000-10000000")
      createdFrom,
      createdTo,
      deadlineFrom,
      deadlineTo,
      isUrgent, // New: filter urgent jobs (deadline within 7 days)
      tags,
      sortBy = 'createdAt', // Default: sort by creation date
      sortOrder = 'desc', // Default: descending (newest first)
    } = req.query;

    const view = req.query.view || 'summary';

    const query = {};

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Location filters (search in both legacy location and new address fields)
    // Supports accent-insensitive search: "Da Nang" matches "Đà Nẵng" and vice versa
    if (city || district || location) {
      const locationConditions = [];

      if (city) {
        const cityRegex = createFlexibleRegex(city);
        locationConditions.push({ 'address.city': cityRegex });
      }

      if (district) {
        const districtRegex = createFlexibleRegex(district);
        locationConditions.push({ 'address.district': districtRegex });
      }

      if (location) {
        // General location search in multiple fields
        const locationRegex = createFlexibleRegex(location);
        locationConditions.push(
          { location: locationRegex },
          { 'address.city': locationRegex },
          { 'address.district': locationRegex },
          { 'address.fullAddress': locationRegex }
        );
      }

      // Combine location conditions with AND logic if multiple specific filters
      // or OR logic if general location search
      if (city && district) {
        // Both city and district specified - must match both
        query['address.city'] = createFlexibleRegex(city);
        query['address.district'] = createFlexibleRegex(district);
      } else if (city || district) {
        // Only one specific location filter
        if (city) query['address.city'] = createFlexibleRegex(city);
        if (district) query['address.district'] = createFlexibleRegex(district);
      } else if (location) {
        // General location search - use OR
        query.$or = locationConditions;

        // Special handling: if location is Hồ Chí Minh, force city match to limit results to HCM
        const normalizedLocation =
          removeVietnameseTones(location).toLowerCase();
        const hcmKeywords = [
          'ho chi minh',
          'tp ho chi minh',
          'tphcm',
          'tp.hcm',
          'tp. ho chi minh',
          'hcm',
          'sai gon',
          'saigon',
          'tp hcm',
        ];
        if (hcmKeywords.some(keyword => normalizedLocation.includes(keyword))) {
          query['address.city'] = createFlexibleRegex('Hồ Chí Minh');
        }
      }
    }

    // Skills filter
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query['skills'] = { $in: skillArray };
    }

    // Employer filter
    if (employer) {
      query['employer'] = employer;
    }
    if (status) {
      query['status'] = status;
    } else if (req.user?.role !== 'admin') {
      // Public users chỉ thấy jobs đang mở/active
      query['status'] = { $in: [JOB_STATUS.OPEN, JOB_STATUS.ACTIVE] };
    } else {
      // Admin có thể thấy tất cả trừ deleted (trừ khi explicitly request)
      if (req.query.includeDeleted !== 'true') {
        query['status'] = { $ne: JOB_STATUS.DELETED };
      }
    }
    if (jobType) {
      query['jobType'] = jobType;
    }

    // Job level filter (Intern, Fresher, Junior, Senior, Manager, Director)
    if (level) {
      const levelArray = level.split(',').map(l => l.trim());
      query['level'] = { $in: levelArray };
    }

    // Working mode filter (Onsite, Remote, Hybrid)
    if (workingMode) {
      const modeArray = workingMode.split(',').map(m => m.trim());
      query['workingMode'] = { $in: modeArray };
    }

    // Experience filter
    if (experience) {
      query['experience'] = { $regex: experience, $options: 'i' };
    }

    // Education filter
    if (education) {
      query['education'] = { $regex: education, $options: 'i' };
    }

    // Positions filter (number of open positions)
    if (positions) {
      query['positions'] = { $gte: Number(positions) };
    }

    // New normalized industry filters
    if (subIndustryCode) {
      query['subIndustryCode'] = subIndustryCode;
    }
    if (industryCode) {
      if (includeDescendants !== 'false') {
        // Use industryPath array contains to include children
        query['industryPath'] = { $in: [industryCode] };
      } else {
        query['industryCode'] = industryCode;
      }
    }
    if (!subIndustryCode && !industryCode && industry) {
      // Backward-compatibility: legacy string filter
      query['industry'] = { $regex: industry, $options: 'i' };
    }
    if (category) {
      query['category'] = { $regex: category, $options: 'i' };
    }

    // Salary filters
    if (salaryRange) {
      // Handle common salary range patterns
      const rangeMap = {
        'below-10m': { max: 10000000 },
        '10m-20m': { min: 10000000, max: 20000000 },
        '20m-50m': { min: 20000000, max: 50000000 },
        'above-50m': { min: 50000000 },
      };

      // Check if it's a predefined range pattern
      if (rangeMap[salaryRange]) {
        const range = rangeMap[salaryRange];
        if (range.min) {
          query['salaryMin'] = { $gte: range.min };
        }
        if (range.max) {
          query['salaryMax'] = { $lte: range.max };
        }
      } else {
        // Handle numeric range (e.g., "5000000-10000000")
        const [minSalary, maxSalary] = salaryRange
          .split('-')
          .map(s => Number(s.trim()));
        if (minSalary && !isNaN(minSalary)) {
          query['salaryMin'] = { $gte: minSalary };
        }
        if (maxSalary && !isNaN(maxSalary)) {
          query['salaryMax'] = { $lte: maxSalary };
        }
      }
    } else if (salaryMin || salaryMax) {
      // Handle separate min/max filters
      if (salaryMin) {
        query['salaryMin'] = { $gte: Number(salaryMin) };
      }
      if (salaryMax) {
        query['salaryMax'] = { $lte: Number(salaryMax) };
      }
    }
    if (createdFrom || createdTo) {
      query['createdAt'] = {};
      if (createdFrom) query['createdAt'].$gte = new Date(createdFrom);
      if (createdTo) query['createdAt'].$lte = new Date(createdTo);
    }
    if (deadlineFrom || deadlineTo) {
      query['deadline'] = {};
      if (deadlineFrom) query['deadline'].$gte = new Date(deadlineFrom);
      if (deadlineTo) query['deadline'].$lte = new Date(deadlineTo);
    }

    // Urgent jobs filter (deadline within 7 days)
    if (isUrgent === 'true') {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query['deadline'] = {
        $gte: now,
        $lte: sevenDaysLater,
      };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query['tags'] = { $in: tagArray };
    }
    // Xóa các filter undefined
    Object.keys(query).forEach(key => {
      if (
        query[key] === undefined ||
        (typeof query[key] === 'object' && Object.keys(query[key]).length === 0)
      ) {
        delete query[key];
      }
    });

    // Debug logging
    console.log('🔍 Final MongoDB Query:', JSON.stringify(query, null, 2));

    const skip = (page - 1) * limit;

    // Build sort object - ALWAYS sort (default: createdAt desc = newest first)
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'salaryMin',
      'salaryMax',
      'deadline',
      'views',
      'positions',
      'hotScore',
      'stats.applications',
      'stats.interviews',
      'stats.offers',
    ];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt'; // Fallback to createdAt if invalid
    const sortObj = {};
    sortObj[safeSortBy] = sortOrder === 'desc' ? -1 : 1;

    // Add secondary sort by createdAt desc if primary sort is not createdAt
    if (safeSortBy !== 'createdAt') {
      sortObj['createdAt'] = -1; // Always sort by newest as secondary
    }

    const projection = {
      title: 1,
      slug: 1,
      description: 1,
      requirements: 1,
      benefits: 1,
      skills: 1,
      tags: 1,
      aiTags: 1,
      jobType: 1,
      workingMode: 1,
      level: 1,
      salaryMin: 1,
      salaryMax: 1,
      currency: 1,
      experience: 1,
      education: 1,
      deadline: 1,
      positions: 1,
      status: 1,
      views: 1,
      hotScore: 1,
      stats: 1,
      address: 1,
      location: 1,
      industryCode: 1,
      subIndustryCode: 1,
      industryPath: 1,
      skillIds: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    let jobs;
    if (view === 'full') {
      jobs = await Job.find(query)
        .populate(
          'employer',
          'company.name company.logo company.industry company.description company.website company.size company.officeAddress contact.phone contact.email'
        )
        .populate('postedBy', 'fullName name email avatar')
        .populate('skillIds', 'name category')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));
    } else {
      jobs = await Job.find(query)
        .select(projection)
        .populate('employer', 'company.name company.logo')
        .populate('skillIds', 'name category') // Populate skillIds for summary view too
        .sort(sortObj) // ALWAYS sorted (default: newest first by createdAt)
        .skip(skip)
        .limit(parseInt(limit))
        .lean({ virtuals: true });
    }

    const total = await Job.countDocuments(query);

    console.log(`📊 Total matching jobs: ${total}`);

    // Try to get from cache first
    const cacheService = getCacheService();
    let formattedJobs = null;

    if (cacheService) {
      formattedJobs = await cacheService.getCachedJobList({
        ...req.query,
        view,
      });
      if (formattedJobs) {
        console.log('💾 Returning CACHED data, length:', formattedJobs.length);
      }
    }

    // If not in cache, fetch and format
    if (!formattedJobs) {
      console.log('🔄 Cache miss, fetching from DB...');
      console.log(`📦 Query returned ${jobs.length} jobs from MongoDB`);

      if (view === 'full') {
        // Process jobs to populate skillIds and industryPath for old jobs
        const { processJobData } = require('../utils/jobHelpers');
        const jobsToUpdate = [];

        // Process jobs that need skillIds or industryPath populated
        for (const job of jobs) {
          const jobObj = job.toObject ? job.toObject() : job;
          const needsProcessing =
            (Array.isArray(jobObj.skills) &&
              jobObj.skills.length > 0 &&
              (!jobObj.skillIds || jobObj.skillIds.length === 0)) ||
            ((jobObj.industryCode || jobObj.subIndustryCode) &&
              (!jobObj.industryPath || jobObj.industryPath.length === 0));

          if (needsProcessing) {
            try {
              const processedData = await processJobData(jobObj);

              // Update job document in memory for response
              if (processedData.skillIds && processedData.skillIds.length > 0) {
                job.skillIds = processedData.skillIds;
                // Re-populate skillIds for response
                await job.populate('skillIds', 'name category');
              }
              if (
                processedData.industryPath &&
                processedData.industryPath.length > 0
              ) {
                job.industryPath = processedData.industryPath;
              }

              // Mark for database update (async, don't wait)
              jobsToUpdate.push({
                jobId: job._id,
                updates: {
                  ...(processedData.skillIds &&
                  processedData.skillIds.length > 0
                    ? { skillIds: processedData.skillIds }
                    : {}),
                  ...(processedData.industryPath &&
                  processedData.industryPath.length > 0
                    ? { industryPath: processedData.industryPath }
                    : {}),
                },
              });
            } catch (error) {
              logger.error(`Error processing job ${job._id}:`, error);
            }
          }
        }

        // Update database in background (don't block response)
        if (jobsToUpdate.length > 0) {
          Promise.all(
            jobsToUpdate.map(async ({ jobId, updates }) => {
              try {
                if (Object.keys(updates).length > 0) {
                  await Job.findByIdAndUpdate(jobId, updates, { new: false });
                }
              } catch (error) {
                logger.error(`Error updating job ${jobId} in database:`, error);
              }
            })
          ).catch(error => {
            logger.error('Error updating jobs in background:', error);
          });
        }

        formattedJobs = formatJobsResponse(jobs, {
          employerFields: 'full',
        });
      } else {
        formattedJobs = formatMinimalJobsResponse(jobs);
      }

      // Cache the results
      if (cacheService) {
        await cacheService.cacheJobList(
          {
            ...req.query,
            view,
          },
          formattedJobs
        );
      }
    }

    if (
      req.user?.role === 'candidate' &&
      req.user.candidateProfile &&
      Array.isArray(formattedJobs) &&
      formattedJobs.length
    ) {
      const jobIds = formattedJobs
        .map(job => (job?._id ? job._id.toString() : null))
        .filter(Boolean);
      if (jobIds.length > 0) {
        const savedJobs = await SavedJob.find({
          candidateId: req.user.candidateProfile,
          jobId: { $in: jobIds },
        }).select('jobId');
        const savedSet = new Set(savedJobs.map(item => item.jobId.toString()));
        formattedJobs = formattedJobs.map(job => ({
          ...job,
          isSaved: savedSet.has(job._id?.toString()),
        }));
      }
    }

    res.status(200).json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      data: formattedJobs,
      filters: {
        appliedFilters: Object.keys(query).length,
        searchQuery: q || null,
        availableFilters: {
          location: !!req.query.location,
          city: !!req.query.city,
          district: !!req.query.district,
          skills: !!req.query.skills,
          employer: !!req.query.employer,
          status: !!req.query.status,
          jobType: !!req.query.jobType,
          level: !!req.query.level,
          workingMode: !!req.query.workingMode,
          experience: !!req.query.experience,
          education: !!req.query.education,
          positions: !!req.query.positions,
          industry: !!req.query.industry,
          industryCode: !!req.query.industryCode,
          subIndustryCode: !!req.query.subIndustryCode,
          category: !!req.query.category,
          salaryMin: !!req.query.salaryMin,
          salaryMax: !!req.query.salaryMax,
          salaryRange: !!req.query.salaryRange,
          createdFrom: !!req.query.createdFrom,
          createdTo: !!req.query.createdTo,
          deadlineFrom: !!req.query.deadlineFrom,
          deadlineTo: !!req.query.deadlineTo,
          isUrgent: !!req.query.isUrgent,
          tags: !!req.query.tags,
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
    // Try to get from cache first (before querying database)
    const cacheService = getCacheService();
    let jobObj = null;
    let jobDocument = null;

    if (cacheService) {
      jobObj = await cacheService.getCachedJobDetail(req.params.id);
    }

    // If not in cache, fetch from database
    if (!jobObj) {
      const job = await Job.findById(req.params.id)
        .populate({
          path: 'employer',
          select:
            'company.name company.logo company.industry company.description company.website company.size company.officeAddress contact.phone contact.email',
          options: { lean: false },
        })
        .populate('postedBy', 'fullName name email avatar')
        .populate('skillIds', 'name category');

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy công việc',
        });
      }

      // Format job using shared formatter
      jobObj = formatJobResponse(job);
      jobDocument = job;

      // Cache the result
      if (cacheService) {
        await cacheService.cacheJobDetail(req.params.id, jobObj);
      }
    }

    if (jobObj.postedBy) {
      const pb = jobObj.postedBy;
      const computedFullName =
        pb.fullName ||
        pb.name ||
        (pb.profile &&
          `${pb.profile.firstName || ''} ${
            pb.profile.lastName || ''
          }`.trim()) ||
        (pb.googleProfile && pb.googleProfile.name) ||
        pb.email?.split('@')[0] ||
        'Chưa cập nhật';
      jobObj.postedBy = {
        ...pb,
        fullName: computedFullName,
      };
    }

    // Check if current user has applied for this job (if user is authenticated)
    let hasApplied = false;
    let isSaved = false;
    if (req.user && req.user.role === 'candidate') {
      const candidateProfile = await CandidateProfile.findOne({
        userId: req.user.id,
      });
      if (candidateProfile) {
        const jobIdToCheck =
          (jobDocument ? jobDocument._id : jobObj?._id) || req.params.id;
        const [application, savedEntry] = await Promise.all([
          Application.findOne({
            jobId: jobIdToCheck,
            candidateId: candidateProfile._id,
          }),
          SavedJob.findOne({
            jobId: jobIdToCheck,
            candidateId: candidateProfile._id,
          }),
        ]);
        hasApplied = !!application;
        isSaved = !!savedEntry;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...jobObj,
        hasApplied,
        isSaved,
      },
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
    let jobData = req.body;
    // Tìm employer profile theo owner là user đang đăng nhập
    const EmployerProfile = require('../models/EmployerProfile');
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });
    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }
    if (
      !employerProfile.verification?.isVerified &&
      employerProfile.status !== EMPLOYER_PROFILE_STATUS.VERIFIED
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Tài khoản employer chưa xác thực, không thể tạo job mới. Vui lòng hoàn thành xác thực doanh nghiệp.',
      });
    }
    jobData.employer = employerProfile._id;
    jobData.postedBy = req.user.id;
    // Luôn tạo job ở trạng thái 'draft' (bản nháp)
    jobData.status = JOB_STATUS.DRAFT;

    // Process address: build fullAddress if address is structured object
    if (jobData.address && typeof jobData.address === 'object') {
      const addr = jobData.address;
      const addressParts = [
        addr.street,
        addr.ward,
        addr.district,
        addr.city,
        addr.country || 'Vietnam',
      ].filter(Boolean);
      jobData.address.fullAddress = addressParts.join(', ');
      // Set default country if not provided
      if (!jobData.address.country) {
        jobData.address.country = 'Vietnam';
      }
    }

    // Process job data: populate skillIds and industryPath
    jobData = await processJobData(jobData);

    const job = await Job.create(jobData);
    await job.populate('employer', 'name logo industry description');
    await job.populate('postedBy', 'fullName name email avatar');
    await job.populate('skillIds', 'name category');

    // Invalidate job caches when new job is created
    const cacheService = getCacheService();
    if (cacheService) {
      await cacheService.invalidateJobCache();
    }

    res.status(201).json({
      success: true,
      data: job,
      message:
        job.status === JOB_STATUS.OPEN || job.status === JOB_STATUS.ACTIVE
          ? 'Đăng job thành công'
          : 'Tạo job thành công, đang ở trạng thái nháp',
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
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }
    // Chỉ employer tạo job hoặc admin mới được sửa
    if (
      req.user.role !== 'admin' &&
      String(job.postedBy) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Bạn không có quyền sửa job này' });
    }
    let updateData = req.body;
    // Chỉ admin mới được đổi status
    if (updateData.status && req.user.role !== 'admin') {
      delete updateData.status;
    }
    // Ensure status is always a valid JOB_STATUS value if present
    if (updateData.status && req.user.role === 'admin') {
      if (!Object.values(JOB_STATUS).includes(updateData.status)) {
        return res
          .status(400)
          .json({ success: false, message: 'Trạng thái job không hợp lệ' });
      }
    }

    // Process address: build fullAddress if address is structured object
    if (updateData.address && typeof updateData.address === 'object') {
      const addr = updateData.address;
      const addressParts = [
        addr.street,
        addr.ward,
        addr.district,
        addr.city,
        addr.country || 'Vietnam',
      ].filter(Boolean);
      updateData.address.fullAddress = addressParts.join(', ');
      // Set default country if not provided
      if (!updateData.address.country) {
        updateData.address.country = 'Vietnam';
      }
    }

    // Merge with existing job data to process skills and industry
    const mergedData = { ...job.toObject(), ...updateData };
    updateData = await processJobData(mergedData);

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('employer', 'name logo industry description')
      .populate('postedBy', 'fullName name email avatar')
      .populate('skillIds', 'name category');

    // Invalidate job caches when job is updated
    const cacheService = getCacheService();
    if (cacheService) {
      await cacheService.invalidateJobCache(req.params.id);
    }

    res.status(200).json({ success: true, data: updatedJob });
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
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }
    // Nếu job đã bị xóa rồi thì không cho xóa lại nữa
    if (job.status === JOB_STATUS.DELETED) {
      return res
        .status(400)
        .json({ success: false, message: 'Công việc đã bị xóa trước đó' });
    }
    // Chỉ admin, người đăng job, chủ employer, hoặc thành viên có quyền mới được xóa
    let canDelete = false;
    if (req.user.role === 'admin') {
      canDelete = true;
    } else if (String(job.postedBy) === String(req.user.id)) {
      canDelete = true;
    } else {
      // Kiểm tra chủ employer hoặc thành viên có quyền
      const EmployerProfile = require('../models/EmployerProfile');
      const employerProfile = await EmployerProfile.findById(job.employer);
      if (employerProfile) {
        if (String(employerProfile.owner) === String(req.user.id)) {
          canDelete = true;
        } else if (Array.isArray(employerProfile.members)) {
          const member = employerProfile.members.find(
            m =>
              String(m.user) === String(req.user.id) &&
              m.permissions?.canPostJobs
          );
          if (member) {
            canDelete = true;
          }
        }
      }
    }
    if (!canDelete) {
      return res
        .status(403)
        .json({ success: false, message: 'Bạn không có quyền xóa job này' });
    }
    // Soft delete: chuyển trạng thái sang DELETED với metadata
    job.status = JOB_STATUS.DELETED;
    job.deletedAt = new Date();
    job.deletedBy = req.user.id;
    await job.save();

    // Invalidate job caches when job is deleted
    const cacheService = getCacheService();
    if (cacheService) {
      await cacheService.invalidateJobCache(req.params.id);
    }

    res
      .status(200)
      .json({ success: true, message: 'Đã xóa công việc thành công' });
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
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }
    // Chỉ cho ứng tuyển khi job open
    if (job.status !== JOB_STATUS.OPEN && job.status !== JOB_STATUS.ACTIVE) {
      return res
        .status(400)
        .json({ success: false, message: 'Công việc chưa được mở ứng tuyển' });
    }
    // Resolve candidate profile and check existing application
    const candidateProfile = await CandidateProfile.findOne({
      userId: req.user.id,
    });
    if (!candidateProfile) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần hoàn thiện hồ sơ ứng viên trước khi ứng tuyển',
      });
    }
    const existingApplication = await Application.findOne({
      jobId: id,
      candidateId: candidateProfile._id,
    });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã ứng tuyển cho công việc này',
      });
    }
    // Check application deadline
    if (job.deadline && new Date() > job.deadline) {
      return res
        .status(400)
        .json({ success: false, message: 'Đã hết hạn ứng tuyển' });
    }
    // Determine resume url: prefer provided, otherwise current resume in profile
    let finalResumeUrl = resumeUrl;
    if (!finalResumeUrl) {
      finalResumeUrl = candidateProfile?.resume?.current?.url || null;
    }

    const application = await Application.create({
      jobId: id,
      candidateId: candidateProfile._id,
      coverLetter,
      attachments: portfolioUrl
        ? [{ name: 'portfolio', url: portfolioUrl, type: 'link' }]
        : [],
      resume: finalResumeUrl
        ? { url: finalResumeUrl, uploadedAt: new Date() }
        : undefined,
      status: APPLICATION_STATUS.PENDING,
    });
    // Update job stats
    await Job.findByIdAndUpdate(id, { $inc: { 'stats.applications': 1 } });

    // Notify employer về application mới
    try {
      const NotificationService = require('../services/notification/notificationService');
      const EmployerProfile = require('../models/EmployerProfile');
      const User = require('../models/User');

      const employerProfile = await EmployerProfile.findById(job.employer);
      if (employerProfile && employerProfile.owner) {
        const employerUser = await User.findById(employerProfile.owner);
        if (employerUser) {
          await NotificationService.notifyNewApplication(
            employerUser._id.toString(),
            application._id.toString(),
            job._id.toString(),
            req.user.fullName || req.user.email || 'Ứng viên',
            req.user.id.toString() // Lưu candidateId
          );
          logger.info('Notification sent to employer for new application', {
            employerId: employerUser._id,
            applicationId: application._id,
          });
        }
      }
    } catch (notifyError) {
      logger.error('Failed to send notification to employer:', {
        error: notifyError.message,
        applicationId: application._id,
      });
    }

    // Notify candidate về application thành công
    try {
      const NotificationService = require('../services/notification/notificationService');
      await NotificationService.notifyApplicationStatusChange(
        req.user.id.toString(),
        application._id.toString(),
        job._id.toString(),
        job.title,
        'pending'
      );
      logger.info('Notification sent to candidate for successful application', {
        candidateId: req.user.id,
        applicationId: application._id,
      });
    } catch (candidateNotifyError) {
      logger.error('Failed to send notification to candidate:', {
        error: candidateNotifyError.message,
        candidateId: req.user.id,
      });
    }

    res.status(201).json({ success: true, data: application });
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
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }
    // Chỉ employer của job hoặc admin mới được xem
    if (
      req.user.role !== 'admin' &&
      String(job.postedBy) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem danh sách ứng viên của job này',
      });
    }
    const query = { jobId: id };
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const applications = await Application.find(query)
      .populate({
        path: 'candidateId',
        select: 'userId resume education skills',
        populate: { path: 'userId', select: 'fullName email avatar' },
      })
      .populate('jobId', 'title employer')
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

    const job = await Job.findOne({ slug, status: JOB_STATUS.OPEN })
      .populate({
        path: 'employer',
        select:
          'company.name company.logo company.industry company.description company.website company.size company.officeAddress contact.phone contact.email',
        options: { lean: false },
      })
      .populate('postedBy', 'fullName name email avatar')
      .populate('skillIds', 'name category');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    // Format job using shared formatter
    const formattedJob = formatJobResponse(job);

    res.status(200).json({
      success: true,
      data: formattedJob,
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
      { $inc: { views: 1 } },
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
// @query   limit - Number of jobs to return (default: 10)
// @query   category - Filter by category (optional)
// @query   sortBy - Sort field: 'createdAt' (default) or 'updatedAt'
// @note    "Recent" jobs are sorted by createdAt (job creation date) by default
//          This shows the newest posted jobs first
const getRecentJobs = async (req, res) => {
  try {
    const { limit = 10, category, sortBy = 'createdAt' } = req.query;

    const query = { status: JOB_STATUS.OPEN };

    // Apply category filter if provided
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const total = await Job.countDocuments(query);

    // Determine sort field (default: createdAt for "recently posted")
    const sortField = sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt';

    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        select:
          'company.name company.logo company.industry company.description company.website company.size company.officeAddress contact.phone contact.email',
        options: { lean: false },
      })
      .populate('postedBy', 'fullName name email avatar')
      .populate('skillIds', 'name category')
      .sort({ [sortField]: -1 }) // Sort by creation date (newest first) or updatedAt
      .limit(parseInt(limit));

    // Try to get from cache first
    const cacheService = getCacheService();
    let formattedJobs = null;

    if (cacheService) {
      formattedJobs = await cacheService.getCachedJobList({
        ...req.query,
        sortBy: sortField,
      });
    }

    // If not in cache, fetch and format
    if (!formattedJobs) {
      formattedJobs = formatMinimalJobsResponse(jobs);

      // Cache the results
      if (cacheService) {
        await cacheService.cacheJobList(
          { ...req.query, sortBy: sortField },
          formattedJobs
        );
      }
    }

    res.status(200).json({
      success: true,
      data: formattedJobs,
      total,
      limit: parseInt(limit),
      sortBy: sortField,
      message: `Tìm thấy ${total} công việc gần đây (sắp xếp theo ${
        sortField === 'createdAt' ? 'ngày đăng' : 'ngày cập nhật'
      })`,
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

    const job = await Job.findById(id).populate({
      path: 'employer',
      select:
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress contact.phone contact.email',
      options: { lean: false },
    });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    // Format job using shared formatter
    const formattedJob = formatJobResponse(job);

    res.status(200).json({
      success: true,
      data: {
        company: formattedJob.employer,
        jobTitle: formattedJob.title,
        jobId: formattedJob._id,
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
      views: job.views || 0,
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

// @desc    Get all jobs posted by current employer (including drafts)
// @route   GET /api/jobs/employer
// @access  Private (Employer only)
const getEmployerJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Tìm employer profile của user hiện tại
    const EmployerProfile = require('../models/EmployerProfile');
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });

    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }

    const query = { employer: employerProfile._id };

    // Filter theo status nếu có
    if (status) {
      query.status = status;
    } else {
      // Mặc định loại trừ jobs đã deleted, trừ khi explicitly request
      if (req.query.includeDeleted !== 'true') {
        query.status = { $ne: JOB_STATUS.DELETED };
      }
    }

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        select:
          'company.name company.logo company.industry company.description company.website company.size company.officeAddress contact.phone contact.email',
        // Ensure populate works even if some fields are missing
        options: { lean: false },
      })
      .populate('postedBy', 'fullName name email avatar')
      .populate('skillIds', 'name category')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    // Thống kê theo status
    const statusMatchQuery = { employer: employerProfile._id };
    // Chỉ count deleted jobs nếu explicitly request
    if (req.query.includeDeleted !== 'true') {
      statusMatchQuery.status = { $ne: JOB_STATUS.DELETED };
    }

    const statusCounts = await Job.aggregate([
      { $match: statusMatchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusStats = {};
    statusCounts.forEach(item => {
      statusStats[item._id] = item.count;
    });

    // Format jobs using shared formatter
    const formattedJobs = formatJobsResponse(jobs);

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1,
      },
      statistics: {
        total,
        byStatus: statusStats,
      },
    });
  } catch (error) {
    logger.error('Error getting employer jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách job của employer',
    });
  }
};

// @desc    Get draft jobs by current employer
// @route   GET /api/jobs/drafts
// @access  Private (Employer only)
const getDraftJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = req.query;

    // Tìm employer profile của user hiện tại
    const EmployerProfile = require('../models/EmployerProfile');
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });

    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }

    const query = {
      employer: employerProfile._id,
      status: JOB_STATUS.DRAFT,
    };

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        select:
          'company.name company.logo company.industry company.description company.website company.size company.officeAddress contact.phone contact.email',
        options: { lean: false },
      })
      .populate('postedBy', 'fullName name email avatar')
      .populate('skillIds', 'name category')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    // Format jobs using shared formatter
    const formattedJobs = formatJobsResponse(jobs);

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      message: `Tìm thấy ${total} job nháp`,
    });
  } catch (error) {
    logger.error('Error getting draft jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách job nháp',
    });
  }
};

// @desc    Bulk create multiple jobs
// @route   POST /api/jobs/bulk
// @access  Private (Employer)
// @body    { jobs: Array<JobData> } - Array of job data objects
const bulkCreateJobs = async (req, res) => {
  try {
    const { jobs } = req.body;

    // Validate input
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mảng jobs là bắt buộc và không được rỗng',
      });
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 50;
    if (jobs.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể tạo tối đa ${MAX_BATCH_SIZE} jobs mỗi lần`,
      });
    }

    // Find employer profile
    const EmployerProfile = require('../models/EmployerProfile');
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });

    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }

    if (
      !employerProfile.verification?.isVerified &&
      employerProfile.status !== EMPLOYER_PROFILE_STATUS.VERIFIED
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Tài khoản employer chưa xác thực, không thể tạo job mới. Vui lòng hoàn thành xác thực doanh nghiệp.',
      });
    }

    const results = {
      created: [],
      failed: [],
      total: jobs.length,
    };

    // Process each job
    for (let i = 0; i < jobs.length; i++) {
      const jobData = jobs[i];
      try {
        // Validate required fields
        if (!jobData.title || !jobData.description) {
          results.failed.push({
            index: i,
            title: jobData.title || 'N/A',
            error: 'Title và description là bắt buộc',
          });
          continue;
        }

        // Set common fields
        const processedJobData = {
          ...jobData,
          employer: employerProfile._id,
          postedBy: req.user.id,
          status: JOB_STATUS.DRAFT, // Always create as draft
        };

        // Process deadline: convert string to Date if needed
        if (
          processedJobData.deadline &&
          typeof processedJobData.deadline === 'string'
        ) {
          processedJobData.deadline = new Date(processedJobData.deadline);
        }

        // Process address: build fullAddress if address is structured object
        if (
          processedJobData.address &&
          typeof processedJobData.address === 'object'
        ) {
          const addr = processedJobData.address;
          const addressParts = [
            addr.street,
            addr.ward,
            addr.district,
            addr.city,
            addr.country || 'Vietnam',
          ].filter(Boolean);
          processedJobData.address.fullAddress = addressParts.join(', ');
          if (!processedJobData.address.country) {
            processedJobData.address.country = 'Vietnam';
          }
        }

        // Process job data: populate skillIds and industryPath
        const finalJobData = await processJobData(processedJobData);

        // Create job
        const job = await Job.create(finalJobData);
        await job.populate('employer', 'name logo industry description');
        await job.populate('postedBy', 'fullName name email avatar');
        await job.populate('skillIds', 'name category');

        results.created.push({
          index: i,
          id: job._id,
          title: job.title,
          status: job.status,
        });
      } catch (error) {
        logger.error(`Error creating job at index ${i}:`, {
          error: error.message,
          jobData: jobData.title || 'N/A',
        });
        results.failed.push({
          index: i,
          title: jobData.title || 'N/A',
          error: error.message || 'Lỗi không xác định',
        });
      }
    }

    // Invalidate job caches
    const cacheService = getCacheService();
    if (cacheService && results.created.length > 0) {
      await cacheService.invalidateJobCache();
    }

    // Log result
    logger.info(
      `Bulk create jobs: ${results.created.length} created, ${results.failed.length} failed`,
      {
        userId: req.user.id,
        employerId: employerProfile._id,
      }
    );

    // Return response
    const allSucceeded = results.failed.length === 0;
    const allFailed = results.created.length === 0;

    res.status(allSucceeded ? 201 : allFailed ? 400 : 207).json({
      success: !allFailed,
      data: results,
      message: allSucceeded
        ? `Đã tạo thành công ${results.created.length} jobs`
        : allFailed
        ? `Không thể tạo job nào (${results.failed.length} lỗi)`
        : `Đã tạo ${results.created.length}/${results.total} jobs thành công`,
    });
  } catch (error) {
    logger.error('Error in bulk create jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo jobs',
      error: error.message,
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
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }

    if (job.status !== JOB_STATUS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gửi duyệt job ở trạng thái nháp',
      });
    }
    job.status = JOB_STATUS.PENDING;
    await job.save();
    res.status(200).json({
      success: true,
      data: job,
      message: 'Đã gửi duyệt. Vui lòng chờ admin phê duyệt',
    });
  } catch (error) {
    logger.error('Error submitting job for review:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi duyệt job' });
  }
};

module.exports = {
  getAllJobs,
  getJob,
  createJob,
  bulkCreateJobs,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  getJobBySlug,
  incrementJobViews,
  getJobCompany,
  getJobStats,
  getRecentJobs,
  submitJobForReview,
  getEmployerJobs,
  getDraftJobs,
};
