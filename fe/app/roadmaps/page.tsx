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
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, nlpService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const [roadmaps, setRoadmaps] = useState<RoadmapListItem[]>([]);
  const [popularRoadmaps, setPopularRoadmaps] = useState<RoadmapListItem[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "popular">("my");
  const [weekCompletedModal, setWeekCompletedModal] = useState<{
    open: boolean;
    skill?: string;
    weekNumber?: number;
    phaseNumber?: number;
  }>({ open: false });

  const selectedIdFromUrl = searchParams.get("id");

  // Fetch my roadmaps - expose function for refetching
  const fetchMyRoadmaps = useCallback(async () => {
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
          items.map((rm) => {
            // Calculate progress if not provided or if it's 0 but we have completed resources
            let progress = rm.progress?.overall || 0;
            
            // If progress is 0 but we have completed resources, calculate it
            if (progress === 0 && rm.progress?.completedResources?.length > 0) {
              // Count total resources
              let totalResources = 0;
              if (rm.phases && rm.phases.length > 0) {
                rm.phases.forEach((phase: any) => {
                  if (phase.weeks) {
                    phase.weeks.forEach((week: any) => {
                      if (week.resources) {
                        totalResources += week.resources.length;
                      }
                    });
                  }
                });
              } else if (rm.weeks) {
                rm.weeks.forEach((week: any) => {
                  if (week.resources) {
                    totalResources += week.resources.length;
                  }
                });
              }
              
              if (totalResources > 0) {
                progress = Math.round(
                  (rm.progress.completedResources.length / totalResources) * 100
                );
              }
            }
            
            return {
              _id: rm._id,
              targetJobTitle: rm.targetJobId?.title || rm.targetRole,
              targetRole: rm.targetRole,
              duration: rm.timeframe || 12,
              difficulty: (rm.difficulty || "intermediate") as RoadmapDifficulty,
              progress: progress,
              createdAt: rm.createdAt,
            };
          })
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
  }, [selectedIdFromUrl]);

  // Fetch my roadmaps on mount and when user changes
  useEffect(() => {
    if (!user) return;
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
    if (roadmap.progress?.overallProgress != null && roadmap.progress.overallProgress > 0) {
      // If progress was already computed and > 0, use it
      // But we'll recalculate if resources changed
    }
    
    // Count total resources across all phases and weeks
    let totalResources = 0;
    let completedResources = roadmap.progress?.completedResources?.length ?? 0;
    
    if (roadmap.phases && roadmap.phases.length > 0) {
      roadmap.phases.forEach((phase) => {
        if (phase.weeks) {
          phase.weeks.forEach((week) => {
            if (week.resources) {
              totalResources += week.resources.length;
            }
          });
        }
      });
    } else if (roadmap.weeks) {
      roadmap.weeks.forEach((week) => {
        if (week.resources) {
          totalResources += week.resources.length;
        }
      });
    }
    
    // If we have resources, calculate based on completed resources
    if (totalResources > 0) {
      return Math.round((completedResources / totalResources) * 100);
    }
    
    // Fallback to week-based calculation
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
    // Normalize to string for comparison
    const resourceIdStr = String(resourceId);
    const completedResources = (roadmap.progress?.completedResources || []).map((id: any) => String(id));
    return completedResources.includes(resourceIdStr);
  };

  // Check if a week is completed (all resources are completed)
  const checkWeekCompleted = (
    roadmap: Roadmap,
    phaseNumber: number | undefined,
    weekNumber: number
  ): { isCompleted: boolean; skill?: string } => {
    console.log('🔎 checkWeekCompleted called:', {
      phaseNumber,
      weekNumber,
      hasPhases: !!roadmap.phases,
      phasesCount: roadmap.phases?.length || 0,
      hasWeeks: !!roadmap.weeks,
      weeksCount: roadmap.weeks?.length || 0,
    });
    
    let targetWeek: any = null;
    
    // Find the week
    if (phaseNumber && roadmap.phases) {
      const phase = roadmap.phases.find((p: any) => p.phaseNumber === phaseNumber);
      console.log('🔎 Phase found:', {
        phaseNumber,
        found: !!phase,
        weeksInPhase: phase?.weeks?.length || 0,
      });
      
      if (phase?.weeks) {
        targetWeek = phase.weeks.find((w: any) => w.weekNumber === weekNumber);
        console.log('🔎 Week found in phase:', {
          weekNumber,
          found: !!targetWeek,
          resourcesInWeek: targetWeek?.resources?.length || 0,
        });
      }
    } else if (roadmap.weeks) {
      targetWeek = roadmap.weeks.find((w: any) => w.weekNumber === weekNumber);
      console.log('🔎 Week found in roadmap.weeks:', {
        weekNumber,
        found: !!targetWeek,
        resourcesInWeek: targetWeek?.resources?.length || 0,
      });
    }
    
    if (!targetWeek || !targetWeek.resources || targetWeek.resources.length === 0) {
      console.log('⚠️ No target week or no resources found');
      return { isCompleted: false };
    }
    
    // Check if all resources are completed
    // Convert all IDs to strings for comparison (handle both ObjectId and string)
    const allResourceIds = targetWeek.resources
      .map((r: any) => {
        const id = r._id || r.id;
        return id ? String(id) : null;
      })
      .filter(Boolean);
    
    const completedResourceIds = (roadmap.progress?.completedResources || [])
      .map((id: any) => String(id))
      .filter(Boolean);
    
    console.log('Resource completion check:', {
      weekNumber,
      phaseNumber,
      allResourceIds,
      completedResourceIds,
      totalResources: allResourceIds.length,
      completedCount: completedResourceIds.length,
    });
    
    const allCompleted = allResourceIds.length > 0 && 
      allResourceIds.every((id: string) => 
        completedResourceIds.includes(id)
      );
    
    if (!allCompleted) {
      return { isCompleted: false };
    }
    
    // Extract skill from week focus or title
    // Examples: "figma", "TUẦN 1 figma", "Week 1: Figma Fundamentals"
    const focus = (targetWeek.focus || targetWeek.title || "").trim();
    if (!focus) {
      return { isCompleted: true };
    }
    
    // Remove common prefixes (tuần, week, etc.) and extract skill name
    const normalized = focus.toLowerCase()
      .replace(/^(tuần|week)\s*\d+\s*:?\s*/i, '') // Remove "TUẦN 1:" or "Week 1:"
      .replace(/^[:\-]\s*/, '') // Remove leading colon/dash
      .trim();
    
    // Capitalize first letter for better display
    const skill = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    
    return {
      isCompleted: true,
      skill: skill || undefined,
    };
  };

  const handleMarkResourceCompleted = async (
    roadmap: Roadmap,
    phaseNumber: number | undefined,
    weekNumber: number,
    resourceId?: string
  ) => {
    if (!resourceId) return;
    
    // Helper function to update roadmap progress
    const updateRoadmapProgress = (prev: Roadmap): Roadmap => {
      const already =
        prev.progress?.completedResources?.includes(resourceId) ?? false;
      if (already) return prev;
      
      const updatedProgress = {
        completedWeeks: prev.progress?.completedWeeks ?? [],
        completedResources: [
          ...(prev.progress?.completedResources ?? []),
          resourceId,
        ],
        currentPhase: prev.progress?.currentPhase ?? phaseNumber,
        currentWeek: prev.progress?.currentWeek ?? weekNumber,
        overallProgress: 0, // Will be computed below
      };
      
      // Create updated roadmap with new progress
      const updated: Roadmap = {
        ...prev,
        progress: updatedProgress,
      };
      
      // Compute overall progress with updated roadmap
      updatedProgress.overallProgress = computeOverallProgress(updated);
      updated.progress = updatedProgress;
      
      return updated;
    };
    
    // Cập nhật selectedRoadmap
    setSelectedRoadmap((prev) => {
      if (!prev || prev._id !== roadmap._id) return prev;
      return updateRoadmapProgress(prev);
    });
    
    // Cập nhật roadmaps list trong sidebar ngay lập tức
    setRoadmaps((prevList) => {
      return prevList.map((item) => {
        if (item._id !== roadmap._id) return item;
        
        // Use the roadmap parameter directly (it's the current state)
        // Update the roadmap and compute new progress
        const updated = updateRoadmapProgress(roadmap);
        const newProgress = updated.progress?.overallProgress ?? item.progress;
        
        return {
          ...item,
          progress: newProgress,
        };
      });
    });

    try {
      const response = await api.client.put(
        `/nlp/learning-roadmap/${roadmap._id}/progress`,
        {
          roadmapId: roadmap._id,
          weekNumber,
          resourceId,
          phaseNumber,
        }
      );
      
      // Nếu API trả về roadmap đã cập nhật, dùng nó để sync
      console.log('📥 API Response received:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        weekNumber,
        phaseNumber,
        resourceId,
      });
      
      if (response.data?.success && response.data?.data) {
        const updatedRoadmap = response.data.data;
        const newProgress = updatedRoadmap.progress?.overallProgress ?? 
                           computeOverallProgress(updatedRoadmap);
        
        console.log('📊 Updated roadmap info:', {
          roadmapId: updatedRoadmap._id,
          completedResources: updatedRoadmap.progress?.completedResources?.length || 0,
          totalResources: updatedRoadmap.phases?.reduce((acc: number, p: any) => 
            acc + (p.weeks?.reduce((wAcc: number, w: any) => 
              wAcc + (w.resources?.length || 0), 0) || 0), 0) || 0,
          weekNumber,
          phaseNumber,
        });
        
        // Cập nhật lại selectedRoadmap từ response
        if (selectedRoadmap?._id === roadmap._id) {
          setSelectedRoadmap(updatedRoadmap);
        }
        
        // Cập nhật lại roadmaps list từ response
        setRoadmaps((prevList) => {
          return prevList.map((item) => {
            if (item._id !== roadmap._id) return item;
            return {
              ...item,
              progress: newProgress,
            };
          });
        });
        
        // Kiểm tra xem tuần đã hoàn thành chưa (tất cả resources đã completed)
        // Gọi ngay sau khi API response thành công, sử dụng updatedRoadmap từ response
        console.log('🔍 Starting week completed check...');
        const weekCompleted = checkWeekCompleted(updatedRoadmap, phaseNumber, weekNumber);
        console.log('🔍 Week completed check result:', {
          weekNumber,
          phaseNumber,
          isCompleted: weekCompleted.isCompleted,
          skill: weekCompleted.skill,
          roadmapId: roadmap._id,
          completedResourcesCount: updatedRoadmap.progress?.completedResources?.length || 0,
          totalResourcesInWeek: updatedRoadmap.phases?.[phaseNumber - 1]?.weeks?.[weekNumber - 1]?.resources?.length || 0,
        });
        
        if (weekCompleted.isCompleted && weekCompleted.skill) {
          // Tự động sync skill vào profile
          try {
            console.log('✅ Syncing skill to profile:', weekCompleted.skill);
            const syncResponse = await api.client.post(
              `/nlp/learning-roadmap/${roadmap._id}/sync-week-skill`,
              {
                weekNumber,
                phaseNumber,
                skill: weekCompleted.skill,
              }
            );
            
            console.log('✅ Sync response:', syncResponse.data);
            
            if (syncResponse.data?.success) {
              // Hiển thị modal thông báo
              setWeekCompletedModal({
                open: true,
                skill: weekCompleted.skill,
                weekNumber,
                phaseNumber,
              });
              
              // Cũng hiển thị toast để người dùng biết ngay
              toast({
                title: "🎉 Hoàn thành tuần học!",
                description: `Kỹ năng "${weekCompleted.skill}" đã được tự động bổ sung vào hồ sơ của bạn.`,
                duration: 5000,
              });
            }
          } catch (syncError) {
            console.error("❌ Failed to sync week skill:", syncError);
            toast({
              title: "Lỗi",
              description: "Không thể đồng bộ kỹ năng vào hồ sơ. Vui lòng thử lại.",
              variant: "destructive",
            });
          }
        } else if (weekCompleted.isCompleted && !weekCompleted.skill) {
          // Tuần đã hoàn thành nhưng không extract được skill
          console.warn('⚠️ Week completed but no skill extracted', {
            weekNumber,
            phaseNumber,
            weekFocus: updatedRoadmap.phases?.[phaseNumber - 1]?.weeks?.[weekNumber - 1]?.focus,
            weekTitle: updatedRoadmap.phases?.[phaseNumber - 1]?.weeks?.[weekNumber - 1]?.title,
          });
        } else {
          console.log('⏳ Week not yet completed', {
            weekNumber,
            phaseNumber,
            isCompleted: weekCompleted.isCompleted,
          });
        }
        
        // Refetch danh sách roadmaps để đảm bảo sync với server
        // Điều này đảm bảo khi reload trang, progress vẫn đúng
        if (user && fetchMyRoadmaps) {
          // Sử dụng setTimeout để tránh blocking UI update
          setTimeout(() => {
            fetchMyRoadmaps().catch((refreshError) => {
              console.error("Failed to refresh roadmaps list:", refreshError);
              // Không cần hiển thị error, vì UI đã được cập nhật ở trên
            });
          }, 500);
        }
      }
    } catch (e) {
      console.error("Failed to update resource progress", e);
      // Rollback UI changes on error
      // TODO: Could implement undo here if needed
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

  const handleCompleteRoadmap = async (roadmap: Roadmap) => {
    if (!roadmap._id) return;
    
    try {
      const response = await nlpService.completeRoadmap(roadmap._id);
      
      if (response.success) {
        const syncedSkills = response.data?.syncedSkills || [];
        const skillsCount = syncedSkills.length;
        
        // Cập nhật selectedRoadmap
        setSelectedRoadmap((prev) => {
          if (!prev || prev._id !== roadmap._id) return prev;
          return {
            ...prev,
            status: 'completed',
            progress: {
              ...prev.progress,
              overallProgress: 100,
              completedAt: new Date().toISOString(),
            },
          };
        });
        
        // Cập nhật roadmaps list
        setRoadmaps((prevList) => {
          return prevList.map((item) => {
            if (item._id !== roadmap._id) return item;
            return {
              ...item,
              progress: 100,
            };
          });
        });
        
        // Hiển thị thông báo thành công
        toast({
          title: "🎉 Hoàn thành lộ trình!",
          description: skillsCount > 0 
            ? `Đã bổ sung ${skillsCount} kỹ năng vào hồ sơ của bạn: ${syncedSkills.slice(0, 3).map(s => s.name).join(", ")}${skillsCount > 3 ? "..." : ""}`
            : "Lộ trình đã được đánh dấu hoàn thành.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể hoàn thành lộ trình. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to complete roadmap:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể hoàn thành lộ trình. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
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
                        {/* Complete Roadmap Button */}
                        {selectedRoadmap.status !== 'completed' && (
                          <div className="mt-3">
                            <Button
                              onClick={() => handleCompleteRoadmap(selectedRoadmap)}
                              className="w-full bg-[oklch(0.60_0.12_195)] hover:bg-[oklch(0.56_0.11_195)] text-white shadow-lg shadow-[oklch(0.60_0.12_195/_0.3)]"
                              size="sm"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Hoàn thành lộ trình và cập nhật kỹ năng
                            </Button>
                            <p className="mt-1 text-[10px] text-slate-500 text-center">
                              Tất cả kỹ năng từ lộ trình sẽ được tự động bổ sung vào hồ sơ của bạn (không cần học hết 100%)
                            </p>
                          </div>
                        )}
                        {selectedRoadmap.status === 'completed' && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Lộ trình đã hoàn thành
                            </p>
                          </div>
                        )}
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
                                                              const resourceId = res._id || res.id;
                                                              if (!resourceId) {
                                                                console.error('Resource missing ID:', res);
                                                                toast({
                                                                  title: "Lỗi",
                                                                  description: "Resource không có ID. Vui lòng thử lại.",
                                                                  variant: "destructive",
                                                                });
                                                                return;
                                                              }
                                                              console.log('Marking resource as completed:', {
                                                                resourceId,
                                                                resourceTitle: res.title,
                                                                weekNumber: week.weekNumber,
                                                                phaseNumber: phase.phaseNumber,
                                                              });
                                                              handleMarkResourceCompleted(
                                                                selectedRoadmap,
                                                                phase.phaseNumber,
                                                                week.weekNumber,
                                                                resourceId
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

      {/* Modal thông báo hoàn thành tuần học */}
      <Dialog
        open={weekCompletedModal.open}
        onOpenChange={(open) =>
          setWeekCompletedModal({ ...weekCompletedModal, open })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-[oklch(0.97_0.02_210)]">
              <CheckCircle2 className="w-10 h-10 text-[oklch(0.60_0.12_195)]" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold text-slate-900">
              🎉 Hoàn thành tuần học!
            </DialogTitle>
            <DialogDescription className="text-center text-slate-600 pt-2">
              {weekCompletedModal.weekNumber && (
                <p className="mb-2">
                  Bạn đã hoàn thành tất cả tài liệu học tập của{" "}
                  <span className="font-semibold text-[oklch(0.60_0.12_195)]">
                    Tuần {weekCompletedModal.weekNumber}
                  </span>
                  {weekCompletedModal.phaseNumber && (
                    <span className="text-slate-500">
                      {" "}
                      (Phase {weekCompletedModal.phaseNumber})
                    </span>
                  )}
                  .
                </p>
              )}
              {weekCompletedModal.skill && (
                <div className="mt-4 p-4 bg-[oklch(0.97_0.02_210)] rounded-lg border border-[oklch(0.90_0.03_220)]">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Kỹ năng đã được tự động bổ sung:
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[oklch(0.60_0.12_195)] text-white border-0 px-3 py-1 text-sm font-semibold">
                      {weekCompletedModal.skill}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Kỹ năng này đã được tự động thêm vào hồ sơ của bạn và sẽ
                    giúp bạn phù hợp hơn với các công việc yêu cầu kỹ năng này.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() =>
                setWeekCompletedModal({ ...weekCompletedModal, open: false })
              }
              className="bg-[oklch(0.60_0.12_195)] hover:bg-[oklch(0.56_0.11_195)] text-white"
            >
              Tuyệt vời!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
