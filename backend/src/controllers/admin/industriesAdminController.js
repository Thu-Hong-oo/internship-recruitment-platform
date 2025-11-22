const Industry = require('../../models/Industry');
const Job = require('../../models/Job');
const CandidateProfile = require('../../models/CandidateProfile');
const { logger } = require('../../utils/logger');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');
const { getCacheService } = require('../../config/initializeServices');
const asyncHandler = require('express-async-handler');

// ============================================
// INDUSTRY MANAGEMENT CRUD
// ============================================

/**
 * @desc    Get all industries with filters
 * @route   GET /api/admin/industries
 * @access  Private/Admin
 */
exports.getAllIndustries = asyncHandler(async (req, res) => {
  const { q, parent, includeStats = 'false' } = req.query;

  // Try to get from cache first (only for simple queries without search/stats)
  const cacheService = getCacheService();
  let industries = null;
  const cacheKey = !q && !parent && includeStats === 'false'
    ? 'industries:list:all'
    : null;
  
  if (cacheService && cacheKey) {
    industries = await cacheService.getCachedIndustriesList();
  }

  // If not in cache, fetch from database
  if (!industries) {
    const filter = {};
    if (parent) filter.parentCode = parent === 'root' ? null : parent;
    if (q) filter.$text = { $search: q };

    industries = await Industry.find(filter)
      .sort({ sortOrder: 1, 'name.vi': 1 })
      .lean();

  // Optionally include real-time stats
  if (includeStats === 'true') {
    industries = await Promise.all(
      industries.map(async industry => {
        const [jobCount, candidateCount] = await Promise.all([
          Job.countDocuments({ industryCode: industry.code }),
          CandidateProfile.countDocuments({ 'personalInfo.industry': industry.code }),
        ]);

        return {
          ...industry,
          liveStats: {
            jobCount,
            candidateCount,
          },
        };
      })
    );
  }

    // Cache the results (only for simple queries)
    if (cacheService && cacheKey) {
      await cacheService.cacheIndustriesList(industries);
    }
  }

  return ApiResponse.success(res, { industries });
});

/**
 * @desc    Get industry hierarchy tree
 * @route   GET /api/admin/industries/hierarchy
 * @access  Private/Admin
 */
exports.getIndustryHierarchy = asyncHandler(async (req, res) => {
  // Try to get from cache first
  const cacheService = getCacheService();
  let hierarchy = null;
  
  if (cacheService) {
    hierarchy = await cacheService.get('industries:hierarchy:tree');
  }

  // If not in cache, fetch from database
  if (!hierarchy) {
    const industries = await Industry.find().sort({ sortOrder: 1 }).lean();

    // Build tree structure
    const industryMap = new Map();
    const rootIndustries = [];

  // First pass: create map
  industries.forEach(industry => {
    industryMap.set(industry.code, {
      ...industry,
      children: [],
    });
  });

  // Second pass: build tree
  industries.forEach(industry => {
    if (industry.parentCode) {
      const parent = industryMap.get(industry.parentCode);
      if (parent) {
        parent.children.push(industryMap.get(industry.code));
      }
    } else {
      rootIndustries.push(industryMap.get(industry.code));
    }
  });

    hierarchy = {
      hierarchy: rootIndustries,
      totalIndustries: industries.length,
    };

    // Cache the results
    if (cacheService) {
      await cacheService.set('industries:hierarchy:tree', hierarchy, 86400); // 24 hours
    }
  }

  return ApiResponse.success(res, hierarchy);
});

/**
 * @desc    Get industry by code with detailed stats
 * @route   GET /api/admin/industries/:code
 * @access  Private/Admin
 */
exports.getIndustryByCode = asyncHandler(async (req, res) => {
  const industry = await Industry.findOne({ code: req.params.code }).lean();

  if (!industry) {
    throw new AppError('Industry not found', 404);
  }

  // Get detailed statistics
  const [jobCount, candidateCount, recentJobs, subIndustries] = await Promise.all([
    Job.countDocuments({ industryCode: industry.code }),
    CandidateProfile.countDocuments({ 'personalInfo.industry': industry.code }),
    Job.find({ industryCode: industry.code })
      .select('title employer location salary status createdAt')
      .populate('employer', 'companyName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Industry.find({ parentCode: industry.code }).lean(),
  ]);

  return ApiResponse.success(res, {
    industry,
    analytics: {
      jobCount,
      candidateCount,
      subIndustriesCount: subIndustries.length,
      recentJobs,
    },
    subIndustries,
  });
});

/**
 * @desc    Create new industry
 * @route   POST /api/admin/industries
 * @access  Private/Admin
 */
exports.createIndustry = asyncHandler(async (req, res) => {
  const { code, name, parentCode } = req.body;

  // Validation
  if (!code || !name || !name.vi || !name.en) {
    throw new AppError('Code and multilingual names (vi, en) are required', 400);
  }

  // Check for duplicates
  const existingIndustry = await Industry.findOne({ code });
  if (existingIndustry) {
    throw new AppError('Industry with this code already exists', 400);
  }

  // Validate parent if provided
  if (parentCode) {
    const parent = await Industry.findOne({ code: parentCode });
    if (!parent) {
      throw new AppError('Parent industry not found', 400);
    }
  }

  const industry = await Industry.create(req.body);

  // Invalidate industries cache
  const cacheService = getCacheService();
  if (cacheService) {
    await cacheService.invalidateStaticData('industries');
    await cacheService.delete('industries:hierarchy:tree');
  }

  logger.info(`Industry created: ${industry.code} by admin ${req.user.id}`);

  return ApiResponse.success(res, { industry }, 'Industry created successfully', 201);
});

/**
 * @desc    Update industry
 * @route   PUT /api/admin/industries/:code
 * @access  Private/Admin
 */
exports.updateIndustry = asyncHandler(async (req, res) => {
  const industry = await Industry.findOne({ code: req.params.code });

  if (!industry) {
    throw new AppError('Industry not found', 404);
  }

  // If code is being updated, check for duplicates
  if (req.body.code && req.body.code !== industry.code) {
    const existingIndustry = await Industry.findOne({ code: req.body.code });
    if (existingIndustry) {
      throw new AppError('Industry with this code already exists', 400);
    }
  }

  // Validate parent if being updated
  if (req.body.parentCode) {
    const parent = await Industry.findOne({ code: req.body.parentCode });
    if (!parent) {
      throw new AppError('Parent industry not found', 400);
    }

    // Prevent circular reference
    if (req.body.parentCode === industry.code) {
      throw new AppError('Cannot set industry as its own parent', 400);
    }
  }

  const updatedIndustry = await Industry.findOneAndUpdate(
    { code: req.params.code },
    req.body,
    { new: true, runValidators: true }
  );

  // Invalidate industries cache
  const cacheService = getCacheService();
  if (cacheService) {
    await cacheService.invalidateStaticData('industries');
    await cacheService.delete('industries:hierarchy:tree');
  }

  logger.info(`Industry updated: ${updatedIndustry.code} by admin ${req.user.id}`);

  return ApiResponse.success(res, { industry: updatedIndustry }, 'Industry updated successfully');
});

/**
 * @desc    Delete industry
 * @route   DELETE /api/admin/industries/:code
 * @access  Private/Admin
 */
exports.deleteIndustry = asyncHandler(async (req, res) => {
  const { force = false } = req.query;
  const industry = await Industry.findOne({ code: req.params.code });

  if (!industry) {
    throw new AppError('Industry not found', 404);
  }

  // Check for child industries
  const childCount = await Industry.countDocuments({ parentCode: industry.code });
  if (childCount > 0) {
    throw new AppError(
      `Cannot delete industry. It has ${childCount} sub-industries. Delete them first.`,
      400
    );
  }

  // Check if industry is being used
  const [jobCount, candidateCount] = await Promise.all([
    Job.countDocuments({ industryCode: industry.code }),
    CandidateProfile.countDocuments({ 'personalInfo.industry': industry.code }),
  ]);

  const totalUsage = jobCount + candidateCount;

  if (totalUsage > 0 && force !== 'true') {
    throw new AppError(
      `Cannot delete industry. It is being used in ${jobCount} jobs and ${candidateCount} candidate profiles. Use ?force=true to force delete.`,
      400
    );
  }

  await industry.deleteOne();

  // Invalidate industries cache
  const cacheService = getCacheService();
  if (cacheService) {
    await cacheService.invalidateStaticData('industries');
    await cacheService.delete('industries:hierarchy:tree');
  }

  logger.warn(
    `Industry deleted: ${industry.code} by admin ${req.user.id}. Usage: ${totalUsage}`
  );

  return ApiResponse.success(res, null, 'Industry deleted successfully');
});

// ============================================
// ANALYTICS & BULK OPERATIONS
// ============================================

/**
 * @desc    Get industry analytics overview
 * @route   GET /api/admin/industries/analytics/overview
 * @access  Private/Admin
 */
exports.getIndustryAnalytics = asyncHandler(async (req, res) => {
  const [
    totalIndustries,
    visibleIndustries,
    rootIndustries,
    topIndustries,
  ] = await Promise.all([
    Industry.countDocuments(),
    Industry.countDocuments({ visible: true }),
    Industry.countDocuments({ parentCode: null }),
    Industry.find()
      .sort({ 'stats.totalJobs': -1 })
      .limit(10)
      .select('code name stats')
      .lean(),
  ]);

  // Get total jobs and candidates across all industries
  const [totalJobs, totalCandidates] = await Promise.all([
    Job.countDocuments(),
    CandidateProfile.countDocuments(),
  ]);

  return ApiResponse.success(res, {
    overview: {
      totalIndustries,
      visibleIndustries,
      hiddenIndustries: totalIndustries - visibleIndustries,
      rootIndustries,
      subIndustries: totalIndustries - rootIndustries,
    },
    topIndustries,
    totals: {
      totalJobs,
      totalCandidates,
    },
  });
});

/**
 * @desc    Sync industry statistics from jobs and profiles
 * @route   POST /api/admin/industries/analytics/sync
 * @access  Private/Admin
 */
exports.syncIndustryStats = asyncHandler(async (req, res) => {
  const industries = await Industry.find().lean();
  const updated = [];

  for (const industry of industries) {
    const [jobCount, candidateCount] = await Promise.all([
      Job.countDocuments({ industryCode: industry.code }),
      CandidateProfile.countDocuments({ 'personalInfo.industry': industry.code }),
    ]);

    const newStats = {
      totalJobs: jobCount,
      totalCandidates: candidateCount,
      totalCVs: industry.stats?.totalCVs || 0,
      totalApplications: industry.stats?.totalApplications || 0,
    };

    // Only update if changed
    if (
      industry.stats?.totalJobs !== jobCount ||
      industry.stats?.totalCandidates !== candidateCount
    ) {
      await Industry.findOneAndUpdate(
        { code: industry.code },
        { stats: newStats }
      );
      updated.push({
        code: industry.code,
        oldStats: industry.stats,
        newStats,
      });
    }
  }

  logger.info(
    `Industry stats synced: ${updated.length} industries updated by admin ${req.user.id}`
  );

  return ApiResponse.success(res, {
    totalIndustries: industries.length,
    updatedCount: updated.length,
    updated: updated.slice(0, 20), // Return first 20 for reference
  }, 'Statistics sync completed');
});

/**
 * @desc    Bulk create industries
 * @route   POST /api/admin/industries/bulk
 * @access  Private/Admin
 */
exports.bulkCreateIndustries = asyncHandler(async (req, res) => {
  const { industries } = req.body;

  if (!Array.isArray(industries) || industries.length === 0) {
    throw new AppError('Industries array is required', 400);
  }

  const results = {
    created: [],
    failed: [],
  };

  for (const industryData of industries) {
    try {
      // Check for duplicates
      const existing = await Industry.findOne({ code: industryData.code });
      if (existing) {
        results.failed.push({
          code: industryData.code,
          reason: 'Already exists',
        });
        continue;
      }

      // Validate parent if provided
      if (industryData.parentCode) {
        const parent = await Industry.findOne({ code: industryData.parentCode });
        if (!parent) {
          results.failed.push({
            code: industryData.code,
            reason: 'Parent industry not found',
          });
          continue;
        }
      }

      const industry = await Industry.create(industryData);
      results.created.push(industry);
    } catch (error) {
      results.failed.push({
        code: industryData.code,
        reason: error.message,
      });
    }
  }

  logger.info(
    `Bulk create industries: ${results.created.length} created, ${results.failed.length} failed by admin ${req.user.id}`
  );

  return ApiResponse.success(res, results, 'Bulk operation completed');
});

/**
 * @desc    Update sort order for multiple industries
 * @route   PUT /api/admin/industries/sort-order
 * @access  Private/Admin
 */
exports.updateIndustrySortOrder = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError('Updates array is required', 400);
  }

  const results = {
    updated: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const industry = await Industry.findOneAndUpdate(
        { code: update.code },
        { sortOrder: update.sortOrder },
        { new: true }
      );

      if (industry) {
        results.updated.push(industry);
      } else {
        results.failed.push({
          code: update.code,
          reason: 'Industry not found',
        });
      }
    } catch (error) {
      results.failed.push({
        code: update.code,
        reason: error.message,
      });
    }
  }

  logger.info(
    `Sort order updated: ${results.updated.length} industries by admin ${req.user.id}`
  );

  return ApiResponse.success(res, results, 'Sort order update completed');
});
