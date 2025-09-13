"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { splitFullName, validateEmail, validatePassword } from "@/lib/utils";
import { authAPI } from "@/lib/api";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Đang kiểm tra trạng thái đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  // Don't render the form if user is logged in (will redirect)
  if (user) {
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const validateForm = () => {
    // Validate full name
    if (!formData.fullName.trim()) {
      setError("Vui lòng nhập họ và tên");
      return false;
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      setError("Email không hợp lệ");
      return false;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return false;
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }

    // Validate terms
    if (!formData.agreeToTerms) {
      setError("Vui lòng đồng ý với điều khoản dịch vụ");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { firstName, lastName } = splitFullName(formData.fullName);

      const response = await register({
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        role: "student", // Default role for registration
      });

      if (response.success) {
        // Email is valid and user created, proceed to verification
        setSuccess(response.message || "Đăng ký thành công!");
        // Store email for verification page
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingEmail", formData.email);
        }
        setTimeout(() => {
          router.push("/email-verification");
        }, 2000);
      } else {
        // Registration failed
        if (response.errorType === "INVALID_EMAIL_ADDRESS") {
          setError(
            response.error ||
              "Email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email."
          );
        } else if (response.errorType === "EMAIL_NOT_VERIFIED") {
          setError(
            response.error ||
              "Email này đã được đăng ký nhưng chưa xác thực. Vui lòng kiểm tra email để xác thực hoặc đợi hết hạn để đăng ký lại."
          );
          // Store email for verification page
          if (typeof window !== "undefined") {
            localStorage.setItem("pendingEmail", formData.email);
          }
          // Auto redirect to verification page after 2 seconds
          setTimeout(() => {
            router.push("/email-verification");
          }, 2000);
        } else {
          setError(response.error || response.message || "Đăng ký thất bại");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Registration Form */}
      <div className="flex-[3] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-primary">
              Chào mừng bạn đến với InternBridge
            </h1>
            <p className="text-muted-foreground text-lg">
              Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội thực tập
              lý tưởng
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
              {(error.includes("chưa xác thực") ||
                error.includes("EMAIL_NOT_VERIFIED")) && (
                <Button
                  onClick={() => {
                    console.log("Button clicked, email:", formData.email);
                    // Ensure email is stored before redirecting
                    if (typeof window !== "undefined") {
                      localStorage.setItem("pendingEmail", formData.email);
                      console.log(
                        "Email stored in localStorage:",
                        formData.email
                      );
                    }
                    console.log("Redirecting to email-verification...");
                    router.push("/email-verification");
                  }}
                  className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Kiểm tra email để xác thực
                </Button>
              )}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-foreground"
              >
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  id="fullName"
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Nhập họ tên"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="pl-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  disabled={loading}
                />
              </div>
            </div>

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
                  autoComplete="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  disabled={loading}
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
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pl-10 pr-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và
                số
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="pl-10 pr-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                  handleInputChange("agreeToTerms", checked as boolean)
                }
                className="mt-1"
                disabled={loading}
              />
              <label
                htmlFor="agreeToTerms"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                Tôi đã đọc và đồng ý với{" "}
                <Link
                  href="/terms"
                  className="text-primary hover:underline font-medium"
                >
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link
                  href="/privacy"
                  className="text-primary hover:underline font-medium"
                >
                  Chính sách bảo mật
                </Link>{" "}
                của InternBridge
              </label>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
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
                  Hoặc đăng ký bằng
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-12 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                disabled={loading}
              >
                <span className="font-bold text-lg">G</span>
                <span className="ml-2">Google</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                disabled={loading}
              >
                <span className="font-bold text-lg">f</span>
                <span className="ml-2">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-blue-800 hover:bg-blue-900 text-white border-blue-800 hover:border-blue-900"
                disabled={loading}
              >
                <span className="font-bold text-lg">in</span>
                <span className="ml-2">LinkedIn</span>
              </Button>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Bạn đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Đăng nhập ngay
              </Link>
            </p>
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
