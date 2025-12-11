"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployerApplications,
  viewApplicationResume,
  updateApplicationStatus,
  scheduleInterview,
} from "@/lib/jobAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  FileText,
  Mail,
  UserRound,
  Eye,
  X,
  ExternalLink,
  CalendarClock,
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
import EmployerShell from "@/components/layout/EmployerShell";

type Application = {
  _id: string;
  status: string;
  jobId?: {
    _id: string;
    title: string;
    status: string;
  };
  candidateId?: {
    userId?: {
      fullName?: string;
      displayFullName?: string;
      email?: string;
      avatar?: string;
    };
  };
  resume?: {
    url?: string;
  };
  createdAt: string;
};

type InterviewItem = {
  _id?: string;
  scheduledAt?: string;
  type?: string;
  location?: string;
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

export default function EmployerApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageMeta, setPageMeta] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingCV, setLoadingCV] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
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

  const loadApplications = async (
    page = pageMeta.page,
    status = filters.status
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setError("Vui lòng đăng nhập để xem ứng viên");
        return;
      }

      const result = await getEmployerApplications(token, {
        page,
        limit: pageMeta.limit,
        status: status === "all" ? undefined : status,
      });

      if (result.success && result.data) {
        setApplications(result.data.data || []);
        setPageMeta({
          page: result.data.pagination?.page || page,
          limit: result.data.pagination?.limit || pageMeta.limit,
          totalPages: result.data.pagination?.totalPages || 1,
          hasNextPage: result.data.pagination?.hasNextPage || false,
          hasPrevPage: result.data.pagination?.hasPrevPage || false,
        });
      } else {
        setError(
          result.error || result.message || "Không thể tải danh sách ứng viên"
        );
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải danh sách ứng viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications(1, filters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterStatusChange = (value: string) => {
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    loadApplications(1, value);
  };

  const handlePageChange = (direction: "prev" | "next") => {
    const newPage =
      direction === "next" ? pageMeta.page + 1 : pageMeta.page - 1;
    loadApplications(newPage, filters.status);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const handleViewCV = async (application: Application) => {
    try {
      setLoadingCV(true);
      setError(null);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setError("Vui lòng đăng nhập để xem CV");
        return;
      }

      const res = await viewApplicationResume(application._id, token);
      if (res.success && res.url) {
        setPreviewUrl(res.url);
        setShowPreview(true);
      } else {
        if (application.resume?.url) {
          window.open(application.resume.url, "_blank");
        } else {
          setError(res.error || "Không thể xem CV");
        }
      }
    } catch (err: any) {
      if (application.resume?.url) {
        window.open(application.resume.url, "_blank");
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
        await loadApplications(pageMeta.page, filters.status);
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

  const getUpcomingInterview = (application: any): InterviewItem | null => {
    if (!application.interviews || application.interviews.length === 0) return null;
    const now = new Date();
    const future = application.interviews
      .filter((i: InterviewItem) => i.scheduledAt && new Date(i.scheduledAt) >= now)
      .sort(
        (a: InterviewItem, b: InterviewItem) =>
          new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime()
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
          description: 'Nhập JSON hợp lệ, ví dụ: {"room":"A1"}',
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
      toast({ title: "Đã mời phỏng vấn", description: "Lịch đã được lưu." });
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
      loadApplications(pageMeta.page, filters.status);
    } else {
      toast({
        title: "Lỗi",
        description: res.error || "Không thể đặt lịch",
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status] || {
      label: status,
      variant: "secondary" as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderCandidateInfo = (application: Application) => {
    const user = application.candidateId?.userId;
    const displayName =
      user?.displayFullName || user?.fullName || "Ứng viên ẩn danh";

    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar} alt={displayName} />
          <AvatarFallback>
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-1">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            {displayName}
          </div>
          {user?.email && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <EmployerShell active="applications">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách ứng viên...</p>
          </div>
        </div>
      </EmployerShell>
    );
  }

  return (
    <EmployerShell active="applications">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Ứng viên ứng tuyển</h1>
            <p className="text-gray-600">
              Theo dõi tất cả ứng viên đã ứng tuyển vào các tin tuyển dụng của bạn
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <div className="text-sm font-medium">Bộ lọc</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trạng thái:</span>
              <Select value={filters.status} onValueChange={handleFilterStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="reviewing">Đang xem xét</SelectItem>
                  <SelectItem value="shortlisted">Vòng tiếp theo</SelectItem>
                  <SelectItem value="interview">Đã phỏng vấn</SelectItem>
                  <SelectItem value="offer">Đã đề xuất</SelectItem>
                  <SelectItem value="accepted">Đã tuyển</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
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
                    Khi ứng viên nộp hồ sơ vào tin tuyển dụng, thông tin của họ sẽ xuất hiện ở đây.
                  </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/jobs")}>
                  Quay lại quản lý tin tuyển dụng
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Danh sách ứng viên ({applications.length} ứng viên trên trang {pageMeta.page}/
                {pageMeta.totalPages})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ứng viên</TableHead>
                    <TableHead>Công việc</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Tài liệu</TableHead>
                    <TableHead className="w-[200px]">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application._id}>
                      <TableCell>{renderCandidateInfo(application)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{application.jobId?.title || "Tin đã bị xóa"}</div>
                          {application.jobId?._id && (
                            <Button
                              variant="link"
                              className="px-0 h-auto text-sm"
                              onClick={() => router.push(`/jobs/${application.jobId?._id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Xem tin
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const upcoming = getUpcomingInterview(application);
                          if (upcoming && application.status === "interview") {
                            return (
                              <Badge variant="default" className="bg-blue-100 text-blue-700">
                                Đã lên lịch
                              </Badge>
                            );
                          }
                          if (FINAL_STATUSES.includes(application.status || "")) {
                            return renderStatusBadge(application.status || "pending");
                          }
                          return (
                            <Select
                              value={application.status || "pending"}
                              onValueChange={(value) => handleStatusChange(application._id, value)}
                              disabled={updatingStatus === application._id}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue>
                                  {statusConfig[application.status || "pending"]?.label ||
                                    application.status ||
                                    "Chờ duyệt"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS_FOR_SELECT.filter((option) => {
                                  const availableStatuses = getAvailableStatuses(application.status || "pending");
                                  return option.value === application.status || availableStatuses.includes(option.value);
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
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {getUpcomingInterview(application)?.scheduledAt
                            ? formatDateTime(getUpcomingInterview(application)!.scheduledAt!)
                            : formatDateTime(application.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.resume?.url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCV(application)}
                            disabled={loadingCV}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {loadingCV ? "Đang tải..." : "Xem CV"}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Không có tệp</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Dialog
                            open={schedulingFor === application._id}
                            onOpenChange={(open) => setSchedulingFor(open ? application._id : null)}
                          >
                            <DialogTrigger asChild>
                              {(() => {
                                const upcoming = getUpcomingInterview(application);
                                const isFinal = FINAL_STATUSES.includes(application.status || "");
                                if (upcoming) {
                                  return (
                                    <Button variant="outline" size="sm" disabled className="gap-2">
                                      <CalendarClock className="h-4 w-4" />
                                      Đã lên lịch
                                    </Button>
                                  );
                                }
                                if (isFinal) {
                                  return (
                                    <Button variant="outline" size="sm" disabled className="gap-2">
                                      <CalendarClock className="h-4 w-4" />
                                      Đã kết thúc
                                    </Button>
                                  );
                                }
                                return (
                                  <Button variant="outline" size="sm" className="gap-2">
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
                                <Button variant="outline" onClick={() => setSchedulingFor(null)} type="button">
                                  Đóng
                                </Button>
                                <Button onClick={handleScheduleSubmit}>Lưu lịch</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/jobs/${application.jobId?._id ?? ""}/applications`)}
                            disabled={!application.jobId?._id}
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {pageMeta.page} / {pageMeta.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange("prev")}
                    disabled={!pageMeta.hasPrevPage}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange("next")}
                    disabled={!pageMeta.hasNextPage}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
                  <h3 className="text-base font-semibold text-slate-900">Xem trước CV</h3>
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
              <iframe src={previewUrl} title="CV Preview" className="h-full w-full border-0" />
            </div>
            <div className="flex items-center justify-between border-t border-white/40 bg-white/80 px-6 py-4 backdrop-blur-lg">
              <p className="text-xs font-medium text-slate-500">CV của ứng viên đã ứng tuyển</p>
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
    </EmployerShell>
  );
}
