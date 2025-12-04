"use client";

import { MapPin, Heart, MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/layout";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { jobsAPI, JobItem } from "@/lib/api";
import JobFilters, {
  JobFilters as JobFiltersType,
} from "@/components/jobs/JobFilters";

export default function JobSearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<JobFiltersType>({});

  // Location options
  const locations = [
    "Tất cả địa điểm",
    "Ho Chi Minh",
    "Ha Noi",
    "Da Nang",
    "Can Tho",
    "Hai Phong",
    "An Giang",
    "Ba Ria - Vung Tau",
    "Bac Lieu",
    "Bac Giang",
    "Bac Kan",
    "Bac Ninh",
    "Ben Tre",
    "Binh Dinh",
    "Binh Duong",
    "Binh Phuoc",
    "Binh Thuan",
    "Ca Mau",
    "Cao Bang",
    "Dak Lak",
    "Dak Nong",
    "Dien Bien",
    "Dong Nai",
    "Dong Thap",
    "Gia Lai",
    "Ha Giang",
    "Ha Nam",
    "Ha Tinh",
    "Hai Duong",
    "Hau Giang",
    "Hoa Binh",
    "Hung Yen",
    "Khanh Hoa",
    "Kien Giang",
    "Kon Tum",
    "Lai Chau",
    "Lam Dong",
    "Lang Son",
    "Lao Cai",
    "Long An",
    "Nam Dinh",
    "Nghe An",
    "Ninh Binh",
    "Ninh Thuan",
    "Phu Tho",
    "Phu Yen",
    "Quang Binh",
    "Quang Nam",
    "Quang Ngai",
    "Quang Ninh",
    "Quang Tri",
    "Soc Trang",
    "Son La",
    "Tay Ninh",
    "Thai Binh",
    "Thai Nguyen",
    "Thanh Hoa",
    "Thua Thien Hue",
    "Tien Giang",
    "Tra Vinh",
    "Tuyen Quang",
    "Vinh Long",
    "Vinh Phuc",
    "Yen Bai",
  ];

  const employmentTypes = [
    { value: "", label: "Tất cả loại hình" },
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "internship", label: "Thực tập" },
    { value: "remote", label: "Làm việc từ xa" },
    { value: "contract", label: "Hợp đồng" },
  ];

  // Build filters from URL params (source of truth) -> JobFilters state
  const buildFiltersFromSearchParams = (): JobFiltersType => {
    const get = (k: string) => searchParams?.get(k) || undefined;
    const getList = (k: string) => {
      const v = searchParams?.get(k);
      return v
        ? v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    };
    const getNumber = (k: string) => {
      const v = get(k);
      return v ? Number(v) : undefined;
    };

    const current: JobFiltersType = {
      q: get("q"),
      location: get("location"),
      city: get("city"),
      skills: getList("skills"),
      jobType: get("jobType"),
      level: get("level"),
      workingMode: get("workingMode"),
      industryCode: get("industryCode"),
      subIndustryCode: get("subIndustryCode"),
      salaryMin: getNumber("salaryMin"),
      salaryMax: getNumber("salaryMax"),
      salaryRange: get("salaryRange"),
      createdFrom: get("createdFrom"),
      createdTo: get("createdTo"),
      deadlineFrom: get("deadlineFrom"),
      deadlineTo: get("deadlineTo"),
      isUrgent: get("isUrgent") === "true",
      sortBy: get("sortBy") || "createdAt",
      sortOrder: (get("sortOrder") as "asc" | "desc") || "desc",
    };

    Object.keys(current).forEach((key) => {
      if (current[key as keyof JobFiltersType] === undefined) {
        delete current[key as keyof JobFiltersType];
      }
    });
    return current;
  };

  // Sync filters state from URL
  useEffect(() => {
    const urlFilters = buildFiltersFromSearchParams();
    setFilters(urlFilters);
  }, [searchParams]);

  // Fetch jobs
  const fetchJobs = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const apiFilters = {
        ...buildFiltersFromSearchParams(),
        status: "active",
      };
      const res = await jobsAPI.getJobs(page, limit, apiFilters);
      if (res.success) {
        setJobs(res.data || []);
        setTotalJobs(res.pagination?.total || 0);
        setTotalPages(res.pagination?.pages || 0);
      } else {
        setError("Không thể tải danh sách việc làm");
      }
    } catch (e: any) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Load jobs when filters or page change
  useEffect(() => {
    setCurrentPage(1);
    fetchJobs(1, pageSize);
  }, [searchParams]);

  const handleFiltersChange = (newFilters: JobFiltersType) => {
    setFilters(newFilters);
    const qs = new URLSearchParams();
    if (newFilters.q) qs.set("q", newFilters.q);
    if (newFilters.location) qs.set("location", newFilters.location);
    if (newFilters.city) qs.set("city", newFilters.city);
    if (newFilters.jobType) qs.set("jobType", newFilters.jobType);
    if (newFilters.level) qs.set("level", newFilters.level);
    if (newFilters.workingMode) qs.set("workingMode", newFilters.workingMode);
    if (newFilters.industryCode)
      qs.set("industryCode", newFilters.industryCode);
    if (newFilters.subIndustryCode)
      qs.set("subIndustryCode", newFilters.subIndustryCode);
    if (newFilters.skills && newFilters.skills.length > 0)
      qs.set("skills", newFilters.skills.join(","));
    if (newFilters.salaryMin) qs.set("salaryMin", String(newFilters.salaryMin));
    if (newFilters.salaryMax) qs.set("salaryMax", String(newFilters.salaryMax));
    if (newFilters.salaryRange) qs.set("salaryRange", newFilters.salaryRange);
    if (newFilters.createdFrom) qs.set("createdFrom", newFilters.createdFrom);
    if (newFilters.createdTo) qs.set("createdTo", newFilters.createdTo);
    if (newFilters.deadlineFrom)
      qs.set("deadlineFrom", newFilters.deadlineFrom);
    if (newFilters.deadlineTo) qs.set("deadlineTo", newFilters.deadlineTo);
    if (newFilters.isUrgent) qs.set("isUrgent", "true");
    if (newFilters.sortBy) qs.set("sortBy", newFilters.sortBy);
    if (newFilters.sortOrder) qs.set("sortOrder", newFilters.sortOrder);

    const newUrl = qs.toString() ? `/search?${qs.toString()}` : "/search";
    router.push(newUrl);
  };

  const handleFiltersReset = () => {
    setFilters({});
    router.push("/search");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchJobs(page, pageSize);
  };

  const q = searchParams?.get("q") || "";

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span
            className="text-primary hover:text-primary/80 cursor-pointer"
            onClick={() => router.push("/")}
          >
            Trang chủ
          </span>
          <ChevronRight className="w-4 h-4" />
          <span>Tìm kiếm việc làm</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 text-foreground">
            {q ? `Kết quả tìm kiếm cho "${q}"` : "Tìm kiếm việc làm"}
          </h1>
          <div className="bg-primary/10 text-primary p-4 rounded-lg border border-primary/20">
            {loading && <span>Đang tải kết quả...</span>}
            {!loading && error && (
              <span className="text-destructive">{error}</span>
            )}
            {!loading && !error && (
              <>
                Có <strong>{totalJobs}</strong> việc làm phù hợp
                {q && (
                  <>
                    {" "}
                    cho từ khóa <strong>{q}</strong>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Job Filters */}
        <div className="mb-6">
          <JobFilters
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
        </div>

        {/* Main Content */}
        <div>
          <div className="space-y-4">
            {loading && (
              <Card className="border-border">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Đang tải việc làm...
                </CardContent>
              </Card>
            )}
            {error && !loading && (
              <Card className="border-destructive">
                <CardContent className="p-6 text-sm text-destructive">
                  {error}
                </CardContent>
              </Card>
            )}
            {!loading && !error && jobs.length === 0 && (
              <Card className="border-border">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Không có việc làm phù hợp.
                </CardContent>
              </Card>
            )}
            {!loading &&
              !error &&
              jobs.map((job) => {
                const companyName = job.companyId?.name || "Nhà tuyển dụng";
                const logoUrl = (job.companyId as any)?.logo?.url;
                const jobLocation =
                  (job as any)?.fullLocation ||
                  (job as any)?.location?.city ||
                  "Đang cập nhật";

                // Safe salary extraction
                let salary = "Thỏa thuận";
                if ((job as any)?.salaryRange) {
                  salary = (job as any).salaryRange;
                } else if ((job as any)?.internship?.salary?.amount) {
                  const internship = (job as any).internship;
                  const amount = internship.salary.amount.toLocaleString();
                  const period = internship.salary.period || "";
                  salary = `${amount} ${period}`.trim();
                }
                return (
                  <Card
                    key={job.id}
                    className="card-hover border-border cursor-pointer"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border flex-shrink-0">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={companyName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground px-1 text-center">
                              {companyName.slice(0, 8)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-primary hover:text-primary/80 cursor-pointer">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                {salary}
                              </Badge>
                              <Heart className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-destructive transition-colors duration-200" />
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2 font-medium">
                            {companyName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {jobLocation}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages} trang
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating actions */}
      {/* <div className="fixed right-6 bottom-6 flex flex-col gap-3">
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button className="w-12 h-12 rounded-full button-secondary shadow-lg">
          <span className="text-xs font-semibold">Góp ý</span>
        </Button>
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <span className="text-xs font-semibold">Hỗ trợ</span>
        </Button>
      </div> */}
    </PageLayout>
  );
}
