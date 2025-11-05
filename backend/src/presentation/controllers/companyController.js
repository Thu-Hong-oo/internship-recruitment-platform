const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');

// @desc    Create company (first-time setup)
// @route   POST /api/employers/company
// @access  Private (Employer without company)
const createCompany = asyncHandler(async (req, res) => {
  try {
    const createCompanyUseCase = req.container.resolve('createCompanyUseCase');

    const result = await createCompanyUseCase.execute({
      userId: req.user.id,
      companyData: req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Công ty đã được tạo thành công',
      data: {
        company: {
          id: result.company.companyId,
          name: result.company.name,
          industry: result.company.industry,
          size: result.company.size,
          website: result.company.website,
          email: result.company.email,
          phone: result.company.phone,
          address: result.company.address,
          isVerified: result.company.isVerified,
          status: result.company.verificationStatus,
        },
        profile: result.profile,
      },
    });
  } catch (error) {
    if (error.message === 'USER_ALREADY_HAS_COMPANY') {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã có công ty rồi',
      });
    }

    logger.error('Create company error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get company info
// @route   GET /api/employers/company
// @access  Private (Employer)
const getCompany = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const result = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    if (result.requiresProfileCreation) {
      return res.status(404).json({
        success: false,
        requiresCompanyCreation: true,
        message: 'Vui lòng tạo công ty trước',
      });
    }

    // Get company details
    const companyRepository = req.container.resolve('companyRepository');
    const company = await companyRepository.findById(result.employer.company);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy thông tin công ty',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: company.companyId,
        name: company.name,
        description: company.description,
        industry: company.industry,
        size: company.size,
        website: company.website,
        email: company.email,
        phone: company.phone,
        logo: company.logoUrl,
        address: company.address,
        businessInfo: {
          taxCode: company.taxCode,
          registrationNumber: company.businessLicenseNumber,
        },
        isVerified: company.isVerified,
        status: company.verificationStatus,
      },
    });
  } catch (error) {
    logger.error('Get company error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update company info
// @route   PATCH /api/employers/company
// @access  Private (Employer with permission)
const updateCompany = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    // Check permissions
    const profileResult = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    if (
      !profileResult.employer.permissions.canEditCompanyInfo &&
      profileResult.employer.role !== 'owner'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền chỉnh sửa thông tin công ty',
      });
    }

    // Update company
    const companyRepository = req.container.resolve('companyRepository');
    const updatedCompany = await companyRepository.update(
      profileResult.employer.company,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin công ty thành công',
      data: {
        id: updatedCompany.companyId,
        name: updatedCompany.name,
        description: updatedCompany.description,
        industry: updatedCompany.industry,
        size: updatedCompany.size,
        website: updatedCompany.website,
        email: updatedCompany.email,
        phone: updatedCompany.phone,
        logo: updatedCompany.logoUrl,
        address: updatedCompany.address,
      },
    });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get company members
// @route   GET /api/employers/company/members
// @access  Private (Employer)
const getCompanyMembers = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    // Get employer profile to get company ID
    const profileResult = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    if (profileResult.requiresProfileCreation) {
      return res.status(404).json({
        success: false,
        error: 'Chưa có công ty',
      });
    }

    const getCompanyMembersUseCase = req.container.resolve(
      'getCompanyMembersUseCase'
    );

    const result = await getCompanyMembersUseCase.execute({
      userId: req.user.id,
      companyId: profileResult.employer.company.toString(),
    });

    res.status(200).json({
      success: true,
      data: result.members,
    });
  } catch (error) {
    logger.error('Get company members error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Invite member to company
// @route   POST /api/employers/company/members/invite
// @access  Private (Employer with permission)
const inviteMember = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const profileResult = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    const inviteMemberUseCase = req.container.resolve('inviteMemberUseCase');

    const result = await inviteMemberUseCase.execute({
      userId: req.user.id,
      companyId: profileResult.employer.company.toString(),
      inviteData: req.body,
    });

    res.status(201).json({
      success: true,
      message: `Đã gửi lời mời đến ${req.body.email}`,
      data: {
        invitation: result.invitation,
        invitationLink: result.invitationLink,
      },
    });
  } catch (error) {
    if (error.message === 'NO_PERMISSION_TO_INVITE') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền mời thành viên',
      });
    }

    if (error.message === 'INVITATION_ALREADY_SENT') {
      return res.status(400).json({
        success: false,
        error: 'Đã gửi lời mời cho email này rồi',
      });
    }

    if (error.message === 'USER_ALREADY_MEMBER') {
      return res.status(400).json({
        success: false,
        error: 'Người dùng đã là thành viên rồi',
      });
    }

    logger.error('Invite member error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update member permissions
// @route   PATCH /api/employers/company/members/:memberId
// @access  Private (Employer with permission)
const updateMemberPermissions = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const profileResult = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    const updateMemberPermissionsUseCase = req.container.resolve(
      'updateMemberPermissionsUseCase'
    );

    const result = await updateMemberPermissionsUseCase.execute({
      userId: req.user.id,
      companyId: profileResult.employer.company.toString(),
      memberId: req.params.memberId,
      updates: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật quyền thành công',
      data: result.member,
    });
  } catch (error) {
    if (error.message === 'NO_PERMISSION_TO_MANAGE') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền quản lý thành viên',
      });
    }

    if (error.message === 'CANNOT_MODIFY_OWNER') {
      return res.status(403).json({
        success: false,
        error: 'Không thể thay đổi quyền của chủ sở hữu',
      });
    }

    logger.error('Update member permissions error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Remove member from company
// @route   DELETE /api/employers/company/members/:memberId
// @access  Private (Employer with permission)
const removeMember = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const profileResult = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    // Check permission
    if (
      !profileResult.employer.permissions.canManageMembers &&
      profileResult.employer.role !== 'owner'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xóa thành viên',
      });
    }

    const employerRepository = req.container.resolve('employerRepository');
    const member = await employerRepository.findById(req.params.memberId);

    if (
      !member ||
      member.company.toString() !== profileResult.employer.company.toString()
    ) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy thành viên',
      });
    }

    if (member.role === 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Không thể xóa chủ sở hữu',
      });
    }

    await employerRepository.delete(req.params.memberId);

    res.status(200).json({
      success: true,
      message: 'Đã xóa thành viên khỏi công ty',
    });
  } catch (error) {
    logger.error('Remove member error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  createCompany,
  getCompany,
  updateCompany,
  getCompanyMembers,
  inviteMember,
  updateMemberPermissions,
  removeMember,
};
