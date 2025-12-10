const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type TeamRole = "admin" | "hr" | "recruiter" | "interviewer";
export type MemberStatus = "active" | "inactive" | "pending" | "suspended";

export interface TeamMember {
  _id: string;
  email?: string;
  role: TeamRole;
  status: MemberStatus;
  permissions: TeamPermissions;
  invitedBy?: string;
  invitedByUser?: {
    _id: string;
    fullName: string;
    email: string;
  };
  invitedAt?: string;
  joinedAt?: string;
  lastActive?: string;
  expiresAt?: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
}

export interface TeamPermissions {
  // Job management
  canCreateJobs: boolean;
  canEditJobs: boolean;
  canDeleteJobs: boolean;
  canPublishJobs: boolean;

  // Application management
  canViewApplications: boolean;
  canReviewApplications: boolean;
  canRejectApplications: boolean;
  canScheduleInterviews: boolean;
  canSendOffers: boolean;

  // Candidate management
  canSearchCandidates: boolean;
  canViewCandidateDetails: boolean;
  canContactCandidates: boolean;
  canSaveCandidates: boolean;

  // Company management
  canEditProfile: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;

  // Analytics
  canViewAnalytics: boolean;
  canExportData: boolean;

  // AI features
  canUseAIMatching: boolean;
  canUseAIScreening: boolean;
}

export interface InviteMemberPayload {
  email: string;
  role: TeamRole;
  permissions?: Partial<TeamPermissions>;
}

export interface InviteMemberResponse {
  success: boolean;
  message: string;
  data?: {
    invitationId: string;
    email: string;
    role: TeamRole;
    status: MemberStatus;
    expiresAt: string;
  };
  error?: string;
}

export interface GetInvitationsResponse {
  success: boolean;
  message: string;
  data?: {
    invitations: TeamMember[];
    total: number;
    pending: number;
    active: number;
  };
  error?: string;
}

export interface AcceptInvitationPayload {
  token: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  data?: {
    invitationId: string;
    email: string;
    role: TeamRole;
    status: MemberStatus;
    hasAccount?: boolean;
    needsLogin?: boolean;
    needsRegister?: boolean;
  };
  error?: string;
}

export interface UpdateMemberPayload {
  role?: TeamRole;
  permissions?: Partial<TeamPermissions>;
  status?: MemberStatus;
}

export interface VerifyInvitationTokenResponse {
  success: boolean;
  message: string;
  data?: {
    valid: boolean;
    expired: boolean;
    accepted: boolean;
    email: string;
    role: TeamRole;
    companyName: string;
    expiresAt?: string;
  };
  error?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Helper function for API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || "Request failed");
  }

  return response.json();
};

/**
 * Invite a new team member
 */
export const inviteMember = async (
  payload: InviteMemberPayload
): Promise<InviteMemberResponse> => {
  return apiCall<InviteMemberResponse>("/employers/team/invite", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Get all invitations/members
 */
export const getInvitations = async (
  status?: MemberStatus
): Promise<GetInvitationsResponse> => {
  const query = status ? `?status=${status}` : "";
  return apiCall<GetInvitationsResponse>(`/employers/team/invitations${query}`);
};

/**
 * Verify invitation token (public endpoint)
 */
export const verifyInvitationToken = async (
  token: string
): Promise<VerifyInvitationTokenResponse> => {
  return apiCall<VerifyInvitationTokenResponse>(
    `/employers/team/invitations/verify/${token}`
  );
};

/**
 * Accept invitation (public endpoint - token in body)
 * invitationId can be empty string to find by token only
 */
export const acceptInvitation = async (
  invitationId: string,
  payload: AcceptInvitationPayload
): Promise<AcceptInvitationResponse> => {
  const endpoint = invitationId
    ? `/employers/team/invitations/${invitationId}/accept`
    : `/employers/team/invitations/accept`;

  return apiCall<AcceptInvitationResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Reject invitation (public endpoint - token in body)
 */
export const rejectInvitation = async (
  invitationId: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  if (!invitationId) {
    throw new Error("invitationId is required to reject invitation");
  }

  return apiCall(`/employers/team/invitations/${invitationId}/reject`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
};

/**
 * Cancel invitation (owner/admin only)
 */
export const cancelInvitation = async (
  invitationId: string
): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/employers/team/invitations/${invitationId}`, {
    method: "DELETE",
  });
};

/**
 * Resend invitation email (owner/admin only)
 */
export const resendInvitationEmail = async (
  invitationId: string
): Promise<{
  success: boolean;
  message: string;
  data?: {
    invitationId: string;
    email: string;
    role: TeamRole;
    status: MemberStatus;
    expiresAt: string;
    emailSent: boolean;
    emailWarning?: string;
  };
  error?: string;
}> => {
  return apiCall(`/employers/team/invitations/${invitationId}/resend`, {
    method: "POST",
  });
};

/**
 * Update member (role, permissions, status)
 */
export const updateMember = async (
  memberId: string,
  payload: UpdateMemberPayload
): Promise<{
  success: boolean;
  message: string;
  data?: {
    memberId: string;
    role: TeamRole;
    permissions: TeamPermissions;
    status: MemberStatus;
  };
}> => {
  return apiCall(`/employers/team/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/**
 * Get current user's membership in employer team
 */
export const getMyMembership = async (): Promise<{
  success: boolean;
  data?: {
    companyId: string;
    companyName?: string;
    role: TeamRole;
    permissions: TeamPermissions;
    isOwner: boolean;
    status?: MemberStatus;
  };
  message?: string;
  error?: string;
}> => {
  return apiCall(`/employers/team/me`);
};

export const getTeamStats = async (): Promise<{
  success: boolean;
  data?: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    invitesLast7d: number;
    joinsLast7d: number;
    companyName?: string;
  };
  message?: string;
  error?: string;
}> => {
  return apiCall(`/employers/team/stats`);
};

export const getTeamActivity = async (): Promise<{
  success: boolean;
  data?: {
    activities: Array<{
      type: "invite" | "join";
      email?: string;
      role?: string;
      at: string;
      status?: string;
    }>;
    companyName?: string;
  };
  message?: string;
  error?: string;
}> => {
  return apiCall(`/employers/team/activity`);
};

/**
 * Remove member from team
 */
export const removeMember = async (
  memberId: string
): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/employers/team/members/${memberId}`, {
    method: "DELETE",
  });
};

