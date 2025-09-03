"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { User, authAPI, AuthResponse } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "student" | "employer";
  }) => Promise<AuthResponse>; // trả về AuthResponse từ api
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  verifyEmail: (email: string, otp: string) => Promise<AuthResponse>;
  getStoredEmail: () => string | null;
  needsEmailVerification: () => boolean;
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatar?: string; error?: string; user?: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const user = await authAPI.getCurrentUser();
        setUser(user);
      }
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "student" | "employer";
  }) => {
    const response = await authAPI.register(data);
    if (response.success) {
      // Backend trả về token ngay khi đăng ký
      if (response.token) {
        setUser(response.user);
        // Token đã được lưu trong apiClient
      } else {
        // Nếu không có token, chỉ lưu user info và email pending
        setUser(response.user);
        localStorage.setItem("pendingEmail", data.email);
      }
    }
    return response;
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    if (response.success) {
      setUser(response.user);
      // Xóa email pending nếu đăng nhập thành công
      localStorage.removeItem("pendingEmail");
    }
    return response;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    // Xóa email pending khi logout
    localStorage.removeItem("pendingEmail");
  };

  const verifyEmail = async (email: string, otp: string) => {
    const response = await authAPI.verifyEmail(email, otp);
    if (response.success) {
      // Cập nhật user info sau khi xác thực email
      setUser(response.user);
      // Xóa email pending sau khi verify thành công
      localStorage.removeItem("pendingEmail");
      // Note: Backend không trả về token mới, user cần đăng nhập lại
    }
    return response;
  };

  const getStoredEmail = () => {
    return localStorage.getItem("pendingEmail");
  };

  const needsEmailVerification = () => {
    return user !== null && !user.isEmailVerified;
  };

  const uploadAvatar = async (file: File) => {
    const response = await authAPI.uploadAvatar(file);
    if (response.success && response.user) {
      // Cập nhật user với dữ liệu mới từ backend
      setUser(response.user);
    }
    return response;
  };

  return React.createElement(
    AuthContext.Provider, //cung cấp value cho children, bất cứ component nào trong authprovider sẽ có thể truy cập vào context: user, loading, register, login, logout,...
    {
      value: {
        user,
        loading,
        register,
        login,
        logout,
        verifyEmail,
        getStoredEmail,
        needsEmailVerification,
        uploadAvatar,
      },
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
//authprovider gói context provider để cung cấp auth state cho các component con
//useauth để không phải import authcontext ở mọi component
//có authprovider là đủ nhưng không tiện lấy, chỉ có useAuth thì không có provider cung cấp dữ liệu

/**
 *                 (1) Bọc toàn bộ ứng dụng
RootLayout ---------------------------> <AuthProvider>
                                          |
                                          | (2) Cung cấp dữ liệu qua Context.Provider
                                          v
                                -------------------------
                                |      AuthContext      |
                                |  { user, loading,     |
                                |   register, login,    |
                                |   logout }            |
                                -------------------------
                                          |
                                          | (3) Dùng useAuth để lấy dữ liệu
                                          v
                            Component con (Profile, Dashboard...)

 */
