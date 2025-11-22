import { User } from "./user.types";

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: "candidate"
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string; // Optional vì register có thể không trả về token
  user?: User; // Optional vì error responses có thể không có user
  message?: string;
  error?: string; // Optional error field
  errorType?: string; // For specific error types
  requiresEmailVerification?: boolean; // For login when email not verified
}

export interface EmailValidationResponse {
  success: boolean;
  data?: {
    email: string;
    userId: string;
    emailStatus: string;
    recentIssues: number;
    lastIssue: string | null;
    isEmailValid: boolean;
  };
  error?: string;
}

export interface UnverifiedAccountResponse {
  success: boolean;
  data?: {
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    verificationExpiry: string;
    timeRemaining: number;
  };
  error?: string;
  expired?: boolean;
}
