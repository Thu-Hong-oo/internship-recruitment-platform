"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getJobApplications,
  viewApplicationResume,
  updateApplicationStatus,
  scheduleInterview,
  getJobById,
} from "@/lib/jobAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  ArrowLeft,
  ExternalLink,
  UserRound,
  Mail,
  FileText,
  Eye,
  X,
  AlertCircle,
  CalendarClock,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ApplicationItem = {
  _id: string;
  status: string;
  createdAt: string;
  interviews?: InterviewItem[];
  candidateId?: {
    userId?: {
      fullName?: string;
      displayFullName?: string;
      email?: string;
      avatar?: string;
    };
    resume?: {
      current?: {
        url?: string;
        displayName?: string;
      };
    };
  };
};

type InterviewItem = {
  _id: string;
  scheduledAt?: string;
  duration?: number;
  type?: string;
  location?: string;
  interviewer?: string;
  note?: string;
  metadata?: Record<string, any>;
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  reviewing: { label: "Đang xem xét", variant: "default" },
  shortlisted: { label: "Vòng tiếp theo", variant: "default" },
  interview: { label: "Đã phỏng vấn", variant: "default" },
  offer: { label: "Đã đề xuất", variant: "default" },
  accepted: { label: "Đã chấp nhận", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

const STATUS_OPTIONS_FOR_SELECT = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "reviewing", label: "Đang xem xét" },
  { value: "shortlisted", label: "Vòng tiếp theo" },
  { value: "interview", label: "Đã phỏng vấn" },
  { value: "offer", label: "Đã đề xuất" },
  { value: "accepted", label: "Đã tuyển" },
  { value: "rejected", label: "Từ chối" },
];

// Các trạng thái cuối cùng không thể chỉnh sửa
const FINAL_STATUSES = ["accepted", "rejected"];

// Xác định các trạng thái có thể chuyển từ trạng thái hiện tại
const getAvailableStatuses = (currentStatus: string): string[] => {
  switch (currentStatus) {
    case "pending":
      return ["reviewing", "accepted", "rejected"];
    case "reviewing":
      return ["accepted", "rejected"];
    case "shortlisted":
      // Có thể chuyển sang các trạng thái tiếp theo
      return ["interview", "offer", "accepted", "rejected"];
    case "interview":
      return ["offer", "accepted", "rejected"];
    case "offer":
      return ["accepted", "rejected"];
    case "accepted":
    case "rejected":
      // Trạng thái cuối, không thể chuyển
      return [];
    default:
      // Mặc định cho các trạng thái khác
      return ["reviewing", "accepted", "rejected"];
  }
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "reviewing", label: "Đang xem xét" },
  { value: "shortlisted", label: "Đã shortlist" },
  { value: "interview", label: "Đã phỏng vấn" },
  { value: "offer", label: "Đã đề xuất" },
  { value: "accepted", label: "Đã tuyển" },
  { value: "rejected", label: "Từ chối" },
];

export default function JobApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const { toast } = useToast();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [jobTitle, setJobTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: "",
    duration: "",
    type: "online",
    location: "",
    interviewerId: "",
    note: "",
    metadata: "",
  });

  const loadData = async (
    nextPage = page,
    nextStatus = statusFilter
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập");
        return;
      }
      const res = await getJobApplications(jobId, token, {
        status: nextStatus === "all" ? undefined : nextStatus,
        page: nextPage,
        limit,
      });
      if (res.success) {
        setApplications(res.data || []);
        setTotal(res.pagination?.total || 0);
        const totalPagesFromApi =
          (res.pagination as any)?.pages ||
          res.pagination?.totalPages ||
          (res.pagination?.total
            ? Math.max(1, Math.ceil((res.pagination.total || 0) / limit))
            : 1);
        setPages(totalPagesFromApi || 1);
        setPage(res.pagination?.page || nextPage);
      } else {
        setError(res.error || "Không thể tải danh sách ứng viên");
      }
    } catch (e: any) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadData(1, statusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, statusFilter]);

  // Load job title for context
  useEffect(() => {
    const loadJob = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token || !jobId) return;
        const res = await getJobById(jobId, token);
        if (res.success && res.data?.title) {
          setJobTitle(res.data.title);
        }
      } catch (e) {
        // silent fail
      }
    };
    loadJob();
  }, [jobId]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
  };

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status] || {
      label: status || "pending",
      variant: "secondary" as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUpcomingInterview = (app: ApplicationItem) => {
    if (!app.interviews || app.interviews.length === 0) return null;
    const now = new Date();
    const future = app.interviews
      .filter((i) => i.scheduledAt && new Date(i.scheduledAt) >= now)
      .sort(
        (a, b) =>
          new Date(a.scheduledAt || 0).getTime() -
          new Date(b.scheduledAt || 0).getTime()
      );
    return future[0] || null;
  };

  const handleScheduleSubmit = async () => {
    if (!schedulingFor) return;
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleForm.scheduledAt) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn thời gian phỏng vấn",
        variant: "destructive",
      });
      return;
    }

    let parsedMetadata: Record<string, any> | undefined = undefined;
    if (scheduleForm.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(scheduleForm.metadata);
      } catch (e) {
        toast({
          title: "Metadata không hợp lệ",
          description: "Vui lòng nhập JSON hợp lệ (ví dụ: {\"note\":\"...\"})",
          variant: "destructive",
        });
        return;
      }
    }

    const payload = {
      scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
      duration: scheduleForm.duration ? Number(scheduleForm.duration) : undefined,
      type: scheduleForm.type || undefined,
      location: scheduleForm.location || undefined,
      interviewerId: scheduleForm.interviewerId || undefined,
      note: scheduleForm.note || undefined,
      metadata: parsedMetadata,
    };

    const res = await scheduleInterview(schedulingFor, payload, token);
    if (res.success) {
      toast({
        title: "Đã mời phỏng vấn",
        description: "Đã lưu lịch và gửi thông báo",
      });
      setSchedulingFor(null);
      setScheduleForm({
        scheduledAt: "",
        duration: "",
        type: "online",
        location: "",
        interviewerId: "",
        note: "",
        metadata: "",
      });
      loadData(page, statusFilter);
    } else {
      toast({
        title: "Lỗi",
        description: res.error || "Không thể đặt lịch",
        variant: "destructive",
      });
    }
  };

  const renderCandidateInfo = (item: ApplicationItem) => {
    const user = item.candidateId?.userId;
    const displayName =
      user?.displayFullName || user?.fullName || "Ứng viên ẩn danh";

    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-slate-200 shadow-sm">
          <AvatarImage src={user?.avatar} alt={displayName} />
          <AvatarFallback className="bg-linear-to-br from-primary/10 to-primary/5 text-primary font-semibold">
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5 group-hover:text-primary transition-colors">
            <UserRound className="h-4 w-4 text-slate-400" />
            {displayName}
          </div>
          {user?.email && (
            <div className="text-sm text-slate-600 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {user.email}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getResume = (item: ApplicationItem) => {
    return item.candidateId?.resume?.current;
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingCV, setLoadingCV] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleViewCV = async (applicationId: string, resumeUrl?: string) => {
    try {
      setLoadingCV(true);
      setError(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập");
        return;
      }

      const res = await viewApplicationResume(applicationId, token);
      if (res.success && res.url) {
        setPreviewUrl(res.url);
        setShowPreview(true);
      } else if (resumeUrl) {
        window.open(resumeUrl, "_blank");
      } else {
        setError(res.error || "Không thể xem CV");
      }
    } catch (err: any) {
      if (resumeUrl) {
        window.open(resumeUrl, "_blank");
      } else {
        setError(err?.message || "Không thể xem CV");
      }
    } finally {
      setLoadingCV(false);
    }
  };

  const closePreview = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowPreview(false);
    setPreviewUrl(null);
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      setUpdatingStatus(applicationId);
      setError(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập");
        return;
      }

      const res = await updateApplicationStatus(
        applicationId,
        newStatus,
        token
      );

      if (res.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái ứng viên",
        });
        // Refresh data after successful update
        await loadData(page, statusFilter);
      } else {
        const errorMsg = res.error || "Không thể cập nhật trạng thái";
        setError(errorMsg);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Có lỗi xảy ra khi cập nhật trạng thái";
      setError(errorMsg);
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách ứng viên...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              Ứng viên của tin tuyển dụng
            </h1>
            <p className="text-sm text-muted-foreground">
              Xem và quản lý tất cả ứng viên đã ứng tuyển vào tin tuyển dụng này
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-slate-700">Bộ lọc:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Trạng thái:</span>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] border-slate-200 hover:border-primary transition-colors">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              Tổng số ứng viên: <span className="text-primary font-bold">{total}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="max-w-md mx-auto space-y-4">
              <UserRound className="h-12 w-12 mx-auto text-gray-300" />
              <div>
                <p className="text-lg font-medium mb-2">Chưa có ứng viên nào</p>
                <p className="text-sm">
                  Khi ứng viên nộp hồ sơ vào tin tuyển dụng này, thông tin của
                  họ sẽ xuất hiện ở đây.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-linear-to-r from-slate-50 to-white border-b border-slate-200">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Danh sách ứng viên ({applications.length} ứng viên trên trang{" "}
              {page}/{pages})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-slate-50 to-slate-100/50 hover:bg-slate-100/50 border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">Ứng viên</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">Trạng thái</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">Thời gian</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">Tài liệu</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const resume = getResume(app);
                    return (
                      <TableRow 
                        key={app._id}
                        className="border-b border-slate-100 hover:bg-linear-to-r hover:from-blue-50/30 hover:to-white transition-all duration-200 group"
                      >
                        <TableCell className="py-5 px-6">
                          {renderCandidateInfo(app)}
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          {(() => {
                            const upcoming = getUpcomingInterview(app);
                            if (upcoming && app.status === "interview") {
                              return (
                                <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  Đã lên lịch
                                </Badge>
                              );
                            }
                            if (FINAL_STATUSES.includes(app.status || "")) {
                              return renderStatusBadge(app.status || "pending");
                            }
                            return (
                              <Select
                                value={app.status || "pending"}
                                onValueChange={(value) => handleStatusChange(app._id, value)}
                                disabled={updatingStatus === app._id}
                              >
                                <SelectTrigger className="w-[160px] border-slate-200 hover:border-primary transition-colors">
                                  <SelectValue>
                                    {statusConfig[app.status || "pending"]?.label ||
                                      app.status ||
                                      "Chờ duyệt"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS_FOR_SELECT.filter((option) => {
                                    const availableStatuses = getAvailableStatuses(
                                      app.status || "pending"
                                    );
                                    return (
                                      option.value === app.status ||
                                      availableStatuses.includes(option.value)
                                    );
                                  }).map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">
                              {getUpcomingInterview(app)?.scheduledAt
                                ? formatDateTime(getUpcomingInterview(app)!.scheduledAt!)
                                : formatDateTime(app.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          {resume?.url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCV(app._id, resume.url)}
                              disabled={loadingCV}
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {loadingCV ? "Đang tải..." : "Xem CV"}
                            </Button>
                          ) : (
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <FileText className="h-4 w-4 text-slate-300" />
                              Không có tệp
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Dialog
                              open={schedulingFor === app._id}
                              onOpenChange={(open) =>
                                setSchedulingFor(open ? app._id : null)
                              }
                            >
                              <DialogTrigger asChild>
                                {(() => {
                                  const upcoming = getUpcomingInterview(app);
                                  const isFinal = FINAL_STATUSES.includes(app.status || "");
                                  if (upcoming) {
                                    return (
                                      <Button variant="outline" size="sm" disabled className="gap-2 bg-green-50 border-green-200 text-green-700">
                                        <CalendarClock className="h-4 w-4" />
                                        Đã lên lịch
                                      </Button>
                                    );
                                  }
                                  if (isFinal) {
                                    return (
                                      <Button variant="outline" size="sm" disabled className="gap-2 bg-slate-50 border-slate-200 text-slate-500">
                                        <CalendarClock className="h-4 w-4" />
                                        Đã kết thúc
                                      </Button>
                                    );
                                  }
                                  return (
                                    <Button variant="outline" size="sm" className="gap-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200">
                                      <CalendarClock className="h-4 w-4" />
                                      Mời phỏng vấn
                                    </Button>
                                  );
                                })()}
                              </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Mời phỏng vấn</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="scheduledAt">Thời gian</Label>
                                  <Input
                                    id="scheduledAt"
                                    type="datetime-local"
                                    value={scheduleForm.scheduledAt}
                                    onChange={(e) =>
                                      setScheduleForm((prev) => ({
                                        ...prev,
                                        scheduledAt: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="duration">Thời lượng (phút)</Label>
                                  <Input
                                    id="duration"
                                    type="number"
                                    min={0}
                                    value={scheduleForm.duration}
                                    onChange={(e) =>
                                      setScheduleForm((prev) => ({
                                        ...prev,
                                        duration: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="type">Hình thức</Label>
                                  <Select
                                    value={scheduleForm.type}
                                    onValueChange={(val) =>
                                      setScheduleForm((prev) => ({ ...prev, type: val }))
                                    }
                                  >
                                    <SelectTrigger id="type">
                                      <SelectValue placeholder="Chọn hình thức" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="online">Online</SelectItem>
                                      <SelectItem value="onsite">Onsite</SelectItem>
                                      <SelectItem value="phone">Phone</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="location">Địa điểm / Link</Label>
                                  <Input
                                    id="location"
                                    placeholder="Phòng họp / Google Meet link..."
                                    value={scheduleForm.location}
                                    onChange={(e) =>
                                      setScheduleForm((prev) => ({
                                        ...prev,
                                        location: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="interviewerId">Người phỏng vấn (User ID)</Label>
                                  <Input
                                    id="interviewerId"
                                    placeholder="Optional"
                                    value={scheduleForm.interviewerId}
                                    onChange={(e) =>
                                      setScheduleForm((prev) => ({
                                        ...prev,
                                        interviewerId: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="note">Ghi chú gửi ứng viên</Label>
                                  <Textarea
                                    id="note"
                                    rows={3}
                                    value={scheduleForm.note}
                                    onChange={(e) =>
                                      setScheduleForm((prev) => ({
                                        ...prev,
                                        note: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="metadata">
                                    Metadata tùy biến (JSON) — ví dụ: {"{\"room\":\"A1\"}"}
                                  </Label>
                                  <Textarea
                                    id="metadata"
                                    rows={3}
                                    placeholder='{"room":"A1","panel":"Mr A, Ms B"}'
                                    value={scheduleForm.metadata}
                                    onChange={(e) =>
                                      setScheduleForm((prev) => ({
                                        ...prev,
                                        metadata: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <DialogFooter className="mt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setSchedulingFor(null)}
                                  type="button"
                                >
                                  Đóng
                                </Button>
                                <Button onClick={handleScheduleSubmit}>Lưu lịch</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/jobs/${jobId}/applications/${app._id}`
                                )
                              }
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Chi tiết
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {page} / {pages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData(page - 1)}
                    disabled={page <= 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData(page + 1)}
                    disabled={page >= pages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CV Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/90 shadow-[0_40px_90px_rgba(15,45,95,0.18)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/40 bg-white/70 px-6 py-4 backdrop-blur-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Xem trước CV
                  </h3>
                  <p className="text-xs text-slate-500">CV của ứng viên</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={closePreview}
                className="rounded-xl border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-primary hover:text-primary"
              >
                <X className="mr-2 h-4 w-4" />
                Đóng
              </Button>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={previewUrl}
                title="CV Preview"
                className="h-full w-full border-0"
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/40 bg-white/80 px-6 py-4 backdrop-blur-lg">
              <p className="text-xs font-medium text-slate-500">
                CV của ứng viên đã ứng tuyển
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, "_blank")}
                  className="rounded-xl border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-primary hover:text-primary"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở tab mới
                </Button>
                <Button
                  onClick={closePreview}
                  size="sm"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 bg-primary"
                >
                  Xong
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
