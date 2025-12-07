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
  BarChart3,
  User,
  Bell,
  Heart,
  Briefcase,
  Circle,
  Sparkles,
  Bookmark,
  TrendingUp,
  Target,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { savedJobService } from "@/lib/api";
import type { SavedJob } from "@/lib/api/services/savedJob.service";
import { getNotifications } from "@/lib/notificationAPI";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [matchRate, setMatchRate] = useState(75);
  const [cvCount, setCvCount] = useState(2);
  const [appliedJobsCount, setAppliedJobsCount] = useState(3);
  const [submittedCvsCount, setSubmittedCvsCount] = useState(2);
  const [unreadNotifications, setUnreadNotifications] = useState(4);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [savedJobsList, setSavedJobsList] = useState<SavedJob[]>([]);
  const [onlineCvs, setOnlineCvs] = useState<
    Array<{ templateId: string; resumeId: string; templateName: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        // Fetch CVs count
        const resumesRes = await api.candidateCV.getResumesAll();
        if (resumesRes?.success && resumesRes.data) {
          const current = (resumesRes.data as any).current;
          const history = (resumesRes.data as any).history || [];
          const totalCvs = (current ? 1 : 0) + history.length;
          setCvCount(totalCvs);
        }

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
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const userName = user?.fullName || user?.firstName || "Ứng Viên";

  // Calculate progress circle
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (matchRate / 100) * circumference;

  const primaryColor = "oklch(0.60 0.12 195)";
  const primaryGradient = `linear-gradient(135deg, ${primaryColor} 0%, oklch(0.72 0.08 210) 55%, oklch(0.88 0.03 195) 100%)`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,oklch(0.97_0.02_210)_0%,white_30%)]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/40 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                style={{ background: primaryGradient }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                InternBridge
              </span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm việc làm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 w-full bg-white/80 border-slate-200/60 backdrop-blur-sm"
              />
            </form>

            {/* Settings Icon */}
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={() => router.push("/profile")}
            >
              <Settings className="w-5 h-5" style={{ color: primaryColor }} />
            </Button>
          </div>
        </div>
      </header>

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
            <Button
              onClick={() => router.push("/")}
              className="bg-white text-[oklch(0.60_0.12_195)] hover:bg-white/95 font-semibold shadow-lg"
            >
              Về Trang Chủ
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - AI Profile Overview & Analytics */}
            <div className="lg:col-span-3 space-y-6">
              {/* AI Profile Overview */}
              <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,45,95,0.08)]">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Tổng Quan Hồ Sơ AI
                  </h3>
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 mb-4">
                      <svg
                        className="transform -rotate-90 w-32 h-32"
                        viewBox="0 0 120 120"
                      >
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-slate-200"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          style={{ color: primaryColor }}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900">
                          {matchRate}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      Độ Phù Hợp
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Analytics */}
              <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,45,95,0.08)]">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Tính năng AI hỗ trợ của InternBridge
                  </h3>
                  <div className="space-y-4">
                    <Link
                      href="/cv-analysis"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <BarChart3
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Phân Tích CV
                      </span>
                    </Link>
                    <Link
                      href="/job-recommendations"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <TrendingUp
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Gợi Ý Việc Làm AI
                      </span>
                    </Link>
                    <Link
                      href="/skill-gap-analysis"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <Target
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Phân Tích Khoảng Cách Kỹ Năng
                      </span>
                    </Link>
                    <Link
                      href="/roadmaps"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <GraduationCap
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Lộ Trình Học Tập
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Job Applications & Submitted CVs */}
            <div className="lg:col-span-6 space-y-6">
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
            <div className="lg:col-span-3">
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
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[oklch(0.60_0.12_195/.08)] transition-colors"
                    >
                      <CheckCircle2
                        className="w-5 h-5"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Việc Làm Đã Ứng Tuyển
                      </span>
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
