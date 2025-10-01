# Fix Admin Get Employer Jobs API

## Problem Identified
Admin API `GET /admin/employers/{id}/jobs` trả về empty vì:
1. **Wrong field name**: Dùng `createdBy` thay vì `postedBy`
2. **Wrong populate**: Populate fields không match với Job schema

## Changes Made

### ✅ Fixed Query Field
```javascript
// Before (Wrong)
const filter = { createdBy: employer._id };

// After (Correct)  
const filter = { postedBy: employer._id };
```

### ✅ Fixed Populate Fields
```javascript
// Before (Wrong)
.populate('company', 'name logo')
.populate('createdBy', 'email profile')

// After (Correct)
.populate('employer', 'company')
.populate('postedBy', 'email fullName')
```

### ✅ Added Statistics
```javascript
// Added statistics like employer API
const statistics = {
  total: allJobs.length,
  byStatus: {
    draft: ...,
    pending: ...,
    active: ...,
    closed: ...,
    rejected: ...
  }
};
```

## Test Admin API

```bash
# Test với user ID từ response employer jobs
GET /api/admin/employers/68c93d20121d9296ba491716/jobs

# Should now return same data as employer API
# but with admin perspective and additional controls
```

## Expected Response Format
```json
{
  "success": true,
  "data": [...jobs...],
  "pagination": {
    "current": 1,
    "pages": 1, 
    "total": 7,
    "limit": 10
  },
  "statistics": {
    "total": 7,
    "byStatus": {
      "draft": 7,
      "pending": 0,
      "active": 0,
      "closed": 0,
      "rejected": 0
    }
  }
}
```