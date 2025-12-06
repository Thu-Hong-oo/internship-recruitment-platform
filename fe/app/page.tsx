"use client";

import {
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import Link from "next/link";
import HeroSection from "@/components/layout/hero-section";
import { useEffect, useState } from "react";
import { jobsAPI, JobItem } from "@/lib/api";
import { Row, Col } from "antd";
import { JobFilters as JobFiltersType } from "@/components/jobs/JobFilters";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
interface HomePageProps {
  onSearch?: (keyword: string) => void;
}

export default function HomePage({ onSearch }: HomePageProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<JobFiltersType>({});
  const searchParams = useSearchParams();

  const buildFiltersFromSearchParams = () => {
    if (!searchParams) return undefined as any;
    const get = (k: string) => searchParams.get(k) || undefined;
    const getList = (k: string) => {
      const v = searchParams.get(k);
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
    const filters: any = {
      q: get("q") || get("search"), // Support both 'q' and 'search'
      location: get("location"),
      city: get("city"),
      district: get("district"),
      skills: getList("skills"),
      employer: get("employer"),
      status: get("status") || "active", // Default to active for public
      jobType: get("jobType"),
      level: get("level"),
      workingMode: get("workingMode"),
      employmentType: get("employmentType"), // New
      experienceLevel: get("experienceLevel"), // New
      industry: get("industry"),
      industryCode: get("industryCode"), // New - preferred over industry
      subIndustryCode: get("subIndustryCode"),
      category: get("category"),
      salaryMin: getNumber("salaryMin") || getNumber("minSalary"), // Support both
      salaryMax: getNumber("salaryMax") || getNumber("maxSalary"), // Support both
      minSalary: getNumber("minSalary") || getNumber("salaryMin"), // Support both
      maxSalary: getNumber("maxSalary") || getNumber("salaryMax"), // Support both
      salaryRange: get("salaryRange"),
      createdFrom: get("createdFrom"),
      createdTo: get("createdTo"),
      deadlineFrom: get("deadlineFrom"),
      deadlineTo: get("deadlineTo"),
      isUrgent: get("isUrgent") === "true",
      tags: getList("tags"),
      sortBy: get("sortBy") || "createdAt",
      sortOrder: (get("sortOrder") as any) || "desc",
    };
    // remove undefined keys
    Object.keys(filters).forEach((k) => {
      if (filters[k] === undefined) delete filters[k];
    });
    return Object.keys(filters).length ? filters : undefined;
  };

  const handleSearch = (keyword: string) => {
    if (onSearch) {
      onSearch(keyword);
    } else {
      const qs = new URLSearchParams();
      if (keyword) qs.set("q", keyword);
      router.push(`/search?${qs.toString()}`);
    }
  };

  const handleFiltersChange = (newFilters: JobFiltersType) => {
    setFilters(newFilters);
    // Update URL params
    const qs = new URLSearchParams();
    if (newFilters.q) qs.set("q", newFilters.q);
    if (newFilters.location) qs.set("location", newFilters.location);
    if (newFilters.city) qs.set("city", newFilters.city);
    if (newFilters.district) qs.set("district", newFilters.district);
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

    // Navigate to search page with filters
    const newUrl = qs.toString() ? `/search?${qs.toString()}` : "/search";
    router.push(newUrl);
  };

  const handleFiltersReset = () => {
    setFilters({});
    router.push("/search");
  };
  const fetchJobs = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const res = await jobsAPI.getJobs(
        page,
        limit,
        buildFiltersFromSearchParams()
      );
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

  // Sync filters from URL params on mount and when URL changes
  useEffect(() => {
    const urlFilters = buildFiltersFromSearchParams();
    if (urlFilters) {
      setFilters(urlFilters);
    }
  }, [searchParams]);

  useEffect(() => {
    // re-fetch when URL filters change
    setCurrentPage(1);
    fetchJobs(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when changing page size
    }
    fetchJobs(page, size || pageSize);
  };
  return (
    <PageLayout>
      <HeroSection
        onSearch={handleSearch}
        onFiltersChange={handleFiltersChange}
        filters={filters}
      />

      {/* Main Content */}
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.97_0.02_210)_0%,white_30%)] pb-20">
        <div
          className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.70_0.12_195/.15),transparent_70%)] blur-3xl"
          style={{ animation: "float 20s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute right-[-120px] top-80 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.08_210/.12),transparent_75%)] blur-3xl"
          style={{ animation: "float 25s ease-in-out infinite reverse" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Featured Jobs (from API) */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                      Việc làm từ InternBridge
                    </h2>
                    <p className="text-sm text-slate-600">
                      Khám phá cơ hội nghề nghiệp phù hợp với bạn
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[oklch(0.60_0.12_195)] hover:text-[oklch(0.55_0.12_195)] cursor-pointer transition-all duration-300 group">
                    <span className="text-sm font-semibold">Xem tất cả</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>

                <div>
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
                        Chưa có việc làm để hiển thị.
                      </CardContent>
                    </Card>
                  )}
                  {!loading && !error && jobs.length > 0 && (
                    <>
                      <Row gutter={[20, 20]}>
                        {jobs.map((job) => {
                          const primaryGradient = `linear-gradient(135deg, oklch(0.60 0.12 195) 0%, oklch(0.72 0.08 210) 55%, oklch(0.88 0.03 195) 100%)`;
                          const glassSurfaceGradient = `linear-gradient(140deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 100%)`;
                          const highlightOverlay = `linear-gradient(135deg, oklch(0.60 0.12 195 / 0.08) 0%, transparent 70%)`;
                          const cardAuraGradient = `radial-gradient(circle at top, oklch(0.60 0.12 195 / 0.25) 0%, transparent 65%)`;

                          return (
                            <Col xs={24} sm={12} lg={8} key={job.id}>
                              <div
                                className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_20px_50px_rgba(15,45,95,0.08)] backdrop-blur-xl transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_28px_65px_rgba(15,45,95,0.15)] hover:border-[oklch(0.60_0.12_195/.3)] cursor-pointer h-full"
                                style={{ background: glassSurfaceGradient }}
                                onClick={() => router.push(`/jobs/${job.id}`)}
                              >
                                <span
                                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                                  style={{ background: highlightOverlay }}
                                />
                                <span
                                  className="pointer-events-none absolute -top-32 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
                                  style={{ background: cardAuraGradient }}
                                />

                                <div className="relative">
                                  {/* Top section with logo and badges */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="relative">
                                      <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center overflow-hidden border-2 border-white/60 shadow-lg backdrop-blur-sm">
                                        {job.companyId?.logo?.url ? (
                                          <img
                                            src={job.companyId.logo.url}
                                            alt={job.companyId?.name || "logo"}
                                            className="w-full h-full object-contain p-1"
                                          />
                                        ) : (
                                          <Building2 className="w-6 h-6 text-[oklch(0.60_0.12_195)] transition-colors duration-300 group-hover:text-[oklch(0.55_0.12_195)]" />
                                        )}
                                      </div>
                                      {job.isUrgent && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/50">
                                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      {job.isFeatured && (
                                        <Badge className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white border-none text-xs px-3 py-1.5 shadow-sm font-semibold flex items-center gap-1">
                                          <Sparkles className="w-3 h-3" />
                                          NỔI BẬT
                                        </Badge>
                                      )}
                                      {job.isUrgent && (
                                        <Badge className="bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white border-none text-xs px-3 py-1.5 shadow-sm font-semibold flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3" />
                                          TOP
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Job title and company */}
                                  <div className="mb-4">
                                    <h3 className="font-bold text-slate-900 group-hover:text-[oklch(0.60_0.12_195)] cursor-pointer line-clamp-2 text-base mb-2 transition-colors duration-300">
                                      <Link
                                        href={`/jobs/${job.id}`}
                                        className="hover:underline decoration-2 underline-offset-2"
                                      >
                                        {job.title}
                                      </Link>
                                    </h3>
                                    <p className="text-sm font-medium text-slate-600 line-clamp-1">
                                      {job.companyId?.name || "Nhà tuyển dụng"}
                                    </p>
                                  </div>

                                  {/* Salary and location tags */}
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/60 backdrop-blur-sm transition-all duration-300 group-hover:bg-[oklch(0.60_0.12_195/.08)] group-hover:border-[oklch(0.60_0.12_195/.2)] group-hover:text-[oklch(0.50_0.12_195)]">
                                      <DollarSign className="w-3.5 h-3.5" />
                                      {job.salaryRange || "Thỏa thuận"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/60 backdrop-blur-sm transition-all duration-300 group-hover:bg-[oklch(0.60_0.12_195/.08)] group-hover:border-[oklch(0.60_0.12_195/.2)] group-hover:text-[oklch(0.50_0.12_195)]">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {job.city || "Đang cập nhật"}
                                    </span>
                                  </div>

                                  {/* Bottom section with save button */}
                                  <div className="flex justify-end pt-3 border-t border-slate-200/50">
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <SaveJobButton
                                        jobId={job.id}
                                        variant="ghost"
                                        size="sm"
                                        showText={false}
                                        className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-[oklch(0.60_0.12_195/.1)] hover:border-[oklch(0.60_0.12_195/.3)] transition-all duration-300 hover:scale-110 shadow-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>

                      {/* Pagination */}
                      <div className="mt-10 flex justify-center items-center gap-4">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200/60 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:border-[oklch(0.60_0.12_195/.3)] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-sm"
                        >
                          <svg
                            className="w-5 h-5 text-[oklch(0.60_0.12_195)]"
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

                        <div className="px-6 py-2 rounded-xl bg-white/80 border border-slate-200/60 backdrop-blur-sm shadow-sm">
                          <span className="text-sm font-semibold text-slate-700">
                            Trang {currentPage} / {totalPages}
                          </span>
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200/60 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:border-[oklch(0.60_0.12_195/.3)] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-sm"
                        >
                          <svg
                            className="w-5 h-5 text-[oklch(0.60_0.12_195)]"
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
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              {/* Ads */}
              <div className="space-y-6">
                <div className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow-[0_20px_50px_rgba(15,45,95,0.08)] backdrop-blur-xl transition-all duration-700 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_65px_rgba(15,45,95,0.12)] hover:border-[oklch(0.60_0.12_195/.2)]">
                  <div className="p-4">
                    <img
                      src="/job-recruitment-celebration.png"
                      alt="Job advertisement"
                      className="w-full rounded-2xl"
                    />
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow-[0_20px_50px_rgba(15,45,95,0.08)] backdrop-blur-xl transition-all duration-700 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_65px_rgba(15,45,95,0.12)] hover:border-[oklch(0.60_0.12_195/.2)]">
                  <div className="p-4">
                    <img
                      src="/hr-recruitment-banner.png"
                      alt="HR recruitment"
                      className="w-full rounded-2xl"
                    />
                  </div>
                </div>

                {/* Job Stats */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 shadow-[0_25px_60px_rgba(16,60,120,0.15)] backdrop-blur-xl transition-all duration-700 hover:shadow-[0_30px_70px_rgba(16,60,120,0.2)]">
                  <div
                    className="p-8 text-center text-white relative"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.60 0.12 195) 0%, oklch(0.72 0.08 210) 55%, oklch(0.88 0.03 195) 100%)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.60_0.12_195/.2)_0%,transparent_70%)]" />
                    <div className="relative">
                      <div className="text-5xl font-bold mb-3 drop-shadow-lg">
                        500+
                      </div>
                      <div className="text-base mb-8 opacity-95 font-medium">
                        VIỆC LÀM PHÙ HỢP
                        <br />
                        THU NHẬP CAO TẠI ĐÂY
                      </div>
                      <div className="space-y-3 text-sm mb-8 text-left">
                        <div className="flex items-center">
                          <span className="mr-3 text-xl">✓</span>
                          <span>Nhận việc phù hợp qua email</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-3 text-xl">✓</span>
                          <span>Nhận thông báo nhà tuyển dụng xem hồ sơ</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-3 text-xl">✓</span>
                          <span>Nhận việc làm vip</span>
                        </div>
                      </div>
                      <Button className="bg-white text-[oklch(0.60_0.12_195)] hover:bg-white/95 font-bold w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg rounded-xl py-6 text-base">
                        NHẬN PHÍA NGAY
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
