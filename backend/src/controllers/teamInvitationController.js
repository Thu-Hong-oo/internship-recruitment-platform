const asyncHandler = require('express-async-handler');
const EmployerProfile = require('../models/EmployerProfile');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { ApiResponse } = require('../utils/responseHandler');
const { AppError } = require('../utils/errors');
const crypto = require('crypto');
const emailService = require('../services/notification/emailService');

/**
 * Team Invitation Controller
 * Quản lý việc mời thành viên vào company team với các role khác nhau
 */

class TeamInvitationController {
  /**
   * POST /api/employers/team/invite
   * Mời thành viên mới vào team
   * 
   * Body: {
   *   email: string (required),
   *   role: 'admin' | 'hr' | 'recruiter' | 'interviewer' (required),
   *   permissions?: object (optional - custom permissions)
   * }
   */
  async inviteMember(req, res) {
    const { email, role, permissions } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!email || !email.trim()) {
      throw new AppError('Email is required', 400);
    }

    const validRoles = ['admin', 'hr', 'recruiter', 'interviewer'];
    if (!role || !validRoles.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
    }

    // Get employer profile
    const profile = await EmployerProfile.findOne({ owner: userId });
    if (!profile) {
      throw new AppError('Employer profile not found', 404);
    }

    // Check if user has permission to manage team
    const canManageTeam = this._checkPermission(profile, userId, 'canManageTeam');
    if (!canManageTeam && profile.owner.toString() !== userId.toString()) {
      throw new AppError('You do not have permission to invite team members', 403);
    }

    // Check if email already exists in members
    const existingMember = profile.members.find(
      m => m.email?.toLowerCase() === email.toLowerCase()
    );
    if (existingMember) {
      throw new AppError('This email has already been invited or is already a member', 400);
    }

    // Check if user with this email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation (as pending member)
    const newMember = {
      email: email.toLowerCase(),
      role: role,
      status: 'pending',
      invitedBy: userId,
      invitedAt: new Date(),
      invitationToken: invitationToken,
      expiresAt: expiresAt,
      permissions: permissions || this._getDefaultPermissions(role),
    };

    // If user exists, link to user account
    if (existingUser) {
      newMember.user = existingUser._id;
    }

    profile.members.push(newMember);
    await profile.save();

    // Send invitation email
    try {
      const invitationLink = `${process.env.FRONTEND_EMPLOYER_URL || 'http://localhost:3002'}/invitations/accept?token=${invitationToken}`;
      await this._sendInvitationEmail(email, role, invitationLink, profile.company.name);
    } catch (emailError) {
      logger.warn('Failed to send invitation email:', emailError.message);
      // Don't fail the request if email fails
    }

    logger.info(`Team invitation sent: ${email} as ${role} by ${userId}`);

    return ApiResponse.success(
      res,
      {
        invitationId: newMember._id,
        email: email,
        role: role,
        status: 'pending',
        expiresAt: expiresAt,
      },
      'Invitation sent successfully'
    );
  }

  /**
   * GET /api/employers/team/invitations
   * Lấy danh sách tất cả invitations (pending, active, etc.)
   */
  async getInvitations(req, res) {
    const userId = req.user.id;
    const { status } = req.query; // optional filter: pending, active, inactive, suspended

    const profile = await EmployerProfile.findOne({ owner: userId });
    if (!profile) {
      throw new AppError('Employer profile not found', 404);
    }

    let members = profile.members;

    // Filter by status if provided
    if (status) {
      members = members.filter(m => m.status === status);
    }

    // Populate user info for accepted members
    const populatedMembers = await Promise.all(
      members.map(async (member) => {
        const memberData = {
          _id: member._id,
          email: member.email,
          role: member.role,
          status: member.status,
          permissions: member.permissions,
          invitedBy: member.invitedBy,
          invitedAt: member.invitedAt,
          joinedAt: member.joinedAt,
          lastActive: member.lastActive,
          expiresAt: member.expiresAt,
        };

        if (member.user) {
          const user = await User.findById(member.user).select('fullName email avatar');
          if (user) {
            memberData.user = {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              avatar: user.avatar,
            };
          }
        }

        // Get inviter info
        if (member.invitedBy) {
          const inviter = await User.findById(member.invitedBy).select('fullName email');
          if (inviter) {
            memberData.invitedByUser = {
              _id: inviter._id,
              fullName: inviter.fullName,
              email: inviter.email,
            };
          }
        }

        return memberData;
      })
    );

    return ApiResponse.success(
      res,
      {
        invitations: populatedMembers,
        total: populatedMembers.length,
        pending: populatedMembers.filter(m => m.status === 'pending').length,
        active: populatedMembers.filter(m => m.status === 'active').length,
      },
      'Invitations retrieved successfully'
    );
  }

  /**
   * POST /api/employers/team/invitations/:invitationId/accept
   * Chấp nhận invitation (public endpoint - không cần auth)
   * 
   * Body: {
   *   token: string (required - invitation token)
   * }
   * 
   * Note: invitationId có thể là empty string, sẽ tìm bằng token
   */
  async acceptInvitation(req, res) {
    const { invitationId } = req.params;
    const { token } = req.body;

    if (!token) {
      throw new AppError('Invitation token is required', 400);
    }

    // Find profile with this invitation token
    let profile;
    let member;

    if (invitationId && invitationId !== '') {
      // If invitationId provided, use it
      profile = await EmployerProfile.findOne({
        'members._id': invitationId,
        'members.invitationToken': token,
      });
      if (profile) {
        member = profile.members.id(invitationId);
      }
    } else {
      // If no invitationId, find by token only
      profile = await EmployerProfile.findOne({
        'members.invitationToken': token,
      });
      if (profile) {
        member = profile.members.find(m => m.invitationToken === token);
      }
    }

    if (!profile || !member) {
      throw new AppError('Invalid invitation token or invitation not found', 404);
    }

    // Check if invitation is expired
    if (member.expiresAt && new Date() > member.expiresAt) {
      throw new AppError('Invitation has expired', 400);
    }

    // Check if already accepted
    if (member.status === 'active') {
      throw new AppError('Invitation has already been accepted', 400);
    }

    // If user is logged in, link to their account
    let userId = null;
    if (req.user) {
      userId = req.user.id;
    } else if (member.user) {
      userId = member.user.toString();
    } else {
      // Check if email matches logged in user
      if (req.user && req.user.email === member.email) {
        userId = req.user.id;
      }
    }

    // Update member status
    member.status = 'active';
    member.joinedAt = new Date();
    if (userId) {
      member.user = userId;
    }
    // Remove token after acceptance
    member.invitationToken = undefined;

    await profile.save();

    logger.info(`Invitation accepted: ${member.email} (${invitationId})`);

    return ApiResponse.success(
      res,
      {
        invitationId: invitationId,
        email: member.email,
        role: member.role,
        status: 'active',
      },
      'Invitation accepted successfully'
    );
  }

  /**
   * POST /api/employers/team/invitations/:invitationId/reject
   * Từ chối invitation
   */
  async rejectInvitation(req, res) {
    const { invitationId } = req.params;
    const { token } = req.body;

    if (!token) {
      throw new AppError('Invitation token is required', 400);
    }

    const profile = await EmployerProfile.findOne({
      'members._id': invitationId,
      'members.invitationToken': token,
    });

    if (!profile) {
      throw new AppError('Invalid invitation token or invitation not found', 404);
    }

    const member = profile.members.id(invitationId);

    if (member.status === 'active') {
      throw new AppError('Cannot reject an active invitation', 400);
    }

    // Remove member from array
    profile.members = profile.members.filter(
      m => m._id.toString() !== invitationId
    );

    await profile.save();

    logger.info(`Invitation rejected: ${member.email} (${invitationId})`);

    return ApiResponse.success(
      res,
      null,
      'Invitation rejected successfully'
    );
  }

  /**
   * DELETE /api/employers/team/invitations/:invitationId
   * Hủy invitation (chỉ owner/admin mới có quyền)
   */
  async cancelInvitation(req, res) {
    const { invitationId } = req.params;
    const userId = req.user.id;

    const profile = await EmployerProfile.findOne({ owner: userId });
    if (!profile) {
      throw new AppError('Employer profile not found', 404);
    }

    // Check permission
    const canManageTeam = this._checkPermission(profile, userId, 'canManageTeam');
    if (!canManageTeam && profile.owner.toString() !== userId.toString()) {
      throw new AppError('You do not have permission to cancel invitations', 403);
    }

    const member = profile.members.id(invitationId);
    if (!member) {
      throw new AppError('Invitation not found', 404);
    }

    // Can only cancel pending invitations
    if (member.status !== 'pending') {
      throw new AppError('Can only cancel pending invitations', 400);
    }

    // Remove from array
    profile.members = profile.members.filter(
      m => m._id.toString() !== invitationId
    );

    await profile.save();

    logger.info(`Invitation cancelled: ${member.email} (${invitationId}) by ${userId}`);

    return ApiResponse.success(
      res,
      null,
      'Invitation cancelled successfully'
    );
  }

  /**
   * PUT /api/employers/team/members/:memberId
   * Cập nhật role hoặc permissions của member
   */
  async updateMember(req, res) {
    const { memberId } = req.params;
    const { role, permissions, status } = req.body;
    const userId = req.user.id;

    const profile = await EmployerProfile.findOne({ owner: userId });
    if (!profile) {
      throw new AppError('Employer profile not found', 404);
    }

    // Check permission
    const canManageTeam = this._checkPermission(profile, userId, 'canManageTeam');
    if (!canManageTeam && profile.owner.toString() !== userId.toString()) {
      throw new AppError('You do not have permission to update team members', 403);
    }

    const member = profile.members.id(memberId);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    // Cannot update owner
    if (member.user && member.user.toString() === profile.owner.toString()) {
      throw new AppError('Cannot update owner information', 400);
    }

    // Update fields
    if (role) {
      const validRoles = ['admin', 'hr', 'recruiter', 'interviewer'];
      if (!validRoles.includes(role)) {
        throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
      }
      member.role = role;
      // Update permissions if role changed
      if (!permissions) {
        member.permissions = this._getDefaultPermissions(role);
      }
    }

    if (permissions) {
      member.permissions = { ...member.permissions, ...permissions };
    }

    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      }
      member.status = status;
    }

    await profile.save();

    logger.info(`Member updated: ${memberId} by ${userId}`);

    return ApiResponse.success(
      res,
      {
        memberId: memberId,
        role: member.role,
        permissions: member.permissions,
        status: member.status,
      },
      'Member updated successfully'
    );
  }

  /**
   * DELETE /api/employers/team/members/:memberId
   * Xóa member khỏi team
   */
  async removeMember(req, res) {
    const { memberId } = req.params;
    const userId = req.user.id;

    const profile = await EmployerProfile.findOne({ owner: userId });
    if (!profile) {
      throw new AppError('Employer profile not found', 404);
    }

    // Check permission
    const canManageTeam = this._checkPermission(profile, userId, 'canManageTeam');
    if (!canManageTeam && profile.owner.toString() !== userId.toString()) {
      throw new AppError('You do not have permission to remove team members', 403);
    }

    const member = profile.members.id(memberId);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    // Cannot remove owner
    if (member.user && member.user.toString() === profile.owner.toString()) {
      throw new AppError('Cannot remove owner from team', 400);
    }

    // Remove from array
    profile.members = profile.members.filter(
      m => m._id.toString() !== memberId
    );

    await profile.save();

    logger.info(`Member removed: ${memberId} by ${userId}`);

    return ApiResponse.success(
      res,
      null,
      'Member removed successfully'
    );
  }

  /**
   * GET /api/employers/team/invitations/verify/:token
   * Verify invitation token (public endpoint)
   */
  async verifyInvitationToken(req, res) {
    const { token } = req.params;

    const profile = await EmployerProfile.findOne({
      'members.invitationToken': token,
    });

    if (!profile) {
      throw new AppError('Invalid invitation token', 404);
    }

    const member = profile.members.find(m => m.invitationToken === token);

    if (!member) {
      throw new AppError('Invitation not found', 404);
    }

    // Check if expired
    const isExpired = member.expiresAt && new Date() > member.expiresAt;
    const isAccepted = member.status === 'active';

    return ApiResponse.success(
      res,
      {
        valid: !isExpired && !isAccepted,
        expired: isExpired,
        accepted: isAccepted,
        email: member.email,
        role: member.role,
        companyName: profile.company.name,
        expiresAt: member.expiresAt,
      },
      'Token verification completed'
    );
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Check if user has permission
   */
  _checkPermission(profile, userId, permission) {
    // Owner has all permissions
    if (profile.owner.toString() === userId.toString()) {
      return true;
    }

    const member = profile.members.find(
      m => m.user && m.user.toString() === userId.toString() && m.status === 'active'
    );

    if (!member) return false;
    return member.permissions[permission] === true;
  }

  /**
   * Get default permissions for role
   */
  _getDefaultPermissions(role) {
    const defaultPermissions = {
      admin: {
        canCreateJobs: true,
        canEditJobs: true,
        canDeleteJobs: true,
        canPublishJobs: true,
        canViewApplications: true,
        canReviewApplications: true,
        canRejectApplications: true,
        canScheduleInterviews: true,
        canSendOffers: true,
        canSearchCandidates: true,
        canViewCandidateDetails: true,
        canContactCandidates: true,
        canSaveCandidates: true,
        canEditProfile: true,
        canManageTeam: true,
        canManageBilling: false,
        canViewAnalytics: true,
        canExportData: true,
        canUseAIMatching: true,
        canUseAIScreening: true,
      },
      hr: {
        canCreateJobs: true,
        canEditJobs: true,
        canDeleteJobs: false,
        canPublishJobs: true,
        canViewApplications: true,
        canReviewApplications: true,
        canRejectApplications: true,
        canScheduleInterviews: true,
        canSendOffers: true,
        canSearchCandidates: true,
        canViewCandidateDetails: true,
        canContactCandidates: true,
        canSaveCandidates: true,
        canEditProfile: false,
        canManageTeam: true,
        canManageBilling: false,
        canViewAnalytics: true,
        canExportData: true,
        canUseAIMatching: true,
        canUseAIScreening: true,
      },
      recruiter: {
        canCreateJobs: true,
        canEditJobs: true,
        canDeleteJobs: false,
        canPublishJobs: true,
        canViewApplications: true,
        canReviewApplications: true,
        canRejectApplications: true,
        canScheduleInterviews: true,
        canSendOffers: false,
        canSearchCandidates: true,
        canViewCandidateDetails: true,
        canContactCandidates: true,
        canSaveCandidates: true,
        canEditProfile: false,
        canManageTeam: false,
        canManageBilling: false,
        canViewAnalytics: false,
        canExportData: false,
        canUseAIMatching: true,
        canUseAIScreening: false,
      },
      interviewer: {
        canCreateJobs: false,
        canEditJobs: false,
        canDeleteJobs: false,
        canPublishJobs: false,
        canViewApplications: true,
        canReviewApplications: true,
        canRejectApplications: false,
        canScheduleInterviews: true,
        canSendOffers: false,
        canSearchCandidates: false,
        canViewCandidateDetails: true,
        canContactCandidates: false,
        canSaveCandidates: false,
        canEditProfile: false,
        canManageTeam: false,
        canManageBilling: false,
        canViewAnalytics: false,
        canExportData: false,
        canUseAIMatching: false,
        canUseAIScreening: false,
      },
    };

    return defaultPermissions[role] || defaultPermissions.recruiter;
  }

  /**
   * Send invitation email
   */
  async _sendInvitationEmail(email, role, invitationLink, companyName) {
    const subject = `Bạn được mời tham gia team ${companyName} trên InternBridge`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Lời mời tham gia team</h2>
        <p>Xin chào,</p>
        <p>Bạn đã được mời tham gia team <strong>${companyName}</strong> với vai trò <strong>${role}</strong> trên nền tảng InternBridge.</p>
        <p>Vui lòng click vào link bên dưới để chấp nhận lời mời:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Chấp nhận lời mời
          </a>
        </p>
        <p>Link này sẽ hết hạn sau 7 ngày.</p>
        <p>Nếu bạn không mong muốn nhận lời mời này, bạn có thể bỏ qua email này.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Email này được gửi tự động từ hệ thống InternBridge.</p>
      </div>
    `;

    await emailService.sendMail({
      to: email,
      subject: subject,
      html: html,
    });
  }
}

const controller = new TeamInvitationController();

module.exports = {
  inviteMember: asyncHandler(controller.inviteMember.bind(controller)),
  getInvitations: asyncHandler(controller.getInvitations.bind(controller)),
  acceptInvitation: asyncHandler(controller.acceptInvitation.bind(controller)),
  rejectInvitation: asyncHandler(controller.rejectInvitation.bind(controller)),
  cancelInvitation: asyncHandler(controller.cancelInvitation.bind(controller)),
  updateMember: asyncHandler(controller.updateMember.bind(controller)),
  removeMember: asyncHandler(controller.removeMember.bind(controller)),
  verifyInvitationToken: asyncHandler(controller.verifyInvitationToken.bind(controller)),
};

