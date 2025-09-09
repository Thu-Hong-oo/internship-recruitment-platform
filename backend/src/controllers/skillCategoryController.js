const SkillCategory = require('../models/SkillCategory');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

// @desc    Get all skill categories
// @route   GET /api/skill-categories
// @access  Public
const getAllSkillCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    parent = null,
    active = true,
    sort = 'sortOrder',
    order = 'asc',
  } = req.query;

  // Build query
  const query = {};
  if (parent !== null) {
    query.parentCategory = parent === 'null' ? null : parent;
  }
  if (active !== null) {
    query.isActive = active === 'true';
  }

  // Build sort
  const sortOrder = order === 'desc' ? -1 : 1;
  const sortObj = { [sort]: sortOrder };

  // Execute query with pagination
  const categories = await SkillCategory.find(query)
    .populate('parentCategory', 'name slug')
    .sort(sortObj)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await SkillCategory.countDocuments(query);

  res.json({
    success: true,
    data: categories,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
});

// @desc    Get skill category tree
// @route   GET /api/skill-categories/tree
// @access  Public
const getSkillCategoryTree = asyncHandler(async (req, res) => {
  const tree = await SkillCategory.getCategoryTree();
  
  res.json({
    success: true,
    data: tree,
  });
});

// @desc    Get single skill category by slug
// @route   GET /api/skill-categories/:slug
// @access  Public
const getSkillCategory = asyncHandler(async (req, res) => {
  const category = await SkillCategory.findOne({ slug: req.params.slug })
    .populate('parentCategory', 'name slug')
    .populate('subcategories', 'name slug description icon color');

  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy danh mục kỹ năng',
    });
  }

  res.json({
    success: true,
    data: category,
  });
});

// @desc    Create new skill category
// @route   POST /api/skill-categories
// @access  Private/Admin
const createSkillCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, color, parentCategory, sortOrder } = req.body;

  // Check if category already exists
  const existingCategory = await SkillCategory.findOne({ 
    $or: [
      { name: name },
      { slug: name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim() }
    ]
  });

  if (existingCategory) {
    return res.status(400).json({
      success: false,
      error: 'Danh mục kỹ năng đã tồn tại',
    });
  }

  const category = await SkillCategory.create({
    name,
    description,
    icon,
    color,
    parentCategory: parentCategory || null,
    sortOrder: sortOrder || 0,
  });

  logger.info(`Skill category created: ${category.name}`, {
    service: 'internship-ai-platform',
    categoryId: category._id,
    userId: req.user?.id,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
});

// @desc    Update skill category
// @route   PUT /api/skill-categories/:slug
// @access  Private/Admin
const updateSkillCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, color, parentCategory, sortOrder, isActive } = req.body;

  const category = await SkillCategory.findOne({ slug: req.params.slug });

  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy danh mục kỹ năng',
    });
  }

  // Check for duplicate name if name is being updated
  if (name && name !== category.name) {
    const existingCategory = await SkillCategory.findOne({ 
      name: name,
      _id: { $ne: category._id }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Tên danh mục kỹ năng đã tồn tại',
      });
    }
  }

  // Update fields
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (icon !== undefined) category.icon = icon;
  if (color !== undefined) category.color = color;
  if (parentCategory !== undefined) category.parentCategory = parentCategory;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  logger.info(`Skill category updated: ${category.name}`, {
    service: 'internship-ai-platform',
    categoryId: category._id,
    userId: req.user?.id,
  });

  res.json({
    success: true,
    data: category,
  });
});

// @desc    Delete skill category
// @route   DELETE /api/skill-categories/:slug
// @access  Private/Admin
const deleteSkillCategory = asyncHandler(async (req, res) => {
  const category = await SkillCategory.findOne({ slug: req.params.slug });

  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy danh mục kỹ năng',
    });
  }

  // Check if category has skills
  const skillCount = await require('../models/Skill').countDocuments({
    category: category.slug, // Using slug instead of _id
  });

  if (skillCount > 0) {
    return res.status(400).json({
      success: false,
      error: `Không thể xóa danh mục có ${skillCount} kỹ năng. Vui lòng di chuyển các kỹ năng sang danh mục khác trước.`,
    });
  }

  // Check if category has subcategories
  const subcategoryCount = await SkillCategory.countDocuments({
    parentCategory: category._id,
  });

  if (subcategoryCount > 0) {
    return res.status(400).json({
      success: false,
      error: `Không thể xóa danh mục có ${subcategoryCount} danh mục con. Vui lòng xóa các danh mục con trước.`,
    });
  }

  await SkillCategory.findByIdAndDelete(req.params.id);

  logger.info(`Skill category deleted: ${category.name}`, {
    service: 'internship-ai-platform',
    categoryId: category._id,
    userId: req.user?.id,
  });

  res.json({
    success: true,
    message: 'Danh mục kỹ năng đã được xóa',
  });
});

// @desc    Get popular skill categories
// @route   GET /api/skill-categories/popular
// @access  Public
const getPopularSkillCategories = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const categories = await SkillCategory.getPopularCategories(parseInt(limit));

  res.json({
    success: true,
    data: categories,
  });
});

// @desc    Search skill categories
// @route   GET /api/skill-categories/search
// @access  Public
const searchSkillCategories = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter "q" is required',
    });
  }

  const categories = await SkillCategory.searchCategories(q)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await SkillCategory.countDocuments({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
    isActive: true,
  });

  res.json({
    success: true,
    data: categories,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
});

// @desc    Update category statistics
// @route   PUT /api/skill-categories/:slug/stats
// @access  Private/Admin
const updateCategoryStats = asyncHandler(async (req, res) => {
  const category = await SkillCategory.findOne({ slug: req.params.slug });

  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy danh mục kỹ năng',
    });
  }

  await category.updateSkillCount();
  await category.updateJobCount();

  res.json({
    success: true,
    data: category,
    message: 'Thống kê danh mục đã được cập nhật',
  });
});

module.exports = {
  getAllSkillCategories,
  getSkillCategoryTree,
  getSkillCategory,
  createSkillCategory,
  updateSkillCategory,
  deleteSkillCategory,
  getPopularSkillCategories,
  searchSkillCategories,
  updateCategoryStats,
};
