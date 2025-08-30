"use client";

import React, { useState } from "react";
import { Camera, ArrowUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: "Vẹt Con",
    phone: "",
    email: "boilenlanxuong@gmail.com",
  });

  const [settings, setSettings] = useState({
    jobSeeking: false,
    profileVisible: true,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingChange = (field: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // TODO: Implement save logic
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Information Settings Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Cài đặt thông tin cá nhân
              </h1>
              <p className="text-red-500 text-sm mb-6">
                (*) Các thông tin bắt buộc
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="h-12 border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Số điện thoại
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-12 border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="h-12 border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Save Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-lg rounded-lg transition-colors duration-200"
                >
                  Lưu
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - User Profile Summary and Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* User Header */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src="/placeholder-user.jpg"
                      alt="User avatar"
                    />
                    <AvatarFallback className="text-2xl">VC</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>

                <Badge className="bg-green-100 text-green-800 text-xs mb-2">
                  VERIFIED
                </Badge>

                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Chào bạn trở lại,{" "}
                  <span className="font-bold">{formData.fullName}</span>
                </h2>

                <Badge variant="secondary" className="mb-3">
                  Tài khoản đã xác thực
                </Badge>

              </div>

              {/* Job Seeking Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {settings.jobSeeking
                      ? "Đang Bật tìm việc"
                      : "Đang Tắt tìm việc"}
                  </span>
                  <Switch
                    checked={settings.jobSeeking}
                    onCheckedChange={(checked) =>
                      handleSettingChange("jobSeeking", checked)
                    }
                  />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Bật tìm việc giúp hồ sơ của bạn nổi bật hơn và được chú ý
                  nhiều hơn trong danh sách tìm kiếm của NTD.
                </p>
              </div>

              {/* Profile Visibility */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Cho phép NTD tìm kiếm hồ sơ
                  </span>
                  <Switch
                    checked={settings.profileVisible}
                    onCheckedChange={(checked) =>
                      handleSettingChange("profileVisible", checked)
                    }
                  />
                </div>
              </div>

              {/* Contact Preferences */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Khi có cơ hội việc làm phù hợp, NTD sẽ liên hệ và trao đổi với
                  bạn qua:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">
                      Nhắn tin qua hệ thống InternBridge
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">
                      Email và Số điện thoại của bạn
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
