"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Settings,
  CheckCircle2,
  FileText,
  User,
  Bell,
  Heart,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { savedJobService } from "@/lib/api";
import type { SavedJob } from "@/lib/api/services/savedJob.service";
import { getNotifications } from "@/lib/notificationAPI";
import { AINavigationInput } from "@/components/ai/AINavigationInput";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appliedJobsCount, setAppliedJobsCount] = useState(3);
  const [unreadNotifications, setUnreadNotifications] = useState(4);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [savedJobsList, setSavedJobsList] = useState<SavedJob[]>([]);
  const [onlineCvs, setOnlineCvs] = useState<
    Array<{ templateId: string; resumeId: string; templateName: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<SavedJob[]>([]);

  // Kiểm tra token ngay lập tức khi component mount
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/home");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    // Chỉ fetch data khi đã xác thực
    if (!isAuthenticated) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch applied jobs count
        const applicationsRes = await api.candidateCV.getApplications({
          page: 1,
          limit: 1,
        });
        if (applicationsRes?.success && applicationsRes.data) {
          setAppliedJobsCount(applicationsRes.data.pagination?.total || 0);
        }

        // Fetch notifications count
        const notificationsRes = await getNotifications(token, {
          page: 1,
          limit: 1,
        });
        if (notificationsRes?.success) {
          setUnreadNotifications(notificationsRes.unreadCount || 0);
        }

        // Fetch saved jobs (3 latest)
        const savedJobsRes = await api.savedJobs.getSavedJobs({ limit: 3 });
        if (savedJobsRes?.success) {
          if (savedJobsRes.pagination) {
            setSavedJobsCount(savedJobsRes.pagination.total || 0);
          }
          if (savedJobsRes.data) {
            setSavedJobsList(savedJobsRes.data.slice(0, 3));
          }
        }

        // Fetch profile completion
        const profileRes = await api.candidateCV.getMeRaw();
        if (profileRes?.success && profileRes.data) {
          const completion = profileRes.data.progress?.profileCompletion || 0;
          setProfileCompletion(completion);
        }

        // Filter saved jobs with upcoming deadlines (within 7 days)
        if (savedJobsRes?.success && savedJobsRes.data) {
          const now = new Date();
          const sevenDaysLater = new Date(
            now.getTime() + 7 * 24 * 60 * 60 * 1000
          );

          const upcoming = savedJobsRes.data.filter((savedJob) => {
            const deadline = savedJob.jobId?.deadline;
            if (!deadline) return false;
            const deadlineDate = new Date(deadline);
            return deadlineDate >= now && deadlineDate <= sevenDaysLater;
          });

          // Sort by deadline (soonest first)
          upcoming.sort((a, b) => {
            const dateA = new Date(a.jobId?.deadline || 0).getTime();
            const dateB = new Date(b.jobId?.deadline || 0).getTime();
            return dateA - dateB;
          });

          setUpcomingDeadlines(upcoming.slice(0, 5)); // Top 5
        }

        // Fetch CV online (ResumeBuilder CVs)
        const templateMapRes = await api.candidateCV.getTemplateResumeMap();
        if (templateMapRes?.success && templateMapRes.data?.map) {
          const map = templateMapRes.data.map;
          const templatesRes = await api.candidateCV.getTemplates();

          const cvList: Array<{
            templateId: string;
            resumeId: string;
            templateName: string;
          }> = [];

          if (templatesRes?.success && templatesRes.data?.templates) {
            // Lấy tên template từ danh sách templates
            const templateNameMap: Record<string, string> = {};
            templatesRes.data.templates.forEach((t: any) => {
              templateNameMap[t.id] = t.name || t.id;
            });

            // Tạo danh sách CV online từ map
            Object.entries(map).forEach(([templateId, resumeId]) => {
              cvList.push({
                templateId,
                resumeId: resumeId as string,
                templateName: templateNameMap[templateId] || templateId,
              });
            });
          } else {
            // Nếu không lấy được templates, dùng templateId làm tên
            Object.entries(map).forEach(([templateId, resumeId]) => {
              cvList.push({
                templateId,
                resumeId: resumeId as string,
                templateName: templateId,
              });
            });
          }

          setOnlineCvs(cvList.slice(0, 3)); // Hiển thị tối đa 3 CV
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, isAuthenticated]);

  // Không render nếu chưa xác thực
  if (!isAuthenticated) {
    return null;
  }

  const userName = user?.fullName || user?.firstName || "Ứng Viên";

  const primaryColor = "oklch(0.60 0.12 195)";
  const primaryGradient = `linear-gradient(135deg, ${primaryColor} 0%, oklch(0.72 0.08 210) 55%, oklch(0.88 0.03 195) 100%)`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,oklch(0.97_0.02_210)_0%,white_30%)]">
      {/* Welcome Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: primaryGradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.60_0.12_195/.2)_0%,transparent_70%)]" />
        <div
          className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.60_0.12_195/.25),transparent_70%)] blur-3xl"
          style={{ animation: "float 20s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute right-[-120px] bottom-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.72_0.08_210/.2),transparent_75%)] blur-3xl"
          style={{ animation: "float 25s ease-in-out infinite reverse" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                Chào mừng, {userName}
              </h1>
              <p className="text-white/95 font-medium">
                Quản lý hồ sơ và theo dõi ứng tuyển của bạn
              </p>
            </div>
            {/* AI Navigation Input */}
            <div className="flex-1 max-w-2xl">
              <AINavigationInput
                frontend="fe"
                placeholder="Nhập hoặc nói điều bạn muốn làm... (ví dụ: tìm việc IT ở Sài Gòn, về trang chủ)"
                className="w-full"
                variant="banner"
              />
            </div>
            <Button
              onClick={() => router.push("/home")}
              className="bg-white text-[oklch(0.60_0.12_195)] hover:bg-white/95 font-semibold shadow-lg"
            >
              Đến trang chủ
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen overflow-hidden pb-20">
        <div
          className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.70_0.12_195/.15),transparent_70%)] blur-3xl"
          style={{ animation: "float 20s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute right-[-120px] top-80 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.08_210/.12),transparent_75%)] blur-3xl"
          style={{ animation: "float 25s ease-in-out infinite reverse" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Profile Completion */}
          {profileCompletion > 0 && profileCompletion < 100 && (
            <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,45,95,0.08)] mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Hoàn thiện hồ sơ
                  </h3>
                  <span className="text-sm font-semibold text-slate-600">
                    {profileCompletion}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${profileCompletion}%`,
                      background: primaryGradient,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Hoàn thiện hồ sơ để tăng cơ hội được nhà tuyển dụng chú ý
                </p>
                <Button
                  onClick={() => router.push("/profile")}
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-xs"
                  style={{ color: primaryColor }}
                >
                  Hoàn thiện ngay →
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Middle Column - Job Applications & Submitted CVs */}
            <div className="lg:col-span-8 space-y-6">
              {/* Upcoming Deadlines */}
              {upcomingDeadlines.length > 0 && (
                <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,45,95,0.08)]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Deadline sắp đến
                      </h3>
                      <Badge
                        className="border-none"
                        style={{
                          background: `oklch(0.60 0.12 195 / 0.15)`,
                          color: primaryColor,
                        }}
                      >
                        {upcomingDeadlines.length} việc
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {upcomingDeadlines.map((savedJob) => {
                        const job = savedJob.jobId;
                        if (!job) return null;
                        const deadline = job.deadline
                          ? new Date(job.deadline)
                          : null;
                        const now = new Date();
                        const daysLeft = deadline
                          ? Math.ceil(
                              (deadline.getTime() - now.getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          : null;
                        const isUrgent = daysLeft !== null && daysLeft < 3;

                        return (
                          <Link
                            key={savedJob._id}
                            href={`/jobs/${job._id}`}
                            className="block"
                          >
                            <div
                              className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:shadow-md ${
                                isUrgent
                                  ? "bg-red-50 border border-red-200"
                                  : "bg-orange-50 border border-orange-200"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {job.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-600">
                                    {job.employer?.company?.name ||
                                      "Nhà tuyển dụng"}
                                  </span>
                                  {deadline && (
                                    <>
                                      <span className="text-xs text-slate-400">
                                        •
                                      </span>
                                      <span
                                        className={`text-xs font-semibold ${
                                          isUrgent
                                            ? "text-red-600"
                                            : "text-orange-600"
                                        }`}
                                      >
                                        {daysLeft === 0
                                          ? "Hôm nay"
                                          : daysLeft === 1
                                          ? "Ngày mai"
                                          : `${daysLeft} ngày nữa`}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge
                                className={`border-none flex-shrink-0 ${
                                  isUrgent
                                    ? "bg-red-500 text-white"
                                    : "bg-orange-500 text-white"
                                }`}
                              >
                                {isUrgent ? "Gấp" : "Sắp đến"}
                              </Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link href="/jobs/saved-jobs">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-4"
                        style={{ color: primaryColor }}
                      >
                        Xem tất cả →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Saved Jobs Waiting */}
              <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,45,95,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Có {savedJobsCount} việc làm đã lưu đang đợi bạn ứng tuyển
                    </h3>
                    <Link href="/jobs/saved-jobs">
                      <Button variant="ghost" size="sm">
                        Xem tất cả
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-4 text-slate-500">
                        Đang tải...
                      </div>
                    ) : savedJobsList.length > 0 ? (
                      savedJobsList.map((savedJob) => {
                        const job = savedJob.jobId;
                        if (!job) return null;
                        const companyName =
                          job.employer?.company?.name || "Nhà tuyển dụng";
                        const location = job.address?.city || "Không xác định";
                        return (
                          <Link
                            key={savedJob._id}
                            href={`/jobs/${job._id}`}
                            className="block"
                          >
                            <div
                              className="flex items-center justify-between p-3 rounded-lg transition-colors hover:shadow-md"
                              style={{
                                background:
                                  "linear-gradient(135deg, oklch(0.60 0.12 195 / 0.08) 0%, transparent 70%)",
                              }}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Heart
                                  className="w-5 h-5 flex-shrink-0"
                                  style={{ color: primaryColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {job.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-600 truncate">
                                      {companyName}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      •
                                    </span>
                                    <span className="text-xs text-slate-600 truncate">
                                      {location}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                className="border-none flex-shrink-0"
                                style={{
                                  background: `oklch(0.60 0.12 195 / 0.15)`,
                                  color: primaryColor,
                                }}
                              >
                                Đã lưu
                              </Badge>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        Chưa có việc làm đã lưu
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CV Online */}
              <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,45,95,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      CV Online ({onlineCvs.length})
                    </h3>
                    <Link href="/my-cv/templates">
                      <Button variant="ghost" size="sm">
                        Xem tất cả
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-4 text-slate-500">
                        Đang tải...
                      </div>
                    ) : onlineCvs.length > 0 ? (
                      onlineCvs.map((cv) => (
                        <Link
                          key={cv.resumeId}
                          href={`/my-cv/new?template=${cv.templateId}&resumeId=${cv.resumeId}`}
                          className="block"
                        >
                          <div
                            className="flex items-center justify-between p-3 rounded-lg transition-colors hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.60 0.12 195 / 0.08) 0%, transparent 70%)",
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: primaryColor }}
                              />
                              <span className="text-sm font-medium text-slate-700 truncate">
                                {cv.templateName}
                              </span>
                            </div>
                            <Badge
                              className="border-none flex-shrink-0"
                              style={{
                                background: `oklch(0.60 0.12 195 / 0.15)`,
                                color: primaryColor,
                              }}
                            >
                              Online
                            </Badge>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        Chưa có CV online.{" "}
                        <Link
                          href="/my-cv/templates"
                          className="hover:underline"
                          style={{ color: primaryColor }}
                        >
                          Tạo CV mới
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar Navigation */}
            <div className="lg:col-span-4">
              <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,45,95,0.08)]">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Quản Lý Chung
                  </h3>
                  <nav className="space-y-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <User
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Quản Lý Thông Tin
                      </span>
                    </Link>
                    <Link
                      href="/my-cv"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <FileText
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Quản Lý CV
                      </span>
                    </Link>
                    <Link
                      href="/notifications"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors relative"
                    >
                      <Bell
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Quản Lý Thông Báo
                      </span>
                      {unreadNotifications > 0 && (
                        <span className="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/applied-jobs"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors relative"
                    >
                      <CheckCircle2
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Việc Làm Đã Ứng Tuyển
                      </span>
                      {appliedJobsCount > 0 && (
                        <span className="ml-auto w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold">
                          {appliedJobsCount > 99 ? "99+" : appliedJobsCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <Settings
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Quản Lý Thông Tin Tài Khoản
                      </span>
                    </Link>
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
