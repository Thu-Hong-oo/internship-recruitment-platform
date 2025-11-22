const Skill = require('../../models/Skill');
const Job = require('../../models/Job');
const CandidateProfile = require('../../models/CandidateProfile');
const { logger } = require('../../utils/logger');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');
const asyncHandler = require('express-async-handler');

// ============================================
// SKILL MANAGEMENT CRUD
// ============================================

/**
 * @desc    Get all skills with admin filters
 * @route   GET /api/admin/skills
 * @access  Private/Admin
 */
exports.getAllSkills = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    category,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    status = 'all', // all | active | inactive
    demandLevel,
    trend,
  } = req.query;

  const query = {};

  // Status filter
  if (status !== 'all') {
    query.isActive = status === 'active';
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { aliases: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  // Category filter
  if (category) query.category = category;

  // Demand level filter
  if (demandLevel) query.demandLevel = demandLevel;

  // Trend filter
  if (trend) query.trend = trend;

  const skip = (page - 1) * limit;
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skills = await Skill.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Skill.countDocuments(query);

  // Enrich with usage stats
  const enrichedSkills = await Promise.all(
    skills.map(async skill => {
      const [jobCount, candidateCount] = await Promise.all([
        Job.countDocuments({
          $or: [
            { skills: skill.name },
            { skillIds: skill._id },
          ],
          status: { $in: ['active', 'open'] },
        }),
        CandidateProfile.countDocuments({
          'skills.technical.skillId': skill._id,
        }),
      ]);

      return {
        ...skill,
        usage: {
          jobCount,
          candidateCount,
          totalUsage: jobCount + candidateCount,
        },
      };
    })
  );

  return ApiResponse.success(res, {
    skills: enrichedSkills,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    filters: {
      status,
      category,
      demandLevel,
      trend,
    },
  });
});

/**
 * @desc    Get skill by ID with detailed analytics
 * @route   GET /api/admin/skills/:id
 * @access  Private/Admin
 */
exports.getSkillById = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id).lean();

  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  // Get detailed usage statistics
  const [jobCount, candidateCount, recentJobs] = await Promise.all([
    Job.countDocuments({
      $or: [
        { skills: skill.name },
        { skillIds: skill._id },
      ],
    }),
    CandidateProfile.countDocuments({
      'skills.technical.skillId': skill._id,
    }),
    Job.find({
      $or: [
        { skills: skill.name },
        { skillIds: skill._id },
      ],
      status: { $in: ['active', 'open'] },
    })
      .select('title employer location salary createdAt')
      .populate('employer', 'companyName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return ApiResponse.success(res, {
    skill,
    analytics: {
      jobCount,
      candidateCount,
      totalUsage: jobCount + candidateCount,
      recentJobs,
    },
  });
});

/**
 * @desc    Create new skill
 * @route   POST /api/admin/skills
 * @access  Private/Admin
 */
exports.createSkill = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    description,
    aliases = [],
    demandLevel = 'medium',
    trend = 'stable',
    // isActive is NOT allowed on create - always defaults to true
  } = req.body;

  // Validation
  if (!name || !category) {
    throw new AppError('Name and category are required', 400);
  }

  // Check for duplicates
  const existingSkill = await Skill.findOne({
    $or: [
      { name: { $regex: `^${name}$`, $options: 'i' } },
      { aliases: { $in: [new RegExp(`^${name}$`, 'i')] } },
    ],
  });

  if (existingSkill) {
    throw new AppError('Skill with this name or alias already exists', 400);
  }

  const skill = await Skill.create({
    name: name.trim(),
    category,
    description,
    aliases: aliases.map(a => a.trim()),
    demandLevel,
    trend,
    // isActive defaults to true in model
  });

  logger.info(`Skill created: ${skill.name} by admin ${req.user.id}`);

  return ApiResponse.success(res, { skill }, 'Skill created successfully', 201);
});

/**
 * @desc    Update skill
 * @route   PUT /api/admin/skills/:id
 * @access  Private/Admin
 */
exports.updateSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  // If name is being updated, check for duplicates
  if (req.body.name && req.body.name !== skill.name) {
    const existingSkill = await Skill.findOne({
      _id: { $ne: skill._id },
      $or: [
        { name: { $regex: `^${req.body.name}$`, $options: 'i' } },
        { aliases: { $in: [new RegExp(`^${req.body.name}$`, 'i')] } },
      ],
    });

    if (existingSkill) {
      throw new AppError('Skill with this name or alias already exists', 400);
    }
  }

  const updatedSkill = await Skill.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  logger.info(`Skill updated: ${updatedSkill.name} by admin ${req.user.id}`);

  return ApiResponse.success(res, { skill: updatedSkill }, 'Skill updated successfully');
});

/**
 * @desc    Delete skill
 * @route   DELETE /api/admin/skills/:id
 * @access  Private/Admin
 */
exports.deleteSkill = asyncHandler(async (req, res) => {
  const { force = false } = req.query;
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  // Check if skill is being used
  const [jobCount, candidateCount] = await Promise.all([
    Job.countDocuments({
      $or: [
        { skills: skill.name },
        { skillIds: skill._id },
      ],
    }),
    CandidateProfile.countDocuments({
      'skills.technical.skillId': skill._id,
    }),
  ]);

  const totalUsage = jobCount + candidateCount;

  if (totalUsage > 0 && force !== 'true') {
    throw new AppError(
      `Cannot delete skill. It is being used in ${jobCount} jobs and ${candidateCount} candidate profiles. Use ?force=true to force delete.`,
      400
    );
  }

  await skill.deleteOne();

  logger.warn(
    `Skill deleted: ${skill.name} by admin ${req.user.id}. Usage: ${totalUsage}`
  );

  return ApiResponse.success(res, null, 'Skill deleted successfully');
});

/**
 * @desc    Toggle skill active status
 * @route   PATCH /api/admin/skills/:id/toggle-status
 * @access  Private/Admin
 */
exports.toggleSkillStatus = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  // Toggle the status
  skill.isActive = !skill.isActive;
  await skill.save();

  logger.info(
    `Skill status toggled: ${skill.name} -> ${skill.isActive ? 'active' : 'inactive'} by admin ${req.user.id}`
  );

  return ApiResponse.success(
    res,
    { skill },
    `Skill ${skill.isActive ? 'activated' : 'deactivated'} successfully`
  );
});

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @desc    Bulk create skills
 * @route   POST /api/admin/skills/bulk
 * @access  Private/Admin
 */
exports.bulkCreateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;

  if (!Array.isArray(skills) || skills.length === 0) {
    throw new AppError('Skills array is required', 400);
  }

  const results = {
    created: [],
    failed: [],
  };

  for (const skillData of skills) {
    try {
      // Check for duplicates
      const existing = await Skill.findOne({
        $or: [
          { name: { $regex: `^${skillData.name}$`, $options: 'i' } },
          { aliases: { $in: [new RegExp(`^${skillData.name}$`, 'i')] } },
        ],
      });

      if (existing) {
        results.failed.push({
          skill: skillData.name,
          reason: 'Already exists',
        });
        continue;
      }

      const skill = await Skill.create(skillData);
      results.created.push(skill);
    } catch (error) {
      results.failed.push({
        skill: skillData.name,
        reason: error.message,
      });
    }
  }

  logger.info(
    `Bulk create skills: ${results.created.length} created, ${results.failed.length} failed by admin ${req.user.id}`
  );

  return ApiResponse.success(res, results, 'Bulk operation completed');
});

/**
 * @desc    Batch update multiple skills
 * @route   PATCH /api/admin/skills/bulk
 * @access  Private/Admin
 */
exports.batchUpdateSkills = asyncHandler(async (req, res) => {
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
      const skill = await Skill.findByIdAndUpdate(
        update.id,
        update.data,
        { new: true, runValidators: true }
      );

      if (skill) {
        results.updated.push(skill);
      } else {
        results.failed.push({
          id: update.id,
          reason: 'Skill not found',
        });
      }
    } catch (error) {
      results.failed.push({
        id: update.id,
        reason: error.message,
      });
    }
  }

  logger.info(
    `Batch update skills: ${results.updated.length} updated, ${results.failed.length} failed by admin ${req.user.id}`
  );

  return ApiResponse.success(res, results, 'Batch update completed');
});

/**
 * @desc    Batch delete multiple skills
 * @route   DELETE /api/admin/skills/bulk
 * @access  Private/Admin
 */
exports.batchDeleteSkills = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const { force = false } = req.query;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required', 400);
  }

  const results = {
    deleted: [],
    failed: [],
  };

  for (const id of ids) {
    try {
      const skill = await Skill.findById(id);

      if (!skill) {
        results.failed.push({ id, reason: 'Skill not found' });
        continue;
      }

      // Check usage
      const [jobCount, candidateCount] = await Promise.all([
        Job.countDocuments({
          $or: [
            { skills: skill.name },
            { skillIds: skill._id },
          ],
        }),
        CandidateProfile.countDocuments({
          'skills.technical.skillId': skill._id,
        }),
      ]);

      const totalUsage = jobCount + candidateCount;

      if (totalUsage > 0 && force !== 'true') {
        results.failed.push({
          id,
          skill: skill.name,
          reason: `In use (${totalUsage} times). Use force=true to delete.`,
        });
        continue;
      }

      await skill.deleteOne();
      results.deleted.push({ id, name: skill.name });
    } catch (error) {
      results.failed.push({ id, reason: error.message });
    }
  }

  logger.warn(
    `Batch delete skills: ${results.deleted.length} deleted, ${results.failed.length} failed by admin ${req.user.id}`
  );

  return ApiResponse.success(res, results, 'Batch delete completed');
});

// ============================================
// CATEGORIES MANAGEMENT
// ============================================

/**
 * @desc    Get all skill categories with stats
 * @route   GET /api/admin/skills/categories/list
 * @access  Private/Admin
 */
exports.getSkillCategories = asyncHandler(async (req, res) => {
  const categories = await Skill.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: ['$isActive', 1, 0] },
        },
        avgPopularity: { $avg: '$popularity' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  const formattedCategories = categories.map(cat => ({
    name: cat._id,
    skillCount: cat.count,
    activeCount: cat.activeCount,
    inactiveCount: cat.count - cat.activeCount,
    avgPopularity: Math.round(cat.avgPopularity || 0),
  }));

  return ApiResponse.success(res, { categories: formattedCategories });
});

/**
 * @desc    Get skills by category
 * @route   GET /api/admin/skills/categories/:category
 * @access  Private/Admin
 */
exports.getSkillsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const skip = (page - 1) * limit;

  const skills = await Skill.find({ category })
    .sort({ popularity: -1, name: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Skill.countDocuments({ category });

  return ApiResponse.success(res, {
    category,
    skills,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Update skill category
 * @route   PUT /api/admin/skills/categories/:id
 * @access  Private/Admin
 */
exports.updateSkillCategory = asyncHandler(async (req, res) => {
  const { category } = req.body;

  if (!category) {
    throw new AppError('Category is required', 400);
  }

  const skill = await Skill.findByIdAndUpdate(
    req.params.id,
    { category },
    { new: true, runValidators: true }
  );

  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  return ApiResponse.success(res, { skill }, 'Category updated successfully');
});

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

/**
 * @desc    Get skill analytics overview
 * @route   GET /api/admin/skills/analytics/overview
 * @access  Private/Admin
 */
exports.getSkillAnalytics = asyncHandler(async (req, res) => {
  const [
    totalSkills,
    activeSkills,
    categoriesCount,
    topSkills,
    demandDistribution,
    trendDistribution,
  ] = await Promise.all([
    Skill.countDocuments(),
    Skill.countDocuments({ isActive: true }),
    Skill.distinct('category').then(cats => cats.length),
    Skill.find()
      .sort({ popularity: -1 })
      .limit(10)
      .select('name category popularity demandLevel')
      .lean(),
    Skill.aggregate([
      { $group: { _id: '$demandLevel', count: { $sum: 1 } } },
    ]),
    Skill.aggregate([
      { $group: { _id: '$trend', count: { $sum: 1 } } },
    ]),
  ]);

  return ApiResponse.success(res, {
    overview: {
      totalSkills,
      activeSkills,
      inactiveSkills: totalSkills - activeSkills,
      categoriesCount,
    },
    topSkills,
    distributions: {
      byDemand: demandDistribution,
      byTrend: trendDistribution,
    },
  });
});

/**
 * @desc    Get skill trends
 * @route   GET /api/admin/skills/analytics/trends
 * @access  Private/Admin
 */
exports.getSkillTrends = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // Calculate date range
  const days = period === '1y' ? 365 : period === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get trending skills
  const trendingSkills = await Skill.find({ trend: 'growing' })
    .sort({ popularity: -1 })
    .limit(20)
    .select('name category popularity demandLevel')
    .lean();

  // Get emerging skills
  const emergingSkills = await Skill.find({ trend: 'emerging' })
    .sort({ popularity: -1 })
    .limit(20)
    .select('name category popularity demandLevel')
    .lean();

  // Get declining skills
  const decliningSkills = await Skill.find({ trend: 'declining' })
    .sort({ popularity: -1 })
    .limit(20)
    .select('name category popularity demandLevel')
    .lean();

  return ApiResponse.success(res, {
    period,
    trending: trendingSkills,
    emerging: emergingSkills,
    declining: decliningSkills,
  });
});

/**
 * @desc    Sync skill popularity from jobs and profiles
 * @route   POST /api/admin/skills/analytics/sync
 * @access  Private/Admin
 */
exports.syncSkillPopularity = asyncHandler(async (req, res) => {
  const skills = await Skill.find().lean();
  const updated = [];

  for (const skill of skills) {
    const [jobCount, candidateCount] = await Promise.all([
      Job.countDocuments({
        $or: [
          { skills: skill.name },
          { skillIds: skill._id },
        ],
        status: { $in: ['active', 'open'] },
      }),
      CandidateProfile.countDocuments({
        'skills.technical.skillId': skill._id,
      }),
    ]);

    const newPopularity = jobCount + candidateCount;

    if (skill.popularity !== newPopularity) {
      await Skill.findByIdAndUpdate(skill._id, { popularity: newPopularity });
      updated.push({ name: skill.name, oldValue: skill.popularity, newValue: newPopularity });
    }
  }

  logger.info(`Skill popularity synced: ${updated.length} skills updated by admin ${req.user.id}`);

  return ApiResponse.success(res, {
    totalSkills: skills.length,
    updatedCount: updated.length,
    updated: updated.slice(0, 20), // Return first 20 for reference
  }, 'Popularity sync completed');
});

// ============================================
// SKILL RELATIONSHIPS
// ============================================

/**
 * @desc    Get related skills
 * @route   GET /api/admin/skills/:id/related
 * @access  Private/Admin
 */
exports.getRelatedSkills = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id).lean();

  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  // Find skills in the same category
  const relatedByCategory = await Skill.find({
    _id: { $ne: skill._id },
    category: skill.category,
    isActive: true,
  })
    .sort({ popularity: -1 })
    .limit(10)
    .select('name category popularity')
    .lean();

  // Find skills that often appear together in jobs
  const jobsWithSkill = await Job.find({
    $or: [
      { skills: skill.name },
      { skillIds: skill._id },
    ],
  }).select('skills skillIds').lean();

  const coOccurringSkills = {};
  jobsWithSkill.forEach(job => {
    job.skills?.forEach(s => {
      if (s !== skill.name) {
        coOccurringSkills[s] = (coOccurringSkills[s] || 0) + 1;
      }
    });
  });

  const relatedByCoOccurrence = Object.entries(coOccurringSkills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, coOccurrenceCount: count }));

  return ApiResponse.success(res, {
    skill: skill.name,
    relatedByCategory,
    relatedByCoOccurrence,
  });
});

/**
 * @desc    Update skill relationships
 * @route   PUT /api/admin/skills/:id/relationships
 * @access  Private/Admin
 */
exports.updateSkillRelationships = asyncHandler(async (req, res) => {
  // This is a placeholder for future relationship feature
  // You can extend Skill model to include relationships
  throw new AppError('Feature not implemented yet', 501);
});

// ============================================
// IMPORT / EXPORT
// ============================================

/**
 * @desc    Export skills to CSV/JSON
 * @route   GET /api/admin/skills/export
 * @access  Private/Admin
 */
exports.exportSkills = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;

  const skills = await Skill.find().lean();

  if (format === 'csv') {
    // Simple CSV export
    const csv = [
      'Name,Category,Description,Aliases,Demand Level,Trend,Is Active,Popularity',
      ...skills.map(s =>
        [
          s.name,
          s.category,
          `"${s.description || ''}"`,
          `"${s.aliases?.join(';') || ''}"`,
          s.demandLevel,
          s.trend,
          s.isActive,
          s.popularity,
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=skills.csv');
    return res.send(csv);
  }

  // JSON export
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=skills.json');
  return res.json(skills);
});

/**
 * @desc    Import skills from CSV/JSON
 * @route   POST /api/admin/skills/import
 * @access  Private/Admin
 */
exports.importSkills = asyncHandler(async (req, res) => {
  // This would require multer middleware for file upload
  // Placeholder for now
  throw new AppError('Feature not implemented yet. Use bulk create endpoint.', 501);
});
