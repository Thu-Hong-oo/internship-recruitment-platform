"use client";

import {
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ChevronRight,
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
interface HomePageProps {
  onSearch?: (keyword: string) => void;
}

export default function HomePage({ onSearch }: HomePageProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
    const filters: any = {
      q: get("q"),
      location: get("location"),
      skills: getList("skills"),
      employer: get("employer"),
      status: get("status"),
      jobType: get("jobType"),
      industry: get("industry"),
      category: get("category"),
      salaryMin: get("salaryMin"),
      salaryMax: get("salaryMax"),
      createdFrom: get("createdFrom"),
      createdTo: get("createdTo"),
      deadlineFrom: get("deadlineFrom"),
      deadlineTo: get("deadlineTo"),
      tags: getList("tags"),
      sortBy: get("sortBy"),
      sortOrder: (get("sortOrder") as any) || undefined,
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
      <HeroSection onSearch={handleSearch} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Jobs (from API) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Việc làm tốt nhất
                </h2>
                <div className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer transition-colors duration-200">
                  <span className="text-sm font-medium">Xem tất cả</span>
                  <ChevronRight className="w-4 h-4" />
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
                    <Row gutter={[16, 16]}>
                      {jobs.map((job) => (
                        <Col xs={24} sm={12} lg={8} key={job.id}>
                          <Card
                            className="card-hover border-border h-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/jobs/${job.id}`)}
                          >
                            <CardContent className="p-4">
                              {/* Top section with logo and badges */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                    <img
                                      src={job.companyId?.logo?.url}
                                      alt={job.companyId?.name || "logo"}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  {job.isUrgent && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  {job.isFeatured && (
                                    <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-xs px-2 py-1">
                                      NỔI BẬT
                                    </Badge>
                                  )}
                                  {job.isUrgent && (
                                    <Badge className="bg-green-100 text-green-600 border-green-200 text-xs px-2 py-1">
                                      TOP
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Job title and company */}
                              <div className="mb-3">
                                <h3 className="font-semibold text-gray-900 hover:text-primary cursor-pointer line-clamp-2 text-sm mb-1">
                                  <Link href={`/jobs/${job.id}`}>
                                    {job.title}
                                  </Link>
                                </h3>
                                <p className="text-xs text-gray-600 line-clamp-1">
                                  {job.companyId?.name || "Nhà tuyển dụng"}
                                </p>
                              </div>

                              {/* Salary and location tags */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                  {job.salaryRange || "Thỏa thuận"}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                  {job.fullLocation || "Đang cập nhật"}
                                </span>
                              </div>

                              {/* Bottom section with save button */}
                              <div className="flex justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {/* Pagination */}
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            {/* Ads */}
            <div className="space-y-6">
              <Card className="card-hover">
                <CardContent className="p-4">
                  <img
                    src="/job-recruitment-celebration.png"
                    alt="Job advertisement"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <img
                    src="/hr-recruitment-banner.png"
                    alt="HR recruitment"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>

              {/* Job Stats */}
              <Card className="gradient-hero text-white card-hover">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-sm mb-6 opacity-90">
                    VIỆC LÀM PHÙ HỢP
                    <br />
                    THU NHẬP CAO TẠI ĐÂY
                  </div>
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      <span>Nhận việc phù hợp qua email</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      <span>Nhận thông báo nhà tuyển dụng xem hồ sơ</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      <span>Nhận việc làm vip</span>
                    </div>
                  </div>
                  <Button className="bg-white text-primary hover:bg-white/90 font-semibold w-full transition-colors duration-200">
                    NHẬN PHÍA NGAY
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Gợi ý việc làm phù hợp
            </h2>
            <div className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer transition-colors duration-200">
              <span className="text-sm font-medium">Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                company: "VINFAST",
                jobs: "317",
                description: "Tập đoàn Vingroup - Thành viên VINFAST",
              },
              {
                company: "VNPAY",
                jobs: "48",
                description: "Công ty Cổ phần Giải pháp Thanh toán Việt Nam",
              },
            ].map((company, index) => (
              <Card key={index} className="card-hover border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {company.company}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium">
                          {company.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {company.jobs}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        việc làm
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Industries */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Top ngành nghề nổi bật
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Kinh doanh - Bán hàng",
                jobs: "14,235 việc làm",
                icon: "💼",
              },
              {
                name: "Marketing - PR - Quảng cáo",
                jobs: "5,478 việc làm",
                icon: "📢",
              },
              {
                name: "Chăm sóc khách hàng",
                jobs: "3,823 việc làm",
                icon: "🎧",
              },
              {
                name: "Nhân sự - Hành chính",
                jobs: "2,945 việc làm",
                icon: "👥",
              },
              {
                name: "Công nghệ thông tin",
                jobs: "8,156 việc làm",
                icon: "💻",
              },
              {
                name: "Tài chính - Ngân hàng - Bảo hiểm",
                jobs: "4,267 việc làm",
                icon: "🏦",
              },
              { name: "Bất động sản", jobs: "3,891 việc làm", icon: "🏢" },
              {
                name: "Kế toán - Kiểm toán - Thuế",
                jobs: "5,634 việc làm",
                icon: "📊",
              },
            ].map((industry, index) => (
              <Card
                key={index}
                className="card-hover cursor-pointer border-border"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{industry.icon}</div>
                  <h3 className="font-semibold text-sm mb-2 text-foreground">
                    {industry.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    {industry.jobs}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
