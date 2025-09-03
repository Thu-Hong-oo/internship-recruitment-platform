const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên kỹ năng là bắt buộc'],
      unique: true,
      trim: true,
      maxlength: [100, 'Tên kỹ năng không được vượt quá 100 ký tự'],
    },
    category: {
      type: String,
      enum: [
        'programming',
        'design',
        'business',
        'soft-skills',
        'marketing',
        'data',
        'devops',
        'mobile',
        'web',
        'other',
      ],
      required: [true, 'Danh mục kỹ năng là bắt buộc'],
    },
    aliases: [
      {
        type: String,
        trim: true,
      },
    ], // alternative names
    description: {
      type: String,
      maxlength: [500, 'Mô tả không được vượt quá 500 ký tự'],
    },
    level: {
      beginner: {
        type: String,
        default: 'Cơ bản',
      },
      intermediate: {
        type: String,
        default: 'Trung bình',
      },
      advanced: {
        type: String,
        default: 'Nâng cao',
      },
    },
    relatedSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ], // ref to other skills
    popularity: {
      type: Number,
      min: 0,
      default: 0,
    }, // frequency in job postings
    embedding: [
      {
        type: Number,
      },
    ], // Vector embedding for semantic search
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
      },
      learningTime: {
        type: Number, // hours
        min: 0,
      },
      resources: [
        {
          type: String,
          enum: ['course', 'video', 'book', 'project', 'tutorial'],
          default: 'course',
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SkillSchema.index({ name: 1 }, { unique: true });
SkillSchema.index({ category: 1 });
SkillSchema.index({ popularity: -1 });
SkillSchema.index({ isActive: 1 });
SkillSchema.index({ name: 'text', description: 'text' });

// Virtual để lấy số lượng users có skill này
SkillSchema.virtual('userCount', {
  ref: 'CandidateProfile',
  localField: '_id',
  foreignField: 'skills.skillId',
  count: true,
});

// Virtual để lấy số lượng jobs yêu cầu skill này
SkillSchema.virtual('jobCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'requirements.skills.skillId',
  count: true,
});

// Method để tìm skills liên quan
SkillSchema.methods.getRelatedSkills = function () {
  return this.model('Skill').find({
    _id: { $in: this.relatedSkills },
    isActive: true,
  });
};

// Method để tìm skills cùng category
SkillSchema.methods.getSkillsByCategory = function () {
  return this.model('Skill')
    .find({
      category: this.category,
      isActive: true,
      _id: { $ne: this._id },
    })
    .sort({ popularity: -1 })
    .limit(10);
};

// Method để update popularity
SkillSchema.methods.updatePopularity = async function () {
  const jobCount = await this.model('Job').countDocuments({
    'requirements.skills.skillId': this._id,
    status: 'active',
  });

  const userCount = await this.model('CandidateProfile').countDocuments({
    'skills.skillId': this._id,
  });

  this.popularity = jobCount + userCount;
  return this.save();
};

// Static method để tìm skills theo category
SkillSchema.statics.findByCategory = function (category) {
  return this.find({
    category: category,
    isActive: true,
  }).sort({ popularity: -1 });
};

// Static method để tìm skills phổ biến
SkillSchema.statics.findPopular = function (limit = 20) {
  return this.find({
    isActive: true,
  })
    .sort({ popularity: -1 })
    .limit(limit);
};

// Static method để search skills
SkillSchema.statics.search = function (query) {
  return this.find({
    $text: { $search: query },
    isActive: true,
  }).sort({ popularity: -1 });
};

// Pre-save middleware
SkillSchema.pre('save', function (next) {
  // Auto-generate aliases if not provided
  if (this.aliases.length === 0) {
    this.aliases = [this.name.toLowerCase()];
  }

  // Validate related skills don't include self
  if (this.relatedSkills.includes(this._id)) {
    return next(new Error('Skill không thể liên quan đến chính nó'));
  }

  next();
});

module.exports = mongoose.model('Skill', SkillSchema);
