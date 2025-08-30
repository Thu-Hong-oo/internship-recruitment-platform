"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, User, Mail, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // TODO: Implement registration logic
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
                  placeholder="Nhập họ tên"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="pl-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
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
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pl-10 pr-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="pl-10 pr-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            >
              Đăng ký
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
              >
                <span className="font-bold text-lg">G</span>
                <span className="ml-2">Google</span>
              </Button>
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
