"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import {
  Bookmark,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  Loader2,
  Briefcase,
  Search,
  X,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savedJobService, type SavedJob } from "@/lib/api";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function SavedJobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [uniqueCompanies, setUniqueCompanies] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "salary-high" | "salary-low" | "deadline">("newest");

  useEffect(() => {
    const fetchSavedJobs = async () => {
      // Check authentication
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Cần đăng nhập",
          description: "Vui lòng đăng nhập để xem việc làm đã lưu",
          variant: "destructive",
        });
        router.push("/login?redirect=/jobs/saved-jobs");
        return;
      }

      try {
        setLoading(true);
        const response = await savedJobService.getSavedJobs({ limit: 100 });
        if (response.success && response.data) {
          setSavedJobs(response.data);
          setTotal(response.pagination?.total || response.data.length);
          
          // Calculate unique companies
          const companies = new Set(
            response.data
              .map((item) => item.jobId?.employer?.company?.name)
              .filter(Boolean)
          );
          setUniqueCompanies(companies.size);
        }
      } catch (error: any) {
        console.error("Failed to fetch saved jobs:", error);
        toast({
          title: "Lỗi",
          description: error?.message || "Không thể tải danh sách việc làm đã lưu",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, [router, toast]);

  const handleRemoveSaved = async (savedJobId: string, jobId: string) => {
    try {
      const response = await savedJobService.removeSavedJob(savedJobId);
      if (response.success) {
        setSavedJobs((prev) => prev.filter((job) => job._id !== savedJobId));
        setTotal((prev) => prev - 1);
        toast({
          title: "Đã bỏ lưu",
          description: "Việc làm đã được xóa khỏi danh sách đã lưu",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể bỏ lưu việc làm",
        variant: "destructive",
      });
    }
  };

  const formatSalary = (job: SavedJob) => {
    if (!job.jobId) return "Thỏa thuận";
    const { salaryMin, salaryMax, currency = "VND" } = job.jobId;
    if (salaryMin && salaryMax) {
      const formatNumber = (num: number) => {
        return new Intl.NumberFormat("vi-VN").format(num);
      };
      return `${formatNumber(salaryMin)} - ${formatNumber(salaryMax)} ${currency}`;
    }
    return "Thỏa thuận";
  };

  const formatLocation = (job: SavedJob) => {
    if (!job.jobId) return "Không xác định";
    // Chỉ hiển thị tỉnh/thành phố
    return job.jobId.address?.city || "Không xác định";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter and sort saved jobs
  const filteredJobs = useMemo(() => {
    let filtered = savedJobs;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = savedJobs.filter((savedJob) => {
        const job = savedJob.jobId;
        if (!job) return false;

        const title = job.title?.toLowerCase() || "";
        const companyName = job.employer?.company?.name?.toLowerCase() || "";
        const location = formatLocation(savedJob).toLowerCase();
        const salary = formatSalary(savedJob).toLowerCase();

        return (
          title.includes(query) ||
          companyName.includes(query) ||
          location.includes(query) ||
          salary.includes(query)
        );
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const jobA = a.jobId;
      const jobB = b.jobId;

      switch (sortBy) {
        case "newest":
          // Mới nhất trước (savedAt giảm dần)
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        
        case "oldest":
          // Cũ nhất trước (savedAt tăng dần)
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        
        case "salary-high":
          // Lương cao nhất trước
          const salaryA = jobA?.salaryMax || jobA?.salaryMin || 0;
          const salaryB = jobB?.salaryMax || jobB?.salaryMin || 0;
          return salaryB - salaryA;
        
        case "salary-low":
          // Lương thấp nhất trước
          const salaryALow = jobA?.salaryMin || jobA?.salaryMax || 0;
          const salaryBLow = jobB?.salaryMin || jobB?.salaryMax || 0;
          return salaryALow - salaryBLow;
        
        case "deadline":
          // Deadline sớm nhất trước
          if (!jobA?.deadline && !jobB?.deadline) return 0;
          if (!jobA?.deadline) return 1;
          if (!jobB?.deadline) return -1;
          return new Date(jobA.deadline).getTime() - new Date(jobB.deadline).getTime();
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [savedJobs, searchQuery, sortBy]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Việc làm đã lưu
          </h1>
          <p className="text-muted-foreground mb-4">
            Quản lý và theo dõi những việc làm bạn quan tâm
          </p>

          {/* Search Bar and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên công việc, công ty, địa điểm, mức lương..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[200px] h-12">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới lưu nhất</SelectItem>
                  <SelectItem value="oldest">Lưu cũ nhất</SelectItem>
                  <SelectItem value="salary-high">Lương cao nhất</SelectItem>
                  <SelectItem value="salary-low">Lương thấp nhất</SelectItem>
                  <SelectItem value="deadline">Hạn nộp sớm nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(searchQuery || sortBy !== "newest") && (
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? (
                <>
                  Tìm thấy <strong>{filteredJobs.length}</strong> việc làm phù hợp
                  {filteredJobs.length !== savedJobs.length && (
                    <span> trong {savedJobs.length} việc làm đã lưu</span>
                  )}
                </>
              ) : (
                <>
                  Hiển thị <strong>{filteredJobs.length}</strong> việc làm
                </>
              )}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Bookmark className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tổng số việc làm
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {searchQuery ? filteredJobs.length : total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Công ty</p>
                  <p className="text-2xl font-bold text-foreground">
                    {uniqueCompanies}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Lưu gần nhất</p>
                  <p className="text-2xl font-bold text-foreground">
                    {savedJobs.length > 0
                      ? formatDate(savedJobs[0].savedAt)
                      : "Chưa có"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Jobs List */}
        {savedJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((savedJob) => {
              const job = savedJob.jobId;
              if (!job) return null;

              const companyName =
                job.employer?.company?.name || "Nhà tuyển dụng";
              const companyLogo = job.employer?.company?.logo?.url;

              return (
                <Card
                  key={savedJob._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {companyLogo ? (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={companyLogo}
                                alt={companyName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border">
                              <Building2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                <span>{companyName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{formatLocation(savedJob)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{formatSalary(savedJob)}</span>
                              </div>
                              {job.deadline && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    Hạn: {new Date(job.deadline).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {job.status && (
                                <Badge
                                  variant={
                                    job.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {job.status}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Lưu ngày {formatDate(savedJob.savedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/jobs/${job._id}`}>
                          <Button variant="outline" size="sm">
                            Xem chi tiết
                          </Button>
                        </Link>
                        <SaveJobButton
                          jobId={job._id}
                          variant="outline"
                          size="sm"
                          showText={false}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Không tìm thấy việc làm phù hợp
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Không có việc làm nào khớp với từ khóa "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={handleClearSearch}>
                    Xóa bộ lọc
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Chưa có việc làm nào được lưu
              </h3>
              <p className="text-muted-foreground mb-6">
                Hãy tìm kiếm và lưu những việc làm bạn quan tâm
              </p>
              <Link href="/search">
                <Button>Tìm việc làm ngay</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
