# Team Invitation System - Implementation Summary

## Tổng quan

Đã implement đầy đủ hệ thống mời thành viên vào team company với các role và quyền hạn tương ứng. Hệ thống bao gồm cả backend và frontend (fe-employer).

---

## 📁 Files đã tạo/cập nhật

### Backend

#### 1. Controller
- **`backend/src/controllers/teamInvitationController.js`** (NEW)
  - `inviteMember` - Mời thành viên mới
  - `getInvitations` - Lấy danh sách invitations/members
  - `acceptInvitation` - Chấp nhận invitation
  - `rejectInvitation` - Từ chối invitation
  - `cancelInvitation` - Hủy invitation
  - `updateMember` - Cập nhật member (role, permissions, status)
  - `removeMember` - Xóa member khỏi team
  - `verifyInvitationToken` - Verify invitation token

#### 2. Routes
- **`backend/src/routes/employerProfiles.js`** (UPDATED)
  - Thêm 8 routes mới cho team invitation system

#### 3. Model
- **`backend/src/models/EmployerProfile.js`** (UPDATED)
  - Thêm `email` field vào members schema
  - Thêm `invitationToken` field
  - Thêm `expiresAt` field

### Frontend (fe-employer)

#### 1. API Client
- **`fe-employer/lib/teamAPI.ts`** (NEW)
  - TypeScript types và interfaces
  - API functions cho tất cả endpoints

#### 2. Components
- **`fe-employer/components/team/InviteMemberModal.tsx`** (NEW)
  - Modal để mời thành viên mới
  - Form với email và role selection

#### 3. Pages
- **`fe-employer/app/team/page.tsx`** (NEW)
  - Trang quản lý team members
  - Hiển thị danh sách members
  - Quản lý invitations (cancel, remove, update status)

- **`fe-employer/app/invitations/accept/page.tsx`** (NEW)
  - Trang public để accept/reject invitation
  - Verify token và hiển thị thông tin invitation

### Documentation
- **`backend/TEAM_INVITATION_API.md`** (NEW)
  - Full API documentation
  - Tất cả endpoints với examples
  - Roles và permissions
  - Error codes

---

## 🔌 Endpoints đã thêm

### Base Path: `/api/employers/team`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/team/invite` | ✅ | Mời thành viên mới |
| GET | `/team/invitations` | ✅ | Lấy danh sách invitations/members |
| GET | `/team/invitations/verify/:token` | ❌ | Verify invitation token (public) |
| POST | `/team/invitations/:invitationId?/accept` | ❌ | Chấp nhận invitation (public) |
| POST | `/team/invitations/:invitationId/reject` | ❌ | Từ chối invitation (public) |
| DELETE | `/team/invitations/:invitationId` | ✅ | Hủy invitation |
| PUT | `/team/members/:memberId` | ✅ | Cập nhật member |
| DELETE | `/team/members/:memberId` | ✅ | Xóa member |

**Tổng cộng: 8 endpoints mới**

---

## 👥 Roles và Permissions

### Roles được hỗ trợ:
1. **Admin** - Toàn quyền quản lý
2. **HR Manager** - Quản lý tuyển dụng và team
3. **Recruiter** - Đăng bài và phỏng vấn
4. **Interviewer** - Chỉ phỏng vấn

### Permissions được quản lý:
- Job management (create, edit, delete, publish)
- Application management (view, review, reject, schedule interviews, send offers)
- Candidate management (search, view, contact, save)
- Company management (edit profile, manage team, manage billing)
- Analytics (view, export)
- AI features (matching, screening)

---

## 🔐 Security Features

1. **Token-based Invitations**
   - Secure random tokens (32 bytes)
   - 7-day expiry
   - Auto-cleanup expired invitations

2. **Permission Checks**
   - All actions check `canManageTeam` permission
   - Owner has all permissions
   - Role-based default permissions

3. **Owner Protection**
   - Owner cannot be removed
   - Owner cannot be updated

4. **Email Validation**
   - Email normalization (lowercase)
   - Duplicate check

---

## 📧 Email Integration

- Tự động gửi email khi invite member
- Email chứa:
  - Link để accept invitation
  - Role information
  - Company name
  - Expiry date

**Email Service:** `backend/src/services/notification/emailService.js`

---

## 🎨 Frontend Features

### 1. Invite Member Modal
- Email input với validation
- Role selection với descriptions
- Success/error handling

### 2. Team Management Page
- Dashboard với statistics
- Table hiển thị tất cả members
- Actions:
  - Cancel pending invitations
  - Remove members
  - Update status (active/inactive/suspended)
  - View member details

### 3. Accept Invitation Page
- Public page (không cần login)
- Verify token
- Display invitation details
- Accept/Reject buttons

---

## 📊 Database Schema Changes

### EmployerProfile.members (Updated)

```javascript
{
  user: ObjectId,              // Link to User (null if not accepted)
  email: String,               // NEW: Email for invitation
  role: String,                // admin, hr, recruiter, interviewer
  status: String,              // active, inactive, pending, suspended
  permissions: Object,         // Custom permissions
  invitedBy: ObjectId,         // User who sent invitation
  invitedAt: Date,            // When invitation was sent
  invitationToken: String,     // NEW: Token for acceptance
  expiresAt: Date,            // NEW: Invitation expiry (7 days)
  joinedAt: Date,             // When invitation was accepted
  lastActive: Date            // Last activity
}
```

---

## 🚀 Usage Examples

### Backend: Invite Member

```javascript
POST /api/employers/team/invite
{
  "email": "hr@example.com",
  "role": "hr"
}
```

### Frontend: Invite Member

```typescript
import { inviteMember } from '@/lib/teamAPI';

await inviteMember({
  email: 'hr@example.com',
  role: 'hr'
});
```

### Frontend: Accept Invitation

```typescript
import { acceptInvitation } from '@/lib/teamAPI';

await acceptInvitation('', { token: 'abc123...' });
```

---

## ✅ Testing Checklist

- [ ] Invite member với email hợp lệ
- [ ] Invite member với email đã tồn tại (should fail)
- [ ] Get invitations list
- [ ] Filter invitations by status
- [ ] Verify invitation token
- [ ] Accept invitation với token hợp lệ
- [ ] Accept invitation đã expired (should fail)
- [ ] Reject invitation
- [ ] Cancel pending invitation (owner/admin only)
- [ ] Update member role
- [ ] Update member status
- [ ] Remove member (owner/admin only)
- [ ] Permission checks (canManageTeam)
- [ ] Owner protection (cannot remove/update owner)
- [ ] Email sending

---

## 📝 Notes

1. **Invitation Expiry**: Tự động hết hạn sau 7 ngày
2. **Token Security**: Tokens được generate bằng crypto.randomBytes(32)
3. **Email Service**: Cần cấu hình SMTP trong .env
4. **Frontend URL**: Cần set `FRONTEND_EMPLOYER_URL` trong .env

---

## 🔄 Next Steps (Optional Enhancements)

1. **Resend Invitation**: Cho phép gửi lại email invitation
2. **Bulk Invite**: Mời nhiều members cùng lúc
3. **Role Templates**: Custom permission templates
4. **Activity Log**: Log tất cả actions của members
5. **Notification System**: Thông báo khi có invitation mới
6. **Analytics**: Thống kê về team members activity

---

## 📚 Documentation

Chi tiết đầy đủ về API endpoints xem tại: **`backend/TEAM_INVITATION_API.md`**

---

**Implementation Date:** 2025-12-08  
**Status:** ✅ Complete  
**Version:** 1.0.0

