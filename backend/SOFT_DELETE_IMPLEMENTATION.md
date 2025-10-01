# 🗑️ SOFT DELETE IMPLEMENTATION PLAN

## 📋 **CURRENT STATE vs PROPOSED**

### **Current Implementation:**

```javascript
// Delete = Set status to CLOSED
job.status = JOB_STATUS.CLOSED;
await job.save();
```

### **Proposed Implementation:**

```javascript
// Delete = Set status to DELETED + metadata
job.status = JOB_STATUS.DELETED;
job.deletedAt = new Date();
job.deletedBy = req.user.id;
await job.save();
```

## 🎯 **IMPLEMENTATION STEPS**

### **Step 1: Update Constants** ✅ DONE

```javascript
JOB_STATUS: {
  // ... existing statuses
  DELETED: 'deleted', // NEW: Soft delete status
}
```

### **Step 2: Update Job Model (Optional Enhancement)**

```javascript
// Add to Job schema
deletedAt: { type: Date, default: null },
deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
```

### **Step 3: Update Delete Controller**

```javascript
// src/controllers/jobController.js - deleteJob function
const deleteJob = async (req, res) => {
  // ... existing permission checks ...

  // Soft delete with metadata
  job.status = JOB_STATUS.DELETED;
  job.deletedAt = new Date();
  job.deletedBy = req.user.id;
  await job.save();

  res.status(200).json({
    success: true,
    message: 'Đã xóa công việc thành công',
  });
};
```

### **Step 4: Update Query Logic**

```javascript
// Exclude deleted jobs by default
const getEmployerJobs = async (req, res) => {
  const query = {
    employer: employerProfile._id,
    status: { $ne: JOB_STATUS.DELETED }, // Exclude deleted
  };

  // Option to include deleted for admin/restore
  if (req.query.includeDeleted === 'true') {
    delete query.status;
  }

  const jobs = await Job.find(query);
};
```

### **Step 5: Add Restore Function (Optional)**

```javascript
// @desc    Restore deleted job
// @route   PUT /api/jobs/:id/restore
// @access  Private (Employer/Admin)
const restoreJob = async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (job.status !== JOB_STATUS.DELETED) {
    return res.status(400).json({
      success: false,
      message: 'Job không trong trạng thái đã xóa',
    });
  }

  job.status = JOB_STATUS.DRAFT; // Or previous status
  job.deletedAt = null;
  job.deletedBy = null;
  await job.save();

  res.json({ success: true, message: 'Khôi phục job thành công' });
};
```

## 🔄 **MIGRATION STRATEGY**

### **Option 1: Immediate Migration**

```javascript
// Update existing CLOSED jobs to DELETED
await Job.updateMany(
  { status: 'closed' /* criteria for deleted jobs */ },
  {
    $set: {
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: null, // Unknown for old records
    },
  }
);
```

### **Option 2: Gradual Migration**

- Keep existing CLOSED jobs as is
- New deletes use DELETED status
- Gradually migrate old data

## 📊 **UI/UX IMPLICATIONS**

### **Employer Dashboard:**

```javascript
// Statistics update
statistics: {
  total: 12,
  byStatus: {
    draft: 7,
    pending: 2,
    active: 2,
    closed: 1,      // Jobs naturally closed
    deleted: 0      // Jobs soft-deleted (hidden by default)
  }
}
```

### **Admin Dashboard:**

```javascript
// Admin can see all including deleted
GET /admin/jobs?includeDeleted=true

// Admin can restore jobs
PUT /admin/jobs/:id/restore
```

## ⚡ **PERFORMANCE CONSIDERATIONS**

### **Database Indexing:**

```javascript
// Add indexes for better performance
db.jobs.createIndex({ status: 1, employer: 1 });
db.jobs.createIndex({ deletedAt: 1 }); // For cleanup queries
```

### **Cleanup Strategy:**

```javascript
// Optional: Hard delete after X months
const cleanupOldDeletedJobs = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  await Job.deleteMany({
    status: JOB_STATUS.DELETED,
    deletedAt: { $lt: sixMonthsAgo },
  });
};
```

## 🎯 **BENEFITS OF THIS APPROACH**

1. **Data Integrity**: Applications still reference valid jobs
2. **Audit Trail**: Track who deleted what and when
3. **Restore Capability**: Undo accidental deletions
4. **Analytics**: Complete job lifecycle analysis
5. **Compliance**: Meet data retention requirements
6. **Backward Compatibility**: Existing CLOSED jobs still work

## 🚀 **NEXT STEPS**

1. ✅ Update constants (DONE)
2. 🔄 Update delete controller logic
3. 🔄 Update query filters in all job endpoints
4. 🔄 Add restore functionality (optional)
5. 🔄 Update frontend to handle deleted status
6. 🔄 Add cleanup cron job (optional)

**Recommendation: Start with Steps 2-3 for MVP, then add restore/cleanup as enhancements.**
