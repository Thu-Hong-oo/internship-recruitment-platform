"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEmployerApplications } from "@/lib/jobAPI";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  AlertCircle,
  FileText,
  Mail,
  UserRound,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";

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

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  reviewed: { label: "Đã xem", variant: "default" },
  shortlisted: { label: "Vòng tiếp theo", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
  hired: { label: "Đã tuyển", variant: "default" },
};

export default function EmployerApplicationsPage() {
  const router = useRouter();
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
          result.error ||
            result.message ||
            "Không thể tải danh sách ứng viên"
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

  const handleStatusChange = (value: string) => {
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

      // Try to get CV via API endpoint for employer viewing candidate resume
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const url = `${API_BASE_URL}/employers/applications/${application._id}/resume/view`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Fallback to direct URL if API endpoint doesn't exist
        if (application.resume?.url) {
          window.open(application.resume.url, "_blank");
          return;
        }
        throw new Error("Không thể tải CV");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
      setShowPreview(true);
    } catch (err: any) {
      // Fallback to direct URL
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
        <div>
          <h1 className="text-2xl font-semibold mb-2">Ứng viên ứng tuyển</h1>
          <p className="text-gray-600">
            Theo dõi tất cả ứng viên đã ứng tuyển vào các tin tuyển dụng của bạn
          </p>
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

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="text-sm font-medium">Bộ lọc</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trạng thái:</span>
            <Select
              value={filters.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="reviewed">Đã xem</SelectItem>
                <SelectItem value="shortlisted">Vòng tiếp theo</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="hired">Đã tuyển</SelectItem>
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
                <p className="text-lg font-medium mb-2">
                  Chưa có ứng viên nào
                </p>
                <p className="text-sm">
                  Khi ứng viên nộp hồ sơ vào tin tuyển dụng, thông tin của họ sẽ
                  xuất hiện ở đây.
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
              Danh sách ứng viên ({applications.length} ứng viên trên trang{" "}
              {pageMeta.page}/{pageMeta.totalPages})
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
                  <TableHead className="w-[120px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell>{renderCandidateInfo(application)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {application.jobId?.title || "Tin đã bị xóa"}
                        </div>
                        {application.jobId?._id && (
                          <Button
                            variant="link"
                            className="px-0 h-auto text-sm"
                            onClick={() =>
                              router.push(`/jobs/${application.jobId?._id}`)
                            }
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Xem tin
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(application.createdAt)}
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
                        <span className="text-sm text-muted-foreground">
                          Không có tệp
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/jobs/${application.jobId?._id ?? ""}/applications`
                          )
                        }
                        disabled={!application.jobId?._id}
                      >
                        Chi tiết
                      </Button>
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
                  <p className="text-xs text-slate-500">
                    CV của ứng viên
                  </p>
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


