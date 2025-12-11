"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  MapPin,
  CalendarDays,
  Eye,
  UsersRound,
  Briefcase,
  UserCircle2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { jobsAPI, nlpService, apiClient, candidateService } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MatchScoreCard } from "@/components/ai/MatchScoreCard";
import type { MatchingScore } from "@/lib/api/services/nlp.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [id, setId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bestMatches, setBestMatches] = useState<any[]>([]);
  const [relatedJobs, setRelatedJobs] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [showRoadmapProgress, setShowRoadmapProgress] = useState(false);
  const [roadmapProgress, setRoadmapProgress] = useState(0);
  const [roadmapProgressMessage, setRoadmapProgressMessage] =
    useState("Đang khởi tạo...");
  const [matchingScore, setMatchingScore] = useState<MatchingScore | null>(
    null
  );
  const [loadingMatchingScore, setLoadingMatchingScore] = useState(false);
  const [calculatingScore, setCalculatingScore] = useState(false);

  // Get job ID from URL pathname (works in both dev and production)
  useEffect(() => {
    async function getJobId() {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        const match = pathname.match(/^\/jobs\/([^\/]+)/);
        if (match && match[1]) {
          const jobId = match[1];
          // Skip placeholder/dummy IDs
          if (jobId !== "placeholder" && jobId !== "dummy") {
            setId(jobId);
            return;
          }
        }
      }

      // Fallback to params if URL parsing fails
      try {
        const resolvedParams = await params;
        const jobId = resolvedParams.id;
        if (jobId === "dummy" || jobId === "placeholder") {
          setLoading(false);
          return;
        }
        setId(jobId);
      } catch (error) {
        console.error("Error resolving params:", error);
        setLoading(false);
      }
    }
    getJobId();
  }, [params]);

  // Fetch job data
  useEffect(() => {
    if (!id || id === "dummy") return;

    async function fetchJob() {
      try {
        setLoading(true);
        const res = await jobsAPI.getJobById(id);
        if (!res?.success || !res?.data) {
          setError(true);
          return;
        }
        setJob(res.data);

        // Increment view count (non-blocking)
        try {
          await jobsAPI.incrementView(id);
        } catch (err) {
          console.error("Failed to increment job view:", err);
        }
      } catch (e) {
        console.error("Error fetching job:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!id || id === "dummy") return;
    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        // Related jobs (public)
        const relatedRes = await jobsAPI.getRelatedJobs(id, { limit: 6 });
        setRelatedJobs(relatedRes.data || []);
      } catch (e) {
        console.error("Error fetching related jobs:", e);
      }

      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
          const res = await nlpService.getBestMatches({
            limit: 6,
            minScore: 30,
          });
          setBestMatches(res.data || []);
        } else {
          setBestMatches([]);
        }
      } catch (e) {
        console.error("Error fetching best matches:", e);
        toast({
          title: "Không tải được gợi ý việc làm",
          description: "Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoadingSuggestions(false);
      }
    };
    loadSuggestions();
  }, [id, toast]);

  // Fetch matching score for current job
  useEffect(() => {
    if (!id || !user?._id || id === "dummy") return;

    const fetchMatchingScore = async () => {
      setLoadingMatchingScore(true);
      try {
        const response = await nlpService.getMatchingScore(id, user._id);
        if (response.success && response.data) {
          setMatchingScore(response.data);
        }
      } catch (error: any) {
        // If score doesn't exist, don't show error (it's normal)
        if (error?.response?.status !== 404) {
          console.error("Error fetching matching score:", error);
        }
      } finally {
        setLoadingMatchingScore(false);
      }
    };

    fetchMatchingScore();
  }, [id, user?._id]);

  // Handle generate roadmap from job - MUST be before early returns (Rules of Hooks)
  const handleGenerateRoadmap = useCallback(
    async (e?: React.MouseEvent | React.KeyboardEvent) => {
      console.log("🔵 handleGenerateRoadmap called", {
        e,
        id,
        hasUser: !!user,
      });

      // Prevent default behavior and form submission IMMEDIATELY
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        // Also prevent default on native event
        if ("nativeEvent" in e && e.nativeEvent) {
          e.nativeEvent.preventDefault?.();
          e.nativeEvent.stopPropagation?.();
          e.nativeEvent.stopImmediatePropagation?.();
        }
        // Prevent any form submission
        const form = (e.target as HTMLElement)?.closest("form");
        if (form) {
          form.preventDefault?.();
        }
      }

      if (!id) {
        console.error("❌ No job ID available");
        return;
      }

      // Check if user is logged in
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Cần đăng nhập",
          description: "Vui lòng đăng nhập để tạo lộ trình học tập",
          variant: "destructive",
        });
        router.push(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }

      // Get user ID - handle both _id and id properties, and handle loading state
      let userId: string | undefined;

      if (authLoading) {
        // If still loading, wait a bit and try to get user directly
        try {
          const { authAPI } = await import("@/lib/api");
          const currentUser = await authAPI.getCurrentUser();
          userId = (currentUser as any)?._id || (currentUser as any)?.id;
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      } else {
        // If not loading, use user from context
        userId = (user as any)?._id || (user as any)?.id;
      }

      // If still no userId, try one more time to fetch directly
      if (!userId && token) {
        try {
          const { authAPI } = await import("@/lib/api");
          const currentUser = await authAPI.getCurrentUser();
          userId = (currentUser as any)?._id || (currentUser as any)?.id;
        } catch (error) {
          console.error("Error fetching user on retry:", error);
        }
      }

      // Final check - if still no userId, redirect to login
      if (!userId) {
        toast({
          title: "Cần đăng nhập",
          description: "Vui lòng đăng nhập để tạo lộ trình học tập",
          variant: "destructive",
        });
        router.push(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }

      // Note: We don't check profile here because the backend API has fallback logic
      // to generate skill gaps even if profile is incomplete. Let the API handle it.
      setRoadmapProgressMessage("Đang phân tích hồ sơ và công việc...");
      setRoadmapProgress(20);

      setIsGeneratingRoadmap(true);
      setShowRoadmapProgress(true);
      setRoadmapProgress(25);
      setRoadmapProgressMessage("Đang xác định kỹ năng cần thiết...");

      try {
        console.log("🚀 Generating roadmap for job:", id, "candidate:", userId);

        // Progress simulation based on actual backend steps
        const progressSteps = [
          { progress: 30, message: "Đang phân tích skill gaps..." },
          { progress: 40, message: "Đang tìm kiếm tài liệu học tập..." },
          { progress: 50, message: "Đang tìm kiếm video YouTube..." },
          { progress: 60, message: "Đang tìm kiếm dự án GitHub..." },
          { progress: 70, message: "Đang đánh giá độ tin cậy tài liệu..." },
          { progress: 80, message: "Đang tạo lộ trình học tập..." },
          { progress: 90, message: "Đang tính toán metrics..." },
        ];

        let currentStep = 0;
        const progressInterval = setInterval(() => {
          if (currentStep < progressSteps.length) {
            const step = progressSteps[currentStep];
            setRoadmapProgress(step.progress);
            setRoadmapProgressMessage(step.message);
            currentStep++;
          } else {
            // Slow down near completion
            setRoadmapProgress((prev) => {
              if (prev >= 95) return prev;
              return prev + 1;
            });
          }
        }, 3000); // Update every 3 seconds

        // Use RAG-powered learning roadmap API
        const response = await nlpService.generateLearningRoadmapRag({
          jobId: id,
          candidateId: userId,
          targetRole: job?.title || undefined,
          timeframe: 12, // 12 weeks default
        });

        clearInterval(progressInterval);
        setRoadmapProgress(95);
        setRoadmapProgressMessage("Đang lưu lộ trình học tập...");

        console.log("📦 API Response:", response);
        console.log("📦 Response structure:", {
          success: response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          roadmapExists: !!(response.data as any)?.roadmap,
        });

        if (response.success && response.data) {
          // API returns { data: { roadmap: {...}, ... } }
          const data = response.data as any;
          const roadmap = data.roadmap || data;
          const roadmapId = roadmap?._id || roadmap?.id;

          console.log("📋 Extracted roadmap:", roadmap);
          console.log("🆔 Roadmap ID:", roadmapId);

          if (!roadmapId) {
            console.error("❌ Roadmap ID not found in response:", {
              data: response.data,
              roadmap: data.roadmap,
              directData: data,
            });
            setShowRoadmapProgress(false);
            toast({
              title: "Lỗi tạo lộ trình",
              description:
                "Không tìm thấy ID lộ trình trong phản hồi. Vui lòng kiểm tra console để xem chi tiết.",
              variant: "destructive",
            });
            setIsGeneratingRoadmap(false);
            return; // Don't redirect, stay on current page
          }

          setRoadmapProgress(100);
          setRoadmapProgressMessage("Hoàn thành!");

          toast({
            title: "Tạo lộ trình thành công",
            description:
              "Lộ trình học tập đã được tạo với tài liệu thực tế. Đang chuyển đến trang chi tiết...",
          });

          // Small delay to show completion before closing modal and navigating
          setTimeout(() => {
            setShowRoadmapProgress(false);
            console.log("🔄 Redirecting to roadmap:", `/roadmaps/${roadmapId}`);
            router.push(`/roadmaps/${roadmapId}`);
          }, 1000);
        } else {
          console.error("❌ API returned unsuccessful response:", response);
          setShowRoadmapProgress(false);
          toast({
            title: "Lỗi tạo lộ trình",
            description:
              (response as any)?.message ||
              "Không thể tạo lộ trình. Vui lòng thử lại.",
            variant: "destructive",
          });
          setIsGeneratingRoadmap(false);
        }
      } catch (error: any) {
        console.error("❌ Error generating roadmap:", error);
        console.error("Error details:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          stack: error?.stack,
        });

        setShowRoadmapProgress(false);

        // Check if error is about missing profile/CV
        const errorMessage =
          error?.response?.data?.message || error?.message || "";
        if (
          errorMessage.includes("profile") ||
          errorMessage.includes("CV") ||
          errorMessage.includes("complete") ||
          errorMessage.includes("Unable to identify skill gaps")
        ) {
          // Only show warning, don't auto-redirect
          // Backend has fallback logic, so we let it handle incomplete profiles
          toast({
            title: "Thông tin hồ sơ chưa đầy đủ",
            description:
              errorMessage ||
              "Vui lòng cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) để tạo lộ trình học tập chính xác hơn.",
            variant: "destructive",
            duration: 5000,
          });
          // Don't auto-redirect - let user decide if they want to update profile
          // The backend will still try to generate a roadmap with fallback logic
        } else {
          toast({
            title: "Lỗi tạo lộ trình",
            description:
              errorMessage ||
              "Không thể tạo lộ trình học tập. Vui lòng thử lại.",
            variant: "destructive",
          });
        }
        setIsGeneratingRoadmap(false);
      }
    },
    [id, user, job, router, toast, authLoading]
  );

  // Calculate matching score
  const handleCalculateMatchingScore = async () => {
    if (!id || !user?._id) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để tính điểm phù hợp",
        variant: "destructive",
      });
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    setCalculatingScore(true);
    try {
      // Get CV data from candidate profile
      const candidateService = (await import("@/lib/api")).candidateService;
      const cvRes = await candidateService.getResumesAll();
      const currentCV =
        cvRes.data?.find((cv: any) => cv.isCurrent) || cvRes.data?.[0];

      if (!currentCV) {
        toast({
          title: "Chưa có CV",
          description: "Vui lòng tải CV lên để tính điểm phù hợp",
          variant: "destructive",
        });
        return;
      }

      // Get CV analysis data
      const cvData = currentCV.aiAnalysis?.extractedData || {};

      const response = await nlpService.calculateMatchingScore({
        cvData: cvData as any,
        jobId: id,
        candidateId: user._id,
      });

      if (response.success && response.data) {
        setMatchingScore(response.data);
        toast({
          title: "Đã tính điểm phù hợp",
          description: `Điểm phù hợp của bạn: ${response.data.overallScore}%`,
        });
      }
    } catch (error: any) {
      console.error("Error calculating matching score:", error);
      toast({
        title: "Lỗi tính điểm",
        description:
          error?.response?.data?.message ||
          "Không thể tính điểm phù hợp. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setCalculatingScore(false);
    }
  };

  // Loading state
  if (loading || !id) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">
              Không tìm thấy tin tuyển dụng
            </h1>
            <p className="text-muted-foreground mb-4">
              Tin tuyển dụng bạn đang tìm không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={() => router.push("/search")}>
              Quay lại danh sách việc làm
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const companyName = job.employer?.company?.name || "Nhà tuyển dụng";
  const companyLogo = job.employer?.company?.logo?.url;
  const headerImage = companyLogo || job.postedBy?.avatar || undefined;

  // Format salary
  const formatSalary = () => {
    if (job.salary) return job.salary;
    if (job.salaryMin && job.salaryMax) {
      const currency = job.currency || "VND";
      const formatNumber = (num: number) => {
        return new Intl.NumberFormat("vi-VN").format(num);
      };
      return `${formatNumber(job.salaryMin)} - ${formatNumber(
        job.salaryMax
      )} ${currency}`;
    }
    return null;
  };

  // Format location
  const formatLocation = () => {
    if (job.location) return job.location;
    if (job.address?.fullAddress) return job.address.fullAddress;
    if (job.address?.city) return job.address.city;
    return null;
  };

  const formattedSalary = formatSalary();
  const formattedLocation = formatLocation();

  return (
    <PageLayout>
      {/* Progress Modal for Roadmap Generation */}
      <Dialog
        open={showRoadmapProgress}
        onOpenChange={(open) => {
          if (!open && !isGeneratingRoadmap) {
            setShowRoadmapProgress(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tạo lộ trình học tập
            </DialogTitle>
            <DialogDescription>{roadmapProgressMessage}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={roadmapProgress} className="w-full" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">{roadmapProgressMessage}</p>
              <p className="text-xs text-muted-foreground">
                {roadmapProgress < 50
                  ? "Đang phân tích và chuẩn bị..."
                  : roadmapProgress < 80
                  ? "Đang tìm kiếm tài liệu học tập từ YouTube, GitHub..."
                  : "Đang hoàn thiện lộ trình học tập..."}
              </p>
              <p className="text-xs text-muted-foreground">
                Quá trình này có thể mất 30-90 giây. Vui lòng đợi...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <Link href="/" className="hover:underline">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/search" className="hover:underline">
            Việc làm
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{job.title}</span>
        </div>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
            {headerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerImage}
                alt={companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Logo</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{companyName}</span>
              {job.postedBy?.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.postedBy.avatar}
                  alt={job.postedBy.fullName || "Người đăng"}
                  className="w-6 h-6 rounded-full border"
                />
              )}
              {job.postedBy?.fullName && <span>• {job.postedBy.fullName}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formattedSalary && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                  <Briefcase className="w-3 h-3" /> {formattedSalary}
                </span>
              )}
              {formattedLocation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                  <MapPin className="w-3 h-3" /> {formattedLocation}
                </span>
              )}
              {typeof job.positions === "number" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                  <UsersRound className="w-3 h-3" /> {job.positions} vị trí
                </span>
              )}
              {job.deadline && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                  <CalendarDays className="w-3 h-3" /> Hạn:{" "}
                  {new Date(job.deadline).toLocaleDateString()}
                </span>
              )}
              {job.status && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                  <CheckCircle2 className="w-3 h-3" /> {job.status}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {id && (
              <ApplyButton
                jobId={id}
                jobTitle={job.title}
                className="font-medium"
                applied={job.hasApplied}
              />
            )}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  console.log("🔴 Button onClick fired", {
                    e,
                    type: e.type,
                    target: e.target,
                  });
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation?.();
                  if (e.defaultPrevented) {
                    console.log("✅ Default prevented");
                  }
                  handleGenerateRoadmap(e);
                  return false;
                }}
                onMouseDown={(e) => {
                  console.log("🟡 Button onMouseDown fired");
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGenerateRoadmap(e as any);
                  }
                }}
                disabled={isGeneratingRoadmap}
                className="gap-2"
                style={{ pointerEvents: isGeneratingRoadmap ? "none" : "auto" }}
              >
                {isGeneratingRoadmap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    Tạo lộ trình học tập
                  </>
                )}
              </Button>
            </div>
            {id && <SaveJobButton jobId={id} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tổng quan nhanh */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Chi tiết tin tuyển dụng</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {formattedSalary && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Mức lương:</span>
                      <span className="font-medium text-foreground">
                        {formattedSalary}
                      </span>
                    </div>
                  )}
                  {formattedLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Địa điểm:</span>
                      <span className="font-medium text-foreground">
                        {formattedLocation}
                      </span>
                    </div>
                  )}
                  {typeof job.positions === "number" && (
                    <div className="flex items-center gap-2">
                      <UsersRound className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Số lượng tuyển:
                      </span>
                      <span className="font-medium text-foreground">
                        {job.positions}
                      </span>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Hạn nộp:</span>
                      <span className="font-medium text-foreground">
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {typeof job.views === "number" && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Lượt xem:</span>
                      <span className="font-medium text-foreground">
                        {job.views}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Mô tả công việc</h2>
                <p className="text-sm leading-6 whitespace-pre-line">
                  {job.description || "Đang cập nhật"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Yêu cầu</h2>
                {job.requirements ? (
                  <ul className="list-disc list-inside text-sm leading-6 space-y-1">
                    {job.requirements
                      .split("\n")
                      .map((line) => line.trim())
                      .filter((line) => line.length > 0)
                      .map((line, idx) => (
                        <li key={idx}>{line.replace(/^[-•]\s?/, "")}</li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Đang cập nhật</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Kỹ năng</h2>
                {job.skills && job.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Đang cập nhật</p>
                )}
              </CardContent>
            </Card>

            {/* Hướng dẫn nộp hồ sơ */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-semibold">Ứng tuyển</h2>
                {job.deadline && (
                  <div className="text-sm text-muted-foreground">
                    Hạn nộp hồ sơ: {new Date(job.deadline).toLocaleDateString()}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {id && (
                    <ApplyButton
                      jobId={id}
                      jobTitle={job.title}
                      className="font-medium"
                      applied={job.hasApplied}
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      console.log("🔴 Button onClick fired (section 2)", {
                        e,
                        type: e.type,
                        target: e.target,
                      });
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent?.stopImmediatePropagation?.();
                      handleGenerateRoadmap(e);
                    }}
                    onMouseDown={(e) => {
                      console.log("🟡 Button onMouseDown fired (section 2)");
                      e.preventDefault();
                    }}
                    disabled={isGeneratingRoadmap}
                    className="gap-2"
                    style={{
                      pointerEvents: isGeneratingRoadmap ? "none" : "auto",
                    }}
                  >
                    {isGeneratingRoadmap ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-4 h-4" />
                        Tạo lộ trình học tập
                      </>
                    )}
                  </Button>
                  {id && <SaveJobButton jobId={id} />}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6 lg:sticky lg:top-20 h-fit">
            {/* Matching Score Card - Only show if user is logged in */}
            {user && (
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  {loadingMatchingScore ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Đang tải điểm phù hợp...
                      </p>
                    </div>
                  ) : matchingScore ? (
                    <MatchScoreCard
                      score={matchingScore.overallScore}
                      tier={matchingScore.tier}
                      breakdown={matchingScore.breakdown}
                      strengths={matchingScore.strengths}
                      concerns={matchingScore.concerns}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold mb-2">Điểm phù hợp</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Tính điểm phù hợp giữa CV của bạn và công việc này
                        </p>
                      </div>
                      <Button
                        onClick={handleCalculateMatchingScore}
                        disabled={calculatingScore}
                        className="w-full gap-2"
                        variant="default"
                      >
                        {calculatingScore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tính...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Tính điểm phù hợp
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold">Thông tin chung</h3>
                <div className="text-sm text-muted-foreground">
                  {job.createdAt && (
                    <div>Đăng: {new Date(job.createdAt).toLocaleString()}</div>
                  )}
                  {job.updatedAt && (
                    <div>
                      Cập nhật: {new Date(job.updatedAt).toLocaleString()}
                    </div>
                  )}
                  {typeof job.views === "number" && (
                    <div>Lượt xem: {job.views}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tạo lộ trình học tập */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/50">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Lộ trình học tập</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tạo lộ trình học tập cá nhân hóa dựa trên yêu cầu của công
                  việc này để phát triển kỹ năng cần thiết.
                </p>
                <Button
                  type="button"
                  onClick={(e) => {
                    console.log("🔴 Button onClick fired (section 3)", {
                      e,
                      type: e.type,
                      target: e.target,
                    });
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent?.stopImmediatePropagation?.();
                    handleGenerateRoadmap(e);
                    return false;
                  }}
                  onMouseDown={(e) => {
                    console.log("🟡 Button onMouseDown fired (section 3)");
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGenerateRoadmap(e as any);
                    }
                  }}
                  disabled={isGeneratingRoadmap}
                  className="w-full gap-2"
                  variant="default"
                  style={{
                    pointerEvents: isGeneratingRoadmap ? "none" : "auto",
                  }}
                >
                  {isGeneratingRoadmap ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo lộ trình...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      Tạo lộ trình học tập
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Mẹo an toàn */}
            <Card>
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold">Bí kíp tìm việc an toàn</h3>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  <li>Không chuyển tiền đặt cọc hay phí tuyển dụng.</li>
                  <li>
                    Kiểm tra kỹ thông tin nhà tuyển dụng trước khi nộp CV.
                  </li>
                  <li>Báo cáo tin tuyển dụng đáng ngờ cho chúng tôi.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Việc làm gợi ý cho bạn</h2>
            {!loadingSuggestions && !bestMatches.length && (
              <span className="text-sm text-muted-foreground">
                Đăng nhập để xem gợi ý cá nhân hóa
              </span>
            )}
          </div>
          {loadingSuggestions ? (
            <p className="text-sm text-muted-foreground">Đang tải gợi ý...</p>
          ) : bestMatches.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bestMatches.map((item) => (
                <Card key={item.job._id} className="h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold line-clamp-2">
                          {item.job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.job.company}
                        </p>
                      </div>
                      <Badge variant="outline">{item.tier}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{item.job.location || "Đang cập nhật"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-primary">
                        {Math.round(item.overallScore)}%
                      </span>{" "}
                      phù hợp
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/jobs/${item.job._id}`)}
                    >
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có gợi ý. Cần cập nhật hồ sơ để nhận đề xuất phù hợp.
            </p>
          )}
        </section>

        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Việc làm liên quan</h2>
            {!loadingSuggestions && !relatedJobs.length && (
              <span className="text-sm text-muted-foreground">
                Chưa tìm thấy việc làm liên quan
              </span>
            )}
          </div>
          {loadingSuggestions ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : relatedJobs.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedJobs.map((item) => {
                const city =
                  item.fullLocation?.split(",").pop()?.trim() ||
                  item.fullLocation ||
                  "Đang cập nhật";
                const logoUrl = item.companyId?.logo?.url;

                return (
                  <Card
                    key={item.id}
                    className="h-full border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoUrl}
                              alt={item.companyId?.name || "Logo"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Briefcase className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold leading-tight line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.companyId?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{city}</span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900">
                        {item.salaryRange}
                      </p>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/jobs/${item.id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa tìm thấy việc làm liên quan.
            </p>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
