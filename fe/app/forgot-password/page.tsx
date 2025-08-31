"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, Heart, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState({
    email: "",
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
    // TODO: Implement password reset logic
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Forgot Password Form */}
      <div className="flex-[3] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-primary">Quên mật khẩu</h1>
          </div>

          {/* Forgot Password Form */}
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
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 h-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Information Text */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Bằng việc thực hiện đổi mật khẩu, bạn đã đồng ý với{" "}
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
                của chúng tôi
              </p>
            </div>

            {/* Reset Password Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-lg transition-colors duration-200"
            >
              Tạo lại mật khẩu
            </Button>
          </form>

          {/* Navigation Links */}
          <div className="flex justify-between items-center">
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Quay lại đăng nhập
            </Link>
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Đăng ký tài khoản mới
            </Link>
          </div>

          {/* Support Information */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Bạn gặp khó khăn khi tạo tài khoản? Vui lòng gọi tới số{" "}
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

      {/* Right Section - Branding */}
      <div className="hidden lg:flex flex-[2] relative overflow-hidden">
        {/* Background with pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
          {/* Abstract dotted pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bottom-20 right-20 w-32 h-32 border-2 border-white/30 rounded-full"></div>
            <div className="absolute bottom-40 right-40 w-24 h-24 border-2 border-white/20 rounded-full"></div>
            <div className="absolute top-20 right-20 w-40 h-40 border-2 border-white/25 rounded-full"></div>
            <div className="absolute top-40 right-40 w-16 h-16 border-2 border-white/15 rounded-full"></div>
          </div>
        </div>

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
              Tiếp lợi thế
            </h2>
            <h3 className="text-5xl font-bold leading-tight drop-shadow-lg">
              Nối thành công
            </h3>
          </div>

          {/* Description */}
          <p className="text-xl text-white/95 max-w-md leading-relaxed drop-shadow-lg">
            InternBridge - Hệ sinh thái nhân sự tiên phong ứng dụng công nghệ
            tại Việt Nam
          </p>
        </div>
      </div>
    </div>
  );
}
