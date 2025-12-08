# Team Invitation API Documentation

## Tổng quan

Hệ thống Team Invitation cho phép employer mời các thành viên khác (HR, Recruiter, Admin, Interviewer) vào team của công ty với các quyền hạn tương ứng theo role.

## Base Path

Tất cả endpoints đều nằm dưới: `/api/employers/team`

## Authentication

Hầu hết các endpoints yêu cầu authentication với Bearer token:
```
Authorization: Bearer <token>
```

Các endpoints public (không cần auth):
- `GET /api/employers/team/invitations/verify/:token`
- `POST /api/employers/team/invitations/:invitationId/accept`
- `POST /api/employers/team/invitations/:invitationId/reject`

---

## Endpoints

### 1. Mời thành viên mới

**POST** `/api/employers/team/invite`

Mời một người mới vào team bằng email.

**Authentication:** ✅ Required (Employer role)

**Request Body:**
```json
{
  "email": "hr@example.com",
  "role": "hr",
  "permissions": {
    // Optional - custom permissions
    "canCreateJobs": true,
    "canEditJobs": true
  }
}
```

**Role Options:**
- `admin` - Toàn quyền quản lý
- `hr` - HR Manager
- `recruiter` - Recruiter
- `interviewer` - Interviewer

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "invitationId": "507f1f77bcf86cd799439011",
    "email": "hr@example.com",
    "role": "hr",
    "status": "pending",
    "expiresAt": "2025-12-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Email đã được mời hoặc invalid role
- `403 Forbidden` - Không có quyền quản lý team
- `404 Not Found` - Employer profile không tồn tại

---

### 2. Lấy danh sách invitations/members

**GET** `/api/employers/team/invitations`

Lấy danh sách tất cả thành viên và invitations (pending, active, inactive, suspended).

**Authentication:** ✅ Required (Employer role)

**Query Parameters:**
- `status` (optional) - Filter theo status: `pending`, `active`, `inactive`, `suspended`

**Example:**
```
GET /api/employers/team/invitations?status=pending
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitations retrieved successfully",
  "data": {
    "invitations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "email": "hr@example.com",
        "role": "hr",
        "status": "pending",
        "permissions": {
          "canCreateJobs": true,
          "canEditJobs": true,
          // ... other permissions
        },
        "invitedBy": "507f1f77bcf86cd799439012",
        "invitedByUser": {
          "_id": "507f1f77bcf86cd799439012",
          "fullName": "John Doe",
          "email": "owner@example.com"
        },
        "invitedAt": "2025-12-08T10:00:00.000Z",
        "joinedAt": null,
        "expiresAt": "2025-12-15T10:00:00.000Z",
        "user": null
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "email": "recruiter@example.com",
        "role": "recruiter",
        "status": "active",
        "user": {
          "_id": "507f1f77bcf86cd799439014",
          "fullName": "Jane Smith",
          "email": "recruiter@example.com",
          "avatar": "https://..."
        },
        "joinedAt": "2025-12-08T11:00:00.000Z"
      }
    ],
    "total": 2,
    "pending": 1,
    "active": 1
  }
}
```

---

### 3. Verify invitation token

**GET** `/api/employers/team/invitations/verify/:token`

Kiểm tra tính hợp lệ của invitation token (public endpoint).

**Authentication:** ❌ Not required

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token verification completed",
  "data": {
    "valid": true,
    "expired": false,
    "accepted": false,
    "email": "hr@example.com",
    "role": "hr",
    "companyName": "ABC Company",
    "expiresAt": "2025-12-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Token không hợp lệ hoặc không tồn tại

---

### 4. Chấp nhận invitation

**POST** `/api/employers/team/invitations/:invitationId/accept`

Chấp nhận lời mời tham gia team (public endpoint - token trong body).

**Authentication:** ❌ Not required (nhưng nếu user đã login, sẽ tự động link với account)

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "invitationId": "507f1f77bcf86cd799439011",
    "email": "hr@example.com",
    "role": "hr",
    "status": "active"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Token không hợp lệ, đã hết hạn, hoặc đã được chấp nhận
- `404 Not Found` - Invitation không tồn tại

---

### 5. Từ chối invitation

**POST** `/api/employers/team/invitations/:invitationId/reject`

Từ chối lời mời tham gia team (public endpoint).

**Authentication:** ❌ Not required

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation rejected successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Token không hợp lệ hoặc invitation đã active
- `404 Not Found` - Invitation không tồn tại

---

### 6. Hủy invitation

**DELETE** `/api/employers/team/invitations/:invitationId`

Hủy một invitation đang pending (chỉ owner/admin mới có quyền).

**Authentication:** ✅ Required (Employer role với quyền canManageTeam)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation cancelled successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Chỉ có thể hủy pending invitations
- `403 Forbidden` - Không có quyền quản lý team
- `404 Not Found` - Invitation không tồn tại

---

### 7. Cập nhật member

**PUT** `/api/employers/team/members/:memberId`

Cập nhật role, permissions, hoặc status của một member.

**Authentication:** ✅ Required (Employer role với quyền canManageTeam)

**Request Body:**
```json
{
  "role": "hr",           // Optional
  "status": "active",     // Optional: active, inactive, suspended
  "permissions": {        // Optional - partial update
    "canCreateJobs": true,
    "canEditJobs": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Member updated successfully",
  "data": {
    "memberId": "507f1f77bcf86cd799439011",
    "role": "hr",
    "permissions": {
      // ... full permissions object
    },
    "status": "active"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid role hoặc status
- `403 Forbidden` - Không có quyền quản lý team
- `404 Not Found` - Member không tồn tại

---

### 8. Xóa member khỏi team

**DELETE** `/api/employers/team/members/:memberId`

Xóa một member khỏi team (chỉ owner/admin mới có quyền).

**Authentication:** ✅ Required (Employer role với quyền canManageTeam)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Không thể xóa owner
- `403 Forbidden` - Không có quyền quản lý team
- `404 Not Found` - Member không tồn tại

---

## Roles và Permissions

### Default Permissions theo Role

#### Admin
- ✅ Tất cả quyền (full access)
- ✅ Quản lý team (canManageTeam)
- ✅ Quản lý billing (canManageBilling)
- ✅ Xem analytics (canViewAnalytics)

#### HR Manager
- ✅ Quản lý jobs và applications
- ✅ Gửi offers (canSendOffers)
- ✅ Quản lý team (canManageTeam)
- ✅ Xem analytics
- ❌ Quản lý billing
- ❌ Sửa company profile

#### Recruiter
- ✅ Tạo và edit jobs
- ✅ Xem và review applications
- ✅ Phỏng vấn
- ✅ Tìm kiếm candidates
- ❌ Gửi offers
- ❌ Quản lý team
- ❌ Xem analytics

#### Interviewer
- ✅ Xem applications
- ✅ Review applications
- ✅ Phỏng vấn
- ❌ Tạo jobs
- ❌ Gửi offers
- ❌ Tìm kiếm candidates
- ❌ Quản lý team

---

## Status Flow

```
pending → active (khi accept invitation)
active → inactive (khi admin vô hiệu hóa)
active → suspended (khi admin tạm khóa)
inactive → active (khi admin kích hoạt lại)
suspended → active (khi admin gỡ khóa)
```

---

## Invitation Expiry

- Invitations tự động hết hạn sau **7 ngày** kể từ ngày gửi
- Expired invitations sẽ không thể được accept
- Owner/admin có thể hủy invitation bất cứ lúc nào

---

## Email Notifications

Khi gửi invitation, hệ thống sẽ tự động gửi email đến địa chỉ được mời với:
- Link để chấp nhận invitation
- Thông tin về role được mời
- Tên công ty
- Thời gian hết hạn (7 ngày)

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input hoặc business logic error |
| 401 | Unauthorized - Missing hoặc invalid token |
| 403 | Forbidden - Không có quyền thực hiện action |
| 404 | Not Found - Resource không tồn tại |
| 500 | Internal Server Error |

---

## Frontend Integration

### Example: Invite Member

```typescript
import { inviteMember } from '@/lib/teamAPI';

const handleInvite = async () => {
  try {
    const response = await inviteMember({
      email: 'hr@example.com',
      role: 'hr'
    });
    
    if (response.success) {
      console.log('Invitation sent!');
    }
  } catch (error) {
    console.error('Failed to invite:', error);
  }
};
```

### Example: Accept Invitation

```typescript
import { acceptInvitation } from '@/lib/teamAPI';

const handleAccept = async (invitationId: string, token: string) => {
  try {
    const response = await acceptInvitation(invitationId, { token });
    
    if (response.success) {
      console.log('Invitation accepted!');
    }
  } catch (error) {
    console.error('Failed to accept:', error);
  }
};
```

---

## Database Schema

Invitations được lưu trong `EmployerProfile.members` array:

```javascript
{
  user: ObjectId,           // Link to User (null nếu chưa accept)
  email: String,            // Email của người được mời
  role: String,             // admin, hr, recruiter, interviewer
  status: String,           // active, inactive, pending, suspended
  permissions: Object,      // Custom permissions object
  invitedBy: ObjectId,      // User ID của người gửi invitation
  invitedAt: Date,          // Ngày gửi invitation
  invitationToken: String,  // Token để accept (sẽ bị xóa sau khi accept)
  expiresAt: Date,          // Ngày hết hạn (7 ngày sau invitedAt)
  joinedAt: Date,           // Ngày accept invitation
  lastActive: Date          // Lần cuối hoạt động
}
```

---

## Security Notes

1. **Token Security**: Invitation tokens được generate bằng `crypto.randomBytes(32)` để đảm bảo tính ngẫu nhiên và bảo mật
2. **Permission Checks**: Tất cả các actions đều kiểm tra quyền `canManageTeam` trước khi thực hiện
3. **Owner Protection**: Owner không thể bị xóa hoặc cập nhật role
4. **Email Validation**: Email được validate và normalize (lowercase) trước khi lưu
5. **Expiry Handling**: Expired invitations không thể được accept

---

## Changelog

### Version 1.0.0 (2025-12-08)
- ✅ Initial implementation
- ✅ Support for 4 roles: admin, hr, recruiter, interviewer
- ✅ Email invitation system
- ✅ Token-based acceptance
- ✅ Permission management
- ✅ Status management (active, inactive, pending, suspended)

---

**Last Updated:** 2025-12-08  
**Author:** InternBridge Development Team

