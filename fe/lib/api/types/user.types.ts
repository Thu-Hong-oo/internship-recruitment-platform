export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string; // URL của avatar
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "candidate" | "employer" | "admin";
  fullName: string;
  authMethod: "local" | "google";
  isEmailVerified: boolean;
  profile?: UserProfile; // Profile object từ backend
  avatar?: string; // Fallback cho avatar trực tiếp
}

// Helper function to get avatar URL from user object
export const getUserAvatar = (user: User | null): string | undefined => {
  if (!user) return undefined;
  return user.profile?.avatar || user.avatar;
};
