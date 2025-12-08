"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchScoreCard } from "@/components/ai/MatchScoreCard";
import {
  Loader2,
  Briefcase,
  MapPin,
  DollarSign,
  Search,
  TrendingUp,
  Filter,
  GraduationCap,
} from "lucide-react";
import { nlpService, candidateService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyProfileState } from "@/components/profile/EmptyProfileState";
import UploadCVModal from "@/components/cv/UploadCVModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export default function JobRecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState(30);
  const [isUpdatingMatches, setIsUpdatingMatches] = useState(false);
  const [isProfileEmpty, setIsProfileEmpty] = useState(false);
  const [profileEmptyMessage, setProfileEmptyMessage] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [showRoadmapProgress, setShowRoadmapProgress] = useState(false);
  const [roadmapProgress, setRoadmapProgress] = useState(0);
  const [roadmapProgressMessage, setRoadmapProgressMessage] = useState("Đang khởi tạo...");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Yêu cầu đăng nhập candidate trước khi xem gợi ý việc làm
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          const redirectUrl = "/job-recommendations";
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
          return;
        }
      }

      // Tự động tính điểm phù hợp cho tất cả job, sau đó tải danh sách gợi ý
      await refreshJobMatchesAndRecommendations();
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, tierFilter, jobs]);

  const fetchJobRecommendations = async () => {
    setIsLoading(true);
    setIsProfileEmpty(false);
    try {
      const response = await nlpService.getBestMatches({
        limit: 20,
        minScore,
      });
      
      // Check if response indicates profile is empty (success: false)
      if (!response.success) {
        // API returned success: false, likely profile empty
        const errorMessage = response.message || 
          "Bạn chưa cập nhật hồ sơ hoặc tải CV. Vui lòng upload CV hoặc cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) trước khi sử dụng tính năng gợi ý việc làm.";
        setIsProfileEmpty(true);
        setProfileEmptyMessage(errorMessage);
        setJobs([]);
        setFilteredJobs([]);
        setIsLoading(false);
        return;
      }
      
      setJobs(response.data);
      setFilteredJobs(response.data);
      setIsProfileEmpty(false);
    } catch (error: any) {
      console.error("Failed to fetch job recommendations:", error);
      
      // Check if it's a 400 error (profile empty)
      if (error?.response?.status === 400 || error?.status === 400) {
        const errorMessage = error?.response?.data?.message || error?.message || 
          "Bạn chưa cập nhật hồ sơ hoặc tải CV. Vui lòng upload CV hoặc cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) trước khi sử dụng tính năng gợi ý việc làm.";
        setIsProfileEmpty(true);
        setProfileEmptyMessage(errorMessage);
        setJobs([]);
        setFilteredJobs([]);
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách gợi ý việc làm. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.job.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (tierFilter !== "all") {
      filtered = filtered.filter((item) => item.tier === tierFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  // Handle generate roadmap from job - MUST be before early returns (Rules of Hooks)
  const handleGenerateRoadmap = useCallback(async (jobId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    console.log('🔵 handleGenerateRoadmap called', { e, jobId, hasUser: !!user });
    
    // Prevent default behavior and form submission IMMEDIATELY
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      // Also prevent default on native event
      if ('nativeEvent' in e && e.nativeEvent) {
        e.nativeEvent.preventDefault?.();
        e.nativeEvent.stopPropagation?.();
        e.nativeEvent.stopImmediatePropagation?.();
      }
      // Prevent any form submission
      const form = (e.target as HTMLElement)?.closest('form');
      if (form) {
        form.preventDefault?.();
      }
    }

    if (!jobId) {
      console.error('❌ No job ID available');
      return;
    }

    setCurrentJobId(jobId);

    // Check if user is logged in
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để tạo lộ trình học tập",
        variant: "destructive",
      });
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!user || !(user as any)._id) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để tạo lộ trình học tập",
        variant: "destructive",
      });
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Check if user has profile and CV before proceeding
    try {
      setRoadmapProgressMessage("Đang kiểm tra hồ sơ...");
      setRoadmapProgress(10);
      
      const profileResponse = await candidateService.getProfile();
      
      if (!profileResponse.success || !profileResponse.data) {
        toast({
          title: "Chưa có hồ sơ",
          description: "Vui lòng hoàn thiện hồ sơ hoặc tải CV lên trước khi tạo lộ trình học tập.",
          variant: "destructive",
        });
        router.push("/my-cv");
        return;
      }

      const profile = profileResponse.data;
      
      // Check if user has CV or profile data
      const hasCV = profile.resume?.current;
      const hasSkills = (profile.skills?.technical?.length || 0) + (profile.skills?.soft?.length || 0) > 0;
      const hasExperience = (profile.experience?.internships?.length || 0) + 
                           ((profile.experience as any)?.fulltime?.length || 0) + 
                           (profile.experience?.projects?.length || 0) > 0;
      const hasEducation = !!profile.education?.university || (profile.education?.certifications?.length || 0) > 0;

      if (!hasCV && !hasSkills && !hasExperience && !hasEducation) {
        toast({
          title: "Chưa có thông tin hồ sơ",
          description: "Vui lòng tải CV lên hoặc cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) trước khi tạo lộ trình học tập.",
          variant: "destructive",
        });
        router.push("/my-cv");
        return;
      }

      setRoadmapProgressMessage("Đang phân tích hồ sơ và công việc...");
      setRoadmapProgress(20);
    } catch (profileError: any) {
      console.error("Error checking profile:", profileError);
      toast({
        title: "Lỗi kiểm tra hồ sơ",
        description: profileError?.response?.data?.message || "Không thể kiểm tra hồ sơ. Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingRoadmap(true);
    setShowRoadmapProgress(true);
    setRoadmapProgress(25);
    setRoadmapProgressMessage("Đang xác định kỹ năng cần thiết...");
    
    try {
      // Find job data from current jobs list
      const jobData = jobs.find(j => j.job._id === jobId || j.jobId === jobId);
      const targetRole = jobData?.job?.title || undefined;
      
      console.log('🚀 Generating roadmap for job:', jobId, 'candidate:', (user as any)._id, 'targetRole:', targetRole);
      
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
        jobId: jobId,
        candidateId: (user as any)._id,
        targetRole: targetRole,
        timeframe: 12, // 12 weeks default
      });

      clearInterval(progressInterval);
      setRoadmapProgress(95);
      setRoadmapProgressMessage("Đang lưu lộ trình học tập...");

      console.log('📦 API Response:', response);
      console.log('📦 Response structure:', {
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
        
        console.log('📋 Extracted roadmap:', roadmap);
        console.log('🆔 Roadmap ID:', roadmapId);
        
        if (!roadmapId) {
          console.error('❌ Roadmap ID not found in response:', {
            data: response.data,
            roadmap: data.roadmap,
            directData: data,
          });
          setShowRoadmapProgress(false);
          toast({
            title: "Lỗi tạo lộ trình",
            description: "Không tìm thấy ID lộ trình trong phản hồi. Vui lòng kiểm tra console để xem chi tiết.",
            variant: "destructive",
          });
          setIsGeneratingRoadmap(false);
          return; // Don't redirect, stay on current page
        }
        
        setRoadmapProgress(100);
        setRoadmapProgressMessage("Hoàn thành!");
        
        toast({
          title: "Tạo lộ trình thành công",
          description: "Lộ trình học tập đã được tạo với tài liệu thực tế. Đang chuyển đến trang chi tiết...",
        });
        
        // Small delay to show completion before closing modal and navigating
        setTimeout(() => {
          setShowRoadmapProgress(false);
          console.log('🔄 Redirecting to roadmap:', `/roadmaps/${roadmapId}`);
          router.push(`/roadmaps/${roadmapId}`);
        }, 1000);
      } else {
        console.error('❌ API returned unsuccessful response:', response);
        setShowRoadmapProgress(false);
        toast({
          title: "Lỗi tạo lộ trình",
          description: (response as any)?.message || "Không thể tạo lộ trình. Vui lòng thử lại.",
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
      const errorMessage = error?.response?.data?.message || error?.message || "";
      if (errorMessage.includes("profile") || errorMessage.includes("CV") || errorMessage.includes("complete")) {
        toast({
          title: "Chưa có đủ thông tin",
          description: errorMessage || "Vui lòng hoàn thiện hồ sơ hoặc tải CV lên trước khi tạo lộ trình học tập.",
          variant: "destructive",
        });
        router.push("/my-cv");
      } else {
        toast({
          title: "Lỗi tạo lộ trình",
          description: errorMessage || "Không thể tạo lộ trình học tập. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
      setIsGeneratingRoadmap(false);
    }
  }, [user, jobs, router, toast]);

  // Tính lại toàn bộ điểm phù hợp rồi reload danh sách gợi ý
  const refreshJobMatchesAndRecommendations = async () => {
    let shouldFetchRecommendations = true;
    try {
      setIsUpdatingMatches(true);
      setIsProfileEmpty(false);
      setIsLoading(true);
      // Gọi API tính lại toàn bộ matching score cho candidate hiện tại
      const result = await nlpService.calculateAllMatches();

      if (!result.success) {
        const errorMessage = result.message || "Vui lòng thử lại sau.";
        setIsProfileEmpty(true);
        setProfileEmptyMessage(errorMessage);
        setJobs([]);
        setFilteredJobs([]);
        setIsLoading(false);
        shouldFetchRecommendations = false;
        return;
      } else if (result.message) {
        toast({
          title: "Đã cập nhật điểm phù hợp",
          description: result.message,
        });
      }
    } catch (error: any) {
      if (error?.response?.status === 400 || error?.status === 400) {
        const errorMessage = error?.response?.data?.message || error?.message ||
          "Bạn chưa cập nhật hồ sơ hoặc tải CV. Vui lòng upload CV hoặc cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) trước khi sử dụng tính năng gợi ý việc làm.";
        setIsProfileEmpty(true);
        setProfileEmptyMessage(errorMessage);
        setJobs([]);
        setFilteredJobs([]);
        setIsLoading(false);
        shouldFetchRecommendations = false;
        return;
      }
      console.error("Failed to calculate all matches:", error);
      toast({
        title: "Lỗi khi cập nhật điểm phù hợp",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMatches(false);
      // Chỉ reload danh sách gợi ý nếu không có lỗi profile empty
      if (shouldFetchRecommendations) {
        await fetchJobRecommendations();
      }
    }
  };

  return (
    <PageLayout>
      {/* Progress Modal for Roadmap Generation */}
      <Dialog open={showRoadmapProgress} onOpenChange={(open) => {
        if (!open && !isGeneratingRoadmap) {
          setShowRoadmapProgress(false);
        }
      }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tạo lộ trình học tập
            </DialogTitle>
            <DialogDescription>
              {roadmapProgressMessage}
            </DialogDescription>
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
                  : "Đang hoàn thiện lộ trình học tập..."
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Quá trình này có thể mất 30-90 giây. Vui lòng đợi...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header + Filters */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-none shadow-sm">
            <CardContent className="pt-6 pb-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold">
                      Gợi ý việc làm phù hợp
                    </h1>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">
                    Danh sách xếp hạng theo mức độ phù hợp hồ sơ. Bạn có thể tìm kiếm và chọn điểm tối thiểu.
                  </p>
                </div>

                <div className="w-full md:w-[440px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-xs border">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên việc làm hoặc công ty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none shadow-none h-8 px-0 focus-visible:ring-0 text-sm"
                      />
                    </div>

                    {/* Min score */}
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-xs border">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <Select
                        value={minScore.toString()}
                        onValueChange={(value) => setMinScore(parseInt(value))}
                      >
                        <SelectTrigger className="border-none shadow-none h-8 px-0 text-sm">
                          <SelectValue placeholder="Điểm tối thiểu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">Điểm ≥ 30%</SelectItem>
                          <SelectItem value="40">Điểm ≥ 40%</SelectItem>
                          <SelectItem value="50">Điểm ≥ 50%</SelectItem>
                          <SelectItem value="60">Điểm ≥ 60%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Đang hiển thị{" "}
                      <span className="font-semibold">
                        {filteredJobs.length} việc làm
                      </span>{" "}
                      với điểm ≥ {minScore}%.
                    </p>
                    <Button
                      onClick={refreshJobMatchesAndRecommendations}
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingMatches || isLoading}
                    >
                      {isUpdatingMatches ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang cập nhật...
                        </span>
                      ) : (
                        "Cập nhật gợi ý"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && !isProfileEmpty && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-6">
                    <Skeleton className="h-32 w-32 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty Profile State */}
        {!isLoading && isProfileEmpty && (
          <EmptyProfileState 
            message={profileEmptyMessage}
            onUploadCV={() => setShowUploadModal(true)}
            onUpdateProfile={() => router.push("/profile")}
          />
        )}

        {/* Upload CV Modal */}
        <UploadCVModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onSuccess={() => {
            toast({
              description: "CV đã được tải lên thành công! Đang làm mới gợi ý việc làm...",
              duration: 3000,
            });
            // Refresh job recommendations after CV upload
            setTimeout(() => {
              refreshJobMatchesAndRecommendations();
            }, 1000);
          }}
        />

        {/* Empty Job List (when profile is OK but no matches) */}
        {!isLoading && !isProfileEmpty && filteredJobs.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  Chưa tìm thấy việc làm phù hợp
                </h3>
                <p className="text-muted-foreground mb-4">
                  Hãy thử nới lỏng bộ lọc hoặc cập nhật thêm kỹ năng trong hồ sơ
                  để hệ thống gợi ý chính xác hơn.
                </p>
                <Button onClick={() => router.push("/profile")}>
                  Cập nhật hồ sơ ngay
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isProfileEmpty && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Jobs List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredJobs.map((item, idx) => {
                const companyName = item.job.company || "Nhà tuyển dụng";
                const companyInitial =
                  typeof companyName === "string" && companyName.length > 0
                    ? companyName.charAt(0).toUpperCase()
                    : "C";
                const companyLogo = (item.job as any).companyLogo as string | undefined;
                const tier =
                  item.overallScore >= 80
                    ? "A"
                    : item.overallScore >= 70
                      ? "B"
                      : item.overallScore >= 60
                        ? "C"
                        : "D";
                const deadline = item.job.deadline
                  ? new Date(item.job.deadline)
                  : null;
                const city =
                  item.job.location?.split(",").pop()?.trim() ||
                  item.job.location ||
                  "Đang cập nhật";
                const salary =
                  item.job.salary?.min && item.job.salary?.max
                    ? `${item.job.salary.min.toLocaleString()} - ${item.job.salary.max.toLocaleString()} ${item.job.salary.currency || "VND"}`
                    : "Thỏa thuận";

                return (
                  <Card
                    key={`${item.job._id || item.jobId || "job"}-${idx}`}
                    className="hover:shadow-lg transition-shadow border border-slate-100 rounded-xl"
                  >
                    <CardContent className="pt-5 pb-5">
                      <div className="flex gap-4">
                        {/* Logo / Initial */}
                        <div className="hidden sm:flex items-start">
                          <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                            {companyLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={companyLogo}
                                alt={companyName}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                {companyInitial}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Job Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold mb-1 hover:text-blue-700 cursor-pointer">
                                {item.job.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {companyName}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="outline" className="text-xs">
                                Điểm phù hợp {item.overallScore}%
                              </Badge>
                              {deadline && (
                                <span className="text-[11px] text-muted-foreground">
                                  Hạn nộp:{" "}
                                  {deadline.toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {city}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {salary}
                            </span>
                            {item.job.level && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {item.job.level}
                              </span>
                            )}
                          </div>

                          {/* Matched Skills */}
                          {item.matchedSkills &&
                            item.matchedSkills.length > 0 && (
                              <div className="mb-1">
                                <p className="text-xs font-medium mb-1 text-slate-700">
                                  Kỹ năng trùng khớp:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {item.matchedSkills
                                    .slice(0, 5)
                                    .map((skill: string, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  {item.matchedSkills.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.matchedSkills.length - 5} nữa
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              onClick={() => handleViewJob(item.job._id)}
                              size="sm"
                            >
                              Xem chi tiết
                            </Button>
                            <Button
                              type="button"
                              onClick={(e) => {
                                console.log('🔴 Button onClick fired', { e, type: e.type, target: e.target });
                                e.preventDefault();
                                e.stopPropagation();
                                e.nativeEvent?.stopImmediatePropagation?.();
                                if (e.defaultPrevented) {
                                  console.log('✅ Default prevented');
                                }
                                handleGenerateRoadmap(item.job._id, e);
                                return false;
                              }}
                              onMouseDown={(e) => {
                                console.log('🟡 Button onMouseDown fired');
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleGenerateRoadmap(item.job._id, e as any);
                                }
                              }}
                              disabled={isGeneratingRoadmap}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              style={{ pointerEvents: isGeneratingRoadmap ? 'none' : 'auto' }}
                            >
                              {isGeneratingRoadmap && currentJobId === item.job._id ? (
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Match Score Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                {filteredJobs[0] && (
                  <MatchScoreCard
                    score={filteredJobs[0].overallScore}
                    tier={
                      filteredJobs[0].overallScore >= 80
                        ? "A"
                        : filteredJobs[0].overallScore >= 70
                          ? "B"
                          : filteredJobs[0].overallScore >= 60
                            ? "C"
                            : "D"
                    }
                    breakdown={filteredJobs[0].breakdown}
                    strengths={filteredJobs[0].strengths}
                    concerns={filteredJobs[0].concerns}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
