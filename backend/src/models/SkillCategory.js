const mongoose = require('mongoose');

const SkillCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      unique: true,
      trim: true,
      maxlength: [50, 'Tên danh mục không được vượt quá 50 ký tự'],
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [200, 'Mô tả không được vượt quá 200 ký tự'],
    },
    icon: {
      type: String,
      default: '📚', // Default icon
    },
    color: {
      type: String,
      default: '#6B7280', // Default color
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Màu sắc phải là mã hex hợp lệ (ví dụ: #FF5733)'
      }
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillCategory',
      default: null, // null for root categories
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      skillCount: Number,
      internCount: Number,
      learningPath: {
        recommendedOrder: Number,
        estimatedDuration: {
          value: Number,
          unit: {
            type: String,
            enum: ['days', 'weeks', 'months']
          }
        },
        prerequisites: [{
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SkillCategory'
          },
          required: Boolean
        }],
        outcomes: [String]
      },
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
      },
      relevance: {
        internshipDemand: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        marketTrend: {
          type: String,
          enum: ['declining', 'stable', 'growing'],
          default: 'stable'
        }
      }
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SkillCategorySchema.index({ slug: 1 });
SkillCategorySchema.index({ isActive: 1 });
SkillCategorySchema.index({ sortOrder: 1 });
SkillCategorySchema.index({ parentCategory: 1 });
SkillCategorySchema.index({ 'metadata.demandLevel': 1 });
SkillCategorySchema.index({ 'metadata.trendDirection': 1 });

// Virtual để lấy subcategories
SkillCategorySchema.virtual('subcategories', {
  ref: 'SkillCategory',
  localField: '_id',
  foreignField: 'parentCategory',
});

// Virtual để lấy skills trong category này
SkillCategorySchema.virtual('skills', {
  ref: 'Skill',
  localField: '_id',
  foreignField: 'category',
});

// Method để update skill count
SkillCategorySchema.methods.updateSkillCount = async function() {
  const skillCount = await this.model('Skill').countDocuments({
    category: this.slug,
    isActive: true,
  });
  
  this.metadata.skillCount = skillCount;
  return this.save();
};

// Method để update job count
SkillCategorySchema.methods.updateJobCount = async function() {
  const jobCount = await this.model('Job').countDocuments({
    'requirements.skills.category': this.slug,
    status: 'active',
  });
  
  this.metadata.jobCount = jobCount;
  return this.save();
};

// Method để get all subcategories recursively
SkillCategorySchema.methods.getAllSubcategories = async function() {
  const subcategories = await this.model('SkillCategory').find({
    parentCategory: this._id,
    isActive: true,
  }).sort({ sortOrder: 1 });

  const allSubcategories = [...subcategories];
  
  for (const subcategory of subcategories) {
    const nestedSubcategories = await subcategory.getAllSubcategories();
    allSubcategories.push(...nestedSubcategories);
  }
  
  return allSubcategories;
};

// Static method để get root categories
SkillCategorySchema.statics.getRootCategories = function() {
  return this.find({
    parentCategory: null,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Static method để get category tree
SkillCategorySchema.statics.getCategoryTree = async function() {
  const rootCategories = await this.getRootCategories();
  
  const buildTree = async (category) => {
    const subcategories = await this.find({
      parentCategory: category._id,
      isActive: true,
    }).sort({ sortOrder: 1 });
    
    const children = [];
    for (const subcategory of subcategories) {
      children.push(await buildTree(subcategory));
    }
    
    return {
      ...category.toObject(),
      children,
    };
  };
  
  const tree = [];
  for (const rootCategory of rootCategories) {
    tree.push(await buildTree(rootCategory));
  }
  
  return tree;
};

// Static method để get popular categories
SkillCategorySchema.statics.getPopularCategories = function(limit = 10) {
  return this.find({
    isActive: true,
  })
    .sort({ 'metadata.skillCount': -1, 'metadata.jobCount': -1 })
    .limit(limit);
};

// Static method để search categories
SkillCategorySchema.statics.searchCategories = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
    isActive: true,
  }).sort({ 'metadata.skillCount': -1 });
};

// Pre-save middleware để auto-generate slug
SkillCategorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

// Pre-save middleware để validate parent category
SkillCategorySchema.pre('save', async function(next) {
  if (this.parentCategory) {
    const parent = await this.model('SkillCategory').findById(this.parentCategory);
    if (!parent) {
      return next(new Error('Parent category không tồn tại'));
    }
    
    // Prevent circular reference
    if (this.parentCategory.toString() === this._id.toString()) {
      return next(new Error('Category không thể là parent của chính nó'));
    }
  }
  next();
});

module.exports = mongoose.model('SkillCategory', SkillCategorySchema);
