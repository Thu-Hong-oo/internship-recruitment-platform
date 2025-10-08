"use client";

import React, { useState } from "react";
import { CheckCircle, User, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLazyProfile } from "@/hooks/useLazyProfile";
import { useMockProfile } from "@/hooks/useMockProfile";
import AvatarUpload from "@/components/AvatarUpload";
import { getUserAvatar, api } from "@/lib/api";
import { PageLayout } from "@/components/layout";
import LazyEducationSection from "@/components/profile/LazyEducationSection";
import LazyExperienceSection from "@/components/profile/LazyExperienceSection";
import LazySkillsSection from "@/components/profile/LazySkillsSection";

export default function ProfilePage() {
  const { user } = useAuth();

  // Try real API first, fallback to mock data
  const realApi = useLazyProfile();
  const mockApi = useMockProfile();

  // Always use real API first, fallback to mock only on error
  const { profile, loading, errors, fetchProfile, updateProfile } = realApi;

  const [formData, setFormData] = useState({
    fullName:
      user?.fullName ||
      `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
      "",
    phone: "",
    email: user?.email || "",
    bio: "",
  });

  const [settings, setSettings] = useState({
    jobSeeking: false,
    profileVisible: true,
  });

  const [apiStatus, setApiStatus] = useState<"real" | "mock" | "error">("real");

  // Load basic profile data on mount
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile(["progress", "settings"]); // Only load essential data
        setApiStatus("real");

        // Prefill personal info with lib service mapping
        const basic = await api.candidateCV.getMeBasic();
        if (basic?.success && basic.data) {
          setFormData((prev) => ({
            ...prev,
            fullName: basic.data.fullName || prev.fullName,
            phone: basic.data.phone || prev.phone,
            email: basic.data.email || prev.email,
            bio: prev.bio,
          }));
        }
      } catch (error) {
        console.error("Real API failed, using mock data:", error);
        setApiStatus("mock");
      }
    };

    loadProfile();
  }, [fetchProfile]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile("profile", {
        personalInfo: {
          fullName: formData.fullName,
          phone: formData.phone,
          bio: formData.bio,
        },
      });
      console.log("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading.profile) {
    return (
      <PageLayout>
        <div className="bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="animate-pulse">Đang tải thông tin profile...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* API Status Banner */}
          {apiStatus === "mock" && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  DEMO MODE
                </Badge>
                <span className="text-sm text-yellow-700">
                  API không khả dụng, đang sử dụng dữ liệu mẫu
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Profile Overview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                {/* User Header */}
                <div className="text-center">
                  <AvatarUpload
                    currentAvatar={
                      (user ? getUserAvatar(user) : undefined) ||
                      "/placeholder-user.jpg"
                    }
                    userName={formData.fullName}
                    className="mb-4"
                  />

                  <Badge className="bg-green-100 text-green-800 text-xs mb-2">
                    VERIFIED
                  </Badge>

                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Chào bạn trở lại,{" "}
                    <span className="font-bold">{formData.fullName}</span>
                  </h2>

                  <Badge variant="secondary" className="mb-3">
                    {user?.isEmailVerified
                      ? "Tài khoản đã xác thực"
                      : "Chưa xác thực email"}
                  </Badge>
                </div>

                {/* Profile Completion */}
                {profile?.progress && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Hoàn thiện hồ sơ
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {profile.progress.profileCompletion}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${profile.progress.profileCompletion}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

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
                    <span className="text-sm font-medium text-foreground">
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
                  <h3 className="text-sm font-medium text-foreground">
                    Khi có cơ hội việc làm phù hợp, NTD sẽ liên hệ và trao đổi
                    với bạn qua:
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

            {/* Right Column - Profile Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    value="personal"
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Cá nhân
                  </TabsTrigger>
                  <TabsTrigger
                    value="education"
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Học vấn
                  </TabsTrigger>
                  <TabsTrigger
                    value="experience"
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Kinh nghiệm
                  </TabsTrigger>
                  <TabsTrigger
                    value="skills"
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Kỹ năng
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Thông tin cá nhân
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              onChange={(e) =>
                                handleInputChange("phone", e.target.value)
                              }
                              className="h-12 border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>
                        </div>

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

                        <div className="space-y-2">
                          <label
                            htmlFor="bio"
                            className="text-sm font-medium text-gray-700"
                          >
                            Giới thiệu bản thân
                          </label>
                          <textarea
                            id="bio"
                            rows={4}
                            value={formData.bio}
                            onChange={(e) =>
                              handleInputChange("bio", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Viết một vài dòng giới thiệu về bản thân..."
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-lg rounded-lg transition-colors duration-200"
                        >
                          Lưu thông tin
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="education">
                  <LazyEducationSection />
                </TabsContent>

                <TabsContent value="experience">
                  <LazyExperienceSection />
                </TabsContent>

                <TabsContent value="skills">
                  <LazySkillsSection />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
