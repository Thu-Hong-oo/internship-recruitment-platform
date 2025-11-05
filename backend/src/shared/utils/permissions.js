/**
 * Role-based permission presets for company members
 */
const ROLE_PERMISSIONS = {
  owner: {
    canPostJobs: true,
    canEditJobs: true,
    canDeleteJobs: true,
    canViewApplications: true,
    canReviewApplications: true,
    canScheduleInterviews: true,
    canManageMembers: true,
    canEditCompanyInfo: true,
  },
  admin: {
    canPostJobs: true,
    canEditJobs: true,
    canDeleteJobs: true,
    canViewApplications: true,
    canReviewApplications: true,
    canScheduleInterviews: true,
    canManageMembers: true,
    canEditCompanyInfo: false,
  },
  recruiter: {
    canPostJobs: true,
    canEditJobs: true,
    canDeleteJobs: false,
    canViewApplications: true,
    canReviewApplications: true,
    canScheduleInterviews: true,
    canManageMembers: false,
    canEditCompanyInfo: false,
  },
  interviewer: {
    canPostJobs: false,
    canEditJobs: false,
    canDeleteJobs: false,
    canViewApplications: true,
    canReviewApplications: true,
    canScheduleInterviews: true,
    canManageMembers: false,
    canEditCompanyInfo: false,
  },
  viewer: {
    canPostJobs: false,
    canEditJobs: false,
    canDeleteJobs: false,
    canViewApplications: true,
    canReviewApplications: false,
    canScheduleInterviews: false,
    canManageMembers: false,
    canEditCompanyInfo: false,
  },
};

/**
 * Get permissions for a role
 */
function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
}

/**
 * Check if user has permission
 */
function hasPermission(employerProfile, permission) {
  if (!employerProfile || !employerProfile.permissions) {
    return false;
  }
  return employerProfile.permissions[permission] === true;
}

/**
 * Check if user can manage members (owner or admin with permission)
 */
function canManageMembers(employerProfile) {
  return (
    employerProfile.role === 'owner' ||
    hasPermission(employerProfile, 'canManageMembers')
  );
}

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  canManageMembers,
};
