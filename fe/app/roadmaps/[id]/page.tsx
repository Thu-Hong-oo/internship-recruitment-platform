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
