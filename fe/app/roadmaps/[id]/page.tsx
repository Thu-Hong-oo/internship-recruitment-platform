"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { nlpService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Undo2, Pencil } from "lucide-react";

type Resource = {
  type: string;
  title: string;
  url?: string;
  provider?: string;
  difficulty?: string;
  duration?: string;
};

type Week = {
  weekNumber: number;
  focus: string;
  learningObjectives?: string[];
  resources?: Resource[];
  timeCommitment?: string;
};

type Phase = {
  phaseNumber: number;
  title: string;
  duration?: string | number;
  objectives?: string[];
  weeks?: Week[];
};

type Roadmap = {
  _id: string;
  targetRole: string;
  status: string;
  phases: Phase[];
  progress?: {
    currentPhase?: number;
    currentWeek?: number;
    overallProgress?: number;
  };
};

const defaultResource: Resource = {
  type: "course",
  title: "",
  url: "",
  difficulty: "beginner",
};

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = useMemo(
    () => (params?.id ? String(params.id) : ""),
    [params]
  );

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<Roadmap[]>([]);
  const [pendingDelete, setPendingDelete] = useState<{
    type: "resource" | "week" | "phase" | null;
    phaseNumber?: number;
    weekNumber?: number;
    resourceIndex?: number;
  }>({ type: null });
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [resourceForm, setResourceForm] = useState<Resource>(defaultResource);
  const [editingResourceIndex, setEditingResourceIndex] =
    useState<number | null>(null);
  const [weekForm, setWeekForm] = useState<Partial<Week>>({
    focus: "",
    timeCommitment: "5-8 hours/week",
  });

  useEffect(() => {
    const load = async () => {
      if (!roadmapId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await nlpService.getLearningRoadmap(roadmapId);
        setRoadmap(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không tải được lộ trình");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roadmapId]);

  const handleCustomize = async (payload: any) => {
    if (!roadmapId) return;
    setSaving(true);
    setError(null);
    try {
      if (roadmap) {
        setUndoStack((prev) => [roadmap, ...prev].slice(0, 10));
      }
      const res = await nlpService.customizeRoadmap(roadmapId, payload);
      setRoadmap(res.data);
      return true;
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể cập nhật lộ trình");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [last, ...rest] = undoStack;
    setUndoStack(rest);
    setRoadmap(last);
  };

  const addResource = async () => {
    if (!selectedPhase || !selectedWeek) {
      setError("Chọn phase và tuần trước khi thêm tài nguyên");
      return;
    }
    const action =
      editingResourceIndex === null ? "addResource" : "updateResource";
    const ok = await handleCustomize({
      action,
      phaseNumber: selectedPhase,
      weekNumber: selectedWeek,
      resourceIndex: editingResourceIndex ?? undefined,
      resource: resourceForm,
    });
    if (ok) {
      setResourceForm(defaultResource);
      setEditingResourceIndex(null);
    }
  };

  const confirmDelete = (
    type: "resource" | "week" | "phase",
    opts: { phaseNumber?: number; weekNumber?: number; resourceIndex?: number } = {}
  ) => {
    setPendingDelete({ type, ...opts });
  };

  const performDelete = async () => {
    const { type, phaseNumber, weekNumber, resourceIndex } = pendingDelete;
    if (!type) return;
    setPendingDelete({ type: null });
    if (
      type === "resource" &&
      phaseNumber &&
      weekNumber != null &&
      resourceIndex != null
    ) {
      await handleCustomize({
        action: "removeResource",
        phaseNumber,
        weekNumber,
        resourceIndex,
      });
    } else if (type === "week" && phaseNumber && weekNumber != null) {
      await handleCustomize({
        action: "removeWeek",
        phaseNumber,
        weekNumber,
      });
    } else if (type === "phase" && phaseNumber) {
      await handleCustomize({
        action: "removePhase",
        phaseNumber,
      });
    }
  };

  const addWeek = async () => {
    if (!selectedPhase) {
      setError("Chọn phase trước khi thêm tuần");
      return;
    }
    await handleCustomize({
      action: "addWeek",
      phaseNumber: selectedPhase,
      week: {
        focus: weekForm.focus || "Tuần mới",
        timeCommitment: weekForm.timeCommitment || "5-8 hours/week",
        learningObjectives: weekForm.learningObjectives || [],
        resources: [],
      },
    });
    setWeekForm({ focus: "", timeCommitment: "5-8 hours/week" });
  };

  const startEditResource = (
    phaseNumber: number,
    weekNumber: number,
    resourceIndex: number,
    r: Resource
  ) => {
    setSelectedPhase(phaseNumber);
    setSelectedWeek(weekNumber);
    setEditingResourceIndex(resourceIndex);
    setResourceForm({
      type: r.type,
      title: r.title,
      url: r.url,
      provider: r.provider,
      difficulty: r.difficulty || "beginner",
      duration: r.duration,
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Đang tải lộ trình...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.refresh()}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p>Không tìm thấy lộ trình</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Lộ trình: {roadmap.targetRole}
          </h1>
          <p className="text-sm text-muted-foreground">
            Trạng thái: {roadmap.status} • Tiến độ:{" "}
            {roadmap.progress?.overallProgress ?? 0}%
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Hoàn tác
          </Button>
          <Select
            onValueChange={(v) => setSelectedPhase(Number(v))}
            value={selectedPhase ? String(selectedPhase) : undefined}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chọn phase" />
            </SelectTrigger>
            <SelectContent>
              {roadmap.phases?.map((p) => (
                <SelectItem key={p.phaseNumber} value={String(p.phaseNumber)}>
                  Phase {p.phaseNumber}: {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => setSelectedWeek(Number(v))}
            value={selectedWeek ? String(selectedWeek) : undefined}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chọn tuần" />
            </SelectTrigger>
            <SelectContent>
              {roadmap.phases
                ?.find((p) => p.phaseNumber === selectedPhase)
                ?.weeks?.map((w) => (
                  <SelectItem key={w.weekNumber} value={String(w.weekNumber)}>
                    Tuần {w.weekNumber}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingResourceIndex === null ? "Thêm tài nguyên" : "Cập nhật tài nguyên"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Tiêu đề</Label>
              <Input
                value={resourceForm.title}
                onChange={(e) =>
                  setResourceForm({ ...resourceForm, title: e.target.value })
                }
                placeholder="Ví dụ: React for Beginners"
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={resourceForm.url || ""}
                onChange={(e) =>
                  setResourceForm({ ...resourceForm, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Loại</Label>
              <Select
                value={resourceForm.type}
                onValueChange={(v) => setResourceForm({ ...resourceForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Khóa học</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="article">Bài viết</SelectItem>
                  <SelectItem value="project">Dự án</SelectItem>
                  <SelectItem value="documentation">Tài liệu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Độ khó</Label>
              <Select
                value={resourceForm.difficulty}
                onValueChange={(v) =>
                  setResourceForm({ ...resourceForm, difficulty: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thời lượng (tuỳ chọn)</Label>
              <Input
                value={resourceForm.duration || ""}
                onChange={(e) =>
                  setResourceForm({ ...resourceForm, duration: e.target.value })
                }
                placeholder="10 hours, 2 weeks..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addResource} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingResourceIndex === null
                ? "Thêm tài nguyên vào tuần đã chọn"
                : "Cập nhật tài nguyên"}
            </Button>
            {editingResourceIndex !== null && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingResourceIndex(null);
                  setResourceForm(defaultResource);
                }}
              >
                Hủy chỉnh sửa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thêm tuần</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Tiêu đề/Focus</Label>
              <Input
                value={weekForm.focus || ""}
                onChange={(e) =>
                  setWeekForm({ ...weekForm, focus: e.target.value })
                }
                placeholder="Week focus..."
              />
            </div>
            <div>
              <Label>Thời lượng</Label>
              <Input
                value={weekForm.timeCommitment || ""}
                onChange={(e) =>
                  setWeekForm({ ...weekForm, timeCommitment: e.target.value })
                }
                placeholder="5-8 hours/week"
              />
            </div>
          </div>
          <div>
            <Label>Mục tiêu học (mỗi dòng một mục)</Label>
            <Textarea
              value={(weekForm.learningObjectives || []).join("\n")}
              onChange={(e) =>
                setWeekForm({
                  ...weekForm,
                  learningObjectives: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              rows={3}
            />
          </div>
          <Button onClick={addWeek} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Thêm tuần vào phase đã chọn
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {roadmap.phases?.map((phase) => (
          <Card key={phase.phaseNumber}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>
                  Phase {phase.phaseNumber}: {phase.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Thời lượng: {phase.duration || "N/A"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    confirmDelete("phase", { phaseNumber: phase.phaseNumber })
                  }
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa phase
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(phase.weeks || []).map((week) => (
                <div
                  key={`${phase.phaseNumber}-${week.weekNumber}`}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        Tuần {week.weekNumber}: {week.focus}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {week.timeCommitment}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        confirmDelete("week", {
                          phaseNumber: phase.phaseNumber,
                          weekNumber: week.weekNumber,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tài nguyên</p>
                    {(week.resources || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Chưa có tài nguyên
                      </p>
                    )}
                    <div className="space-y-2">
                      {(week.resources || []).map((r, idx) => (
                        <div
                          key={idx}
                          className="border rounded p-2 flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <p className="font-medium">{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.type} • {r.difficulty || "N/A"}{" "}
                              {r.url ? "• " + r.url : ""}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                startEditResource(
                                  phase.phaseNumber,
                                  week.weekNumber,
                                  idx,
                                  r
                                )
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                confirmDelete("resource", {
                                  phaseNumber: phase.phaseNumber,
                                  weekNumber: week.weekNumber,
                                  resourceIndex: idx,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={pendingDelete.type !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete({ type: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc muốn xoá?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Map,
  Target,
  CheckCircle2,
  Clock,
  PlayCircle,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  Star,
  MessageSquare,
  ArrowLeft,
  Play,
  Pause,
} from "lucide-react";
import { ProgressTracker } from "@/components/ai/ProgressTracker";
import { nlpService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { LearningRoadmap, LearningResource } from "@/lib/api/services/nlp.service";

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const roadmapId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [recommendedResources, setRecommendedResources] = useState<LearningResource[]>([]);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (roadmapId) {
      fetchRoadmap();
      fetchRecommendedResources();
    }
  }, [roadmapId]);

  const fetchRoadmap = async () => {
    setIsLoading(true);
    try {
      const response = await nlpService.getLearningRoadmap(roadmapId);
      setRoadmap(response.data);
    } catch (error) {
      console.error("Failed to fetch roadmap:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lộ trình học tập. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendedResources = async () => {
    try {
      const response = await nlpService.getRecommendedResources(roadmapId);
      setRecommendedResources(response.data);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    }
  };

  const handleToggleWeek = async (weekNumber: number) => {
    if (!roadmap) return;

    try {
      await nlpService.updateRoadmapProgress(roadmapId, {
        weekNumber,
      });
      
      await fetchRoadmap();
      
      toast({
        title: "Cập nhật tiến độ",
        description: `Tiến độ tuần ${weekNumber} đã được cập nhật.`,
      });
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast({
        title: "Cập nhật thất bại",
        description: "Không thể cập nhật tiến độ. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleToggleResource = async (resourceId: string, completed: boolean) => {
    try {
      await nlpService.updateRoadmapProgress(roadmapId, {
        resourceId,
      });
      
      await fetchRoadmap();
      
      toast({
        title: "Cập nhật tài nguyên",
        description: `Trạng thái tài nguyên đã được cập nhật.`,
      });
    } catch (error) {
      console.error("Failed to update resource:", error);
      toast({
        title: "Cập nhật thất bại",
        description: "Không thể cập nhật trạng thái tài nguyên. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      toast({
        title: "Thiếu đánh giá",
        description: "Vui lòng chọn số sao đánh giá.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await nlpService.submitRoadmapFeedback(roadmapId, {
        rating: feedbackRating,
        comment: feedbackComment,
        isHelpful: feedbackRating >= 4,
      });
      
      await fetchRoadmap();
      
      toast({
        title: "Đã gửi đánh giá",
        description: "Cảm ơn bạn đã gửi phản hồi!",
      });
      
      setShowFeedbackDialog(false);
      setFeedbackRating(0);
      setFeedbackComment("");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Gửi đánh giá thất bại",
        description: "Không thể gửi đánh giá. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "article":
        return <FileText className="w-4 h-4" />;
      case "course":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "paused":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!roadmap) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy lộ trình</h3>
                <p className="text-muted-foreground mb-4">
                  Lộ trình bạn yêu cầu không tồn tại hoặc đã bị xoá.
                </p>
                <Button onClick={() => router.push("/roadmaps")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại danh sách lộ trình
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/roadmaps")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách lộ trình
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold">{roadmap.targetRole}</h1>
                <Badge className={getStatusColor(roadmap.status)}>
                  {roadmap.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {roadmap.timeframe} tuần • {roadmap.phases.length} giai đoạn •{" "}
                {roadmap.phases.reduce((acc, phase) => acc + phase.weeks.reduce((wAcc, week) => wAcc + week.resources.length, 0), 0)} tài nguyên
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Gửi đánh giá
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gửi đánh giá về lộ trình</DialogTitle>
                    <DialogDescription>
                      Hãy chia sẻ cảm nhận của bạn để chúng tôi cải thiện trải nghiệm học tập.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Đánh giá</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setFeedbackRating(rating)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                rating <= feedbackRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Nhận xét (không bắt buộc)</Label>
                      <Textarea
                        id="feedback"
                        placeholder="Hãy chia sẻ cảm nhận của bạn..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={feedbackRating === 0 || isSubmittingFeedback}
                      className="w-full"
                    >
                      {isSubmittingFeedback ? "Đang gửi đánh giá..." : "Gửi đánh giá"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracker */}
            <ProgressTracker
              totalWeeks={roadmap.progress.totalWeeks}
              completedWeeks={roadmap.progress.completedWeeks}
              totalResources={roadmap.progress.totalResources}
              completedResources={roadmap.progress.completedResources}
              currentPhase={roadmap.progress.currentPhase}
              phases={roadmap.phases.map((phase) => ({
                phaseNumber: phase.phaseNumber,
                title: phase.title,
                duration: phase.duration,
                completed: phase.phaseNumber < roadmap.progress.currentPhase,
              }))}
            />

            {/* Phases */}
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-blue-600" />
                  Các giai đoạn học tập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {roadmap.phases.map((phase) => (
                    <AccordionItem key={phase.phaseNumber} value={`phase-${phase.phaseNumber}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          {phase.phaseNumber < roadmap.progress.currentPhase ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : phase.phaseNumber === roadmap.progress.currentPhase ? (
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <div className="font-semibold">
                              Giai đoạn {phase.phaseNumber}: {phase.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {phase.duration} • {phase.weeks.reduce((acc, week) => acc + week.resources.length, 0)} tài nguyên
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {/* Objectives */}
                          {phase.objectives && phase.objectives.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Mục tiêu học tập</h4>
                              <ul className="space-y-2">
                                {phase.objectives.map((objective: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span>{objective}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Weeks and Resources */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Tài nguyên học tập theo tuần</h4>
                            <div className="space-y-4">
                              {phase.weeks.map((week) => (
                                <div key={week.weekNumber} className="border rounded-lg p-4">
                                  <div className="font-medium text-sm mb-3">
                                    Tuần {week.weekNumber}: {week.topic}
                                  </div>
                                  <div className="space-y-2">
                                    {week.resources.map((resource) => (
                                      <div
                                        key={resource._id}
                                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={resource.completed || false}
                                          onChange={() =>
                                            handleToggleResource(resource._id || "", resource.completed || false)
                                          }
                                          className="w-4 h-4 rounded"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            {getResourceIcon(resource.type)}
                                            <span className="font-medium text-sm">{resource.title}</span>
                                          </div>
                                          {resource.provider && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {resource.provider}
                                            </p>
                                          )}
                                          {resource.duration && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              <Clock className="w-3 h-3 inline mr-1" />
                                              {resource.duration}
                                            </p>
                                          )}
                                        </div>
                                        {resource.url && (
                                          <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-blue-600 hover:text-blue-700"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Feedback */}
            {roadmap.feedback && (
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Đánh giá của bạn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`w-5 h-5 ${
                            rating <= roadmap.feedback!.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {roadmap.feedback.comment && (
                      <p className="text-sm text-muted-foreground">{roadmap.feedback.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Đã gửi ngày {new Date(roadmap.feedback.submittedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommended Resources */}
            {recommendedResources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tài nguyên gợi ý thêm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendedResources.slice(0, 5).map((resource) => (
                      <a
                        key={resource._id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {getResourceIcon(resource.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{resource.title}</div>
                            {resource.provider && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {resource.provider}
                              </p>
                            )}
                            {resource.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {resource.duration}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/skill-gap-analysis")}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Phân tích khoảng cách kỹ năng
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/job-recommendations")}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Xem việc làm phù hợp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
