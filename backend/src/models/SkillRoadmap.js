const mongoose = require('mongoose');

const SkillRoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID là bắt buộc']
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID là bắt buộc']
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề roadmap là bắt buộc'],
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  description: {
    type: String,
    maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
  },
  targetSkills: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    targetLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  }],
  weeks: [{
    week: {
      type: Number,
      required: true,
      min: 1
    },
    focus: {
      type: String,
      required: true
    },
    objectives: [{
      type: String,
      maxlength: [200, 'Mục tiêu không được vượt quá 200 ký tự']
    }],
    resources: [{
      title: {
        type: String,
        required: true,
        maxlength: [200, 'Tiêu đề tài nguyên không được vượt quá 200 ký tự']
      },
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['video', 'article', 'course', 'book', 'tutorial', 'project'],
        default: 'course'
      },
      duration: {
        type: Number, // hours
        min: 0,
        default: 1
      },
      description: {
        type: String,
        maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
      }
    }],
    exercises: [{
      type: String,
      maxlength: [300, 'Bài tập không được vượt quá 300 ký tự']
    }],
    milestone: {
      type: String,
      required: true,
      maxlength: [300, 'Cột mốc không được vượt quá 300 ký tự']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    notes: {
      type: String,
      maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
    }
  }],
  settings: {
    duration: {
      type: Number, // weeks
      min: 1,
      max: 52,
      default: 8
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    estimatedTotalHours: {
      type: Number,
      min: 0,
      default: 0
    },
    pace: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    }
  },
  progress: {
    currentWeek: {
      type: Number,
      min: 1,
      default: 1
    },
    completedWeeks: {
      type: Number,
      min: 0,
      default: 0
    },
    completedObjectives: {
      type: Number,
      min: 0,
      default: 0
    },
    totalObjectives: {
      type: Number,
      min: 0,
      default: 0
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastActivity: Date
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  metadata: {
    skillGaps: [{
      skill: {
        type: String,
        required: true
      },
      required: {
        type: Boolean,
        default: true
      },
      level: {
        type: String,
        enum: ['required', 'preferred', 'nice-to-have'],
        default: 'required'
      },
      importance: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      }
    }],
    userProfile: {
      currentSkills: [String],
      education: String,
      experience: Number
    },
    targetJob: {
      title: String,
      company: String,
      category: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SkillRoadmapSchema.index({ userId: 1, jobId: 1 }, { unique: true });
SkillRoadmapSchema.index({ userId: 1, status: 1 });
SkillRoadmapSchema.index({ status: 1, createdAt: -1 });

// Virtual for progress calculation
SkillRoadmapSchema.virtual('progressPercentage').get(function() {
  if (this.weeks.length === 0) return 0;
  return Math.round((this.progress.completedWeeks / this.weeks.length) * 100);
});

// Pre-save middleware to update progress
SkillRoadmapSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate progress
  if (this.weeks && this.weeks.length > 0) {
    const completedWeeks = this.weeks.filter(week => week.completed).length;
    const totalObjectives = this.weeks.reduce((total, week) => total + week.objectives.length, 0);
    const completedObjectives = this.weeks.reduce((total, week) => {
      return total + (week.completed ? week.objectives.length : 0);
    }, 0);
    
    this.progress.completedWeeks = completedWeeks;
    this.progress.totalObjectives = totalObjectives;
    this.progress.completedObjectives = completedObjectives;
    this.progress.completionPercentage = Math.round((completedWeeks / this.weeks.length) * 100);
  }
  
  next();
});

// Static method to get user's active roadmaps
SkillRoadmapSchema.statics.getActiveRoadmaps = function(userId) {
  return this.find({ userId, status: 'active' })
    .populate('jobId', 'title companyId')
    .populate('targetSkills.skillId', 'name category')
    .sort({ createdAt: -1 });
};

// Instance method to mark week as completed
SkillRoadmapSchema.methods.completeWeek = function(weekNumber, notes = '') {
  const week = this.weeks.find(w => w.week === weekNumber);
  if (week) {
    week.completed = true;
    week.completedAt = new Date();
    week.notes = notes;
    this.progress.lastActivity = new Date();
    return this.save();
  }
  throw new Error('Week not found');
};

// Instance method to update progress
SkillRoadmapSchema.methods.updateProgress = function(weekNumber, objectivesCompleted = []) {
  const week = this.weeks.find(w => w.week === weekNumber);
  if (week) {
    week.objectives.forEach((objective, index) => {
      if (objectivesCompleted.includes(index)) {
        // Mark objective as completed
        week.objectives[index] = `✅ ${objective}`;
      }
    });
    this.progress.lastActivity = new Date();
    return this.save();
  }
  throw new Error('Week not found');
};

module.exports = mongoose.model('SkillRoadmap', SkillRoadmapSchema);
