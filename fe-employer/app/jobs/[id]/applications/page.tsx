"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJobApplications, viewApplicationResume } from "@/lib/jobAPI";
import { getToken } from "@/lib/userStorage";
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
import { Users, ArrowLeft, ExternalLink } from "lucide-react";

type ApplicationItem = {
  _id: string;
  status: string;
  createdAt: string;
  candidateId?: {
    userId?: {
      fullName?: string;
      email?: string;
    };
    resume?: {
      current?: {
        url?: string;
        displayName?: string;
      };
    };
  };
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "shortlisted", label: "Đã shortlist" },
  { value: "interviewed", label: "Đã phỏng vấn" },
  { value: "hired", label: "Đã tuyển" },
  { value: "rejected", label: "Từ chối" },
];

export default function JobApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const loadData = async (
    nextPage = page,
    nextStatus = statusFilter
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
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

  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
  };

  const getCandidateName = (item: ApplicationItem) => {
    return (
      item.candidateId?.userId?.fullName ||
      item.candidateId?.userId?.email ||
      "Ứng viên"
    );
  };

  const getResume = (item: ApplicationItem) => {
    return item.candidateId?.resume?.current;
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingCV, setLoadingCV] = useState(false);

  const handleViewCV = async (applicationId: string, resumeUrl?: string) => {
    try {
      setLoadingCV(true);
      setError(null);
      const token = getToken();
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Ứng viên của tin tuyển dụng
        </h1>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Trạng thái:</span>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
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
          <div className="text-sm text-gray-600">Tổng số ứng viên: {total}</div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 mb-4">
          <CardContent className="p-4 text-red-600 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ứng viên</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-600">
              Đang tải...
            </div>
          ) : applications.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-600">
              Chưa có ứng viên nào.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ứng viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày ứng tuyển</TableHead>
                    <TableHead>Hồ sơ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const resume = getResume(app);
                    return (
                      <TableRow key={app._id}>
                        <TableCell className="font-medium">
                          {getCandidateName(app)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {app.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(app.createdAt)}
                        </TableCell>
                        <TableCell>
                          {resume?.url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600"
                              onClick={() => handleViewCV(app._id, resume.url)}
                              disabled={loadingCV}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {loadingCV ? "Đang tải..." : "CV"}
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Không có CV
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {pages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <div>
                    Trang {page}/{pages}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* CV Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/90 shadow-[0_40px_90px_rgba(15,45,95,0.18)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/40 bg-white/70 px-6 py-4 backdrop-blur-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                  <Users className="h-5 w-5" />
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
                <ExternalLink className="mr-2 h-4 w-4" />
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
          </div>
        </div>
      )}
    </div>
  );
}
