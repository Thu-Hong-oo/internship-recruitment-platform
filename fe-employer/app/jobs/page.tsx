"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyJobs,
  deleteJob,
  submitJobForReview,
  getJobApplications,
  type JobResponse,
} from "@/lib/jobAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Send,
  Users,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Filter,
  ChevronDown,
  BarChart3,
  Briefcase,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmployerShell from "@/components/layout/EmployerShell";
import { industryService } from "@/lib/industryAPI";

type Job = {
  _id: string;
  title: string;
  description: string;
  industryCode?: string;
  industry?: string;
  category?: string;
  status: "draft" | "pending" | "approved" | "rejected" | "active" | "closed";
  location: string;
  salary: string;
  positions: number;
  deadline: string;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  applicationsCount?: number;
};

export default function JobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [submitJobId, setSubmitJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [moderationResult, setModerationResult] = useState<{
    type: "approved" | "rejected" | "review";
    message: string;
    reviewReasons?: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    reasons?: string[];
    flags?: string[];
  } | null>(null);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    industry: "all",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<
    { code: string; label: string }[]
  >([]);

  const formatIndustryLabel = (codeOrName?: string) => {
    if (!codeOrName) return "";
    return codeOrName
      .toString()
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const loadJobs = async (page = currentPage, newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập");
        return;
      }

      const result = await getMyJobs(token, {
        page,
        limit: pageSize,
        status: newFilters.status === "all" ? undefined : newFilters.status,
        industry:
          newFilters.industry === "all" ? undefined : newFilters.industry,
        sortBy: newFilters.sortBy,
        sortOrder: newFilters.sortOrder,
      });

      if (result.success) {
        const fetched = (result.data || []) as Job[];

        // Fallback filter by industry on FE (phòng trường hợp backend chưa hỗ trợ)
        const appliedIndustry =
          newFilters.industry === "all" ? null : newFilters.industry;
        const filteredByIndustry = appliedIndustry
          ? fetched.filter((j) => {
              const code = j.industryCode || j.industry || j.category;
              return code === appliedIndustry;
            })
          : fetched;

        setAllJobs(fetched);
        setJobs(filteredByIndustry);
        // Nếu chưa có options (hoặc rỗng), giữ nguyên; industries sẽ được load từ API riêng.

        // Ưu tiên lấy tổng số job từ pagination hoặc statistics nếu có
        const totalFromResponse =
          result.pagination?.total ??
          result.statistics?.total ??
          result.total ??
          fetched.length ??
          0;

        const totalAfterFilter = appliedIndustry
          ? filteredByIndustry.length
          : totalFromResponse;

        setTotalJobs(totalAfterFilter);
        setCurrentPage(result.pagination?.page || page);
        setTotalPages(
          result.pagination?.totalPages ||
            Math.max(1, Math.ceil(totalAfterFilter / pageSize))
        );
        setHasNextPage(!!result.pagination?.hasNextPage);
        setHasPrevPage(!!result.pagination?.hasPrevPage);
      } else {
        setError(result.error || "Không thể tải danh sách công việc");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadJobs(1, newFilters);
  };

  const handlePageChange = (page: number) => {
    loadJobs(page, filters);
  };

  // Load industry options from API (root industries)
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const list = await industryService.getRootIndustries();
        if (list && list.length > 0) {
          setIndustryOptions(
            list.map((it) => ({
              code: it.code,
              label:
                it.name?.vi ||
                it.name?.en ||
                formatIndustryLabel(it.code) ||
                it.code,
            }))
          );
        }
      } catch (e) {
        // silent fail
      }
    };
    loadIndustries();
  }, []);

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;

    try {
      setActionLoading(deleteJobId);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const result = await deleteJob(deleteJobId, token);
      if (result.success) {
        setJobs(jobs.filter((job) => job._id !== deleteJobId));
        setTotalJobs(totalJobs - 1);
        setDeleteJobId(null);
      } else {
        setError(result.error || "Không thể xóa công việc");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi xóa công việc");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitForReview = async () => {
    if (!submitJobId) return;

    try {
      setActionLoading(submitJobId);
      setError(null);
      setModerationResult(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const result = (await submitJobForReview(
        submitJobId,
        token,
        "Please review this job posting for approval",
        false
      )) as JobResponse;

      if (result.success) {
        // Auto-approved
        if (result.autoApproved) {
          setModerationResult({
            type: "approved",
            message:
              result.message || "Job đã được tự động duyệt và đăng thành công",
          });
          setJobs(
            jobs.map((job) =>
              job._id === submitJobId
                ? { ...job, status: "active" as const }
                : job
            )
          );
        }
        // Manual review required
        else if (result.requiresReview) {
          setModerationResult({
            type: "review",
            message:
              result.message || "Đã gửi duyệt. Vui lòng chờ admin phê duyệt",
            reviewReasons: result.reviewReasons || [],
            reasons: result.warnings || [],
          });
          setJobs(
            jobs.map((job) =>
              job._id === submitJobId
                ? { ...job, status: "pending" as const }
                : job
            )
          );
        }
        // Default: pending
        else {
          setJobs(
            jobs.map((job) =>
              job._id === submitJobId
                ? { ...job, status: "pending" as const }
                : job
            )
          );
        }
        setSubmitJobId(null);
      } else {
        // Auto-rejected
        if (result.autoRejected) {
          setModerationResult({
            type: "rejected",
            message:
              result.message ||
              "Job không được duyệt do chứa nội dung không phù hợp",
            reasons: result.reasons || [],
            flags: result.flags || [],
          });
          setJobs(
            jobs.map((job) =>
              job._id === submitJobId
                ? { ...job, status: "rejected" as const }
                : job
            )
          );
        } else {
          setError(
            result.error || result.message || "Không thể gửi duyệt công việc"
          );
        }
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi gửi duyệt công việc");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: Job["status"]) => {
    const statusConfig = {
      draft: { label: "Bản nháp", variant: "secondary" as const },
      pending: { label: "Chờ duyệt", variant: "default" as const },
      approved: { label: "Đã duyệt", variant: "default" as const },
      rejected: { label: "Từ chối", variant: "destructive" as const },
      active: { label: "Đang hoạt động", variant: "default" as const },
      closed: { label: "Đã đóng", variant: "secondary" as const },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <EmployerShell active="jobs">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách công việc...</p>
          </div>
        </div>
      </EmployerShell>
    );
  }

  return (
    <EmployerShell active="jobs">
      <div className="space-y-2 relative">
          {/* Top Row: Action Buttons */}
          <div className="flex items-center justify-end md:gap-3 mb-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/analytics")}
                  className="shadow-md hover:shadow-lg transition-all duration-200 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/40 hover:scale-105"
                  size="default"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Thống kê</span>
                  <span className="sm:hidden">TK</span>
                </Button>
                <Button
                  onClick={() => router.push("/jobs/create-job")}
                  className="shadow-md hover:shadow-lg transition-all duration-200 bg-primary hover:bg-primary/90 text-white hover:scale-105"
                  size="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tạo tin mới</span>
                  <span className="sm:hidden">Tạo mới</span>
                </Button>
              </div>
        {/* Sticky Header: Filters */}
        <div className="sticky top-[64px] z-50 mb-6 bg-slate-50 -mx-6 px-6 py-2 shadow-sm">
          <Card className="rounded-lg border shadow-sm bg-white">
            <CardContent className="p-4">
              {/* Bottom Row: Filters */}
              <div className="flex flex-wrap gap-3 md:gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-slate-700">Bộ lọc:</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Trạng thái:</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      handleFilterChange("status", value)
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="approved">Đã duyệt</SelectItem>
                      <SelectItem value="rejected">Từ chối</SelectItem>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="closed">Đã đóng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Ngành:</label>
                  <Select
                    value={filters.industry}
                    onValueChange={(value) =>
                      handleFilterChange("industry", value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {industryOptions.map((opt) => (
                        <SelectItem key={opt.code} value={opt.code}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Sắp xếp theo:</label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      handleFilterChange("sortBy", value)
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Ngày tạo</SelectItem>
                      <SelectItem value="updatedAt">Ngày cập nhật</SelectItem>
                      <SelectItem value="title">Tiêu đề</SelectItem>
                      <SelectItem value="deadline">Hạn nộp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Thứ tự:</label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) =>
                      handleFilterChange("sortOrder", value)
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Giảm dần</SelectItem>
                      <SelectItem value="asc">Tăng dần</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Chưa có tin tuyển dụng nào
                </h3>
                <p className="text-sm">
                  Hãy tạo tin tuyển dụng đầu tiên của bạn
                </p>
              </div>
              <Button onClick={() => router.push("/jobs/create-job")}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo tin đầu tiên
              </Button>
            </CardContent>
          </Card>
         ) : (
           <Card className="overflow-hidden border-0 shadow-lg">
             <CardHeader className="bg-linear-to-r from-slate-50 to-white border-b border-slate-200">
               <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Briefcase className="h-5 w-5 text-primary" />
                 Tin tuyển dụng ({totalJobs} tin)
                 {filters.status !== "all" && (
                   <span className="text-sm font-normal text-slate-500 ml-2">
                     - Trạng thái: {filters.status}
                   </span>
                 )}
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow className="bg-linear-to-r from-slate-50 to-slate-100/50 hover:bg-slate-100/50 border-b border-slate-200">
                       <TableHead className="font-semibold text-slate-700 py-4 px-6">Tiêu đề</TableHead>
                       <TableHead className="font-semibold text-slate-700 py-4 px-6">Trạng thái</TableHead>
                       <TableHead className="font-semibold text-slate-700 py-4 px-6">Hạn nộp</TableHead>
                       <TableHead className="font-semibold text-slate-700 py-4 px-6 text-right">Thao tác</TableHead>
                       <TableHead className="w-[50px]"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {jobs.map((job, index) => (
                       <TableRow 
                         key={job._id}
                         className="border-b border-slate-100 hover:bg-linear-to-r hover:from-blue-50/30 hover:to-white transition-all duration-200 group"
                       >
                         <TableCell className="py-5 px-6">
                           <div className="space-y-2">
                             <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                               {job.title}
                             </div>
                             <div className="text-sm text-slate-600 line-clamp-2 max-w-2xl">
                               {job.description}
                             </div>
                             <div className="flex items-center gap-3">
                               <div className="flex items-center gap-1.5">
                                 <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                 <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                   {formatIndustryLabel(
                                     job.industry || job.category || job.industryCode
                                   ) || "Chưa phân loại"}
                                 </span>
                               </div>
                             </div>
                             <div className="flex flex-wrap gap-1.5 mt-2">
                               {job.skills.slice(0, 3).map((skill) => (
                                 <Badge
                                   key={skill}
                                   variant="outline"
                                   className="text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                                 >
                                   {skill}
                                 </Badge>
                               ))}
                               {job.skills.length > 3 && (
                                 <Badge 
                                   variant="outline" 
                                   className="text-xs bg-slate-50 border-slate-300 text-slate-600 font-medium"
                                 >
                                   +{job.skills.length - 3}
                                 </Badge>
                               )}
                             </div>
                           </div>
                         </TableCell>
                         <TableCell className="py-5 px-6">
                           {getStatusBadge(job.status)}
                         </TableCell>

                         <TableCell className="py-5 px-6">
                           <div className="flex items-center gap-2">
                             <Calendar className="h-4 w-4 text-slate-400" />
                             <span className="text-sm font-medium text-slate-700">
                               {formatDate(job.deadline)}
                             </span>
                           </div>
                         </TableCell>

                       <TableCell className="py-5 px-6">
                         <div className="flex items-center justify-end gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => router.push(`/jobs/${job._id}`)}
                             title="Xem chi tiết"
                             className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           {job.status === "active" && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() =>
                                 router.push(`/jobs/${job._id}/applications`)
                               }
                               title="Xem ứng viên"
                               className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200"
                             >
                               <Users className="h-4 w-4" />
                             </Button>
                           )}
                           {job.status !== "pending" && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() =>
                                 router.push(`/jobs/${job._id}/edit`)
                               }
                               title="Chỉnh sửa"
                               className="hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all duration-200"
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                           )}
                           {job.status === "draft" && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setSubmitJobId(job._id)}
                               disabled={actionLoading === job._id}
                               title="Gửi duyệt"
                               className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
                             >
                               {actionLoading === job._id ? (
                                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                               ) : (
                                 <Send className="h-4 w-4" />
                               )}
                             </Button>
                           )}
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 title="Thêm tùy chọn"
                                 className="hover:bg-slate-100 transition-colors"
                               >
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="w-48">
                               <DropdownMenuItem
                                 onClick={() => router.push(`/jobs/${job._id}`)}
                                 className="cursor-pointer"
                               >
                                 <Eye className="h-4 w-4 mr-2" />
                                 Xem chi tiết
                               </DropdownMenuItem>
                               {job.status === "draft" && (
                                 <DropdownMenuItem
                                   onClick={() =>
                                     router.push(`/jobs/${job._id}/edit`)
                                   }
                                   className="cursor-pointer"
                                 >
                                   <Edit className="h-4 w-4 mr-2" />
                                   Chỉnh sửa
                                 </DropdownMenuItem>
                               )}
                               <DropdownMenuItem
                                 onClick={() =>
                                   router.push(`/jobs/${job._id}/applications`)
                                 }
                                 className="cursor-pointer"
                               >
                                 <Users className="h-4 w-4 mr-2" />
                                 Xem ứng viên
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 onClick={() => setDeleteJobId(job._id)}
                                 className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50"
                               >
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Xóa
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>
                       </TableCell>
                       <TableCell></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
               </div>

              {/* Pagination */}
              {totalJobs > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
                    {Math.min(currentPage * pageSize, totalJobs)} trong tổng số{" "}
                    {totalJobs} tin
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, idx) => {
                        const page = idx + 1;
                        const isActive = page === currentPage;
                        return (
                          <Button
                            key={page}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className={
                              isActive
                                ? "bg-primary text-white"
                                : "text-gray-700"
                            }
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteJobId}
          onOpenChange={() => setDeleteJobId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa tin tuyển dụng này? Hành động này
                không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteJob}
                disabled={!!actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading === deleteJobId ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Submit for Review Confirmation Dialog */}
        <AlertDialog
          open={!!submitJobId}
          onOpenChange={() => setSubmitJobId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Gửi duyệt</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn gửi tin tuyển dụng này để duyệt? Sau khi
                gửi, bạn sẽ không thể chỉnh sửa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitForReview}
                disabled={!!actionLoading}
              >
                {actionLoading === submitJobId ? "Đang gửi..." : "Gửi duyệt"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Moderation Result Dialog */}
        <AlertDialog
          open={!!moderationResult}
          onOpenChange={() => setModerationResult(null)}
        >
          <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {moderationResult?.type === "approved" &&
                  "✅ Đã duyệt thành công"}
                {moderationResult?.type === "rejected" && "❌ Không được duyệt"}
                {moderationResult?.type === "review" && "⚠️ Cần xem xét"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                {moderationResult?.message}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Review Reasons */}
            {moderationResult?.type === "review" &&
              moderationResult.reviewReasons &&
              moderationResult.reviewReasons.length > 0 && (
                <div className="my-4">
                  <h4 className="font-semibold mb-3 text-sm">
                    Các vấn đề cần lưu ý:
                  </h4>
                  <div className="space-y-2">
                    {moderationResult.reviewReasons.map((reason, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          reason.severity === "high"
                            ? "bg-red-50 border-red-200"
                            : reason.severity === "medium"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">
                            {reason.severity === "high" && "🔴"}
                            {reason.severity === "medium" && "🟠"}
                            {reason.severity === "low" && "🟡"}
                          </span>
                          <p className="text-sm text-gray-700">
                            {reason.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Rejection Reasons */}
            {moderationResult?.type === "rejected" &&
              moderationResult.reasons &&
              moderationResult.reasons.length > 0 && (
                <div className="my-4">
                  <h4 className="font-semibold mb-3 text-sm text-red-600">
                    Lý do từ chối:
                  </h4>
                  <div className="space-y-2">
                    {moderationResult.reasons.map((reason, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-red-50 border border-red-200"
                      >
                        <p className="text-sm text-red-700">{reason}</p>
                      </div>
                    ))}
                  </div>
                  {moderationResult.flags &&
                    moderationResult.flags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">
                          Flags: {moderationResult.flags.join(", ")}
                        </p>
                      </div>
                    )}
                </div>
              )}

            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setModerationResult(null)}
                className={
                  moderationResult?.type === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : moderationResult?.type === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                Đã hiểu
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </EmployerShell>
  );
}
