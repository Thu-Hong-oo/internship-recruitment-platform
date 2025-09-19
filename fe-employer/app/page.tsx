"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveUserData, saveToken } from "@/lib/userStorage";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setWarning(null);
    setErrorType(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (data?.success) {
        // Lưu token và user data sử dụng utility functions
        if (data?.token) {
          saveToken(data.token);
        }
        if (data?.user) {
          saveUserData(data.user);
        }
        setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
        setTimeout(() => router.push("/dashboard"), 1000);
        return;
      }

      // EMAIL_NOT_VERIFIED: chuyển qua xác thực
      if (
        data?.errorType === "EMAIL_NOT_VERIFIED" &&
        data?.requiresEmailVerification
      ) {
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingEmail", email);
        }
        router.push("/email-verification");
        return;
      }

      // Các lỗi cụ thể
      if (data?.errorType === "EMAIL_NOT_REGISTERED") {
        setError("Email này chưa được đăng ký trong hệ thống");
        setWarning("Bạn có thể đăng ký tài khoản mới hoặc kiểm tra lại email");
      } else if (data?.errorType === "INVALID_PASSWORD") {
        setError("Mật khẩu không chính xác");
        setWarning(
          "Vui lòng kiểm tra lại mật khẩu hoặc sử dụng tính năng quên mật khẩu"
        );
      } else if (data?.errorType === "GOOGLE_OAUTH_REQUIRED") {
        setError("Tài khoản này sử dụng Google OAuth");
        setWarning("Vui lòng đăng nhập bằng Google thay vì mật khẩu");
      } else if (data?.errorType === "ACCOUNT_DISABLED") {
        setError("Tài khoản đã bị vô hiệu hóa");
        setWarning("Vui lòng liên hệ hỗ trợ để được hỗ trợ");
      } else {
        setError(data?.error || data?.message || "Đăng nhập thất bại");
      }
      setErrorType(data?.errorType || null);
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại");
      setWarning("Vui lòng kiểm tra kết nối mạng và thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-slate-800">top</span>
              <span className="text-2xl font-bold text-primary">cv</span>
              <span className="text-primary text-sm">®</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Chào mừng bạn đã quay trở lại
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Cùng tạo dựng lợi thế cho doanh nghiệp bằng trải nghiệm công nghệ
              tuyển dụng ứng dụng sâu AI & Hiring Funnel
            </p>
          </div>

          {/* Google Login Button */}
          <Button
            variant="outline"
            className="w-full mb-6 h-12 bg-primary hover:brightness-110 text-white border-primary"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Đăng nhập bằng Google
          </Button>

          {/* Messages */}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="font-medium">{success}</div>
              </div>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{error}</div>
                  {warning && (
                    <div className="mt-1 text-red-500">{warning}</div>
                  )}
                  {errorType === "EMAIL_NOT_REGISTERED" && (
                    <div className="mt-2">
                      <Link
                        href="/register"
                        className="text-primary hover:underline font-medium inline-flex items-center"
                      >
                        Đăng ký tài khoản mới →
                      </Link>
                    </div>
                  )}
                  {errorType === "INVALID_PASSWORD" && (
                    <div className="mt-2">
                      <Link
                        href="/forgot-password"
                        className="text-primary hover:underline font-medium inline-flex items-center"
                      >
                        Quên mật khẩu? →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <Link
              href="/forgot-password"
              className="text-primary hover:brightness-110 text-sm"
            >
              Quên mật khẩu
            </Link>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 bg-primary hover:brightness-110 text-white font-medium mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <span className="text-slate-600 text-sm">Chưa có tài khoản? </span>
            <Link
              href="/register"
              className="text-primary hover:brightness-110 text-sm font-medium"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-primary text-sm">
            ©2014-2025 InternBridge Vietnam JSC. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center relative overflow-hidden">
        <div className="text-center z-10">
          <h2 className="text-white text-3xl font-bold mb-4">
            Track your funnel with <span className="text-primary">Report</span>
          </h2>

          {/* 3D Illustration Placeholder */}
          <div className="relative w-96 h-96 mx-auto">
            <div className="absolute inset-0 bg-primary/30 rounded-3xl transform rotate-12 opacity-20"></div>
            <div className="absolute inset-4 bg-primary/40 rounded-2xl transform -rotate-6 opacity-30"></div>
            <div className="absolute inset-8 bg-primary rounded-xl flex items-center justify-center">
              <div className="text-white text-6xl">📊</div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl animate-bounce">
              ⭐
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-xl animate-pulse">
              📈
            </div>
          </div>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-2 h-2 bg-primary rounded-full"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-primary/80 rounded-full"></div>
          <div className="absolute bottom-32 left-16 w-3 h-3 bg-primary rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-primary rounded-full"></div>
        </div>

        {/* Bottom logo */}
        <div className="absolute bottom-8 right-8">
          <div className="flex items-center gap-1 text-white">
            <span className="text-xl font-bold">top</span>
            <span className="text-xl font-bold text-primary">cv</span>
          </div>
          <p className="text-primary text-xs mt-1">
            Tiếp lợi thế, nối thành công
          </p>
        </div>

        {/* Pagination dots */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
