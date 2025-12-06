"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    return (
      job.jobId.address?.fullAddress ||
      job.jobId.address?.city ||
      "Không xác định"
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          <p className="text-muted-foreground">
            Quản lý và theo dõi những việc làm bạn quan tâm
          </p>
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
                  <p className="text-2xl font-bold text-foreground">{total}</p>
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
            {savedJobs.map((savedJob) => {
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
            })}
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
