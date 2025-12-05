import { apiClient } from "../client";
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  EmailValidationResponse,
  UnverifiedAccountResponse,
  User,
} from "../types";

class AuthService {
  async getGoogleAuthUrl(): Promise<{ success: boolean; authUrl?: string }> {
    try {
      return await apiClient.get<{ success: boolean; authUrl?: string }>(
        "/auth/google"
      );
    } catch (e) {
      // Fallback shape
      return { success: false };
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);

    // Store token if registration is successful and token is provided
    if (response.success && response.token) {
      apiClient.setToken(response.token);
    }

    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);

    if (response.success && response.token) {
      apiClient.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      // Notify server to invalidate token
      await apiClient.post<{ success: boolean; message?: string }>(
        "/auth/logout"
      );
    } catch (e) {
      // Ignore server errors; proceed to clear local auth
    } finally {
      apiClient.setToken(null);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const result = await apiClient.get<{ success: boolean; user: User }>(
        "/auth/me"
      );

      if (result.success && result.user) {
        return result.user;
      } else {
        throw new Error("Invalid response format from getCurrentUser");
      }
    } catch (error) {
      throw error;
    }
  }

  // Candidate profile (for CV)
  async getUserProfile(): Promise<any> {
    return apiClient.get<any>("/users/profile");
  }

  async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/verify-email", {
      email,
      otp,
    });

    // Note: Backend doesn't return token on email verification
    // Token is only returned on successful login after email verification
    return response;
  }

  async resendEmailVerification(email: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>("/auth/resend-verification", { email });

    return response;
  }

  async getUnverifiedAccount(
    email: string
  ): Promise<UnverifiedAccountResponse> {
    const response = await apiClient.get<UnverifiedAccountResponse>(
      `/auth/unverified-account?email=${encodeURIComponent(email)}`
    );

    return response;
  }

  async validateEmail(email: string): Promise<EmailValidationResponse> {
    const response = await apiClient.get<EmailValidationResponse>(
      `/auth/validate-email?email=${encodeURIComponent(email)}`
    );

    return response;
  }

  async uploadAvatar(file: File): Promise<{
    success: boolean;
    avatar?: string;
    error?: string;
    user?: User;
  }> {
    const formData = new FormData();
    formData.append("avatar", file);

    // Backend returns: { success, message, data: { avatar: { url, ... }, user: {...} } }
    const response = await apiClient.post<any>("/users/avatar", formData);

    return {
      success: !!response?.success,
      avatar: response?.data?.avatar?.url,
      user: response?.data?.user,
      error: response?.error,
    };
  }

  async googleAuth(idToken: string): Promise<{
    success: boolean;
    token?: string;
    user?: User;
    isNew?: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      token?: string;
      user?: User;
      isNew?: boolean;
      message?: string;
      error?: string;
    }>("/auth/login/google", { idToken });

    // Store token if Google auth is successful
    if (response.success && response.token) {
      apiClient.setToken(response.token);
    }

    return response;
  }
}

export const authService = new AuthService();
