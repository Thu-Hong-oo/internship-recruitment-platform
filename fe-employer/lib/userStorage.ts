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

// Lưu user data vào storage (localStorage nếu remember=true, ngược lại sessionStorage)
export const saveUserData = (user: User, remember: boolean = true): void => {
  if (typeof window !== "undefined") {
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }
};

// Lấy user data từ storage (ưu tiên sessionStorage rồi tới localStorage để hỗ trợ phiên tạm)
export const getUserData = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) return JSON.parse(sessionUser);
    const persistedUser = localStorage.getItem("user");
    return persistedUser ? JSON.parse(persistedUser) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

// Lưu token vào storage (localStorage nếu remember=true, ngược lại sessionStorage)
export const saveToken = (token: string, remember: boolean = true): void => {
  if (typeof window !== "undefined") {
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("token", token);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }
};

// Lấy token từ storage (ưu tiên sessionStorage rồi tới localStorage)
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const sessionToken = sessionStorage.getItem("token");
    if (sessionToken) return sessionToken;
    return localStorage.getItem("token");
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

// Xóa tất cả user data (logout) ở cả sessionStorage và localStorage
export const clearUserData = (): void => {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
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
