"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillGapChart } from "@/components/ai/SkillGapChart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Loader2,
  Search,
  FileText,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { aiService, jobService, nlpService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function SkillGapAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState<"job" | "description">("job");
  
  // Job selection
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Job description input
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<{
    currentSkills: string[];
    requiredSkills: string[];
    skillGaps: {
      critical: string[];
      important: string[];
      optional: string[];
    };
    matchScore: number;
    recommendations: string[];
  } | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  useEffect(() => {
    // Nếu chưa đăng nhập thì chuyển sang trang đăng nhập
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        const redirectUrl = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }
    }

    const jobId = searchParams.get("jobId");
    if (jobId) {
      // Đi từ trang Job Detail: tự chọn luôn job đó và chạy phân tích
      setAnalysisMethod("job");
      setSelectedJobId(jobId);
      loadJobById(jobId);
      handleAnalyzeByJobId(jobId);
    } else {
      // Vào trực tiếp trang Skill Gap: load danh sách job mới nhất
      loadRecentJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecentJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await jobService.getJobs(1, 20, {
        status: "active",
      });
      setJobs(response.data || []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadJobById = async (jobId: string) => {
    setIsLoadingJobs(true);
    try {
      const response = await jobService.getJobById(jobId);
      if (response?.success && response.data) {
        // Hiển thị đúng job đang xem trong danh sách và chọn sẵn
        setJobs([
          {
            _id: response.data.id,
            title: response.data.title,
            employer: response.data.employer,
            skills: response.data.skills,
          },
        ] as any[]);
      } else {
        await loadRecentJobs();
      }
    } catch (error) {
      console.error("Failed to load job by id:", error);
      await loadRecentJobs();
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const searchJobs = async () => {
    if (!searchQuery.trim()) {
      loadRecentJobs();
      return;
    }

    setIsLoadingJobs(true);
    try {
      const response = await jobService.getJobs(1, 20, {
        q: searchQuery,
        status: "active",
      });
      setJobs(response.data || []);
    } catch (error) {
      console.error("Failed to search jobs:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleAnalyzeByJobId = async (jobId?: string) => {
    // Nếu chưa đăng nhập thì yêu cầu đăng nhập
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        const redirectUrl = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }
    }

    const targetJobId = jobId || selectedJobId;
    if (!targetJobId) {
      toast({
        title: "No Job Selected",
        description: "Please select a job to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeSkillGaps({
        jobId: targetJobId,
      });

      const raw = (response as any)?.data || {};

      // Map response từ /api/ai/skill-gap-analysis sang format UI
      const missingSkills = (raw.missingSkills || []) as Array<{
        name: string;
        importance?: string;
      }>;

      const currentSkillsList = (raw.strongSkills || []) as string[];

      const requiredSkillsList =
        missingSkills.map((s) => s.name) ||
        (raw.requiredSkills as string[]) ||
        [];

      const normalized = {
        currentSkills: currentSkillsList,
        requiredSkills: requiredSkillsList,
        skillGaps: {
          critical: missingSkills
            .filter((s) => s.importance === "high")
            .map((s) => s.name),
          important: missingSkills
            .filter((s) => s.importance === "medium")
            .map((s) => s.name),
          optional: missingSkills
            .filter((s) => s.importance === "low")
            .map((s) => s.name),
        },
        matchScore:
          typeof raw._stats?.matchRate === "number"
            ? Math.round(raw._stats.matchRate)
            : typeof raw.matchScore === "number"
            ? raw.matchScore
            : 0,
        recommendations: (raw.learningPriority || []).map((item: any) => {
          const skill = item.skill || item.name;
          const time = item.timeToLearn || "";
          const difficulty = item.difficulty || "";
          return `Ưu tiên học ${skill} (${time}, độ khó: ${difficulty})`;
        }),
      };

      setAnalysisResult(normalized);
      toast({
        title: "Analysis Complete",
        description: "Your skill gap analysis is ready",
      });
    } catch (error) {
      console.error("Skill gap analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze skill gaps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeByDescription = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeSkillGaps({
        targetJobDescription: jobDescription,
        targetJobTitle: jobTitle,
        industry: industry || undefined,
      });

      const raw = (response as any)?.data || {};

      const missingSkills = (raw.missingSkills || []) as Array<{
        name: string;
        importance?: string;
      }>;

      const currentSkillsList = (raw.strongSkills || []) as string[];

      const requiredSkillsList =
        missingSkills.map((s) => s.name) ||
        (raw.requiredSkills as string[]) ||
        [];

      const normalized = {
        currentSkills: currentSkillsList,
        requiredSkills: requiredSkillsList,
        skillGaps: {
          critical: missingSkills
            .filter((s) => s.importance === "high")
            .map((s) => s.name),
          important: missingSkills
            .filter((s) => s.importance === "medium")
            .map((s) => s.name),
          optional: missingSkills
            .filter((s) => s.importance === "low")
            .map((s) => s.name),
        },
        matchScore:
          typeof raw._stats?.matchRate === "number"
            ? Math.round(raw._stats.matchRate)
            : typeof raw.matchScore === "number"
            ? raw.matchScore
            : 0,
        recommendations: (raw.learningPriority || []).map((item: any) => {
          const skill = item.skill || item.name;
          const time = item.timeToLearn || "";
          const difficulty = item.difficulty || "";
          return `Ưu tiên học ${skill} (${time}, độ khó: ${difficulty})`;
        }),
      };

      setAnalysisResult(normalized);
      toast({
        title: "Analysis Complete",
        description: "Your skill gap analysis is ready",
      });
    } catch (error) {
      console.error("Skill gap analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze skill gaps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedJobId) {
      toast({
        title: "Chưa có công việc",
        description: "Vui lòng chọn công việc cần phân tích trước.",
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra đăng nhập
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        const redirectUrl = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }
    }

    try {
      setIsGeneratingRoadmap(true);

      const response = await nlpService.generateLearningRoadmapRag({
        jobId: selectedJobId,
        candidateId: (user as any)?._id || (user as any)?.id,
      });

      const roadmap = response.data;

      toast({
        title: "Đã tạo lộ trình học tập",
        description: "Lộ trình học tập cá nhân hoá đã được tạo thành công.",
      });

      if (roadmap?._id) {
        router.push(`/roadmaps/${roadmap._id}`);
      } else {
        // Fallback: quay về danh sách lộ trình nếu không có id
        router.push("/roadmaps");
      }
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
      toast({
        title: "Tạo lộ trình thất bại",
        description: "Không thể tạo lộ trình học tập. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Job hiện tại (lấy từ trang chi tiết việc làm)
  const currentJob = jobs[0] || null;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Phân tích khoảng cách kỹ năng</h1>
          </div>
          <p className="text-muted-foreground">
            So sánh kỹ năng hiện tại của bạn với yêu cầu của công việc đã chọn và nhận gợi ý cải thiện cụ thể.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thông tin công việc & nút phân tích */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Công việc đang phân tích</CardTitle>
              </CardHeader>
              <CardContent>
                {!currentJob ? (
                  <div className="py-8 text-center text-muted-foreground space-y-2">
                    <FileText className="w-10 h-10 mx-auto opacity-60" />
                    <p>Không tìm thấy thông tin công việc.</p>
                    <p className="text-sm">
                      Vui lòng mở trang này thông qua{" "}
                      <span className="font-semibold">trang chi tiết việc làm</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/40">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Công việc đã chọn
                      </p>
                      <h2 className="text-lg font-semibold text-foreground">
                        {currentJob.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {currentJob.employer?.company?.name || "Nhà tuyển dụng"}
                      </p>
                      {currentJob.skills && currentJob.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {currentJob.skills
                            .slice(0, 6)
                            .map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-xs bg-secondary px-2 py-1 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleAnalyzeByJobId(selectedJobId)}
                      disabled={!selectedJobId || isAnalyzing}
                      className="w-full"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-4 w-4" />
                          Phân tích khoảng cách kỹ năng
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {!analysisResult && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      Nhấn{" "}
                      <span className="font-semibold">
                        &quot;Phân tích khoảng cách kỹ năng&quot;
                      </span>{" "}
                      để bắt đầu phân tích công việc này.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResult && (
              <>
                {/* Skill Gap Chart */}
                <SkillGapChart
                  currentSkills={analysisResult.currentSkills}
                  requiredSkills={analysisResult.requiredSkills}
                  skillGaps={analysisResult.skillGaps}
                  matchScore={analysisResult.matchScore}
                  recommendations={analysisResult.recommendations}
                />

                {/* Match Score Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Tổng quan mức độ phù hợp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Mức độ phù hợp tổng thể
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {analysisResult.matchScore}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {analysisResult.currentSkills.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Kỹ năng hiện tại
                          </div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {analysisResult.requiredSkills.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Kỹ năng yêu cầu
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-700">
                            {analysisResult.skillGaps.critical.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quan trọng (Critical)
                          </div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="text-lg font-bold text-orange-700">
                            {analysisResult.skillGaps.important.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ưu tiên (Important)
                          </div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-700">
                            {analysisResult.skillGaps.optional.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Bổ sung (Optional)
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Gợi ý tiếp theo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {analysisResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-yellow-600 font-bold mt-0.5">
                              {index + 1}.
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateRoadmap}
                    className="flex-1"
                    size="lg"
                    disabled={isGeneratingRoadmap}
                  >
                    {isGeneratingRoadmap ? "Đang tạo lộ trình..." : "Tạo lộ trình học tập"}
                  </Button>
                  <Button
                    onClick={() => router.push("/job-recommendations")}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Xem thêm việc làm phù hợp
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
