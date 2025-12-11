const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const aiService = require('../services/ai/aiService');
const { logger } = require('../utils/logger');
const asyncHandler = require('express-async-handler');
const { AppError } = require('../utils/errors');

// @desc    Get all applications for a user
// @route   GET /api/applications
// @access  Private (Candidate)
const getUserApplications = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { jobseekerId: req.user.id };
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate('jobId', 'title companyId location salary')
      .populate('jobId.companyId', 'name logo industry')
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
    logger.error('Error getting user applications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn ứng tuyển',
    });
  }
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (Candidate/Employer)
const getApplication = asyncHandler(async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId', 'title companyId location salary requirements')
      .populate('jobId.companyId', 'name logo industry')
      .populate('jobseekerId', 'firstName lastName email avatar');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển',
      });
    }

    // Check if user has permission to view this application
    const isOwner = application.jobseekerId._id.toString() === req.user.id;
    const isEmployer =
      req.user.role === 'employer' &&
      application.jobId.companyId._id.toString() ===
        req.user.companyId.toString();

    if (!isOwner && !isEmployer) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem đơn ứng tuyển này',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error getting application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đơn ứng tuyển',
    });
  }
});

// @desc    Create new application
// @route   POST /api/applications
// @access  Private (Candidate)
const createApplication = asyncHandler(async (req, res) => {
  try {
    const { jobId, coverLetter, resumeUrl, portfolioUrl } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
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
      job.applicationSettings?.deadline &&
      new Date() > job.applicationSettings.deadline
    ) {
      return res.status(400).json({
        success: false,
        message: 'Đã hết hạn ứng tuyển',
      });
    }

    const application = await Application.create({
      jobId,
      jobseekerId: req.user.id,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      status: 'pending',
    });

    await application.populate('jobId', 'title companyId');
    await application.populate('jobId.companyId', 'name logo');

    // Auto-calculate matching score in background (don't block response)
    setImmediate(async () => {
      try {
        logger.info(
          `📊 Auto-calculating matching score for application ${application._id}`
        );

        // Get candidate profile
        const candidateProfile = await CandidateProfile.findOne({
          userId: req.user.id,
        }).lean();

        if (!candidateProfile) {
          logger.warn(`No candidate profile found for user ${req.user.id}`);
          return;
        }

        // Convert profile to cvData format
        const cvData = {
          skills: [],
          experience: [],
          education: [],
          currentLevel: 'beginner',
        };

        // Extract technical skills
        if (
          candidateProfile.skills?.technical &&
          Array.isArray(candidateProfile.skills.technical)
        ) {
          cvData.skills.push(
            ...candidateProfile.skills.technical.map(skill => ({
              name: skill.name || skill,
              level: skill.level || 'beginner',
            }))
          );
        }

        // Extract soft skills
        if (
          candidateProfile.skills?.soft &&
          Array.isArray(candidateProfile.skills.soft)
        ) {
          cvData.skills.push(
            ...candidateProfile.skills.soft.map(skill => ({
              name: skill.name || skill,
              level: skill.level || 'beginner',
            }))
          );
        }

        // Extract experience
        if (
          candidateProfile.experience?.internships &&
          Array.isArray(candidateProfile.experience.internships)
        ) {
          cvData.experience.push(
            ...candidateProfile.experience.internships.map(exp => ({
              position: exp.position || '',
              company: exp.company || '',
              startDate: exp.startDate || null,
              endDate: exp.endDate || null,
              description: exp.description || '',
            }))
          );
        }

        // Extract education
        if (
          candidateProfile.education?.university &&
          candidateProfile.education.university.name
        ) {
          cvData.education.push({
            degree: candidateProfile.education.university.degree,
            major:
              candidateProfile.education.university.major ||
              candidateProfile.education.university.field,
            school: candidateProfile.education.university.name,
            graduationYear:
              candidateProfile.education.university.graduationYear,
          });
        }

        // Calculate experience level
        if (cvData.experience.length > 0) {
          const totalYears = cvData.experience.reduce((total, exp) => {
            // Validate dates
            if (
              !exp.startDate ||
              exp.startDate === 'undefined' ||
              exp.startDate === 'null'
            ) {
              return total;
            }

            const start = new Date(exp.startDate);
            if (isNaN(start.getTime())) {
              return total;
            }

            // Handle endDate - if null/undefined, use current date
            let end;
            if (
              !exp.endDate ||
              exp.endDate === 'undefined' ||
              exp.endDate === 'null' ||
              exp.endDate === null
            ) {
              end = new Date();
            } else {
              end = new Date(exp.endDate);
              if (isNaN(end.getTime())) {
                end = new Date();
              }
            }

            // Sanity checks
            const now = new Date();
            if (start > now || end < start) {
              return total;
            }

            const years = (end - start) / (1000 * 60 * 60 * 24 * 365);

            // Cap at 50 years to prevent data errors
            if (years > 50) {
              return total + 50;
            }

            return total + Math.max(0, years);
          }, 0);

          if (totalYears >= 5) cvData.currentLevel = 'expert';
          else if (totalYears >= 3) cvData.currentLevel = 'advanced';
          else if (totalYears >= 1) cvData.currentLevel = 'intermediate';
          else cvData.currentLevel = 'beginner';
        }

        // Calculate matching score
        await aiService.calculateAdvancedMatchScore(cvData, job, {
          candidateId: req.user.id,
          jobId: jobId,
          saveToDatabase: true,
        });

        logger.info(
          `✅ Matching score calculated for application ${application._id}`
        );
      } catch (scoringError) {
        logger.error('Error calculating matching score:', scoringError);
        // Don't throw - scoring failure shouldn't affect application creation
      }
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn ứng tuyển',
    });
  }
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private (Candidate)
const updateApplication = asyncHandler(async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển',
      });
    }

    // Check ownership
    if (application.jobseekerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa đơn ứng tuyển này',
      });
    }

    // Only allow updates if status is pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Không thể chỉnh sửa đơn ứng tuyển đã được xử lý',
      });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('jobId', 'title companyId');

    res.status(200).json({
      success: true,
      data: updatedApplication,
    });
  } catch (error) {
    logger.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật đơn ứng tuyển',
    });
  }
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private (Candidate)
const deleteApplication = asyncHandler(async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển',
      });
    }

    // Check ownership
    if (application.jobseekerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa đơn ứng tuyển này',
      });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa đơn ứng tuyển thành công',
    });
  } catch (error) {
    logger.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa đơn ứng tuyển',
    });
  }
});

// @desc    Update application status (for employers)
// @route   PUT /api/applications/:id/status
// @access  Private (Employer)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển',
      });
    }

    // Check if user is employer of the job
    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    // Check if user is the owner of the job (postedBy) or admin
    const isAdmin = req.user.role === 'admin';
    const isJobOwner = job.postedBy && job.postedBy.toString() === req.user.id;

    // Also check if user is owner of the employer profile
    let isEmployerOwner = false;
    if (job.employer) {
      const EmployerProfile = require('../models/EmployerProfile');
      const employerProfile = await EmployerProfile.findById(job.employer);
      if (
        employerProfile &&
        employerProfile.owner &&
        employerProfile.owner.toString() === req.user.id
      ) {
        isEmployerOwner = true;
      }
    }

    if (!isAdmin && !isJobOwner && !isEmployerOwner) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật trạng thái đơn ứng tuyển này',
      });
    }

    const oldStatus = application.status;
    application.status = status;
    if (feedback) application.feedback = feedback;
    await application.save();

    await application.populate('candidateId', 'userId');
    await application.populate('jobId', 'title');

    // Notify candidate về status change
    if (
      oldStatus !== status &&
      application.candidateId &&
      application.candidateId.userId
    ) {
      try {
        const NotificationService = require('../services/notification/notificationService');
        await NotificationService.notifyApplicationStatusChange(
          application.candidateId.userId.toString(),
          application._id.toString(),
          application.jobId._id.toString(),
          application.jobId.title || 'Công việc',
          status
        );
      } catch (notifyError) {
        logger.error(
          'Failed to send application status change notification:',
          notifyError
        );
        // Không fail request nếu notification fail
      }
    }

    // *** NEW: Auto collect job matching training data when status changes to final outcome ***
    if (
      oldStatus !== status &&
      ['hired', 'rejected', 'interviewed', 'shortlisted'].includes(status)
    ) {
      try {
        const TrainingData = require('../models/TrainingData');
        const CandidateProfile = require('../models/CandidateProfile');
        const Job = require('../models/Job');

        // Get full application data with populated fields
        await application.populate('candidateId');
        await application.populate('jobId');

        const candidateProfile = await CandidateProfile.findById(
          application.candidateId
        );
        const job = await Job.findById(application.jobId);

        if (candidateProfile && job) {
          // Collect job matching training data
          const trainingData = {
            type: 'job_matching',
            input: {
              cv: {
                skills: candidateProfile.skills?.technical || [],
                experience: candidateProfile.experience?.internships || [],
                education: candidateProfile.education?.university || {},
              },
              job: {
                title: job.title || '',
                description: job.description || '',
                requirements: job.requirements?.skills || [],
                skills: job.requiredSkills || [],
              },
            },
            output: {
              predictedScore: application.matchingScore?.overall || 0,
              actualOutcome: status,
              outcomeMapping:
                {
                  hired: 1.0,
                  shortlisted: 0.8,
                  interviewed: 0.6,
                  rejected: 0.2,
                }[status] || 0.5,
            },
            metadata: {
              source: 'system_generated',
              timestamp: new Date(),
              quality: 1.0, // High quality (real outcomes)
              verified: true,
              cvId: candidateProfile._id,
              jobId: job._id,
            },
          };

          // Save to training data (async, don't block response)
          TrainingData.create(trainingData).catch(err => {
            logger.warn(
              'Failed to save job matching training data:',
              err.message
            );
          });
          logger.info('📊 Job matching training data collected', {
            applicationId: application._id,
            status,
            matchScore: application.matchingScore?.overall,
          });
        }
      } catch (dataCollectionError) {
        logger.warn(
          'Error collecting job matching training data:',
          dataCollectionError.message
        );
        // Don't fail the request if data collection fails
      }
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn ứng tuyển',
    });
  }
});

// @desc    Get applications for employer's jobs
// @route   GET /api/applications/employer
// @access  Private (Employer)
const getEmployerApplications = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status, jobId } = req.query;
    const skip = (page - 1) * limit;

    // Get all jobs for this employer
    const jobs = await Job.find({ companyId: req.user.companyId });
    const jobIds = jobs.map(job => job._id);

    const query = { jobId: { $in: jobIds } };
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    const applications = await Application.find(query)
      .populate('jobId', 'title companyId')
      .populate('jobseekerId', 'firstName lastName email avatar')
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
    logger.error('Error getting employer applications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn ứng tuyển',
    });
  }
});

// @desc    View applicant resume (employer/admin) for a specific application
// @route   GET /api/jobs/applications/:applicationId/resume
// @route   GET /api/jobs/:id/applications/:applicationId/resume (legacy)
// @access  Private (Employer/Admin)
const viewApplicationResume = asyncHandler(async (req, res) => {
  const { id: jobIdParam, applicationId } = req.params;

  const application = await Application.findById(applicationId).populate(
    'jobId',
    'postedBy employer companyId'
  );

  if (!application) {
    throw new AppError('Không tìm thấy đơn ứng tuyển', 404);
  }

  // Validate job match if jobId is provided in path (legacy)
  if (
    jobIdParam &&
    (!application.jobId || application.jobId._id.toString() !== jobIdParam)
  ) {
    throw new AppError('Đơn ứng tuyển không thuộc công việc này', 400);
  }

  // Permission check: admin or owner of the job
  const isAdmin = req.user?.role === 'admin';
  const isOwner =
    application.jobId?.postedBy &&
    application.jobId.postedBy.toString() === req.user.id;

  if (!isAdmin && !isOwner) {
    throw new AppError('Bạn không có quyền xem CV ứng viên này', 403);
  }

  // Find candidate profile
  const candidateProfile =
    (application.candidateId &&
      (await CandidateProfile.findById(application.candidateId))) ||
    (application.jobseekerId &&
      (await CandidateProfile.findOne({ userId: application.jobseekerId })));

  const resume = candidateProfile?.resume?.current;
  if (!resume || (!resume.url && !resume.publicId)) {
    throw new AppError('Ứng viên chưa cập nhật CV', 404);
  }

  // Build accessible URL (follow ResumeController logic)
  let accessibleUrl = null;
  if (resume.url) {
    accessibleUrl = resume.url.replace('http://', 'https://');
    if (
      accessibleUrl.includes('/image/upload/') &&
      (accessibleUrl.includes('.pdf') || resume.mimeType === 'application/pdf')
    ) {
      accessibleUrl = accessibleUrl.replace('/image/upload/', '/raw/upload/');
    }
  } else if (resume.publicId) {
    try {
      const { cloudinary } = require('../utils/cloudinary');
      accessibleUrl = cloudinary.url(resume.publicId, {
        resource_type: 'raw',
        secure: true,
      });
    } catch (err) {
      logger.error('Failed to generate CV URL from publicId', {
        error: err.message,
        publicId: resume.publicId,
      });
    }
  }

  if (!accessibleUrl) {
    throw new AppError('Không lấy được URL CV', 404);
  }

  // Fetch and stream with proper headers
  let response;
  try {
    response = await fetch(accessibleUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
  } catch (fetchErr) {
    logger.error('Failed to fetch CV', { error: fetchErr.message });
    throw new AppError('Không thể tải CV', 502);
  }

  if (!response.ok) {
    logger.error('CV URL returned error', {
      status: response.status,
      statusText: response.statusText,
      url: accessibleUrl,
    });
    throw new AppError('Không thể tải CV', 502);
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  const contentType = resume.mimeType || 'application/pdf';
  const filename = resume.displayName || resume.filename || 'resume.pdf';
  const encodedFilename = encodeURIComponent(filename);

  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="resume.pdf"; filename*=UTF-8''${encodedFilename}`
  );
  res.send(fileBuffer);
});

// @desc    Schedule an interview (Employer)
// @route   POST /api/applications/:id/interviews
// @access  Private (Employer)
const scheduleInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, duration, type, location, interviewerId, note, metadata } = req.body;

  if (!scheduledAt) {
    throw new AppError('scheduledAt is required', 400);
  }

  const application = await Application.findById(id).populate('jobId', 'postedBy');
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (!application.jobId || String(application.jobId.postedBy) !== String(req.user.id)) {
    throw new AppError('Bạn không có quyền đặt lịch phỏng vấn cho ứng viên này', 403);
  }

  const interview = {
    scheduledAt: new Date(scheduledAt),
    duration,
    type,
    location,
    interviewer: interviewerId,
    note,
    metadata,
  };

  await application.scheduleInterview(interview);

  res.status(200).json({
    success: true,
    message: 'Đã đặt lịch phỏng vấn',
    data: application,
  });
});

// @desc    Update an interview (Employer)
// @route   PUT /api/applications/:id/interviews/:interviewId
// @access  Private (Employer)
const updateInterview = asyncHandler(async (req, res) => {
  const { id, interviewId } = req.params;
  const { scheduledAt, duration, type, location, interviewerId, note, metadata } = req.body;

  const application = await Application.findById(id).populate('jobId', 'postedBy');
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (!application.jobId || String(application.jobId.postedBy) !== String(req.user.id)) {
    throw new AppError('Bạn không có quyền cập nhật lịch phỏng vấn này', 403);
  }

  const interview = application.interviews.id(interviewId);
  if (!interview) {
    throw new AppError('Interview not found', 404);
  }

  if (scheduledAt) interview.scheduledAt = new Date(scheduledAt);
  if (duration !== undefined) interview.duration = duration;
  if (type) interview.type = type;
  if (location) interview.location = location;
  if (interviewerId) interview.interviewer = interviewerId;
  if (note !== undefined) interview.note = note;
  if (metadata !== undefined) interview.metadata = metadata;

  application.timeline.push({
    status: 'interview',
    note: 'Cập nhật lịch phỏng vấn',
    createdBy: req.user.id,
  });

  await application.save();

  res.status(200).json({
    success: true,
    message: 'Đã cập nhật lịch phỏng vấn',
    data: application,
  });
});

// @desc    Cancel an interview (Employer)
// @route   DELETE /api/applications/:id/interviews/:interviewId
// @access  Private (Employer)
const cancelInterview = asyncHandler(async (req, res) => {
  const { id, interviewId } = req.params;

  const application = await Application.findById(id).populate('jobId', 'postedBy');
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (!application.jobId || String(application.jobId.postedBy) !== String(req.user.id)) {
    throw new AppError('Bạn không có quyền hủy lịch phỏng vấn này', 403);
  }

  const interview = application.interviews.id(interviewId);
  if (!interview) {
    throw new AppError('Interview not found', 404);
  }

  interview.remove();

  application.timeline.push({
    status: 'interview',
    note: 'Hủy lịch phỏng vấn',
    createdBy: req.user.id,
  });

  await application.save();

  res.status(200).json({
    success: true,
    message: 'Đã hủy lịch phỏng vấn',
    data: application,
  });
});

// @desc    Get employer interviews (upcoming)
// @route   GET /api/applications/interviews/employer
// @access  Private (Employer)
const getEmployerInterviews = asyncHandler(async (req, res) => {
  const { from, to, limit = 20 } = req.query;
  const fromDate = from ? new Date(from) : new Date();
  const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Get jobs posted by this employer
  const jobs = await Job.find({ postedBy: req.user.id }).select('_id title');
  const jobIds = jobs.map(j => j._id);
  if (jobIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const interviews = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $unwind: '$interviews' },
    {
      $match: {
        'interviews.scheduledAt': { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: '$job' },
    {
      $lookup: {
        from: 'candidateprofiles',
        localField: 'candidateId',
        foreignField: '_id',
        as: 'candidateProfile',
      },
    },
    { $unwind: { path: '$candidateProfile', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'candidateProfile.userId',
        foreignField: '_id',
        as: 'candidateUser',
      },
    },
    { $unwind: { path: '$candidateUser', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        applicationId: '$_id',
        interviewId: '$interviews._id',
        scheduledAt: '$interviews.scheduledAt',
        type: '$interviews.type',
        location: '$interviews.location',
        note: '$interviews.note',
        metadata: '$interviews.metadata',
        jobId: '$job._id',
        jobTitle: '$job.title',
        candidateName: {
          $ifNull: [
            '$candidateUser.fullName',
            '$candidateUser.displayFullName',
          ],
        },
        candidateEmail: '$candidateUser.email',
      },
    },
    { $sort: { scheduledAt: 1 } },
    { $limit: Number(limit) },
  ]);

  res.json({ success: true, data: interviews });
});

module.exports = {
  getUserApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
  getEmployerApplications,
  viewApplicationResume,
  scheduleInterview,
  updateInterview,
  cancelInterview,
  getEmployerInterviews,
};
