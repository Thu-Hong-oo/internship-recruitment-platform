# Admin User Tracking Guide

## Từ Employer Response đến Admin Check

### Employer Verification Response (Updated)

```json
{
  "success": true,
  "data": {
    "userId": "68c93d20121d9296ba491716",  // ← USER ID for admin reference
    "status": "verified",
    "overallStatus": "pending-verification",
    "documents": {
      "uploaded": 2,
      "verified": 0,
      "list": [...documents...]
    },
    "adminReference": {
      "profileId": "68cf72c60279e158f3c83a96", // ← Profile ID
      "detailUrl": "/admin/verifications/68c93d20121d9296ba491716"  // ← Direct admin URL
    }
  }
}
```

### Admin Check Process

#### Option 1: Direct URL (Recommended)

```bash
GET /api/admin/verifications/68c93d20121d9296ba491716
```

#### Option 2: Search by Profile ID

```bash
GET /api/admin/verifications?search=68cf72c60279e158f3c83a96
```

#### Option 3: Extract từ Document URL

```
Document URL: https://res.cloudinary.com/.../employers/68c93d20121d9296ba491716/documents/...
                                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                   This is the USER ID
```

## Verification Flow Mapping

### Current Response Analysis:

- **userId**: `68c93d20121d9296ba491716` (owner/user ID)
- **profileId**: `68cf72c60279e158f3c83a96` (employer profile ID)
- **Status**: `verified` + `pending-verification`
- **Issue**: 2 documents uploaded but 0 verified

### Admin Action Required:

```bash
# Check detail
GET /admin/verifications/68c93d20121d9296ba491716

# Verify documents
PUT /admin/employers/68c93d20121d9296ba491716/documents/68cfa81b6302edd0d6d37347/verify
PUT /admin/employers/68c93d20121d9296ba491716/documents/68cfa83d6302edd0d6d3734f/verify
```

## ID Relationships

- **User ID** (`owner`): `68c93d20121d9296ba491716` → Used in admin APIs
- **Profile ID** (`_id`): `68cf72c60279e158f3c83a96` → EmployerProfile document ID
- **Document IDs**: `68cfa81b...`, `68cfa83d...` → Individual document IDs

## Quick Reference

| Scenario           | ID to Use        | Admin Endpoint                                       |
| ------------------ | ---------------- | ---------------------------------------------------- |
| Check verification | User ID          | `/admin/verifications/{userId}`                      |
| Verify document    | User ID + Doc ID | `/admin/employers/{userId}/documents/{docId}/verify` |
| Search profile     | Profile ID       | `/admin/verifications?search={profileId}`            |
