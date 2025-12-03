"use client";

import {
  MapPin,
  Filter,
  Heart,
  Bookmark,
  MessageCircle,
  ChevronRight,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  jobsAPI,
  JobItem,
  industriesAPI,
  Industry,
  skillsAPI,
} from "@/lib/api";
import type { Skill } from "@/lib/api/services/skill.service";

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

  // Filter states
  const [employmentType, setEmploymentType] = useState<string>("");
  const [selectedIndustryCode, setSelectedIndustryCode] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<string>("");
  const [maxSalary, setMaxSalary] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Skills data
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  // Industries data
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

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

  // Load filters from URL params
  useEffect(() => {
    const get = (k: string) => searchParams?.get(k) || "";
    const getList = (k: string) => {
      const v = searchParams?.get(k);
      return v
        ? v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    };

    setEmploymentType(get("employmentType"));
    setSelectedIndustryCode(get("industryCode"));
    setSelectedSkills(getList("skills"));
    setMinSalary(get("minSalary"));
    setMaxSalary(get("maxSalary"));
    const loc = get("location") || get("city");
    setLocation(loc || "Tất cả địa điểm");
    setSortBy(get("sortBy") || "createdAt");
    setSortOrder((get("sortOrder") || "desc") as "asc" | "desc");
  }, [searchParams]);

  // Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoadingIndustries(true);
        const data = await industriesAPI.getRootIndustries();
        setIndustries(data);
      } catch (error) {
        console.error("Failed to fetch industries:", error);
        setIndustries([]);
      } finally {
        setLoadingIndustries(false);
      }
    };
    fetchIndustries();
  }, []);

  // Fetch skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoadingSkills(true);
        const data = await skillsAPI.getAllSkills();
        setSkills(data);
      } catch (error) {
        console.error("Failed to fetch skills:", error);
        setSkills([]);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkills();
  }, []);

  // Search skills
  useEffect(() => {
    if (!skillSearchQuery.trim()) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingSkills(true);
        const data = await skillsAPI.searchSkills(skillSearchQuery.trim());
        setSkills(data);
      } catch (error) {
        console.error("Failed to search skills:", error);
      } finally {
        setLoadingSkills(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [skillSearchQuery]);

  // Build filters from state - map to backend supported filters
  const buildFilters = () => {
    const filters: any = {
      status: "active", // Explicitly set status to active
    };

    const q = searchParams?.get("q");
    if (q) filters.q = q;

    // Location: use city if available, otherwise use location
    if (location && location !== "Tất cả địa điểm") {
      // Check if location is a city name (exact match in locations list)
      const isCity = locations.slice(1).includes(location);
      if (isCity) {
        filters.city = location; // Use city parameter for exact city search
      } else {
        filters.location = location; // Use location for fuzzy search
      }
    }

    // Map employmentType to jobType (backend expects jobType)
    if (employmentType) {
      const employmentTypeMap: Record<string, string> = {
        "full-time": "Fulltime",
        "part-time": "Parttime",
        internship: "Intern",
        remote: "Remote",
        contract: "Freelance",
      };
      const mappedJobType = employmentTypeMap[employmentType];
      if (mappedJobType) {
        filters.jobType = mappedJobType;
      }
    }

    // Industry filters - backend supports industryCode and subIndustryCode
    if (selectedIndustryCode) {
      filters.industryCode = selectedIndustryCode;
    }

    // Skills - backend expects array or comma-separated string
    if (selectedSkills.length > 0) {
      filters.skills = selectedSkills;
    }

    // Salary filters - backend expects salaryMin and salaryMax
    if (minSalary) {
      filters.salaryMin = Number(minSalary);
    }
    if (maxSalary) {
      filters.salaryMax = Number(maxSalary);
    }

    // Sorting - backend supports sortBy and sortOrder
    // Default: newest first (createdAt desc)
    const sortBy = searchParams?.get("sortBy");
    const sortOrder = searchParams?.get("sortOrder");
    if (sortBy) filters.sortBy = sortBy;
    if (sortOrder) filters.sortOrder = sortOrder;

    return filters;
  };

  // Fetch jobs
  const fetchJobs = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const filters = buildFilters();
      const res = await jobsAPI.getJobs(page, limit, filters);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams,
    employmentType,
    selectedIndustryCode,
    selectedSkills,
    minSalary,
    maxSalary,
    location,
    sortBy,
    sortOrder,
  ]);

  // Apply filters - update URL
  const applyFilters = () => {
    const params = new URLSearchParams();

    const q = searchParams?.get("q");
    if (q) params.set("q", q);

    if (location && location !== "Tất cả địa điểm") {
      // Use city if it's an exact city match, otherwise use location
      const isCity = locations.slice(1).includes(location);
      if (isCity) {
        params.set("city", location);
      } else {
        params.set("location", location);
      }
    }
    if (employmentType) params.set("employmentType", employmentType);
    if (selectedIndustryCode) params.set("industryCode", selectedIndustryCode);
    if (selectedSkills.length > 0)
      params.set("skills", selectedSkills.join(","));
    if (minSalary) params.set("minSalary", minSalary);
    if (maxSalary) params.set("maxSalary", maxSalary);
    if (sortBy && sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder && sortOrder !== "desc") params.set("sortOrder", sortOrder);

    router.push(`/search?${params.toString()}`);
  };

  // Reset filters
  const resetFilters = () => {
    setEmploymentType("");
    setSelectedIndustryCode("");
    setSelectedSkills([]);
    setMinSalary("");
    setMaxSalary("");
    setLocation("Tất cả địa điểm");
    setSkillSearchQuery("");
    setSortBy("createdAt");
    setSortOrder("desc");

    const params = new URLSearchParams();
    const q = searchParams?.get("q");
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
  };

  // Toggle skill selection
  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skillName)) {
        return prev.filter((s) => s !== skillName);
      } else {
        return [...prev, skillName];
      }
    });
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card className="border-border sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">
                    Lọc nâng cao
                  </span>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Địa điểm
                  </h3>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {locations.map((loc) => (
                      <option
                        key={loc}
                        value={loc === "Tất cả địa điểm" ? "" : loc}
                      >
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employment Type */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Loại hình công việc
                  </h3>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {employmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sorting */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Sắp xếp
                  </h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm mb-2"
                  >
                    <option value="createdAt">Ngày đăng</option>
                    <option value="title">Tiêu đề</option>
                    <option value="salaryMin">Lương tối thiểu</option>
                    <option value="salaryMax">Lương tối đa</option>
                    <option value="deadline">Hạn nộp hồ sơ</option>
                    <option value="views">Lượt xem</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                  </select>
                </div>

                {/* Industry Code */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Ngành nghề
                  </h3>
                  {loadingIndustries ? (
                    <div className="text-sm text-muted-foreground py-2">
                      Đang tải...
                    </div>
                  ) : (
                    <select
                      value={selectedIndustryCode}
                      onChange={(e) => setSelectedIndustryCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">Tất cả ngành nghề</option>
                      {industries.map((industry) => (
                        <option key={industry.code} value={industry.code}>
                          {industry.name.vi}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Salary Range */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Mức lương (VND)
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Đến"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Skills Multi-select */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Kỹ năng
                  </h3>
                  <div className="relative">
                    <Input
                      placeholder="Tìm kiếm kỹ năng..."
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      className="mb-2 text-sm"
                    />
                    <div className="max-h-40 overflow-y-auto rounded-md border border-border p-2 bg-background">
                      {loadingSkills ? (
                        <div className="text-sm text-muted-foreground py-2">
                          Đang tải...
                        </div>
                      ) : skills.length > 0 ? (
                        <div className="space-y-1">
                          {skills.slice(0, 15).map((skill) => (
                            <label
                              key={skill._id}
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedSkills.includes(skill.name)}
                                onCheckedChange={() => toggleSkill(skill.name)}
                              />
                              <span className="text-sm text-foreground">
                                {skill.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          Không tìm thấy kỹ năng
                        </div>
                      )}
                    </div>
                    {selectedSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs"
                          >
                            {skill}
                            <button
                              onClick={() => toggleSkill(skill)}
                              className="hover:text-primary/80"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply/Reset Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="flex-1"
                  >
                    Đặt lại
                  </Button>
                  <Button onClick={applyFilters} className="flex-1">
                    Áp dụng
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
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
      </div>

      <div className="fixed right-6 bottom-6 flex flex-col gap-3">
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button className="w-12 h-12 rounded-full button-secondary shadow-lg">
          <span className="text-xs font-semibold">Góp ý</span>
        </Button>
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <span className="text-xs font-semibold">Hỗ trợ</span>
        </Button>
      </div>
    </PageLayout>
  );
}
