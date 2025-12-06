"use client";

import {
  BookOpen,
  CheckCircle2,
  CheckSquare2,
  Clock,
  Flame,
  GraduationCap,
  MapPin,
  Sparkles,
  Target,
  Youtube,
  FileText,
  PlayCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, nlpService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type RoadmapDifficulty = "beginner" | "intermediate" | "advanced" | "mixed";

interface RoadmapResource {
  _id?: string;
  type:
    | "course"
    | "video"
    | "article"
    | "book"
    | "documentation"
    | "tutorial"
    | "practice"
    | "project";
  title: string;
  url?: string;
  provider?: string;
  duration?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  isFree?: boolean;
  rating?: number;
  language?: string;
  estimatedCost?: number;
  credibility?: number;
  certificateOffered?: boolean;
  source?: "youtube" | "github" | "coursera" | "udemy" | "vector-db" | "other";
  popularity?: number;
}

interface RoadmapProject {
  title?: string;
  description?: string;
  difficulty?: string;
  estimatedTime?: string;
  skills?: string[];
}

interface RoadmapAssessment {
  type?: "quiz" | "project" | "coding-challenge" | "peer-review";
  description?: string;
  passingCriteria?: string;
}

interface RoadmapWeek {
  weekNumber: number;
  title: string;
  focus: string;
  skills?: string[];
  learningObjectives?: string[];
  resources?: RoadmapResource[];
  projects?: RoadmapProject[];
  assessments?: RoadmapAssessment[];
  estimatedHours?: number;
}

interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  duration?: string;
  objectives?: string[];
  weeks: RoadmapWeek[];
}

interface RoadmapProgress {
  currentPhase?: number;
  currentWeek?: number;
  completedWeeks: number[];
  completedResources: string[];
  overallProgress?: number;
}

interface Roadmap {
  _id: string;
  targetRole?: string;
  targetJobId?: { _id: string; title: string };
  targetJobTitle?: string;
  duration: number;
  difficulty: RoadmapDifficulty;
  estimatedTotalHours?: number;
  // legacy flat weeks (mock)
  weeks?: RoadmapWeek[];
  // official phases structure
  phases?: RoadmapPhase[];
  skillGaps?: {
    critical?: string[];
    important?: string[];
    optional?: string[];
  };
  milestones?: {
    weekNumber: number;
    title: string;
    description?: string;
    isCompleted?: boolean;
  }[];
  successMetrics?: string[];
  totalDuration?: string;
  progress?: RoadmapProgress;
  metadata?: {
    generationMethod?: string;
    models?: {
      skillExtraction?: string;
      semanticMatching?: string;
      resourceMatching?: string;
    };
    generatedAt?: string;
  };
}

interface RoadmapListItem {
  _id: string;
  targetJobTitle?: string;
  targetRole?: string;
  duration: number;
  difficulty: string;
  progress?: number;
  createdAt?: string;
}

// 🎯 MOCK DATA: dùng để xem UI khi chưa có dữ liệu thật hoặc backend lỗi
const MOCK_ROADMAPS: Roadmap[] = [
  {
    _id: "mock-frontend",
    targetRole: "Frontend Developer (React/TypeScript)",
    duration: 12,
    difficulty: "intermediate",
    totalDuration: "12 weeks",
    estimatedTotalHours: 180,
    phases: [
      {
        phaseNumber: 1,
        title: "Foundation Phase",
        duration: "4 weeks",
        objectives: [
          "Nắm chắc nền tảng web frontend",
          "Hiểu rõ HTML/CSS/JS hiện đại",
        ],
        weeks: [
          {
            weekNumber: 1,
            title: "Nền tảng HTML & CSS",
            focus: "Làm chủ layout cơ bản, typography, màu sắc, spacing.",
            skills: ["HTML5", "Modern CSS", "Flexbox"],
            learningObjectives: [
              "Hiểu cấu trúc semantic HTML",
              "Xây dựng layout responsive với Flexbox",
            ],
            resources: [
              {
                _id: "mock-res-html-mdn",
                type: "documentation",
                title: "MDN – HTML: cấu trúc & ngữ nghĩa",
                url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
                provider: "MDN Web Docs",
                difficulty: "beginner",
                isFree: true,
                rating: 5,
                credibility: 0.9,
                source: "other",
              },
              {
                _id: "mock-res-css-traversy",
                type: "video",
                title: "Modern HTML & CSS from scratch",
                url: "https://www.youtube.com/watch?v=mU6anWqZJcc",
                provider: "YouTube – Traversy Media",
                duration: "2.5 hours",
                difficulty: "beginner",
                isFree: true,
                rating: 4.8,
                credibility: 0.85,
                source: "youtube",
              },
            ],
            projects: [
              {
                title: "Landing page cơ bản",
                description:
                  "Thiết kế một landing page giới thiệu bản thân với layout responsive.",
                difficulty: "beginner",
                estimatedTime: "4–6 giờ",
                skills: ["HTML", "CSS"],
              },
            ],
          },
          {
            weekNumber: 2,
            title: "JavaScript & TypeScript Essentials",
            focus: "Tập trung vào ES6+ và type safety với TypeScript.",
            skills: ["ES6+", "TypeScript basics"],
            learningObjectives: [
              "Hiểu arrow function, destructuring, spread",
              "Dùng interface & generics trong TypeScript",
            ],
          },
        ],
      },
    ],
    skillGaps: {
      critical: ["React hooks", "TypeScript", "Responsive UI"],
      important: ["State management", "Design system", "Form UX"],
      optional: ["Animation", "Accessibility (a11y)"],
    },
    metadata: {
      generationMethod: "self-sufficient-nlp",
      models: {
        skillExtraction: "PhoBERT NER",
        semanticMatching: "Sentence-BERT",
        resourceMatching: "TF-IDF + ChromaDB",
      },
      generatedAt: new Date().toISOString(),
    },
  },
  {
    _id: "mock-data",
    targetJobTitle: "Data Engineer (Python/SQL)",
    duration: 10,
    difficulty: "advanced",
    estimatedTotalHours: 100,
    weeks: [
      {
        weekNumber: 1,
        title: "Data Pipelines Fundamentals",
        focus: "Hiểu kiến trúc data pipeline, batch vs streaming.",
        skills: ["ETL basics", "Batch processing"],
        estimatedHours: 8,
        status: "in_progress",
      },
      {
        weekNumber: 2,
        title: "SQL for Analytics & Warehousing",
        focus: "Viết truy vấn tối ưu, window functions, indexing.",
        skills: ["Advanced SQL", "Query optimization"],
        estimatedHours: 10,
        status: "pending",
      },
    ],
    skillGaps: {
      critical: ["Advanced SQL", "ETL pipelines"],
      important: ["Data modeling"],
      optional: ["Streaming (Kafka)"],
    },
  },
];

export default function SkillRoadmapsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [roadmaps, setRoadmaps] = useState<RoadmapListItem[]>([]);
  const [popularRoadmaps, setPopularRoadmaps] = useState<RoadmapListItem[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "popular">("my");

  const selectedIdFromUrl = searchParams.get("id");

  // Fetch my roadmaps
  useEffect(() => {
    if (!user) return;
    
    const fetchMyRoadmaps = async () => {
      try {
        setLoadingList(true);
        setError(null);
        // Use NLP API: GET /api/nlp/my-roadmaps
        const response = await nlpService.getMyRoadmaps();
        const items: any[] = response.data || [];

        if (!items || items.length === 0) {
          setRoadmaps([]);
        } else {
          setRoadmaps(
            items.map((rm) => ({
              _id: rm._id,
              targetJobTitle: rm.targetJobId?.title || rm.targetRole,
              targetRole: rm.targetRole,
              duration: rm.timeframe || 12,
              difficulty: (rm.difficulty || "intermediate") as RoadmapDifficulty,
              progress: rm.progress?.overall || 0,
              createdAt: rm.createdAt,
            }))
          );
          // Auto-select first roadmap if none selected
          if (!selectedIdFromUrl && items.length > 0) {
            handleSelectRoadmap(items[0]._id, false);
          }
        }
      } catch (e: any) {
        console.error("Failed to load my roadmaps:", e);
        setRoadmaps([]);
        setError("Không thể tải danh sách lộ trình của bạn.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchMyRoadmaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch popular roadmaps
  useEffect(() => {
    const fetchPopularRoadmaps = async () => {
      try {
        setLoadingPopular(true);
        const response = await nlpService.getPopularRoadmaps(10);
        const items: any[] = response.data || [];

        if (items.length > 0) {
          setPopularRoadmaps(
            items.map((rm) => ({
              _id: rm._id,
              targetJobTitle: rm.targetJobId?.title || rm.targetRole,
              targetRole: rm.targetRole,
              duration: rm.timeframe || 12,
              difficulty: (rm.difficulty || "intermediate") as RoadmapDifficulty,
              progress: rm.progress?.overall || 0,
              createdAt: rm.createdAt,
            }))
          );
        }
      } catch (e: any) {
        console.error("Failed to load popular roadmaps:", e);
        // Don't show error for popular roadmaps, just leave empty
      } finally {
        setLoadingPopular(false);
      }
    };

    fetchPopularRoadmaps();
  }, []);

  useEffect(() => {
    if (selectedIdFromUrl) {
      handleSelectRoadmap(selectedIdFromUrl, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdFromUrl]);

  // Helper function to transform skillGaps from array format to object format
  const transformSkillGaps = (skillGaps: any): { critical: string[]; important: string[]; optional: string[] } | undefined => {
    if (!skillGaps) return undefined;
    
    // If already in object format, return as is
    if (skillGaps.critical || skillGaps.important || skillGaps.optional) {
      return {
        critical: skillGaps.critical || [],
        important: skillGaps.important || [],
        optional: skillGaps.optional || [],
      };
    }
    
    // If it's an array, transform it
    if (Array.isArray(skillGaps)) {
      const result = {
        critical: [] as string[],
        important: [] as string[],
        optional: [] as string[],
      };
      
      skillGaps.forEach((gap: any) => {
        const skillName = gap.skill || gap.skillName || gap;
        const priority = gap.priority?.toLowerCase() || 'medium';
        
        if (priority === 'critical' || priority === 'high') {
          result.critical.push(skillName);
        } else if (priority === 'important' || priority === 'medium') {
          result.important.push(skillName);
        } else {
          result.optional.push(skillName);
        }
      });
      
      return result;
    }
    
    return undefined;
  };

  const handleSelectRoadmap = async (id: string, updateUrl = true) => {
    try {
      setLoadingDetail(true);
      setError(null);
      if (updateUrl) {
        const qs = new URLSearchParams(searchParams?.toString() || "");
        qs.set("id", id);
        router.push(`/roadmaps?${qs.toString()}`);
      }

      const res = await api.client.get(`/roadmaps/${id}`);
      const roadmap: Roadmap = res.data?.data || res.data;
      
      // Transform skillGaps if needed
      if (roadmap) {
        roadmap.skillGaps = transformSkillGaps(roadmap.skillGaps);
      }
      
      setSelectedRoadmap(roadmap);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Không thể tải chi tiết lộ trình."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGenerateFromJob = () => {
    // Chuyển tới trang search jobs với mode generate-roadmap
    router.push("/search?mode=generate-roadmap");
  };

  const computeOverallProgress = (roadmap: Roadmap | null): number => {
    if (!roadmap) return 0;
    if (roadmap.progress?.overallProgress != null) {
      return roadmap.progress.overallProgress;
    }
    const totalWeeks =
      roadmap.phases?.reduce(
        (acc, p) => acc + (p.weeks ? p.weeks.length : 0),
        0
      ) ?? roadmap.weeks?.length ?? 0;
    if (!totalWeeks) return 0;
    const completed =
      roadmap.progress?.completedWeeks?.length ??
      roadmap.weeks?.filter((w) => w.estimatedHours && w.estimatedHours > 0)
        .length ??
      0;
    return Math.round((completed / totalWeeks) * 100);
  };

  const difficultyLabel = (d: RoadmapDifficulty) => {
    switch (d) {
      case "beginner":
        return "Mới bắt đầu";
      case "intermediate":
        return "Trung cấp";
      case "advanced":
        return "Nâng cao";
      default:
        return d;
    }
  };

  const difficultyColor = (d: RoadmapDifficulty) => {
    switch (d) {
      case "beginner":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "intermediate":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "advanced":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const isResourceCompleted = (roadmap: Roadmap, resourceId?: string) => {
    if (!resourceId) return false;
    return roadmap.progress?.completedResources?.includes(resourceId) ?? false;
  };

  const handleMarkResourceCompleted = async (
    roadmap: Roadmap,
    phaseNumber: number | undefined,
    weekNumber: number,
    resourceId?: string
  ) => {
    if (!resourceId) return;
    // Cập nhật UI trước cho mượt
    setSelectedRoadmap((prev) => {
      if (!prev || prev._id !== roadmap._id) return prev;
      const already =
        prev.progress?.completedResources?.includes(resourceId) ?? false;
      if (already) return prev;
      const next: Roadmap = {
        ...prev,
        progress: {
          completedWeeks: prev.progress?.completedWeeks ?? [],
          completedResources: [
            ...(prev.progress?.completedResources ?? []),
            resourceId,
          ],
          currentPhase: prev.progress?.currentPhase ?? phaseNumber,
          currentWeek: prev.progress?.currentWeek ?? weekNumber,
          overallProgress: computeOverallProgress(prev),
        },
      };
      return next;
    });

    try {
      await api.client.put(
        `/nlp/learning-roadmap/${roadmap._id}/progress`,
        {
          roadmapId: roadmap._id,
          weekNumber,
          resourceId,
          phaseNumber,
        }
      );
    } catch (e) {
      console.error("Failed to update resource progress", e);
    }
  };

  const openResource = (url?: string) => {
    if (!url) return;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const renderResourceIcon = (resource: RoadmapResource) => {
    if (resource.type === "video") return <PlayCircle className="w-3.5 h-3.5" />;
    if (resource.type === "documentation" || resource.type === "article")
      return <FileText className="w-3.5 h-3.5" />;
    if (resource.source === "youtube") return <Youtube className="w-3.5 h-3.5" />;
    return <BookOpen className="w-3.5 h-3.5" />;
  };

  return (
    <PageLayout>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.97_0.02_210)_0%,white_40%)] pb-16">
        {/* Ambient gradients */}
        <div
          className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,oklch(0.65_0.13_200/.20),transparent_70%)] blur-2xl"
          style={{ animation: "float 18s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute right-[-80px] top-64 h-80 w-80 rounded-full bg-[radial-gradient(circle,oklch(0.78_0.08_210/.18),transparent_75%)] blur-3xl"
          style={{ animation: "float 22s ease-in-out infinite reverse" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-[oklch(0.60_0.12_195)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.55_0.08_210)]">
                  LỘ TRÌNH PHÁT TRIỂN KỸ NĂNG
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Học thông minh, phát triển đúng hướng
              </h1>
              <p className="text-sm md:text-base text-slate-600 max-w-2xl">
                Xem và quản lý các lộ trình học tập cá nhân hóa theo công việc
                mục tiêu. Theo dõi tiến độ từng tuần, từng kỹ năng và hoàn
                thành mục tiêu nghề nghiệp của bạn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <Button
                size="lg"
                className="bg-[oklch(0.60_0.12_195)] hover:bg-[oklch(0.56_0.11_195)] text-white shadow-lg shadow-[oklch(0.60_0.12_195/_0.3)]"
                onClick={handleGenerateFromJob}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Tạo lộ trình từ công việc mơ ước
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/profile")}
              >
                <Target className="w-4 h-4 mr-2" />
                Cập nhật kỹ năng hiện tại
              </Button>
            </div>
          </div>

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            {/* Left: list of roadmaps */}
            <Card className="lg:col-span-1 border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <CardHeader className="pb-3">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "my" | "popular")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-3">
                    <TabsTrigger value="my" className="text-xs">
                      Của tôi
                    </TabsTrigger>
                    <TabsTrigger value="popular" className="text-xs">
                      Phổ biến
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900">
                    {activeTab === "my" ? "Lộ trình của bạn" : "Lộ trình phổ biến"}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {activeTab === "my" ? roadmaps.length : popularRoadmaps.length} lộ trình
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {activeTab === "my" ? (
                  <>
                    {loadingList && (
                      <p className="text-xs text-slate-500 py-4">
                        Đang tải danh sách lộ trình...
                      </p>
                    )}
                    {!loadingList && !user && (
                      <p className="text-xs text-slate-500 py-4">
                        Đăng nhập để xem lộ trình của bạn.
                      </p>
                    )}
                    {!loadingList && user && roadmaps.length === 0 && (
                      <p className="text-xs text-slate-500 py-4">
                        Bạn chưa có lộ trình nào. Hãy tạo lộ trình từ công việc mơ
                        ước của bạn.
                      </p>
                    )}
                    {!loadingList && roadmaps.length > 0 && (
                      <ScrollArea className="h-[420px] pr-2">
                        <div className="space-y-3">
                          {roadmaps.map((rm) => {
                        const isActive = selectedRoadmap?._id === rm._id;
                        const progress = rm["progress"] ?? 0;
                        return (
                          <button
                            key={rm._id}
                            onClick={() => handleSelectRoadmap(rm._id)}
                            className={`w-full text-left rounded-2xl border px-3 py-3.5 transition-all duration-300 ${
                              isActive
                                ? "border-[oklch(0.60_0.12_195)] bg-[oklch(0.97_0.02_210)] shadow-sm"
                                : "border-slate-200/70 bg-white/80 hover:border-[oklch(0.60_0.12_195/.5)] hover:bg-[oklch(0.98_0.02_210)]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-900 mb-1 line-clamp-2">
                                  {rm.targetJobTitle}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <Badge
                                    variant="outline"
                                    className="border-slate-200 text-[10px] flex items-center gap-1"
                                  >
                                    <Clock className="w-3 h-3" />
                                    {rm.duration} tuần
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] border ${difficultyColor(
                                      rm.difficulty as any
                                    )}`}
                                  >
                                    {difficultyLabel(
                                      rm.difficulty as any
                                    ).toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <span className="text-[10px] font-medium text-[oklch(0.55_0.12_195)]">
                                {progress}%
                              </span>
                            </div>
                            <Progress
                              value={progress}
                              className="h-1.5 mt-1.5 bg-slate-100"
                            />
                          </button>
                        );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                ) : (
                  <>
                    {loadingPopular && (
                      <p className="text-xs text-slate-500 py-4">
                        Đang tải lộ trình phổ biến...
                      </p>
                    )}
                    {!loadingPopular && popularRoadmaps.length === 0 && (
                      <p className="text-xs text-slate-500 py-4">
                        Chưa có lộ trình phổ biến.
                      </p>
                    )}
                    {!loadingPopular && popularRoadmaps.length > 0 && (
                      <ScrollArea className="h-[420px] pr-2">
                        <div className="space-y-3">
                          {popularRoadmaps.map((rm) => {
                            const isActive = selectedRoadmap?._id === rm._id;
                            const progress = rm["progress"] ?? 0;
                            return (
                              <button
                                key={rm._id}
                                onClick={() => handleSelectRoadmap(rm._id)}
                                className={`w-full text-left rounded-2xl border px-3 py-3.5 transition-all duration-300 ${
                                  isActive
                                    ? "border-[oklch(0.60_0.12_195)] bg-[oklch(0.97_0.02_210)] shadow-sm"
                                    : "border-slate-200/70 bg-white/80 hover:border-[oklch(0.60_0.12_195/.5)] hover:bg-[oklch(0.98_0.02_210)]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-900 mb-1 line-clamp-2">
                                      {rm.targetJobTitle}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                      <Badge
                                        variant="outline"
                                        className="border-slate-200 text-[10px] flex items-center gap-1"
                                      >
                                        <Clock className="w-3 h-3" />
                                        {rm.duration} tuần
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] border ${difficultyColor(
                                          rm.difficulty as any
                                        )}`}
                                      >
                                        {difficultyLabel(
                                          rm.difficulty as any
                                        ).toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-medium text-[oklch(0.55_0.12_195)]">
                                    {progress}%
                                  </span>
                                </div>
                                <Progress
                                  value={progress}
                                  className="h-1.5 mt-1.5 bg-slate-100"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right: roadmap detail */}
            <div className="lg:col-span-3 space-y-4">
              {error && (
                <Card className="border-rose-200 bg-rose-50/70">
                  <CardContent className="py-3 text-xs text-rose-700">
                    {error}
                  </CardContent>
                </Card>
              )}

              {loadingDetail && (
                <Card className="border-slate-200/80 bg-white/80">
                  <CardContent className="py-6 text-xs text-slate-500">
                    Đang tải chi tiết lộ trình...
                  </CardContent>
                </Card>
              )}

              {!loadingDetail && !selectedRoadmap && roadmaps.length > 0 && (
                <Card className="border-slate-200/80 bg-white/80">
                  <CardContent className="py-6 text-xs text-slate-500">
                    Hãy chọn một lộ trình ở bên trái để xem chi tiết.
                  </CardContent>
                </Card>
              )}

              {!loadingDetail && !selectedRoadmap && roadmaps.length === 0 && (
                <Card className="border-slate-200/80 bg-white/80">
                  <CardContent className="py-6 text-xs text-slate-500">
                    Bạn chưa có lộ trình nào. Nhấn{" "}
                    <span className="font-semibold">“Tạo lộ trình từ công việc mơ ước”</span>{" "}
                    để bắt đầu.
                  </CardContent>
                </Card>
              )}

              {selectedRoadmap && (
                <>
                  {/* Overview card */}
                  <Card className="border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.10_200)]">
                            <GraduationCap className="w-4 h-4" />
                            <span>Lộ trình hướng tới</span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                            {selectedRoadmap.targetJobTitle ||
                              selectedRoadmap.targetRole}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="border-slate-200 text-[10px] flex items-center gap-1"
                            >
                              <Clock className="w-3 h-3" />
                              {selectedRoadmap.duration} tuần
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`border text-[10px] flex items-center gap-1 ${difficultyColor(
                                selectedRoadmap.difficulty
                              )}`}
                            >
                              <Target className="w-3 h-3" />
                              {difficultyLabel(
                                selectedRoadmap.difficulty
                              ).toUpperCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-slate-200 text-[10px] flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              {selectedRoadmap.estimatedTotalHours} giờ học
                            </Badge>
                          </div>
                        </div>

                        <div className="w-full md:w-64">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-500">
                              Tiến độ tổng thể
                            </span>
                            <span className="text-xs font-semibold text-[oklch(0.55_0.12_195)]">
                              {computeOverallProgress(selectedRoadmap)}%
                            </span>
                          </div>
                          <Progress
                            value={computeOverallProgress(selectedRoadmap)}
                            className="h-2 bg-slate-100"
                          />
                          <p className="mt-1 text-[11px] text-slate-500">
                            Hoàn thành đều đặn từng tuần để đạt mục tiêu nghề
                            nghiệp của bạn.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs: weeks / skills */}
                  <Tabs defaultValue="weeks" className="mt-2">
                    <TabsList className="bg-slate-100/70 p-0.5 rounded-full w-fit">
                      <TabsTrigger
                        value="weeks"
                        className="rounded-full px-4 py-1 text-xs data-[state=active]:bg-white"
                      >
                        Lộ trình theo tuần
                      </TabsTrigger>
                      <TabsTrigger
                        value="skills"
                        className="rounded-full px-4 py-1 text-xs data-[state=active]:bg-white"
                      >
                        Khoảng cách kỹ năng
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="weeks" className="mt-4">
                      <ScrollArea className="h-[480px] rounded-3xl border border-slate-200/70 bg-white/80 p-4">
                        <div className="space-y-6">
                          {(selectedRoadmap.phases ?? []).map((phase) => (
                            <div key={phase.phaseNumber}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-[11px] font-semibold text-[oklch(0.55_0.12_195)] uppercase tracking-[0.18em]">
                                    Phase {phase.phaseNumber}
                                  </p>
                                  <h3 className="text-sm font-semibold text-slate-900">
                                    {phase.title}
                                  </h3>
                                </div>
                                {phase.duration && (
                                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {phase.duration}
                                  </span>
                                )}
                              </div>
                              <div className="relative pl-4">
                                <div className="absolute left-1 top-1 bottom-1 w-px bg-gradient-to-b from-[oklch(0.80_0.05_210)] via-[oklch(0.90_0.03_220)] to-[oklch(0.80_0.05_210)]" />
                                <div className="space-y-4">
                                  {phase.weeks.map((week) => {
                                    const completed =
                                      selectedRoadmap.progress?.completedWeeks?.includes(
                                        week.weekNumber
                                      ) ?? false;
                                    const current =
                                      selectedRoadmap.progress?.currentWeek ===
                                      week.weekNumber;
                                    const statusLabel = completed
                                      ? "Đã hoàn thành"
                                      : current
                                      ? "Tuần hiện tại"
                                      : "Chưa bắt đầu";
                                    const statusColor = completed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : current
                                      ? "bg-amber-50 text-amber-700 border-amber-100"
                                      : "bg-slate-50 text-slate-600 border-slate-100";

                                    return (
                                      <div
                                        key={`${phase.phaseNumber}-${week.weekNumber}`}
                                        className="relative ml-4 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3.5 shadow-[0_10px_25px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                                      >
                                        <div className="absolute -left-4 top-4 h-3 w-3 rounded-full bg-white border border-[oklch(0.60_0.12_195)] shadow-sm" />
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="text-[11px] font-semibold text-[oklch(0.55_0.12_195)] uppercase tracking-[0.18em]">
                                                Tuần {week.weekNumber}
                                              </p>
                                              <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                                                {week.title || week.focus}
                                              </h4>
                                              <p className="mt-1 text-[11px] text-slate-600">
                                                {week.focus}
                                              </p>
                                            </div>
                                            <Badge
                                              variant="outline"
                                              className={`text-[10px] flex items-center gap-1 border ${statusColor}`}
                                            >
                                              {completed ? (
                                                <CheckCircle2 className="w-3 h-3" />
                                              ) : (
                                                <Clock className="w-3 h-3" />
                                              )}
                                              {statusLabel}
                                            </Badge>
                                          </div>

                                          {week.learningObjectives &&
                                            week.learningObjectives.length >
                                              0 && (
                                              <div className="mt-1 space-y-1.5">
                                                <p className="text-[11px] font-semibold text-slate-700">
                                                  Mục tiêu học tập
                                                </p>
                                                <ul className="space-y-0.5">
                                                  {week.learningObjectives.map(
                                                    (obj) => (
                                                      <li
                                                        key={obj}
                                                        className="text-[11px] text-slate-600 flex gap-1.5"
                                                      >
                                                        <span className="mt-[3px] h-1 w-1 rounded-full bg-[oklch(0.60_0.12_195)]" />
                                                        <span>{obj}</span>
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}

                                          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                                            <div className="flex flex-wrap gap-1.5">
                                              {week.skills?.slice(0, 6).map(
                                                (skill) => (
                                                  <span
                                                    key={skill}
                                                    className="inline-flex items-center rounded-full border border-[oklch(0.82_0.04_210)] bg-[oklch(0.97_0.02_215)] px-2 py-0.5 text-[11px] text-[oklch(0.48_0.09_215)]"
                                                  >
                                                    {skill}
                                                  </span>
                                                )
                                              )}
                                              {week.skills &&
                                                week.skills.length > 6 && (
                                                  <span className="text-[11px] text-slate-500">
                                                    +
                                                    {week.skills.length - 6} kỹ
                                                    năng nữa
                                                  </span>
                                                )}
                                            </div>
                                            {week.estimatedHours && (
                                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                ~{week.estimatedHours} giờ
                                              </div>
                                            )}
                                          </div>

                                          {week.resources &&
                                            week.resources.length > 0 && (
                                              <div className="mt-2">
                                                <p className="text-[11px] font-semibold text-slate-700 mb-1">
                                                  Tài liệu đề xuất
                                                </p>
                                                <div className="flex flex-col gap-1.5">
                                                  {week.resources.map(
                                                    (res) => {
                                                      const completedRes =
                                                        isResourceCompleted(
                                                          selectedRoadmap,
                                                          res._id
                                                        );
                                                      return (
                                                        <div
                                                          key={res._id || res.title}
                                                          className={`group flex items-center justify-between gap-3 rounded-xl border px-2.5 py-1.5 text-[11px] cursor-pointer transition-all duration-200 ${
                                                            completedRes
                                                              ? "border-emerald-200 bg-emerald-50/70"
                                                              : "border-slate-200/80 bg-white hover:border-[oklch(0.60_0.12_195/.45)] hover:bg-[oklch(0.98_0.02_215)]"
                                                          }`}
                                                          onClick={() =>
                                                            openResource(res.url)
                                                          }
                                                        >
                                                          <div className="flex items-center gap-2 min-w-0">
                                                            <span className="shrink-0 text-[oklch(0.60_0.12_195)]">
                                                              {renderResourceIcon(
                                                                res
                                                              )}
                                                            </span>
                                                            <div className="min-w-0">
                                                              <p
                                                                className={`truncate font-medium ${
                                                                  completedRes
                                                                    ? "text-emerald-800"
                                                                    : "text-slate-800"
                                                                }`}
                                                              >
                                                                {res.title}
                                                              </p>
                                                              <p className="text-[10px] text-slate-500 truncate">
                                                                {res.provider ||
                                                                  res.type}
                                                                {res.duration &&
                                                                  ` • ${res.duration}`}
                                                              </p>
                                                            </div>
                                                          </div>
                                                          <button
                                                            type="button"
                                                            onClick={(ev) => {
                                                              ev.stopPropagation();
                                                              handleMarkResourceCompleted(
                                                                selectedRoadmap,
                                                                phase.phaseNumber,
                                                                week.weekNumber,
                                                                res._id
                                                              );
                                                            }}
                                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 transition-colors ${
                                                              completedRes
                                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                                : "border-slate-200 bg-white text-slate-600 hover:border-[oklch(0.60_0.12_195)] hover:text-[oklch(0.60_0.12_195)]"
                                                            }`}
                                                          >
                                                            {completedRes ? (
                                                              <CheckSquare2 className="w-3 h-3" />
                                                            ) : (
                                                              <CheckCircle2 className="w-3 h-3" />
                                                            )}
                                                            <span className="text-[9px] font-medium">
                                                              {completedRes
                                                                ? "Đã học"
                                                                : "Đánh dấu đã học"}
                                                            </span>
                                                          </button>
                                                        </div>
                                                      );
                                                    }
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          {week.projects &&
                                            week.projects.length > 0 && (
                                              <div className="mt-2">
                                                <p className="text-[11px] font-semibold text-slate-700 mb-1">
                                                  Bài tập / Dự án
                                                </p>
                                                <ul className="space-y-0.5">
                                                  {week.projects.map(
                                                    (proj) => (
                                                      <li
                                                        key={proj.title}
                                                        className="text-[11px] text-slate-600"
                                                      >
                                                        <span className="font-medium text-slate-800">
                                                          {proj.title}
                                                        </span>
                                                        {proj.estimatedTime && (
                                                          <span className="ml-1 text-slate-400">
                                                            • {proj.estimatedTime}
                                                          </span>
                                                        )}
                                                        {proj.description && (
                                                          <span className="ml-1">
                                                            – {proj.description}
                                                          </span>
                                                        )}
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="skills" className="mt-4">
                      <Card className="border-slate-200/80 bg-white/90">
                        <CardContent className="pt-4 pb-5">
                          {!selectedRoadmap.skillGaps && (
                            <p className="text-xs text-slate-500">
                              Chưa có dữ liệu khoảng cách kỹ năng chi tiết cho
                              lộ trình này.
                            </p>
                          )}
                          {selectedRoadmap.skillGaps && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-[0.16em] mb-2">
                                  Kỹ năng quan trọng (Critical)
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {!selectedRoadmap.skillGaps.critical || selectedRoadmap.skillGaps.critical.length === 0 ? (
                                    <span className="text-[11px] text-slate-500">
                                      Không có kỹ năng critical.
                                    </span>
                                  ) : (
                                    selectedRoadmap.skillGaps.critical.map(
                                      (s) => (
                                        <span
                                          key={s}
                                          className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 text-[11px]"
                                        >
                                          {s}
                                        </span>
                                      )
                                    )
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.16em] mb-2">
                                  Kỹ năng nên có (Important)
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {!selectedRoadmap.skillGaps.important || selectedRoadmap.skillGaps.important.length === 0 ? (
                                    <span className="text-[11px] text-slate-500">
                                      Không có kỹ năng important.
                                    </span>
                                  ) : (
                                    selectedRoadmap.skillGaps.important.map(
                                      (s) => (
                                        <span
                                          key={s}
                                          className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 text-[11px]"
                                        >
                                          {s}
                                        </span>
                                      )
                                    )
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.16em] mb-2">
                                  Kỹ năng bổ sung (Optional)
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {!selectedRoadmap.skillGaps.optional || selectedRoadmap.skillGaps.optional.length === 0 ? (
                                    <span className="text-[11px] text-slate-500">
                                      Không có kỹ năng optional.
                                    </span>
                                  ) : (
                                    selectedRoadmap.skillGaps.optional.map(
                                      (s) => (
                                        <span
                                          key={s}
                                          className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 text-[11px]"
                                        >
                                          {s}
                                        </span>
                                      )
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
