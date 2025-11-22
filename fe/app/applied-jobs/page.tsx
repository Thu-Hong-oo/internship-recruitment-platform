"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  MapPin,
  Briefcase,
  FileText,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { api, type Application } from "@/lib/api";
import Link from "next/link";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
> = {
  pending: {
    label: "Đang chờ",
    variant: "secondary",
    icon: Clock,
  },
  reviewing: {
    label: "Đang xem xét",
    variant: "secondary",
    icon: Eye,
  },
  shortlisted: {
    label: "Đã chọn",
    variant: "default",
    icon: CheckCircle2,
  },
  interviewed: {
    label: "Đã phỏng vấn",
    variant: "default",
    icon: CheckCircle2,
  },
  offered: {
    label: "Đã nhận offer",
    variant: "default",
    icon: CheckCircle2,
  },
  accepted: {
    label: "Đã chấp nhận",
    variant: "default",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Đã từ chối",
    variant: "destructive",
    icon: XCircle,
  },
  withdrawn: {
    label: "Đã rút",
    variant: "outline",
    icon: XCircle,
  },
};

export default function AppliedJobsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchApplications();
  }, [router, currentPage, selectedStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.candidateCV.getApplications({
        page: currentPage,
        limit: 10,
        status: selectedStatus || undefined,
      });

      if (response.success && response.data) {
        setApplications(response.data.applications || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      } else {
        setError("Không thể tải danh sách đơn ứng tuyển");
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Thỏa thuận";
    if (min && max) {
      return `${(min / 1000000).toFixed(0)}M - ${(max / 1000000).toFixed(0)}M VND`;
    }
    if (min) return `Từ ${(min / 1000000).toFixed(0)}M VND`;
    if (max) return `Đến ${(max / 1000000).toFixed(0)}M VND`;
    return "Thỏa thuận";
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || {
      label: status,
      variant: "secondary" as const,
      icon: AlertCircle,
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading && applications.length === 0) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tải danh sách đơn ứng tuyển...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Việc làm đã ứng tuyển</h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi các đơn ứng tuyển của bạn
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            variant={selectedStatus === "" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedStatus("");
              setCurrentPage(1);
            }}
          >
            Tất cả ({total})
          </Button>
          {Object.entries(statusConfig).map(([status, config]) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
            >
              {config.label}
            </Button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Chưa có đơn ứng tuyển nào
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedStatus
                  ? "Không có đơn ứng tuyển nào với trạng thái này"
                  : "Bạn chưa ứng tuyển cho công việc nào"}
              </p>
              <Button asChild>
                <Link href="/search">Tìm việc làm</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Job Title and Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          {application.jobId ? (
                            <Link
                              href={`/jobs/${application.jobId._id}`}
                              className="hover:underline"
                            >
                              <h3 className="text-xl font-semibold mb-1">
                                {application.jobId.title}
                              </h3>
                            </Link>
                          ) : (
                            <h3 className="text-xl font-semibold mb-1 text-muted-foreground">
                              Công việc đã bị xóa
                            </h3>
                          )}
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {getStatusBadge(application.status)}
                            {application.jobId?.status && (
                              <Badge variant="outline">
                                {application.jobId.status === "active"
                                  ? "Đang tuyển"
                                  : application.jobId.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Job Details */}
                      {application.jobId && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {application.jobId.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {application.jobId.location}
                            </div>
                          )}
                          {(application.jobId.salaryMin ||
                            application.jobId.salaryMax) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="w-4 h-4" />
                              {formatSalary(
                                application.jobId.salaryMin,
                                application.jobId.salaryMax
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Application Details */}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          <span>Ứng tuyển: {formatDate(application.createdAt)}</span>
                        </div>
                        {application.timeline && application.timeline.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Cập nhật cuối:{" "}
                              {formatDate(
                                application.timeline[application.timeline.length - 1]
                                  .createdAt
                              )}
                            </span>
                          </div>
                        )}
                        {application.resume?.url && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>CV đã gửi</span>
                          </div>
                        )}
                      </div>

                      {/* Timeline Preview */}
                      {application.timeline && application.timeline.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Lịch sử cập nhật:
                          </p>
                          <div className="space-y-1">
                            {application.timeline
                              .slice(-3)
                              .reverse()
                              .map((item, idx) => (
                                <div
                                  key={item._id || idx}
                                  className="text-xs text-muted-foreground"
                                >
                                  • {item.note || item.status} -{" "}
                                  {formatDate(item.createdAt)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {application.jobId && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/jobs/${application.jobId._id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages || loading}
            >
              Sau
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

