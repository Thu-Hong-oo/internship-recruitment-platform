# Test Admin Verification API

## Scenario Analysis

### Case 1: Profile with status="verified" but pending document review

- **Profile Status**: `verified` (admin đã approve profile trước đó)
- **Overall Status**: `pending-verification` (documents mới upload chưa verify)
- **Action Needed**: Admin cần review documents mới

### Case 2: Profile with status="pending" and no documents

- **Profile Status**: `pending` (chưa được admin approve)
- **Documents**: 0 (chưa upload gì)
- **Action Needed**: Employer cần upload documents

## Updated Admin API Response

Admin API giờ sẽ cung cấp thêm:

```json
{
  "verification": {
    "reviewStatus": {
      "isPending": true,
      "hasUnverifiedDocs": true,
      "needsAdminAction": true
    }
  },
  "quickActions": {
    "canVerifyDocs": true,
    "needsDocumentReview": true,
    "statusExplanation": "Profile đã verified trước đó, nhưng có documents mới cần review"
  }
}
```

## API Usage for Different Scenarios

```bash
# Xem profiles có documents cần review
GET /admin/verifications?hasDocuments=true

# Xem tất cả profiles bất kể status
GET /admin/verifications?status=all

# Xem profiles đã verified (có thể có docs mới cần review)
GET /admin/verifications?status=verified&hasDocuments=true
```
