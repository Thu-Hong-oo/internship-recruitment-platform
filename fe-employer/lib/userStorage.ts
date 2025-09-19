// Utility functions for managing user data in localStorage

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  authMethod: string;
  isEmailVerified: boolean;
  isActive: boolean;
  avatar?: string;
  googleProfile: any;
  preferences: {
    privacySettings: {
      profileVisibility: string;
      showEmail: boolean;
      showPhone: boolean;
    };
    notifications: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      jobAlerts: boolean;
      applicationUpdates: boolean;
    };
    language: string;
    timezone: string;
  };
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  employerProfile: string;
}

// Lưu user data vào localStorage
export const saveUserData = (user: User): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }
};

// Lấy user data từ localStorage
export const getUserData = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

// Lưu token vào localStorage
export const saveToken = (token: string): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("token", token);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }
};

// Lấy token từ localStorage
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("token");
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

// Xóa tất cả user data (logout)
export const clearUserData = (): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }
};

// Kiểm tra user đã đăng nhập chưa
export const isUserLoggedIn = (): boolean => {
  const token = getToken();
  const user = getUserData();
  return !!(token && user);
};

// Lấy user data từ token (fallback)
export const getUserFromToken = (): Partial<User> | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      email: payload.email || "",
      fullName: payload.fullName || "",
      role: payload.role || "employer",
      authMethod: "local",
      isEmailVerified: payload.isEmailVerified || false,
      isActive: true,
    };
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
};
