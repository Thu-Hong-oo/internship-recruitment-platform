"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error/warning/success when user starts typing
    if (error || warning || success) {
      setError(null);
      setWarning(null);
      setErrorType(null);
      setSuccess(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setWarning(null);
    setErrorType(null);
    setSuccess(null);
    setSubmitting(true);
    
    try {
      const res = await login(formData.email, formData.password);
      if (res.success) {
        setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
        setTimeout(() => {
          router.push("/");
        }, 1000);
        return;
      }
      
      // Handle email not verified case
      if (res.errorType === "EMAIL_NOT_VERIFIED" && res.requiresEmailVerification) {
        // Store email for verification
        localStorage.setItem("pendingEmail", formData.email);
        // Redirect to email verification page
        router.push("/email-verification");
        return;
      }
      
      // Handle specific error types
      if (res.errorType === "EMAIL_NOT_REGISTERED") {
        setError("Email này chưa được đăng ký trong hệ thống");
        setWarning("Bạn có thể đăng ký tài khoản mới hoặc kiểm tra lại email");
      } else if (res.errorType === "INVALID_PASSWORD") {
        setError("Mật khẩu không chính xác");
        setWarning("Vui lòng kiểm tra lại mật khẩu hoặc sử dụng tính năng quên mật khẩu");
      } else if (res.errorType === "GOOGLE_OAUTH_REQUIRED") {
        setError("Tài khoản này sử dụng Google OAuth");
        setWarning("Vui lòng đăng nhập bằng Google thay vì mật khẩu");
      } else if (res.errorType === "ACCOUNT_DISABLED") {
        setError("Tài khoản đã bị vô hiệu hóa");
        setWarning("Vui lòng liên hệ hỗ trợ để được hỗ trợ");
      } else {
        setError(res.error || res.message || "Đăng nhập thất bại");
      }
      
      setErrorType(res.errorType || null);
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại");
      setWarning("Vui lòng kiểm tra kết nối mạng và thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="flex-[3] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-primary">
              Chào mừng bạn đã quay trở lại
            </h1>
            <p className="text-muted-foreground text-lg">
              Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội thực tập
              lý tưởng
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="font-medium">{success}</div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {(error || googleError) && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{error || googleError}</div>
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
                    {errorType === "GOOGLE_OAUTH_REQUIRED" && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          className="h-10 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                          onClick={signInWithGoogle}
                          disabled={googleLoading}
                        >
                          <span className="font-bold text-lg">G</span>
                          <span className="ml-2">
                            {googleLoading ? "Đang đăng nhập..." : "Đăng nhập bằng Google"}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Warning Message (when no error) */}
            {warning && !error && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="font-medium">{warning}</div>
                </div>
              </div>
            )}
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="username email"
                  inputMode="email"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pl-10 pr-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-primary hover:underline text-sm font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-primary-foreground font-semibold text-lg rounded-lg transition-colors duration-200"
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          {/* Social Login */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Hoặc đăng nhập bằng
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div id="google-signin-button">
                <Button
                  variant="outline"
                  className="h-12 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                  onClick={signInWithGoogle}
                  disabled={googleLoading}
                >
                  <span className="font-bold text-lg">G</span>
                  <span className="ml-2">
                    {googleLoading ? "Đang đăng nhập..." : "Google"}
                  </span>
                </Button>
              </div>
              <Button
                variant="outline"
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
              >
                <span className="font-bold text-lg">f</span>
                <span className="ml-2">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-blue-800 hover:bg-blue-900 text-white border-blue-800 hover:border-blue-900"
              >
                <span className="font-bold text-lg">in</span>
                <span className="ml-2">LinkedIn</span>
              </Button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Bạn chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Support Contact */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Bạn gặp khó khăn khi đăng nhập? Vui lòng gọi tới số{" "}
              <span className="text-primary font-medium">(024) 6680 5588</span>{" "}
              (giờ hành chính).
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            <p>© 2024. All Rights Reserved. InternBridge Vietnam JSC.</p>
          </div>
        </div>
      </div>

      {/* Right Section - Banner Image */}
      <div className="hidden lg:flex flex-[2] relative overflow-hidden">
        {/* Banner Image */}
        <div className="absolute inset-0">
          <img
            src="/job-recruitment-celebration.png"
            alt="InternBridge Banner - Kết nối thực tập, xây dựng tương lai"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay with text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              InternBridge
            </h1>
          </div>

          {/* Slogan */}
          <div className="mb-6 space-y-2">
            <h2 className="text-5xl font-bold leading-tight drop-shadow-lg">
              Kết nối thực tập
            </h2>
            <h3 className="text-5xl font-bold leading-tight drop-shadow-lg">
              Xây dựng tương lai
            </h3>
          </div>

          {/* Description */}
          <p className="text-xl text-white/95 max-w-md leading-relaxed drop-shadow-lg">
            Nền tảng kết nối sinh viên với cơ hội thực tập chất lượng cao tại
            Việt Nam
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 right-8 flex items-center space-x-2 text-white/80">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Bảo mật - Điều khoản</span>
        </div>
      </div>
    </div>
  );
}
