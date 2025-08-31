"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // TODO: Implement login logic
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
                  placeholder="Email"
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
                  placeholder="Mật khẩu"
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
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-lg transition-colors duration-200"
            >
              Đăng nhập
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
