# Admin Verification API Usage Guide

## API Endpoints

### 1. Get Verifications List

```
GET /api/admin/verifications
```

#### Query Parameters:

- `status` - Filter by status:

  - `pending` (default) - Chỉ hiển thị profiles đang chờ duyệt
  - `verified` - Chỉ hiển thị profiles đã được duyệt
  - `rejected` - Chỉ hiển thị profiles bị từ chối
  - `all` - Hiển thị tất cả profiles (bất kể status)

- `hasDocuments=true` - Chỉ profiles có documents
- `industry=technology` - Filter theo ngành nghề
- `search=company_name` - Tìm kiếm theo tên công ty

#### Examples:

```bash
# Xem profiles pending (mặc định)
GET /api/admin/verifications

# Xem profiles đã verified (có documents)
GET /api/admin/verifications?status=verified

# Xem tất cả profiles
GET /api/admin/verifications?status=all

# Xem profiles có documents
GET /api/admin/verifications?hasDocuments=true

# Xem verified profiles có documents
GET /api/admin/verifications?status=verified&hasDocuments=true
```

### 2. Get Verification Details

```
GET /api/admin/verifications/:user_id
```

## Current Data Analysis

### Profile 68cf72c60279e158f3c83a96 (User: 68c93d20121d9296ba491716)

- **Status**: `verified`
- **Documents**: 2 documents (business-license, tax-certificate)
- **Admin Notes**: 3 notes đã approve documents
- **Visibility**:
  - ❌ Không hiện trong `GET /admin/verifications` (chỉ show pending)
  - ✅ Hiện trong `GET /admin/verifications?status=verified`
  - ✅ Hiện trong `GET /admin/verifications?status=all`
  - ✅ Chi tiết đầy đủ trong `GET /admin/verifications/68c93d20121d9296ba491716`

### Profile 68cfbf86f077470c5ba66b55 (User: 68c97bf3f1ea84835814e719)

- **Status**: `pending`
- **Documents**: 0 documents (chưa upload)
- **Missing**: business-license, tax-certificate
- **Visibility**:
  - ✅ Hiện trong `GET /admin/verifications` (status=pending)
  - ✅ Chi tiết trong `GET /admin/verifications/68c97bf3f1ea84835814e719`

## Summary

Hệ thống hoạt động **ĐÚNG** như thiết kế:

1. ✅ **Default behavior**: API chỉ hiển thị `pending` profiles
2. ✅ **Flexible filtering**: Admin có thể query theo status khác nhau
3. ✅ **Document counting**: Đếm documents chính xác
4. ✅ **Status filtering**: Profiles verified không hiện trong pending list

### Để xem profile có documents đã verified:

```bash
GET /api/admin/verifications?status=verified&hasDocuments=true
```

### Để xem tất cả profiles bất kể status:

```bash
GET /api/admin/verifications?status=all
```
