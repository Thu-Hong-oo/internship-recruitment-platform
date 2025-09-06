const mongoose = require('mongoose');

const SavedJobSchema = new mongoose.Schema({
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
  savedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
  },
  tags: [{
    type: String,
    maxlength: [50, 'Tag không được vượt quá 50 ký tự']
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'interviewed', 'offered', 'rejected', 'withdrawn'],
    default: 'saved'
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    date: Date,
    message: {
      type: String,
      maxlength: [200, 'Lời nhắc không được vượt quá 200 ký tự']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });
SavedJobSchema.index({ userId: 1, savedAt: -1 });
SavedJobSchema.index({ userId: 1, status: 1 });
SavedJobSchema.index({ userId: 1, priority: 1 });
SavedJobSchema.index({ 'reminder.enabled': 1, 'reminder.date': 1 });

// Virtuals
SavedJobSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true
});

SavedJobSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Methods
SavedJobSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

SavedJobSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

SavedJobSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

SavedJobSchema.methods.setReminder = function(date, message = '') {
  this.reminder.enabled = true;
  this.reminder.date = date;
  this.reminder.message = message;
  return this.save();
};

SavedJobSchema.methods.clearReminder = function() {
  this.reminder.enabled = false;
  this.reminder.date = null;
  this.reminder.message = '';
  return this.save();
};

// Static methods
SavedJobSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) query.status = options.status;
  if (options.priority) query.priority = options.priority;
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  return this.find(query)
    .populate('jobId', 'title companyId location salary status')
    .populate('jobId.companyId', 'name logo industry')
    .sort({ savedAt: -1 });
};

SavedJobSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

SavedJobSchema.statics.getPopularJobs = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$jobId',
        saveCount: { $sum: 1 }
      }
    },
    { $sort: { saveCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'jobs',
        localField: '_id',
        foreignField: '_id',
        as: 'job'
      }
    },
    { $unwind: '$job' },
    {
      $lookup: {
        from: 'companies',
        localField: 'job.companyId',
        foreignField: '_id',
        as: 'company'
      }
    },
    { $unwind: '$company' }
  ]);
};

// Pre-save middleware
SavedJobSchema.pre('save', function(next) {
  // Validate reminder date is in the future
  if (this.reminder.enabled && this.reminder.date) {
    if (new Date(this.reminder.date) <= new Date()) {
      return next(new Error('Ngày nhắc phải trong tương lai'));
    }
  }
  
  next();
});

module.exports = mongoose.model('SavedJob', SavedJobSchema);
