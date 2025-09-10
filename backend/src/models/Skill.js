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
      type: String, // Using slug instead of ObjectId
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
          enum: [
            'course',
            'video',
            'book',
            'project',
            'tutorial',
            'bootcamp',
            'certification',
          ],
          default: 'course',
        },
      ],
      // Thêm thông tin về skill
      prerequisites: [String], // Kỹ năng cần có trước
      careerPaths: [String], // Các nghề nghiệp sử dụng skill này
      industryDemand: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      salaryImpact: {
        type: Number, // % tăng lương khi có skill này
        min: 0,
        max: 100,
      },
      futureTrend: {
        type: String,
        enum: ['declining', 'stable', 'growing', 'emerging'],
        default: 'stable',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SkillSchema.index({ category: 1 }); // category is now slug (string)
SkillSchema.index({ popularity: -1 });
SkillSchema.index({ isActive: 1 });
SkillSchema.index({ name: 'text', description: 'text' });
SkillSchema.index({ 'metadata.industryDemand': 1 });
SkillSchema.index({ 'metadata.futureTrend': 1 });
SkillSchema.index({ 'metadata.difficulty': 1 });

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
      category: this.category, // category is now slug
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

// Method để get skill recommendations dựa trên user skills
SkillSchema.methods.getRecommendations = async function (userSkills = []) {
  const recommendations = [];

  // Tìm skills liên quan
  const relatedSkills = await this.getRelatedSkills();
  recommendations.push(...relatedSkills);

  // Tìm skills cùng category
  const categorySkills = await this.getSkillsByCategory();
  recommendations.push(...categorySkills);

  // Tìm skills có prerequisites là skills hiện tại
  const prerequisiteSkills = await this.model('Skill').findByPrerequisites([
    this.name,
  ]);
  recommendations.push(...prerequisiteSkills);

  // Loại bỏ duplicates và skills user đã có
  const uniqueRecommendations = recommendations.filter(
    (skill, index, self) =>
      index ===
        self.findIndex(s => s._id.toString() === skill._id.toString()) &&
      !userSkills.includes(skill._id.toString())
  );

  return uniqueRecommendations.slice(0, 10); // Top 10 recommendations
};

// Method để check if skill is trending
SkillSchema.methods.isTrending = function () {
  return (
    this.metadata.futureTrend === 'growing' ||
    this.metadata.futureTrend === 'emerging' ||
    this.metadata.industryDemand === 'high' ||
    this.metadata.industryDemand === 'critical'
  );
};

// Method để get skill value score
SkillSchema.methods.getValueScore = function () {
  let score = 0;

  // Base popularity
  score += Math.min(this.popularity / 10, 50);

  // Industry demand bonus
  const demandBonus = {
    low: 0,
    medium: 10,
    high: 20,
    critical: 30,
  };
  score += demandBonus[this.metadata.industryDemand] || 0;

  // Future trend bonus
  const trendBonus = {
    declining: -10,
    stable: 0,
    growing: 15,
    emerging: 20,
  };
  score += trendBonus[this.metadata.futureTrend] || 0;

  // Salary impact bonus
  score += (this.metadata.salaryImpact || 0) * 0.5;

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
};

// Static method để tìm skills theo category
SkillSchema.statics.findByCategory = function (categorySlug) {
  return this.find({
    category: categorySlug, // category is now slug
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

// Static method để tìm skills theo industry demand
SkillSchema.statics.findByIndustryDemand = function (demand) {
  return this.find({
    'metadata.industryDemand': demand,
    isActive: true,
  }).sort({ popularity: -1 });
};

// Static method để tìm skills theo future trend
SkillSchema.statics.findByFutureTrend = function (trend) {
  return this.find({
    'metadata.futureTrend': trend,
    isActive: true,
  }).sort({ popularity: -1 });
};

// Static method để tìm skills theo difficulty
SkillSchema.statics.findByDifficulty = function (difficulty) {
  return this.find({
    'metadata.difficulty': difficulty,
    isActive: true,
  }).sort({ popularity: -1 });
};

// Static method để tìm skills theo career path
SkillSchema.statics.findByCareerPath = function (careerPath) {
  return this.find({
    'metadata.careerPaths': { $in: [careerPath] },
    isActive: true,
  }).sort({ popularity: -1 });
};

// Static method để tìm skills có salary impact cao
SkillSchema.statics.findHighSalaryImpact = function (minImpact = 20) {
  return this.find({
    'metadata.salaryImpact': { $gte: minImpact },
    isActive: true,
  }).sort({ 'metadata.salaryImpact': -1 });
};

// Static method để tìm skills emerging (đang phát triển)
SkillSchema.statics.findEmergingSkills = function () {
  return this.find({
    'metadata.futureTrend': 'emerging',
    isActive: true,
  }).sort({ popularity: -1 });
};

// Static method để tìm skills theo prerequisites
SkillSchema.statics.findByPrerequisites = function (prerequisiteSkills) {
  return this.find({
    'metadata.prerequisites': { $in: prerequisiteSkills },
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
